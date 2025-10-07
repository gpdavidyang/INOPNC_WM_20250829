'use client'

interface DocumentType {
  id: string
  code: string
  name_ko: string
  name_en?: string
  description?: string
  file_types: string[]
  max_file_size: number
  sort_order: number
  due_days?: number
  notes?: string
}

interface RoleBasedDocumentSelectorProps {
  userRole?: string
  siteId?: string
  onSelectionChange: (selectedDocuments: DocumentType[]) => void
  selectedIds?: string[]
}

const ROLE_NAMES = {
  worker: '작업자',
  site_manager: '현장관리자',
  admin: '관리자',
  partner: '시공업체',
}

export default function RoleBasedDocumentSelector({
  userRole,
  siteId,
  onSelectionChange,
  selectedIds = [],
}: RoleBasedDocumentSelectorProps) {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchDocumentTypes()
  }, [userRole, siteId])

  const fetchDocumentTypes = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (userRole) params.append('role_type', userRole)
      if (siteId) params.append('site_id', siteId)

      const response = await fetch(`/api/required-document-types?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch document types')
      }

      const data = await response.json()
      setDocumentTypes(data.required_documents || [])
    } catch (error) {
      console.error('Error fetching document types:', error)
      setError('서류 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectionChange = (documentType: DocumentType, selected: boolean) => {
    let newSelection: DocumentType[]

    if (selected) {
      newSelection = [...documentTypes.filter(dt => selectedIds.includes(dt.id)), documentType]
    } else {
      newSelection = documentTypes.filter(
        dt => selectedIds.includes(dt.id) && dt.id !== documentType.id
      )
    }

    onSelectionChange(newSelection)
  }

  const formatFileSize = (bytes: number) => {
    return `${(bytes / 1048576).toFixed(1)}MB`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">서류 목록 로딩중...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">필수 제출 서류</h3>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          {userRole && (
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>{ROLE_NAMES[userRole as keyof typeof ROLE_NAMES] || userRole}</span>
            </div>
          )}
          {siteId && (
            <div className="flex items-center space-x-1">
              <Building2 className="h-4 w-4" />
              <span>현장별 맞춤</span>
            </div>
          )}
        </div>
      </div>

      {/* Document List */}
      {documentTypes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>해당 역할에 필요한 필수 서류가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documentTypes.map(docType => {
            const isSelected = selectedIds.includes(docType.id)

            return (
              <div
                key={docType.id}
                className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleSelectionChange(docType, !isSelected)}
              >
                {/* Selection Indicator */}
                <div
                  className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                </div>

                {/* Document Info */}
                <div className="pr-8">
                  <h4 className="font-medium text-gray-900 mb-1">{docType.name_ko}</h4>

                  {docType.name_en && (
                    <p className="text-sm text-gray-600 mb-2">{docType.name_en}</p>
                  )}

                  {docType.description && (
                    <p className="text-sm text-gray-700 mb-3">{docType.description}</p>
                  )}

                  {/* File Constraints */}
                  <div className="space-y-1">
                    <div className="flex items-center text-xs text-gray-500">
                      <span className="font-medium mr-2">파일 형식:</span>
                      <span>{docType.file_types.join(', ').toUpperCase()}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <span className="font-medium mr-2">최대 크기:</span>
                      <span>{formatFileSize(docType.max_file_size)}</span>
                    </div>
                    {docType.due_days && (
                      <div className="flex items-center text-xs text-orange-600">
                        <span className="font-medium mr-2">제출 기한:</span>
                        <span>{docType.due_days}일 이내</span>
                      </div>
                    )}
                  </div>

                  {/* Additional Notes */}
                  {docType.notes && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                      <strong>안내:</strong> {docType.notes}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Selection Summary */}
      {selectedIds.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              선택된 서류: {selectedIds.length}개
            </span>
            <button
              onClick={() => onSelectionChange([])}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              전체 해제
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {documentTypes
              .filter(dt => selectedIds.includes(dt.id))
              .map(dt => (
                <span
                  key={dt.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {dt.name_ko}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
