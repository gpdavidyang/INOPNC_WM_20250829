'use client'

import { t } from '@/lib/ui/strings'
import { useConfirm } from '@/components/ui/use-confirm'
import { useToast } from '@/components/ui/use-toast'

import type { Profile } from '@/types'

interface MarkupToolManagementProps {
  profile: Profile
}

interface MarkupDocument {
  id: string
  title: string
  description?: string
  original_blueprint_url: string
  original_blueprint_filename: string
  markup_data: unknown[]
  location: 'personal' | 'shared'
  created_by: string
  created_by_name?: string
  creator_email?: string
  site_id?: string
  site_name?: string
  markup_count: number
  preview_image_url?: string
  created_at: string
  updated_at: string
  is_deleted: boolean
}

export default function MarkupToolManagement({ profile }: MarkupToolManagementProps) {
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<MarkupDocument[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<MarkupDocument[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLocation, setFilterLocation] = useState<'all' | 'personal' | 'shared'>('all')
  const [filterUser, setFilterUser] = useState<string>('all')
  const [filterSite, setFilterSite] = useState<string>('all')
  const [users, setUsers] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const handler = setTimeout(() => {
      filterDocuments()
    }, 200) // Debounce filtering to prevent excessive computation

    return () => clearTimeout(handler)
  }, [documents, searchTerm, filterLocation, filterUser, filterSite])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load all documents (admin mode)
      const response = await fetch('/api/markup-documents?admin=true&limit=100')
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || data.data || [])
      }

      // Load users for filter
      const usersResponse = await fetch('/api/admin/users')
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.users || [])
      }

      // Load sites for filter
      const sitesResponse = await fetch('/api/sites')
      if (sitesResponse.ok) {
        const sitesData = await sitesResponse.json()
        setSites(sitesData || [])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterDocuments = () => {
    let filtered = [...documents]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        doc =>
          doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.original_blueprint_filename?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Location filter
    if (filterLocation !== 'all') {
      filtered = filtered.filter(doc => doc.location === filterLocation)
    }

    // User filter
    if (filterUser !== 'all') {
      filtered = filtered.filter(doc => doc.created_by === filterUser)
    }

    // Site filter
    if (filterSite !== 'all') {
      filtered = filtered.filter(doc => doc.site_id === filterSite)
    }

    setFilteredDocuments(filtered)
    setCurrentPage(1)
  }

  const handleDelete = async (documentId: string) => {
    const ok = await confirm({
      title: '문서 삭제',
      description: '이 문서를 삭제하시겠습니까?',
      variant: 'destructive',
      confirmText: '삭제',
      cancelText: '취소',
    })
    if (!ok) return

    try {
      const response = await fetch(`/api/markup-documents/${documentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadData()
        toast({ variant: 'success', title: '삭제 완료' })
      }
    } catch (error) {
      console.error('Delete failed:', error)
      toast({ variant: 'destructive', title: '오류', description: '삭제 중 오류가 발생했습니다.' })
    }
  }

  const handleView = (documentId: string) => {
    window.open(`/dashboard/admin/markup-editor?document=${documentId}`, '_blank')
  }

  const handleDownload = (document: MarkupDocument) => {
    // Download original blueprint
    if (document.original_blueprint_url) {
      window.open(document.original_blueprint_url, '_blank')
    }
  }

  // Pagination
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentDocuments = filteredDocuments.slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <Edit3 className="h-6 w-6 mr-2 text-purple-600" />
            도면마킹 도구 관리
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            전체 {documents.length}개의 도면 마킹 문서
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => window.open('/dashboard/markup?view=upload', '_blank')}
            className="flex items-center bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            도면 업로드 및 마킹 시작
          </Button>

          <Button onClick={() => loadData()} variant="outline" className="flex items-center">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.refresh')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Location Filter */}
          <div>
            <select
              value={filterLocation}
              onChange={e => setFilterLocation(e.target.value as unknown)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">전체 위치</option>
              <option value="personal">개인 문서함</option>
              <option value="shared">공유 문서함</option>
            </select>
          </div>

          {/* User Filter */}
          <div>
            <select
              value={filterUser}
              onChange={e => setFilterUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">전체 사용자</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </option>
              ))}
            </select>
          </div>

          {/* Site Filter */}
          <div>
            <select
              value={filterSite}
              onChange={e => setFilterSite(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">전체 현장</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{filteredDocuments.length}개 문서 검색됨</span>
          {filteredDocuments.length !== documents.length && (
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterLocation('all')
                setFilterUser('all')
                setFilterSite('all')
              }}
              className="text-purple-600 hover:text-purple-700"
            >
              {t('common.reset')}
            </button>
          )}
        </div>
      </div>

      {/* Document Grid */}
      {currentDocuments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentDocuments.map(document => {
            const creator = users.find(u => u.id === document.created_by)
            const site = sites.find(s => s.id === document.site_id)

            return (
              <div
                key={document.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-t-lg flex items-center justify-center relative">
                  {document.preview_image_url ? (
                    <img
                      src={document.preview_image_url}
                      alt={document.title}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  ) : (
                    <FileImage className="h-12 w-12 text-gray-400" />
                  )}

                  {/* Location Badge */}
                  <span
                    className={`absolute top-2 right-2 px-2 py-1 text-xs rounded ${
                      document.location === 'shared'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}
                  >
                    {document.location === 'shared' ? '공유' : '개인'}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1 truncate">
                    {document.title}
                  </h3>

                  <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      <span className="truncate">
                        {creator?.full_name || creator?.email || '알 수 없음'}
                      </span>
                    </div>

                    {site && (
                      <div className="flex items-center">
                        <FolderOpen className="h-3 w-3 mr-1" />
                        <span className="truncate">{site.name}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Palette className="h-3 w-3 mr-1" />
                        {document.markup_count || 0}개
                      </span>
                      <span className="text-xs">
                        {new Date(document.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {document.description && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 line-clamp-2">
                      {document.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 text-xs"
                      onClick={() => handleView(document.id)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      보기
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 text-xs"
                      onClick={() => handleDownload(document)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      다운로드
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(document.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
          <FileImage className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {documents.length === 0 ? '도면 마킹 문서가 없습니다' : '검색 결과가 없습니다'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {documents.length === 0
              ? '새 마킹 생성 버튼을 클릭하여 시작하세요.'
              : '다른 검색 조건을 시도해보세요.'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            {t('common.prev')}
          </Button>

          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <button
                  key={i}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 rounded ${
                    currentPage === pageNum
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  )
}
const { confirm } = useConfirm()
const { toast } = useToast()
