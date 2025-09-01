'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, FileText, AlertCircle, CheckCircle, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Site {
  id: string
  name: string
  address: string
}

interface UploadFile {
  file: File
  id: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export default function DocumentUploadPage() {
  const router = useRouter()
  const [files, setFiles] = useState<UploadFile[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [category, setCategory] = useState<string>('shared')
  const [title, setTitle] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [isPublic, setIsPublic] = useState<boolean>(false)
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchSites()
  }, [])

  const fetchSites = async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('id, name, address')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setSites(data || [])
    } catch (error) {
      console.error('Error fetching sites:', error)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles) return

    const newFiles: UploadFile[] = Array.from(selectedFiles).map(file => ({
      file,
      id: Math.random().toString(36).substring(2, 15),
      progress: 0,
      status: 'pending'
    }))

    setFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const uploadFile = async (uploadFile: UploadFile): Promise<boolean> => {
    try {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'uploading', progress: 10 }
          : f
      ))

      const formData = new FormData()
      formData.append('file', uploadFile.file)
      formData.append('title', title || uploadFile.file.name)
      formData.append('description', description)
      formData.append('category_type', category)
      formData.append('is_public', isPublic.toString())
      if (selectedSite) {
        formData.append('site_id', selectedSite)
      }

      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, progress: Math.min(f.progress + 20, 90) }
            : f
        ))
      }, 200)

      const response = await fetch('/api/unified-documents', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'success', progress: 100 }
          : f
      ))

      return true
    } catch (error) {
      console.error('Upload error:', error)
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Upload failed'
            }
          : f
      ))
      return false
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      alert('업로드할 파일을 선택해주세요.')
      return
    }

    if (!title.trim()) {
      alert('문서 제목을 입력해주세요.')
      return
    }

    setUploading(true)

    try {
      const uploadPromises = files
        .filter(f => f.status === 'pending' || f.status === 'error')
        .map(uploadFile)

      const results = await Promise.all(uploadPromises)
      const successCount = results.filter(Boolean).length

      if (successCount > 0) {
        alert(`${successCount}개 파일이 성공적으로 업로드되었습니다.`)
        
        const hasFailures = files.some(f => f.status === 'error')
        if (!hasFailures) {
          router.push('/dashboard/admin/integrated?view=documents')
        }
      }
    } catch (error) {
      console.error('Upload process error:', error)
      alert('업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'uploading':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
      default:
        return <FileText className="h-5 w-5 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">문서 업로드</h1>
              <p className="mt-1 text-sm text-gray-500">새 문서를 업로드하고 공유 설정을 관리합니다.</p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              돌아가기
            </button>
          </div>
        </div>
        
        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">문서 제목 *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="문서의 제목을 입력하세요"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="shared">공유문서</option>
                <option value="markup">도면마킹문서</option>
                <option value="required">필수제출서류</option>
                <option value="invoice">기성청구문서</option>
                <option value="photo_grid">사진대지문서</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="문서 설명 (선택사항)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">현장 선택</label>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">현장 미지정</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center mt-6">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
                공개 문서로 설정
              </label>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 mb-1">파일을 선택하여 업로드하세요</p>
              <p className="text-xs text-gray-500 mb-2">PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (최대 10MB)</p>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer text-sm"
              >
                <Upload className="h-4 w-4 mr-1" />
                파일 선택
              </label>
            </div>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-900">선택된 파일 ({files.length}개)</h3>
              {files.map((uploadFile) => (
                <div key={uploadFile.id} className="flex items-center p-2 bg-gray-50 rounded">
                  <div className="flex-shrink-0 mr-2">
                    {getStatusIcon(uploadFile.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">{formatFileSize(uploadFile.file.size)}</p>
                    {uploadFile.status === 'uploading' && (
                      <div className="mt-1 bg-blue-200 rounded-full h-1">
                        <div 
                          className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${uploadFile.progress}%` }}
                        ></div>
                      </div>
                    )}
                    {uploadFile.error && (
                      <p className="text-xs text-red-600">{uploadFile.error}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeFile(uploadFile.id)}
                    disabled={uploading}
                    className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || files.length === 0 || !title.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? '업로드 중...' : '업로드'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}