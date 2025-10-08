// Service Worker for Drawing Marking Section - Offline Support
const CACHE_NAME = 'drawing-marking-v1'
const STATIC_CACHE_NAME = 'static-assets-v1'
const DYNAMIC_CACHE_NAME = 'dynamic-content-v1'
const OFFLINE_CACHE_NAME = 'offline-drawings-v1'

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/mobile',
  '/mobile/markup-tool',
  '/modules/mobile/styles/upload.css',
  '/offline.html',
]

// Drawing-related API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/partner\/sites\/.*\/documents/,
  /\/api\/markup-documents\/list/,
  /\/api\/announcements/,
]

// Image and document patterns to cache
const MEDIA_CACHE_PATTERNS = [/\.(jpg|jpeg|png|webp|svg|gif)$/i, /\.(pdf|dwg)$/i, /\/documents\//]

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Installing...')

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(cache => {
      console.log('[ServiceWorker] Caching static assets')
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.error('[ServiceWorker] Failed to cache static assets:', err)
        // Continue installation even if some assets fail
        return Promise.resolve()
      })
    })
  )

  // Skip waiting to activate immediately
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activating...')

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            // Keep only current cache versions
            return ![
              CACHE_NAME,
              STATIC_CACHE_NAME,
              DYNAMIC_CACHE_NAME,
              OFFLINE_CACHE_NAME,
            ].includes(cacheName)
          })
          .map(cacheName => {
            console.log('[ServiceWorker] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    })
  )

  // Take control of all clients immediately
  self.clients.claim()
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return
  }

  // Skip Next.js internals and dev assets to avoid hydration/HMR issues
  // Do not cache or intercept framework chunks, HMR, RSC/flight, webpack, or static runtime files
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/__nextjs/') ||
    url.pathname.startsWith('/__next/') ||
    url.pathname.includes('webpack') ||
    url.pathname.includes('/_next/static') ||
    url.search.includes('__next') ||
    url.pathname.endsWith('.rsc')
  ) {
    return
  }

  // Handle API requests with network-first strategy
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(networkFirstStrategy(request))
    return
  }

  // Handle media files with cache-first strategy
  if (MEDIA_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(cacheFirstStrategy(request))
    return
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/offline.html')
      })
    )
    return
  }

  // Default strategy: network with cache fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone()
          caches.open(DYNAMIC_CACHE_NAME).then(cache => {
            cache.put(request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        return caches.match(request)
      })
  )
})

// Network-first strategy for API calls
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request)

    // Cache successful API responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log('[ServiceWorker] Network request failed, trying cache:', request.url)

    // Try to get from cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Return offline response for API calls
    return new Response(
      JSON.stringify({
        success: false,
        offline: true,
        message: '오프라인 상태입니다. 캐시된 데이터를 표시합니다.',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

// Cache-first strategy for media files
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request)

  if (cachedResponse) {
    // Return cached version and update cache in background
    fetch(request).then(response => {
      if (response.status === 200) {
        caches.open(DYNAMIC_CACHE_NAME).then(cache => {
          cache.put(request, response)
        })
      }
    })

    return cachedResponse
  }

  // Not in cache, fetch from network
  try {
    const networkResponse = await fetch(request)

    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.error('[ServiceWorker] Failed to fetch media:', request.url)
    // Return a placeholder image for failed image requests
    if (/\.(jpg|jpeg|png|webp|svg|gif)$/i.test(request.url)) {
      return caches.match('/placeholder-image.png')
    }
    throw error
  }
}

// Message handler for offline drawing storage
self.addEventListener('message', event => {
  if (event.data.type === 'CACHE_DRAWING') {
    cacheDrawingOffline(event.data.drawing)
  } else if (event.data.type === 'GET_OFFLINE_DRAWINGS') {
    getOfflineDrawings().then(drawings => {
      event.ports[0].postMessage({ drawings })
    })
  } else if (event.data.type === 'CLEAR_OFFLINE_CACHE') {
    clearOfflineCache()
  }
})

// Cache drawing for offline access
async function cacheDrawingOffline(drawing) {
  const cache = await caches.open(OFFLINE_CACHE_NAME)

  // Store drawing metadata
  const metadataRequest = new Request(`/offline-drawings/${drawing.id}/metadata`)
  const metadataResponse = new Response(JSON.stringify(drawing), {
    headers: { 'Content-Type': 'application/json' },
  })
  await cache.put(metadataRequest, metadataResponse)

  // Cache the actual image file
  if (drawing.fileUrl) {
    try {
      const imageResponse = await fetch(drawing.fileUrl)
      if (imageResponse.status === 200) {
        const imageRequest = new Request(`/offline-drawings/${drawing.id}/image`)
        await cache.put(imageRequest, imageResponse)
      }
    } catch (error) {
      console.error('[ServiceWorker] Failed to cache drawing image:', error)
    }
  }

  console.log('[ServiceWorker] Drawing cached for offline:', drawing.id)
}

// Get all offline cached drawings
async function getOfflineDrawings() {
  const cache = await caches.open(OFFLINE_CACHE_NAME)
  const requests = await cache.keys()

  const drawings = []
  for (const request of requests) {
    if (request.url.includes('/metadata')) {
      const response = await cache.match(request)
      if (response) {
        const drawing = await response.json()
        drawings.push(drawing)
      }
    }
  }

  return drawings
}

// Clear offline cache
async function clearOfflineCache() {
  await caches.delete(OFFLINE_CACHE_NAME)
  console.log('[ServiceWorker] Offline cache cleared')
}

// Background sync for uploading drawings when online
self.addEventListener('sync', event => {
  if (event.tag === 'sync-drawings') {
    event.waitUntil(syncOfflineDrawings())
  }
})

async function syncOfflineDrawings() {
  console.log('[ServiceWorker] Syncing offline drawings...')

  // Get offline drawings from IndexedDB or cache
  const drawings = await getOfflineDrawings()

  for (const drawing of drawings) {
    try {
      // Attempt to upload to server
      const response = await fetch('/api/drawings/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(drawing),
      })

      if (response.ok) {
        // Remove from offline cache if successful
        const cache = await caches.open(OFFLINE_CACHE_NAME)
        await cache.delete(`/offline-drawings/${drawing.id}/metadata`)
        await cache.delete(`/offline-drawings/${drawing.id}/image`)
        console.log('[ServiceWorker] Drawing synced:', drawing.id)
      }
    } catch (error) {
      console.error('[ServiceWorker] Failed to sync drawing:', drawing.id, error)
    }
  }
}
