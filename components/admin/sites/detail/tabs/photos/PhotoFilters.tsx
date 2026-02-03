'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import { UploadCloud } from 'lucide-react'

interface PhotoFiltersProps {
  filters: any
  setFilters: (f: any) => void
  onSearch: () => void
  onReset: () => void
  onOpenUploader: () => void
  loading: boolean
  reports: any[]
  uploaderOptions: any[]
}

export function PhotoFilters({
  filters,
  setFilters,
  onSearch,
  onReset,
  onOpenUploader,
  loading,
  reports,
  uploaderOptions,
}: PhotoFiltersProps) {
  return (
    <section className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 items-end">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-50">
            검색어
          </label>
          <Input
            placeholder="파일명/메모..."
            value={filters.query || ''}
            onChange={e => setFilters({ ...filters, query: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && onSearch()}
            className="h-10 rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-50">
            사진 구분
          </label>
          <Select value={filters.type} onValueChange={v => setFilters({ ...filters, type: v })}>
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="before">보수 전</SelectItem>
              <SelectItem value="after">보수 후</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-50">
            시작일
          </label>
          <Input
            type="date"
            value={filters.startDate || ''}
            onChange={e => setFilters({ ...filters, startDate: e.target.value || undefined })}
            className="h-10 rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-50">
            종료일
          </label>
          <Input
            type="date"
            value={filters.endDate || ''}
            onChange={e => setFilters({ ...filters, endDate: e.target.value || undefined })}
            className="h-10 rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-50">
            작업일지
          </label>
          <Select
            value={filters.reportId || 'all'}
            onValueChange={v => setFilters({ ...filters, reportId: v === 'all' ? undefined : v })}
          >
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {reports.map(r => (
                <SelectItem key={r.id} value={r.id}>
                  {r.work_date ? format(new Date(r.work_date), 'MM-dd') : '-'}{' '}
                  {r.process_type || r.member_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-50">
            업로더
          </label>
          <Select
            value={filters.uploaderId || 'all'}
            onValueChange={v => setFilters({ ...filters, uploaderId: v === 'all' ? undefined : v })}
          >
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {uploaderOptions.map(o => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            onClick={onSearch}
            disabled={loading}
            className="rounded-xl px-6"
          >
            검색
          </Button>
          <Button
            variant="outline"
            onClick={onReset}
            disabled={loading}
            className="rounded-xl px-6"
          >
            초기화
          </Button>
        </div>
        <Button
          onClick={onOpenUploader}
          variant="secondary"
          className="rounded-xl gap-2 font-bold px-6 border-2 border-blue-100"
        >
          <UploadCloud className="w-4 h-4" />새 사진 추가
        </Button>
      </div>
    </section>
  )
}
