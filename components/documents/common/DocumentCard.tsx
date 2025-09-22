'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Document {
  id: string
  name: string
  title?: string
  type: string
  mime_type?: string
  size: number
  file_size?: number
  category: string
  document_type?: string
  uploadedAt: string
  created_at?: string
  uploadedBy: string
  owner?: {
    full_name: string
    email: string
  }
  url?: string
  file_url?: string
  thumbnail?: string
  status?: 'completed' | 'pending' | 'processing' | 'review' | 'approved' | 'submitted' | 'rejected'
  submissionStatus?: 'not_submitted' | 'submitted' | 'approved' | 'rejected'
  isRequired?: boolean
  documentType?: string
  site?: string | { name: string }
  siteAddress?: string
  description?: string
  rejectionReason?: string
  reviewedAt?: string
  expiryDate?: string
  is_public?: boolean
}

interface DocumentCardProps {
  document: Document
  viewMode: 'grid' | 'list'
  isSelectionMode?: boolean
  isSelected?: boolean
  onSelect?: (documentId: string) => void
  onView?: (document: Document) => void
  onDownload?: (document: Document) => void
  onShare?: (document: Document) => void
  onDelete?: (document: Document) => void
  showOwner?: boolean
  showSite?: boolean
  showStatus?: boolean
  className?: string
}

const categories = [
  { id: 'all', label: '전체' },
  { id: 'drawings', label: '도면' },
  { id: 'manuals', label: '매뉴얼' },
  { id: 'safety', label: '안전관리' },
  { id: 'training', label: '교육자료' },
  { id: 'reports', label: '보고서' },
  { id: 'work-reports', label: '작업일지' },
  { id: 'safety-docs', label: '안전문서' },
  { id: 'photos', label: '사진' },
  { id: 'construction-docs', label: '시공문서' },
  { id: 'certificates', label: '자격증' },
  { id: 'other', label: '기타' },
  { id: 'misc', label: '기타' }
]

const formatFileSize = (bytes: number) => {
  if (!bytes || bytes === 0) return '0 Bytes'
  if (typeof bytes !== 'number' || isNaN(bytes)) return 'Unknown'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const size = Math.round(bytes / Math.pow(k, i) * 100) / 100
  return `${size} ${sizes[i] || 'Bytes'}`
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Invalid Date'
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getFileIcon = (type: string) => {
  if (type === 'markup-document') return FileText
  if (type.startsWith('image/')) return Image
  if (type.includes('pdf')) return FileText
  if (type.includes('word')) return FileText
  if (type.includes('excel')) return FileText
  return File
}

const getDisplayName = (document: Document) => {
  return document.title || document.name || 'Unnamed Document'
}

const getFileSize = (document: Document) => {
  return document.file_size || document.size || 0
}

const getMimeType = (document: Document) => {
  return document.mime_type || document.type
}

const getUploadDate = (document: Document) => {
  return document.created_at || document.uploadedAt
}

const getOwnerName = (document: Document) => {
  const name = document.owner?.full_name || document.uploadedBy
  return name || 'Unknown'
}

const getSiteName = (document: Document) => {
  if (typeof document.site === 'string') return document.site
  if (typeof document.site === 'object' && document.site?.name) return document.site.name
  return null
}

const getCategoryLabel = (document: Document) => {
  const categoryId = document.document_type || document.category
  const category = categories.find(c => c.id === categoryId)
  const label = category?.label
  return label || '기타'
}

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'approved':
    case 'completed':
      return CheckCircle
    case 'submitted':
    case 'pending':
    case 'processing':
      return Clock
    case 'rejected':
      return AlertCircle
    default:
      return AlertCircle
  }
}

export default function DocumentCard({
  document,
  viewMode,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
  onView,
  onDownload,
  onShare,
  onDelete,
  showOwner = true,
  showSite = true,
  showStatus = false,
  className = ''
}: DocumentCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const fileTypeStyle = getFileTypeStyle(getMimeType(document))
  const status = document.submissionStatus || document.status
  const statusStyle = getStatusStyle(status || 'pending')
  const StatusIcon = getStatusIcon(status)
  const FileIcon = getFileIcon(getMimeType(document))

  const handleCardClick = () => {
    if (isSelectionMode && onSelect) {
      onSelect(document.id)
    } else if (onView) {
      onView(document)
    }
  }

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation()
    action()
  }

  if (viewMode === 'grid') {
    return (
      <Card 
        className={`
          hover:shadow-lg transition-all duration-200 cursor-pointer
          ${isSelectionMode && isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
          ${className}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          {/* Selection checkbox - positioned at top left */}
          {isSelectionMode && (
            <div className="absolute top-3 left-3 z-10">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation()
                  onSelect?.(document.id)
                }}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
          )}

          {/* Header with icon and actions */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-shrink-0">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ 
                  backgroundColor: fileTypeStyle.bg,
                  border: `1px solid ${fileTypeStyle.border}`
                }}
              >
                <FileIcon 
                  className="h-6 w-6" 
                  style={{ color: fileTypeStyle.text }}
                />
              </div>
            </div>
            
            {!isSelectionMode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className={`h-8 w-8 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onView && (
                    <DropdownMenuItem onClick={(e) => handleActionClick(e, () => onView(document))}>
                      <Eye className="h-4 w-4 mr-2" />
                      보기
                    </DropdownMenuItem>
                  )}
                  {onDownload && (
                    <DropdownMenuItem onClick={(e) => handleActionClick(e, () => onDownload(document))}>
                      <Download className="h-4 w-4 mr-2" />
                      다운로드
                    </DropdownMenuItem>
                  )}
                  {onShare && (
                    <DropdownMenuItem onClick={(e) => handleActionClick(e, () => onShare(document))}>
                      <Share2 className="h-4 w-4 mr-2" />
                      공유
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={(e) => handleActionClick(e, () => onDelete(document))}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        삭제
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {/* Title */}
          <h3 className="font-medium text-sm mb-2 line-clamp-2 leading-relaxed" title={getDisplayName(document)}>
            {getDisplayName(document)}
          </h3>
          
          {/* Description (if available) */}
          {document.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
              {document.description}
            </p>
          )}
          
          {/* Metadata */}
          <div className="space-y-1.5 mb-3">
            {showOwner && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <Users className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{getOwnerName(document)}</span>
              </div>
            )}
            {showSite && getSiteName(document) && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <Building className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{getSiteName(document)}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span>{new Date(getUploadDate(document)).toLocaleDateString('ko-KR')}</span>
            </div>
          </div>
          
          {/* Footer with status, category, and file size */}
          <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className="text-xs"
                style={{
                  backgroundColor: fileTypeStyle.bg,
                  color: fileTypeStyle.text,
                  border: `1px solid ${fileTypeStyle.border}`
                }}
              >
                {getCategoryLabel(document)}
              </Badge>
              {showStatus && status && status !== 'completed' && (
                <div className="flex items-center gap-1">
                  <StatusIcon 
                    className="h-3 w-3" 
                    style={{ color: statusStyle.icon }}
                  />
                </div>
              )}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatFileSize(getFileSize(document))}
            </span>
          </div>

          {/* Rejection reason (if any) */}
          {document.rejectionReason && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
              <p className="text-xs text-red-600 dark:text-red-400">
                <span className="font-medium">반려 사유:</span> {document.rejectionReason}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // List view
  return (
    <Card 
      className={`
        hover:shadow-sm transition-all duration-200 cursor-pointer
        ${isSelectionMode && isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
        ${className}
      `}
      onClick={handleCardClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {/* Selection checkbox */}
          {isSelectionMode && (
            <div className="flex-shrink-0">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation()
                  onSelect?.(document.id)
                }}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
          )}
          
          {/* File type badge */}
          <div className="flex-shrink-0">
            <Badge 
              variant="secondary" 
              className="text-xs px-2 py-1"
              style={{
                backgroundColor: fileTypeStyle.bg,
                color: fileTypeStyle.text,
                border: `1px solid ${fileTypeStyle.border}`
              }}
            >
              {getMimeType(document) === 'markup-document' ? '도면' : 
               getMimeType(document).includes('pdf') ? 'PDF' :
               getMimeType(document).includes('word') ? 'DOC' :
               getMimeType(document).includes('excel') ? 'XLS' :
               getMimeType(document).startsWith('image/') ? 'IMG' : 'FILE'}
            </Badge>
          </div>
          
          {/* File info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mb-0.5">
                  {getDisplayName(document)}
                </h4>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {new Date(getUploadDate(document)).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                  {showSite && getSiteName(document) && (
                    <>
                      <span>•</span>
                      <span className="truncate max-w-24" title={getSiteName(document) || ''}>
                        {getSiteName(document)}
                      </span>
                    </>
                  )}
                  {showOwner && (
                    <>
                      <span>•</span>
                      <span className="truncate max-w-20" title={getOwnerName(document)}>
                        {getOwnerName(document)}
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span>{formatFileSize(getFileSize(document))}</span>
                </div>
              </div>
              
              {/* Status and actions */}
              <div className="flex items-center gap-2 ml-3">
                {showStatus && status && status !== 'completed' && (
                  <StatusIcon 
                    className="h-4 w-4" 
                    style={{ color: statusStyle.icon }}
                  />
                )}
                
                {!isSelectionMode && (
                  <div className="flex items-center gap-1">
                    {onView && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleActionClick(e, () => onView(document))}
                        title="보기"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {onDownload && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleActionClick(e, () => onDownload(document))}
                        title="다운로드"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {onShare && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleActionClick(e, () => onShare(document))}
                        title="공유하기"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={(e) => handleActionClick(e, () => onDelete(document))}
                        title="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rejection reason (if any) */}
        {document.rejectionReason && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
            <p className="text-xs text-red-600 dark:text-red-400">
              <span className="font-medium">반려 사유:</span> {document.rejectionReason}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}