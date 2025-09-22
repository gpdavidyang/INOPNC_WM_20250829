/**
 * Type-safe hooks for Daily Reports API
 */

import { useState, useEffect, useCallback } from 'react'
import type { ApiResponse, PaginatedResponse } from '@/types/api'
import type { DailyReport, DailyReportInput } from '@/types/database'

// Hook for fetching paginated daily reports
export function useDailyReports(
  page: number = 1,
  limit: number = 20,
  filters?: {
    siteId?: string
    startDate?: string
    endDate?: string
    status?: string
  }
) {
  const [data, setData] = useState<PaginatedResponse<DailyReport> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.getPaginated<DailyReport>(
        '/daily-reports',
        page,
        limit,
        filters
      )

      if (response.success) {
        setData(response.data)
      } else {
        setError(response.error || 'Failed to fetch daily reports')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [page, limit, filters])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  return {
    reports: data?.items || [],
    totalCount: data?.totalCount || 0,
    totalPages: data?.totalPages || 0,
    currentPage: data?.page || page,
    loading,
    error,
    refetch: fetchReports
  }
}

// Hook for fetching a single daily report
export function useDailyReport(id: string | null) {
  const [data, setData] = useState<DailyReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReport = useCallback(async () => {
    if (!id) {
      setData(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.get<DailyReport>(`/daily-reports/${id}`)

      if (response.success) {
        setData(response.data)
      } else {
        setError(response.error || 'Failed to fetch daily report')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  return {
    report: data,
    loading,
    error,
    refetch: fetchReport
  }
}

// Hook for creating a daily report
export function useCreateDailyReport() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createReport = async (data: DailyReportInput): Promise<DailyReport | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.post<DailyReport>('/daily-reports', data)

      if (response.success) {
        return response.data
      } else {
        setError(response.error || 'Failed to create daily report')
        return null
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    createReport,
    loading,
    error
  }
}

// Hook for updating a daily report
export function useUpdateDailyReport() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateReport = async (
    id: string,
    data: Partial<DailyReportInput>
  ): Promise<DailyReport | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.put<DailyReport>(`/daily-reports/${id}`, data)

      if (response.success) {
        return response.data
      } else {
        setError(response.error || 'Failed to update daily report')
        return null
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    updateReport,
    loading,
    error
  }
}

// Hook for deleting a daily report
export function useDeleteDailyReport() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteReport = async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.delete(`/daily-reports/${id}`)

      if (response.success) {
        return true
      } else {
        setError(response.error || 'Failed to delete daily report')
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    deleteReport,
    loading,
    error
  }
}

// Hook for uploading images to a daily report
export function useUploadReportImages() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const uploadImages = async (
    reportId: string,
    files: File[]
  ): Promise<string[] | null> => {
    setLoading(true)
    setError(null)
    setProgress(0)

    const uploadedUrls: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const response = await apiClient.upload<{ url: string }>(
          `/daily-reports/${reportId}/images`,
          files[i],
          { type: 'report_image' }
        )

        if (response.success && response.data) {
          uploadedUrls.push(response.data.url)
          setProgress(((i + 1) / files.length) * 100)
        } else {
          throw new Error(`Failed to upload image ${i + 1}`)
        }
      }

      return uploadedUrls
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  return {
    uploadImages,
    loading,
    error,
    progress
  }
}

// Hook for generating daily report PDF
export function useGenerateReportPDF() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generatePDF = async (reportId: string): Promise<Blob | null> => {
    setLoading(true)
    setError(null)

    try {
      const blob = await apiClient.download(`/daily-reports/${reportId}/pdf`)
      
      if (blob) {
        return blob
      } else {
        setError('Failed to generate PDF')
        return null
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async (reportId: string, filename?: string) => {
    const blob = await generatePDF(reportId)
    
    if (blob) {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || `daily-report-${reportId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return {
    generatePDF,
    downloadPDF,
    loading,
    error
  }
}

// Combined hook for daily report statistics
export function useDailyReportStats(siteId?: string, dateRange?: { start: string; end: string }) {
  const [stats, setStats] = useState<{
    totalReports: number
    completedReports: number
    pendingReports: number
    totalWorkers: number
    totalHours: number
    averageHoursPerDay: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.get<typeof stats>(
        '/daily-reports/stats',
        {
          siteId,
          startDate: dateRange?.start,
          endDate: dateRange?.end
        }
      )

      if (response.success) {
        setStats(response.data)
      } else {
        setError(response.error || 'Failed to fetch statistics')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [siteId, dateRange])

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