/* Minimal service worker for documents upload queue */
const DB_NAME = 'docs-uploads'
const STORE = 'queue'

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const db = await openDb()
      db.close()
      self.skipWaiting()
    })()
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('sync', event => {
  if (event.tag === 'docs-upload-sync') {
    event.waitUntil(processQueue())
  }
})

self.addEventListener('message', event => {
  if (event.data === 'process-queue') {
    event.waitUntil(processQueue())
  }
})

async function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
      }
    }
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
  })
}

async function getAllQueue() {
  const db = await openDb()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const store = tx.objectStore(STORE)
      const req = store.getAll()
      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

async function deleteItem(id) {
  const db = await openDb()
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      const store = tx.objectStore(STORE)
      const req = store.delete(id)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

async function processQueue() {
  const items = await getAllQueue()
  for (const item of items) {
    try {
      const form = new FormData()
      if (item.fields) {
        for (const [k, v] of Object.entries(item.fields)) {
          if (k !== 'file') form.append(k, v)
        }
      }
      const file = new File([item.fileData], item.filename || 'upload.bin', {
        type: item.fileType || 'application/octet-stream',
      })
      form.append('file', file)
      const res = await fetch(item.endpoint, { method: 'POST', body: form })
      if (!res.ok) throw new Error('upload failed')
      await deleteItem(item.id)
    } catch (e) {
      // keep in queue; try next time
    }
  }
}
