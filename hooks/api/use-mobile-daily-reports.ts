/**
 * Mobile Daily Reports API hooks
 * Connects to /api/mobile/daily-reports endpoint
 */

import { useCallback, useEffect, useState } from 'react'

// API Response types
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

interface PaginatedDailyReports {
  reports: DailyReportItem[]
  totalCount: number
  totalPages: number
  currentPage: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// Daily Report types for mobile
export interface DailyReportItem {
  id: string
  site_id: string
  work_date: string
  weather: string
  temperature_high?: number | null
  temperature_low?: number | null
  work_start_time?: string | null
  work_end_time?: string | null
  total_workers: number
  work_description: string
  safety_notes?: string | null
  special_notes?: string | null
  status: 'draft' | 'submitted' | 'reviewed' | 'approved' | 'rejected'
  created_by: string
  created_at: string
  updated_at: string
  // Optional JSON columns for richer prefill
  work_content?: {
    memberTypes?: string[]
    workProcesses?: string[]
    workTypes?: string[]
    tasks?: Array<{
      memberTypes?: string[]
      workProcesses?: string[]
      workTypes?: string[]
      location?: { block?: string; dong?: string; unit?: string }
    }>
    totalManpower?: number
    mainManpower?: number
    additionalManpower?: Array<{ name?: string; manpower?: number }>
  } | null
  location_info?: {
    block?: string
    dong?: string
    unit?: string
  } | null
  sites?: {
    id: string
    name: string
    address: string
    organization_id?: string
  }
  profiles?: {
    id: string
    full_name: string
    role: string
  }
}

export interface CreateDailyReportRequest {
  site_id: string
  work_date: string
  weather: string
  temperature_high?: number
  temperature_low?: number
  work_start_time?: string
  work_end_time?: string
  total_workers: number
  work_description: string
  safety_notes?: string
  special_notes?: string
  materials_used?: any[]
  equipment_used?: any[]
  status?: string
}

// Hook for fetching paginated daily reports for mobile
export function useMobileDailyReports(
  page: number = 1,
  limit: number = 20,
  filters?: {
    site_id?: string
    start_date?: string
    end_date?: string
    status?: string
  }
) {
  const [data, setData] = useState<PaginatedDailyReports | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters?.site_id && { site_id: filters.site_id }),
        ...(filters?.start_date && { start_date: filters.start_date }),
        ...(filters?.end_date && { end_date: filters.end_date }),
        ...(filters?.status && { status: filters.status }),
      })

      const response = await fetch(`/api/mobile/daily-reports?${params}`)

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('인증이 필요합니다')
        } else if (response.status === 403) {
          throw new Error('접근 권한이 없습니다')
        }
        throw new Error(`API Error: ${response.status}`)
      }

      const result: ApiResponse<PaginatedDailyReports> = await response.json()

      if (result.success && result.data) {
        setData(result.data)
      } else {
        setError(result.error || '일일 보고서를 가져오는데 실패했습니다')
      }
    } catch (err) {
      console.error('Daily reports fetch error:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }, [page, limit, filters])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  return {
    reports: data?.reports || [],
    totalCount: data?.totalCount || 0,
    totalPages: data?.totalPages || 0,
    currentPage: data?.currentPage || page,
    hasNextPage: data?.hasNextPage || false,
    hasPreviousPage: data?.hasPreviousPage || false,
    loading,
    error,
    refetch: fetchReports,
  }
}

// Hook for creating a new daily report
export function useCreateMobileDailyReport() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createReport = async (data: CreateDailyReportRequest): Promise<DailyReportItem | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/mobile/daily-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('인증이 필요합니다')
        } else if (response.status === 403) {
          throw new Error('해당 현장에 대한 권한이 없습니다')
        } else if (response.status === 400) {
          const errorResult = await response.json()
          throw new Error(errorResult.error || '입력 정보를 확인해주세요')
        }
        throw new Error(`API Error: ${response.status}`)
      }

      const result: ApiResponse<DailyReportItem> = await response.json()

      if (result.success && result.data) {
        return result.data
      } else {
        setError(result.error || '일일 보고서 생성에 실패했습니다')
        return null
      }
    } catch (err) {
      console.error('Create daily report error:', err)
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    createReport,
    loading,
    error,
    clearError: () => setError(null),
  }
}

// Hook for fetching today's reports specifically
export function useTodayDailyReports(siteId?: string) {
  const today = new Date().toISOString().split('T')[0]

  return useMobileDailyReports(1, 10, {
    start_date: today,
    end_date: today,
    site_id: siteId,
  })
}

// Hook for fetching recent reports (last 7 days)
export function useRecentDailyReports(siteId?: string, days: number = 7) {
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  return useMobileDailyReports(1, 20, {
    start_date: startDate,
    end_date: endDate,
    site_id: siteId,
  })
}

// Hook for getting daily reports statistics
export function useDailyReportsStats(siteId?: string, dateRange?: { start: string; end: string }) {
  const [stats, setStats] = useState<{
    totalReports: number
    totalWorkers: number
    avgWorkersPerDay: number
    recentReports: DailyReportItem[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          limit: '100', // Get more data for stats calculation
          ...(siteId && { site_id: siteId }),
          ...(dateRange?.start && { start_date: dateRange.start }),
          ...(dateRange?.end && { end_date: dateRange.end }),
        })

        const response = await fetch(`/api/mobile/daily-reports?${params}`)

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`)
        }

        const result: ApiResponse<PaginatedDailyReports> = await response.json()

        if (result.success && result.data) {
          const reports = result.data.reports
          const totalWorkers = reports.reduce((sum, report) => sum + report.total_workers, 0)
          const avgWorkersPerDay = reports.length > 0 ? totalWorkers / reports.length : 0

          setStats({
            totalReports: result.data.totalCount,
            totalWorkers,
            avgWorkersPerDay: Math.round(avgWorkersPerDay * 10) / 10,
            recentReports: reports.slice(0, 5), // Latest 5 reports
          })
        } else {
          setError(result.error || '통계를 가져오는데 실패했습니다')
        }
      } catch (err) {
        console.error('Stats fetch error:', err)
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [siteId, dateRange])

  return {
    stats,
    loading,
    error,
  }
}
