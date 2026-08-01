// src/api/client.ts
// ─── API Client (fetch-based, no external dependencies) ───

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api'

async function getToken(): Promise<string | null> {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('vriddhi_auth_token') ||
    null
  )
}

function getHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const collegeId = localStorage.getItem('vriddhi_college_id')
  if (collegeId) headers['X-College-Id'] = collegeId

  return headers
}

async function handleResponse<T>(res: Response): Promise<{ data: T }> {
  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('vriddhi_auth_token')
    window.location.href = '/login'
    throw new Error('Unauthorized — please log in again')
  }
  if (res.status === 429) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.message || 'Rate limit exceeded. Please wait before retrying.')
  }
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.message || `API error: ${res.status}`)
  }
  const data = (await res.json()) as T
  return { data }
}

// ─── GET ────────────────────────────────────────────────────────────────
export async function apiGet<T>(path: string, params?: Record<string, any>): Promise<{ data: T }> {
  const token = await getToken()
  const url = new URL(`${BASE_URL}${path}`, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value))
      }
    })
  }
  const res = await fetch(url.toString(), {
    headers: getHeaders(token),
  })
  return handleResponse<T>(res)
}

// ─── POST ───────────────────────────────────────────────────────────────
export async function apiPost<T>(path: string, body: unknown): Promise<{ data: T }> {
  const token = await getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(body),
  })
  return handleResponse<T>(res)
}

// ─── PUT ────────────────────────────────────────────────────────────────
export async function apiPut<T>(path: string, body: unknown): Promise<{ data: T }> {
  const token = await getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(body),
  })
  return handleResponse<T>(res)
}

// ─── DELETE ─────────────────────────────────────────────────────────────
export async function apiDelete<T = void>(path: string): Promise<{ data: T }> {
  const token = await getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  })
  return handleResponse<T>(res)
}

// ─── PATCH ──────────────────────────────────────────────────────────────
export async function apiPatch<T>(path: string, body: unknown): Promise<{ data: T }> {
  const token = await getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify(body),
  })
  return handleResponse<T>(res)
}

// ─── Axios-compatible apiClient wrapper ─────────────────────────────────
export const apiClient = {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  patch: apiPatch,
}

export default apiClient
