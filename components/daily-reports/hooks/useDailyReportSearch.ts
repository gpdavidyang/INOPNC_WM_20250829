'use client'

import {
  getDailyReports,
  getQuickFilterResults,
  searchDailyReports,
} from '@/app/actions/daily-reports'
import { showErrorNotification } from '@/lib/notifications'
import type { DailyReport, SearchOptions, SearchResult } from '@/lib/search/types'
import { useCallback, useState } from 'react'

interface Stats {
  totalReports: number
  draftReports: number
  submittedReports: number
  approvedReports: number
  rejectedReports: number
  totalWorkers: number
  totalNPC1000Used: number
  averageWorkersPerDay: number
}

const initialStats: Stats = {
  totalReports: 0,
  draftReports: 0,
  submittedReports: 0,
  approvedReports: 0,
  rejectedReports: 0,
  totalWorkers: 0,
  totalNPC1000Used: 0,
  averageWorkersPerDay: 0,
}

export const useDailyReportSearch = () => {
  const [reports, setReports] = useState<DailyReport[]>([])
  const [loading, setLoading] = useState(false)
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResult<DailyReport> | undefined>()
  const [stats, setStats] = useState<Stats>(initialStats)

  const calculateStats = (data: DailyReport[]) => {
    const s = data.reduce(
      (acc, report) => {
        acc.totalReports++
        const statusKey = `${report.status}Reports` as keyof Stats
        if (typeof acc[statusKey] === 'number') {
          ;(acc[statusKey] as number)++
        }
        acc.totalWorkers += report.total_workers || 0
        acc.totalNPC1000Used += report.npc1000_used || 0
        return acc
      },
      { ...initialStats }
    )
    s.averageWorkersPerDay = data.length > 0 ? Math.round(s.totalWorkers / data.length) : 0
    return s
  }

  const loadReports = useCallback(async (filters: any = {}) => {
    setLoading(true)
    setIsSearchMode(false)
    try {
      const result = await getDailyReports(filters)
      if (result.success && result.data) {
        setReports(result.data)
        setStats(calculateStats(result.data))
      } else {
        showErrorNotification(result.error || '일일보고서를 불러오는데 실패했습니다.')
        setReports([])
        setStats(initialStats)
      }
    } catch (error) {
      showErrorNotification(error)
      setReports([])
      setStats(initialStats)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearch = async (options: SearchOptions) => {
    setLoading(true)
    setIsSearchMode(true)
    try {
      const result = await searchDailyReports(options)
      if (result.success && result.data) {
        setSearchResult(result.data)
        setReports(result.data.items)
        setStats(calculateStats(result.data.items))
      } else {
        showErrorNotification(result.error || '검색 중 오류가 발생했습니다.')
        setSearchResult(undefined)
        setReports([])
      }
    } catch (error) {
      showErrorNotification(error)
      setSearchResult(undefined)
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  const handleQuickFilter = async (filterId: string, quickFilters: any) => {
    setLoading(true)
    setIsSearchMode(true)
    try {
      const result = await getQuickFilterResults(filterId, quickFilters)
      if (result.success && result.data) {
        setSearchResult(result.data)
        setReports(result.data.items)
        setStats(calculateStats(result.data.items))
      } else {
        showErrorNotification(result.error || '빠른 필터 적용 중 오류가 발생했습니다.')
      }
    } catch (error) {
      showErrorNotification(error)
    } finally {
      setLoading(false)
    }
  }

  return {
    reports,
    loading,
    isSearchMode,
    searchResult,
    stats,
    setIsSearchMode,
    setSearchResult,
    loadReports,
    handleSearch,
    handleQuickFilter,
  }
}
