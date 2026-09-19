import express from 'express'
import cors from 'cors'
import multer from 'multer'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'url'
import { dirname, join, extname } from 'path'
import fs from 'fs'

import db from './db.js'
import { authMiddleware, generateToken, AuthRequest } from './auth.js'

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

// ============ HEALTH ============

app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: Date.now() })
})

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`)
})
