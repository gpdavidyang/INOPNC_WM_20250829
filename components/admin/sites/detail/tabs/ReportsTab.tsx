'use client'

import DailyReportsTable from '@/components/admin/DailyReportsTable'
import { Button } from '@/components/ui/button'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { TableSkeleton } from '@/components/ui/loading-skeleton'
import { Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ReportsTabProps {
  siteId: string
}

export function ReportsTab({ siteId }: ReportsTabProps) {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')

  const fetchReports = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('site_id', siteId)
      if (query.trim()) params.set('q', query.trim())
      if (status !== 'all') params.set('status', status)
      params.set('limit', '50')

      const res = await fetch(`/api/admin/sites/${siteId}/daily-reports?${params.toString()}`, {
        cache: 'no-store',
      })
      const json = await res.json()
      if (json?.success) setReports(json.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [siteId, status])

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-black text-foreground">작업일지 목록</h3>
        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-black text-muted-foreground tracking-tight ml-1">
              검색
            </span>
            <div className="relative w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchReports()}
                placeholder="내용 검색..."
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-gray-50 border-none text-xs"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-black text-muted-foreground tracking-tight ml-1">
              상태
            </span>
            <CustomSelect value={status} onValueChange={v => setStatus(v)}>
              <CustomSelectTrigger className="h-9 rounded-lg bg-gray-50 border-none px-3 text-xs w-28">
                <CustomSelectValue placeholder="상태" />
              </CustomSelectTrigger>
              <CustomSelectContent>
                <CustomSelectItem value="all">전체 상태</CustomSelectItem>
                <CustomSelectItem value="draft">임시</CustomSelectItem>
                <CustomSelectItem value="submitted">제출</CustomSelectItem>
                <CustomSelectItem value="approved">승인</CustomSelectItem>
                <CustomSelectItem value="rejected">반려</CustomSelectItem>
              </CustomSelectContent>
            </CustomSelect>
          </div>
          <Button asChild size="sm" className="rounded-lg gap-2 whitespace-nowrap h-9">
            <a
              href={`/dashboard/admin/daily-reports/new?site_id=${siteId}`}
              className="inline-flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              일지 작성
            </a>
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {loading && reports.length === 0 ? (
          <TableSkeleton rows={10} />
        ) : (
          <DailyReportsTable reports={reports} />
        )}
      </div>
    </div>
  )
}
