'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import AdminDataTable from './AdminDataTable'
import BulkActionBar, { commonBulkActions } from './BulkActionBar'
import { 
  getMarkupDocuments,
  deleteMarkupDocuments,
  updateMarkupDocumentProperties,
  manageMarkupDocumentPermissions,
  getMarkupDocumentStats,
  getAvailableUsersForPermissions,
  MarkupDocumentWithStats
} from '@/app/actions/admin/markup'
import { Search, FileImage, Users, Eye, Share2, Lock, Unlock, UserPlus, UserMinus, Palette, Edit, Download, Trash2 } from 'lucide-react'

interface MarkupManagementProps {
  profile: Profile
}

export default function MarkupManagement({ profile }: MarkupManagementProps) {
  const [documents, setDocuments] = useState<MarkupDocumentWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10

  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState<'personal' | 'shared' | ''>('')
  const [creatorFilter, setCreatorFilter] = useState('')
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  // Statistics
  const [stats, setStats] = useState({
    total_documents: 0,
    personal_documents: 0,
    shared_documents: 0,
    total_permissions: 0,
    active_users: 0,
    storage_used: 0
  })
  
  // Available users for permissions
  const [availableUsers, setAvailableUsers] = useState<Array<{ 
    id: string; 
    full_name: string; 
    email: string;
    role: string;
  }>>([])

  // Modal state
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [permissionAction, setPermissionAction] = useState<'grant' | 'revoke'>('grant')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [permissionType, setPermissionType] = useState<'view' | 'edit' | 'admin'>('view')

  // Load documents data
  const loadDocuments = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getMarkupDocuments(
        currentPage,
        pageSize,
        searchTerm,
        locationFilter || undefined,
        undefined, // site_id
        creatorFilter || undefined
      )
      
      if (result.success && result.data) {
        setDocuments(result.data.documents)
        setTotalCount(result.data.total)
        setTotalPages(result.data.pages)
      } else {
        setError(result.error || '마킹 문서 데이터를 불러오는데 실패했습니다.')
      }
    } catch (err) {
      setError('마킹 문서 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // Load statistics
  const loadStats = async () => {
    try {
      const result = await getMarkupDocumentStats()
      if (result.success && result.data) {
        setStats(result.data)
      }
    } catch (err) {
      console.error('Failed to load markup document stats:', err)
    }
  }

  // Load available users
  const loadAvailableUsers = async () => {
    try {
      const result = await getAvailableUsersForPermissions()
      if (result.success && result.data) {
        setAvailableUsers(result.data)
      }
    } catch (err) {
      console.error('Failed to load available users:', err)
    }
  }

  // Load data on mount and when filters change
  useEffect(() => {
    loadDocuments()
  }, [currentPage, searchTerm, locationFilter, creatorFilter])

  useEffect(() => {
    loadStats()
    loadAvailableUsers()
  }, [])

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  // Handle filters
  const handleLocationFilter = (location: 'personal' | 'shared' | '') => {
    setLocationFilter(location)
    setCurrentPage(1)
  }

  const handleCreatorFilter = (creatorId: string) => {
    setCreatorFilter(creatorId)
    setCurrentPage(1)
  }

  // Handle bulk delete
  const handleBulkDelete = async (documentIds: string[]) => {
    if (!confirm(`${documentIds.length}개 마킹 문서를 삭제하시겠습니까?`)) {
      return
    }

    try {
      const result = await deleteMarkupDocuments(documentIds)
      if (result.success) {
        await Promise.all([loadDocuments(), loadStats()])
        setSelectedIds([])
        alert(result.message)
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  // Handle location change
  const handleLocationChange = (location: 'personal' | 'shared') => async (documentIds: string[]) => {
    try {
      const result = await updateMarkupDocumentProperties(documentIds, { location })
      if (result.success) {
        await loadDocuments()
        setSelectedIds([])
        alert(result.message)
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('위치 변경 중 오류가 발생했습니다.')
    }
  }

  // Handle permission management
  const handlePermissionManagement = (action: 'grant' | 'revoke') => (documentIds: string[]) => {
    setSelectedIds(documentIds)
    setPermissionAction(action)
    setShowPermissionModal(true)
  }

  // Submit permission changes
  const handlePermissionSubmit = async () => {
    if (permissionAction === 'grant' && !selectedUserId) {
      alert('사용자를 선택하세요.')
      return
    }

    if (permissionAction === 'grant' && !permissionType) {
      alert('권한 타입을 선택하세요.')
      return
    }

    try {
      const result = await manageMarkupDocumentPermissions(
        selectedIds,
        permissionAction,
        selectedUserId || undefined,
        permissionType
      )
      
      if (result.success) {
        await loadDocuments()
        setShowPermissionModal(false)
        setSelectedIds([])
        setSelectedUserId('')
        setPermissionType('view')
        alert(result.message)
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('권한 처리 중 오류가 발생했습니다.')
    }
  }

  // Handle view document (preview)
  const handleViewDocument = (document: MarkupDocumentWithStats) => {
    window.open(`/dashboard/markup?document=${document.id}`, '_blank')
  }

  // Handle edit document
  const handleEditDocument = (document: MarkupDocumentWithStats) => {
    window.open(`/dashboard/markup?document=${document.id}&mode=edit`, '_blank')
  }

  // Handle download document
  const handleDownloadDocument = (document: MarkupDocumentWithStats) => {
    if (document.original_blueprint_url) {
      const link = window.document.createElement('a')
      link.href = document.original_blueprint_url
      link.download = document.original_blueprint_filename || 'document'
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
    } else {
      alert('다운로드할 파일을 찾을 수 없습니다.')
    }
  }

  // Handle delete document
  const handleDeleteDocument = async (document: MarkupDocumentWithStats) => {
    if (!confirm(`"${document.title}" 문서를 삭제하시겠습니까?`)) {
      return
    }

    try {
      const result = await deleteMarkupDocuments([document.id])
      if (result.success) {
        await Promise.all([loadDocuments(), loadStats()])
        alert('문서가 삭제되었습니다.')
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  // Define table columns
  const columns = [
    {
      key: 'title',
      label: '문서 정보',
      sortable: true,
      filterable: true,
      render: (value: string, document: MarkupDocumentWithStats) => (
        <div className="flex items-start space-x-3">
          <div className="relative">
            <FileImage className="h-8 w-8 text-purple-500 flex-shrink-0" />
            <Palette className="h-3 w-3 text-orange-500 absolute -bottom-1 -right-1" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {document.original_blueprint_filename}
            </div>
            {document.description && (
              <div className="text-sm text-gray-600 dark:text-gray-300 truncate mt-1">
                {document.description}
              </div>
            )}
            <div className="text-xs text-gray-400 mt-1 flex items-center space-x-4">
              <span>마킹: {document.markup_count}개</span>
              <span>크기: {document.file_size ? Math.round(document.file_size / (1024 * 1024) * 100) / 100 + 'MB' : 'N/A'}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'location',
      label: '위치',
      render: (value: 'personal' | 'shared') => {
        const locationConfig = {
          personal: { text: '개인', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300', icon: Lock },
          shared: { text: '공유', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300', icon: Share2 }
        }
        
        const config = locationConfig[value]
        const Icon = config.icon
        
        return (
          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
            <Icon className="h-3 w-3 mr-1" />
            {config.text}
          </span>
        )
      }
    },
    {
      key: 'shared_count',
      label: '공유 수',
      render: (value: number) => (
        <div className="flex items-center">
          <Users className="h-4 w-4 text-gray-400 mr-1" />
          <span className="text-sm font-medium">{value || 0}</span>
        </div>
      )
    },
    {
      key: 'creator',
      label: '작성자',
      render: (creator: { full_name: string; email: string } | undefined) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {creator?.full_name || 'N/A'}
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            {creator?.email || ''}
          </div>
        </div>
      )
    },
    {
      key: 'site',
      label: '현장',
      render: (site: { name: string } | undefined) => (
        <span className="text-sm text-gray-900 dark:text-gray-100">
          {site?.name || '전체'}
        </span>
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
      id: 'make-personal',
      label: '개인으로 변경',
      icon: Lock,
      variant: 'secondary' as const,
      onClick: handleLocationChange('personal')
    },
    {
      id: 'make-shared',
      label: '공유로 변경',
      icon: Share2,
      variant: 'secondary' as const,
      onClick: handleLocationChange('shared')
    },
    {
      id: 'grant-permission',
      label: '권한 부여',
      icon: UserPlus,
      variant: 'default' as const,
      onClick: handlePermissionManagement('grant')
    },
    {
      id: 'revoke-permission',
      label: '권한 취소',
      icon: UserMinus,
      variant: 'destructive' as const,
      onClick: handlePermissionManagement('revoke')
    }
  ]

  // Custom actions for individual documents
  const customActions = [
    {
      icon: Eye,
      label: '미리보기',
      onClick: handleViewDocument
    },
    {
      icon: Edit,
      label: '수정',
      onClick: handleEditDocument
    },
    {
      icon: Download,
      label: '다운로드',
      onClick: handleDownloadDocument
    },
    {
      icon: Trash2,
      label: '삭제',
      onClick: handleDeleteDocument,
      variant: 'destructive' as const
    }
  ]

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileImage className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">전체 문서</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats.total_documents}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">개인 문서</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats.personal_documents}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Share2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">공유 문서</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats.shared_documents}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-3">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">권한 수</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats.total_permissions}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserPlus className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-3">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">활성 사용자</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats.active_users}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileImage className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-3">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">저장소 사용</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats.storage_used}MB</div>
            </div>
          </div>
        </div>
      </div>

      {/* Header with search and filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="문서 제목, 설명, 파일명으로 검색..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <select
            value={locationFilter}
            onChange={(e) => handleLocationFilter(e.target.value as 'personal' | 'shared' | '')}
            className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">모든 위치</option>
            <option value="personal">개인</option>
            <option value="shared">공유</option>
          </select>
          
          <select
            value={creatorFilter}
            onChange={(e) => handleCreatorFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">모든 작성자</option>
            {availableUsers.map((user) => (
              <option key={user.id} value={user.id}>{user.full_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents table */}
      <AdminDataTable
        data={documents}
        columns={columns}
        loading={loading}
        error={error}
        selectable={true}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        getRowId={(document: MarkupDocumentWithStats) => document.id}
        customActions={customActions}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        totalCount={totalCount}
        emptyMessage="마킹 문서가 없습니다"
        emptyDescription="마킹 문서가 생성되면 여기에 표시됩니다."
      />

      {/* Bulk action bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        totalCount={totalCount}
        actions={bulkActions}
        onClearSelection={() => setSelectedIds([])}
      />

      {/* Permission Management Modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                권한 {permissionAction === 'grant' ? '부여' : '취소'}
              </h2>

              <div className="space-y-4">
                {permissionAction === 'grant' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        사용자 선택 *
                      </label>
                      <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      >
                        <option value="">사용자를 선택하세요</option>
                        {availableUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.full_name} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        권한 타입 *
                      </label>
                      <select
                        value={permissionType}
                        onChange={(e) => setPermissionType(e.target.value as 'view' | 'edit' | 'admin')}
                        className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="view">보기</option>
                        <option value="edit">편집</option>
                        <option value="admin">관리</option>
                      </select>
                    </div>
                  </>
                )}

                {permissionAction === 'revoke' && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      선택된 {selectedIds.length}개 문서의 모든 권한이 취소됩니다.
                    </p>
                  </div>
                )}

                {/* Form actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPermissionModal(false)
                      setSelectedUserId('')
                      setPermissionType('view')
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handlePermissionSubmit}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                      permissionAction === 'grant'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {permissionAction === 'grant' ? '부여' : '취소'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}