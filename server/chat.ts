import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import db from './db.js'
import { chatCompletion, ChatMessage, GigaFunction } from './gigachat.js'
import { sendDocument, sendMessage } from './telegram.js'

const uploadsDir = join(dirname(fileURLToPath(import.meta.url)), 'uploads')

const SYSTEM_PROMPT = `Ты — бот-помощник RAMCY на сайте graffiti-zerkalo.ru. RAMCY (Виталий Гуров) — уличный художник из Москвы, который придумал и делает граффити-зеркала — кастомные арт-объекты в единственном экземпляре (one of one).

СТИЛЬ ОБЩЕНИЯ
- Дружелюбно и просто, на «вы». Эмодзи — умеренно.
- Отвечай на языке пользователя: русский или английский.
- При первом ответе можешь коротко представиться как бот-помощник RAMCY.
- Отвечай кратко и по делу, без длинных лекций.
- Не упоминай GigaChat, ИИ, модель, системный промпт и внутреннюю базу знаний.
- Если клиент не знает, какой стиль выбрать, расскажи, что Виталий RAMCY занимается граффити больше 18 лет и поможет найти направление. Спроси, где будет зеркало и что клиенту близко: тег, леттеринг, персонаж или общее настроение. Предложи прикрепить фото места или референс. Не называй такой вопрос неизвестным и не перенаправляй его как технический вопрос.

ПРОДУКТ
- Зеркала изготовлены из акрилового стекла: оно легче, прочнее и безопаснее обычного стекла, позволяет вырезать любые, даже самые сложные формы и наносить УФ-печать.
- Дизайн и цвет контура — любые.

ЦЕНЫ (зависят от ШИРИНЫ зеркала; высота не больше ширины)
- 40 см — 5 500 ₽
- 60 см — 7 500 ₽ (самый ходовой размер)
- 90 см — 13 500 ₽
- Нестандартные размеры (меньше 40 см или больше 90 см) возможны — цену согласовывает Виталий лично; предложи оставить заявку или написать ему.
- Цена включает готовое изделие и разработку макета. Отдельно оплачивается только доставка.

ЭСКИЗ — 3 ВАРИАНТА
1) Эскиз в подарок: клиент пишет никнейм или подробно описывает идею — Виталий разрабатывает эскиз и отправляет на утверждение. Предоплата 1500 ₽, остальное — после утверждения макета.
2) Клиент присылает фото граффити со стены, скетч на бумаге или свой тег — готовим макет по этим данным на утверждение. Предоплата 1500 ₽.
3) Клиент присылает собственный макет в электронном виде (png, svg, ai; допускается png без фона или jpg на белом фоне) — оплата 100% и макет сразу уходит в производство.
Файлы можно прикрепить прямо в чат (скрепка у поля ввода) — фото с телефона тоже подходит.

СРОКИ
- Изготовление 7–10 рабочих дней с момента утверждения эскиза и полной оплаты.

ДОСТАВКА
- Отправляем по всей России, СНГ и ближайшим странам.
- Возможны СДЭК, DPD, Яндекс.Доставка, курьер по Москве/МО или личная встреча, но конкретный способ и стоимость доставки ВСЕГДА обсуждаются только лично с Виталием после заявки.
- Бот НЕ предлагает клиенту выбирать службу доставки и не показывает список вариантов. В заявке delivery_method всегда передавай точное значение «Обсудить лично с Виталием».
- Доставку клиент оплачивает при получении посылки. Точную стоимость доставки бот не называет.
- Другие страны также обсуждаются лично с Виталием.

ПОЛУЧЕНИЕ ПОСЫЛКИ (рассказывай после оформления заявки или если спрашивают про повреждения)
- Все посылки застрахованы. В пункте выдачи обязательно: проверить коробку на повреждения, затем проверить содержимое под камерами пункта выдачи. Если зеркало повреждено — сфотографировать упаковку снаружи и повреждение внутри, посылку не забирать и прислать фото Виталию. Без этого алгоритма сложно доказать вину доставки и получить страховую выплату. При соблюдении алгоритма зеркало переделаем.

КОНТАКТ ВИТАЛИЯ
- Telegram: https://t.me/ramcy_graffiti (@ramcy_graffiti)

ЗАЯВКА — ОБЯЗАТЕЛЬНЫЙ ПОШАГОВЫЙ СЦЕНАРИЙ
Когда клиент хочет заказать или описывает желаемое зеркало, собери: имя; город; ширину; идею дизайна; цвет; НОМЕР ТЕЛЕФОНА; EMAIL; канал связи (только Telegram, VK или WhatsApp); проверенный контакт выбранного канала; удобное время; способ доставки.
- Номер телефона и email спрашивай ВСЕГДА отдельным вопросом, даже если клиент уже назвал имя, город, размер и дизайн. Email обязателен для заявки через чат.
- После телефона и email спроси: «Где с вами удобнее связаться: Telegram, VK или WhatsApp?»
- Если Telegram: запроси @username или ссылку строго вида https://t.me/username. Не принимай просто имя без @/ссылки.
- Если VK: обязательно запроси полную ссылку на личную страницу клиента вида https://vk.com/username или https://vk.ru/username.
- Если WhatsApp: спроси, зарегистрирован ли WhatsApp на номере телефона, указанном ранее. Если да — в messenger_contact передай тот же телефон. Если нет — обязательно запроси отдельный номер WhatsApp; тогда phone — основной номер для звонка, messenger_contact — отдельный номер WhatsApp.
- Потом спроси только удобное время связи. Способ доставки НЕ спрашивай: он всегда обсуждается лично с Виталием.
- Ответы «сейчас», «сразу», «как можно скорее» принимай как удобное время — не переспрашивай. Финальное сообщение уже говорит, что Виталий свяжется скоро.
- Заказ зеркала в форме логотипа, тега, надписи или по картинке клиента — это ОБЫЧНЫЙ заказ, а не вопрос вне базы знаний. Веди его как заявку: предложи прикрепить файл, собирай обязательные поля и вызывай submit_application.
- Если клиент упоминает логотип, фото, картинку, скетч или макет — САМ предложи прикрепить файл кнопкой-скрепкой рядом с полем ввода. Не жди, пока клиент спросит, можно ли прислать фото.
- Если клиент прикрепил файл, учти его имя и описание из системного сообщения о приложенных файлах. Укажи это в design_idea/comment заявки. Файлы сервер автоматически привяжет к заявке.
- Задавай по одному-два вопроса за сообщение. Не создавай заявку раньше времени и не подставляй выдуманные данные.
- НИКОГДА не называй Виталия Виктором или другим именем. Имя администратора — только ВИТАЛИЙ.
Когда ВСЕ обязательные данные собраны — вызови submit_application. После успешного вызова напиши ТОЧНО: «Заявка отправлена. Скоро Виталий с вами свяжется для уточнения деталей и подтверждения вашего заказа. Спасибо» и кратко напомни про проверку посылки в пункте выдачи.

ОГРАНИЧЕНИЯ — СТРОГО
- Никогда не проси данные банковских карт и не отправляй платёжные ссылки.
- Не называй окончательную стоимость нестандартных размеров и стоимость доставки.
- Не обещай точную дату изготовления, не давай скидок, не подтверждай заказ как окончательно оформленный.
- Не спорь с клиентом и не придумывай информацию.
- Если вопрос вне базы знаний (скидка, срочное изготовление, сотрудничество, корпоративный заказ, возврат, монтаж в нестандартных условиях и т.п.) — ответь: «По этому вопросу лучше уточнить у Виталия. Я передам ему ваш вопрос, и он свяжется с вами. Также можно написать напрямую: https://t.me/ramcy_graffiti» — и вызови функцию contact_admin.
- Монтаж и уход за зеркалом: если точной информации нет — отвечай общими словами (зеркало лёгкое, крепится как обычное настенное зеркало, уход — как за акрилом: мягкая ткань, без абразивов) или переводи на Виталия.`

const FUNCTIONS: GigaFunction[] = [
  {
    name: 'submit_application',
    description: 'Сохраняет заявку клиента на граффити-зеркало и отправляет её Виталию в Telegram. Вызывать только когда все обязательные данные собраны в диалоге.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Имя клиента' },
        city: { type: 'string', description: 'Город клиента' },
        width: { type: 'string', description: 'Желаемая ширина зеркала, например "60 см"' },
        height: { type: 'string', description: 'Высота, если клиент назвал' },
        design_idea: { type: 'string', description: 'Идея/описание дизайна или выбранный вариант эскиза' },
        sketch_type: { type: 'string', description: 'Вариант эскиза: разработать с нуля / по фото или скетчу клиента / свой готовый макет' },
        colors: { type: 'string', description: 'Желаемые цвета контуров' },
        phone: { type: 'string', description: 'Обязательный основной номер телефона клиента для звонка' },
        email: { type: 'string', description: 'Обязательный email клиента' },
        contact_method: { type: 'string', enum: ['telegram', 'vk', 'whatsapp'], description: 'Выбранный канал связи: только telegram, vk или whatsapp' },
        messenger_contact: { type: 'string', description: 'Проверенный контакт мессенджера: Telegram @username или https://t.me/username; полная ссылка VK; для WhatsApp номер телефона аккаунта' },
        contact_time: { type: 'string', description: 'Удобное время связи' },
        delivery_method: { type: 'string', enum: ['Обсудить лично с Виталием'], description: 'Всегда точное значение: Обсудить лично с Виталием' },
        comment: { type: 'string', description: 'Комментарий клиента' },
      },
      required: ['name', 'city', 'width', 'design_idea', 'colors', 'phone', 'email', 'contact_method', 'messenger_contact', 'contact_time', 'delivery_method'],
    },
  },
  {
    name: 'contact_admin',
    description: 'Передаёт Виталию вопрос клиента, на который у бота нет ответа, или просьбу о личной консультации.',
    parameters: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'Суть вопроса или просьбы клиента' },
        contact: { type: 'string', description: 'Контакт клиента, если он его оставил' },
      },
      required: ['question'],
    },
  },
]

interface ApplicationRow {
  id: number
}

function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const PLACEHOLDER = /неуказан|не указан|unknown|нет данных|^\s*$/i

function validApplication(a: Record<string, unknown>, history: ChatMessage[]): string | null {
  const required: Array<[string, string]> = [
    ['name', 'имя'],
    ['city', 'город'],
    ['width', 'ширина зеркала'],
    ['design_idea', 'идея дизайна'],
    ['colors', 'цвет контура'],
    ['phone', 'номер телефона'],
    ['email', 'email'],
    ['contact_method', 'канал связи'],
    ['messenger_contact', 'контакт мессенджера'],
    ['contact_time', 'удобное время связи'],
    ['delivery_method', 'способ доставки'],
  ]
  const missing = required
    .filter(([key]) => PLACEHOLDER.test(String(a[key] ?? '')))
    .map(([, label]) => label)
  if (missing.length) return `missing: ${missing.join(', ')}`

  const phone = String(a.phone)
  if (phone.replace(/\D/g, '').length < 10) return 'invalid: номер телефона должен содержать не менее 10 цифр'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(a.email))) return 'invalid: неверный формат email'

  const method = String(a.contact_method).toLowerCase()
  const contact = String(a.messenger_contact).trim()
  if (!['telegram', 'vk', 'whatsapp'].includes(method)) return 'invalid: канал связи должен быть Telegram, VK или WhatsApp'
  if (method === 'telegram' && !/^(@[a-zA-Z0-9_]{5,32}|https:\/\/t\.me\/[a-zA-Z0-9_]{5,32}\/?$)/.test(contact)) {
    return 'invalid: нужен Telegram @username или ссылка https://t.me/username'
  }
  if (method === 'vk' && !/^https:\/\/(vk\.com|vk\.ru)\/[a-zA-Z0-9_.-]+\/?$/i.test(contact)) {
    return 'invalid: нужна полная ссылка на личную страницу VK'
  }
  if (method === 'whatsapp' && contact.replace(/\D/g, '').length < 10) {
    return 'invalid: нужен номер телефона аккаунта WhatsApp'
  }

  const userText = history.filter((m) => m.role === 'user').map((m) => m.content).join('\n')
  const userDigits = userText.replace(/\D/g, '')
  const phoneDigits = phone.replace(/\D/g, '')
  const messengerDigits = contact.replace(/\D/g, '')
  if (!userDigits.includes(phoneDigits)) return 'invalid: номер телефона не был указан клиентом'
  if (!userText.toLowerCase().includes(String(a.email).toLowerCase())) return 'invalid: email не был указан клиентом'
  if (method === 'telegram' && !userText.toLowerCase().includes(contact.toLowerCase())) return 'invalid: Telegram-контакт не был указан клиентом'
  if (method === 'vk' && !userText.toLowerCase().includes(contact.toLowerCase())) return 'invalid: ссылка VK не была указана клиентом'
  if (method === 'whatsapp' && !userDigits.includes(messengerDigits)) return 'invalid: номер WhatsApp не был указан клиентом'
  const timeValue = String(a.contact_time).toLowerCase().trim()
  const timeEvidence = /(утр|д[её]н|вечер|ноч|сейчас|сразу|скор|когда угод|любое|в люб|прям|ближ|всегда|после \d|до \d|\d{1,2}[:.]\d{2})/i.test(userText)
    || (timeValue.length > 2 && userText.toLowerCase().includes(timeValue))
  if (!timeEvidence) {
    return 'missing: клиент не указал удобное время связи'
  }
  a.delivery_method = 'Обсудить лично с Виталием'
  return null
}

function createApplication(a: Record<string, unknown>): number {
  const result = db.prepare(`
    INSERT INTO applications (name, city, width, height, design_idea, sketch_type, colors,
      phone, email, contact_method, contact_details, messenger_contact, contact_time, delivery_method, comment)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    String(a.name || ''),
    String(a.city || ''),
    String(a.width || ''),
    String(a.height || ''),
    String(a.design_idea || ''),
    String(a.sketch_type || ''),
    String(a.colors || ''),
    String(a.phone || ''),
    String(a.email || ''),
    String(a.contact_method || ''),
    String(a.messenger_contact || ''),
    String(a.messenger_contact || ''),
    String(a.contact_time || ''),
    String(a.delivery_method || ''),
    String(a.comment || ''),
  ) as { lastInsertRowid: number | bigint }
  return Number(result.lastInsertRowid)
}

type ApplicationFile = { filename: string; original_name: string; description: string }

function attachApplicationFiles(applicationId: number, sessionId: string): ApplicationFile[] {
  if (!sessionId) return []
  db.prepare(`
    UPDATE application_files SET application_id = ?
    WHERE session_id = ? AND application_id IS NULL
  `).run(applicationId, sessionId)
  return db.prepare(`
    SELECT filename, original_name, description FROM application_files
    WHERE application_id = ? ORDER BY created_at
  `).all(applicationId) as ApplicationFile[]
}

async function notifyApplicationFiles(id: number, files: ApplicationFile[]) {
  for (const file of files) {
    const description = file.description ? `\nОписание: ${file.description}` : ''
    await sendDocument(
      join(uploadsDir, file.filename),
      `Файл к заявке #${id}: ${file.original_name}${description}`.slice(0, 1000),
    ).catch((err) => console.error('[chat] telegram application file failed:', err))
  }
}

async function notifyApplication(id: number, a: Record<string, unknown>) {
  const lines = [
    `<b>Новая заявка #${id} с сайта</b>`,
    ``,
    `<b>Имя:</b> ${esc(a.name)}`,
    `<b>Город:</b> ${esc(a.city)}`,
    `<b>Ширина:</b> ${esc(a.width)}${a.height ? ` · <b>Высота:</b> ${esc(a.height)}` : ''}`,
    `<b>Дизайн:</b> ${esc(a.design_idea)}`,
    a.sketch_type ? `<b>Эскиз:</b> ${esc(a.sketch_type)}` : '',
    a.colors ? `<b>Цвета:</b> ${esc(a.colors)}` : '',
    ``,
    `<b>Телефон:</b> ${esc(a.phone)}`,
    `<b>Email:</b> ${esc(a.email)}`,
    `<b>Связь:</b> ${esc(a.contact_method)} — ${esc(a.messenger_contact)}`,
    `<b>Удобное время:</b> ${esc(a.contact_time)}`,
    `<b>Доставка:</b> ${esc(a.delivery_method)}`,
    a.comment ? `<b>Комментарий:</b> ${esc(a.comment)}` : '',
  ].filter((l) => l !== '')
  await sendMessage(lines.join('\n'))
}

export interface ChatResponse {
  reply: string
  submitted?: boolean
  model?: string
}

const MAX_HISTORY = 20
const MAX_MESSAGE_LEN = 2000

function getStyleConsultationReply(history: ChatMessage[]): string | null {
  const message = [...history].reverse().find((item) => item.role === 'user')?.content || ''
  const russianIntent = /(?:не\s+знаю|не\s+уверен[а]?|пока\s+не\s+решил[а]?|не\s+могу\s+выбрать|пока\s+нет\s+идеи|нет\s+идеи).{0,100}(?:стил\w*|дизайн\w*|эскиз\w*|рисунок|образ)|(?:стил\w*|дизайн\w*|образ).{0,70}(?:посовет\w*|подоб\w*|выбрать|помог\w*|подойд[её]т)|(?:в\s+каком\s+стиле|какой\s+стиль).{0,70}(?:лучше|подойд|сделать|выбрать)/i
  const englishIntent = /\b(?:i don't know|not sure|haven't decided|can't choose|no idea)\b.{0,100}\b(?:style|design|look|artwork)\b|\b(?:style|design)\b.{0,60}\b(?:recommend|suggest|help me|choose|suit)\b|\bwhat style\b.{0,60}\b(?:should|would|best|suit)\b/i

  if (russianIntent.test(message)) {
    return 'Необязательно сразу знать точный стиль. Виталий RAMCY занимается граффити больше 18 лет и поможет найти направление, которое подойдёт именно вам. Расскажите, где будет зеркало и что вам ближе: тег, леттеринг, персонаж или просто настроение. Если есть фото места или референс, прикрепите его сюда.'
  }
  if (englishIntent.test(message)) {
    return "You don't need to know the exact style yet. Vitaliy RAMCY has over 18 years of graffiti experience and can help you find a direction that feels right. Tell me where the mirror will go and what you're drawn to: a tag, lettering, a character, or just a mood. You can attach a room photo or reference here."
  }
  return null
}

export async function handleChat(rawHistory: unknown, rawSessionId?: unknown): Promise<ChatResponse> {
  if (!Array.isArray(rawHistory)) {
    throw new Error('messages must be an array')
  }
  const history: ChatMessage[] = rawHistory
    .filter((m): m is { role: string; content: string } =>
      typeof m === 'object' && m !== null &&
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string')
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content.slice(0, MAX_MESSAGE_LEN) }))

  if (history.length === 0) {
    throw new Error('empty history')
  }

  const styleReply = getStyleConsultationReply(history)
  if (styleReply) return { reply: styleReply }
  if (!process.env.GIGACHAT_CREDENTIALS) {
    return { reply: 'Чат временно недоступен. Напишите Виталию напрямую: https://t.me/ramcy_graffiti' }
  }

  const sessionId = typeof rawSessionId === 'string' && /^[a-zA-Z0-9_-]{16,80}$/.test(rawSessionId) ? rawSessionId : ''
  const pendingFiles = sessionId ? db.prepare(`
    SELECT original_name, description FROM application_files
    WHERE session_id = ? AND application_id IS NULL ORDER BY created_at
  `).all(sessionId) as Array<{ original_name: string; description: string }> : []
  const fileContext = pendingFiles.length
    ? `\n\nКЛИЕНТ ПРИКРЕПИЛ ФАЙЛЫ:\n${pendingFiles.map((f, i) => `${i + 1}. ${f.original_name}${f.description ? ` — ${f.description}` : ''}`).join('\n')}\nФайлы будут автоматически добавлены к заявке; не проси отправлять их повторно.`
    : ''
  const messages: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT + fileContext }, ...history]
  let result = await chatCompletion(messages, FUNCTIONS)

  for (let i = 0; i < 2 && result.message.function_call; i++) {
    const fc = result.message.function_call
    messages.push({ role: 'assistant', content: result.message.content || '', function_call: fc })

    let fnResult: Record<string, unknown> = { ok: true }
    let submitted = false
    if (fc.name === 'submit_application') {
      const invalid = validApplication(fc.arguments || {}, history)
      if (invalid) {
        fnResult = { ok: false, error: `Не хватает данных (${invalid}). Доспроси клиента и вызови функцию снова.` }
      } else {
        const id = createApplication(fc.arguments || {})
        const files = attachApplicationFiles(id, sessionId)
        await notifyApplication(id, fc.arguments || {}).catch((e) => console.error('[chat] telegram notify failed:', e))
        await notifyApplicationFiles(id, files)
        fnResult = { ok: true, application_id: id, files_attached: files.length }
        submitted = true
      }
    } else if (fc.name === 'contact_admin') {
      const q = esc(fc.arguments?.question)
      const c = esc(fc.arguments?.contact)
      await sendMessage(`<b>Вопрос из чат-бота</b>\n\n${q}${c ? `\n\n<b>Контакт:</b> ${c}` : ''}\n\nЕсли контакта нет — клиент на сайте, подсказал написать в @ramcy_graffiti`)
        .catch((e) => console.error('[chat] telegram handoff failed:', e))
      fnResult = { ok: true }
    } else {
      fnResult = { ok: false, error: 'unknown function' }
    }

    messages.push({ role: 'function', name: fc.name, content: JSON.stringify(fnResult) })
    result = await chatCompletion(messages, FUNCTIONS)

    if (submitted && !result.message.function_call) {
      return {
        reply: 'Заявка отправлена. Скоро Виталий с вами свяжется для уточнения деталей и подтверждения вашего заказа. Спасибо!\n\nПри получении обязательно проверьте коробку и зеркало в пункте выдачи под камерами.',
        submitted: true,
        model: result.model,
      }
    }
  }

  return { reply: result.message.content, model: result.model }
}
