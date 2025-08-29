import {
  setupPWAEnvironment,
  triggerBeforeInstallPrompt,
  simulateAppInstallation,
  getPWAInstallationState,
  setNotificationPermission,
  getServiceWorkerRegistration,
  simulateServiceWorkerUpdate,
  simulatePushNotification,
  simulateBackgroundSync,
  cleanupPWAEnvironment
} from '../pwa-setup'

describe('PWA Setup Utilities', () => {
  beforeEach(() => {
    // Ensure clean state before each test
    cleanupPWAEnvironment()
  })

  afterEach(() => {
    // Clean up after each test
    cleanupPWAEnvironment()
  })

  describe('setupPWAEnvironment', () => {
    it('should set up service worker support by default', () => {
      setupPWAEnvironment()
      
      expect(navigator.serviceWorker).toBeDefined()
      expect(navigator.serviceWorker.register).toBeDefined()
      expect(navigator.serviceWorker.ready).toBeDefined()
    })

    it('should set up notification API', () => {
      setupPWAEnvironment({ notificationPermission: 'granted' })
      
      expect(global.Notification).toBeDefined()
      expect(global.Notification.permission).toBe('granted')
      expect(global.Notification.requestPermission).toBeDefined()
    })

    it('should set up cache API', () => {
      setupPWAEnvironment()
      
      expect(global.caches).toBeDefined()
      expect(global.caches.open).toBeDefined()
      expect(global.caches.match).toBeDefined()
    })

    it('should handle service worker not supported', () => {
      setupPWAEnvironment({ serviceWorkerSupported: false })
      
      expect(navigator.serviceWorker).toBeUndefined()
    })

    it('should set initial installation state', () => {
      setupPWAEnvironment({ isInstalled: true, canInstall: false })
      
      const state = getPWAInstallationState()
      expect(state.isInstalled).toBe(true)
      expect(state.canInstall).toBe(false)
    })
  })

  describe('Service Worker Registration', () => {
    beforeEach(() => {
      setupPWAEnvironment()
    })

    it('should register service worker', async () => {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      
      expect(registration).toBeDefined()
      expect(registration.scope).toBe('/')
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js', { scope: '/' })
    })

    it('should get service worker registration', async () => {
      await navigator.serviceWorker.register('/sw.js')
      
      const registration = await navigator.serviceWorker.getRegistration('/')
      expect(registration).toBeDefined()
      expect(registration?.scope).toBe('/')
    })

    it('should get all registrations', async () => {
      await navigator.serviceWorker.register('/sw.js')
      
      const registrations = await navigator.serviceWorker.getRegistrations()
      expect(registrations).toHaveLength(1)
      expect(registrations[0].scope).toBe('/')
    })

    it('should simulate service worker update', async () => {
      await navigator.serviceWorker.register('/sw.js')
      
      const newWorker = await simulateServiceWorkerUpdate()
      
      expect(newWorker.state).toBe('installed')
      const registration = getServiceWorkerRegistration()
      expect(registration?.waiting).toBe(newWorker)
    })
  })

  describe('Installation Prompt', () => {
    beforeEach(() => {
      setupPWAEnvironment({ canInstall: true })
    })

    it('should trigger beforeinstallprompt event', () => {
      const mockHandler = jest.fn()
      window.addEventListener('beforeinstallprompt', mockHandler)
      
      const event = triggerBeforeInstallPrompt()
      
      expect(mockHandler).toHaveBeenCalledWith(event)
      expect(event.platforms).toContain('web')
      
      window.removeEventListener('beforeinstallprompt', mockHandler)
    })

    it('should simulate app installation acceptance', async () => {
      triggerBeforeInstallPrompt()
      
      const appInstalledHandler = jest.fn()
      window.addEventListener('appinstalled', appInstalledHandler)
      
      const outcome = await simulateAppInstallation(true)
      
      expect(outcome).toBe('accepted')
      expect(appInstalledHandler).toHaveBeenCalled()
      
      const state = getPWAInstallationState()
      expect(state.isInstalled).toBe(true)
      expect(state.canInstall).toBe(false)
      
      window.removeEventListener('appinstalled', appInstalledHandler)
    })

    it('should simulate app installation dismissal', async () => {
      triggerBeforeInstallPrompt()
      
      const outcome = await simulateAppInstallation(false)
      
      expect(outcome).toBe('dismissed')
      
      const state = getPWAInstallationState()
      expect(state.isInstalled).toBe(false)
    })

    it('should throw error when no install prompt available', async () => {
      // Setup without canInstall
      cleanupPWAEnvironment()
      setupPWAEnvironment({ canInstall: false })
      
      // Don't trigger prompt first
      await expect(simulateAppInstallation()).rejects.toThrow('No install prompt available')
    })
  })

  describe('Notification Permission', () => {
    beforeEach(() => {
      setupPWAEnvironment()
    })

    it('should update notification permission', () => {
      expect(global.Notification.permission).toBe('default')
      
      setNotificationPermission('granted')
      expect(global.Notification.permission).toBe('granted')
      
      setNotificationPermission('denied')
      expect(global.Notification.permission).toBe('denied')
    })

    it('should handle notification permission request', async () => {
      setNotificationPermission('default')
      
      const permission = await global.Notification.requestPermission()
      expect(permission).toBe('default')
      expect(global.Notification.requestPermission).toHaveBeenCalled()
    })
  })

  describe('Push Notifications', () => {
    beforeEach(() => {
      setupPWAEnvironment({ notificationPermission: 'granted' })
    })

    it('should simulate push notification', async () => {
      await navigator.serviceWorker.register('/sw.js')
      await new Promise(resolve => setTimeout(resolve, 20)) // Wait for registration
      
      const notification = await simulatePushNotification({
        title: 'Test Notification',
        body: 'Test body',
        icon: '/icon.png',
        badge: '/badge.png',
        tag: 'test-tag',
        data: { custom: 'data' }
      })
      
      expect(notification.title).toBe('Test Notification')
      expect(notification.options?.body).toBe('Test body')
      expect(notification.options?.icon).toBe('/icon.png')
      
      const registration = getServiceWorkerRegistration()
      expect(registration?.showNotification).toHaveBeenCalledWith('Test Notification', expect.any(Object))
    })

    it('should throw error when permission not granted', async () => {
      setNotificationPermission('denied')
      await navigator.serviceWorker.register('/sw.js')
      
      await expect(simulatePushNotification({
        title: 'Test'
      })).rejects.toThrow('Notification permission not granted')
    })

    it('should throw error when no service worker', async () => {
      await expect(simulatePushNotification({
        title: 'Test'
      })).rejects.toThrow('No service worker registration found')
    })
  })

  describe('Background Sync', () => {
    beforeEach(() => {
      setupPWAEnvironment()
    })

    it('should simulate background sync', async () => {
      await navigator.serviceWorker.register('/sw.js')
      await new Promise(resolve => setTimeout(resolve, 20))
      
      const tag = await simulateBackgroundSync('test-sync')
      
      expect(tag).toBe('test-sync')
      
      const registration = getServiceWorkerRegistration()
      expect(registration?.sync.register).toHaveBeenCalledWith('test-sync')
    })

    it('should throw error when no sync support', async () => {
      await expect(simulateBackgroundSync('test-sync')).rejects.toThrow('Background sync not supported')
    })
  })

  describe('PWA State Management', () => {
    it('should track installation state correctly', () => {
      setupPWAEnvironment({ isInstalled: false, canInstall: false })
      
      let state = getPWAInstallationState()
      expect(state).toEqual({
        isInstalled: false,
        canInstall: false,
        hasDeferredPrompt: false
      })
      
      // Trigger install prompt
      triggerBeforeInstallPrompt()
      
      state = getPWAInstallationState()
      expect(state.canInstall).toBe(true)
      expect(state.hasDeferredPrompt).toBe(true)
    })
  })

  describe('Cache API', () => {
    beforeEach(() => {
      setupPWAEnvironment()
    })

    it('should work with cache API', async () => {
      const cache = await global.caches.open('test-cache')
      await cache.add('/test.js')
      
      const response = await cache.match('/test.js')
      expect(response).toBeDefined()
      
      const hasCache = await global.caches.has('test-cache')
      expect(hasCache).toBe(true)
    })
  })

  describe('Cleanup', () => {
    it('should clean up all PWA mocks', () => {
      setupPWAEnvironment()
      
      expect(navigator.serviceWorker).toBeDefined()
      expect(global.Notification).toBeDefined()
      expect(global.caches).toBeDefined()
      
      cleanupPWAEnvironment()
      
      expect(navigator.serviceWorker).toBeUndefined()
      expect(global.Notification.permission).toBe('default')
      expect(global.caches).toBeUndefined()
    })
  })
})