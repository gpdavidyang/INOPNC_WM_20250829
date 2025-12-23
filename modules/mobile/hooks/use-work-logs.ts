import { useState, useEffect, useCallback, useMemo } from 'react'
import { WorkLog, WorkLogStatus, WorkLogFilter, WorkLogSort } from '../types/work-log.types'
import { WorkLogService, CreateWorkLogData, UpdateWorkLogData } from '../services/work-log.service'
import { groupWorkLogsByMonth, isAlertDismissed } from '../utils/work-log-utils'

/**
 * 작업일지 데이터 관리 훅
 */
export function useWorkLogs(initialFilter?: WorkLogFilter) {
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<WorkLogFilter>(initialFilter || {})
  const [sort, setSort] = useState<WorkLogSort>({ field: 'date', order: 'desc' })
  const [searchQuery, setSearchQuery] = useState('')

  const fetchWorkLogs = useCallback(
    async (options?: { silent?: boolean; signal?: AbortSignal }) => {
      const { silent = false, signal } = options || {}

      try {
        if (!silent) setLoading(true)
        setError(null)
        const data = await WorkLogService.getWorkLogs(filter, sort, signal)

        if (!signal?.aborted) {
          setWorkLogs(data)
          if (process.env.NODE_ENV !== 'production') {
            console.debug('[useWorkLogs] fetched', data.length, 'items', data.slice(0, 3))
          }
        }
      } catch (err) {
        if (!signal?.aborted) {
          setError(
            err instanceof Error ? err.message : '작업일지를 불러오는 중 오류가 발생했습니다.'
          )
        }
      } finally {
        if (!signal?.aborted && !silent) {
          setLoading(false)
        }
      }
    },
    [filter, sort]
  )

  // 데이터 로드 - AbortController로 메모리 누수 방지
  useEffect(() => {
    const abortController = new AbortController()

    fetchWorkLogs({ signal: abortController.signal })

    return () => {
      abortController.abort()
    }
  }, [fetchWorkLogs])

  // 필터링된 작업일지
  const filteredWorkLogs = useMemo(() => {
    let filtered = [...workLogs]

    // 상태 필터
    if (filter.status) {
      if (filter.status === 'approved') {
        filtered = filtered.filter(log => log.status === 'approved' || log.status === 'submitted')
      } else {
        filtered = filtered.filter(log => log.status === filter.status)
      }
    }

    // 현장 필터
    if (filter.siteId) {
      filtered = filtered.filter(log => log.siteId === filter.siteId)
    }

    // 날짜 필터
    if (filter.dateFrom) {
      filtered = filtered.filter(log => log.date >= filter.dateFrom!)
    }
    if (filter.dateTo) {
      filtered = filtered.filter(log => log.date <= filter.dateTo!)
    }

    // 검색어 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        log =>
          log.siteName.toLowerCase().includes(query) ||
          log.memberTypes.some(type => type.toLowerCase().includes(query)) ||
          log.workProcesses.some(process => process.toLowerCase().includes(query)) ||
          (log.materials || []).some(material =>
            (material.material_name || '').toString().toLowerCase().includes(query)
          ) ||
          log.workers.some(worker => worker.name.toLowerCase().includes(query)) ||
          log.notes?.toLowerCase().includes(query)
      )
    }

    // 정렬
    filtered.sort((a, b) => {
      let aValue: any = a[sort.field]
      let bValue: any = b[sort.field]

      if (sort.field === 'date') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (sort.order === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [workLogs, filter, searchQuery, sort])

  // 상태별 작업일지
  const draftWorkLogs = useMemo(
    () => filteredWorkLogs.filter(log => log.status === 'draft'),
    [filteredWorkLogs]
  )

  const approvedWorkLogs = useMemo(() => {
    return filteredWorkLogs.filter(log => log.status === 'approved' || log.status === 'submitted')
  }, [filteredWorkLogs])

  // 월별 미작성 작업일지
  const uncompletedByMonth = useMemo(() => {
    const drafts = workLogs.filter(log => log.status === 'draft')
    const grouped = groupWorkLogsByMonth(drafts)

    return Object.entries(grouped)
      .map(([month, logs]) => ({
        month,
        count: logs.length,
        workLogs: logs,
        dismissed: isAlertDismissed(month),
      }))
      .filter(group => !group.dismissed)
  }, [workLogs])

  // 작업일지 생성
  const createWorkLog = useCallback(
    async (workLogData: CreateWorkLogData) => {
      try {
        const newWorkLog = await WorkLogService.createWorkLog(workLogData)
        setWorkLogs(prev => [newWorkLog, ...prev])
        await fetchWorkLogs({ silent: true })
        return newWorkLog
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : '작업일지 생성에 실패했습니다.')
      }
    },
    [fetchWorkLogs]
  )

  // 작업일지 수정
  const updateWorkLog = useCallback(
    async (id: string, updates: UpdateWorkLogData) => {
      try {
        await WorkLogService.updateWorkLog(id, updates)
        setWorkLogs(prev =>
          prev.map(log =>
            log.id === id ? { ...log, ...updates, updatedAt: new Date().toISOString() } : log
          )
        )
        await fetchWorkLogs({ silent: true })
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : '작업일지 수정에 실패했습니다.')
      }
    },
    [fetchWorkLogs]
  )

  // 작업일지 삭제
  const deleteWorkLog = useCallback(
    async (id: string) => {
      try {
        await WorkLogService.deleteWorkLog(id)
        setWorkLogs(prev => prev.filter(log => log.id !== id))
        await fetchWorkLogs({ silent: true })
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : '작업일지 삭제에 실패했습니다.')
      }
    },
    [fetchWorkLogs]
  )

  // 작업일지 승인
  const approveWorkLog = useCallback(
    async (id: string) => {
      try {
        await WorkLogService.approveWorkLog(id)
        setWorkLogs(prev =>
          prev.map(log =>
            log.id === id
              ? {
                  ...log,
                  status: 'submitted' as WorkLogStatus,
                  updatedAt: new Date().toISOString(),
                }
              : log
          )
        )
        await fetchWorkLogs({ silent: true })
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : '작업일지 승인에 실패했습니다.')
      }
    },
    [fetchWorkLogs]
  )

  return {
    workLogs: filteredWorkLogs,
    draftWorkLogs,
    approvedWorkLogs,
    uncompletedByMonth,
    loading,
    error,
    filter,
    setFilter,
    sort,
    setSort,
    searchQuery,
    setSearchQuery,
    createWorkLog,
    updateWorkLog,
    deleteWorkLog,
    approveWorkLog,
    refreshWorkLogs: () => fetchWorkLogs({ silent: true }),
  }
}
