import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import './ChatWidget.css'

type Msg = { role: 'user' | 'assistant'; content: string; file?: boolean }

const GREETING: Msg = {
  role: 'assistant',
  content: 'Привет! Я бот-помощник RAMCY 🤖 Подскажу по ценам, размерам, эскизу и помогу оставить заявку. Что вас интересует?',
}

const QUICK = ['Сколько стоит?', 'Из чего зеркала?', 'Как заказать?', 'Оставить заявку']

function linkify(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+|t\.me\/[^\s]+)/g)
  return parts.map((part, i) =>
    /^(https?:\/\/|t\.me\/)/.test(part) ? (
      <a key={i} href={part.startsWith('http') ? part : `https://${part}`} target="_blank" rel="noreferrer">{part}</a>
    ) : (
      part
    ),
  )
}

function getChatSessionId(): string {
  try {
    const existing = sessionStorage.getItem('ramcy_chat_session')
    if (existing) return existing
  } catch {}
  const bytes = new Uint8Array(16)
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  const id = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  try {
    sessionStorage.setItem('ramcy_chat_session', id)
  } catch {}
  return id
}

export default function ChatWidget() {
  const sessionId = useRef(getChatSessionId())
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([GREETING])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending, open])

  const push = (msg: Msg) => setMessages((m) => [...m, msg])

  const send = async (text: string) => {
    const content = text.trim()
    if (!content || sending) return
    setInput('')
    push({ role: 'user', content })
    setSending(true)
    try {
      const history = [...messages, { role: 'user' as const, content }]
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }))
      const res = await api.chatSend(history, sessionId.current)
      push({ role: 'assistant', content: res.reply })
    } catch (err) {
      push({
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Не получилось ответить. Напишите Виталию: https://t.me/ramcy_graffiti',
      })
    } finally {
      setSending(false)
    }
  }

  const sendFile = async (file: File | undefined) => {
    if (!file || sending) return
    setSending(true)
    push({ role: 'user', content: `📎 ${file.name}`, file: true })
    try {
      await api.chatUploadFile(file, sessionId.current)
      push({ role: 'assistant', content: 'Файл прикреплён к будущей заявке ✅ Напишите следующим сообщением, что изображено на нём и как использовать это в дизайне зеркала.' })
    } catch (err) {
      const reason = err instanceof Error && err.message.includes('сессия')
        ? ' Обновите страницу (Ctrl+F5) и попробуйте ещё раз.'
        : ''
      push({ role: 'assistant', content: `Не удалось отправить файл (до 20 МБ: jpg, png, webp, svg, ai, pdf, zip).${reason} Попробуйте ещё раз или пришлите файл Виталию: https://t.me/ramcy_graffiti` })
    } finally {
      setSending(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <>
      <button
        type="button"
        className={`chat-fab${open ? ' chat-fab--hidden' : ''}`}
        aria-label="Открыть чат с помощником RAMCY"
        onClick={() => setOpen(true)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3C6.5 3 2 6.9 2 11.7c0 2.7 1.4 5.1 3.7 6.7-.1 1.2-.7 2.6-1.7 3.6 0 0 2.6.1 4.9-1.2 1 .3 2 .4 3.1.4 5.5 0 10-3.9 10-8.7S17.5 3 12 3Z" />
          <circle cx="8" cy="11.7" r="1.2" /><circle cx="12" cy="11.7" r="1.2" /><circle cx="16" cy="11.7" r="1.2" />
        </svg>
      </button>

      {open && (
        <div className="chat" role="dialog" aria-label="Чат с помощником RAMCY">
          <header className="chat__header">
            <div className="chat__title">
              <strong>Помощник RAMCY</strong>
              <span>бот · отвечает мгновенно</span>
            </div>
            <button type="button" className="chat__close" aria-label="Закрыть чат" onClick={() => setOpen(false)}>×</button>
          </header>

          <div className="chat__messages" ref={listRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chat__msg chat__msg--${m.role}`}>
                {linkify(m.content)}
              </div>
            ))}
            {sending && <div className="chat__msg chat__msg--assistant chat__typing"><i /><i /><i /></div>}
            {!sending && messages.length <= 1 && (
              <div className="chat__quick">
                {QUICK.map((q) => (
                  <button key={q} type="button" onClick={() => send(q)}>{q}</button>
                ))}
              </div>
            )}
          </div>

          <form
            className="chat__form"
            onSubmit={(e) => { e.preventDefault(); send(input) }}
          >
            <input
              ref={fileRef}
              type="file"
              hidden
              accept=".jpg,.jpeg,.png,.webp,.gif,.svg,.ai,.pdf,.eps,.zip,image/*"
              onChange={(e) => sendFile(e.target.files?.[0])}
            />
            <button type="button" className="chat__attach" aria-label="Прикрепить файл" onClick={() => fileRef.current?.click()} disabled={sending}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v12.5A4.5 4.5 0 0 0 11.5 21a4.5 4.5 0 0 0 4.5-4.5V6.5a3 3 0 0 0-6 0v9a1.5 1.5 0 0 0 3 0V7h-1.5v8.5a.5.5 0 0 1-1 0V6.5a1.5 1.5 0 0 1 3 0v10a3 3 0 0 1-6 0V4H7Z" transform="rotate(45 12 12)" /></svg>
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Напишите сообщение…"
              maxLength={2000}
              aria-label="Сообщение"
            />
            <button type="submit" className="chat__send" aria-label="Отправить" disabled={sending || !input.trim()}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 21 3l-7.5 18-3-7.5L3 11.5Z" /></svg>
            </button>
          </form>
          <p className="chat__consent">Отправляя сообщение, вы соглашаетесь на обработку персональных данных</p>
        </div>
      )}
    </>
  )
}
