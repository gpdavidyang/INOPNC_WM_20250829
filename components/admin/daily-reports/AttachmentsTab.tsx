'use client'

import { useState, useEffect } from 'react'
import { 
  Upload, 
  Download, 
  Trash2, 
  File, 
  FileText, 
  FileImage,
  Eye,
  X,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface AttachmentFile {
  id: string
  filename: string
  file_path: string
  file_size: number
  mime_type: string
  description?: string
  created_at: string
  created_by: string
}

interface AttachmentsTabProps {
  reportId: string
  isEditing: boolean
  onSaveComplete?: () => void
}

export default function AttachmentsTab({ 
  reportId, 
  isEditing,
  onSaveComplete
}: AttachmentsTabProps) {
  const [files, setFiles] = useState<AttachmentFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' })

  useEffect(() => {
    fetchFiles()
  }, [reportId])

  useEffect(() => {
    if (saveStatus.type) {
      const timer = setTimeout(() => {
        setSaveStatus({ type: null, message: '' })
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [saveStatus])

  const fetchFiles = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      const { data, error } = await supabase
        .from('daily_documents')
        .select('*')
        .eq('daily_report_id', reportId)
        .eq('file_type', 'document')
        .order('created_at', { ascending: false })

      if (error) throw error
      setFiles(data || [])
    } catch (error) {
      console.error('Error fetching attachments:', error)
      setError('첨부파일을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const validateFile = (file: File) => {
    const maxSize = 50 * 1024 * 1024 // 50MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed'
    ]

    if (file.size > maxSize) {
      throw new Error(`파일 크기가 너무 큽니다. 최대 50MB까지 업로드 가능합니다. (${file.name})`)
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`지원하지 않는 파일 형식입니다. (${file.name})`)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setSaveStatus({ type: null, message: '' })

    try {
      // Validate all files first
      const fileArray = Array.from(files)
      for (const file of fileArray) {
        validateFile(file)
      }

      const supabase = createClient()
      
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('인증이 필요합니다. 다시 로그인해주세요.')
      }

      const uploadPromises = fileArray.map(async (file) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${reportId}/attachments/${Date.now()}_${file.name}`

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('daily-report-attachments')
          .upload(fileName, file)

        if (uploadError) {
          console.error('Storage upload error:', uploadError)
          throw new Error(`파일 업로드 실패: ${uploadError.message} (${file.name})`)
        }

        // Save metadata
        const { data: fileData, error: dbError } = await supabase
          .from('daily_documents')
          .insert({
            daily_report_id: reportId,
            filename: file.name,
            file_path: fileName,
            file_type: 'document',
            file_size: file.size,
            mime_type: file.type,
            created_by: user.id
          })
          .select()
          .single()

        if (dbError) {
          console.error('Database insert error:', dbError)
          // Try to clean up uploaded file
          await supabase.storage
            .from('daily-report-attachments')
            .remove([fileName])
          throw new Error(`메타데이터 저장 실패: ${dbError.message} (${file.name})`)
        }

        return fileData
      })

      await Promise.all(uploadPromises)
      await fetchFiles()
      setSaveStatus({ type: 'success', message: `${fileArray.length}개 파일이 업로드되었습니다.` })
      
      if (onSaveComplete) {
        onSaveComplete()
      }
    } catch (error: any) {
      console.error('Error uploading files:', error)
      setSaveStatus({ 
        type: 'error', 
        message: error.message || '파일 업로드에 실패했습니다.' 
      })
    } finally {
      setUploading(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const handleDownload = async (file: AttachmentFile) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.storage
        .from('daily-report-attachments')
        .download(file.file_path)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = file.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading file:', error)
      setSaveStatus({ type: 'error', message: '파일 다운로드에 실패했습니다.' })
    }
  }

  const handleDelete = async (file: AttachmentFile) => {
    if (!confirm(`'${file.filename}' 파일을 삭제하시겠습니까?`)) return

    try {
      const supabase = createClient()
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('daily-report-attachments')
        .remove([file.file_path])

      if (storageError) console.error('Storage delete error:', storageError)

      // Delete metadata
      const { error: dbError } = await supabase
        .from('daily_documents')
        .delete()
        .eq('id', file.id)

      if (dbError) throw dbError

      await fetchFiles()
      setSaveStatus({ type: 'success', message: '파일이 삭제되었습니다.' })
      
      if (onSaveComplete) {
        onSaveComplete()
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      setSaveStatus({ type: 'error', message: '파일 삭제에 실패했습니다.' })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return FileImage
    if (mimeType.includes('pdf')) return FileText
    return File
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">첨부파일을 불러오는 중...</p>
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
          <File className="h-5 w-5 text-blue-600" />
          첨부파일
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {files.length}개
          </span>
        </h3>
      </div>

      {/* Upload Section */}
      {isEditing && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
          <input
            type="file"
            id="attachment-upload"
            className="hidden"
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
            multiple
            disabled={uploading}
          />
          <label
            htmlFor="attachment-upload"
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
            PDF, Word, Excel, PowerPoint, 텍스트, 압축 파일을 업로드할 수 있습니다.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            여러 파일을 동시에 선택할 수 있습니다.
          </p>
        </div>
      )}

      {/* Files List */}
      {files.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">첨부된 파일이 없습니다.</p>
          {isEditing && (
            <p className="text-sm text-gray-500">위의 "파일 선택" 버튼을 클릭하여 파일을 업로드하세요.</p>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  파일명
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  크기
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                  업로드 일시
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {files.map((file) => {
                const FileIcon = getFileIcon(file.mime_type)
                return (
                  <tr key={file.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {file.filename}
                          </p>
                          {file.description && (
                            <p className="text-xs text-gray-500">{file.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatFileSize(file.file_size)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {format(new Date(file.created_at), 'MM/dd HH:mm', { locale: ko })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleDownload(file)}
                          className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors"
                          title="다운로드"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        {isEditing && (
                          <button
                            onClick={() => handleDelete(file)}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}