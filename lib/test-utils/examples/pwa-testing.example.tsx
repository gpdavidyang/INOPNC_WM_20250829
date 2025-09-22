/**
 * PWA Testing Examples
 * 
 * This file demonstrates how to use the PWA testing infrastructure
 * for testing Progressive Web App features in your application.
 */


// Example 1: Testing PWA installation flow
export async function testPWAInstallation() {
  // Setup environment with installation available
  setupPWAEnvironment({
    canInstall: true,
    isInstalled: false
  })

  // Component that shows install button
  const InstallButton = () => {
    const [canInstall, setCanInstall] = useState(false)
    const [deferredPrompt, setDeferredPrompt] = useState<unknown>(null)

    useEffect(() => {
      const handler = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e)
        setCanInstall(true)
      }

      window.addEventListener('beforeinstallprompt', handler)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstall = async () => {
      if (!deferredPrompt) return

      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setCanInstall(false)
      }
    }

    return canInstall ? (
      <button onClick={handleInstall}>앱 설치</button>
    ) : null
  }

  // Test the component
  const { getByText, queryByText } = render(<InstallButton />)
  
  // Initially no button
  expect(queryByText('앱 설치')).toBeNull()

  // Trigger install prompt
  triggerBeforeInstallPrompt()
  
  // Button should appear
  await waitFor(() => {
    expect(getByText('앱 설치')).toBeInTheDocument()
  })

  // Click install button and accept
  fireEvent.click(getByText('앱 설치'))
  await simulateAppInstallation(true)

  // Button should disappear
  await waitFor(() => {
    expect(queryByText('앱 설치')).toBeNull()
  })

  // Verify installation state
  const state = getPWAInstallationState()
  expect(state.isInstalled).toBe(true)
}

// Example 2: Testing push notification permission
export async function testPushNotificationPermission() {
  setupPWAEnvironment({
    notificationPermission: 'default'
  })

  const NotificationPermission = () => {
    const [permission, setPermission] = useState(Notification.permission)

    const requestPermission = async () => {
      const result = await Notification.requestPermission()
      setPermission(result)
    }

    return (
      <div>
        <p>권한: {permission}</p>
        {permission === 'default' && (
          <button onClick={requestPermission}>알림 허용</button>
        )}
      </div>
    )
  }

  const { getByText } = render(<NotificationPermission />)
  
  expect(getByText('권한: default')).toBeInTheDocument()
  expect(getByText('알림 허용')).toBeInTheDocument()

  // Simulate granting permission
  setNotificationPermission('granted')
  fireEvent.click(getByText('알림 허용'))

  await waitFor(() => {
    expect(getByText('권한: granted')).toBeInTheDocument()
  })
}

// Example 3: Testing service worker registration
export async function testServiceWorkerRegistration() {
  setupPWAEnvironment()

  const ServiceWorkerStatus = () => {
    const [status, setStatus] = useState<'idle' | 'registering' | 'registered' | 'error'>('idle')

    useEffect(() => {
      if ('serviceWorker' in navigator) {
        setStatus('registering')
        navigator.serviceWorker
          .register('/sw.js')
          .then(() => setStatus('registered'))
          .catch(() => setStatus('error'))
      }
    }, [])

    return <div>서비스워커: {status}</div>
  }

  const { getByText } = render(<ServiceWorkerStatus />)
  
  expect(getByText('서비스워커: registering')).toBeInTheDocument()

  await waitFor(() => {
    expect(getByText('서비스워커: registered')).toBeInTheDocument()
  })

  // Verify registration
  const registration = await navigator.serviceWorker.getRegistration()
  expect(registration).toBeDefined()
}

// Example 4: Testing push notifications
export async function testPushNotifications() {
  setupPWAEnvironment({ notificationPermission: 'granted' })
  
  // Register service worker first
  await navigator.serviceWorker.register('/sw.js')
  await new Promise(resolve => setTimeout(resolve, 50))

  const PushNotificationTest = () => {
    const [lastNotification, setLastNotification] = useState<string>('')

    const sendTestNotification = async () => {
      try {
        const notification = await simulatePushNotification({
          title: '새로운 작업일지',
          body: '오늘의 작업일지가 등록되었습니다.',
          icon: '/icon-192.png',
          badge: '/badge-72.png',
          tag: 'daily-report',
          data: { reportId: '123' }
        })
        
        setLastNotification(notification.title)
      } catch (error) {
        console.error('Notification failed:', error)
      }
    }

    return (
      <div>
        <button onClick={sendTestNotification}>테스트 알림</button>
        {lastNotification && <p>마지막 알림: {lastNotification}</p>}
      </div>
    )
  }

  const { getByText } = render(<PushNotificationTest />)
  
  fireEvent.click(getByText('테스트 알림'))

  await waitFor(() => {
    expect(getByText('마지막 알림: 새로운 작업일지')).toBeInTheDocument()
  })
}

// Example 5: Testing service worker update
export async function testServiceWorkerUpdate() {
  setupPWAEnvironment()
  
  await navigator.serviceWorker.register('/sw.js')

  const UpdatePrompt = () => {
    const [updateAvailable, setUpdateAvailable] = useState(false)

    useEffect(() => {
      navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true)
            }
          })
        })
      })
    }, [])

    const applyUpdate = () => {
      window.location.reload()
    }

    return updateAvailable ? (
      <div>
        <p>새 버전이 있습니다!</p>
        <button onClick={applyUpdate}>업데이트</button>
      </div>
    ) : null
  }

  const { getByText } = render(<UpdatePrompt />)
  
  // Simulate service worker update
  await simulateServiceWorkerUpdate()

  await waitFor(() => {
    expect(getByText('새 버전이 있습니다!')).toBeInTheDocument()
    expect(getByText('업데이트')).toBeInTheDocument()
  })
}

// Example 6: Testing background sync
export async function testBackgroundSync() {
  setupPWAEnvironment()
  
  await navigator.serviceWorker.register('/sw.js')
  await new Promise(resolve => setTimeout(resolve, 50))

  const OfflineForm = () => {
    const [syncStatus, setSyncStatus] = useState<'idle' | 'pending' | 'synced'>('idle')

    const submitForm = async (data: unknown) => {
      // Save to IndexedDB
      await saveToIndexedDB(data)
      
      // Register sync
      if ('sync' in registration) {
        await simulateBackgroundSync('form-sync')
        setSyncStatus('pending')
        
        // Simulate sync completion
        setTimeout(() => setSyncStatus('synced'), 1000)
      }
    }

    return (
      <div>
        <form onSubmit={e => {
          e.preventDefault()
          submitForm({ message: 'Test data' })
        }}>
          <button type="submit">저장</button>
        </form>
        {syncStatus === 'pending' && <p>동기화 대기중...</p>}
        {syncStatus === 'synced' && <p>동기화 완료!</p>}
      </div>
    )
  }

  const { getByText } = render(<OfflineForm />)
  
  fireEvent.click(getByText('저장'))

  await waitFor(() => {
    expect(getByText('동기화 대기중...')).toBeInTheDocument()
  })

  await waitFor(() => {
    expect(getByText('동기화 완료!')).toBeInTheDocument()
  }, { timeout: 2000 })
}

// Example 7: Testing cache strategies
export async function testCacheStrategies() {
  setupPWAEnvironment()

  // Test cache-first strategy
  const testCacheFirst = async () => {
    const cache = await caches.open('v1-cache')
    
    // Pre-cache resources
    await cache.addAll([
      '/',
      '/static/css/main.css',
      '/static/js/app.js'
    ])

    // Verify cached
    const response = await cache.match('/static/css/main.css')
    expect(response).toBeDefined()
    expect(response).toBeInstanceOf(Response)
  }

  // Test network-first with fallback
  const testNetworkFirst = async () => {
    const fetchWithFallback = async (url: string) => {
      try {
        // Try network first
        const response = await fetch(url)
        
        // Cache successful response
        const cache = await caches.open('v1-cache')
        await cache.put(url, response.clone())
        
        return response
      } catch (error) {
        // Fall back to cache
        const cached = await caches.match(url)
        if (cached) return cached
        
        throw error
      }
    }

    // Test the strategy
    const response = await fetchWithFallback('/api/data')
    expect(response).toBeDefined()
  }

  await testCacheFirst()
  await testNetworkFirst()
}

// Example 8: Testing offline functionality
export async function testOfflineMode() {
  setupPWAEnvironment()

  const OfflineIndicator = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine)

    useEffect(() => {
      const handleOnline = () => setIsOnline(true)
      const handleOffline = () => setIsOnline(false)

      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }, [])

    return (
      <div className={isOnline ? 'online' : 'offline'}>
        {isOnline ? '온라인' : '오프라인'}
      </div>
    )
  }

  const { getByText } = render(<OfflineIndicator />)
  
  expect(getByText('온라인')).toBeInTheDocument()

  // Simulate going offline
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: false
  })
  window.dispatchEvent(new Event('offline'))

  await waitFor(() => {
    expect(getByText('오프라인')).toBeInTheDocument()
  })

  // Simulate coming back online
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true
  })
  window.dispatchEvent(new Event('online'))

  await waitFor(() => {
    expect(getByText('온라인')).toBeInTheDocument()
  })
}

// Example 9: Integration test with all PWA features
export async function testPWAIntegration() {
  // Setup complete PWA environment
  setupPWAEnvironment({
    serviceWorkerSupported: true,
    notificationPermission: 'granted',
    isInstalled: false,
    canInstall: true
  })

  // Register service worker
  const registration = await navigator.serviceWorker.register('/sw.js')
  expect(registration).toBeDefined()

  // Test installation flow
  const installEvent = triggerBeforeInstallPrompt()
  expect(installEvent.platforms).toContain('web')

  // Accept installation
  const outcome = await simulateAppInstallation(true)
  expect(outcome).toBe('accepted')

  // Verify installed state
  const state = getPWAInstallationState()
  expect(state.isInstalled).toBe(true)

  // Test push notification
  const notification = await simulatePushNotification({
    title: 'PWA Test Complete',
    body: 'All features working correctly'
  })
  expect(notification.title).toBe('PWA Test Complete')

  // Test background sync
  const syncTag = await simulateBackgroundSync('test-complete')
  expect(syncTag).toBe('test-complete')

  // Verify cache
  const cache = await caches.open('test-cache')
  await cache.add('/test-resource')
  const cached = await cache.match('/test-resource')
  expect(cached).toBeDefined()
}

// Helper function for IndexedDB (mock)
async function saveToIndexedDB(data: unknown) {
  return Promise.resolve()
}