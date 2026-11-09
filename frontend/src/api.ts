const TOKEN_KEY = 'lf_token'

export const auth = {
  get token(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(TOKEN_KEY)
  },
  set(t: string | null) {
    if (t) localStorage.setItem(TOKEN_KEY, t)
    else localStorage.removeItem(TOKEN_KEY)
  },
  isAuthed() {
    return Boolean(this.token)
  },
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) }
  if (init.body && typeof init.body === 'string' && !headers['content-type']) {
    headers['content-type'] = 'application/json'
  }
  const token = auth.token
  if (token) headers['authorization'] = `Bearer ${token}`

  const res = await fetch(path, { ...init, headers })

  if (!res.ok) {
    let msg = `Greška (${res.status})`
    try {
      const j = await res.json()
      if (j.error) msg = j.error
    } catch {
      /* ignore */
    }
    if (res.status === 401) auth.set(null)
    throw new Error(msg)
  }
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, body?: unknown) => request<T>(p, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(p: string, body?: unknown) => request<T>(p, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) }),
  del: <T>(p: string) => request<T>(p, { method: 'DELETE' }),

  async upload(key: string, blob: Blob): Promise<void> {
    const token = auth.token
    const res = await fetch(`/api/admin/files/${key}`, {
      method: 'PUT',
      headers: { authorization: `Bearer ${token}`, 'content-type': blob.type || 'image/webp' },
      body: blob,
    })
    if (!res.ok) throw new Error('Upload nije uspio')
  },
}
