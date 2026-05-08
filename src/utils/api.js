const USER_KEY = 'p888_user'
const TOKEN_KEY = 'p888_token'

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) || null
}

export function setSession(user, token) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  if (token) localStorage.setItem(TOKEN_KEY, token)
}

export function clearSession() {
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(TOKEN_KEY)
}

export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {})
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  const token = getStoredToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  } else {
    const user = getStoredUser()
    if (user?.id) headers.set('X-User-ID', user.id)
  }

  const res = await fetch(path, { ...options, headers })

  if (res.status === 401) {
    clearSession()
    window.dispatchEvent(new CustomEvent('p888:session-expired'))
  }

  return res
}
