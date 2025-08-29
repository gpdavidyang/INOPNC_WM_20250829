/**
 * PWA Test Environment Setup
 * 
 * Configures the global test environment with PWA APIs and mocks.
 * This should be imported in test setup files or at the beginning of PWA-related tests.
 */

import {
  createMockServiceWorkerRegistration,
  createMockNotificationConstructor,
  createMockCacheStorage,
  createMockBeforeInstallPromptEvent,
  createInstallationStateHelpers,
  type MockServiceWorkerRegistration,
  type MockBeforeInstallPromptEvent
} from './mocks/pwa.mock'

// Global PWA state for tests
let mockRegistration: MockServiceWorkerRegistration | null = null
let mockInstallPrompt: MockBeforeInstallPromptEvent | null = null
let installationHelpers = createInstallationStateHelpers()

/**
 * Set up PWA globals for testing environment
 */
export function setupPWAEnvironment(options?: {
  serviceWorkerSupported?: boolean
  notificationPermission?: NotificationPermission
  isInstalled?: boolean
  canInstall?: boolean
}) {
  const {
    serviceWorkerSupported = true,
    notificationPermission = 'default',
    isInstalled = false,
    canInstall = false
  } = options || {}

  // Reset state
  mockRegistration = null
  mockInstallPrompt = null
  installationHelpers = createInstallationStateHelpers()
  installationHelpers.setInstalled(isInstalled)
  installationHelpers.setCanInstall(canInstall)

  // Service Worker API
  if (serviceWorkerSupported) {
    const mockNavigator = global.navigator as any
    
    mockNavigator.serviceWorker = {
      ready: Promise.resolve(createMockServiceWorkerRegistration()),
      
      register: jest.fn().mockImplementation(async (scriptURL: string, options?: RegistrationOptions) => {
        mockRegistration = createMockServiceWorkerRegistration({
          scope: options?.scope || '/',
          activeWorker: null,
          installingWorker: null
        })
        
        // Simulate registration process
        setTimeout(() => {
          if (mockRegistration) {
            mockRegistration.installing = {
              state: 'installing',
              scriptURL,
              addEventListener: jest.fn(),
              removeEventListener: jest.fn(),
              postMessage: jest.fn(),
              update: jest.fn()
            }
          }
        }, 10)
        
        return mockRegistration
      }),
      
      getRegistration: jest.fn().mockImplementation(async (scope?: string) => {
        if (mockRegistration && (!scope || mockRegistration.scope === scope)) {
          return mockRegistration
        }
        return undefined
      }),
      
      getRegistrations: jest.fn().mockImplementation(async () => {
        return mockRegistration ? [mockRegistration] : []
      }),
      
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      controller: null
    }
  } else {
    // Remove service worker support
    const mockNavigator = global.navigator as any
    delete mockNavigator.serviceWorker
  }

  // Notification API
  if (!global.Notification) {
    (global as any).Notification = createMockNotificationConstructor(notificationPermission)
  } else {
    // Notification already exists, just update permission
    Object.defineProperty(global.Notification, 'permission', {
      value: notificationPermission,
      writable: true,
      configurable: true
    })
    ;(global.Notification as any).requestPermission = jest.fn().mockResolvedValue(notificationPermission)
  }

  // Cache API
  if (!global.caches) {
    (global as any).caches = createMockCacheStorage()
  }

  // Install prompt event
  if (canInstall && !isInstalled) {
    mockInstallPrompt = createMockBeforeInstallPromptEvent()
    installationHelpers.setDeferredPrompt(mockInstallPrompt)
  }
}

/**
 * Trigger a beforeinstallprompt event
 */
export function triggerBeforeInstallPrompt(platforms?: string[]) {
  if (!global.window) return

  mockInstallPrompt = createMockBeforeInstallPromptEvent(platforms)
  installationHelpers.setDeferredPrompt(mockInstallPrompt)
  
  const event = mockInstallPrompt
  window.dispatchEvent(event)
  
  return event
}

/**
 * Simulate app installation
 */
export async function simulateAppInstallation(accept = true) {
  if (!mockInstallPrompt) {
    throw new Error('No install prompt available. Call triggerBeforeInstallPrompt first.')
  }

  if (accept) {
    (mockInstallPrompt as any).simulateUserAccept()
  } else {
    (mockInstallPrompt as any).simulateUserDismiss()
  }

  const outcome = await installationHelpers.simulateInstallation()
  
  if (outcome === 'accepted') {
    // Dispatch appinstalled event
    window.dispatchEvent(new Event('appinstalled'))
  }
  
  return outcome
}

/**
 * Get current PWA installation state
 */
export function getPWAInstallationState() {
  return {
    isInstalled: installationHelpers.isInstalled(),
    canInstall: installationHelpers.canInstall(),
    hasDeferredPrompt: installationHelpers.getDeferredPrompt() !== null
  }
}

/**
 * Update notification permission
 */
export function setNotificationPermission(permission: NotificationPermission) {
  if (global.Notification) {
    Object.defineProperty(global.Notification, 'permission', {
      value: permission,
      writable: true,
      configurable: true
    })
    ;(global.Notification as any).requestPermission = jest.fn().mockResolvedValue(permission)
  }
}

/**
 * Get current service worker registration
 */
export function getServiceWorkerRegistration(): MockServiceWorkerRegistration | null {
  return mockRegistration
}

/**
 * Simulate service worker update
 */
export async function simulateServiceWorkerUpdate() {
  if (!mockRegistration) {
    throw new Error('No service worker registration found')
  }

  const newWorker = {
    state: 'installing' as const,
    scriptURL: '/sw.js',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    postMessage: jest.fn(),
    update: jest.fn()
  }

  mockRegistration.installing = newWorker

  // Simulate installation
  await new Promise(resolve => setTimeout(resolve, 50))
  newWorker.state = 'installed'
  mockRegistration.installing = null
  mockRegistration.waiting = newWorker

  // Fire updatefound event
  const updateFoundEvent = new Event('updatefound')
  mockRegistration.addEventListener.mock.calls
    .filter(([event]) => event === 'updatefound')
    .forEach(([, handler]) => handler(updateFoundEvent))

  return newWorker
}

/**
 * Simulate push notification
 */
export async function simulatePushNotification(data: {
  title: string
  body?: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
}) {
  if (!mockRegistration) {
    throw new Error('No service worker registration found')
  }

  // Check permission
  if (global.Notification?.permission !== 'granted') {
    throw new Error('Notification permission not granted')
  }

  // Show notification through service worker
  await mockRegistration.showNotification(data.title, {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data
  })

  // Simulate push event in service worker
  if (mockRegistration.active) {
    const pushEvent = new Event('push') as any
    pushEvent.data = {
      json: () => data,
      text: () => JSON.stringify(data)
    }
    
    mockRegistration.active.addEventListener.mock.calls
      .filter(([event]) => event === 'push')
      .forEach(([, handler]) => handler(pushEvent))
  }

  return {
    title: data.title,
    options: {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      data: data.data
    }
  }
}

/**
 * Simulate background sync
 */
export async function simulateBackgroundSync(tag: string) {
  if (!mockRegistration?.sync) {
    throw new Error('Background sync not supported')
  }

  await mockRegistration.sync.register(tag)

  // Simulate sync event
  if (mockRegistration.active) {
    const syncEvent = new Event('sync') as any
    syncEvent.tag = tag
    syncEvent.lastChance = false
    
    mockRegistration.active.addEventListener.mock.calls
      .filter(([event]) => event === 'sync')
      .forEach(([, handler]) => handler(syncEvent))
  }

  return tag
}

/**
 * Clean up PWA environment after tests
 */
export function cleanupPWAEnvironment() {
  // Reset navigator.serviceWorker
  const mockNavigator = global.navigator as any
  if (mockNavigator.serviceWorker) {
    delete mockNavigator.serviceWorker
  }

  // Reset Notification
  if (global.Notification) {
    (global.Notification as any).permission = 'default'
  }

  // Reset caches
  if (global.caches) {
    delete (global as any).caches
  }

  // Clear state
  mockRegistration = null
  mockInstallPrompt = null
  installationHelpers = createInstallationStateHelpers()
}

// Auto-cleanup after each test if in Jest environment
if (typeof afterEach !== 'undefined') {
  afterEach(() => {
    cleanupPWAEnvironment()
  })
}