import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dbPath = join(__dirname, 'data.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')

// Создаём таблицы
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    size TEXT NOT NULL,
    description TEXT DEFAULT '',
    price TEXT DEFAULT '',
    category_id INTEGER,
    is_published INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT DEFAULT '',
    width TEXT DEFAULT '',
    height TEXT DEFAULT '',
    design_idea TEXT DEFAULT '',
    sketch_type TEXT DEFAULT '',
    colors TEXT DEFAULT '',
    contact_method TEXT DEFAULT '',
    contact_details TEXT DEFAULT '',
    contact_time TEXT DEFAULT '',
    delivery_method TEXT DEFAULT '',
    comment TEXT DEFAULT '',
    source TEXT DEFAULT 'chatbot',
    status TEXT DEFAULT 'new',
    admin_comment TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );
`)

// Создаём админа по умолчанию, если таблица пуста
const adminExists = db.prepare('SELECT id FROM admins LIMIT 1').get()
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync('ramcy2026', 10)
  db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)').run('admin', hashedPassword)
  console.log('Создан админ по умолчанию: admin / ramcy2026')
}

// Создаём категории по умолчанию
const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number }
if (catCount.count === 0) {
  const insertCat = db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)')
  insertCat.run('60 см', '60cm')
  insertCat.run('90 см', '90cm')
  insertCat.run('40 см', '40cm')
  insertCat.run('Custom', 'custom')
  console.log('Созданы категории по умолчанию')
}

export default db
