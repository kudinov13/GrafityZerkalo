import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'

// Seeded rows store full site paths (/images/...); uploaded files are bare
// filenames served from /uploads/.
function imgUrl(filename: string): string {
  return filename.startsWith('/') ? filename : `/uploads/${filename}`
}

type Category = { id: number; name: string; slug: string }
type Product = {
  id: number
  name: string
  size: string
  description: string
  price: string
  category_id: number | null
  category_name: string | null
  category_slug: string | null
  is_published: number
  sort_order: number
  cover: string | null
  images?: Array<{ id: number; filename: string; sort_order: number }>
}

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { token } = await api.login(username, password)
      api.setToken(token)
      onLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login">
      <form onSubmit={handleSubmit} className="admin-login__form">
        <h1>Вход в админ-панель</h1>
        {error && <div className="admin-error">{error}</div>}
        <label>
          Логин
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" autoComplete="username" />
        </label>
        <label>
          Пароль
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
        </label>
        <button type="submit" disabled={loading}>{loading ? 'Вход...' : 'Войти'}</button>
      </form>
    </div>
  )
}

function ProductForm({ product, categories, onSave, onCancel }: {
  product: Product | null
  categories: Category[]
  onSave: (data: Record<string, unknown>, files: File[]) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(product?.name || '')
  const [size, setSize] = useState(product?.size || '')
  const [description, setDescription] = useState(product?.description || '')
  const [price, setPrice] = useState(product?.price || '')
  const [categoryId, setCategoryId] = useState<string>(product?.category_id ? String(product.category_id) : '')
  const [isPublished, setIsPublished] = useState(product ? Boolean(product.is_published) : true)
  const [sortOrder, setSortOrder] = useState(product?.sort_order || 0)
  const [files, setFiles] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<Array<{ id: number; filename: string }>>(product?.images || [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const handleDeleteImage = async (imageId: number) => {
    if (!product) return
    try {
      await api.deleteProductImage(product.id, imageId)
      setExistingImages(existingImages.filter((img) => img.id !== imageId))
    } catch (err) {
      alert('Ошибка удаления изображения')
    }
  }

  const handleSetCover = async (imageId: number) => {
    if (!product) return
    try {
      await api.setProductCover(product.id, imageId)
      const target = existingImages.find((img) => img.id === imageId)
      if (target) {
        setExistingImages([target, ...existingImages.filter((img) => img.id !== imageId)])
      }
    } catch {
      alert('Ошибка установки обложки')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name,
      size,
      description,
      price,
      category_id: categoryId ? Number(categoryId) : null,
      is_published: isPublished,
      sort_order: sortOrder,
    }, files)
  }

  return (
    <form className="admin-product-form" onSubmit={handleSubmit}>
      <h2>{product ? 'Редактировать товар' : 'Новый товар'}</h2>
      <label>
        Название *
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Mash" />
      </label>
      <label>
        Размер *
        <input type="text" value={size} onChange={(e) => setSize(e.target.value)} required placeholder="90 см" />
      </label>
      <label>
        Цена
        <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="12 500 ₽" />
      </label>
      <label>
        Категория
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Без категории</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </label>
      <label>
        Описание
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Описание товара" />
      </label>
      <label>
        Порядок сортировки
        <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
      </label>
      <label className="admin-checkbox">
        <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
        Опубликован
      </label>

      {existingImages.length > 0 && (
        <div className="admin-existing-images">
          <p>Текущие изображения:</p>
          <div className="admin-images-grid">
            {existingImages.map((img, index) => (
              <div key={img.id} className="admin-image-item">
                <img src={imgUrl(img.filename)} alt="" />
                {index === 0 ? (
                  <span className="admin-image-cover" title="Обложка товара">★</span>
                ) : (
                  <button type="button" className="admin-image-cover-btn" title="Сделать обложкой" onClick={() => handleSetCover(img.id)}>☆</button>
                )}
                <button type="button" onClick={() => handleDeleteImage(img.id)}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <label>
        Загрузить изображения
        <input type="file" multiple accept="image/*" onChange={handleFileChange} />
      </label>

      {files.length > 0 && (
        <div className="admin-files-preview">
          <p>Выбрано файлов: {files.length}</p>
          <div className="admin-images-grid">
            {files.map((file, i) => (
              <img key={i} src={URL.createObjectURL(file)} alt="" />
            ))}
          </div>
        </div>
      )}

      <div className="admin-form-actions">
        <button type="submit" className="admin-btn-primary">Сохранить</button>
        <button type="button" className="admin-btn-secondary" onClick={onCancel}>Отмена</button>
      </div>
    </form>
  )
}

function CategoryManager({ categories, onRefresh }: {
  categories: Category[]
  onRefresh: () => void
}) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !slug) return
    try {
      await api.createCategory(name, slug)
      setName('')
      setSlug('')
      onRefresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить категорию?')) return
    try {
      await api.deleteCategory(id)
      onRefresh()
    } catch {
      alert('Ошибка удаления')
    }
  }

  return (
    <div className="admin-categories">
      <h2>Категории</h2>
      <form onSubmit={handleAdd} className="admin-category-form">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Название" />
        <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug (например, 60cm)" />
        <button type="submit">Добавить</button>
      </form>
      <div className="admin-category-list">
        {categories.map((cat) => (
          <div key={cat.id} className="admin-category-item">
            <span>{cat.name}</span>
            <code>{cat.slug}</code>
            <button type="button" onClick={() => handleDelete(cat.id)}>Удалить</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReviewsManager({ onRefresh }: { onRefresh: () => void }) {
  const [reviews, setReviews] = useState<Array<{ id: number; filename: string }>>([])
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)

  const loadReviews = useCallback(async () => {
    try {
      const data = await api.getReviews()
      setReviews(data)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0) return
    setLoading(true)
    try {
      await api.uploadReviews(files)
      setFiles([])
      loadReviews()
      onRefresh()
    } catch {
      alert('Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  const handleReplace = async (id: number, file: File | undefined) => {
    if (!file) return
    try {
      await api.replaceReview(id, file)
      loadReviews()
    } catch {
      alert('Ошибка замены')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить отзыв?')) return
    try {
      await api.deleteReview(id)
      loadReviews()
    } catch {
      alert('Ошибка удаления')
    }
  }

  return (
    <div className="admin-reviews">
      <h2>Отзывы</h2>
      <form onSubmit={handleUpload} className="admin-reviews-form">
        <input type="file" multiple accept="image/*" onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])} />
        <button type="submit" disabled={loading || files.length === 0}>{loading ? 'Загрузка...' : 'Загрузить'}</button>
      </form>
      <div className="admin-reviews-grid">
        {reviews.map((rev) => (
          <div key={rev.id} className="admin-review-item">
            <img src={imgUrl(rev.filename)} alt="Отзыв" />
            <label className="admin-review-replace" title="Заменить фото">
              ⟳
              <input type="file" accept="image/*" hidden onChange={(e) => handleReplace(rev.id, e.target.files?.[0])} />
            </label>
            <button type="button" onClick={() => handleDelete(rev.id)}>×</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminPanel({ onExit }: { onExit: () => void }) {
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [tab, setTab] = useState<'products' | 'categories' | 'reviews'>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)

  const checkAuth = useCallback(async () => {
    if (!api.isLoggedIn()) {
      setChecking(false)
      return
    }
    try {
      await api.checkAuth()
      setAuthed(true)
    } catch {
      api.logout()
    } finally {
      setChecking(false)
    }
  }, [])

  const loadProducts = useCallback(async () => {
    try {
      const data = await api.getAllProducts()
      setProducts(data as Product[])
    } catch {
      // ignore
    }
  }, [])

  const loadCategories = useCallback(async () => {
    try {
      const data = await api.getCategories()
      setCategories(data)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (authed) {
      loadProducts()
      loadCategories()
    }
  }, [authed, loadProducts, loadCategories])

  const handleLogin = () => {
    setAuthed(true)
  }

  const handleLogout = () => {
    api.logout()
    setAuthed(false)
    onExit()
  }

  const handleSaveProduct = async (data: Record<string, unknown>, files: File[]) => {
    setLoading(true)
    try {
      if (editProduct) {
        await api.updateProduct(editProduct.id, data)
        if (files.length > 0) {
          await api.uploadProductImages(editProduct.id, files)
        }
      } else {
        const result = await api.createProduct(data)
        if (files.length > 0) {
          await api.uploadProductImages(result.id, files)
        }
      }
      setShowForm(false)
      setEditProduct(null)
      loadProducts()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setLoading(false)
    }
  }

  const handleEditProduct = async (product: Product) => {
    try {
      const full = await api.getProduct(product.id)
      setEditProduct(full as Product)
      setShowForm(true)
    } catch {
      alert('Ошибка загрузки товара')
    }
  }

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Удалить товар?')) return
    try {
      await api.deleteProduct(id)
      loadProducts()
    } catch {
      alert('Ошибка удаления')
    }
  }

  if (checking) {
    return <div className="admin-loading">Проверка авторизации...</div>
  }

  if (!authed) {
    return <AdminLogin onLogin={handleLogin} />
  }

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <h1>Админ-панель RAMCY</h1>
        <div className="admin-header__actions">
          <button type="button" onClick={() => { setShowForm(true); setEditProduct(null) }} className="admin-btn-primary">
            + Новый товар
          </button>
          <button type="button" onClick={handleLogout} className="admin-btn-secondary">
            Выйти
          </button>
          <button type="button" onClick={onExit} className="admin-btn-secondary">
            На сайт
          </button>
        </div>
      </header>

      <nav className="admin-tabs">
        <button type="button" className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>Товары ({products.length})</button>
        <button type="button" className={tab === 'categories' ? 'active' : ''} onClick={() => setTab('categories')}>Категории ({categories.length})</button>
        <button type="button" className={tab === 'reviews' ? 'active' : ''} onClick={() => setTab('reviews')}>Отзывы</button>
      </nav>

      {showForm && (
        <ProductForm
          product={editProduct}
          categories={categories}
          onSave={handleSaveProduct}
          onCancel={() => { setShowForm(false); setEditProduct(null) }}
        />
      )}

      {tab === 'products' && !showForm && (
        <div className="admin-products-list">
          {products.length === 0 && <p className="admin-empty">Товаров пока нет. Создайте первый!</p>}
          {products.map((product) => (
            <div key={product.id} className="admin-product-card">
              <div className="admin-product-card__image">
                {product.cover ? (
                  <img src={imgUrl(product.cover)} alt={product.name} />
                ) : (
                  <div className="admin-no-image">Нет фото</div>
                )}
              </div>
              <div className="admin-product-card__info">
                <h3>{product.name}</h3>
                <span>{product.size}</span>
                {product.price && <span>{product.price}</span>}
                {product.category_name && <span className="admin-tag">{product.category_name}</span>}
                <span className={product.is_published ? 'admin-status admin-status--published' : 'admin-status admin-status--draft'}>
                  {product.is_published ? 'Опубликован' : 'Черновик'}
                </span>
              </div>
              <div className="admin-product-card__actions">
                <button type="button" onClick={() => handleEditProduct(product)}>Редактировать</button>
                <button type="button" onClick={() => handleDeleteProduct(product.id)} className="admin-btn-danger">Удалить</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'categories' && (
        <CategoryManager categories={categories} onRefresh={loadCategories} />
      )}

      {tab === 'reviews' && (
        <ReviewsManager onRefresh={() => {}} />
      )}

      {loading && <div className="admin-overlay">Сохранение...</div>}
    </div>
  )
}
