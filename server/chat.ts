import db from './db.js'
import { chatCompletion, ChatMessage, GigaFunction } from './gigachat.js'
import { sendMessage } from './telegram.js'

const SYSTEM_PROMPT = `Ты — бот-помощник RAMCY на сайте graffiti-zerkalo.ru. RAMCY (Виталий Гуров) — уличный художник из Москвы, который придумал и делает граффити-зеркала — кастомные арт-объекты в единственном экземпляре (one of one).

СТИЛЬ ОБЩЕНИЯ
- Дружелюбно и просто, на «вы». Эмодзи — умеренно.
- Отвечай на языке пользователя: русский или английский.
- При первом ответе можешь коротко представиться как бот-помощник RAMCY.
- Отвечай кратко и по делу, без длинных лекций.

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
- Основные службы: СДЭК и DPD; альтернатива — Яндекс.Доставка; срочно по Москве и МО — курьер Яндекс.Такси. Возможна передача при встрече в Москве.
- Доставку клиент оплачивает при получении посылки. Точную стоимость доставки бот не называет — она рассчитывается после оформления заявки или обсуждается с Виталием.
- Другие страны — обсуждается лично с Виталием.

ПОЛУЧЕНИЕ ПОСЫЛКИ (рассказывай после оформления заявки или если спрашивают про повреждения)
- Все посылки застрахованы. В пункте выдачи обязательно: проверить коробку на повреждения, затем проверить содержимое под камерами пункта выдачи. Если зеркало повреждено — сфотографировать упаковку снаружи и повреждение внутри, посылку не забирать и прислать фото Виталию. Без этого алгоритма сложно доказать вину доставки и получить страховую выплату. При соблюдении алгоритма зеркало переделаем.

КОНТАКТ ВИТАЛИЯ
- Telegram: https://t.me/ramcy_graffiti (@ramcy_graffiti)

ЗАЯВКА
Когда клиент хочет заказать или оставить заявку — собери в диалоге поля: имя; город; желаемая ширина зеркала; идею/описание дизайна или вариант эскиза; способ связи (звонок, Telegram, WhatsApp, VK или email); контакт выбранного способа (номер, никнейм или почта); удобное время связи; способ доставки (СДЭК, DPD, Яндекс.Доставка, встреча в Москве или обсудить). Дополнительно можно уточнить высоту, цвета контуров и комментарий. Задавай вопросы естественно, по одному-два за раз, не анкетой. Когда все обязательные данные собраны — вызови функцию submit_application, затем напиши: «Заявка отправлена. Скоро Виталий с вами свяжется для уточнения деталей и подтверждения вашего заказа. Спасибо» и кратко напомни про проверку посылки в пункте выдачи.

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
        contact_method: { type: 'string', description: 'Способ связи: звонок, telegram, whatsapp, vk, email' },
        contact_details: { type: 'string', description: 'Контакт выбранного способа: номер телефона, никнейм или email' },
        contact_time: { type: 'string', description: 'Удобное время связи' },
        delivery_method: { type: 'string', description: 'Способ доставки: СДЭК, DPD, Яндекс.Доставка, встреча в Москве, обсудить' },
        comment: { type: 'string', description: 'Комментарий клиента' },
      },
      required: ['name', 'city', 'width', 'design_idea', 'contact_method', 'contact_details', 'contact_time', 'delivery_method'],
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

function validApplication(a: Record<string, unknown>): string | null {
  const required: Array<[string, string]> = [
    ['name', 'имя'],
    ['contact_details', 'контакт для связи'],
    ['contact_method', 'способ связи'],
    ['city', 'город'],
    ['width', 'ширина зеркала'],
  ]
  const missing = required
    .filter(([key]) => PLACEHOLDER.test(String(a[key] ?? '')))
    .map(([, label]) => label)
  return missing.length ? `missing: ${missing.join(', ')}` : null
}

function createApplication(a: Record<string, unknown>): number {
  const result = db.prepare(`
    INSERT INTO applications (name, city, width, height, design_idea, sketch_type, colors,
      contact_method, contact_details, contact_time, delivery_method, comment)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    String(a.name || ''),
    String(a.city || ''),
    String(a.width || ''),
    String(a.height || ''),
    String(a.design_idea || ''),
    String(a.sketch_type || ''),
    String(a.colors || ''),
    String(a.contact_method || ''),
    String(a.contact_details || ''),
    String(a.contact_time || ''),
    String(a.delivery_method || ''),
    String(a.comment || ''),
  ) as { lastInsertRowid: number | bigint }
  return Number(result.lastInsertRowid)
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
    `<b>Связь:</b> ${esc(a.contact_method)} — ${esc(a.contact_details)}`,
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

export async function handleChat(rawHistory: unknown): Promise<ChatResponse> {
  if (!process.env.GIGACHAT_CREDENTIALS) {
    return { reply: 'Чат временно недоступен. Напишите Виталию напрямую: https://t.me/ramcy_graffiti' }
  }
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

  const messages: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }, ...history]
  let result = await chatCompletion(messages, FUNCTIONS)

  for (let i = 0; i < 2 && result.message.function_call; i++) {
    const fc = result.message.function_call
    messages.push({ role: 'assistant', content: result.message.content || '', function_call: fc })

    let fnResult: Record<string, unknown> = { ok: true }
    let submitted = false
    if (fc.name === 'submit_application') {
      const invalid = validApplication(fc.arguments || {})
      if (invalid) {
        fnResult = { ok: false, error: `Не хватает данных (${invalid}). Доспроси клиента и вызови функцию снова.` }
      } else {
        const id = createApplication(fc.arguments || {})
        await notifyApplication(id, fc.arguments || {}).catch((e) => console.error('[chat] telegram notify failed:', e))
        fnResult = { ok: true, application_id: id }
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
      return { reply: result.message.content, submitted: true, model: result.model }
    }
  }

  return { reply: result.message.content, model: result.model }
}
