'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Search,
  X,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

// Sub-components
import { DrawingListTab } from '@/components/admin/markup/parts/DrawingListTab'
import { DrawingMarkupTab } from '@/components/admin/markup/parts/DrawingMarkupTab'
import { DrawingUploadTab } from '@/components/admin/markup/parts/DrawingUploadTab'

interface SiteOption {
  id: string
  name: string
}

interface DailyReportItem {
  id: string
  work_date: string
  site_name: string
  site_id: string
  member_name?: string
  component_name?: string
  work_process?: string
  process_type?: string
  work_section?: string
  work_type?: string
  location_label?: string
  status: string
  author_name?: string
  drawing_count?: number
}

interface AdminDrawingManagementContentProps {
  initialReports: DailyReportItem[]
  siteOptions: SiteOption[]
  totalCount: number
  currentPage: number
  totalPages: number
}

export default function AdminDrawingManagementContent({
  initialReports,
  siteOptions,
  totalCount,
  currentPage,
  totalPages,
}: AdminDrawingManagementContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [reports, setReports] = useState<DailyReportItem[]>(initialReports)
  const [drawingCounts, setDrawingCounts] = useState<Record<string, number>>({})
  const [refreshKey, setRefreshKey] = useState(0)

  // Filter states
  const [siteId, setSiteId] = useState<string>(searchParams.get('site_id') || 'all')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState<string>(searchParams.get('status') || 'all')
  const [dateFrom, setDateFrom] = useState<string>(searchParams.get('date_from') || '')
  const [dateTo, setDateTo] = useState<string>(searchParams.get('date_to') || '')

  const [activeTab, setActiveTab] = useState('list')
  const [editingDocument, setEditingDocument] = useState<any | null>(null)

  const [worklogViewMode, setWorklogViewMode] = useState<'grid' | 'list'>('grid')

  const selectedReport = useMemo(() => {
    if (!selectedReportId) return null
    return reports.find(r => String(r.id) === String(selectedReportId))
  }, [reports, selectedReportId])

  // ... (useEffect lines 93-95 is fine)

  // Reset tab when report changes
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['list', 'upload', 'markup'].includes(tabParam)) {
      setActiveTab(tabParam)
    } else {
      setActiveTab('list')
    }
    setEditingDocument(null)
  }, [selectedReportId, searchParams])

  // Initialize selected report from URL
  useEffect(() => {
    const reportIdParam = searchParams.get('report_id')
    if (reportIdParam && !selectedReportId) {
      setSelectedReportId(reportIdParam)
    }
  }, [searchParams, selectedReportId])

  useEffect(() => {
    setReports(initialReports)
  }, [initialReports])

  // ... (fetchDrawingCounts logic)

  // ... (render) ...

  const fetchDrawingCounts = useCallback(async () => {
    const reportIds = reports.map(r => r.id).filter(Boolean)
    if (reportIds.length === 0) return

    try {
      const params = new URLSearchParams()
      reportIds.forEach(id => params.append('worklog_id', id))
      const res = await fetch(`/api/mobile/media/drawings/all-counts?${params.toString()}`)
      const json = await res.json()
      if (json.success) {
        setDrawingCounts(json.data)
      }
    } catch (err) {
      console.error('Failed to fetch drawing counts:', err)
    }
  }, [reports])

  useEffect(() => {
    fetchDrawingCounts()
  }, [fetchDrawingCounts, refreshKey, initialReports])

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (siteId && siteId !== 'all') params.set('site_id', siteId)
    else params.delete('site_id')
    if (search) params.set('search', search)
    else params.delete('search')
    if (status && status !== 'all') params.set('status', status)
    else params.delete('status')
    if (dateFrom) params.set('date_from', dateFrom)
    else params.delete('date_from')
    if (dateTo) params.set('date_to', dateTo)
    else params.delete('date_to')
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(newPage))
    router.push(`?${params.toString()}`)
  }

  const handleRowClick = (reportId: string) => {
    setSelectedReportId(reportId)
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      draft: { label: '임시', className: 'bg-gray-100 text-gray-700' },
      submitted: { label: '제출', className: 'bg-sky-100 text-sky-700' },
      approved: { label: '승인', className: 'bg-emerald-100 text-emerald-700' },
      rejected: { label: '반려', className: 'bg-rose-100 text-rose-700' },
    }
    const { label, className } = config[status] || {
      label: status,
      className: 'bg-gray-100 text-gray-700',
    }
    return (
      <Badge
        variant="outline"
        className={`text-[10px] font-bold h-5 px-2 rounded-full border-none ${className}`}
      >
        {label}
      </Badge>
    )
  }

  return (
    <div className="admin-markup-surface flex flex-col gap-6">
      <Card className="rounded-lg border bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5 min-w-[200px]">
              <span className="text-xs font-semibold text-muted-foreground">현장 필터</span>
              <Select value={siteId} onValueChange={setSiteId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="전체 현장" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 현장</SelectItem>
                  {siteOptions.map(site => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 min-w-[140px]">
              <span className="text-xs font-semibold text-muted-foreground">문서 상태</span>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="전체 상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  <SelectItem value="draft">임시</SelectItem>
                  <SelectItem value="submitted">제출</SelectItem>
                  <SelectItem value="approved">승인</SelectItem>
                  <SelectItem value="rejected">반려</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 flex-1 min-w-[240px]">
              <span className="text-xs font-semibold text-muted-foreground">키워드 검색</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  placeholder="부재명, 작성자, 내용 검색..."
                  className="pl-9 h-10"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleApplyFilters()}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">시작일</span>
              <Input
                type="date"
                className="h-10 w-[170px] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 transition-opacity"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">종료일</span>
              <Input
                type="date"
                className="h-10 w-[170px] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 transition-opacity"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
              />
            </div>
            <Button onClick={handleApplyFilters} className="h-10 px-8 rounded-[8px] ml-auto">
              조회하기
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-8">
        {/* Row 2: Worklog List - Full Width Row */}
        <Card
          className={`w-full flex flex-col rounded-2xl border bg-card shadow-sm overflow-hidden transition-all duration-500 ${selectedReportId ? 'h-[320px]' : 'h-[500px]'}`}
        >
          <div className="px-6 py-4 border-b bg-muted/20 flex items-center justify-between shrink-0">
            <h3 className="text-[15px] font-black flex items-center gap-2 text-[#1f2942]">
              <FileText className="h-4 w-4 text-primary" />
              작업일지 목록
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-white p-1 rounded-xl border shadow-sm">
                <button
                  onClick={() => setWorklogViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${
                    worklogViewMode === 'grid'
                      ? 'bg-primary/10 text-primary shadow-inner'
                      : 'text-[#9aa4c5] hover:text-primary/60'
                  }`}
                  title="카드 보기"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setWorklogViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all ${
                    worklogViewMode === 'list'
                      ? 'bg-primary/10 text-primary shadow-inner'
                      : 'text-[#9aa4c5] hover:text-primary/60'
                  }`}
                  title="리스트 보기"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              <span className="text-[12px] font-black text-primary bg-white px-3 py-1 rounded-full border shadow-sm">
                총 {totalCount}건
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-2 ml-2 border-l pl-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="h-8 w-8 p-0 rounded-lg hover:bg-primary/5"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-[12px] font-black text-[#9aa4c5]">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={currentPage >= totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="h-8 w-8 p-0 rounded-lg hover:bg-primary/5"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#fcfdff]">
            {reports.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground/40 text-[15px] font-bold italic">
                조회 결과가 없거나 필터를 조정해 보세요.
              </div>
            ) : worklogViewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 p-4 gap-4">
                {reports.map(report => (
                  <div
                    key={report.id}
                    onClick={() => handleRowClick(report.id)}
                    className={`relative p-5 cursor-pointer rounded-2xl border-2 transition-all duration-300 flex flex-col gap-3 group shadow-sm ${
                      selectedReportId === report.id
                        ? 'bg-white border-[#31a3fa] ring-4 ring-[#31a3fa]/5'
                        : 'bg-white border-[#e0e6f3] hover:border-[#31a3fa]/40 hover:translate-y-[-2px]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[13px] font-black text-[#31a3fa]">
                        {report.work_date}
                      </span>
                      {getStatusBadge(report.status)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-black text-[#1f2942] truncate group-hover:text-[#31a3fa] transition-colors mb-1">
                        {report.site_name}
                      </div>
                      <div className="text-[12px] font-bold text-[#9aa4c5] line-clamp-2 leading-relaxed">
                        {[
                          report.member_name,
                          report.component_name,
                          report.work_process || report.process_type,
                          report.work_type,
                        ]
                          .filter(Boolean)
                          .join(' / ') || '상세 내역 없음'}
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-3 border-t border-[#f0f4ff] mt-auto">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-black border ${
                          (drawingCounts[report.id] || 0) > 0
                            ? 'bg-[#f0f4ff] text-[#31a3fa] border-[#31a3fa]/20 shadow-sm'
                            : 'bg-[#f1f5f9] text-[#6b7280] border-[#e2e8f0]'
                        }`}
                      >
                        도면 {drawingCounts[report.id] || 0}건
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col p-4 gap-2">
                {reports.map(report => (
                  <div
                    key={report.id}
                    onClick={() => handleRowClick(report.id)}
                    className={`flex items-center justify-between p-4 cursor-pointer rounded-xl border transition-all duration-200 group ${
                      selectedReportId === report.id
                        ? 'bg-[#f0f4ff]/50 border-[#31a3fa] shadow-sm'
                        : 'bg-white border-[#e0e6f3] hover:border-[#31a3fa]/30 hover:bg-[#fcfdff]'
                    }`}
                  >
                    <div className="flex items-center gap-6 flex-1 min-w-0">
                      <div className="w-24 shrink-0 text-[13px] font-black text-[#31a3fa]">
                        {report.work_date}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-0.5">
                          <span className="text-[15px] font-black text-[#1f2942] truncate">
                            {report.site_name}
                          </span>
                          {getStatusBadge(report.status)}
                        </div>
                        <div className="text-[12px] font-bold text-[#9aa4c5] truncate">
                          {[
                            report.member_name,
                            report.component_name,
                            report.work_process || report.process_type,
                            report.work_type,
                            report.location_label ? `(${report.location_label})` : null,
                          ]
                            .filter(Boolean)
                            .join(' / ') || '상세 내역 없음'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0 pl-6 border-l border-[#f0f4ff] ml-6">
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[12px] font-black border transition-colors ${
                          (drawingCounts[report.id] || 0) > 0
                            ? 'bg-[#f0f4ff] text-[#31a3fa] border-[#31a3fa]/20 group-hover:bg-[#31a3fa] group-hover:text-white'
                            : 'bg-[#f1f5f9] text-[#6b7280] border-[#e2e8f0]'
                        }`}
                      >
                        도면 {drawingCounts[report.id] || 0}건
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Row 3: Tabs Content - Full Width Row */}
        <div className="w-full min-h-[900px] flex flex-col">
          {selectedReportId ? (
            <Card className="flex-1 flex flex-col rounded-[32px] border-none bg-white overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="px-10 py-8 bg-white shrink-0">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-[20px] bg-[#f0f4ff] flex items-center justify-center text-[#31a3fa] shadow-inner">
                      <ImageIcon className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-[22px] font-black text-[#1f2942] tracking-tight flex items-center gap-3">
                        <span className="text-[#31a3fa]">{selectedReport?.work_date}</span>
                        <span>{selectedReport?.site_name}</span>
                      </h2>
                      <p className="text-[14px] font-bold text-[#9aa4c5]">
                        선택된 일지의 도면 관리 및 마킹 작업을 수행합니다
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedReportId(null)}
                    className="h-11 px-5 rounded-xl border-[#e0e6f3] text-[13px] font-black hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    닫기
                  </Button>
                </div>
              </div>

              <Tabs
                value={activeTab}
                onValueChange={v => {
                  setActiveTab(v)
                  if (v !== 'markup') setEditingDocument(null)
                  setRefreshKey(k => k + 1)
                }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="px-10 pb-6">
                  <div className="bg-[#f0f4ff] p-1.5 rounded-[22px]">
                    <TabsList className="bg-transparent border-0 shadow-none h-12 w-full grid grid-cols-3 gap-1">
                      {[
                        { value: 'list', label: '업로드 된 도면' },
                        { value: 'upload', label: '파일 업로드' },
                        { value: 'markup', label: '도면 마킹 도구' },
                      ].map(tab => (
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          className="rounded-[18px] font-black text-[14px] transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-[#31a3fa] data-[state=active]:shadow-lg data-[state=active]:after:hidden"
                        >
                          {tab.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                </div>

                <div className="relative flex flex-1 w-full flex-col overflow-hidden bg-[#f8f9fc]">
                  <TabsContent
                    value="list"
                    className="h-full m-0 p-10 overflow-y-auto custom-scrollbar data-[state=active]:animate-in data-[state=active]:fade-in duration-500"
                  >
                    <DrawingListTab
                      worklogId={selectedReportId}
                      siteId={selectedReport?.site_id}
                      refreshKey={refreshKey}
                      onRefresh={() => setRefreshKey(k => k + 1)}
                      onEditMarkup={doc => {
                        setEditingDocument(doc)
                        setActiveTab('markup')
                      }}
                    />
                  </TabsContent>
                  <TabsContent
                    value="upload"
                    className="h-full m-0 p-10 overflow-y-auto custom-scrollbar data-[state=active]:animate-in data-[state=active]:fade-in duration-500"
                  >
                    <DrawingUploadTab
                      worklogId={selectedReportId}
                      siteId={selectedReport?.site_id}
                      onSuccess={() => {
                        setRefreshKey(k => k + 1)
                        setActiveTab('list')
                      }}
                    />
                  </TabsContent>
                  <TabsContent
                    value="markup"
                    className="flex-1 flex flex-col min-h-[900px] m-0 data-[state=active]:animate-in data-[state=active]:fade-in duration-500"
                  >
                    <DrawingMarkupTab
                      worklogId={selectedReportId}
                      siteId={selectedReport?.site_id}
                      editingDocument={editingDocument}
                      onClearEdit={() => setEditingDocument(null)}
                      onSuccess={() => {
                        setRefreshKey(k => k + 1)
                        setActiveTab('list')
                      }}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </Card>
          ) : (
            <div className="flex-1 py-16 flex flex-col items-center justify-center text-center bg-white rounded-[40px] border-2 border-dashed border-[#e0e6f3] animate-in fade-in duration-700">
              <div className="h-24 w-24 mb-6 flex items-center justify-center rounded-[32px] bg-[#f8faff] text-[#e0e6f3]">
                <ImageIcon className="h-12 w-12" />
              </div>
              <h3 className="text-[20px] font-black text-[#1f2942] mb-3">관리 대상을 선택하세요</h3>
              <p className="text-[15px] font-bold text-[#9aa4c5] max-w-[340px] leading-relaxed">
                작업일지 목록에서 일지를 클릭하면 도면 관리 및 마킹 작업 탭이 여기에 활성화됩니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
