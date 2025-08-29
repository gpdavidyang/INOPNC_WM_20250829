'use client'

import { useState, useEffect } from 'react'
import { Profile, DocumentType, ApprovalStatus } from '@/types'
import AdminDataTable from './AdminDataTable'
import BulkActionBar, { commonBulkActions } from './BulkActionBar'
import { 
  getDocuments, 
  processDocumentApprovals,
  deleteDocuments,
  updateDocumentProperties,
  getDocumentApprovalStats,
  getAvailableSitesForDocuments,
  DocumentWithApproval
} from '@/app/actions/admin/documents'
import { Search, Filter, FileText, Download, Eye, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface DocumentManagementProps {
  profile: Profile
}

export default function DocumentManagement({ profile }: DocumentManagementProps) {
  const [documents, setDocuments] = useState<DocumentWithApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10

  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<DocumentType | ''>('')
  const [approvalFilter, setApprovalFilter] = useState<ApprovalStatus | ''>('')
  const [siteFilter, setSiteFilter] = useState('')
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  // Statistics
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total_documents: 0
  })
  
  // Available sites
  const [availableSites, setAvailableSites] = useState<Array<{ id: string; name: string }>>([])

  // Load documents data
  const loadDocuments = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getDocuments(
        currentPage,
        pageSize,
        searchTerm,
        typeFilter || undefined,
        approvalFilter || undefined,
        siteFilter || undefined
      )
      
      if (result.success && result.data) {
        setDocuments(result.data.documents)
        setTotalCount(result.data.total)
        setTotalPages(result.data.pages)
      } else {
        setError(result.error || '문서 데이터를 불러오는데 실패했습니다.')
      }
    } catch (err) {
      setError('문서 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // Load statistics
  const loadStats = async () => {
    try {
      const result = await getDocumentApprovalStats()
      if (result.success && result.data) {
        setStats(result.data)
      }
    } catch (err) {
      console.error('Failed to load document stats:', err)
    }
  }

  // Load available sites
  const loadAvailableSites = async () => {
    try {
      const result = await getAvailableSitesForDocuments()
      if (result.success && result.data) {
        setAvailableSites(result.data)
      }
    } catch (err) {
      console.error('Failed to load available sites:', err)
    }
  }

  // Load data on mount and when filters change
  useEffect(() => {
    loadDocuments()
  }, [currentPage, searchTerm, typeFilter, approvalFilter, siteFilter])

  useEffect(() => {
    loadStats()
    loadAvailableSites()
  }, [])

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  // Handle filters
  const handleTypeFilter = (type: DocumentType | '') => {
    setTypeFilter(type)
    setCurrentPage(1)
  }

  const handleApprovalFilter = (status: ApprovalStatus | '') => {
    setApprovalFilter(status)
    setCurrentPage(1)
  }

  const handleSiteFilter = (siteId: string) => {
    setSiteFilter(siteId)
    setCurrentPage(1)
  }

  // Handle bulk approval
  const handleBulkApproval = (action: 'approve' | 'reject') => async (documentIds: string[]) => {
    const comments = prompt(`${action === 'approve' ? '승인' : '거부'} 사유를 입력하세요 (선택사항):`)
    
    try {
      const result = await processDocumentApprovals(documentIds, action, comments || undefined)
      if (result.success) {
        await Promise.all([loadDocuments(), loadStats()])
        setSelectedIds([])
        alert(result.message)
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert(`${action === 'approve' ? '승인' : '거부'} 처리 중 오류가 발생했습니다.`)
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async (documentIds: string[]) => {
    if (!confirm(`${documentIds.length}개 문서를 삭제하시겠습니까?`)) {
      return
    }

    try {
      const result = await deleteDocuments(documentIds)
      if (result.success) {
        await loadDocuments()
        setSelectedIds([])
        alert(result.message)
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  // Handle view document
  const handleViewDocument = (document: DocumentWithApproval) => {
    if (document.file_url) {
      window.open(document.file_url, '_blank')
    } else {
      alert('문서 파일을 찾을 수 없습니다.')
    }
  }

  // Define table columns
  const columns = [
    {
      key: 'title',
      label: '문서 정보',
      sortable: true,
      filterable: true,
      render: (value: string, document: DocumentWithApproval) => (
        <div className="flex items-start space-x-3">
          <FileText className="h-8 w-8 text-blue-500 mt-1 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {document.file_name}
            </div>
            {document.description && (
              <div className="text-sm text-gray-600 dark:text-gray-300 truncate mt-1">
                {document.description}
              </div>
            )}
            <div className="text-xs text-gray-400 mt-1">
              크기: {document.file_size ? Math.round(document.file_size / 1024) + 'KB' : 'N/A'}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'document_type',
      label: '타입',
      render: (value: DocumentType) => {
        const typeConfig = {
          personal: { text: '개인', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' },
          shared: { text: '공유', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
          blueprint: { text: '도면', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' },
          report: { text: '보고서', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' },
          certificate: { text: '인증서', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' },
          other: { text: '기타', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' }
        }
        
        const config = typeConfig[value] || typeConfig.other
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
            {config.text}
          </span>
        )
      }
    },
    {
      key: 'approval_status',
      label: '승인 상태',
      render: (value: ApprovalStatus | undefined, document: DocumentWithApproval) => {
        if (!value) {
          return <span className="text-gray-400">-</span>
        }

        const statusConfig = {
          pending: { text: '대기중', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300', icon: Clock },
          approved: { text: '승인됨', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300', icon: CheckCircle },
          rejected: { text: '거부됨', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300', icon: XCircle },
          cancelled: { text: '취소됨', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300', icon: AlertCircle }
        }
        
        const config = statusConfig[value] || statusConfig.pending
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
      key: 'owner',
      label: '소유자',
      render: (owner: { full_name: string; email: string } | undefined) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {owner?.full_name || 'N/A'}
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            {owner?.email || ''}
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
      id: 'approve',
      label: '승인',
      icon: CheckCircle,
      variant: 'default' as const,
      onClick: handleBulkApproval('approve')
    },
    {
      id: 'reject',
      label: '거부',
      icon: XCircle,
      variant: 'destructive' as const,
      onClick: handleBulkApproval('reject')
    }
  ]

  // Custom actions for individual documents
  const customActions = [
    {
      icon: Download,
      label: '다운로드',
      onClick: (document: DocumentWithApproval) => {
        if (document.file_url) {
          const link = window.document.createElement('a')
          link.href = document.file_url
          link.download = document.file_name
          link.click()
        }
      }
    }
  ]

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">전체 문서</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats.total_documents}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">승인 대기</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats.pending}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">승인됨</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats.approved}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">거부됨</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats.rejected}</div>
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
            value={typeFilter}
            onChange={(e) => handleTypeFilter(e.target.value as DocumentType | '')}
            className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">모든 타입</option>
            <option value="personal">개인</option>
            <option value="shared">공유</option>
            <option value="blueprint">도면</option>
            <option value="report">보고서</option>
            <option value="certificate">인증서</option>
            <option value="other">기타</option>
          </select>
          
          <select
            value={approvalFilter}
            onChange={(e) => handleApprovalFilter(e.target.value as ApprovalStatus | '')}
            className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">모든 승인 상태</option>
            <option value="pending">승인 대기</option>
            <option value="approved">승인됨</option>
            <option value="rejected">거부됨</option>
          </select>
          
          <select
            value={siteFilter}
            onChange={(e) => handleSiteFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">모든 현장</option>
            {availableSites.map((site) => (
              <option key={site.id} value={site.id}>{site.name}</option>
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
        getRowId={(document: DocumentWithApproval) => document.id}
        onView={handleViewDocument}
        customActions={customActions}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        totalCount={totalCount}
        emptyMessage="문서가 없습니다"
        emptyDescription="승인 요청된 문서가 나타날 예정입니다."
      />

      {/* Bulk action bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        totalCount={totalCount}
        actions={bulkActions}
        onClearSelection={() => setSelectedIds([])}
      />
    </div>
  )
}