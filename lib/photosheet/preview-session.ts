type PreviewData = {
  title: string
  siteId?: string | null
  siteName: string
  rows: number
  cols: number
  orientation: 'portrait' | 'landscape'
  items: Array<{
    id: string
    member?: string
    process?: string
    content?: string
    stage?: 'before' | 'after'
    previewUrl?: string
  }>
  templateMode?: boolean
  sheetId?: string | null
}

type SessionValue = { data: PreviewData; expiresAt: number }

function getStore(): Map<string, SessionValue> {
  const g = globalThis as unknown as { __PHOTO_SHEET_SESSIONS?: Map<string, SessionValue> }
  if (!g.__PHOTO_SHEET_SESSIONS) {
    g.__PHOTO_SHEET_SESSIONS = new Map<string, SessionValue>()
  }
  return g.__PHOTO_SHEET_SESSIONS!
}

export function createSession(data: PreviewData, ttlMs = 10 * 60 * 1000) {
  const id = `ps_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const store = getStore()
  cleanup(store)
  store.set(id, { data, expiresAt: Date.now() + Math.max(30_000, ttlMs) })
  return id
}

export function getSession(id: string): PreviewData | null {
  const store = getStore()
  const v = store.get(id)
  if (!v) return null
  if (Date.now() > v.expiresAt) {
    store.delete(id)
    return null
  }
  return v.data
}

function cleanup(store: Map<string, SessionValue>) {
  const now = Date.now()
  for (const [k, v] of store.entries()) {
    if (now > v.expiresAt) store.delete(k)
  }
}
