'use client'


interface SharedDocumentViewerProps {
  document: SharedDocument & {
    sites?: { name: string; address?: string } | null
    profiles?: { name: string; email: string } | null
  }
  token?: string
}

export default function SharedDocumentViewer({ 
  document, 
  token 
}: SharedDocumentViewerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState(false)
  const [permissionChecked, setPermissionChecked] = useState(false)

  const supabase = createClient()

  // Check if user has permission to view this document
  useEffect(() => {
    const checkPermission = async () => {
      try {
        // If token is provided, validate it
        if (token) {
          // TODO: Implement token validation
          // For now, assume valid token grants access
          setHasPermission(true)
        } else {
          // Check if user is authenticated and has permission
          const { data: { user } } = await supabase.auth.getUser()
          
          if (user) {
            // Check document permissions
            const hasAccess = await supabase.rpc('check_document_permission', {
              p_document_id: document.id,
              p_user_id: user.id,
              p_permission_type: 'view'
            })
            
            setHasPermission(hasAccess.data || false)
          } else {
            setHasPermission(false)
          }
        }
      } catch (err) {
        console.error('Permission check failed:', err)
        setHasPermission(false)
      } finally {
        setPermissionChecked(true)
      }
    }

    checkPermission()
  }, [document.id, token, supabase])

  // Log document view
  useEffect(() => {
    if (hasPermission) {
      logDocumentView()
    }
  }, [hasPermission])

  const logDocumentView = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      await supabase.from('document_access_logs').insert({
        document_id: document.id,
        user_id: user?.id || null,
        action: 'view',
        ip_address: null, // Would be set by server in production
        user_agent: navigator.userAgent,
        details: {
          token_used: !!token,
          referrer: document.referrer
        }
      })
    } catch (error) {
      console.debug('Failed to log document view:', error)
    }
  }

  const handleDownload = async () => {
    if (!hasPermission) return

    setLoading(true)
    try {
      // Log download action
      const { data: { user } } = await supabase.auth.getUser()
      
      await supabase.from('document_access_logs').insert({
        document_id: document.id,
        user_id: user?.id || null,
        action: 'download',
        details: { token_used: !!token }
      })

      // Trigger download
      const link = window.document.createElement('a')
      link.href = document.file_url
      link.download = document.file_name
      link.click()
    } catch (err) {
      setError('다운로드에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const getFileIcon = () => {
    const IconComponent = FILE_TYPE_ICONS[document.file_type] || FileText
    return <IconComponent className="h-16 w-16 text-blue-600" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Permission checking state
  if (!permissionChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">권한을 확인하는 중...</p>
        </div>
      </div>
    )
  }

  // No permission
  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            접근이 제한됩니다
          </h1>
          <p className="text-gray-600 mb-6">
            이 문서에 접근할 권한이 없습니다. 문서 소유자에게 권한을 요청하거나 올바른 공유 링크를 확인하세요.
          </p>
          <div className="space-y-3">
            <a
              href="/auth/login"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              로그인
            </a>
            <p className="text-sm text-gray-500">
              계정이 있으시면 로그인 후 다시 시도하세요
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {getFileIcon()}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {document.title}
              </h1>
              {document.description && (
                <p className="text-gray-600 mb-3">
                  {document.description}
                </p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(document.created_at)}
                </span>
                <span>
                  {formatFileSize(document.file_size)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Security Badge */}
            {document.is_secure !== false && (
              <div className="flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                보안 검증됨
              </div>
            )}

            <button
              onClick={handleDownload}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              다운로드
            </button>
          </div>
        </div>
      </div>

      {/* Document Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">문서 정보</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">업로더</h3>
            <div className="flex items-center">
              <User className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-gray-900">
                {document.profiles?.name || '알 수 없음'}
              </span>
              {document.profiles?.email && (
                <span className="text-gray-500 ml-2 text-sm">
                  ({document.profiles.email})
                </span>
              )}
            </div>
          </div>

          {document.sites && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">현장</h3>
              <div className="flex items-center">
                <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                <div>
                  <span className="text-gray-900">{document.sites.name}</span>
                  {document.sites.address && (
                    <div className="text-gray-500 text-sm">
                      {document.sites.address}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">파일 형식</h3>
            <span className="text-gray-900">
              {document.mime_type || document.file_type.toUpperCase()}
            </span>
          </div>

          {document.category && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">카테고리</h3>
              <span className="text-gray-900">{document.category}</span>
            </div>
          )}

          {document.tags && document.tags.length > 0 && (
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-2">태그</h3>
              <div className="flex flex-wrap gap-2">
                {document.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* File Preview or Link */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">파일 미리보기</h2>
          <a
            href={document.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            새 탭에서 열기
          </a>
        </div>

        {/* Preview based on file type */}
        {document.file_type === 'pdf' ? (
          <div className="aspect-[4/3] border rounded-lg overflow-hidden">
            <iframe
              src={`${document.file_url}#view=FitH`}
              className="w-full h-full"
              title={`${document.title} 미리보기`}
            />
          </div>
        ) : document.file_type.match(/^image\/(jpeg|jpg|png|gif|webp)$/i) ? (
          <div className="text-center">
            <img
              src={document.file_url}
              alt={document.title}
              className="max-w-full h-auto rounded-lg shadow-sm"
            />
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p>이 파일 형식은 미리보기를 지원하지 않습니다.</p>
            <p className="text-sm mt-2">다운로드하여 확인하세요.</p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}
    </div>
  )
}