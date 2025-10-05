'use client'

import { useToast } from '@/components/ui/use-toast'
import { useConfirm } from '@/components/ui/use-confirm'
import { t } from '@/lib/ui/strings'

interface UnifiedSharedDocument {
  id: string
  title: string
  description?: string
  file_url: string
  file_name: string
  file_type: string
  file_size: number
  mime_type?: string
  site_id?: string
  uploaded_by: string
  organization_id?: string
  category?: string
  tags?: string[]
  version: number
  is_deleted: boolean
  created_at: string
  updated_at: string
  site_name?: string
  uploaded_by_name?: string
  uploaded_by_email?: string
  view_count: number
  download_count: number
  permission_count: number
}

interface DocumentFilters {
  site_id?: string
  uploaded_by?: string
  organization_id?: string
  category?: string
  file_type?: string
  date_from?: string
  date_to?: string
}

interface DocumentSortOptions {
  field: 'created_at' | 'title' | 'file_size' | 'view_count' | 'download_count'
  direction: 'asc' | 'desc'
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}

export default function UnifiedSharedDocumentsList() {
  const [documents, setDocuments] = useState<UnifiedSharedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<DocumentFilters>({})
  const [sortOptions, setSortOptions] = useState<DocumentSortOptions>({
    field: 'created_at',
    direction: 'desc',
  })
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Transform DocumentWithApproval to UnifiedSharedDocument
  const transformDocument = (doc: DocumentWithApproval): UnifiedSharedDocument => {
    return {
      id: doc.id,
      title: doc.title || doc.file_name,
      description: doc.description,
      file_url: doc.file_url,
      file_name: doc.file_name,
      file_type: doc.file_name?.split('.').pop() || 'unknown',
      file_size: doc.file_size || 0,
      mime_type: doc.mime_type,
      site_id: doc.site_id,
      uploaded_by: doc.owner_id,
      organization_id: doc.organization_id,
      category: doc.document_category || 'shared',
      tags: doc.tags,
      version: doc.version || 1,
      is_deleted: false,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      site_name: doc.site?.name,
      uploaded_by_name: doc.owner?.full_name,
      uploaded_by_email: doc.owner?.email,
      view_count: doc.view_count || 0,
      download_count: doc.download_count || 0,
      permission_count: 0,
    }
  }

  // Load shared documents
  const loadDocuments = async () => {
    setLoading(true)
    try {
      const result = await getSharedDocuments()

      if (!result.success) {
        console.error('Failed to load shared documents:', result.error)
        setDocuments([])
        return
      }

      let mappedDocuments = result.data.map(transformDocument)

      // Apply search filter
      if (searchTerm) {
        mappedDocuments = mappedDocuments.filter(
          doc =>
            doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      // Apply filters
      if (filters.site_id) {
        mappedDocuments = mappedDocuments.filter(doc => doc.site_id === filters.site_id)
      }
      if (filters.uploaded_by) {
        mappedDocuments = mappedDocuments.filter(doc => doc.uploaded_by === filters.uploaded_by)
      }
      if (filters.organization_id) {
        mappedDocuments = mappedDocuments.filter(
          doc => doc.organization_id === filters.organization_id
        )
      }
      if (filters.category) {
        mappedDocuments = mappedDocuments.filter(doc => doc.category === filters.category)
      }
      if (filters.file_type) {
        mappedDocuments = mappedDocuments.filter(doc => doc.file_type === filters.file_type)
      }
      if (filters.date_from) {
        mappedDocuments = mappedDocuments.filter(
          doc => new Date(doc.created_at) >= new Date(filters.date_from!)
        )
      }
      if (filters.date_to) {
        mappedDocuments = mappedDocuments.filter(
          doc => new Date(doc.created_at) <= new Date(filters.date_to!)
        )
      }

      // Apply sorting
      mappedDocuments.sort((a, b) => {
        const aValue = a[sortOptions.field]
        const bValue = b[sortOptions.field]
        const direction = sortOptions.direction === 'asc' ? 1 : -1

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return aValue.localeCompare(bValue) * direction
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return (aValue - bValue) * direction
        }
        return 0
      })

      setDocuments(mappedDocuments)
    } catch (error) {
      console.error('Failed to load documents:', error)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [filters, sortOptions, searchTerm])

  // Handle document download
  const handleDownloadDocument = async (doc: UnifiedSharedDocument) => {
    try {
      const link = document.createElement('a')
      link.href = doc.file_url
      link.download = doc.file_name
      link.click()
    } catch (error) {
      console.error('Failed to download document:', error)
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedDocuments.size === 0) {
      toast({ variant: 'warning', title: '선택 필요', description: '삭제할 문서를 선택해주세요.' })
      return
    }

    const ok = await confirm({
      title: '일괄 삭제',
      description: `선택한 ${selectedDocuments.size}개의 문서를 삭제하시겠습니까?`,
      variant: 'destructive',
      confirmText: '삭제',
      cancelText: '취소',
    })
    if (!ok) return

    try {
      // Implement bulk delete logic here
      console.log('Deleting documents:', Array.from(selectedDocuments))
      setSelectedDocuments(new Set())
      await loadDocuments()
    } catch (error) {
      console.error('Failed to delete documents:', error)
      toast({ variant: 'destructive', title: '오류', description: '문서 삭제에 실패했습니다.' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">공유문서함</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            현장별 문서를 관리하고 권한을 설정합니다
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedDocuments.size > 0 && (
            <>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedDocuments.size}개 선택됨
              </span>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors"
              >
                일괄 삭제
              </button>
              <button
                onClick={() => setSelectedDocuments(new Set())}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                선택 해제
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-4 py-2 border rounded-md transition-colors ${
              showFilters
                ? 'bg-blue-50 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            필터
            {Object.keys(filters).length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                {Object.keys(filters).length}
              </span>
            )}
          </button>

          {/* Sort */}
          <select
            value={`${sortOptions.field}-${sortOptions.direction}`}
            onChange={e => {
              const [field, direction] = e.target.value.split('-')
              setSortOptions({
                field: field as DocumentSortOptions['field'],
                direction: direction as DocumentSortOptions['direction'],
              })
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="created_at-desc">최신순</option>
            <option value="created_at-asc">오래된순</option>
            <option value="title-asc">이름순 (가-하)</option>
            <option value="title-desc">이름순 (하-가)</option>
            <option value="file_size-desc">크기 큰순</option>
            <option value="file_size-asc">크기 작은순</option>
            <option value="view_count-desc">조회수 많은순</option>
            <option value="download_count-desc">다운로드 많은순</option>
          </select>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  파일 유형
                </label>
                <select
                  value={filters.file_type || ''}
                  onChange={e => setFilters({ ...filters, file_type: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">모든 파일 유형</option>
                  <option value="pdf">PDF</option>
                  <option value="jpg">JPG</option>
                  <option value="png">PNG</option>
                  <option value="doc">DOC</option>
                  <option value="xlsx">Excel</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  시작 날짜
                </label>
                <input
                  type="date"
                  value={filters.date_from || ''}
                  onChange={e => setFilters({ ...filters, date_from: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  종료 날짜
                </label>
                <input
                  type="date"
                  value={filters.date_to || ''}
                  onChange={e => setFilters({ ...filters, date_to: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setFilters({})}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                필터 초기화
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
          <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            {searchTerm || Object.keys(filters).length > 0
              ? '검색 결과가 없습니다'
              : '공유된 문서가 없습니다'}
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {searchTerm || Object.keys(filters).length > 0
              ? '다른 검색 조건을 시도해보세요'
              : '문서를 업로드하여 팀과 공유하세요'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {documents.map(document => (
            <div
              key={document.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-blue-500 mr-3" />
                    <input
                      type="checkbox"
                      checked={selectedDocuments.has(document.id)}
                      onChange={e => {
                        const newSelection = new Set(selectedDocuments)
                        if (e.target.checked) {
                          newSelection.add(document.id)
                        } else {
                          newSelection.delete(document.id)
                        }
                        setSelectedDocuments(newSelection)
                      }}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {document.title}
                </h3>

                {document.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {document.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">파일명</span>
                    <span className="text-gray-900 dark:text-white font-medium truncate ml-2">
                      {document.file_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">크기</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {formatFileSize(document.file_size)}
                    </span>
                  </div>
                  {document.site_name && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">현장</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {document.site_name}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">업로드</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {format(new Date(document.created_at), 'yyyy-MM-dd', { locale: ko })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {document.view_count}
                    </div>
                    <div className="flex items-center">
                      <Download className="h-4 w-4 mr-1" />
                      {document.download_count}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDownloadDocument(document)}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="다운로드"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                      title="공유"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      title="미리보기"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Statistics */}
      {!loading && documents.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{documents.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">전체 문서</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {formatFileSize(documents.reduce((sum, doc) => sum + doc.file_size, 0))}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">총 용량</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {documents.reduce((sum, doc) => sum + doc.view_count, 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">총 조회수</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {documents.reduce((sum, doc) => sum + doc.download_count, 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">총 다운로드</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
const { toast } = useToast()
const { confirm } = useConfirm()
