'use client'


interface MarkupFile {
  id: string
  filename: string
  file_path: string
  file_size: number
  mime_type: string
  description?: string
  markup_type?: 'drawing' | 'blueprint' | 'sketch' | 'markup'
  created_at: string
  created_by: string
  title?: string
  metadata?: unknown
}

interface MarkupTabProps {
  reportId: string
  isEditing: boolean
  onSaveComplete?: () => void
  reportData?: unknown // Daily report data for auto-population
}

export default function MarkupTab({ 
  reportId, 
  isEditing,
  onSaveComplete,
  reportData
}: MarkupTabProps) {
  const [markups, setMarkups] = useState<MarkupFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' })
  const [selectedMarkup, setSelectedMarkup] = useState<MarkupFile | null>(null)

  useEffect(() => {
    fetchMarkups()
  }, [reportId])

  useEffect(() => {
    if (saveStatus.type) {
      const timer = setTimeout(() => {
        setSaveStatus({ type: null, message: '' })
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [saveStatus])

  const fetchMarkups = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      
      // 먼저 작업일지에서 현장 정보를 가져옴
      const { data: reportData, error: reportError } = await supabase
        .from('daily_reports')
        .select('site_id, sites(name)')
        .eq('id', reportId)
        .single()
      
      if (reportError) throw reportError
      
      if (!reportData?.site_id) {
        setMarkups([])
        return
      }
      
      // 현장에 할당된 도면마킹 문서들을 가져옴
      const { data: unifiedDocs, error: unifiedError } = await supabase
        .from('unified_document_system')
        .select(`
          *,
          profiles!unified_document_system_uploaded_by_fkey(full_name, email)
        `)
        .eq('site_id', reportData.site_id)
        .eq('category_type', 'markup')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      
      if (unifiedError) throw unifiedError
      
      // 데이터 형식을 기존 MarkupFile 형식으로 변환
      const formattedMarkups = (unifiedDocs || []).map(doc => ({
        id: doc.id,
        filename: doc.file_name,
        file_path: doc.file_url,
        file_size: doc.file_size || 0,
        mime_type: doc.mime_type,
        description: doc.description,
        markup_type: 'markup' as const,
        created_at: doc.created_at,
        created_by: doc.uploaded_by,
        title: doc.title,
        metadata: doc.metadata
      }))
      
      setMarkups(formattedMarkups)
    } catch (error) {
      console.error('Error fetching markups:', error)
      setError('도면마킹을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkupUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setSaveStatus({ type: null, message: '' })

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      // Fetch daily report data if not provided
      let reportInfo = reportData
      if (!reportInfo) {
        const { data: report, error: reportError } = await supabase
          .from('daily_reports')
          .select('*, sites(name)')
          .eq('id', reportId)
          .single()
        
        if (reportError) {
          console.error('Error fetching report data:', reportError)
        } else {
          reportInfo = report
        }
      }
      
      const uploadPromises = Array.from(files).map(async (file, index) => {
        const fileExt = file.name.split('.').pop()
        // Create safe filename - remove Korean characters and spaces
        const timestamp = Date.now() + index
        const safeFileName = `${timestamp}.${fileExt}`
        const fileName = `${reportId}/markups/${safeFileName}`

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('markup-documents')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        // Auto-generate description from daily report data
        const autoDescription = reportInfo ? 
          `${reportInfo.sites?.name || ''} - ${reportInfo.work_type || ''} - ${reportInfo.work_location || ''}`.trim() : 
          ''

        // Save metadata with auto-populated data from daily report
        const { data: fileData, error: dbError } = await supabase
          .from('daily_documents')
          .insert({
            daily_report_id: reportId,
            filename: file.name,
            file_path: fileName,
            file_type: 'markup',
            file_size: file.size,
            mime_type: file.type,
            description: autoDescription,
            markup_type: 'markup', // Default type
            created_by: user?.id,
            // Include daily report related data if available
            site_id: reportInfo?.site_id,
            work_type: reportInfo?.work_type,
            work_location: reportInfo?.work_location
          })
          .select()
          .single()

        if (dbError) throw dbError
        return fileData
      })

      await Promise.all(uploadPromises)
      await fetchMarkups()
      setSaveStatus({ type: 'success', message: `도면마킹 ${files.length}개가 업로드되었습니다.` })
      
      if (onSaveComplete) {
        onSaveComplete()
      }
    } catch (error) {
      console.error('Error uploading markups:', error)
      setSaveStatus({ type: 'error', message: '도면마킹 업로드에 실패했습니다.' })
    } finally {
      setUploading(false)
      // Reset file input
      const input = document.getElementById('markup-upload') as HTMLInputElement
      if (input) input.value = ''
    }
  }

  const handleDelete = async (markup: MarkupFile) => {
    if (!confirm(`이 도면마킹을 삭제하시겠습니까?`)) return

    try {
      const supabase = createClient()
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('markup-documents')
        .remove([markup.file_path])

      if (storageError) console.error('Storage delete error:', storageError)

      // Delete metadata
      const { error: dbError } = await supabase
        .from('daily_documents')
        .delete()
        .eq('id', markup.id)

      if (dbError) throw dbError

      await fetchMarkups()
      setSaveStatus({ type: 'success', message: '도면마킹이 삭제되었습니다.' })
      
      if (onSaveComplete) {
        onSaveComplete()
      }
    } catch (error) {
      console.error('Error deleting markup:', error)
      setSaveStatus({ type: 'error', message: '도면마킹 삭제에 실패했습니다.' })
    }
  }

  const handleDownload = async (markup: MarkupFile) => {
    try {
      let downloadUrl: string
      
      if (markup.file_path.startsWith('file://')) {
        // 로컬 파일인 경우 API를 통해 다운로드
        const fileName = markup.file_path.split('/').pop()
        downloadUrl = `/api/files/markup/${fileName}`
      } else {
        // Supabase storage 파일인 경우
        const supabase = createClient()
        const { data, error } = await supabase.storage
          .from('markup-documents')
          .download(markup.file_path)

        if (error) throw error

        downloadUrl = URL.createObjectURL(data)
      }

      // Create download link
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = markup.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      // Blob URL인 경우에만 revoke
      if (downloadUrl.startsWith('blob:')) {
        URL.revokeObjectURL(downloadUrl)
      }
    } catch (error) {
      console.error('Error downloading markup:', error)
      setSaveStatus({ type: 'error', message: '도면마킹 다운로드에 실패했습니다.' })
    }
  }

  const getMarkupUrl = (markup: MarkupFile) => {
    // file:// URL을 직접 반환하거나, 웹에서 접근 가능한 URL로 변환
    if (markup.file_path.startsWith('file://')) {
      // 로컬 파일 경로를 웹 경로로 변환 
      // 실제로는 서버에서 파일을 제공하는 API가 필요함
      const fileName = markup.file_path.split('/').pop()
      return `/api/files/markup/${fileName}` // 추후 구현 필요
    }
    
    // Supabase storage URL인 경우
    const supabase = createClient()
    const { data } = supabase.storage
      .from('markup-documents')
      .getPublicUrl(markup.file_path)
    return data.publicUrl
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getMarkupTypeLabel = (type: MarkupFile['markup_type']) => {
    const types = {
      drawing: '도면',
      blueprint: '청사진',
      sketch: '스케치',
      markup: '마킹'
    }
    return types[type as keyof typeof types] || '기타'
  }

  const getMarkupTypeColor = (type: MarkupFile['markup_type']) => {
    const colors = {
      drawing: 'bg-blue-100 text-blue-800',
      blueprint: 'bg-indigo-100 text-indigo-800',
      sketch: 'bg-green-100 text-green-800',
      markup: 'bg-orange-100 text-orange-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">도면마킹을 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Save Status Alert */}
      {saveStatus.type && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
          saveStatus.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {saveStatus.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-600" />
          )}
          <span className="font-medium">{saveStatus.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <PenTool className="h-5 w-5 text-blue-600" />
          도면마킹
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {markups.length}개
          </span>
        </h3>
        
        {markups.length > 0 && (
          <div className="text-sm text-gray-600">
            현장에 할당된 도면들입니다. 클릭하여 마킹을 추가하거나 편집할 수 있습니다.
          </div>
        )}
      </div>

      {/* Info Section */}
      {markups.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <PenTool className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">도면 마킹 편집</h4>
              <p className="text-sm text-blue-700 mb-3">
                아래 도면들을 클릭하여 마킹을 추가하거나 편집할 수 있습니다. 
                변경사항은 자동으로 저장됩니다.
              </p>
              {isEditing && (
                <div className="flex gap-2">
                  <button
                    onClick={() => window.open('/dashboard/markup?view=list', '_blank')}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  >
                    <PenTool className="h-4 w-4" />
                    새 마킹 편집기
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Markups Grid */}
      {markups.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <PenTool className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">등록된 도면마킹이 없습니다.</p>
          {isEditing && (
            <p className="text-sm text-gray-500">위의 "파일 선택" 버튼을 클릭하여 도면마킹을 업로드하세요.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {markups.map((markup) => (
            <MarkupCard
              key={markup.id}
              markup={markup}
              onView={() => setSelectedMarkup(markup)}
              onDelete={() => handleDelete(markup)}
              onDownload={() => handleDownload(markup)}
              onEdit={() => window.open(`/dashboard/markup?document=${markup.id}&mode=edit`, '_blank')}
              isEditing={isEditing}
              getMarkupUrl={getMarkupUrl}
              formatFileSize={formatFileSize}
              getMarkupTypeLabel={getMarkupTypeLabel}
              getMarkupTypeColor={getMarkupTypeColor}
            />
          ))}
        </div>
      )}

      {/* Markup View Modal */}
      {selectedMarkup && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedMarkup(null)}
        >
          <div className="relative max-w-6xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
            <button
              onClick={() => setSelectedMarkup(null)}
              className="absolute top-2 right-2 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
            
            {selectedMarkup.mime_type.startsWith('image/') ? (
              <img
                src={getMarkupUrl(selectedMarkup)}
                alt={selectedMarkup.filename}
                className="max-w-full max-h-[80vh] object-contain"
              />
            ) : (
              <iframe
                src={getMarkupUrl(selectedMarkup)}
                className="w-full h-[80vh]"
                title={selectedMarkup.filename}
              />
            )}
            
            <div className="p-4 bg-gray-50 border-t">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">파일명</p>
                  <p className="font-medium">{selectedMarkup.filename}</p>
                </div>
                <div>
                  <p className="text-gray-500">타입</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getMarkupTypeColor(selectedMarkup.markup_type)}`}>
                    {getMarkupTypeLabel(selectedMarkup.markup_type)}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500">업로드 일시</p>
                  <p className="font-medium">
                    {format(new Date(selectedMarkup.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                  </p>
                </div>
              </div>
              {selectedMarkup.description && (
                <div className="mt-4 text-sm">
                  <p className="text-gray-500">설명</p>
                  <p className="font-medium">{selectedMarkup.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Markup Card Component
interface MarkupCardProps {
  markup: MarkupFile
  onView: () => void
  onDelete: () => void
  onDownload: () => void
  onEdit: () => void
  isEditing: boolean
  getMarkupUrl: (markup: MarkupFile) => string
  formatFileSize: (bytes: number) => string
  getMarkupTypeLabel: (type: MarkupFile['markup_type']) => string
  getMarkupTypeColor: (type: MarkupFile['markup_type']) => string
}

function MarkupCard({ 
  markup, 
  onView, 
  onDelete, 
  onDownload, 
  onEdit,
  isEditing, 
  getMarkupUrl, 
  formatFileSize,
  getMarkupTypeLabel,
  getMarkupTypeColor
}: MarkupCardProps) {
  return (
    <div className="relative group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gray-100 relative overflow-hidden cursor-pointer" onClick={onView}>
        {markup.mime_type.startsWith('image/') ? (
          <img
            src={getMarkupUrl(markup)}
            alt={markup.filename}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileImage className="h-16 w-16 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
          <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="absolute top-2 left-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getMarkupTypeColor(markup.markup_type)}`}>
            {getMarkupTypeLabel(markup.markup_type)}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <h4 className="font-medium text-gray-900 truncate mb-1" title={markup.title || markup.filename}>
          {markup.title || markup.filename}
        </h4>
        {markup.description && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {markup.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{formatFileSize(markup.file_size)}</span>
          <span>{format(new Date(markup.created_at), 'MM/dd', { locale: ko })}</span>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            title="마킹 편집"
          >
            <PenTool className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onView()
            }}
            className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            title="보기"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDownload()
            }}
            className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            title="다운로드"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}