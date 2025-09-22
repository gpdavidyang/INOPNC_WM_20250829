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

  // 데이터 로드 - AbortController로 메모리 누수 방지
  useEffect(() => {
    const abortController = new AbortController()

    const loadWorkLogs = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await WorkLogService.getWorkLogs(filter, sort)

        // 컴포넌트가 언마운트되었는지 확인
        if (!abortController.signal.aborted) {
          setWorkLogs(data)
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError(
            err instanceof Error ? err.message : '작업일지를 불러오는 중 오류가 발생했습니다.'
          )
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadWorkLogs()

    // 클린업 함수로 요청 취소
    return () => {
      abortController.abort()
    }
  }, [filter, sort])

  // 필터링된 작업일지
  const filteredWorkLogs = useMemo(() => {
    let filtered = [...workLogs]

    // 상태 필터
    if (filter.status) {
      filtered = filtered.filter(log => log.status === filter.status)
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

  const approvedWorkLogs = useMemo(
    () => filteredWorkLogs.filter(log => log.status === 'approved'),
    [filteredWorkLogs]
  )

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
  const createWorkLog = useCallback(async (workLogData: CreateWorkLogData) => {
    try {
      const newWorkLog = await WorkLogService.createWorkLog(workLogData)
      setWorkLogs(prev => [newWorkLog, ...prev])
      return newWorkLog
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : '작업일지 생성에 실패했습니다.')
    }
  }, [])

  // 작업일지 수정
  const updateWorkLog = useCallback(async (id: string, updates: UpdateWorkLogData) => {
    try {
      await WorkLogService.updateWorkLog(id, updates)
      setWorkLogs(prev =>
        prev.map(log =>
          log.id === id ? { ...log, ...updates, updatedAt: new Date().toISOString() } : log
        )
      )
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : '작업일지 수정에 실패했습니다.')
    }
  }, [])

  // 작업일지 삭제
  const deleteWorkLog = useCallback(async (id: string) => {
    try {
      await WorkLogService.deleteWorkLog(id)
      setWorkLogs(prev => prev.filter(log => log.id !== id))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : '작업일지 삭제에 실패했습니다.')
    }
  }, [])

  // 작업일지 승인
  const approveWorkLog = useCallback(async (id: string) => {
    try {
      await WorkLogService.approveWorkLog(id)
      setWorkLogs(prev =>
        prev.map(log =>
          log.id === id
            ? { ...log, status: 'approved' as const, updatedAt: new Date().toISOString() }
            : log
        )
      )
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : '작업일지 승인에 실패했습니다.')
    }
  }, [])

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
  }
}
