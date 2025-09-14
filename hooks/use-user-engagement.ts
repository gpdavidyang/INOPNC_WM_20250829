'use client'


interface UserEngagement {
  pageViews: number
  timeOnSite: number
  featuresUsed: string[]
  formsSubmitted: number
  dailyReportsCreated: number
  materialsRequested: number
  attendanceMarked: number
  lastActiveDate: string
  engagementScore: number
  isEngaged: boolean
}

const ENGAGEMENT_THRESHOLDS = {
  PAGE_VIEWS_WEIGHT: 2,
  TIME_ON_SITE_WEIGHT: 3, // per minute
  FEATURE_USAGE_WEIGHT: 15,
  FORM_SUBMISSION_WEIGHT: 10,
  ACTION_WEIGHT: 20, // for daily reports, materials, etc.
  ENGAGEMENT_THRESHOLD: 25
}

export function useUserEngagement() {
  const pathname = usePathname()
  const [engagement, setEngagement] = useState<UserEngagement>({
    pageViews: 0,
    timeOnSite: 0,
    featuresUsed: [],
    formsSubmitted: 0,
    dailyReportsCreated: 0,
    materialsRequested: 0,
    attendanceMarked: 0,
    lastActiveDate: new Date().toISOString(),
    engagementScore: 0,
    isEngaged: false
  })

  useEffect(() => {
    loadEngagementData()
    trackPageView()
    trackTimeOnSite()
  }, [pathname])

  const loadEngagementData = () => {
    try {
      const stored = localStorage.getItem('user-engagement')
      if (stored) {
        const data = JSON.parse(stored)
        const calculatedEngagement = calculateEngagementScore(data)
        setEngagement(calculatedEngagement)
      } else {
        // Initialize for new users
        const initial = {
          ...engagement,
          lastActiveDate: new Date().toISOString()
        }
        saveEngagementData(initial)
        setEngagement(initial)
      }
    } catch (error) {
      console.error('Failed to load engagement data:', error)
    }
  }

  const saveEngagementData = (data: UserEngagement) => {
    try {
      localStorage.setItem('user-engagement', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save engagement data:', error)
    }
  }

  const calculateEngagementScore = (data: Partial<UserEngagement>): UserEngagement => {
    let score = 0
    
    // Page views (max 20 points)
    score += Math.min((data.pageViews || 0) * ENGAGEMENT_THRESHOLDS.PAGE_VIEWS_WEIGHT, 20)
    
    // Time on site (max 30 points)
    const timeInMinutes = (data.timeOnSite || 0) / 60000
    score += Math.min(timeInMinutes * ENGAGEMENT_THRESHOLDS.TIME_ON_SITE_WEIGHT, 30)
    
    // Feature usage (max 45 points)
    score += Math.min((data.featuresUsed?.length || 0) * ENGAGEMENT_THRESHOLDS.FEATURE_USAGE_WEIGHT, 45)
    
    // Form submissions (max 50 points)
    score += Math.min((data.formsSubmitted || 0) * ENGAGEMENT_THRESHOLDS.FORM_SUBMISSION_WEIGHT, 50)
    
    // High-value actions
    score += (data.dailyReportsCreated || 0) * ENGAGEMENT_THRESHOLDS.ACTION_WEIGHT
    score += (data.materialsRequested || 0) * ENGAGEMENT_THRESHOLDS.ACTION_WEIGHT
    score += (data.attendanceMarked || 0) * ENGAGEMENT_THRESHOLDS.ACTION_WEIGHT

    const finalData = {
      pageViews: data.pageViews || 0,
      timeOnSite: data.timeOnSite || 0,
      featuresUsed: data.featuresUsed || [],
      formsSubmitted: data.formsSubmitted || 0,
      dailyReportsCreated: data.dailyReportsCreated || 0,
      materialsRequested: data.materialsRequested || 0,
      attendanceMarked: data.attendanceMarked || 0,
      lastActiveDate: data.lastActiveDate || new Date().toISOString(),
      engagementScore: Math.round(score),
      isEngaged: score >= ENGAGEMENT_THRESHOLDS.ENGAGEMENT_THRESHOLD
    }

    return finalData
  }

  const trackPageView = () => {
    setEngagement(prev => {
      const updated = {
        ...prev,
        pageViews: prev.pageViews + 1,
        lastActiveDate: new Date().toISOString()
      }
      const calculated = calculateEngagementScore(updated)
      saveEngagementData(calculated)
      return calculated
    })
  }

  const trackTimeOnSite = () => {
    const startTime = Date.now()
    
    const updateTime = () => {
      const timeSpent = Date.now() - startTime
      setEngagement(prev => {
        const updated = {
          ...prev,
          timeOnSite: prev.timeOnSite + timeSpent,
          lastActiveDate: new Date().toISOString()
        }
        const calculated = calculateEngagementScore(updated)
        saveEngagementData(calculated)
        return calculated
      })
    }

    // Update time every 30 seconds
    const interval = setInterval(updateTime, 30000)
    
    // Update on page unload
    const handleBeforeUnload = () => {
      updateTime()
      clearInterval(interval)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      updateTime()
    }
  }

  const trackFeatureUsage = (feature: string) => {
    setEngagement(prev => {
      const featuresUsed = [...new Set([...prev.featuresUsed, feature])]
      const updated = {
        ...prev,
        featuresUsed,
        lastActiveDate: new Date().toISOString()
      }
      const calculated = calculateEngagementScore(updated)
      saveEngagementData(calculated)
      return calculated
    })
  }

  const trackFormSubmission = () => {
    setEngagement(prev => {
      const updated = {
        ...prev,
        formsSubmitted: prev.formsSubmitted + 1,
        lastActiveDate: new Date().toISOString()
      }
      const calculated = calculateEngagementScore(updated)
      saveEngagementData(calculated)
      return calculated
    })
  }

  const trackDailyReportCreated = () => {
    setEngagement(prev => {
      const updated = {
        ...prev,
        dailyReportsCreated: prev.dailyReportsCreated + 1,
        lastActiveDate: new Date().toISOString()
      }
      const calculated = calculateEngagementScore(updated)
      saveEngagementData(calculated)
      return calculated
    })
  }

  const trackMaterialRequested = () => {
    setEngagement(prev => {
      const updated = {
        ...prev,
        materialsRequested: prev.materialsRequested + 1,
        lastActiveDate: new Date().toISOString()
      }
      const calculated = calculateEngagementScore(updated)
      saveEngagementData(calculated)
      return calculated
    })
  }

  const trackAttendanceMarked = () => {
    setEngagement(prev => {
      const updated = {
        ...prev,
        attendanceMarked: prev.attendanceMarked + 1,
        lastActiveDate: new Date().toISOString()
      }
      const calculated = calculateEngagementScore(updated)
      saveEngagementData(calculated)
      return calculated
    })
  }

  const resetEngagement = () => {
    const reset = {
      pageViews: 0,
      timeOnSite: 0,
      featuresUsed: [],
      formsSubmitted: 0,
      dailyReportsCreated: 0,
      materialsRequested: 0,
      attendanceMarked: 0,
      lastActiveDate: new Date().toISOString(),
      engagementScore: 0,
      isEngaged: false
    }
    setEngagement(reset)
    saveEngagementData(reset)
  }

  return {
    engagement,
    trackFeatureUsage,
    trackFormSubmission,
    trackDailyReportCreated,
    trackMaterialRequested,
    trackAttendanceMarked,
    resetEngagement
  }
}