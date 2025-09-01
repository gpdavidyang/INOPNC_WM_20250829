'use client'

import { useState, useEffect } from 'react'
import { 
  Upload, 
  Download, 
  Trash2, 
  FileImage,
  Eye,
  X,
  CheckCircle,
  AlertTriangle,
  PenTool,
  ZoomIn
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

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
}

interface MarkupTabProps {
  reportId: string
  isEditing: boolean
  onSaveComplete?: () => void
}

export default function MarkupTab({ 
  reportId, 
  isEditing,
  onSaveComplete
}: MarkupTabProps) {
  const [markups, setMarkups] = useState<MarkupFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' })
  const [selectedMarkup, setSelectedMarkup] = useState<MarkupFile | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [markupDetails, setMarkupDetails] = useState({
    markup_type: 'drawing' as MarkupFile['markup_type'],
    description: ''
  })

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
      const { data, error } = await supabase
        .from('daily_documents')
        .select('*')
        .eq('daily_report_id', reportId)
        .eq('file_type', 'markup')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMarkups(data || [])
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

    // Show detail modal for first file
    setSelectedMarkup(null)
    setShowDetailModal(true)
    
    // Store files for upload after details are entered
    const fileList = Array.from(files)
    ;(window as any).__pendingMarkupFiles = fileList
  }

  const handleUploadWithDetails = async () => {
    const files = (window as any).__pendingMarkupFiles as File[]
    if (!files || files.length === 0) return

    setUploading(true)
    setSaveStatus({ type: null, message: '' })
    setShowDetailModal(false)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${reportId}/markups/${Date.now()}_${file.name}`

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('markup-documents')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        // Save metadata with markup details
        const { data: fileData, error: dbError } = await supabase
          .from('daily_documents')
          .insert({
            daily_report_id: reportId,
            filename: file.name,
            file_path: fileName,
            file_type: 'markup',
            file_size: file.size,
            mime_type: file.type,
            description: markupDetails.description,
            markup_type: markupDetails.markup_type,
            created_by: user?.id
          })
          .select()
          .single()

        if (dbError) throw dbError
        return fileData
      })

      await Promise.all(uploadPromises)
      await fetchMarkups()
      setSaveStatus({ type: 'success', message: '도면마킹이 업로드되었습니다.' })
      
      // Reset form
      setMarkupDetails({
        markup_type: 'drawing',
        description: ''
      })
      delete (window as any).__pendingMarkupFiles
      
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
      const supabase = createClient()
      const { data, error } = await supabase.storage
        .from('markup-documents')
        .download(markup.file_path)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = markup.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading markup:', error)
      setSaveStatus({ type: 'error', message: '도면마킹 다운로드에 실패했습니다.' })
    }
  }

  const getMarkupUrl = (markup: MarkupFile) => {
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
      </div>

      {/* Upload Section */}
      {isEditing && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
          <input
            type="file"
            id="markup-upload"
            className="hidden"
            onChange={handleMarkupUpload}
            accept="image/*,.pdf,.dwg,.dxf"
            multiple
            disabled={uploading}
          />
          <label
            htmlFor="markup-upload"
            className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 ${
              uploading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white rounded-lg transition-colors`}
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                업로드 중...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                파일 선택
              </>
            )}
          </label>
          <p className="mt-2 text-sm text-gray-600">
            이미지, PDF, DWG, DXF 파일을 업로드할 수 있습니다.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            도면, 스케치, 마킹된 이미지 등을 업로드하세요.
          </p>
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
              isEditing={isEditing}
              getMarkupUrl={getMarkupUrl}
              formatFileSize={formatFileSize}
              getMarkupTypeLabel={getMarkupTypeLabel}
              getMarkupTypeColor={getMarkupTypeColor}
            />
          ))}
        </div>
      )}

      {/* Markup Detail Modal for Upload */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">도면마킹 정보 입력</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  타입
                </label>
                <select
                  value={markupDetails.markup_type}
                  onChange={(e) => setMarkupDetails(prev => ({ ...prev, markup_type: e.target.value as MarkupFile['markup_type'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="drawing">도면</option>
                  <option value="blueprint">청사진</option>
                  <option value="sketch">스케치</option>
                  <option value="markup">마킹</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <textarea
                  value={markupDetails.description}
                  onChange={(e) => setMarkupDetails(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="설명 입력 (선택사항)"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUploadWithDetails}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                업로드
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  delete (window as any).__pendingMarkupFiles
                  const input = document.getElementById('markup-upload') as HTMLInputElement
                  if (input) input.value = ''
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
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
        <h4 className="font-medium text-gray-900 truncate mb-1" title={markup.filename}>
          {markup.filename}
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
          {isEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              title="삭제"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}