'use client'

import { useUnifiedAuth } from '@/hooks/use-unified-auth'
import { useEffect, useMemo, useState } from 'react'

export type Period = 'daily' | 'weekly' | 'monthly'

export interface LaborSummary {
  totalSites: number
  activeSites: number
  totalLaborHours: number
  averageDailyHours: number
  overtimeHours: number
  workingDays: number
  period?: string
  dateRange?: { startDate: string; endDate: string }
}

export function usePartnerHome() {
  const { profile } = useUnifiedAuth()
  const [period, setPeriod] = useState<Period>('monthly')
  const [summary, setSummary] = useState<LaborSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [todaySubmitted, setTodaySubmitted] = useState(0)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showMonth, setShowMonth] = useState(false)
  const [monthDate, setMonthDate] = useState(new Date())
  const [daily, setDaily] = useState<Record<string, { manDays: number; hours: number }>>({})
  const [topSiteByDate, setTopSiteByDate] = useState<
    Record<string, { site_id: string; site_name?: string | null }>
  >({})
  const [loadingDaily, setLoadingDaily] = useState(false)

  const y = monthDate.getFullYear()
  const m = monthDate.getMonth() + 1
  const startDate = new Date(y, m - 1, 1).toISOString().split('T')[0]
  const endDate = new Date(y, m, 0).toISOString().split('T')[0]

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/partner/labor/summary?period=${period}`)
        const data = await res.json()
        setSummary(data)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [period])

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        const base = '/api/partner/daily-reports'

        // Simplified pending/today fetches (mocking multi-status aggregation logic from component)
        const pendRes = await fetch(`${base}?status=submitted&start_date=${startDate}`)
        const pendData = await pendRes.json()
        setPendingCount(pendData?.data?.totalCount || 0)

        const todayRes = await fetch(`${base}?start_date=${today}&end_date=${today}`)
        const todayData = await todayRes.json()
        setTodaySubmitted(todayData?.data?.totalCount || 0)
      } catch (e) {
        console.error('[usePartnerHome] fetchKPIs failed:', e)
      }
    }
    fetchKPIs()
  }, [period, startDate])

  useEffect(() => {
    const fetchDaily = async () => {
      setLoadingDaily(true)
      try {
        const res = await fetch(
          `/api/partner/labor/daily?start_date=${startDate}&end_date=${endDate}`
        )
        const j = await res.json()
        setDaily(j?.data?.daily || {})
        setTopSiteByDate(j?.data?.topSites || {})
      } finally {
        setLoadingDaily(false)
      }
    }
    fetchDaily()
  }, [startDate, endDate])

  const calendarDays = useMemo(() => {
    const first = new Date(y, m - 1, 1)
    const start = new Date(first)
    start.setDate(first.getDate() - first.getDay())
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [y, m])

  return {
    state: {
      period,
      summary,
      loading,
      error,
      pendingCount,
      todaySubmitted,
      selectedDate,
      showMonth,
      monthDate,
      daily,
      topSiteByDate,
      loadingDaily,
      calendarDays,
      y,
      m,
    },
    actions: { setPeriod, setSelectedDate, setShowMonth, setMonthDate },
  }
}
