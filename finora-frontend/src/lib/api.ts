const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '')

type ApiErrorBody = {
  detail?: string | Array<{ msg?: string; message?: string }>
  message?: string
  error?: string
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Verifique se a API está disponível.', 0)
  }

  const contentType = response.headers.get('content-type') || ''
  const body = contentType.includes('application/json')
    ? await response.json().catch(() => null) as ApiErrorBody | null
    : null

  if (!response.ok) {
    let message = body?.message || body?.error || body?.detail
    if (Array.isArray(message)) {
      message = message.map((item) => item.msg || item.message).filter(Boolean).join(' ')
    }
    throw new ApiError(typeof message === 'string' ? message : 'O servidor não conseguiu concluir a solicitação.', response.status)
  }

  return body as T
}

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<void>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (name: string, email: string, password: string) =>
    apiRequest<void>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),

  requestPasswordReset: (email: string) =>
    apiRequest<void>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  resetPassword: (token: string, password: string) =>
    apiRequest<void>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),

  me: () => apiRequest<{ id: string; name: string; email: string }>('/auth/me'),

  logout: () => apiRequest<void>('/auth/logout', { method: 'POST' }),
}
