import './env.js'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'url'
import { dirname, join, extname } from 'path'
import fs from 'fs'

import db from './db.js'
import { authMiddleware, generateToken, AuthRequest } from './auth.js'
import { handleChat } from './chat.js'
import { sendMessage } from './telegram.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Директория для загруженных файлов
const uploadsDir = join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Middleware
app.use(cors())
app.use(express.json())
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  next()
})

// Статика для загруженных изображений
app.use('/uploads', express.static(uploadsDir))

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    const ext = extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Недопустимый формат файла'))
    }
  },
})

// ============ AUTH ============

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    res.status(400).json({ error: 'Введите логин и пароль' })
    return
  }

  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username) as
    | { id: number; username: string; password: string }
    | undefined

  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    res.status(401).json({ error: 'Неверный логин или пароль' })
    return
  }

  const token = generateToken(admin.id, admin.username)
  res.json({ token, username: admin.username })
})

app.get('/api/auth/check', authMiddleware, (req: AuthRequest, res) => {
  res.json({ ok: true, username: req.adminUsername })
})

// ============ CATEGORIES ============

app.get('/api/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY name').all()
  res.json(categories)
})

app.post('/api/categories', authMiddleware, (req, res) => {
  const { name, slug } = req.body
  if (!name || !slug) {
    res.status(400).json({ error: 'Название и slug обязательны' })
    return
  }
  try {
    const result = db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)').run(name, slug)
    res.json({ id: result.lastInsertRowid, name, slug })
  } catch {
    res.status(400).json({ error: 'Категория уже существует' })
  }
})

app.delete('/api/categories/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// ============ PRODUCTS ============

app.get('/api/products', (req, res) => {
  const { category } = req.query

  let query = `
    SELECT p.*, c.name as category_name, c.slug as category_slug,
      (SELECT filename FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) as cover
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_published = 1
  `
  const params: unknown[] = []

  if (category) {
    query += ' AND c.slug = ?'
    params.push(category)
  }

  query += ' ORDER BY p.sort_order, p.created_at DESC'

  const products = db.prepare(query).all(...params)
  res.json(products)
})

app.get('/api/products/all', authMiddleware, (req, res) => {
  const products = db.prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug,
      (SELECT filename FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) as cover
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.sort_order, p.created_at DESC
  `).all()
  res.json(products)
})

app.get('/api/products/:id', (req, res) => {
  const product = db.prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).get(req.params.id)

  if (!product) {
    res.status(404).json({ error: 'Товар не найден' })
    return
  }

  const images = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order').all(req.params.id)
  res.json({ ...product, images })
})

app.post('/api/products', authMiddleware, (req, res) => {
  const { name, size, description, price, category_id, is_published, sort_order } = req.body
  if (!name || !size) {
    res.status(400).json({ error: 'Название и размер обязательны' })
    return
  }

  const result = db.prepare(`
    INSERT INTO products (name, size, description, price, category_id, is_published, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    name,
    size,
    description || '',
    price || '',
    category_id || null,
    is_published !== undefined ? (is_published ? 1 : 0) : 1,
    sort_order || 0,
  )

  res.json({ id: result.lastInsertRowid, ok: true })
})

app.put('/api/products/:id', authMiddleware, (req, res) => {
  const { name, size, description, price, category_id, is_published, sort_order } = req.body
  db.prepare(`
    UPDATE products SET
      name = ?, size = ?, description = ?, price = ?, category_id = ?,
      is_published = ?, sort_order = ?
    WHERE id = ?
  `).run(
    name,
    size,
    description || '',
    price || '',
    category_id || null,
    is_published !== undefined ? (is_published ? 1 : 0) : 1,
    sort_order || 0,
    req.params.id,
  )
  res.json({ ok: true })
})

app.delete('/api/products/:id', authMiddleware, (req, res) => {
  // Удаляем файлы изображений
  const images = db.prepare('SELECT filename FROM product_images WHERE product_id = ?').all(req.params.id) as { filename: string }[]
  images.forEach((img) => {
    const filePath = join(uploadsDir, img.filename)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  })

  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// ============ PRODUCT IMAGES ============

app.post('/api/products/:id/images', authMiddleware, upload.array('images', 10), (req, res) => {
  const productId = req.params.id
  const files = req.files as Express.Multer.File[] | undefined
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'Нет файлов' })
    return
  }

  const insertImage = db.prepare('INSERT INTO product_images (product_id, filename, sort_order) VALUES (?, ?, ?)')
  const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM product_images WHERE product_id = ?').get(productId) as { max: number | null }

  files.forEach((file, i) => {
    insertImage.run(productId, file.filename, (maxOrder?.max || 0) + i)
  })

  res.json({ ok: true, files: files.map((f) => f.filename) })
})

app.post('/api/products/:id/images/:imageId/cover', authMiddleware, (req, res) => {
  const images = db.prepare('SELECT id FROM product_images WHERE product_id = ? ORDER BY sort_order').all(req.params.id) as { id: number }[]
  const target = Number(req.params.imageId)
  if (!images.some((img) => img.id === target)) {
    res.status(404).json({ error: 'Изображение не найдено' })
    return
  }
  const ordered = [target, ...images.map((img) => img.id).filter((id) => id !== target)]
  const upd = db.prepare('UPDATE product_images SET sort_order = ? WHERE id = ?')
  ordered.forEach((id, i) => upd.run(i, id))
  res.json({ ok: true })
})

app.delete('/api/products/:id/images/:imageId', authMiddleware, (req, res) => {
  const image = db.prepare('SELECT filename FROM product_images WHERE id = ? AND product_id = ?').get(req.params.imageId, req.params.id) as { filename: string } | undefined
  if (image) {
    const filePath = join(uploadsDir, image.filename)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    db.prepare('DELETE FROM product_images WHERE id = ?').run(req.params.imageId)
  }
  res.json({ ok: true })
})

// ============ REVIEWS ============

app.get('/api/reviews', (req, res) => {
  const reviews = db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all()
  res.json(reviews)
})

app.post('/api/reviews', authMiddleware, upload.array('images', 20), (req, res) => {
  const files = req.files as Express.Multer.File[] | undefined
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'Нет файлов' })
    return
  }

  const insertReview = db.prepare('INSERT INTO reviews (filename) VALUES (?)')
  files.forEach((file) => insertReview.run(file.filename))

  res.json({ ok: true, files: files.map((f) => f.filename) })
})

app.put('/api/reviews/:id', authMiddleware, upload.single('image'), (req, res) => {
  const file = req.file
  if (!file) {
    res.status(400).json({ error: 'Нет файла' })
    return
  }
  const review = db.prepare('SELECT filename FROM reviews WHERE id = ?').get(req.params.id) as { filename: string } | undefined
  if (!review) {
    res.status(404).json({ error: 'Отзыв не найден' })
    return
  }
  if (!review.filename.startsWith('/')) {
    const oldPath = join(uploadsDir, review.filename)
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath)
    }
  }
  db.prepare('UPDATE reviews SET filename = ? WHERE id = ?').run(file.filename, req.params.id)
  res.json({ ok: true, filename: file.filename })
})

app.delete('/api/reviews/:id', authMiddleware, (req, res) => {
  const review = db.prepare('SELECT filename FROM reviews WHERE id = ?').get(req.params.id) as { filename: string } | undefined
  if (review) {
    const filePath = join(uploadsDir, review.filename)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id)
  }
  res.json({ ok: true })
})

// ============ CHATBOT ============

const chatRateLimit = new Map<string, number[]>()
const CHAT_LIMIT = 30
const CHAT_WINDOW_MS = 10 * 60 * 1000

app.post('/api/chat', async (req, res) => {
  const ip = req.ip || 'unknown'
  const now = Date.now()
  const hits = (chatRateLimit.get(ip) || []).filter((t) => now - t < CHAT_WINDOW_MS)
  if (hits.length >= CHAT_LIMIT) {
    res.status(429).json({ error: 'Слишком много сообщений. Попробуйте позже.' })
    return
  }
  hits.push(now)
  chatRateLimit.set(ip, hits)

  try {
    const sessionId = typeof req.body?.session_id === 'string' && /^[a-zA-Z0-9_-]{16,80}$/.test(req.body.session_id)
      ? req.body.session_id
      : ''
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : []
    const latestUserMessage = [...messages].reverse().find((message) => message?.role === 'user' && typeof message?.content === 'string')
    if (sessionId && latestUserMessage?.content) {
      db.prepare(`
        UPDATE application_files SET description = ?
        WHERE session_id = ? AND application_id IS NULL AND description = ''
      `).run(String(latestUserMessage.content).slice(0, 1000), sessionId)
    }
    const result = await handleChat(messages, sessionId)
    res.json(result)
  } catch (err) {
    console.error('[chat] error:', err)
    res.status(500).json({
      error: 'Не получилось ответить. Напишите Виталию напрямую: https://t.me/ramcy_graffiti',
    })
  }
})

// Файлы из чата сохраняются до создания заявки и привязываются по session_id
const chatUpload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.ai', '.pdf', '.eps', '.zip']
    const ext = extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Недопустимый формат файла'))
    }
  },
})

app.post('/api/chat/file', chatUpload.single('file'), (req, res) => {
  const file = req.file
  const sessionId = typeof req.body?.session_id === 'string' && /^[a-zA-Z0-9_-]{16,80}$/.test(req.body.session_id)
    ? req.body.session_id
    : ''
  if (!file || !sessionId) {
    if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path)
    res.status(400).json({ error: !file ? 'Нет файла' : 'Некорректная сессия чата' })
    return
  }
  const result = db.prepare(`
    INSERT INTO application_files (session_id, filename, original_name)
    VALUES (?, ?, ?)
  `).run(sessionId, file.filename, file.originalname.slice(0, 255))
  res.json({ ok: true, id: Number(result.lastInsertRowid), filename: file.filename })
})

// ============ APPLICATIONS ============

// Публичная заявка из контактной формы
app.post('/api/applications', async (req, res) => {
  const ip = req.ip || 'unknown'
  const now = Date.now()
  const hits = (chatRateLimit.get(`form:${ip}`) || []).filter((t) => now - t < CHAT_WINDOW_MS)
  if (hits.length >= 10) {
    res.status(429).json({ error: 'Слишком много заявок. Попробуйте позже.' })
    return
  }
  hits.push(now)
  chatRateLimit.set(`form:${ip}`, hits)

  const { name, phone, email, contact_method, messenger_contact, design_idea } = req.body as Record<string, string>
  if (!name?.trim() || !phone?.trim() || !contact_method?.trim() || !messenger_contact?.trim()) {
    res.status(400).json({ error: 'Укажите имя, телефон, способ связи и контакт мессенджера' })
    return
  }
  if (phone.replace(/\D/g, '').length < 10) {
    res.status(400).json({ error: 'Укажите корректный номер телефона' })
    return
  }
  if (email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ error: 'Укажите корректный email' })
    return
  }
  const result = db.prepare(`
    INSERT INTO applications (name, phone, email, contact_method, contact_details, messenger_contact, design_idea, delivery_method, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Обсудить лично с Виталием', 'form')
  `).run(
    String(name).slice(0, 120),
    String(phone).slice(0, 40),
    String(email || '').slice(0, 200),
    String(contact_method).slice(0, 40),
    String(messenger_contact).slice(0, 300),
    String(messenger_contact).slice(0, 300),
    String(design_idea || '').slice(0, 2000),
  )

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  try {
    await sendMessage(
      `<b>Новая заявка #${Number(result.lastInsertRowid)} (форма на сайте)</b>\n\n` +
      `<b>Имя:</b> ${esc(String(name))}\n<b>Телефон:</b> ${esc(String(phone))}\n` +
      `<b>Email:</b> ${esc(String(email || 'не указан'))}\n` +
      `<b>Связь:</b> ${esc(String(contact_method))} — ${esc(String(messenger_contact))}\n` +
      `<b>Пожелания:</b> ${esc(String(design_idea || '—'))}`
    )
  } catch (err) {
    console.error('[applications] telegram notify failed:', err)
  }
  res.json({ ok: true, id: Number(result.lastInsertRowid) })
})

app.get('/api/applications', authMiddleware, (req, res) => {
  const apps = db.prepare('SELECT * FROM applications ORDER BY created_at DESC').all() as Array<Record<string, unknown> & { id: number }>
  const getFiles = db.prepare(`
    SELECT id, filename, original_name, description FROM application_files
    WHERE application_id = ? ORDER BY created_at
  `)
  res.json(apps.map((application) => ({ ...application, files: getFiles.all(application.id) })))
})

const APPLICATION_STATUSES = ['new', 'in_progress', 'contacted', 'done', 'cancelled']

app.patch('/api/applications/:id', authMiddleware, (req, res) => {
  const { status, admin_comment } = req.body as { status?: string; admin_comment?: string }
  const existing = db.prepare('SELECT id FROM applications WHERE id = ?').get(req.params.id)
  if (!existing) {
    res.status(404).json({ error: 'Заявка не найдена' })
    return
  }
  if (status !== undefined && !APPLICATION_STATUSES.includes(status)) {
    res.status(400).json({ error: 'Недопустимый статус' })
    return
  }
  if (status !== undefined) {
    db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, req.params.id)
  }
  if (admin_comment !== undefined) {
    db.prepare('UPDATE applications SET admin_comment = ? WHERE id = ?').run(String(admin_comment), req.params.id)
  }
  res.json({ ok: true })
})

app.delete('/api/applications/:id', authMiddleware, (req, res) => {
  const files = db.prepare('SELECT filename FROM application_files WHERE application_id = ?').all(req.params.id) as Array<{ filename: string }>
  db.prepare('DELETE FROM applications WHERE id = ?').run(req.params.id)
  for (const file of files) {
    const filePath = join(uploadsDir, file.filename)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }
  res.json({ ok: true })
})

// ============ HEALTH ============

app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: Date.now() })
})

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`)
})
