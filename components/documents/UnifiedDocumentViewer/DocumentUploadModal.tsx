'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import type { UnifiedDocument } from '@/hooks/use-unified-documents'

interface DocumentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (file: File, metadata: Partial<UnifiedDocument>) => Promise<void>
  categoryType?: string
  profile: Profile
}

interface UploadFile {
  file: File
  id: string
  progress: number
  error?: string
  success?: boolean
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain'
]

const DOCUMENT_CATEGORIES = [
  { value: 'shared', label: '공유문서' },
  { value: 'markup', label: '도면마킹' },
  { value: 'photo_grid', label: '사진대지' },
  { value: 'required', label: '필수제출' },
  { value: 'invoice', label: '기성청구' }
]

export default function DocumentUploadModal({
  isOpen,
  onClose,
  onUpload,
  categoryType,
  profile
}: DocumentUploadModalProps) {
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState<UploadFile[]>([])
  const [sites, setSites] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryType: categoryType || 'shared',
    siteId: '',
    tags: ''
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 현장 목록 로드
  useEffect(() => {
    if (isOpen) {
      loadSites()
    }
  }, [isOpen])
  
  const loadSites = async () => {
    try {
      const response = await fetch('/api/sites')
      if (response.ok) {
        const result = await response.json()
        setSites(result.data || [])
      }
    } catch (error) {
      console.error('Failed to load sites:', error)
    }
  }
  
  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const handleFiles = (newFiles: File[]) => {
    const validFiles: UploadFile[] = []

    newFiles.forEach(file => {
      // Validate file type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        console.warn(`File type not allowed: ${file.type}`)
        return
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        console.warn(`File too large: ${file.size} bytes`)
        return
      }

      validFiles.push({
        file,
        id: Math.random().toString(36).substring(2),
        progress: 0
      })
    })

    setFiles(prev => [...prev, ...validFiles])

    // Auto-fill title if empty and single file
    if (!formData.title && validFiles.length === 1) {
      setFormData(prev => ({
        ...prev,
        title: validFiles[0].file.name.replace(/\.[^/.]+$/, '')
      }))
    }
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return '🖼️'
    if (file.type === 'application/pdf') return '📄'
    if (file.type.includes('document') || file.type.includes('word')) return '📝'
    if (file.type.includes('spreadsheet') || file.type.includes('excel')) return '📊'
    if (file.type.includes('presentation')) return '📋'
    return '📁'
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      alert('문서 제목을 입력해주세요.')
      return false
    }

    if (files.length === 0) {
      alert('업로드할 파일을 선택해주세요.')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      // 각 파일을 순차적으로 업로드
      for (const uploadFile of files) {
        const metadata = {
          title: formData.title,
          description: formData.description,
          categoryType: formData.categoryType,
          siteId: formData.siteId || undefined,
          tags: formData.tags
        }
        
        await onUpload(uploadFile.file, metadata)
        
        // 파일 성공 표시
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, progress: 100, success: true }
            : f
        ))
      }
      
      // 성공 후 모달 닫기
      setTimeout(() => {
        onClose()
        resetForm()
      }, 1000)
      
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      categoryType: categoryType || 'shared',
      siteId: '',
      tags: ''
    })
    setFiles([])
  }
  
  const handleClose = () => {
    if (!loading) {
      onClose()
      resetForm()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            문서 업로드
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* File Upload Area */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">파일 선택</label>
            
            {/* Drag & Drop Area */}
            <div
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                ${dragActive 
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ALLOWED_MIME_TYPES.join(',')}
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={loading}
              />
              
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                파일을 드래그하거나 클릭하여 선택
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                PDF, Word, Excel, PowerPoint, 이미지 파일 지원 (최대 {formatFileSize(MAX_FILE_SIZE)})
              </p>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">선택된 파일 ({files.length})</label>
                {files.map(uploadFile => (
                  <div key={uploadFile.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-xl">{getFileIcon(uploadFile.file)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {uploadFile.file.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {formatFileSize(uploadFile.file.size)}
                      </p>
                      
                      {/* Progress/Status */}
                      {uploadFile.success && (
                        <div className="flex items-center gap-1 mt-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-xs text-green-600">업로드 완료</span>
                        </div>
                      )}
                      
                      {uploadFile.error && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span className="text-xs text-red-600">{uploadFile.error}</span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => removeFile(uploadFile.id)}
                      disabled={loading}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Document Information */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">문서 제목 *</label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="문서 제목을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">설명</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="문서에 대한 설명을 입력하세요"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">카테고리</label>
                <select
                  id="category"
                  value={formData.categoryType}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoryType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {DOCUMENT_CATEGORIES.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="site" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">현장</label>
                <select
                  id="site"
                  value={formData.siteId}
                  onChange={(e) => setFormData(prev => ({ ...prev, siteId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">현장 선택 안함</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">태그</label>
              <input
                id="tags"
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="태그를 쉼표로 구분하여 입력 (예: 도면, 1층, 설계)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || files.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              업로드
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}