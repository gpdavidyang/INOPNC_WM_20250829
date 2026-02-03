'use client'

import AdminDrawingManagementContent from '@/components/admin/markup/AdminDrawingManagementContent'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useEffect, useState } from 'react'

interface DrawingsTabProps {
  siteId: string
  siteName?: string
}

interface DailyReportItem {
  id: string
  work_date: string
  site_name: string
  site_id: string
  member_name?: string
  status: string
  author_name?: string
}

interface SiteOption {
  id: string
  name: string
}

export function DrawingsTab({ siteId, siteName }: DrawingsTabProps) {
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<DailyReportItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const siteOptions: SiteOption[] = [
    {
      id: siteId,
      name: siteName || '현장명 미지정',
    },
  ]

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch daily reports for this site
        const params = new URLSearchParams({
          page: '1',
          limit: '20',
        })

        const reportsRes = await fetch(`/api/admin/sites/${siteId}/daily-reports?${params}`)
        const reportsData = await reportsRes.json()

        if (reportsData.success && Array.isArray(reportsData.data)) {
          const formattedReports = reportsData.data.map((r: any) => ({
            id: r.id,
            work_date: r.work_date,
            site_name: r.sites?.name || siteName || '미지정',
            site_id: r.site_id,
            member_name: r.member_name || r.component_name || '작업내역 미기재',
            status: r.status,
            author_name: r.created_by_profile?.full_name || r.profiles?.full_name || '작성자',
          }))

          setReports(formattedReports)
          setTotalCount(reportsData.total || formattedReports.length)
          setTotalPages(Math.ceil((reportsData.total || formattedReports.length) / 20))
        } else {
          setReports([])
          setTotalCount(0)
          setTotalPages(1)
        }
      } catch (err) {
        console.error('Failed to fetch drawing data:', err)
        setError('데이터를 불러오는 중 오류가 발생했습니다.')
        setReports([])
      } finally {
        setLoading(false)
      }
    }

    if (siteId) {
      fetchData()
    }
  }, [siteId, siteName])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <LoadingSpinner />
        <p className="text-xs font-bold text-muted-foreground animate-pulse">
          도면 관리 데이터를 불러오는 중입니다...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-sm font-bold text-rose-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="mt-6">
      <AdminDrawingManagementContent
        initialReports={reports}
        siteOptions={siteOptions}
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        fixedSiteId={siteId}
        navigateOnRowClick={false}
      />
    </div>
  )
}
