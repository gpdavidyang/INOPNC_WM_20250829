'use client'

import React, { useState, useRef, useCallback } from 'react'

interface DocumentUploadZoneProps {
  siteId: string
  onUploadComplete?: () => void
  disabled?: boolean
  className?: string
}

interface FilePreview {
  file: File
  preview: string | null
  validationResult: ValidationResult
  uploading: boolean
}

export default function DocumentUploadZone({ 
  siteId,
  onUploadComplete, 
  disabled = false, 
  className 
}: DocumentUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false)
  const [documentType, setDocumentType] = useState<SiteDocumentType>('ptw')
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Document type options
  const documentTypeOptions = [
    { value: 'ptw' as const, label: 'PTW (작업허가서)', icon: '📋' },
    { value: 'blueprint' as const, label: '공사도면', icon: '📐' },
    { value: 'other' as const, label: '기타 문서', icon: '📄' }
  ]

  // Handle file validation and preview generation
  const processFile = useCallback((file: File): FilePreview => {
    // Validate file with current document type
    const validationResult = validateFile(file, documentType)
    
    // Generate preview for images
    let preview: string | null = null
    if (file.type.startsWith('image/') && validationResult.isValid) {
      preview = URL.createObjectURL(file)
    }

    return {
      file,
      preview,
      validationResult,
      uploading: false
    }
  }, [documentType])

  // Handle file selection (both drag/drop and click)
  const handleFiles = useCallback((files: FileList) => {
    const newPreviews = Array.from(files).map(processFile)
    setFilePreviews(prev => [...prev, ...newPreviews])
  }, [processFile])

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true)
    }
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (disabled) return
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [disabled, handleFiles])

  // Handle click to select files
  const handleClick = useCallback(() => {
    if (disabled) return
    fileInputRef.current?.click()
  }, [disabled])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
      // Reset input value to allow same file selection
      e.target.value = ''
    }
  }, [handleFiles])

  // Handle individual file upload to site_documents table
  const handleUploadFile = useCallback(async (index: number) => {
    const filePreview = filePreviews[index]
    if (!filePreview || !filePreview.validationResult.isValid || filePreview.uploading) return

    // Update uploading state
    setFilePreviews(prev => prev.map((fp, i) => 
      i === index ? { ...fp, uploading: true } : fp
    ))

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      // Create form data for file upload
      const formData = new FormData()
      formData.append('file', filePreview.file)
      formData.append('siteId', siteId)
      formData.append('documentType', documentType)
      
      // Upload file via API route
      const response = await fetch('/api/site-documents/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '업로드에 실패했습니다')
      }

      // Remove file from preview after successful upload
      setFilePreviews(prev => prev.filter((_, i) => i !== index))
      
      // Clean up object URL
      if (filePreview.preview) {
        URL.revokeObjectURL(filePreview.preview)
      }

      // Notify parent component
      onUploadComplete?.()
      
    } catch (error) {
      // Update with error in validation result
      setFilePreviews(prev => prev.map((fp, i) => 
        i === index ? { 
          ...fp, 
          uploading: false, 
          validationResult: {
            ...fp.validationResult,
            isValid: false,
            errors: [
              ...fp.validationResult.errors,
              new FileValidationError(
                error instanceof Error ? error.message : '업로드 실패',
                'UPLOAD_ERROR'
              )
            ]
          }
        } : fp
      ))
    }
  }, [filePreviews, documentType, siteId, onUploadComplete])

  // Remove file from preview
  const removeFile = useCallback((index: number) => {
    const filePreview = filePreviews[index]
    if (filePreview?.preview) {
      URL.revokeObjectURL(filePreview.preview)
    }
    setFilePreviews(prev => prev.filter((_, i) => i !== index))
  }, [filePreviews])

  // Clean up object URLs on unmount
  React.useEffect(() => {
    return () => {
      filePreviews.forEach(fp => {
        if (fp.preview) {
          URL.revokeObjectURL(fp.preview)
        }
      })
    }
  }, [])

  return (
    <div className={cn("space-y-6", className)}>
      {/* Document Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          문서 유형 선택
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {documentTypeOptions.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all",
                "hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20",
                documentType === option.value
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <input
                type="radio"
                name="documentType"
                value={option.value}
                checked={documentType === option.value}
                onChange={(e) => setDocumentType(e.target.value as SiteDocumentType)}
                disabled={disabled}
                className="sr-only"
              />
              <span className="text-2xl mr-3">{option.icon}</span>
              <span className="font-medium">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Upload Zone */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200",
          dragActive 
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105" 
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
        )}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
          onChange={handleFileInput}
          disabled={disabled}
          className="hidden"
          aria-label="파일 선택"
        />
        
        <Upload className={cn(
          "mx-auto h-16 w-16 mb-4 transition-colors",
          dragActive ? "text-blue-500" : "text-gray-400"
        )} />
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {dragActive ? "파일을 여기에 놓으세요" : "파일을 드래그하거나 클릭하여 선택"}
        </h3>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          PDF, JPG, PNG, GIF, WebP 파일을 업로드할 수 있습니다
        </p>
        
        <p className="text-xs text-gray-400 dark:text-gray-500">
          최대 파일 크기: 10MB
        </p>

        {dragActive && (
          <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 rounded-xl flex items-center justify-center">
            <div className="text-blue-600 dark:text-blue-400 text-center">
              <Upload className="mx-auto h-12 w-12 mb-2" />
              <p className="font-medium">파일을 놓으세요</p>
            </div>
          </div>
        )}
      </div>

      {/* File Previews */}
      {filePreviews.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            업로드할 파일들 ({filePreviews.length}개)
          </h4>
          
          <div className="space-y-2">
            {filePreviews.map((filePreview, index) => (
              <FilePreviewItem
                key={`${filePreview.file.name}-${index}`}
                filePreview={filePreview}
                index={index}
                onUpload={() => handleUploadFile(index)}
                onRemove={() => removeFile(index)}
                documentType={documentType}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Individual file preview component
interface FilePreviewItemProps {
  filePreview: FilePreview
  index: number
  onUpload: () => void
  onRemove: () => void
  documentType: SiteDocumentType
  disabled: boolean
}

function FilePreviewItem({ 
  filePreview, 
  onUpload, 
  onRemove, 
  documentType,
  disabled 
}: FilePreviewItemProps) {
  const { file, preview, validationResult, uploading } = filePreview
  const { isValid, errors, warnings } = validationResult

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = () => {
    if (file.type === 'application/pdf') return '📄'
    if (file.type.startsWith('image/')) return '🖼️'
    return '📁'
  }

  return (
    <div className={cn(
      "p-4 border rounded-lg",
      !isValid 
        ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
        : warnings.length > 0
        ? "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20"
        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
    )}>
      <div className="flex items-start">
        {/* File Preview */}
        <div className="flex-shrink-0 mr-4">
          {preview ? (
            <img 
              src={preview} 
              alt={file.name}
              className="w-12 h-12 object-cover rounded"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-2xl">
              {getFileIcon()}
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {file.name}
            </p>
            {isValid && (
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
            )}
            {!isValid && (
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            )}
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {formatFileSize(file.size)} • {documentType.toUpperCase()}
          </p>

          {/* Validation Messages */}
          {errors.length > 0 && (
            <div className="space-y-1">
              {errors.map((error, index) => (
                <p key={index} className="text-xs text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                  {error.message}
                </p>
              ))}
            </div>
          )}

          {warnings.length > 0 && (
            <div className="space-y-1 mt-1">
              {warnings.map((warning, index) => (
                <p key={index} className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center">
                  <Info className="h-3 w-3 mr-1 flex-shrink-0" />
                  {warning}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-4">
          {isValid && !uploading && (
            <button
              onClick={onUpload}
              disabled={disabled}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              업로드
            </button>
          )}
          
          {uploading && (
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
              <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
              업로드 중...
            </div>
          )}

          <button
            onClick={onRemove}
            disabled={uploading}
            className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="파일 제거"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}