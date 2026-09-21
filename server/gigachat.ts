import https from 'https'
import fs from 'fs'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const caPath = join(__dirname, 'certs', 'russian_trusted_ca.pem')
const ca = fs.existsSync(caPath) ? fs.readFileSync(caPath) : undefined
const verifyTls = process.env.GIGACHAT_TLS_VERIFY !== '0'
const agent = new https.Agent({ ca, rejectUnauthorized: verifyTls, keepAlive: true })

const OAUTH_URL = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth'
const CHAT_URL = 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions'

const MODEL_PRIMARY = process.env.GIGACHAT_MODEL || 'GigaChat-Pro'
const MODEL_FALLBACK = process.env.GIGACHAT_MODEL_FALLBACK || 'GigaChat-2'

interface HttpResponse {
  status: number
  body: string
}

function post(url: string, headers: Record<string, string>, body: string): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'POST', agent, headers: { ...headers, 'Content-Length': Buffer.byteLength(body) } }, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve({ status: res.statusCode || 0, body: Buffer.concat(chunks).toString('utf-8') }))
    })
    req.on('error', reject)
    req.setTimeout(30000, () => req.destroy(new Error('timeout')))
    req.write(body)
    req.end()
  })
}

let cachedToken: { token: string; expiresAt: number } | null = null

async function getToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token
  }
  const credentials = process.env.GIGACHAT_CREDENTIALS
  if (!credentials) throw new Error('GIGACHAT_CREDENTIALS is not set')

  const scope = process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS'
  const res = await post(OAUTH_URL, {
    Authorization: `Basic ${credentials}`,
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json',
    RqUID: crypto.randomUUID(),
  }, `scope=${scope}`)

  let data: { access_token?: string; expires_at?: number }
  try {
    data = JSON.parse(res.body)
  } catch {
    throw new Error(`GigaChat auth: bad response ${res.status}`)
  }
  if (res.status !== 200 || !data.access_token) {
    throw new Error(`GigaChat auth failed: ${res.status} ${res.body.slice(0, 300)}`)
  }
  cachedToken = { token: data.access_token, expiresAt: data.expires_at || Date.now() + 25 * 60_000 }
  return cachedToken.token
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function'
  content: string
  name?: string
  function_call?: { name: string; arguments: Record<string, unknown> }
}

export interface GigaFunction {
  name: string
  description: string
  parameters: Record<string, unknown>
}

export interface CompletionResult {
  message: ChatMessage
  model: string
  finishReason: string
}

async function callModel(model: string, messages: ChatMessage[], functions: GigaFunction[]): Promise<CompletionResult> {
  let token = await getToken()
  const payload = JSON.stringify({
    model,
    messages,
    functions: functions.length ? functions : undefined,
    function_call: functions.length ? 'auto' : undefined,
    temperature: 0.6,
    max_tokens: 900,
  })

  let res = await post(CHAT_URL, {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }, payload)

  if (res.status === 401) {
    token = await getToken(true)
    res = await post(CHAT_URL, {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }, payload)
  }

  if (res.status !== 200) {
    throw new Error(`GigaChat ${model}: HTTP ${res.status} ${res.body.slice(0, 300)}`)
  }

  const data = JSON.parse(res.body)
  const choice = data.choices?.[0]
  if (!choice) throw new Error(`GigaChat ${model}: empty choices`)
  return {
    message: choice.message as ChatMessage,
    model,
    finishReason: choice.finish_reason || '',
  }
}

export async function chatCompletion(messages: ChatMessage[], functions: GigaFunction[]): Promise<CompletionResult> {
  try {
    return await callModel(MODEL_PRIMARY, messages, functions)
  } catch (err) {
    console.warn(`[gigachat] ${MODEL_PRIMARY} failed, falling back to ${MODEL_FALLBACK}:`, err instanceof Error ? err.message : err)
    return callModel(MODEL_FALLBACK, messages, functions)
  }
}
