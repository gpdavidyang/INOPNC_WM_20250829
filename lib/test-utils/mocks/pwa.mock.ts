/**
 * PWA Testing Mock Infrastructure
 * 
 * Provides comprehensive mocks for testing Progressive Web App features including:
 * - Service Worker registration and lifecycle
 * - Push notifications and subscriptions
 * - Installation prompts and events
 * - Cache API
 * - Background sync
 */

export interface MockServiceWorker {
  state: 'installing' | 'installed' | 'activating' | 'activated' | 'redundant'
  scriptURL: string
  addEventListener: jest.Mock
  removeEventListener: jest.Mock
  postMessage: jest.Mock
  update: jest.Mock
}

export interface MockServiceWorkerRegistration {
  scope: string
  active: MockServiceWorker | null
  installing: MockServiceWorker | null
  waiting: MockServiceWorker | null
  addEventListener: jest.Mock
  removeEventListener: jest.Mock
  update: jest.Mock
  unregister: jest.Mock
  pushManager: MockPushManager
  sync: MockSyncManager
  showNotification: jest.Mock
  getNotifications: jest.Mock
}

export interface MockPushManager {
  subscribe: jest.Mock
  getSubscription: jest.Mock
  permissionState: jest.Mock
}

export interface MockPushSubscription {
  endpoint: string
  expirationTime: number | null
  options: {
    userVisibleOnly: boolean
    applicationServerKey: ArrayBuffer | null
  }
  getKey: jest.Mock
  toJSON: jest.Mock
  unsubscribe: jest.Mock
}

export interface MockSyncManager {
  register: jest.Mock
  getTags: jest.Mock
}

export interface MockNotification {
  title: string
  options?: NotificationOptions
  close: jest.Mock
  addEventListener: jest.Mock
  removeEventListener: jest.Mock
}

export interface MockBeforeInstallPromptEvent extends Event {
  platforms: readonly string[]
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>
  prompt: jest.Mock
}

// Create mock service worker
export function createMockServiceWorker(
  state: MockServiceWorker['state'] = 'activated',
  scriptURL = '/sw.js'
): MockServiceWorker {
  return {
    state,
    scriptURL,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    postMessage: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined)
  }
}

// Create mock service worker registration
export function createMockServiceWorkerRegistration(
  options?: {
    scope?: string
    activeWorker?: MockServiceWorker | null
    waitingWorker?: MockServiceWorker | null
    installingWorker?: MockServiceWorker | null
  }
): MockServiceWorkerRegistration {
  const {
    scope = '/',
    activeWorker = createMockServiceWorker(),
    waitingWorker = null,
    installingWorker = null
  } = options || {}

  const pushManager = createMockPushManager()
  const syncManager = createMockSyncManager()

  return {
    scope,
    active: activeWorker,
    installing: installingWorker,
    waiting: waitingWorker,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
    unregister: jest.fn().mockResolvedValue(true),
    pushManager,
    sync: syncManager,
    showNotification: jest.fn().mockResolvedValue(undefined),
    getNotifications: jest.fn().mockResolvedValue([])
  }
}

// Create mock push manager
export function createMockPushManager(
  permissionState: 'granted' | 'denied' | 'prompt' = 'granted'
): MockPushManager {
  const subscription = permissionState === 'granted' ? createMockPushSubscription() : null

  return {
    subscribe: jest.fn().mockImplementation(async (options) => {
      if (permissionState !== 'granted') {
        throw new DOMException('Permission denied', 'NotAllowedError')
      }
      return createMockPushSubscription()
    }),
    getSubscription: jest.fn().mockResolvedValue(subscription),
    permissionState: jest.fn().mockResolvedValue(permissionState)
  }
}

// Create mock push subscription
export function createMockPushSubscription(
  endpoint = 'https://fcm.googleapis.com/fcm/send/mock-endpoint-123'
): MockPushSubscription {
  return {
    endpoint,
    expirationTime: null,
    options: {
      userVisibleOnly: true,
      applicationServerKey: new ArrayBuffer(65)
    },
    getKey: jest.fn().mockImplementation((name: string) => {
      if (name === 'p256dh') return new ArrayBuffer(65)
      if (name === 'auth') return new ArrayBuffer(16)
      return null
    }),
    toJSON: jest.fn().mockReturnValue({
      endpoint,
      expirationTime: null,
      keys: {
        p256dh: 'mock-p256dh-key',
        auth: 'mock-auth-key'
      }
    }),
    unsubscribe: jest.fn().mockResolvedValue(true)
  }
}

// Create mock sync manager
export function createMockSyncManager(): MockSyncManager {
  const registeredTags = new Set<string>()

  return {
    register: jest.fn().mockImplementation(async (tag: string) => {
      registeredTags.add(tag)
      return undefined
    }),
    getTags: jest.fn().mockImplementation(async () => {
      return Array.from(registeredTags)
    })
  }
}

// Create mock notification
export function createMockNotification(
  title: string,
  options?: NotificationOptions
): MockNotification {
  return {
    title,
    options,
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }
}

// Create mock Notification constructor
export function createMockNotificationConstructor(
  defaultPermission: NotificationPermission = 'default'
) {
  let currentPermission = defaultPermission

  const MockNotificationClass = function(title: string, options?: NotificationOptions) {
    return createMockNotification(title, options)
  } as any

  MockNotificationClass.permission = currentPermission
  MockNotificationClass.requestPermission = jest.fn().mockImplementation(async () => {
    // Simulate permission dialog
    if (currentPermission === 'default') {
      // In tests, we'll grant permission by default
      currentPermission = 'granted'
      MockNotificationClass.permission = 'granted'
    }
    return currentPermission
  })

  // Add static properties
  MockNotificationClass.maxActions = 2

  return MockNotificationClass
}

// Create mock beforeinstallprompt event
export function createMockBeforeInstallPromptEvent(
  platforms: string[] = ['web', 'chrome', 'samsung']
): MockBeforeInstallPromptEvent {
  let promptCalled = false
  let userChoiceOutcome: 'accepted' | 'dismissed' = 'dismissed'

  const event = new Event('beforeinstallprompt') as MockBeforeInstallPromptEvent
  
  Object.defineProperty(event, 'platforms', {
    value: platforms,
    writable: false,
    configurable: true
  })

  const promptMock = jest.fn().mockImplementation(() => {
    promptCalled = true
    // Simulate user interaction delay
    return new Promise(resolve => {
      setTimeout(resolve, 100)
    })
  })

  Object.defineProperty(event, 'prompt', {
    value: promptMock,
    writable: false,
    configurable: true
  })

  Object.defineProperty(event, 'userChoice', {
    get() {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            outcome: promptCalled ? userChoiceOutcome : 'dismissed',
            platform: platforms[0] || 'web'
          })
        }, 150)
      })
    },
    configurable: true
  })

  // Helper to simulate user accepting the prompt
  ;(event as any).simulateUserAccept = () => {
    userChoiceOutcome = 'accepted'
  }

  // Helper to simulate user dismissing the prompt
  ;(event as any).simulateUserDismiss = () => {
    userChoiceOutcome = 'dismissed'
  }

  return event
}

// Installation state helpers
export function createInstallationStateHelpers() {
  let isInstalled = false
  let canInstall = false
  let deferredPrompt: MockBeforeInstallPromptEvent | null = null

  return {
    isInstalled: () => isInstalled,
    canInstall: () => canInstall,
    getDeferredPrompt: () => deferredPrompt,
    
    setInstalled: (value: boolean) => {
      isInstalled = value
    },
    
    setCanInstall: (value: boolean) => {
      canInstall = value
    },
    
    setDeferredPrompt: (prompt: MockBeforeInstallPromptEvent | null) => {
      deferredPrompt = prompt
      canInstall = prompt !== null
    },
    
    // Simulate installation flow
    simulateInstallation: async () => {
      if (!deferredPrompt) {
        throw new Error('No deferred prompt available')
      }
      
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        isInstalled = true
        canInstall = false
        deferredPrompt = null
      }
      
      return outcome
    }
  }
}

// Cache API mock
export function createMockCacheStorage() {
  const caches = new Map<string, MockCache>()

  return {
    open: jest.fn().mockImplementation(async (cacheName: string) => {
      if (!caches.has(cacheName)) {
        caches.set(cacheName, createMockCache())
      }
      return caches.get(cacheName)!
    }),
    
    has: jest.fn().mockImplementation(async (cacheName: string) => {
      return caches.has(cacheName)
    }),
    
    delete: jest.fn().mockImplementation(async (cacheName: string) => {
      return caches.delete(cacheName)
    }),
    
    keys: jest.fn().mockImplementation(async () => {
      return Array.from(caches.keys())
    }),
    
    match: jest.fn().mockImplementation(async (request: Request) => {
      for (const cache of caches.values()) {
        const response = await cache.match(request)
        if (response) return response
      }
      return undefined
    })
  }
}

interface MockCache {
  match: jest.Mock
  matchAll: jest.Mock
  add: jest.Mock
  addAll: jest.Mock
  put: jest.Mock
  delete: jest.Mock
  keys: jest.Mock
}

function createMockCache(): MockCache {
  const cache = new Map<string, Response>()

  return {
    match: jest.fn().mockImplementation(async (request: Request | string) => {
      const url = typeof request === 'string' ? request : request.url
      return cache.get(url) || undefined
    }),
    
    matchAll: jest.fn().mockImplementation(async (request?: Request | string) => {
      if (!request) return Array.from(cache.values())
      const url = typeof request === 'string' ? request : request.url
      const response = cache.get(url)
      return response ? [response] : []
    }),
    
    add: jest.fn().mockImplementation(async (request: Request | string) => {
      const url = typeof request === 'string' ? request : request.url
      cache.set(url, new Response('mock response'))
      return undefined
    }),
    
    addAll: jest.fn().mockImplementation(async (requests: (Request | string)[]) => {
      for (const request of requests) {
        const url = typeof request === 'string' ? request : request.url
        cache.set(url, new Response('mock response'))
      }
      return undefined
    }),
    
    put: jest.fn().mockImplementation(async (request: Request | string, response: Response) => {
      const url = typeof request === 'string' ? request : request.url
      cache.set(url, response)
      return undefined
    }),
    
    delete: jest.fn().mockImplementation(async (request: Request | string) => {
      const url = typeof request === 'string' ? request : request.url
      return cache.delete(url)
    }),
    
    keys: jest.fn().mockImplementation(async () => {
      return Array.from(cache.keys()).map(url => new Request(url))
    })
  }
}

// Helper to simulate service worker lifecycle
export async function simulateServiceWorkerLifecycle(
  registration: MockServiceWorkerRegistration
) {
  const worker = createMockServiceWorker('installing')
  registration.installing = worker
  
  // Simulate installation
  await new Promise(resolve => setTimeout(resolve, 10))
  worker.state = 'installed'
  registration.installing = null
  registration.waiting = worker
  
  // Simulate activation
  await new Promise(resolve => setTimeout(resolve, 10))
  worker.state = 'activating'
  registration.waiting = null
  registration.active = worker
  
  // Complete activation
  await new Promise(resolve => setTimeout(resolve, 10))
  worker.state = 'activated'
  
  return worker
}

// Helper to simulate push notification flow
export async function simulatePushNotificationFlow(
  pushManager: MockPushManager,
  notificationPermission: NotificationPermission = 'granted'
) {
  // Request notification permission
  if (global.Notification) {
    global.Notification.permission = notificationPermission
  }
  
  if (notificationPermission !== 'granted') {
    return { success: false, error: 'Permission denied' }
  }
  
  // Subscribe to push
  try {
    const subscription = await pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: new ArrayBuffer(65)
    })
    
    return { success: true, subscription }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}