'use client'

import { sitesApi, SiteSearchParams } from '@/lib/api/sites'
import type { Site, SiteStatus } from '@/types'
import { useCallback, useEffect, useState } from 'react'

export type StatusFilterOption = 'all' | SiteStatus

interface SiteStats {
  daily_reports_count: number
  total_labor_hours: number
}

export const useSiteSearch = (initialData: {
  sites: Site[]
  total: number
  pages: number
  pageSize: number
}) => {
  const [sites, setSites] = useState<Site[]>(initialData.sites)
  const [total, setTotal] = useState(initialData.total)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(Math.max(initialData.pages, 1))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all')
  const [sortKey, setSortKey] = useState<string>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const [statsMap, setStatsMap] = useState<Record<string, SiteStats>>({})
  const [managersMap, setManagersMap] = useState<
    Record<string, { user_id: string; full_name: string }>
  >({})
  const [statsLoading, setStatsLoading] = useState(false)
  const [managersLoading, setManagersLoading] = useState(false)

  const fetchExtraData = useCallback(async (siteList: Site[]) => {
    const ids = siteList.map(s => s.id).filter(Boolean) as string[]
    if (ids.length === 0) return

    setManagersLoading(true)
    setStatsLoading(true)

    try {
      const [managers, stats] = await Promise.all([
        sitesApi.getSiteManagers(ids),
        sitesApi.getSiteStats(ids),
      ])
      setManagersMap(managers)
      setStatsMap(stats)
    } catch (err) {
      console.error('Failed to fetch extra site data', err)
    } finally {
      setManagersLoading(false)
      setStatsLoading(false)
    }
  }, [])

  const loadSites = useCallback(
    async (params: Partial<SiteSearchParams> = {}) => {
      setLoading(true)
      setError(null)

      try {
        const currentPage = params.page ?? page
        const currentParams: SiteSearchParams = {
          page: currentPage,
          limit: initialData.pageSize,
          search: params.search ?? searchTerm,
          status: params.status ?? statusFilter,
          sort: params.sort ?? sortKey,
          direction: params.direction ?? sortDir,
        }

        const data = await sitesApi.getSites(currentParams)

        setSites(data.sites || [])
        setTotal(data.total || 0)
        setPages(Math.max(data.pages || 1, 1))
        setPage(currentPage)

        if (params.search !== undefined) setSearchTerm(params.search)
        if (params.status !== undefined) setStatusFilter(params.status as StatusFilterOption)
        if (params.sort !== undefined) setSortKey(params.sort)
        if (params.direction !== undefined) setSortDir(params.direction)

        await fetchExtraData(data.sites || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    },
    [page, searchTerm, statusFilter, sortKey, sortDir, initialData.pageSize, fetchExtraData]
  )

  // Initial extra data load
  useEffect(() => {
    if (initialData.sites.length > 0) {
      fetchExtraData(initialData.sites)
    }
  }, [fetchExtraData, initialData.sites])

  const deleteSite = async (id: string) => {
    try {
      await sitesApi.deleteSite(id)
      await loadSites({ page })
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  return {
    sites,
    total,
    page,
    pages,
    loading,
    error,
    searchTerm,
    statusFilter,
    sortKey,
    sortDir,
    statsMap,
    managersMap,
    statsLoading,
    managersLoading,
    setSearchTerm,
    setStatusFilter,
    setSortKey,
    setSortDir,
    loadSites,
    deleteSite,
  }
}
