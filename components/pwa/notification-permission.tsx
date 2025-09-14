'use client'


interface NotificationPermissionState {
  permission: NotificationPermission
  isPromptVisible: boolean
  hasUserEngaged: boolean
  showReEngagement: boolean
  engagementScore: number
}

interface NotificationBenefit {
  icon: React.ReactNode
  title: string
  description: string
  urgency: 'high' | 'medium' | 'low'
}

const NOTIFICATION_BENEFITS: NotificationBenefit[] = [
  {
    icon: <Shield className="h-5 w-5 text-red-500" />,
    title: '긴급 안전 알림',
    description: '현장 안전사고나 위험 상황을 즉시 알려드립니다',
    urgency: 'high'
  },
  {
    icon: <Bell className="h-5 w-5 text-blue-500" />,
    title: '자재 승인 알림',
    description: '자재 요청이 승인되거나 반려될 때 바로 확인하세요',
    urgency: 'high'
  },
  {
    icon: <Clock className="h-5 w-5 text-orange-500" />,
    title: '작업일지 리마인더',
    description: '작업일지 작성 시간을 놓치지 않도록 미리 알려드립니다',
    urgency: 'medium'
  },
  {
    icon: <Wrench className="h-5 w-5 text-purple-500" />,
    title: '장비 정비 알림',
    description: '장비 점검 및 정비 일정을 사전에 안내해드립니다',
    urgency: 'medium'
  },
  {
    icon: <Megaphone className="h-5 w-5 text-green-500" />,
    title: '현장 공지사항',
    description: '중요한 현장 소식과 업데이트를 실시간으로 받아보세요',
    urgency: 'low'
  }
]

export function NotificationPermission() {
  const { profile, updateProfile } = useProfile()
  const [state, setState] = useState<NotificationPermissionState>({
    permission: 'default',
    isPromptVisible: false,
    hasUserEngaged: false,
    showReEngagement: false,
    engagementScore: 0
  })

  useEffect(() => {
    // Delay PWA initialization to allow authentication to settle
    const initializePushService = async () => {
      // Wait for potential authentication to complete
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const initialized = await pushNotificationService.initialize()
      
      if (initialized && 'Notification' in window) {
        setState(prev => ({
          ...prev,
          permission: Notification.permission
        }))
      } else {
        console.log('[NotificationPermission] Push service initialization skipped - no authentication or unsupported')
      }
    }

    initializePushService()

    // Load user engagement data
    loadUserEngagement()

    // Track user engagement
    trackUserEngagement()
  }, [])

  useEffect(() => {
    // Show permission prompt based on engagement
    const shouldShowPrompt = shouldShowPermissionPrompt()
    if (shouldShowPrompt && !state.isPromptVisible) {
      setState(prev => ({ ...prev, isPromptVisible: true }))
    }
  }, [state.engagementScore, state.hasUserEngaged])

  const loadUserEngagement = () => {
    try {
      const stored = localStorage.getItem('notification-engagement')
      if (stored) {
        const engagement = JSON.parse(stored)
        setState(prev => ({
          ...prev,
          hasUserEngaged: engagement.hasUserEngaged || false,
          engagementScore: engagement.score || 0,
          showReEngagement: engagement.showReEngagement || false
        }))
      }
    } catch (error) {
      console.error('Failed to load user engagement:', error)
    }
  }

  const saveUserEngagement = (engagement: Partial<NotificationPermissionState>) => {
    try {
      const current = {
        hasUserEngaged: state.hasUserEngaged,
        score: state.engagementScore,
        showReEngagement: state.showReEngagement,
        ...engagement
      }
      localStorage.setItem('notification-engagement', JSON.stringify(current))
    } catch (error) {
      console.error('Failed to save user engagement:', error)
    }
  }

  const trackUserEngagement = () => {
    let engagementScore = 0
    let hasEngaged = false

    // Track various engagement indicators
    const startTime = Date.now()
    
    // Page views
    const pageViews = parseInt(localStorage.getItem('page-views') || '0')
    engagementScore += Math.min(pageViews * 2, 20)

    // Time on site
    const sessionStart = parseInt(sessionStorage.getItem('session-start') || startTime.toString())
    const timeOnSite = (startTime - sessionStart) / 1000 / 60 // minutes
    engagementScore += Math.min(timeOnSite * 3, 30)

    // Feature usage
    const featuresUsed = [
      localStorage.getItem('used-daily-reports'),
      localStorage.getItem('used-materials'),
      localStorage.getItem('used-attendance')
    ].filter(Boolean).length
    engagementScore += featuresUsed * 15

    // Form submissions
    const formsSubmitted = parseInt(localStorage.getItem('forms-submitted') || '0')
    engagementScore += Math.min(formsSubmitted * 10, 50)

    hasEngaged = engagementScore >= 25 // Threshold for engagement

    setState(prev => ({
      ...prev,
      engagementScore: Math.round(engagementScore),
      hasUserEngaged: hasEngaged
    }))

    // Save engagement data
    saveUserEngagement({ engagementScore: Math.round(engagementScore), hasUserEngaged: hasEngaged })
  }

  const shouldShowPermissionPrompt = (): boolean => {
    // Don't show if already granted or user explicitly denied
    if (state.permission === 'granted') return false
    if (state.permission === 'denied' && !state.showReEngagement) return false

    // Progressive engagement strategy
    return state.hasUserEngaged && state.engagementScore >= 25
  }

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) {
      alert('이 브라우저는 알림을 지원하지 않습니다.')
      return
    }

    try {
      const permission = await pushNotificationService.requestPermission()
      
      setState(prev => ({
        ...prev,
        permission,
        isPromptVisible: false,
        showReEngagement: permission === 'denied'
      }))

      // Save permission state to profile
      if (profile) {
        await updateProfile({
          notification_preferences: {
            ...profile.notification_preferences,
            push_enabled: permission === 'granted',
            permission_requested_at: new Date().toISOString()
          }
        })
      }

      // Save engagement state
      saveUserEngagement({ 
        showReEngagement: permission === 'denied',
        hasUserEngaged: true 
      })

      if (permission === 'granted') {
        // Subscribe to push notifications
        await pushNotificationService.subscribeToPush()
        
        // Show success message using the push notification service
        await pushNotificationService.sendTestNotification()
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error)
    }
  }

  const handleDismiss = () => {
    setState(prev => ({ ...prev, isPromptVisible: false }))
    
    // Delay showing again
    setTimeout(() => {
      saveUserEngagement({ showReEngagement: true })
    }, 24 * 60 * 60 * 1000) // 24 hours
  }

  const handleReEngagement = () => {
    setState(prev => ({ 
      ...prev, 
      isPromptVisible: true,
      showReEngagement: false 
    }))
  }

  // Don't render if notifications not supported
  if (!('Notification' in window)) {
    return null
  }

  // Show re-engagement button for denied permissions
  if (state.permission === 'denied' && state.showReEngagement && !state.isPromptVisible) {
    return (
      <div className="fixed bottom-20 right-4 z-40 md:bottom-4">
        <button
          onClick={handleReEngagement}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
        >
          <Bell className="h-4 w-4" />
          알림 활성화
        </button>
      </div>
    )
  }

  // Main permission prompt
  if (!state.isPromptVisible || state.permission === 'granted') {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 pb-4">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                알림 권한 요청
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                더 나은 현장 관리를 위해
              </p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="px-6 pb-4">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            INOPNC 알림을 활성화하면 다음과 같은 혜택을 받으실 수 있습니다:
          </p>
          
          <div className="space-y-3">
            {NOTIFICATION_BENEFITS.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex-shrink-0 mt-0.5">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                    {benefit.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {benefit.description}
                  </p>
                </div>
                {benefit.urgency === 'high' && (
                  <div className="flex-shrink-0">
                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-medium rounded-full">
                      긴급
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Note */}
        <div className="px-6 pb-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>개인정보 보호:</strong> 알림은 작업 관련 내용만 포함되며, 개인정보는 안전하게 보호됩니다. 
                  언제든지 설정에서 알림을 끄실 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              나중에
            </button>
            <button
              onClick={handleRequestPermission}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Bell className="h-4 w-4" />
              알림 허용
            </button>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
            브라우저에서 알림 권한을 요청합니다
          </p>
        </div>
      </div>
    </div>
  )
}

// Hook for notification permission status
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initializeService = async () => {
      const supported = pushNotificationService.isSupported()
      setIsSupported(supported)
      
      if (supported) {
        await pushNotificationService.initialize()
        setPermission(pushNotificationService.getPermissionStatus())
        setIsInitialized(true)

        // Listen for permission changes
        const checkPermission = () => setPermission(pushNotificationService.getPermissionStatus())
        
        // Check periodically for permission changes
        const interval = setInterval(checkPermission, 5000)
        
        return () => clearInterval(interval)
      }
    }

    initializeService()
  }, [])

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported || !isInitialized) return 'denied'
    
    const result = await pushNotificationService.requestPermission()
    setPermission(result)
    return result
  }

  return {
    permission,
    isSupported,
    isInitialized,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
    isDefault: permission === 'default',
    requestPermission
  }
}