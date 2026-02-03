'use client'

import { useEffect, useRef, useState } from 'react'

interface UseSiteDetailProps {
  siteId: string
  site: any
  initialReports: any[]
  initialAssignments: any[]
  initialRequests: any[]
  initialStats?: { reports: number; labor: number } | null
}

export function useSiteDetail({
  siteId,
  site,
  initialReports,
  initialAssignments,
  initialRequests,
  initialStats,
}: UseSiteDetailProps) {
  // Stats
  const [stats, setStats] = useState<{ reports: number; labor: number } | null>(
    initialStats || null
  )
  const [statsLoading, setStatsLoading] = useState(!initialStats)

  // Reports
  const [recentReports, setRecentReports] = useState(initialReports)
  const [reportsLoading, setReportsLoading] = useState(false)

  // Assignments
  const [recentAssignments, setRecentAssignments] = useState(initialAssignments)
  const [assignmentsLoading, setAssignmentsLoading] = useState(false)
  const [laborByUser, setLaborByUser] = useState<Record<string, number>>({})
  const [globalLaborByUser, setGlobalLaborByUser] = useState<Record<string, number>>({})
  const [availableCount, setAvailableCount] = useState<number | null>(null)
  const [assignTotal, setAssignTotal] = useState<number | null>(null)
  const [assignPage, setAssignPage] = useState(0)
  const [assignPageSize, setAssignPageSize] = useState(20)
  const [assignHasNext, setAssignHasNext] = useState(false)

  // Assignment search/sort/filter
  const [assignmentQuery, setAssignmentQuery] = useState('')
  const [assignmentSort, setAssignmentSort] = useState<string>('date_desc')
  const [assignmentRole, setAssignmentRole] = useState<
    'all' | 'worker' | 'site_manager' | 'supervisor'
  >('all')

  // Requests
  const [recentRequests, setRecentRequests] = useState(initialRequests)
  const [requestsLoading, setRequestsLoading] = useState(false)

  // Invoices
  const [invoiceProgress, setInvoiceProgress] = useState<any>(null)

  // Fetch stats only if not provided
  useEffect(() => {
    if (initialStats) return
    let active = true
    setStatsLoading(true)
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/sites/${siteId}/stats`, { cache: 'no-store' })
        const json = await res.json()
        if (active && json?.success) {
          setStats({
            reports: json.data?.daily_reports_count || 0,
            labor: json.data?.total_labor_hours || 0,
          })
        }
      } catch (e) {
        if (active) setStats({ reports: 0, labor: 0 })
      } finally {
        if (active) setStatsLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [siteId, initialStats])

  // Fetch recent reports/requests only if not provided or when strictly needed
  useEffect(() => {
    if (initialReports?.length > 0 && initialRequests?.length > 0) return
    let active = true
    ;(async () => {
      try {
        setReportsLoading(true)
        const res = await fetch(`/api/admin/sites/${siteId}/daily-reports?status=all&limit=10`, {
          cache: 'no-store',
        })
        const json = await res.json()
        if (active && json?.success && Array.isArray(json.data)) setRecentReports(json.data)
      } finally {
        if (active) setReportsLoading(false)
      }
    })()
    ;(async () => {
      try {
        setRequestsLoading(true)
        const res = await fetch(
          `/api/admin/sites/${siteId}/materials/requests?limit=10&order=desc&sort=date`,
          { cache: 'no-store' }
        )
        const json = await res.json()
        if (active && json?.success && Array.isArray(json.data)) setRecentRequests(json.data)
      } finally {
        if (active) setRequestsLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [siteId, initialReports, initialRequests])

  // Fetch assignments with filter/sort (Always needed if filter changes)
  const isFirstMount = useRef(true)

  // Helper to fetch labor for a list of assignments
  const fetchLaborForAssignments = async (assignments: any[]) => {
    const ids = assignments.map((a: any) => a.user_id).filter(Boolean)
    if (ids.length === 0) return

    try {
      const laborRes = await fetch(
        `/api/admin/sites/${siteId}/labor-summary?users=${encodeURIComponent(ids.join(','))}`
      )
      const laborJson = await laborRes.json()
      if (laborJson?.success) setLaborByUser(prev => ({ ...prev, ...laborJson.data }))

      const globalRes = await fetch(
        `/api/admin/users/labor-summary?users=${encodeURIComponent(ids.join(','))}`
      )
      const globalJson = await globalRes.json()
      if (globalJson?.success) setGlobalLaborByUser(prev => ({ ...prev, ...globalJson.data }))
    } catch (e) {
      console.error('Failed to fetch labor summaries', e)
    }
  }

  useEffect(() => {
    if (isFirstMount.current && initialAssignments?.length > 0) {
      isFirstMount.current = false
      // Even if we have initial assignments, we MUST fetch labor summary
      if (!assignmentQuery && assignmentSort === 'date_desc' && assignmentRole === 'all') {
        fetchLaborForAssignments(initialAssignments)
        return
      }
    }
    let active = true
    ;(async () => {
      try {
        setAssignmentsLoading(true)
        const params = new URLSearchParams()
        if (assignmentQuery.trim()) params.set('q', assignmentQuery.trim())
        if (assignmentRole !== 'all') params.set('role', assignmentRole)

        let sort = 'date'
        let order = 'desc'
        if (assignmentSort === 'name_asc') {
          sort = 'name'
          order = 'asc'
        } else if (assignmentSort === 'name_desc') {
          sort = 'name'
          order = 'desc'
        } else if (assignmentSort === 'role') {
          sort = 'role'
          order = 'asc'
        } else if (assignmentSort === 'company') {
          sort = 'company'
          order = 'asc'
        } else if (assignmentSort === 'date_asc') {
          sort = 'date'
          order = 'asc'
        }

        params.set('sort', sort)
        params.set('order', order)
        params.set('limit', String(assignPageSize + 1))
        params.set('offset', String(assignPage * assignPageSize))

        const res = await fetch(`/api/admin/sites/${siteId}/assignments?${params.toString()}`, {
          cache: 'no-store',
        })
        const json = await res.json()
        if (active && json?.success && Array.isArray(json.data)) {
          const arr = json.data
          setAssignHasNext(arr.length > assignPageSize)
          setRecentAssignments(arr.slice(0, assignPageSize))
          if (typeof json.total === 'number') setAssignTotal(json.total)

          // Fetch labor summary for these users
          if (active) {
            await fetchLaborForAssignments(arr)
          }
        }
      } finally {
        if (active) setAssignmentsLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [siteId, assignmentQuery, assignmentSort, assignmentRole, assignPage, assignPageSize])

  return {
    stats,
    statsLoading,
    recentReports,
    reportsLoading,
    recentAssignments,
    assignmentsLoading,
    laborByUser,
    globalLaborByUser,
    availableCount,
    assignTotal,
    assignPage,
    assignPageSize,
    assignHasNext,
    setAssignPage,
    setAssignPageSize,
    assignmentQuery,
    setAssignmentQuery,
    assignmentSort,
    setAssignmentSort,
    assignmentRole,
    setAssignmentRole,
    recentRequests,
    requestsLoading,
    invoiceProgress,
    setInvoiceProgress,
  }
}
