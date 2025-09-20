'use client'


interface DocumentListProps {
  documents: DocumentWithPermissions[]
  selectedDocuments: string[]
  onDocumentSelect: (documentId: string, selected: boolean) => void
  onManagePermissions: (document: DocumentWithPermissions) => void
  loading: boolean
  profile: Profile
}

export default function DocumentList({
  documents,
  selectedDocuments,
  onDocumentSelect,
  onManagePermissions,
  loading,
  profile
}: DocumentListProps) {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDocumentTypeLabel = (type?: string) => {
    const typeLabels: Record<string, string> = {
      personal: '개인문서',
      shared: '공유문서',
      blueprint: '도면마킹',
      required: '필수서류',
      progress_payment: '기성청구',
      report: '보고서',
      certificate: '인증서',
      other: '기타'
    }
    return typeLabels[type || ''] || '기타'
  }

  const getMimeTypeIcon = (mimeType?: string) => {
    if (!mimeType) return FileText
    
    if (mimeType.startsWith('image/')) return Eye
    if (mimeType === 'application/pdf') return FileText
    if (mimeType.includes('word') || mimeType.includes('document')) return FileText
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return FileText
    
    return FileText
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-start gap-4">
              <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="flex gap-4">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          문서가 없습니다
        </h3>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          이 카테고리에 등록된 문서가 없습니다.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {documents.map((document) => {
        const Icon = getMimeTypeIcon(document.mime_type)
        const isSelected = selectedDocuments.includes(document.id)
        
        return (
          <div
            key={document.id}
            className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow transition-all duration-200 ${
              isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:shadow-md'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Selection checkbox */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onDocumentSelect(document.id, e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />

              {/* Document icon */}
              <div className="flex-shrink-0">
                <Icon className="h-8 w-8 text-gray-400" />
              </div>

              {/* Document info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                      {document.title}
                    </h3>
                    {document.description && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {document.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 ml-4">
                    {document.document_type === 'shared' && <Users className="h-4 w-4 text-green-500" />}
                    {document.document_type === 'progress_payment' && <Lock className="h-4 w-4 text-orange-500" />}
                    {document.document_type === 'required' && <FileText className="h-4 w-4 text-red-500" />}
                  </div>
                </div>

                {/* Metadata */}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(document.created_at)}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {(document as unknown).profiles?.name || '알 수 없음'}
                  </div>
                  
                  {(document as unknown).sites?.name && (
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {(document as unknown).sites.name}
                    </div>
                  )}
                  
                  {(document as unknown).document_folders?.name && (
                    <div className="flex items-center gap-1">
                      <FolderOpen className="h-4 w-4" />
                      {(document as unknown).document_folders.name}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {formatFileSize(document.file_size)}
                  </div>
                  
                  <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium">
                    {getDocumentTypeLabel(document.document_type)}
                  </div>
                </div>

                {/* File info */}
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                  파일명: {document.file_name}
                  {document.mime_type && (
                    <span className="ml-2">타입: {document.mime_type}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => window.open(document.file_url, '_blank')}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                  title="미리보기"
                >
                  <Eye className="h-4 w-4" />
                </button>

                <a
                  href={document.file_url}
                  download={document.file_name}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                  title="다운로드"
                >
                  <Download className="h-4 w-4" />
                </a>

                {document.can_share && (
                  <button
                    onClick={() => onManagePermissions(document)}
                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors"
                    title="권한 관리"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                )}

                {document.can_edit && (
                  <button
                    className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-md transition-colors"
                    title="편집"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                )}

                {document.can_delete && (
                  <button
                    onClick={() => onDocumentSelect(document.id, true)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    title="삭제 선택"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}