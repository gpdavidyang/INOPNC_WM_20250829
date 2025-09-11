'use client'

import { useState, useRef } from 'react'
import { Upload, X, CheckCircle, AlertCircle, FileText, File } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'

export interface FileUploadProps {
  onUpload: (file: File, metadata?: UploadMetadata) => Promise<UploadResult>
  accept?: string
  multiple?: boolean
  maxSize?: number // in MB
  title?: string
  description?: string
  documentType?: 'personal' | 'shared' | 'required' | 'other'
  category?: string
  requirementId?: string
  isPublic?: boolean
  disabled?: boolean
  className?: string
}

export interface UploadMetadata {
  documentType?: string
  category?: string
  isRequired?: boolean
  requirementId?: string
  isPublic?: boolean
  uploadedBy?: string
  siteId?: string
}

export interface UploadResult {
  success: boolean
  data?: any
  error?: string
}

interface UploadProgress {
  fileName: string
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
  uploadedData?: any
}

export default function FileUploadComponent({
  onUpload,
  accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx',
  multiple = false,
  maxSize = 10,
  title = '파일 업로드',
  description = '파일을 드래그하거나 클릭하여 업로드하세요',
  documentType = 'personal',
  category = 'general',
  requirementId,
  isPublic = false,
  disabled = false,
  className = ''
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 파일 크기 검증
  const validateFileSize = (file: File): boolean => {
    const maxSizeBytes = maxSize * 1024 * 1024
    return file.size <= maxSizeBytes
  }

  // 파일 타입 검증
  const validateFileType = (file: File): boolean => {
    if (!accept) return true
    
    const acceptedTypes = accept.split(',').map(type => type.trim())
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`
    const mimeType = file.type
    
    return acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return fileExtension === type.toLowerCase()
      }
      return mimeType === type || mimeType.startsWith(type.replace('*', ''))
    })
  }

  // 한글 파일명 안전하게 처리
  const sanitizeFileName = (fileName: string): string => {
    // 파일 확장자 분리
    const lastDotIndex = fileName.lastIndexOf('.')
    const extension = lastDotIndex > -1 ? fileName.slice(lastDotIndex) : ''
    const nameWithoutExt = lastDotIndex > -1 ? fileName.slice(0, lastDotIndex) : fileName
    
    // 한글, 영문, 숫자, 일부 특수문자만 허용
    let safeName = nameWithoutExt
      .replace(/[^\w\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF._\- ]/g, '')
      .trim()
    
    // 파일명이 비어있으면 기본값 사용
    if (!safeName) {
      safeName = 'file'
    }
    
    // 파일명 길이 제한 (100자)
    if (safeName.length > 100) {
      safeName = safeName.substring(0, 100)
    }
    
    return safeName + extension
  }

  // 파일 처리
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (disabled) return

    setError(null)
    const filesToUpload = Array.from(files)

    // 단일 파일 모드에서 여러 파일 선택 시
    if (!multiple && filesToUpload.length > 1) {
      setError('한 번에 하나의 파일만 업로드할 수 있습니다.')
      return
    }

    for (const file of filesToUpload) {
      // 파일 검증
      if (!validateFileSize(file)) {
        setError(`${file.name}: 파일 크기가 ${maxSize}MB를 초과합니다.`)
        continue
      }

      if (!validateFileType(file)) {
        setError(`${file.name}: 지원하지 않는 파일 형식입니다.`)
        continue
      }

      // 한글 파일명 처리
      const safeName = sanitizeFileName(file.name)
      console.log(`📁 Original: ${file.name} → Safe: ${safeName}`)

      // 업로드 진행 상태 추가
      const progressItem: UploadProgress = {
        fileName: file.name,
        progress: 0,
        status: 'uploading'
      }

      setUploadProgress(prev => [...prev, progressItem])

      try {
        // 진행률 업데이트 시뮬레이션
        const updateProgress = (progress: number) => {
          setUploadProgress(prev =>
            prev.map(item =>
              item.fileName === file.name
                ? { ...item, progress }
                : item
            )
          )
        }

        // 시작
        updateProgress(20)

        // 메타데이터 준비
        const metadata: UploadMetadata = {
          documentType,
          category,
          isRequired: !!requirementId,
          requirementId,
          isPublic,
          uploadedBy: '', // Will be filled by the parent component
          siteId: '' // Will be filled by the parent component
        }

        // 업로드 실행
        updateProgress(50)
        const result = await onUpload(file, metadata)
        updateProgress(80)

        if (result.success) {
          // 성공
          setUploadProgress(prev =>
            prev.map(item =>
              item.fileName === file.name
                ? { ...item, progress: 100, status: 'completed', uploadedData: result.data }
                : item
            )
          )

          // 3초 후 완료된 항목 제거
          setTimeout(() => {
            setUploadProgress(prev => prev.filter(item => item.fileName !== file.name))
          }, 3000)
        } else {
          // 실패
          throw new Error(result.error || '업로드 실패')
        }
      } catch (error) {
        console.error('Upload error:', error)
        setUploadProgress(prev =>
          prev.map(item =>
            item.fileName === file.name
              ? { 
                  ...item, 
                  status: 'error', 
                  error: error instanceof Error ? error.message : '업로드 실패' 
                }
              : item
          )
        )

        // 5초 후 에러 항목 제거
        setTimeout(() => {
          setUploadProgress(prev => prev.filter(item => item.fileName !== file.name))
        }, 5000)
      }
    }
  }

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (!disabled) {
      await handleFiles(e.dataTransfer.files)
    }
  }

  // 클릭 업로드
  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleFiles(e.target.files)
    // Reset input value to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 파일 아이콘 결정
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg']
    
    if (imageExtensions.includes(extension || '')) {
      return <FileText className="h-4 w-4" />
    }
    return <File className="h-4 w-4" />
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 업로드 영역 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
        
        <Upload className={`
          mx-auto h-12 w-12 mb-4
          ${isDragging ? 'text-blue-500' : 'text-gray-400'}
        `} />
        
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          최대 {maxSize}MB, {accept.replace(/\./g, '').replace(/,/g, ', ').toUpperCase()}
        </p>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 업로드 진행 상태 */}
      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          {uploadProgress.map((item) => (
            <div
              key={item.fileName}
              className={`
                p-3 rounded-lg border
                ${item.status === 'error' 
                  ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' 
                  : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                }
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getFileIcon(item.fileName)}
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {item.fileName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {item.status === 'uploading' && (
                    <span className="text-xs text-gray-500">{item.progress}%</span>
                  )}
                  {item.status === 'completed' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {item.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              
              {item.status === 'uploading' && (
                <Progress value={item.progress} className="h-1" />
              )}
              
              {item.status === 'error' && item.error && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {item.error}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}