import https from 'https'
import fs from 'fs'
import crypto from 'crypto'
import { basename } from 'path'

function request(url: string, headers: Record<string, string>, body: Buffer): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'POST', headers: { ...headers, 'Content-Length': body.length } }, (res) => {
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

function jsonPost(path: string, payload: Record<string, unknown>) {
  const body = Buffer.from(JSON.stringify(payload))
  return request(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}${path}`, { 'Content-Type': 'application/json' }, body)
}

function configured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)
}

export async function sendMessage(text: string): Promise<void> {
  if (!configured()) {
    console.warn('[telegram] not configured, message skipped:', text.slice(0, 120))
    return
  }
  const res = await jsonPost('/sendMessage', {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  })
  if (res.status !== 200) {
    console.error('[telegram] sendMessage failed:', res.status, res.body.slice(0, 300))
  }
}

export async function sendDocument(filePath: string, caption: string): Promise<void> {
  if (!configured()) {
    console.warn('[telegram] not configured, document skipped:', filePath)
    return
  }
  const boundary = 'tg' + crypto.randomBytes(16).toString('hex')
  const fileData = fs.readFileSync(filePath)
  const fileName = basename(filePath)

  const parts: Buffer[] = []
  const field = (name: string, value: string) => {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`))
  }
  field('chat_id', process.env.TELEGRAM_CHAT_ID!)
  field('caption', caption)
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="document"; filename="${fileName}"\r\nContent-Type: application/octet-stream\r\n\r\n`))
  parts.push(fileData)
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`))

  const body = Buffer.concat(parts)
  const res = await request(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendDocument`,
    { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body,
  )
  if (res.status !== 200) {
    console.error('[telegram] sendDocument failed:', res.status, res.body.slice(0, 300))
  }
}
