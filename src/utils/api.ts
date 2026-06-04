import { getActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'
import { useAlertStore } from '@/stores/alert.store'

const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

const buildUrl = (path: string) => {
  if (path.startsWith('http')) return path
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`
}

const getAuthToken = () => {
  return localStorage.getItem('token')
}

const notifySessionExpired = () => {
  const pinia = getActivePinia()
  if (!pinia) return

  const alertStore = useAlertStore(pinia)
  alertStore.push({
    type: 'warning',
    message: 'Sesion expirada. Inicia sesion de nuevo.'
  })

  const authStore = useAuthStore(pinia)
  authStore.logout()
}

const notifyForbidden = () => {
  const pinia = getActivePinia()
  if (!pinia) return

  const alertStore = useAlertStore(pinia)
  alertStore.push({
    type: 'warning',
    message: 'No tienes permisos para esta accion.'
  })
}

const clearAuthAndRedirect = () => {
  localStorage.removeItem('user')
  localStorage.removeItem('token')
  localStorage.removeItem('currentRole')

  const currentPath = `${window.location.pathname}${window.location.search}`
  const loginUrl = `/auth/login?redirect=${encodeURIComponent(currentPath)}`
  if (window.location.pathname !== '/auth/login') {
    window.location.assign(loginUrl)
  }
}

const request = async (path: string, options: RequestInit = {}, retried = false) => {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const token = getAuthToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers
  })

  const isAuthRequest = path.startsWith('/auth/')

  if (!isAuthRequest && response.status === 401) {
    if (!retried) {
      const pinia = getActivePinia()
      if (pinia) {
        const authStore = useAuthStore(pinia)
        const refreshed = await authStore.refreshAccessToken()
        if (refreshed) {
          return request(path, options, true)
        }
      }
    }

    notifySessionExpired()
    clearAuthAndRedirect()
    throw new Error('Unauthorized')
  }

  if (!isAuthRequest && response.status === 403) {
    notifyForbidden()
    throw new Error('Forbidden')
  }

  if (!response.ok) {
    let message = 'Request failed'
    try {
      const data = await response.json()
      message = data?.message || message
    } catch {
      message = response.statusText || message
    }
    const err = new Error(message)
    // attach HTTP status for callers that want to handle specific codes
    ;(err as any).status = response.status
    throw err
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export const api = {
  get: (path: string) => request(path, { method: 'GET' }),
  post: (path: string, body?: unknown) => request(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined
  }),
  put: (path: string, body?: unknown) => request(path, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined
  }),
  patch: (path: string, body?: unknown) => request(path, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined
  }),
  delete: (path: string) => request(path, { method: 'DELETE' })
}
