import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

interface TemporaryWorkLog {
  id: string
  user_id: string
  site_id?: string
  work_date?: string
  department?: string
  location_info?: {
    block?: string
    dong?: string
    unit?: string
  }
  member_types: string[]
  work_contents: string[]
  work_types: string[]
  main_manpower?: { count: number }
  additional_manpower: any[]
  work_sections: any[]
  title: string
  created_at: string
  updated_at: string
  sites?: {
    id: string
    name: string
  }
}

interface UseTemporaryWorkLogsParams {
  limit?: number
  offset?: number
  searchQuery?: string
}

interface UseTemporaryWorkLogsReturn {
  temporaryWorkLogs: TemporaryWorkLog[]
  loading: boolean
  error: string | null
  total: number
  refreshTemporaryWorkLogs: () => Promise<void>
  deleteTemporaryWorkLog: (id: string) => Promise<void>
  loadTemporaryWorkLog: (id: string) => Promise<TemporaryWorkLog | null>
}

export const useTemporaryWorkLogs = (
  params: UseTemporaryWorkLogsParams = {}
): UseTemporaryWorkLogsReturn => {
  const { limit = 20, offset = 0, searchQuery } = params

  const [temporaryWorkLogs, setTemporaryWorkLogs] = useState<TemporaryWorkLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const fetchTemporaryWorkLogs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      })

      const response = await fetch(`/api/mobile/temporary-work-logs?${searchParams}`)

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('인증이 필요합니다.')
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '임시저장 목록을 불러올 수 없습니다.')
      }

      const data = await response.json()
      let workLogs = data.data || []

      // 클라이언트 사이드 검색 필터링
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase()
        workLogs = workLogs.filter(
          (log: TemporaryWorkLog) =>
            log.title?.toLowerCase().includes(query) ||
            log.sites?.name?.toLowerCase().includes(query) ||
            log.department?.toLowerCase().includes(query)
        )
      }

      setTemporaryWorkLogs(workLogs)
      setTotal(data.total || workLogs.length)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(errorMessage)
      console.error('Temporary work logs fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [limit, offset, searchQuery])

  const refreshTemporaryWorkLogs = useCallback(() => {
    return fetchTemporaryWorkLogs()
  }, [fetchTemporaryWorkLogs])

  const deleteTemporaryWorkLog = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/mobile/temporary-work-logs/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('인증이 필요합니다.')
        }
        if (response.status === 404) {
          throw new Error('임시저장을 찾을 수 없습니다.')
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '임시저장 삭제에 실패했습니다.')
      }

      // 성공적으로 삭제된 경우 로컬 상태에서도 제거
      setTemporaryWorkLogs(prev => prev.filter(log => log.id !== id))
      setTotal(prev => Math.max(0, prev - 1))

      toast.success('임시저장이 삭제되었습니다.')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '삭제에 실패했습니다.'
      toast.error(errorMessage)
      throw err
    }
  }, [])

  const loadTemporaryWorkLog = useCallback(async (id: string): Promise<TemporaryWorkLog | null> => {
    try {
      const response = await fetch(`/api/mobile/temporary-work-logs/${id}`)

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('인증이 필요합니다.')
        }
        if (response.status === 404) {
          throw new Error('임시저장을 찾을 수 없습니다.')
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '임시저장을 불러올 수 없습니다.')
      }

      const data = await response.json()
      return data.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '불러오기에 실패했습니다.'
      toast.error(errorMessage)
      return null
    }
  }, [])

  useEffect(() => {
    fetchTemporaryWorkLogs()
  }, [fetchTemporaryWorkLogs])

  return {
    temporaryWorkLogs,
    loading,
    error,
    total,
    refreshTemporaryWorkLogs,
    deleteTemporaryWorkLog,
    loadTemporaryWorkLog,
  }
}
