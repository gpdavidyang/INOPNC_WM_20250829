'use client'

import type { Profile } from '@/types'
import type { MarkupDocument } from '@/types/markup'

interface AdminMarkupEditorProps {
  profile: Profile
}

export default function AdminMarkupEditor({ profile }: AdminMarkupEditorProps) {
  const [selectedDocument, setSelectedDocument] = useState<MarkupDocument | null>(null)
  const [showUserFilter, setShowUserFilter] = useState(false)
  const [allDocuments, setAllDocuments] = useState<MarkupDocument[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<MarkupDocument[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const documentId = searchParams.get('document')

  useEffect(() => {
    loadUsers()
    loadAllDocuments()
  }, [])

  useEffect(() => {
    if (documentId) {
      loadSpecificDocument(documentId)
    }
  }, [documentId])

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  const loadAllDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/markup-documents?admin=true&limit=100')
      if (response.ok) {
        const data = await response.json()
        setAllDocuments(data.documents || [])
        setFilteredDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Failed to load documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSpecificDocument = async (id: string) => {
    try {
      const response = await fetch(`/api/markup-documents/${id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setSelectedDocument(data.data)
        }
      }
    } catch (error) {
      console.error('Failed to load document:', error)
    }
  }

  const handleUserFilter = (userId: string) => {
    setSelectedUser(userId)
    if (userId === '') {
      setFilteredDocuments(allDocuments)
    } else {
      setFilteredDocuments(allDocuments.filter(doc => doc.created_by === userId))
    }
  }

  const handleDocumentSelect = (document: MarkupDocument) => {
    setSelectedDocument(document)
    router.push(`/dashboard/admin/markup-editor?document=${document.id}`)
  }

  const handleClose = () => {
    router.push('/dashboard/admin/tools/markup')
  }

  const handleBackToList = () => {
    setSelectedDocument(null)
    router.push('/dashboard/admin/markup-editor')
  }

  // 문서 선택 화면
  if (!selectedDocument) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Button
                  onClick={handleClose}
                  variant="ghost"
                  size="sm"
                  className="mr-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  도구 관리로
                </Button>
                
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    관리자 도면마킹 도구
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    모든 사용자의 도면 마킹 문서를 보고 편집할 수 있습니다
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setShowUserFilter(!showUserFilter)}
                  variant="outline"
                  size="sm"
                >
                  <Users className="h-4 w-4 mr-2" />
                  사용자 필터
                </Button>

                <Button
                  onClick={() => router.push('/dashboard/admin/documents/markup')}
                  variant="outline"
                  size="sm"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  문서함 관리
                </Button>
              </div>
            </div>

            {/* User Filter */}
            {showUserFilter && (
              <div className="border-t border-gray-200 dark:border-gray-700 py-4">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    사용자별 필터:
                  </label>
                  <select
                    value={selectedUser}
                    onChange={(e) => handleUserFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">전체 사용자</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.full_name || user.email} ({user.role})
                      </option>
                    ))}
                  </select>
                  {selectedUser && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {filteredDocuments.length}개 문서
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Document List */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : filteredDocuments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDocuments.map(document => {
                const creator = users.find(u => u.id === document.created_by)
                
                return (
                  <div
                    key={document.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleDocumentSelect(document)}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-t-lg flex items-center justify-center">
                      {document.preview_image_url ? (
                        <img
                          src={document.preview_image_url}
                          alt={document.title}
                          className="w-full h-full object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="text-gray-400 dark:text-gray-500">
                          <Eye className="h-8 w-8" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1 truncate">
                        {document.title}
                      </h3>
                      
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {creator?.full_name || creator?.email || '알 수 없음'}
                      </p>

                      {document.description && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 line-clamp-2">
                          {document.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                        <span>마킹: {document.markup_count || 0}개</span>
                        <span>{new Date(document.created_at).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-1 text-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDocumentSelect(document)
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          편집
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <Eye className="h-12 w-12 mx-auto mb-4" />
                <p className="text-lg font-medium">
                  {selectedUser ? '해당 사용자의 문서가 없습니다' : '도면 마킹 문서가 없습니다'}
                </p>
                <p className="text-sm mt-1">
                  사용자가 도면 마킹을 생성하면 여기에 표시됩니다.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 마킹 에디터 화면
  return (
    <div className="h-screen flex flex-col">
      {/* Admin Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button
              onClick={handleBackToList}
              variant="ghost"
              size="sm"
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로
            </Button>
            
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {selectedDocument.title}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                관리자 모드 - 모든 권한 활성화
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
              관리자 편집 모드
            </span>
          </div>
        </div>
      </div>

      {/* Markup Editor */}
      <div className="flex-1 overflow-hidden">
        <MarkupEditor
          initialFile={selectedDocument}
          blueprintUrl={selectedDocument.original_blueprint_url}
          profile={profile}
          onClose={handleBackToList}
          onSave={(document) => {
            console.log('Document saved:', document)
            // Refresh document list
            loadAllDocuments()
          }}
        />
      </div>
    </div>
  )
}