'use client'

import { useState, useEffect } from 'react'
import { Profile, Site, SiteStatus } from '@/types'
import AdminDataTable from './AdminDataTable'
import BulkActionBar, { commonBulkActions } from './BulkActionBar'
import { 
  getSites, 
  createSite, 
  updateSite, 
  deleteSites, 
  updateSiteStatus,
  CreateSiteData,
  UpdateSiteData 
} from '@/app/actions/admin/sites'
import { Plus, Search, Filter, Eye, Edit, MapPin, Calendar, Phone, Users, FileText, Grid, List, MoreVertical, Activity } from 'lucide-react'
import SiteDetail from './sites/SiteDetail'
import SiteWorkersModal from './SiteWorkersModal'
import UnifiedSiteView from './integrated/UnifiedSiteView'

interface SiteManagementProps {
  profile?: Profile
}

export default function SiteManagement({ profile }: SiteManagementProps) {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10

  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<SiteStatus | ''>('')
  
  // View state
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list')
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSite, setEditingSite] = useState<Site | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [viewingSite, setViewingSite] = useState<Site | null>(null)
  const [isWorkersModalOpen, setIsWorkersModalOpen] = useState(false)
  const [selectedSiteForWorkers, setSelectedSiteForWorkers] = useState<Site | null>(null)
  const [showIntegratedView, setShowIntegratedView] = useState(false)
  const [integratedViewSiteId, setIntegratedViewSiteId] = useState<string | null>(null)

  // Load sites data
  const loadSites = async () => {
    // console.log('Loading sites...')
    setLoading(true)
    setError(null)
    
    try {
      const result = await getSites(
        currentPage,
        pageSize,
        searchTerm,
        statusFilter || undefined
      )
      
      if (result.success && result.data) {
        // console.log('Sites loaded successfully:', result.data.sites)
        setSites(result.data.sites)
        setTotalCount(result.data.total)
        setTotalPages(result.data.pages)
      } else {
        console.error('Failed to load sites:', result.error)
        setError(result.error || '현장 데이터를 불러오는데 실패했습니다.')
      }
    } catch (err) {
      console.error('Error loading sites:', err)
      setError('현장 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // Load data on mount and when filters change
  useEffect(() => {
    loadSites()
  }, [currentPage, searchTerm, statusFilter])

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  // Handle status filter
  const handleStatusFilter = (status: SiteStatus | '') => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  // Handle bulk delete
  const handleBulkDelete = async (siteIds: string[]) => {
    try {
      const result = await deleteSites(siteIds)
      if (result.success) {
        await loadSites()
        setSelectedIds([])
        alert(result.message)
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  // Handle bulk status update
  const handleBulkStatusUpdate = (status: SiteStatus) => async (siteIds: string[]) => {
    try {
      const result = await updateSiteStatus(siteIds, status)
      if (result.success) {
        await loadSites()
        setSelectedIds([])
        alert(result.message)
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('상태 업데이트 중 오류가 발생했습니다.')
    }
  }

  // Handle create site
  const handleCreateSite = () => {
    setShowCreateModal(true)
  }

  // Handle edit site
  const handleEditSite = (site: Site) => {
    setEditingSite(site)
    setShowEditModal(true)
  }

  // Handle view site
  const handleViewSite = (site: Site) => {
    setViewingSite(site)
    setShowDetailModal(true)
  }

  const handleViewIntegrated = (siteId: string) => {
    setIntegratedViewSiteId(siteId)
    setShowIntegratedView(true)
  }

  // Handle delete single site
  const handleDeleteSite = async (site: Site) => {
    if (!confirm(`정말로 "${site.name}" 현장을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return
    }
    
    try {
      const result = await deleteSites([site.id])
      if (result.success) {
        await loadSites()
        alert(`"${site.name}" 현장이 삭제되었습니다.`)
      } else {
        alert(result.error || '현장 삭제에 실패했습니다.')
      }
    } catch (error) {
      alert('현장 삭제 중 오류가 발생했습니다.')
    }
  }

  // Handle document management navigation
  const handleDocumentManagement = (site: Site) => {
    window.location.href = `/dashboard/admin/sites/${site.id}/documents`
  }

  // Handle worker management
  const handleWorkerManagement = (site: Site) => {
    setSelectedSiteForWorkers(site)
    setIsWorkersModalOpen(true)
  }

  // Define table columns
  const columns = [
    {
      key: 'name',
      label: '현장명',
      sortable: true,
      filterable: true,
      render: (value: string, site: Site) => (
        <div className="flex items-center">
          <MapPin className="h-4 w-4 text-gray-400 mr-2" />
          <div>
            <button
              onClick={() => handleViewSite(site)}
              className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
            >
              {value}
            </button>
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
              {site.address}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: '상태',
      render: (value: SiteStatus) => {
        const statusConfig = {
          active: { text: '활성', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
          inactive: { text: '비활성', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' },
          completed: { text: '완료', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' }
        }
        
        const config = statusConfig[value] || statusConfig.inactive
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
            {config.text}
          </span>
        )
      }
    },
    {
      key: 'start_date',
      label: '시작일',
      render: (value: string) => (
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="h-4 w-4 mr-1" />
          {new Date(value).toLocaleDateString('ko-KR')}
        </div>
      )
    },
    {
      key: 'manager_name',
      label: '담당자',
      render: (value: string, site: Site) => (
        <div className="text-sm">
          {value ? (
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">{value}</div>
              {site.construction_manager_phone && (
                <div className="text-gray-500 dark:text-gray-400 flex items-center">
                  <Phone className="h-3 w-3 mr-1" />
                  {site.construction_manager_phone}
                </div>
              )}
            </div>
          ) : (
            <span className="text-gray-400">미지정</span>
          )}
        </div>
      )
    },
    {
      key: 'created_at',
      label: '생성일',
      render: (value: string) => new Date(value).toLocaleDateString('ko-KR')
    }
  ]

  // Define bulk actions
  const bulkActions = [
    commonBulkActions.delete(handleBulkDelete),
    {
      id: 'activate',
      label: '활성화',
      icon: Users,
      onClick: handleBulkStatusUpdate('active')
    },
    {
      id: 'deactivate',
      label: '비활성화',
      icon: Users,
      variant: 'secondary' as const,
      onClick: handleBulkStatusUpdate('inactive')
    },
    {
      id: 'complete',
      label: '완료처리',
      icon: Users,
      variant: 'secondary' as const,
      onClick: handleBulkStatusUpdate('completed')
    }
  ]

  // Render card view
  const renderCardView = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full mb-4"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (sites.length === 0) {
      return (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">현장이 없습니다</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">새 현장을 추가하여 시작하세요.</p>
          <button
            onClick={handleCreateSite}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            새 현장 추가
          </button>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sites.map((site) => (
          <div
            key={site.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
          >
            {/* Card Header */}
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => handleViewSite(site)}
                    className="text-left w-full"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1">
                      {site.name}
                    </h3>
                  </button>
                  <div className="flex items-center mt-1">
                    <MapPin className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                      {site.address}
                    </p>
                  </div>
                </div>
                
                {/* Actions Dropdown */}
                <div className="relative ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      // Toggle dropdown logic would go here
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {/* Dropdown menu would be implemented here */}
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  {(() => {
                    const statusConfig = {
                      active: { text: '활성', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
                      inactive: { text: '비활성', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' },
                      completed: { text: '완료', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' }
                    }
                    
                    const config = statusConfig[site.status || 'inactive']
                    return (
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
                        {config.text}
                      </span>
                    )
                  })()}
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(site.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds([...selectedIds, site.id])
                      } else {
                        setSelectedIds(selectedIds.filter(id => id !== site.id))
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                </div>
              </div>

              {/* Site Info */}
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>시작: {new Date(site.start_date).toLocaleDateString('ko-KR')}</span>
                </div>
                
                {site.manager_name && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{site.manager_name}</span>
                    {site.construction_manager_phone && (
                      <span className="ml-2 text-xs">({site.construction_manager_phone})</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Card Actions */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewSite(site)}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    보기
                  </button>
                  <button
                    onClick={() => handleEditSite(site)}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    편집
                  </button>
                </div>
                
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleWorkerManagement(site)}
                    className="inline-flex items-center px-2 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    title="작업자 관리"
                  >
                    <Users className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDocumentManagement(site)}
                    className="inline-flex items-center px-2 py-1.5 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                    title="문서 관리"
                  >
                    <FileText className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleViewIntegrated(site.id)}
                    className="inline-flex items-center px-2 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                    title="통합 보기"
                  >
                    <Activity className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="mx-auto max-w-full px-3 sm:px-4 lg:px-6">
        <div className="space-y-4">
          {/* Header with search and filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="현장명 또는 주소로 검색..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-white text-gray-900 dark:text-gray-900 placeholder-gray-500 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex flex-row gap-2 flex-shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value as SiteStatus | '')}
                className="min-w-[100px] px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">모든 상태</option>
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
                <option value="completed">완료</option>
              </select>
              
              {/* View Toggle */}
              <div className="flex border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
                <button
                  onClick={() => setViewMode('card')}
                  className={`p-2 text-sm font-medium transition-colors ${
                    viewMode === 'card'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  title="카드 보기"
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  title="리스트 보기"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              
              <button
                onClick={handleCreateSite}
                className="inline-flex items-center whitespace-nowrap px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors flex-shrink-0"
              >
                <Plus className="h-4 w-4 mr-1.5 flex-shrink-0" />
                <span className="whitespace-nowrap">새 현장</span>
              </button>
            </div>
          </div>

          {/* Sites Content */}
          {viewMode === 'card' ? (
            renderCardView()
          ) : (
            <AdminDataTable
              data={sites}
              columns={columns}
              loading={loading}
              error={error}
              selectable={true}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              getRowId={(site: Site) => site.id}
              onView={handleViewSite}
              onEdit={handleEditSite}
              onDelete={handleDeleteSite}
              customActions={[
                {
                  icon: Users,
                  label: '작업자 관리',
                  onClick: handleWorkerManagement,
                  variant: 'default' as const
                },
                {
                  icon: FileText,
                  label: '문서 관리',
                  onClick: handleDocumentManagement,
                  variant: 'default' as const
                },
                {
                  icon: Activity,
                  label: '통합 보기',
                  onClick: (site: Site) => handleViewIntegrated(site.id),
                  variant: 'default' as const
                }
              ]}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              totalCount={totalCount}
              emptyMessage="현장이 없습니다"
              emptyDescription="새 현장을 추가하여 시작하세요."
            />
          )}

          {/* Pagination for Card View */}
          {viewMode === 'card' && !loading && sites.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 sm:px-6 rounded-lg">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  이전
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  다음
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    총 <span className="font-medium">{totalCount}</span>개 중{' '}
                    <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>-
                    <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span>개 표시
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      이전
                    </button>
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 2 && page <= currentPage + 2)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              page === currentPage
                                ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                : 'text-gray-900 dark:text-gray-300 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      } else if (
                        page === currentPage - 3 ||
                        page === currentPage + 3
                      ) {
                        return (
                          <span
                            key={page}
                            className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:outline-offset-0"
                          >
                            ...
                          </span>
                        )
                      }
                      return null
                    })}
                    <button
                      onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      다음
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}

          {/* Bulk action bar */}
          <BulkActionBar
            selectedIds={selectedIds}
            totalCount={totalCount}
            actions={bulkActions}
            onClearSelection={() => setSelectedIds([])}
          />

          {/* Modals */}
          {showCreateModal && (
            <SiteCreateEditModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onSuccess={() => {
                setShowCreateModal(false)
                loadSites()
              }}
            />
          )}
          
          {showEditModal && editingSite && (
            <SiteCreateEditModal
              isOpen={showEditModal}
              onClose={() => {
                setShowEditModal(false)
                setEditingSite(null)
              }}
              onSuccess={() => {
                setShowEditModal(false)
                setEditingSite(null)
                loadSites()
              }}
              site={editingSite}
            />
          )}

          {showDetailModal && viewingSite && (
            <SiteDetail
              siteId={viewingSite.id}
              onClose={() => {
                setShowDetailModal(false)
                setViewingSite(null)
              }}
              onEdit={() => {
                setViewingSite(null)
                setShowDetailModal(false)
                setEditingSite(viewingSite)
                setShowEditModal(true)
              }}
            />
          )}

          {/* Site Workers Modal */}
          {isWorkersModalOpen && selectedSiteForWorkers && (
            <SiteWorkersModal
              isOpen={isWorkersModalOpen}
              onClose={() => {
                setIsWorkersModalOpen(false)
                setSelectedSiteForWorkers(null)
              }}
              site={selectedSiteForWorkers}
            />
          )}

          {/* Integrated Site View Modal */}
          {showIntegratedView && integratedViewSiteId && (
            <UnifiedSiteView
              siteId={integratedViewSiteId}
              isOpen={showIntegratedView}
              onClose={() => {
                setShowIntegratedView(false)
                setIntegratedViewSiteId(null)
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Site Create/Edit Modal Component
interface SiteCreateEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  site?: Site
}

function SiteCreateEditModal({ isOpen, onClose, onSuccess, site }: SiteCreateEditModalProps) {
  const [formData, setFormData] = useState<CreateSiteData>({
    name: '',
    address: '',
    description: '',
    start_date: '',
    end_date: '',
    construction_manager_phone: '',
    safety_manager_phone: '',
    accommodation_name: '',
    accommodation_address: '',
    work_process: '',
    work_section: '',
    component_name: '',
    manager_name: '',
    safety_manager_name: '',
    status: 'active'
  })
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!site

  // Initialize form data when editing
  useEffect(() => {
    if (site) {
      // console.log('Initializing form with site data:', site)
      setFormData({
        name: site.name,
        address: site.address,
        description: site.description || '',
        start_date: site.start_date,
        end_date: site.end_date || '',
        construction_manager_phone: site.construction_manager_phone || '',
        safety_manager_phone: site.safety_manager_phone || '',
        accommodation_name: site.accommodation_name || '',
        accommodation_address: site.accommodation_address || '',
        accommodation_phone: site.accommodation_phone || '',
        work_process: site.work_process || '',
        work_section: site.work_section || '',
        component_name: site.component_name || '',
        manager_name: site.manager_name || '',
        safety_manager_name: site.safety_manager_name || '',
        status: site.status || 'active'
      })
    } else {
      // Reset form when creating new site
      setFormData({
        name: '',
        address: '',
        description: '',
        start_date: '',
        end_date: '',
        construction_manager_phone: '',
        safety_manager_phone: '',
        accommodation_name: '',
        accommodation_address: '',
        accommodation_phone: '',
        work_process: '',
        work_section: '',
        component_name: '',
        manager_name: '',
        safety_manager_name: '',
        status: 'active'
      })
    }
  }, [site])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      let result
      if (isEditing) {
        // Ensure we're passing all the current form data for update
        const updateData: UpdateSiteData = {
          id: site.id,
          name: formData.name,
          address: formData.address,
          description: formData.description,
          start_date: formData.start_date,
          end_date: formData.end_date,
          construction_manager_phone: formData.construction_manager_phone,
          safety_manager_phone: formData.safety_manager_phone,
          accommodation_name: formData.accommodation_name,
          accommodation_address: formData.accommodation_address,
          accommodation_phone: formData.accommodation_phone,
          work_process: formData.work_process,
          work_section: formData.work_section,
          component_name: formData.component_name,
          manager_name: formData.manager_name,
          safety_manager_name: formData.safety_manager_name,
          status: formData.status
        }
        result = await updateSite(updateData)
        
        if (result.success) {
          // console.log('Site updated successfully:', result.data)
        }
      } else {
        result = await createSite(formData)
      }

      if (result.success) {
        alert(result.message)
        onSuccess() // This will trigger loadSites() in parent
      } else {
        if (result.error) {
          alert(result.error)
        }
      }
    } catch (error) {
      console.error('Error saving site:', error)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            {isEditing ? '현장 편집' : '새 현장 추가'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Basic Information */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  기본 정보
                </h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  현장명 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  상태
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as SiteStatus }))}
                  className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                  <option value="completed">완료</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  주소 *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  시작일 *
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  종료일
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Manager Information */}
              <div className="md:col-span-2 mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  담당자 정보
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  건축 담당자명
                </label>
                <input
                  type="text"
                  value={formData.manager_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, manager_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  건축 담당자 전화번호
                </label>
                <input
                  type="tel"
                  value={formData.construction_manager_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, construction_manager_phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  안전 담당자명
                </label>
                <input
                  type="text"
                  value={formData.safety_manager_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, safety_manager_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  안전 담당자 전화번호
                </label>
                <input
                  type="tel"
                  value={formData.safety_manager_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, safety_manager_phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Accommodation Information */}
              <div className="md:col-span-2 mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  숙소 정보 (선택사항)
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  숙소명
                </label>
                <input
                  type="text"
                  value={formData.accommodation_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, accommodation_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="숙소 이름"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  숙소 전화번호
                </label>
                <input
                  type="tel"
                  value={formData.accommodation_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, accommodation_phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="숙소 전화번호"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  숙소 주소
                </label>
                <input
                  type="text"
                  value={formData.accommodation_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, accommodation_address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="숙소 주소"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Form actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '저장 중...' : isEditing ? '수정' : '생성'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}