'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CustomSelect as Select,
  CustomSelectContent as SelectContent,
  CustomSelectItem as SelectItem,
  CustomSelectTrigger as SelectTrigger,
  CustomSelectValue as SelectValue
} from '@/components/ui/custom-select'
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Calendar,
  Building2,
  User,
  Users,
  FileImage,
  ChevronLeft,
  ChevronRight,
  X,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import DailyReportDetailModal from './DailyReportDetailModal'
import UnifiedDailyReportView from '../integrated/UnifiedDailyReportView'
import { getDailyReports, getSites, deleteDailyReport } from '@/app/actions/admin/daily-reports'

interface DailyReport {
  id: string
  work_date: string
  member_name: string
  process_type: string
  component_name?: string  // 부재명
  work_process?: string     // 작업공정
  work_section?: string     // 작업구간
  total_workers: number
  total_manhours?: number  // 공수
  npc1000_incoming: number
  npc1000_used: number
  npc1000_remaining: number
  issues: string
  status: 'draft' | 'submitted'
  created_at: string
  updated_at: string
  created_by: string
  site_id: string
  sites?: {
    name: string
    address: string
    work_process?: string
    work_section?: string
    component_name?: string
    manager_name?: string
    safety_manager_name?: string
  }
  profiles?: {
    full_name: string
    email: string
    phone?: string
    role?: string
    last_login_at?: string
  }
  worker_details_count?: number
  daily_documents_count?: number
}

interface Site {
  id: string
  name: string
}

interface FilterState {
  site: string
  status: string
  dateFrom: string
  dateTo: string
  search: string
  component_name: string  // 부재명 필터
  work_process: string    // 작업공정 필터
  work_section: string    // 작업구간 필터
}

type SortField = 'work_date' | 'site_name' | 'member_name' | 'total_manhours' | 'status' | 'created_at' | 'component_name' | 'work_process' | 'work_section'
type SortDirection = 'asc' | 'desc'

interface SortState {
  field: SortField
  direction: SortDirection
}

const statusLabels = {
  draft: '임시저장',
  submitted: '제출됨'
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800'
}

// Debounce utility function
function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null
  return ((...args: any[]) => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
    timeout = setTimeout(() => {
      func(...args)
      timeout = null
    }, wait)
  }) as T
}

export default function DailyReportsManagement() {
  const router = useRouter()
  const [reports, setReports] = useState<DailyReport[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showIntegratedView, setShowIntegratedView] = useState(false)
  const [integratedViewReportId, setIntegratedViewReportId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 20

  const [filters, setFilters] = useState<FilterState>({
    site: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    search: '',
    component_name: '',
    work_process: '',
    work_section: ''
  })

  const [sortState, setSortState] = useState<SortState>({
    field: 'work_date',
    direction: 'desc'
  })

  useEffect(() => {
    fetchSites()
  }, [])

  // Load reports when component mounts or pagination/sort changes
  useEffect(() => {
    fetchReports()
  }, [currentPage, sortState])

  // Debounce search and filter changes with ref to prevent stale closures
  const filtersRef = useRef(filters)
  filtersRef.current = filters

  useEffect(() => {
    const handler = setTimeout(() => {
      // Only fetch if filters haven't changed since timeout started
      if (JSON.stringify(filtersRef.current) === JSON.stringify(filters)) {
        fetchReports(true)
      }
    }, 500) // Always debounce for filters to prevent rapid API calls

    return () => {
      clearTimeout(handler)
    }
  }, [filters])

  const fetchSites = async () => {
    try {
      const result = await getSites()
      if (result.success) {
        setSites(result.data)
      } else {
        console.error('Error fetching sites:', result.error)
      }
    } catch (error) {
      console.error('Error fetching sites:', error)
    }
  }

  const fetchReports = async (isSearching = false) => {
    if (isSearching) {
      setSearchLoading(true)
    } else {
      setLoading(true)
    }
    try {
      const result = await getDailyReports({
        site: filters.site,
        status: filters.status,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        search: filters.search,
        component_name: filters.component_name,
        work_process: filters.work_process,
        work_section: filters.work_section,
        page: currentPage,
        itemsPerPage,
        sortField: sortState.field,
        sortDirection: sortState.direction
      })

      if (result.success) {
        setReports(result.data.reports)
        setTotalCount(result.data.totalCount)
      } else {
        console.error('Error fetching reports:', result.error)
        setReports([])
        setTotalCount(0)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      setReports([])
      setTotalCount(0)
    }
    setLoading(false)
    setSearchLoading(false)
  }

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    // Convert "all" value to empty string for API compatibility
    const processedValue = value === 'all' ? '' : value
    setFilters(prev => ({ ...prev, [key]: processedValue }))
    setCurrentPage(1) // Reset to first page when filtering
  }

  const clearFilters = () => {
    setFilters({
      site: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      search: '',
      component_name: '',
      work_process: '',
      work_section: ''
    })
    setCurrentPage(1)
  }

  const openDetailModal = (report: DailyReport) => {
    setSelectedReport(report)
    setShowDetailModal(true)
  }

  const handleViewIntegrated = (reportId: string) => {
    setIntegratedViewReportId(reportId)
    setShowIntegratedView(true)
  }

  const closeDetailModal = () => {
    setSelectedReport(null)
    setShowDetailModal(false)
  }

  const handleReportUpdated = () => {
    fetchReports() // Refresh the list
  }

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('작업일지를 삭제하시겠습니까?')) return

    try {
      const result = await deleteDailyReport(reportId)
      if (result.success) {
        fetchReports() // Refresh list
        alert(result.message)
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error('Error deleting report:', error)
      alert('작업일지 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleSort = (field: SortField) => {
    setSortState(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
    setCurrentPage(1) // Reset to first page when sorting
  }

  const handleExcelDownload = async () => {
    try {
      // Create URL parameters from current filters
      const params = new URLSearchParams()
      
      if (filters.site) params.append('site', filters.site)
      if (filters.status) params.append('status', filters.status)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)
      if (filters.search) params.append('search', filters.search)
      if (filters.component_name) params.append('component_name', filters.component_name)
      if (filters.work_process) params.append('work_process', filters.work_process)
      if (filters.work_section) params.append('work_section', filters.work_section)

      // Show loading state
      const originalText = document.querySelector('.excel-download-btn')?.textContent
      const btn = document.querySelector('.excel-download-btn') as HTMLButtonElement
      if (btn) {
        btn.disabled = true
        btn.innerHTML = `
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          내보내는 중...
        `
      }

      // Make API request
      const response = await fetch(`/api/admin/daily-reports/export?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Excel 파일 생성에 실패했습니다.')
      }

      // Get the blob
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Get filename from response header
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = '작업일지.xlsx'
      if (contentDisposition) {
        const matches = /filename\*=UTF-8''(.+)/.exec(contentDisposition)
        if (matches) {
          filename = decodeURIComponent(matches[1])
        }
      }
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      // Reset button
      if (btn) {
        btn.disabled = false
        btn.innerHTML = `
          <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          Excel 다운로드
        `
      }

    } catch (error) {
      console.error('Excel download error:', error)
      alert('Excel 파일 다운로드 중 오류가 발생했습니다.')
      
      // Reset button on error
      const btn = document.querySelector('.excel-download-btn') as HTMLButtonElement
      if (btn) {
        btn.disabled = false
        btn.innerHTML = `
          <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          Excel 다운로드
        `
      }
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortState.field !== field) {
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />
    }
    return sortState.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-600" />
      : <ChevronDown className="h-4 w-4 text-blue-600" />
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${filters.search ? 'text-blue-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="작업자명, 부재명, 작업공정, 작업구간, 현장명, 주소, 담당자명, 특이사항으로 검색하세요..."
                className={`w-full pl-10 pr-10 py-2 border rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${filters.search ? 'border-blue-300 bg-blue-50' : 'border-gray-300'}`}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                {searchLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                )}
                {filters.search && !searchLoading && (
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="검색어 지우기"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4" />
              필터
            </button>
            <button 
              onClick={() => router.push('/dashboard/admin/daily-reports/new')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              새 작업일지
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">현장</label>
                <Select
                  value={filters.site || 'all'}
                  onValueChange={(value) => handleFilterChange('site', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="현장 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">모든 현장</SelectItem>
                    {sites.map(site => (
                      <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">모든 상태</SelectItem>
                    <SelectItem value="draft">임시저장</SelectItem>
                    <SelectItem value="submitted">제출됨</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">시작일</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-white text-gray-900 dark:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">종료일</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-white text-gray-900 dark:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">부재명</label>
                <input
                  type="text"
                  placeholder="부재명 입력"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-white text-gray-900 dark:text-gray-900 placeholder-gray-500 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.component_name}
                  onChange={(e) => handleFilterChange('component_name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">작업공정</label>
                <input
                  type="text"
                  placeholder="작업공정 입력"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-white text-gray-900 dark:text-gray-900 placeholder-gray-500 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.work_process}
                  onChange={(e) => handleFilterChange('work_process', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">작업구간</label>
                <input
                  type="text"
                  placeholder="작업구간 입력"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-white text-gray-900 dark:text-gray-900 placeholder-gray-500 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.work_section}
                  onChange={(e) => handleFilterChange('work_section', e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                필터 초기화
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-600">
            총 <span className="font-semibold text-gray-900">{totalCount}</span>개의 작업일지
          </p>
          {filters.search && (
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                검색 중: "{filters.search}"
              </div>
              <button
                onClick={() => handleFilterChange('search', '')}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                검색 해제
              </button>
            </div>
          )}
        </div>
        <button 
          onClick={handleExcelDownload}
          className="excel-download-btn flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="h-4 w-4" />
          Excel 다운로드
        </button>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">작업일지를 불러오는 중...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center">
            <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">조건에 맞는 작업일지가 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('work_date')}
                  >
                    <div className="flex items-center gap-1">
                      작업일 <span className="text-blue-600 text-xs normal-case">(클릭시 상세)</span>
                      {getSortIcon('work_date')}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('site_name')}
                  >
                    <div className="flex items-center gap-1">
                      현장정보
                      {getSortIcon('site_name')}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('component_name')}
                  >
                    <div className="flex items-center gap-1">
                      부재명
                      {getSortIcon('component_name')}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('work_process')}
                  >
                    <div className="flex items-center gap-1">
                      작업공정
                      {getSortIcon('work_process')}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('work_section')}
                  >
                    <div className="flex items-center gap-1">
                      작업구간
                      {getSortIcon('work_section')}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('member_name')}
                  >
                    <div className="flex items-center gap-1">
                      작업책임자
                      {getSortIcon('member_name')}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('total_manhours')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      공수
                      {getSortIcon('total_manhours')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    자재현황
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    특이사항
                  </th>
                  <th 
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      상태
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    문서/상세
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-1">
                      작성정보
                      {getSortIcon('created_at')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.map((report: any) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div 
                        className="flex items-center cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => router.push(`/dashboard/admin/daily-reports/${report.id}`)}
                      >
                        <Calendar className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 hover:text-blue-600">
                            {format(new Date(report.work_date), 'yyyy.MM.dd', { locale: ko })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(report.work_date), 'EEEE', { locale: ko })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {report.sites?.name || '알 수 없는 현장'}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {report.sites?.address}
                        </div>
                        {(report.sites?.manager_name || report.sites?.safety_manager_name) && (
                          <div className="text-xs text-gray-400 mt-1">
                            {report.sites?.manager_name && `공사: ${report.sites.manager_name}`}
                            {report.sites?.manager_name && report.sites?.safety_manager_name && ' / '}
                            {report.sites?.safety_manager_name && `안전: ${report.sites.safety_manager_name}`}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {report.component_name || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {report.work_process || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {report.work_section || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{report.member_name}</div>
                        <div className="text-xs text-gray-600">{report.process_type}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {report.total_manhours ? report.total_manhours.toFixed(1) : '0'}
                        </div>
                        {report.total_workers > 0 && (
                          <div className="text-xs text-gray-500">
                            ({report.total_workers}명)
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs">
                        <div className="flex items-center text-gray-700">
                          <span className="font-medium mr-1">입고:</span>
                          <span className="text-blue-600">{report.npc1000_incoming}</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <span className="font-medium mr-1">사용:</span>
                          <span className="text-orange-600">{report.npc1000_used}</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <span className="font-medium mr-1">잔여:</span>
                          <span className="text-green-600">{report.npc1000_remaining}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      {report.issues ? (
                        <div className="text-xs text-gray-700 truncate" title={report.issues}>
                          {report.issues}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">-</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[report.status]}`}>
                        {statusLabels[report.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {report.daily_documents_count > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            📄 {report.daily_documents_count}
                          </span>
                        )}
                        {report.worker_details_count > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            👷 {report.worker_details_count}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-xs font-medium text-gray-900">
                          {report.profiles?.full_name || '알 수 없음'}
                        </div>
                        {report.profiles?.role && (
                          <div className="text-xs text-gray-500">
                            {report.profiles.role === 'admin' ? '관리자' : 
                             report.profiles.role === 'site_manager' ? '현장담당' :
                             report.profiles.role === 'worker' ? '작업자' : report.profiles.role}
                          </div>
                        )}
                        <div className="text-xs text-gray-400">
                          {format(new Date(report.created_at), 'HH:mm', { locale: ko })}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => router.push(`/dashboard/admin/daily-reports/${report.id}`)}
                          className="px-2 py-1 text-xs text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors font-medium"
                          title="상세보기"
                        >
                          보기
                        </button>
                        <button
                          onClick={() => router.push(`/dashboard/admin/daily-reports/${report.id}/edit`)}
                          className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors font-medium"
                          title="편집"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="px-2 py-1 text-xs text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors font-medium"
                          title="삭제"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} / {totalCount}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              이전
            </button>
            
            {/* Page numbers */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 border rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              다음
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <DailyReportDetailModal
          report={selectedReport}
          onClose={closeDetailModal}
          onUpdated={handleReportUpdated}
        />
      )}

      {/* Integrated View Modal */}
      {showIntegratedView && integratedViewReportId && (
        <UnifiedDailyReportView
          reportId={integratedViewReportId}
          isOpen={showIntegratedView}
          onClose={() => {
            setShowIntegratedView(false)
            setIntegratedViewReportId(null)
          }}
        />
      )}
    </div>
  )
}