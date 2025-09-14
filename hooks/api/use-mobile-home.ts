/**
 * Hooks for mobile home screen data
 */

import { useState, useEffect, useCallback } from 'react'

// Hook for fetching announcements
export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Array<{
    id: string
    label: string
    text: string
    priority: 'high' | 'medium' | 'low'
    createdAt: string
  }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.get<typeof announcements>('/announcements/active')
      
      if (response.success && response.data) {
        setAnnouncements(response.data)
      } else {
        // Fallback to static data if API fails
        setAnnouncements([
          { 
            id: '1', 
            label: '[공지사항]', 
            text: '시스템 점검 안내: 1월 15일 오전 2시~4시',
            priority: 'high',
            createdAt: new Date().toISOString()
          },
          { 
            id: '2',
            label: '[업데이트]', 
            text: '새로운 기능이 추가되었습니다',
            priority: 'medium',
            createdAt: new Date().toISOString()
          },
          { 
            id: '3',
            label: '[안내]', 
            text: '안전교육 일정 안내',
            priority: 'low',
            createdAt: new Date().toISOString()
          }
        ])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch announcements')
      // Use fallback data on error
      setAnnouncements([
        { 
          id: '1', 
          label: '[공지사항]', 
          text: '시스템 점검 안내: 1월 15일 오전 2시~4시',
          priority: 'high',
          createdAt: new Date().toISOString()
        }
      ])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  return {
    announcements,
    loading,
    error,
    refetch: fetchAnnouncements
  }
}

// Hook for fetching today's work summary
export function useTodayWorkSummary() {
  const [summary, setSummary] = useState<{
    totalWorkers: number
    activeWorkers: number
    completedTasks: number
    pendingTasks: number
    safetyIncidents: number
    weatherStatus: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.get<typeof summary>('/dashboard/today-summary')
      
      if (response.success && response.data) {
        setSummary(response.data)
      } else {
        // Mock data for development
        setSummary({
          totalWorkers: 45,
          activeWorkers: 42,
          completedTasks: 15,
          pendingTasks: 8,
          safetyIncidents: 0,
          weatherStatus: '맑음'
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch summary')
      // Use mock data on error
      setSummary({
        totalWorkers: 0,
        activeWorkers: 0,
        completedTasks: 0,
        pendingTasks: 0,
        safetyIncidents: 0,
        weatherStatus: '정보 없음'
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSummary()
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchSummary, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchSummary])

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary
  }
}

// Hook for fetching recent activities
export function useRecentActivities(limit: number = 10) {
  const [activities, setActivities] = useState<Array<{
    id: string
    type: 'report' | 'document' | 'safety' | 'material' | 'worker'
    title: string
    description: string
    user: string
    timestamp: string
    icon?: string
  }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.get<typeof activities>(
        '/dashboard/recent-activities',
        { limit }
      )
      
      if (response.success && response.data) {
        setActivities(response.data)
      } else {
        setActivities([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activities')
      setActivities([])
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchActivities()
    
    // Refresh every minute
    const interval = setInterval(fetchActivities, 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchActivities])

  return {
    activities,
    loading,
    error,
    refetch: fetchActivities
  }
}

// Hook for fetching quick menu stats
export function useQuickMenuStats() {
  const [stats, setStats] = useState<{
    dailyReports: { today: number; pending: number }
    documents: { total: number; unread: number }
    requests: { open: number; urgent: number }
    inventory: { lowStock: number; orders: number }
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.get<typeof stats>('/dashboard/quick-menu-stats')
      
      if (response.success && response.data) {
        setStats(response.data)
      } else {
        // Mock data
        setStats({
          dailyReports: { today: 3, pending: 1 },
          documents: { total: 156, unread: 5 },
          requests: { open: 2, urgent: 1 },
          inventory: { lowStock: 3, orders: 2 }
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats')
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}

// Combined hook for all home screen data
export function useMobileHomeData() {
  const announcements = useAnnouncements()
  const todaySummary = useTodayWorkSummary()
  const recentActivities = useRecentActivities(5)
  const quickMenuStats = useQuickMenuStats()

  const loading = 
    announcements.loading || 
    todaySummary.loading || 
    recentActivities.loading ||
    quickMenuStats.loading

  const error = 
    announcements.error || 
    todaySummary.error || 
    recentActivities.error ||
    quickMenuStats.error

  const refetchAll = useCallback(() => {
    announcements.refetch()
    todaySummary.refetch()
    recentActivities.refetch()
    quickMenuStats.refetch()
  }, [announcements, todaySummary, recentActivities, quickMenuStats])

  return {
    announcements: announcements.announcements,
    todaySummary: todaySummary.summary,
    recentActivities: recentActivities.activities,
    quickMenuStats: quickMenuStats.stats,
    loading,
    error,
    refetch: refetchAll
  }
}