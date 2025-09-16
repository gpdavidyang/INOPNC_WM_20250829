'use client'

import { useState, useCallback, useRef } from 'react'

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadDate: Date
  status: 'uploading' | 'completed' | 'error'
  progress: number
}

interface UseFileUploadOptions {
  maxFileSize?: number // bytes
  allowedTypes?: string[]
  maxFiles?: number
  onUploadComplete?: (file: UploadedFile) => void
  onUploadError?: (error: string, fileName: string) => void
  onUploadProgress?: (progress: number, fileName: string) => void
}

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
  const {
    maxFileSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'],
    maxFiles = 5,
    onUploadComplete,
    onUploadError,
    onUploadProgress,
  } = options

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 파일 유효성 검사
  const validateFile = useCallback((file: File): string | null => {
    // 파일 크기 검증
    if (file.size > maxFileSize) {
      return `파일 크기가 너무 큽니다. (최대 ${Math.round(maxFileSize / 1024 / 1024)}MB)`
    }

    // 파일 타입 검증
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowedTypes.includes(fileExtension)) {
      return `지원하지 않는 파일 형식입니다. (${allowedTypes.join(', ')}만 가능)`
    }

    // 최대 파일 수 검증
    if (uploadedFiles.length >= maxFiles) {
      return `최대 ${maxFiles}개의 파일만 업로드할 수 있습니다.`
    }

    return null
  }, [maxFileSize, allowedTypes, maxFiles, uploadedFiles.length])

  // 파일 업로드 시뮬레이션 (실제 구현에서는 API 호출)
  const simulateUpload = useCallback(async (file: File): Promise<UploadedFile> => {
    const fileId = Date.now() + Math.random().toString(36).substr(2, 9)
    
    // 업로드 진행률 시뮬레이션
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 100))
      onUploadProgress?.(progress, file.name)
      
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === fileId 
            ? { ...f, progress }
            : f
        )
      )
    }

    // 가짜 URL 생성 (실제로는 서버에서 반환)
    const url = URL.createObjectURL(file)
    
    const uploadedFile: UploadedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      url,
      uploadDate: new Date(),
      status: 'completed',
      progress: 100,
    }

    return uploadedFile
  }, [onUploadProgress])

  // 파일 업로드 처리
  const uploadFiles = useCallback(async (files: File[]) => {
    if (!files.length) return

    setIsUploading(true)

    // 초기 파일 상태 설정
    const initialFiles: UploadedFile[] = files.map(file => ({
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      url: '',
      uploadDate: new Date(),
      status: 'uploading' as const,
      progress: 0,
    }))

    setUploadedFiles(prev => [...prev, ...initialFiles])

    try {
      // 각 파일을 순차적으로 업로드
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const validationError = validateFile(file)
        
        if (validationError) {
          onUploadError?.(validationError, file.name)
          
          // 에러 파일 상태 업데이트
          setUploadedFiles(prev =>
            prev.map(f =>
              f.name === file.name && f.status === 'uploading'
                ? { ...f, status: 'error' }
                : f
            )
          )
          continue
        }

        try {
          const uploadedFile = await simulateUpload(file)
          
          // 성공 파일 상태 업데이트
          setUploadedFiles(prev =>
            prev.map(f =>
              f.name === file.name && f.status === 'uploading'
                ? uploadedFile
                : f
            )
          )
          
          onUploadComplete?.(uploadedFile)
        } catch (error) {
          onUploadError?.(`업로드 실패: ${error}`, file.name)
          
          // 실패 파일 상태 업데이트
          setUploadedFiles(prev =>
            prev.map(f =>
              f.name === file.name && f.status === 'uploading'
                ? { ...f, status: 'error' }
                : f
            )
          )
        }
      }
    } finally {
      setIsUploading(false)
    }
  }, [validateFile, simulateUpload, onUploadComplete, onUploadError])

  // 파일 입력 핸들러
  const handleFileInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length) {
      uploadFiles(files)
    }
    // 입력 값 초기화 (같은 파일 재선택 가능하도록)
    event.target.value = ''
  }, [uploadFiles])

  // 드래그 앤 드롭 핸들러
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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files)
      uploadFiles(files)
    }
  }, [uploadFiles])

  // 파일 선택 트리거
  const selectFiles = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // 파일 제거
  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId)
      if (fileToRemove?.url) {
        URL.revokeObjectURL(fileToRemove.url)
      }
      return prev.filter(f => f.id !== fileId)
    })
  }, [])

  // 모든 파일 제거
  const clearFiles = useCallback(() => {
    uploadedFiles.forEach(file => {
      if (file.url) {
        URL.revokeObjectURL(file.url)
      }
    })
    setUploadedFiles([])
  }, [uploadedFiles])

  // 업로드 진행률 계산
  const overallProgress = uploadedFiles.length > 0 
    ? uploadedFiles.reduce((acc, file) => acc + file.progress, 0) / uploadedFiles.length
    : 0

  return {
    // 상태
    uploadedFiles,
    isUploading,
    dragActive,
    overallProgress,
    
    // 핸들러
    handleFileInput,
    handleDrag,
    handleDrop,
    selectFiles,
    removeFile,
    clearFiles,
    
    // 레프
    fileInputRef,
    
    // 계산된 값
    canUploadMore: uploadedFiles.length < maxFiles,
    completedFiles: uploadedFiles.filter(f => f.status === 'completed'),
    errorFiles: uploadedFiles.filter(f => f.status === 'error'),
    uploadingFiles: uploadedFiles.filter(f => f.status === 'uploading'),
  }
}