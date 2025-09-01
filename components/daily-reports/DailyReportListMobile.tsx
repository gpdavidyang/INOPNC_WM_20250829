'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import {
  Calendar,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  MapPin,
  Clock,
  AlertCircle,
  X,
  Building2,
  FileText,
  Eye,
  Edit,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useTouchMode } from '@/contexts/TouchModeContext'
import type { DailyReport, Site, Profile } from '@/types'
import Link from 'next/link'
import { showErrorNotification } from '@/lib/error-handling'
import { getDailyReports } from '@/app/actions/daily-reports'

interface DailyReportListMobileProps {
  currentUser: Profile
  sites: Site[]
}


export function DailyReportListMobile({ currentUser, sites = [] }: DailyReportListMobileProps) {
  const { touchMode } = useTouchMode()
  
  const [reports, setReports] = useState<DailyReport[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date()
    const oneMonthAgo = new Date(today)
    oneMonthAgo.setMonth(today.getMonth() - 1)
    
    return {
      from: oneMonthAgo.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0]
    }
  })

  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const filters: any = {}
      
      if (selectedSite !== 'all') {
        filters.site_id = selectedSite
      }
      
      if (selectedStatus !== 'all') {
        filters.status = selectedStatus
      }
      
      if (dateRange.from) {
        filters.start_date = dateRange.from
      }
      
      if (dateRange.to) {
        filters.end_date = dateRange.to
      }

      const result = await getDailyReports(filters)
      
      if (result.success && result.data) {
        const reportData = result.data as DailyReport[]
        setReports(reportData)

      } else {
        showErrorNotification(result.error || '일일보고서를 불러오는데 실패했습니다.', 'loadReports')
        setReports([])
      }
    } catch (error) {
      showErrorNotification(error, 'loadReports')
      setReports([])
    } finally {
      setLoading(false)
    }
  }, [selectedSite, selectedStatus, dateRange])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.process_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.issues?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSite = selectedSite === 'all' || report.site_id === selectedSite
    const matchesStatus = selectedStatus === 'all' || report.status === selectedStatus
    
    return matchesSearch && matchesSite && matchesStatus
  })

  const canCreateReport = ['worker', 'site_manager', 'admin'].includes(currentUser.role)

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: '임시저장', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
      submitted: { label: '제출됨', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
      approved: { label: '승인됨', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
      rejected: { label: '반려됨', className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return (
      <Badge className={cn('text-xs px-2 py-0.5', config.className)}>
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-2 touch-pan-y overscroll-behavior-contain">
      {/* Work Log Creation Button - 홈 화면과 동일한 스타일 */}
      {canCreateReport && (
        <Card 
          elevation="md" 
          className="theme-transition bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 border-0"
          aria-labelledby="work-log-section"
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 id="work-log-section" className="text-white font-semibold text-sm whitespace-nowrap">
                  작업일지 작성
                </h2>
                <p className="text-white/90 text-xs mt-0.5 whitespace-nowrap">오늘의 작업 내용을 기록하세요</p>
              </div>
              <Link href="/dashboard/daily-reports/new">
                <button
                  className="flex items-center gap-1 px-3 py-1.5 bg-white/95 hover:bg-white text-blue-600 text-xs font-medium rounded-lg transition-colors touch-manipulation focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600 shadow-sm ml-2"
                  aria-label="새 작업일지 작성하기"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="whitespace-nowrap">새 작업일지</span>
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-3">
          {/* Search Bar */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
            <Input
              type="text"
              placeholder="검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-sm bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-lg"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-between w-full p-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>필터</span>
              {(selectedSite !== 'all' || selectedStatus !== 'all' || dateRange.from || dateRange.to) && (
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs px-1.5 py-0.5">
                  {[selectedSite !== 'all', selectedStatus !== 'all', dateRange.from || dateRange.to].filter(Boolean).length}
                </Badge>
              )}
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform", showFilters && "rotate-180")} />
          </button>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-2 space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <CustomSelect value={selectedSite} onValueChange={setSelectedSite}>
                <CustomSelectTrigger className={cn(
                  "w-full",
                  touchMode === 'glove' && "min-h-[60px] text-base",
                  touchMode === 'precision' && "min-h-[44px] text-sm",
                  touchMode !== 'precision' && touchMode !== 'glove' && "min-h-[40px] text-sm"
                )}>
                  <CustomSelectValue placeholder="전체 현장" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  <CustomSelectItem value="all">전체 현장</CustomSelectItem>
                  {sites?.map((site) => (
                    <CustomSelectItem key={site.id} value={site.id}>
                      {site.name}
                    </CustomSelectItem>
                  ))}
                </CustomSelectContent>
              </CustomSelect>

              <CustomSelect value={selectedStatus} onValueChange={setSelectedStatus}>
                <CustomSelectTrigger className={cn(
                  "w-full",
                  touchMode === 'glove' && "min-h-[60px] text-base",
                  touchMode === 'precision' && "min-h-[44px] text-sm",
                  touchMode !== 'precision' && touchMode !== 'glove' && "min-h-[40px] text-sm"
                )}>
                  <CustomSelectValue placeholder="전체 상태" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  <CustomSelectItem value="all">전체 상태</CustomSelectItem>
                  <CustomSelectItem value="draft">임시저장</CustomSelectItem>
                  <CustomSelectItem value="submitted">제출됨</CustomSelectItem>
                </CustomSelectContent>
              </CustomSelect>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>기간 선택</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">시작일</label>
                    <Input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                      className={cn(
                        "text-sm bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-lg",
                        touchMode === 'glove' && "min-h-[60px] text-base",
                        touchMode === 'precision' && "min-h-[44px] text-sm",
                        touchMode !== 'precision' && touchMode !== 'glove' && "min-h-[40px] text-sm"
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">종료일</label>
                    <Input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                      className={cn(
                        "text-sm bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-lg",
                        touchMode === 'glove' && "min-h-[60px] text-base",
                        touchMode === 'precision' && "min-h-[44px] text-sm",
                        touchMode !== 'precision' && touchMode !== 'glove' && "min-h-[40px] text-sm"
                      )}
                    />
                  </div>
                </div>
                
                {/* Quick Date Presets */}
                <div className="flex flex-wrap gap-1 pt-1">
                  <button
                    onClick={() => {
                      const today = new Date()
                      const oneWeekAgo = new Date(today)
                      oneWeekAgo.setDate(today.getDate() - 7)
                      setDateRange({
                        from: oneWeekAgo.toISOString().split('T')[0],
                        to: today.toISOString().split('T')[0]
                      })
                    }}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                  >
                    최근 7일
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date()
                      const oneMonthAgo = new Date(today)
                      oneMonthAgo.setMonth(today.getMonth() - 1)
                      setDateRange({
                        from: oneMonthAgo.toISOString().split('T')[0],
                        to: today.toISOString().split('T')[0]
                      })
                    }}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                  >
                    최근 1개월
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date()
                      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
                      setDateRange({
                        from: startOfMonth.toISOString().split('T')[0],
                        to: today.toISOString().split('T')[0]
                      })
                    }}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                  >
                    이번달
                  </button>
                  <button
                    onClick={() => setDateRange({ from: '', to: '' })}
                    className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                  >
                    초기화
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report List */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">작업일지를 불러오는 중...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
          <FileText className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">작업일지가 없습니다.</p>
          {canCreateReport && (
            <Link href="/dashboard/daily-reports/new">
              <Button className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                작업일지 작성하기
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredReports.map((report: any) => {
            const site = (report as any).site || sites?.find(s => s.id === report.site_id)
            const canEdit = currentUser.id === report.created_by && report.status === 'draft'
            
            return (
              <div
                key={report.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-shadow"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {format(new Date(report.work_date), 'MM월 dd일', { locale: ko })}
                      </span>
                      {getStatusBadge(report.status)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                      <Building2 className="h-3 w-3" />
                      <span>{site?.name || '미지정'}</span>
                    </div>
                  </div>
                  <Link href={`/dashboard/daily-reports/${report.id}`}>
                    <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </Link>
                </div>


                {/* Work Content */}
                <div className="space-y-1 mb-2">
                  {/* 작업내용 표시 */}
                  {(report.member_name || report.process_type) && (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        작업내용1: {[
                          report.member_name,
                          report.process_type
                        ].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  
                  {/* 작업자 정보 표시 */}
                  {report.total_workers && report.total_workers > 0 && (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        총 작업자: {report.total_workers}명
                      </span>
                    </div>
                  )}
                </div>


                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span>{format(new Date(report.created_at), 'yyyy.MM.dd HH:mm')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/daily-reports/${report.id}`}>
                      <Button variant="ghost" size="compact" className="h-7 w-7 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    {canEdit && (
                      <Link href={`/dashboard/daily-reports/${report.id}/edit`}>
                        <Button variant="ghost" size="compact" className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}