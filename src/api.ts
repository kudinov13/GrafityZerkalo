const API_BASE = '/api'

function getToken(): string | null {
  return localStorage.getItem('admin_token')
}

function setToken(token: string): void {
  localStorage.setItem('admin_token', token)
}

function clearToken(): void {
  localStorage.removeItem('admin_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Ошибка сети' }))
    throw new Error(error.error || `HTTP ${res.status}`)
  }

  return res.json()
}

function uploadFiles<T>(path: string, formData: FormData, method = 'POST'): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: formData,
  }).then((res) => {
    if (!res.ok) throw new Error('Ошибка загрузки')
    return res.json()
  })
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request<{ token: string; username: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  checkAuth: () => request<{ ok: boolean; username: string }>('/auth/check'),
  logout: () => clearToken(),
  isLoggedIn: () => !!getToken(),

  // Categories
  getCategories: () => request<Array<{ id: number; name: string; slug: string }>>('/categories'),
  createCategory: (name: string, slug: string) =>
    request('/categories', { method: 'POST', body: JSON.stringify({ name, slug }) }),
  deleteCategory: (id: number) =>
    request(`/categories/${id}`, { method: 'DELETE' }),

  // Products
  getProducts: (category?: string) =>
    request<Array<Record<string, unknown>>>(`/products${category ? `?category=${category}` : ''}`),
  getAllProducts: () => request<Array<Record<string, unknown>>>('/products/all'),
  getProduct: (id: number) => request<Record<string, unknown>>(`/products/${id}`),
  createProduct: (data: Record<string, unknown>) =>
    request<{ id: number }>('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: number, data: Record<string, unknown>) =>
    request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: number) =>
    request(`/products/${id}`, { method: 'DELETE' }),
  uploadProductImages: (id: number, files: File[]) => {
    const formData = new FormData()
    files.forEach((file) => formData.append('images', file))
    return uploadFiles<{ ok: boolean; files: string[] }>(`/products/${id}/images`, formData)
  },
  deleteProductImage: (productId: number, imageId: number) =>
    request(`/products/${productId}/images/${imageId}`, { method: 'DELETE' }),
  setProductCover: (productId: number, imageId: number) =>
    request(`/products/${productId}/images/${imageId}/cover`, { method: 'POST' }),

  // Reviews
  getReviews: () => request<Array<{ id: number; filename: string }>>('/reviews'),
  uploadReviews: (files: File[]) => {
    const formData = new FormData()
    files.forEach((file) => formData.append('images', file))
    return uploadFiles<{ ok: boolean; files: string[] }>('/reviews', formData)
  },
  replaceReview: (id: number, file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    return uploadFiles<{ ok: boolean; filename: string }>(`/reviews/${id}`, formData, 'PUT')
  },
  deleteReview: (id: number) =>
    request(`/reviews/${id}`, { method: 'DELETE' }),

  // Utils
  setToken,
  getToken,
}

export type Api = typeof api
