// INOPNC Work Management System Service Worker
// Provides offline functionality and intelligent caching for construction sites

// Updated cache version to force refresh in PWA - Fixed manifest loop issue
const CACHE_NAME = 'inopnc-wm-v1.7.0'
const STATIC_CACHE = 'inopnc-static-v1.7.0'
const API_CACHE = 'inopnc-api-v1.7.0'
const IMAGES_CACHE = 'inopnc-images-v1.4.0'
const OFFLINE_PAGE = '/offline'

// Cache size limits for mobile devices
const MAX_CACHE_SIZE = 500 * 1024 * 1024 // 500MB total
const MAX_IMAGE_CACHE_SIZE = 200 * 1024 * 1024 // 200MB for images
const MAX_API_CACHE_SIZE = 50 * 1024 * 1024 // 50MB for API responses

// Critical pages that should always be cached
// NOTE: Auth pages removed to prevent login issues
const CRITICAL_PAGES = [
  '/',
  '/dashboard',
  '/dashboard/daily-reports',
  '/dashboard/attendance',
  '/dashboard/materials',
  '/dashboard/site-info',
  '/offline'
]

// Static assets to cache
const STATIC_ASSETS = [
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/manifest.json'
]

// API endpoints that should be cached
// IMPORTANT: Removed /api/sites/ from cache to ensure fresh data in PWA
const CACHEABLE_API_PATTERNS = [
  /\/api\/materials\//,
  /\/api\/daily-reports\//,
  /\/api\/attendance\//,
  /\/api\/notifications\//
  // NOTE: /api/sites/ removed to prevent stale site info in PWA
]

// Background sync tags
const SYNC_TAGS = {
  DAILY_REPORT: 'daily-report-sync',
  ATTENDANCE: 'attendance-sync',
  MATERIAL_REQUEST: 'material-request-sync',
  OFFLINE_ACTIONS: 'offline-actions-sync'
}

// Install event - cache critical resources
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Installing...')
  
  event.waitUntil(
    Promise.all([
      // Cache critical pages
      caches.open(CACHE_NAME).then(cache => {
        console.log('[ServiceWorker] Caching critical pages')
        return cache.addAll(CRITICAL_PAGES)
      }),
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[ServiceWorker] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
    ]).then(() => {
      console.log('[ServiceWorker] Installation complete')
      // Force activation of new service worker
      return self.skipWaiting()
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activating...')
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE && 
                cacheName !== API_CACHE && 
                cacheName !== IMAGES_CACHE) {
              console.log('[ServiceWorker] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      // Clear any cached auth pages from current caches
      caches.open(CACHE_NAME).then(cache => {
        return cache.keys().then(requests => {
          const authRequests = requests.filter(request => {
            const url = new URL(request.url)
            return url.pathname.includes('/auth/') || 
                   url.pathname === '/auth' ||
                   url.pathname.includes('/login') ||
                   url.pathname.includes('/signup')
          })
          return Promise.all(authRequests.map(request => {
            console.log('[ServiceWorker] Removing cached auth page:', request.url)
            return cache.delete(request)
          }))
        })
      }),
      // Take control of all pages
      self.clients.claim()
    ]).then(() => {
      console.log('[ServiceWorker] Activation complete')
    })
  )
})

// Fetch event - handle network requests with caching strategies
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)
  
  // CRITICAL FIX: Complete bypass for auth pages and their resources
  // Check if this is an auth-related request (page, API, or resources)
  const isAuthRelated = 
    url.pathname.includes('/auth') || 
    url.pathname.includes('/login') ||
    url.pathname.includes('/signup') ||
    url.pathname.includes('/signin') ||
    url.pathname.includes('/api/auth') ||
    url.pathname.includes('/reset-password') ||
    url.pathname.includes('/update-password') ||
    // Also bypass Next.js internal routes for auth pages
    (url.pathname.includes('/_next/') && request.referrer && 
     (request.referrer.includes('/auth') || 
      request.referrer.includes('/login') ||
      request.referrer.includes('/signup')))
  
  if (isAuthRelated) {
    // COMPLETELY BYPASS Service Worker for auth-related requests
    // Let the browser handle it normally without ANY intervention
    console.log('[ServiceWorker] Bypassing SW for auth-related request:', url.pathname)
    return // Early return - no event.respondWith() means browser handles it normally
  }
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return
  }
  
  // Suppress Chrome extension errors by explicitly ignoring them
  if (url.href.includes('chrome-extension://')) {
    return // Silently ignore all chrome extension requests
  }
  
  // Additional safety check - if we somehow got here with auth content, bypass
  if (request.mode === 'navigate' && 
      (url.pathname.includes('/auth') || url.pathname.includes('/login'))) {
    return // Let browser handle it
  }
  
  // Handle different types of requests with appropriate strategies
  if (isStaticAsset(request)) {
    // Static assets: Cache First
    event.respondWith(cacheFirst(request, STATIC_CACHE))
  } else if (isImageRequest(request)) {
    // Images: Cache First with size management
    event.respondWith(imagesCacheFirst(request))
  } else if (isAPIRequest(request)) {
    // API requests: Network First with cache fallback
    event.respondWith(networkFirstWithCache(request))
  } else if (isPageRequest(request)) {
    // Pages: Network First with offline fallback
    event.respondWith(pageNetworkFirst(request))
  } else {
    // Default: Network only
    event.respondWith(fetch(request))
  }
})

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('[ServiceWorker] Background sync:', event.tag)
  
  switch (event.tag) {
    case SYNC_TAGS.DAILY_REPORT:
      event.waitUntil(syncDailyReports())
      break
    case SYNC_TAGS.ATTENDANCE:
      event.waitUntil(syncAttendance())
      break
    case SYNC_TAGS.MATERIAL_REQUEST:
      event.waitUntil(syncMaterialRequests())
      break
    case SYNC_TAGS.OFFLINE_ACTIONS:
      event.waitUntil(syncOfflineActions())
      break
  }
})

// Push notification types and configurations
const NOTIFICATION_TYPES = {
  MATERIAL_APPROVAL: {
    tag: 'material-approval',
    icon: '/icons/material-approval-icon.png',
    badge: '/icons/badge-material.png',
    vibrate: [300, 100, 300, 100, 300],
    requireInteraction: true,
    actions: [
      { action: 'approve', title: '승인', icon: '/icons/approve-icon.png' },
      { action: 'reject', title: '거부', icon: '/icons/reject-icon.png' },
      { action: 'view', title: '상세보기' }
    ]
  },
  DAILY_REPORT_REMINDER: {
    tag: 'daily-report-reminder',
    icon: '/icons/report-reminder-icon.png',
    badge: '/icons/badge-report.png',
    vibrate: [200, 100, 200],
    actions: [
      { action: 'create', title: '작성하기' },
      { action: 'later', title: '나중에' }
    ]
  },
  SAFETY_ALERT: {
    tag: 'safety-alert',
    icon: '/icons/safety-alert-icon.png',
    badge: '/icons/badge-safety.png',
    vibrate: [500, 200, 500, 200, 500],
    requireInteraction: true,
    silent: false,
    actions: [
      { action: 'acknowledge', title: '확인', icon: '/icons/acknowledge-icon.png' },
      { action: 'details', title: '상세정보' }
    ]
  },
  EQUIPMENT_MAINTENANCE: {
    tag: 'equipment-maintenance',
    icon: '/icons/maintenance-icon.png',
    badge: '/icons/badge-maintenance.png',
    vibrate: [200, 100, 200, 100, 200],
    actions: [
      { action: 'schedule', title: '일정잡기' },
      { action: 'view', title: '상세보기' }
    ]
  },
  SITE_ANNOUNCEMENT: {
    tag: 'site-announcement',
    icon: '/icons/announcement-icon.png',
    badge: '/icons/badge-announcement.png',
    vibrate: [200, 100, 200],
    actions: [
      { action: 'read', title: '읽기' },
      { action: 'dismiss', title: '무시' }
    ]
  },
  GENERAL: {
    tag: 'general',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: '열기' },
      { action: 'dismiss', title: '닫기' }
    ]
  }
}

// Push notifications
self.addEventListener('push', event => {
  console.log('[ServiceWorker] Push received:', event)
  
  let notificationData = {
    type: 'GENERAL',
    title: 'INOPNC 작업 관리',
    body: 'INOPNC 업무 알림',
    url: '/dashboard',
    data: {}
  }
  
  // Parse notification data if available
  if (event.data) {
    try {
      notificationData = { ...notificationData, ...event.data.json() }
    } catch (error) {
      console.error('[ServiceWorker] Failed to parse notification data:', error)
      notificationData.body = event.data.text()
    }
  }
  
  // Get notification configuration based on type
  const notificationConfig = NOTIFICATION_TYPES[notificationData.type] || NOTIFICATION_TYPES.GENERAL
  
  const options = {
    body: notificationData.body,
    icon: notificationConfig.icon,
    badge: notificationConfig.badge,
    vibrate: notificationConfig.vibrate,
    tag: notificationConfig.tag + '-' + (notificationData.data?.id || Date.now()),
    requireInteraction: notificationConfig.requireInteraction || false,
    silent: notificationConfig.silent || false,
    data: {
      type: notificationData.type,
      url: notificationData.url,
      ...notificationData.data
    },
    actions: notificationConfig.actions || []
  }
  
  // Update notification badge count
  updateNotificationBadge(1)
  
  // Show notification and handle silent updates
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(notificationData.title, options),
      handleSilentNotificationUpdate(notificationData)
    ])
  )
})

// Notification click handler with deep linking support
self.addEventListener('notificationclick', event => {
  console.log('[ServiceWorker] Notification clicked:', event.action, event.notification.data)
  
  const notificationData = event.notification.data || {}
  const notificationType = notificationData.type || 'GENERAL'
  
  // Close notification
  event.notification.close()
  
  // Update badge count
  updateNotificationBadge(-1)
  
  // Handle different notification actions
  event.waitUntil(
    handleNotificationAction(event.action, notificationData, notificationType)
  )
})

// Handle notification actions and deep linking
async function handleNotificationAction(action, data, type) {
  const baseUrl = self.location.origin
  let targetUrl = `${baseUrl}${data.url || '/dashboard'}`
  
  // Handle specific actions based on notification type
  switch (type) {
    case 'MATERIAL_APPROVAL':
      switch (action) {
        case 'approve':
          await handleMaterialApproval(data.materialRequestId, 'approved')
          targetUrl = `${baseUrl}/dashboard/materials/requests/${data.materialRequestId}`
          break
        case 'reject':
          await handleMaterialApproval(data.materialRequestId, 'rejected')
          targetUrl = `${baseUrl}/dashboard/materials/requests/${data.materialRequestId}`
          break
        case 'view':
        default:
          targetUrl = `${baseUrl}/dashboard/materials/requests/${data.materialRequestId || ''}`
          break
      }
      break
      
    case 'DAILY_REPORT_REMINDER':
      switch (action) {
        case 'create':
          targetUrl = `${baseUrl}/dashboard/daily-reports/new`
          break
        case 'later':
          await scheduleReminderLater(data.siteId)
          return // Don't open app
        default:
          targetUrl = `${baseUrl}/dashboard/daily-reports`
          break
      }
      break
      
    case 'SAFETY_ALERT':
      switch (action) {
        case 'acknowledge':
          await acknowledgeSafetyAlert(data.alertId)
          targetUrl = `${baseUrl}/dashboard/safety/alerts/${data.alertId}`
          break
        case 'details':
        default:
          targetUrl = `${baseUrl}/dashboard/safety/alerts/${data.alertId || ''}`
          break
      }
      break
      
    case 'EQUIPMENT_MAINTENANCE':
      switch (action) {
        case 'schedule':
          targetUrl = `${baseUrl}/dashboard/equipment/maintenance/schedule?equipment=${data.equipmentId}`
          break
        case 'view':
        default:
          targetUrl = `${baseUrl}/dashboard/equipment/${data.equipmentId || ''}`
          break
      }
      break
      
    case 'SITE_ANNOUNCEMENT':
      switch (action) {
        case 'read':
          await markAnnouncementAsRead(data.announcementId)
          targetUrl = `${baseUrl}/dashboard/announcements/${data.announcementId}`
          break
        case 'dismiss':
          await dismissAnnouncement(data.announcementId)
          return // Don't open app
        default:
          targetUrl = `${baseUrl}/dashboard/announcements`
          break
      }
      break
      
    default:
      // General notifications
      if (action === 'dismiss') {
        return // Don't open app
      }
      break
  }
  
  // Open or focus app window
  return openOrFocusWindow(targetUrl)
}

// Open or focus existing app window
async function openOrFocusWindow(url) {
  const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true })
  
  // Check if app is already open and focus it
  for (const client of clientList) {
    if (client.url.startsWith(self.location.origin)) {
      await client.navigate(url)
      return client.focus()
    }
  }
  
  // Open new window if app is not open
  if (clients.openWindow) {
    return clients.openWindow(url)
  }
}

// Utility functions

function isStaticAsset(request) {
  return request.url.includes('/_next/static/') ||
         request.url.includes('/icons/') ||
         request.url.includes('/manifest.json')
}

function isImageRequest(request) {
  return request.destination === 'image' ||
         /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(request.url)
}

function isAPIRequest(request) {
  return request.url.includes('/api/') &&
         CACHEABLE_API_PATTERNS.some(pattern => pattern.test(request.url))
}

function isPageRequest(request) {
  // Skip caching for auth-related pages and dashboard
  const url = new URL(request.url)
  if (url.pathname.includes('/auth') || 
      url.pathname.includes('/login') ||
      url.pathname.includes('/signup') ||
      url.pathname.includes('/api/auth') ||
      url.pathname.includes('/dashboard')) {
    return false
  }
  
  return request.mode === 'navigate' ||
         request.destination === 'document'
}

// Caching strategies

async function cacheFirst(request, cacheName = CACHE_NAME) {
  try {
    const cache = await caches.open(cacheName)
    const cached = await cache.match(request)
    
    if (cached) {
      // Update cache in background
      fetch(request).then(response => {
        if (response.status === 200) {
          cache.put(request, response.clone())
        }
      }).catch(() => {
        // Ignore background update errors
      })
      
      return cached
    }
    
    const response = await fetch(request)
    if (response.status === 200) {
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.error('[ServiceWorker] Cache first error:', error)
    throw error
  }
}

async function imagesCacheFirst(request) {
  try {
    const cache = await caches.open(IMAGES_CACHE)
    const cached = await cache.match(request)
    
    if (cached) {
      return cached
    }
    
    const response = await fetch(request)
    
    if (response.status === 200) {
      // Check cache size before adding
      await manageCacheSize(IMAGES_CACHE, MAX_IMAGE_CACHE_SIZE)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.error('[ServiceWorker] Images cache error:', error)
    // Return placeholder image for failed requests
    return new Response('', { status: 404 })
  }
}

async function networkFirstWithCache(request) {
  try {
    // Always try network first with no-cache headers for critical API endpoints
    const url = new URL(request.url)
    
    // For site-related APIs, always fetch fresh data
    if (url.pathname.includes('/api/sites') || 
        url.pathname.includes('/api/site-info') ||
        url.pathname.includes('/api/auth')) {
      console.log('[ServiceWorker] Fetching fresh data for:', url.pathname)
      const networkRequest = new Request(request, {
        cache: 'no-cache',
        headers: {
          ...Object.fromEntries(request.headers),
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      return await fetch(networkRequest)
    }
    
    const response = await fetch(request)
    
    if (response.status === 200) {
      const cache = await caches.open(API_CACHE)
      await manageCacheSize(API_CACHE, MAX_API_CACHE_SIZE)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.log('[ServiceWorker] Network failed, trying cache:', error)
    
    const cache = await caches.open(API_CACHE)
    const cached = await cache.match(request)
    
    if (cached) {
      // Add header to indicate this is cached data
      const cachedResponse = new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers: new Headers({
          ...Object.fromEntries(cached.headers),
          'X-From-Cache': 'true',
          'X-Cache-Time': new Date().toISOString()
        })
      })
      return cachedResponse
    }
    
    // Return offline indicator for API requests
    return new Response(JSON.stringify({
      error: 'offline',
      message: '오프라인 상태입니다. 네트워크 연결을 확인해주세요.'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function pageNetworkFirst(request) {
  try {
    // Don't cache auth-related requests
    const url = new URL(request.url)
    const isAuthRelated = url.pathname.includes('/auth') || 
                         url.pathname.includes('/login') ||
                         url.pathname.includes('/signup') ||
                         url.pathname.includes('/api/auth') ||
                         url.pathname.includes('/dashboard')
    
    const response = await fetch(request)
    
    // Only cache successful non-auth pages
    if (response.status === 200 && !isAuthRelated) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.log('[ServiceWorker] Page network failed, trying cache:', error)
    
    // Don't use cache for auth-related pages
    const url = new URL(request.url)
    const isAuthRelated = url.pathname.includes('/auth') || 
                         url.pathname.includes('/login') ||
                         url.pathname.includes('/signup') ||
                         url.pathname.includes('/api/auth') ||
                         url.pathname.includes('/dashboard')
    
    if (isAuthRelated) {
      // For auth pages, always fail if network is down
      return new Response('Network error', { status: 503 })
    }
    
    const cache = await caches.open(CACHE_NAME)
    const cached = await cache.match(request)
    
    if (cached) {
      return cached
    }
    
    // Return offline page
    return cache.match(OFFLINE_PAGE) || new Response('Offline', { status: 503 })
  }
}

// Cache size management
async function manageCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  let totalSize = 0
  
  // Estimate cache size (rough calculation)
  for (const key of keys) {
    totalSize += 1024 // Assume 1KB per entry minimum
  }
  
  if (totalSize > maxSize) {
    // Remove oldest entries (FIFO)
    const entriesToRemove = Math.ceil(keys.length * 0.2) // Remove 20%
    for (let i = 0; i < entriesToRemove; i++) {
      await cache.delete(keys[i])
    }
    console.log(`[ServiceWorker] Cleaned ${entriesToRemove} entries from ${cacheName}`)
  }
}

// Background sync functions
async function syncDailyReports() {
  try {
    const pendingReports = await getStoredData('pending-daily-reports')
    
    for (const report of pendingReports) {
      try {
        const response = await fetch('/api/daily-reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report)
        })
        
        if (response.ok) {
          await removeStoredData('pending-daily-reports', report.id)
          console.log('[ServiceWorker] Daily report synced:', report.id)
        }
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync daily report:', error)
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Daily reports sync error:', error)
  }
}

async function syncAttendance() {
  try {
    const pendingAttendance = await getStoredData('pending-attendance')
    
    for (const attendance of pendingAttendance) {
      try {
        const response = await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(attendance)
        })
        
        if (response.ok) {
          await removeStoredData('pending-attendance', attendance.id)
          console.log('[ServiceWorker] Attendance synced:', attendance.id)
        }
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync attendance:', error)
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Attendance sync error:', error)
  }
}

async function syncMaterialRequests() {
  try {
    const pendingRequests = await getStoredData('pending-material-requests')
    
    for (const request of pendingRequests) {
      try {
        const response = await fetch('/api/materials/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request)
        })
        
        if (response.ok) {
          await removeStoredData('pending-material-requests', request.id)
          console.log('[ServiceWorker] Material request synced:', request.id)
        }
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync material request:', error)
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Material requests sync error:', error)
  }
}

async function syncOfflineActions() {
  try {
    const pendingActions = await getStoredData('pending-offline-actions')
    
    for (const action of pendingActions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        })
        
        if (response.ok) {
          await removeStoredData('pending-offline-actions', action.id)
          console.log('[ServiceWorker] Offline action synced:', action.id)
        }
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync offline action:', error)
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Offline actions sync error:', error)
  }
}

// IndexedDB helpers for storing offline data
async function getStoredData(storeName) {
  // Service Workers don't have access to localStorage
  // Return empty array for now - in production use IndexedDB
  return []
}

async function removeStoredData(storeName, itemId) {
  // Service Workers don't have access to localStorage
  // In production, use IndexedDB instead
  console.log(`[ServiceWorker] Would remove item ${itemId} from ${storeName}`)
}

// Notification badge management
let notificationBadgeCount = 0

function updateNotificationBadge(increment) {
  notificationBadgeCount = Math.max(0, notificationBadgeCount + increment)
  
  if ('setAppBadge' in navigator) {
    if (notificationBadgeCount > 0) {
      navigator.setAppBadge(notificationBadgeCount)
    } else {
      navigator.clearAppBadge()
    }
  }
  
  // Store badge count for persistence
  // Service Workers don't have access to localStorage
  // Badge count is managed in memory only for this session
}

// Service Workers don't have access to localStorage
// Use IndexedDB or skip badge count restoration in SW context

// Handle silent notification updates
async function handleSilentNotificationUpdate(notificationData) {
  try {
    // Update app state silently based on notification type
    switch (notificationData.type) {
      case 'MATERIAL_APPROVAL':
        await updateMaterialRequestCache(notificationData.data?.materialRequestId)
        break
      case 'SAFETY_ALERT':
        await updateSafetyAlertsCache()
        break
      case 'SITE_ANNOUNCEMENT':
        await updateAnnouncementsCache()
        break
      default:
        // General update - refresh dashboard cache
        await updateDashboardCache()
        break
    }
    
    // Notify open clients about the update
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'NOTIFICATION_UPDATE',
        notificationType: notificationData.type,
        data: notificationData.data
      })
    })
  } catch (error) {
    console.error('[ServiceWorker] Silent notification update failed:', error)
  }
}

// Notification action handlers
async function handleMaterialApproval(requestId, status) {
  try {
    const response = await fetch(`/api/materials/requests/${requestId}/approval`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    
    if (response.ok) {
      console.log(`[ServiceWorker] Material request ${requestId} ${status}`)
      await updateMaterialRequestCache(requestId)
    }
  } catch (error) {
    console.error('[ServiceWorker] Material approval failed:', error)
  }
}

async function scheduleReminderLater(siteId) {
  try {
    const response = await fetch(`/api/daily-reports/reminder/snooze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId, snoozeHours: 2 })
    })
    
    if (response.ok) {
      console.log(`[ServiceWorker] Daily report reminder snoozed for site ${siteId}`)
    }
  } catch (error) {
    console.error('[ServiceWorker] Reminder snooze failed:', error)
  }
}

async function acknowledgeSafetyAlert(alertId) {
  try {
    const response = await fetch(`/api/safety/alerts/${alertId}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (response.ok) {
      console.log(`[ServiceWorker] Safety alert ${alertId} acknowledged`)
      await updateSafetyAlertsCache()
    }
  } catch (error) {
    console.error('[ServiceWorker] Safety alert acknowledgment failed:', error)
  }
}

async function markAnnouncementAsRead(announcementId) {
  try {
    const response = await fetch(`/api/announcements/${announcementId}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (response.ok) {
      console.log(`[ServiceWorker] Announcement ${announcementId} marked as read`)
      await updateAnnouncementsCache()
    }
  } catch (error) {
    console.error('[ServiceWorker] Mark announcement as read failed:', error)
  }
}

async function dismissAnnouncement(announcementId) {
  try {
    const response = await fetch(`/api/announcements/${announcementId}/dismiss`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (response.ok) {
      console.log(`[ServiceWorker] Announcement ${announcementId} dismissed`)
      await updateAnnouncementsCache()
    }
  } catch (error) {
    console.error('[ServiceWorker] Dismiss announcement failed:', error)
  }
}

// Cache update helpers
async function updateMaterialRequestCache(requestId) {
  try {
    const cache = await caches.open(API_CACHE)
    const response = await fetch(`/api/materials/requests/${requestId}`)
    
    if (response.ok) {
      await cache.put(`/api/materials/requests/${requestId}`, response.clone())
    }
  } catch (error) {
    console.error('[ServiceWorker] Material request cache update failed:', error)
  }
}

async function updateSafetyAlertsCache() {
  try {
    const cache = await caches.open(API_CACHE)
    const response = await fetch('/api/safety/alerts')
    
    if (response.ok) {
      await cache.put('/api/safety/alerts', response.clone())
    }
  } catch (error) {
    console.error('[ServiceWorker] Safety alerts cache update failed:', error)
  }
}

async function updateAnnouncementsCache() {
  try {
    const cache = await caches.open(API_CACHE)
    const response = await fetch('/api/announcements')
    
    if (response.ok) {
      await cache.put('/api/announcements', response.clone())
    }
  } catch (error) {
    console.error('[ServiceWorker] Announcements cache update failed:', error)
  }
}

async function updateDashboardCache() {
  try {
    const cache = await caches.open(API_CACHE)
    const dashboardEndpoints = [
      '/api/dashboard/overview',
      '/api/notifications',
      '/api/daily-reports/recent'
    ]
    
    for (const endpoint of dashboardEndpoints) {
      try {
        const response = await fetch(endpoint)
        if (response.ok) {
          await cache.put(endpoint, response.clone())
        }
      } catch (error) {
        console.error(`[ServiceWorker] Failed to update ${endpoint}:`, error)
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Dashboard cache update failed:', error)
  }
}

console.log('[ServiceWorker] INOPNC Work Management Service Worker loaded')