'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Site } from '@/types'
import { PlusIcon, BuildingOfficeIcon, MapPinIcon, CalendarIcon, Squares2X2Icon, ListBulletIcon, EyeIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, FunnelIcon, ChevronUpIcon, ChevronDownIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

type ViewMode = 'card' | 'list'

export default function SiteManagementList() {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sortField, setSortField] = useState<'name' | 'address' | 'status' | 'start_date' | 'manager_name' | 'total_manhours' | 'total_reports'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const fetchSites = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Debug: Check auth state first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      // console.log('[SITE-MANAGEMENT] Current session:', session?.user?.email || 'No session')
      // console.log('[SITE-MANAGEMENT] Session error:', sessionError?.message || 'None')
      
      const { data: sitesData, error: sitesError } = await supabase
        .from('sites')
        .select('*')
        .order('created_at', { ascending: false })
      
      // console.log('[SITE-MANAGEMENT] Sites query result:', {
      //   dataCount: sitesData?.length || 0,
      //   error: sitesError?.message || 'None'
      // })
      
      if (sitesError) {
        console.error('[SITE-MANAGEMENT] Sites query error:', sitesError)
        throw sitesError
      }
      
      // Set sites immediately without counts for faster initial load
      setSites(sitesData || [])
      setLoading(false)
      
      // Then fetch counts and manhours in background
      if (sitesData && sitesData.length > 0) {
        // Fetch counts and manhours for both card and list views
        const sitesWithCounts = await Promise.all(
          sitesData.map(async (site) => {
            try {
              // Fetch daily reports for this site
              const { data: dailyReports } = await supabase
                .from('daily_reports')
                .select('id')
                .eq('site_id', site.id)
              
              // Calculate total manhours from worker assignments
              let totalManhours = 0
              if (dailyReports && dailyReports.length > 0) {
                const reportIds = dailyReports.map(r => r.id)
                const { data: assignments } = await supabase
                  .from('worker_assignments')
                  .select('labor_hours')
                  .in('daily_report_id', reportIds)
                
                if (assignments) {
                  totalManhours = assignments.reduce((sum, a) => sum + (Number(a.labor_hours) || 0), 0)
                }
              }
              
              const reportCount = dailyReports?.length || 0
              
              return {
                ...site,
                total_manhours: totalManhours,
                total_reports: reportCount
              }
            } catch (error) {
              console.warn(`Failed to fetch counts for site ${site.id}:`, error)
              return {
                ...site,
                total_manhours: 0,
                total_reports: 0
              }
            }
          })
        )
        
        setSites(sitesWithCounts)
      }
    } catch (err) {
      console.error('Error fetching sites:', err)
      setError('현장 목록을 불러오는 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSites()
  }, [])

  const handleSiteSelect = (site: Site) => {
    // Navigate to the new site detail page
    router.push(`/dashboard/admin/sites/${site.id}`)
  }

  const handleCreateSite = async (formData: {
    name: string
    address: string
    description?: string
    manager_name?: string
    safety_manager_name?: string
    start_date: string
    end_date?: string
  }) => {
    try {
      setCreateLoading(true)
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('로그인이 필요합니다.')
      }

      const siteData = {
        name: formData.name,
        address: formData.address,
        description: formData.description || null,
        manager_name: formData.manager_name || null,
        safety_manager_name: formData.safety_manager_name || null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        status: 'active' as const,
        created_by: user.id
      }

      const { data: newSite, error: createError } = await supabase
        .from('sites')
        .insert([siteData])
        .select()
        .single()

      if (createError) {
        throw createError
      }

      // 성공 시 목록 새로고침
      await fetchSites()
      setShowCreateModal(false)
      
      // 생성된 현장으로 이동
      router.push(`/dashboard/admin/sites/${newSite.id}`)
      
    } catch (error) {
      console.error('Error creating site:', error)
      alert('현장 생성에 실패했습니다.')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleSort = (field: typeof sortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: typeof sortField) => {
    if (field !== sortField) {
      return <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
    }
    return sortDirection === 'asc' 
      ? <ChevronUpIcon className="h-4 w-4 text-blue-500" />
      : <ChevronDownIcon className="h-4 w-4 text-blue-500" />
  }

  // Filter and sort sites
  const filteredAndSortedSites = sites
    .filter(site => {
      const matchesSearch = searchTerm === '' || 
        site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (site.address && site.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (site.manager_name && site.manager_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (site.safety_manager_name && site.safety_manager_name.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesStatus = statusFilter === '' || site.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]
      
      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = ''
      if (bValue === null || bValue === undefined) bValue = ''
      
      // Special handling for dates
      if (sortField === 'start_date') {
        aValue = aValue ? new Date(aValue).getTime() : 0
        bValue = bValue ? new Date(bValue).getTime() : 0
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

  const renderListView = () => (
    <div className="mt-8 overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg">
      <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center gap-1">
                현장명
                {getSortIcon('name')}
              </div>
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleSort('address')}
            >
              <div className="flex items-center gap-1">
                주소
                {getSortIcon('address')}
              </div>
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center gap-1">
                상태
                {getSortIcon('status')}
              </div>
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleSort('start_date')}
            >
              <div className="flex items-center gap-1">
                기간
                {getSortIcon('start_date')}
              </div>
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleSort('manager_name')}
            >
              <div className="flex items-center gap-1">
                공사담당
                {getSortIcon('manager_name')}
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              안전담당
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleSort('total_manhours')}
            >
              <div className="flex items-center justify-center gap-1">
                공수
                {getSortIcon('total_manhours')}
              </div>
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleSort('total_reports')}
            >
              <div className="flex items-center justify-center gap-1">
                작업일지수
                {getSortIcon('total_reports')}
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {filteredAndSortedSites.map((site: any) => (
            <tr
              key={site.id}
              onClick={() => handleSiteSelect(site)}
              className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
            >
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {site.name}
                    </div>
                    {site.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {site.description}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {site.address || '-'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  site.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : site.status === 'completed'
                    ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {site.status === 'active' ? '진행중' : site.status === 'completed' ? '완료' : '비활성'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {site.start_date ? new Date(site.start_date).toLocaleDateString('ko-KR') : '-'}
                </div>
                {site.end_date && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    ~ {new Date(site.end_date).toLocaleDateString('ko-KR')}
                  </div>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {site.manager_name || '-'}
                </div>
                {site.construction_manager_phone && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {site.construction_manager_phone}
                  </div>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {site.safety_manager_name || '-'}
                </div>
                {site.safety_manager_phone && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {site.safety_manager_phone}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                  {site.total_manhours ? site.total_manhours.toFixed(1) : 0}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
                  {site.total_reports || 0}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  // Show the site list (removed old selectedSite logic)
  return (
    <div>
      {/* Header with create button */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">전체 현장 목록</h2>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            총 {sites.length}개의 현장 중 {filteredAndSortedSites.length}개가 표시되고 있습니다.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none sm:flex sm:space-x-3">
          {/* View Toggle */}
          <div className="flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
            <button
              onClick={() => setViewMode('card')}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-l-md border-r border-gray-300 dark:border-gray-600 ${
                viewMode === 'card'
                  ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-r-md ${
                viewMode === 'list'
                  ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            새 현장 등록
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-500 sm:text-sm sm:leading-6 bg-white dark:bg-gray-800"
            placeholder="현장명, 주소, 담당자 검색..."
          />
        </div>
        
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full rounded-md border-0 py-2 pl-10 pr-10 text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-500 sm:text-sm sm:leading-6 bg-white dark:bg-gray-800"
          >
            <option value="">모든 상태</option>
            <option value="active">진행중</option>
            <option value="completed">완료</option>
            <option value="inactive">비활성</option>
          </select>
        </div>
        
        <div className="flex items-center justify-end text-sm text-gray-500 dark:text-gray-400">
          {searchTerm || statusFilter ? (
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('')
              }}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
            >
              필터 초기화
            </button>
          ) : null}
        </div>
      </div>

      {/* Loading state - show skeleton instead of spinner for better UX */}
      {loading && sites.length === 0 && (
        <div className="mt-8">
          <div className="animate-pulse">
            {viewMode === 'card' ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-200 dark:bg-gray-700 h-96 rounded-lg"></div>
            )}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mt-8 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Site content */}
      {!loading && !error && (
        viewMode === 'card' ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedSites.map((site: any) => (
              <div
                key={site.id}
                onClick={() => handleSiteSelect(site)}
                className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BuildingOfficeIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {site.name}
                      </h3>
                      <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <MapPinIcon className="mr-1 h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{site.address || '주소 미등록'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <CalendarIcon className="mr-1 h-4 w-4" />
                      {site.start_date ? new Date(site.start_date).toLocaleDateString('ko-KR') : '시작일 미정'}
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      site.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : site.status === 'completed'
                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>
                      {site.status === 'active' ? '진행중' : site.status === 'completed' ? '완료' : '비활성'}
                    </span>
                  </div>

                  {site.description && (
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {site.description}
                    </p>
                  )}

                  {/* Additional Information Grid */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    {site.manager_name && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <span className="font-medium mr-1">공사:</span>
                        <span className="truncate">{site.manager_name}</span>
                      </div>
                    )}
                    {site.safety_manager_name && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <span className="font-medium mr-1">안전:</span>
                        <span className="truncate">{site.safety_manager_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Statistics Bar */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-blue-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{site.total_manhours ? site.total_manhours.toFixed(1) : 0}</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-purple-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{site.total_reports || 0}</span>
                      </div>
                    </div>
                    {site.end_date && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        ~{new Date(site.end_date).toLocaleDateString('ko-KR')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          renderListView()
        )
      )}

      {/* Empty state */}
      {!loading && !error && sites.length === 0 && (
        <div className="mt-8 text-center">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">현장이 없습니다</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">새 현장을 등록하여 시작하세요.</p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              새 현장 등록
            </button>
          </div>
        </div>
      )}

      {/* Create Site Modal */}
      {showCreateModal && (
        <CreateSiteModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateSite}
          loading={createLoading}
        />
      )}
    </div>
  )
}

// Create Site Modal Component
function CreateSiteModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading 
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: any) => void
  loading: boolean
}) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    manager_name: '',
    safety_manager_name: '',
    start_date: '',
    end_date: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.address || !formData.start_date) {
      alert('필수 항목을 모두 입력해주세요.')
      return
    }
    onSubmit(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">새 현장 등록</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <span className="sr-only">닫기</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 현장명 (필수) */}
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                현장명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="현장명을 입력하세요"
              />
            </div>

            {/* 주소 (필수) */}
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                주소 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="address"
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="현장 주소를 입력하세요"
              />
            </div>

            {/* 건설담당자 */}
            <div>
              <label htmlFor="manager_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                건설담당자
              </label>
              <input
                type="text"
                id="manager_name"
                name="manager_name"
                value={formData.manager_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="담당자명"
              />
            </div>

            {/* 안전담당자 */}
            <div>
              <label htmlFor="safety_manager_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                안전담당자
              </label>
              <input
                type="text"
                id="safety_manager_name"
                name="safety_manager_name"
                value={formData.safety_manager_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="안전담당자명"
              />
            </div>

            {/* 시작일 (필수) */}
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                시작일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                required
                value={formData.start_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            {/* 종료일 */}
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                종료일
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                min={formData.start_date}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            {/* 설명 */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                설명
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="현장에 대한 설명을 입력하세요 (선택사항)"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '생성 중...' : '현장 생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}