import db from './db.js'

// Существующие работы из хардкода App.tsx
const works = [
  { name: 'Mash', size: '90 см', image: '/images/IMG_9801.webp' },
  { name: 'Tipadima', size: '60 см', image: '/images/IMG_7579.webp' },
  { name: 'DJ ПЛАЩ', size: '60 см', image: '/images/IMG_8730.webp' },
  { name: 'Magu', size: '60 см', image: '/images/IMG_9767.webp' },
  { name: 'Traffic', size: '95 см', image: '/images/IMG_6804.webp' },
  { name: 'Graffitimarket', size: '90 см', image: '/images/IMG_9422.webp' },
  { name: 'Около', size: '60 см', image: '/images/IMG_9590.webp' },
  { name: 'Ustyles', size: '60 см', image: '/images/IMG_0001.webp' },
  { name: 'Arton', size: '60 см', image: '/images/IMG_0002.webp' },
  { name: 'Break dance', size: '60 см', image: '/images/IMG_0003.webp' },
  { name: 'Traffic', size: '95 см', image: '/images/IMG_9999.webp' },
  { name: 'Custom / 01', size: '60 см', image: '/images/IMG_9976.webp' },
]

const reviews = [
  '/images/IMG_9990.jpeg', '/images/IMG_9982.jpeg', '/images/IMG_9980.jpeg',
  '/images/IMG_9981.jpeg', '/images/IMG_9983.jpeg', '/images/IMG_9984.jpeg',
  '/images/IMG_9985.jpeg', '/images/IMG_9988.jpeg', '/images/IMG_9987.jpeg',
  '/images/IMG_9992.jpeg', '/images/IMG_9991.jpeg', '/images/IMG_9993.jpeg',
  '/images/IMG_9994.jpeg', '/images/IMG_9995.jpeg', '/images/IMG_9996.jpeg',
  '/images/IMG_9997.jpeg', '/images/IMG_9973.jpeg', '/images/IMG_9968.jpeg',
]

const existingProducts = db.prepare('SELECT COUNT(*) as c FROM products').get() as { c: number }
const existingReviews = db.prepare('SELECT COUNT(*) as c FROM reviews').get() as { c: number }

if (existingProducts.c > 0) {
  console.log(`Товары уже есть в базе (${existingProducts.c}), пропускаю сид`)
} else {
  const catId = (size: string): number | null => {
    const slug = size.includes('90') || size.includes('95') ? '90cm' : size.includes('40') ? '40cm' : size.toLowerCase().includes('custom') ? 'custom' : '60cm'
    const row = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug) as { id: number } | undefined
    return row?.id ?? null
  }

  const insertProduct = db.prepare(
    'INSERT INTO products (name, size, description, price, category_id, is_published, sort_order) VALUES (?, ?, ?, ?, ?, 1, ?)',
  )
  const insertImage = db.prepare('INSERT INTO product_images (product_id, filename, sort_order) VALUES (?, ?, 0)')

  works.forEach((work, i) => {
    const result = insertProduct.run(work.name, work.size, '', '', catId(work.size), i)
    insertImage.run(result.lastInsertRowid, work.image)
  })
  console.log(`Добавлено ${works.length} работ`)
}

if (existingReviews.c > 0) {
  console.log(`Отзывы уже есть в базе (${existingReviews.c}), пропускаю сид`)
} else {
  const insertReview = db.prepare('INSERT INTO reviews (filename) VALUES (?)')
  reviews.forEach((r) => insertReview.run(r))
  console.log(`Добавлено ${reviews.length} отзывов`)
}

console.log('Сид завершён')
