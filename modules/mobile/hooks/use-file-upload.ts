import { useState, useCallback } from 'react'
import {
  AttachedFile,
  FileUploadConfig,
  FILE_UPLOAD_CONFIG,
  WorkLogAttachments,
} from '../types/work-log.types'
import { FileUploadService } from '../services/file-upload.service'
import { formatFileSize } from '../utils/work-log-utils'

interface UseFileUploadOptions {
  onUploadComplete?: (files: AttachedFile[]) => void
  onError?: (error: string) => void
}

/**
 * 파일 업로드 관리 훅
 */
export function useFileUpload(type: keyof WorkLogAttachments, options?: UseFileUploadOptions) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [files, setFiles] = useState<AttachedFile[]>([])
  const [error, setError] = useState<string | null>(null)

  const config = FILE_UPLOAD_CONFIG[type]

  // 파일 검증
  const validateFile = useCallback(
    (file: File): string | null => {
      // 파일 크기 검증
      if (file.size > config.maxSize) {
        return `파일 크기는 ${formatFileSize(config.maxSize)}를 초과할 수 없습니다.`
      }

      // 파일 타입 검증
      const isValidType = config.accept.some(mimeType => {
        if (mimeType.endsWith('/*')) {
          const baseType = mimeType.split('/')[0]
          return file.type.startsWith(baseType)
        }
        return file.type === mimeType
      })

      if (!isValidType) {
        return '지원하지 않는 파일 형식입니다.'
      }

      // 파일 개수 검증
      if (files.length >= config.maxCount) {
        return `최대 ${config.maxCount}개까지 업로드 가능합니다.`
      }

      return null
    },
    [config, files.length]
  )

  // 파일 업로드
  const uploadFile = useCallback(
    async (file: File): Promise<AttachedFile> => {
      // 파일 검증
      const validationError = validateFile(file)
      if (validationError) {
        throw new Error(validationError)
      }

      try {
        // 실제 파일 업로드 API 호출
        const uploadedFile = await FileUploadService.uploadFile(
          file,
          'work-log-attachments',
          progress => {
            setUploadProgress(progress.percentage)
          }
        )

        return uploadedFile
      } catch (error) {
        console.error('File upload error:', error)
        throw new Error(error instanceof Error ? error.message : '파일 업로드에 실패했습니다.')
      }
    },
    [validateFile]
  )

  // 단일 파일 업로드
  const uploadSingle = useCallback(
    async (file: File) => {
      try {
        setError(null)
        setUploading(true)
        setUploadProgress(0)

        const uploadedFile = await uploadFile(file)

        const newFiles = config.multiple ? [...files, uploadedFile] : [uploadedFile]

        setFiles(newFiles)
        options?.onUploadComplete?.(newFiles)

        return uploadedFile
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '파일 업로드 실패'
        setError(errorMessage)
        options?.onError?.(errorMessage)
        throw err
      } finally {
        setUploading(false)
        setUploadProgress(0)
      }
    },
    [uploadFile, config.multiple, files, options]
  )

  // 다중 파일 업로드
  const uploadMultiple = useCallback(
    async (fileList: FileList | File[]) => {
      const filesToUpload = Array.from(fileList)

      if (!config.multiple && filesToUpload.length > 1) {
        const error = '단일 파일만 업로드 가능합니다.'
        setError(error)
        options?.onError?.(error)
        return
      }

      const maxUpload = Math.min(filesToUpload.length, config.maxCount - files.length)
      if (maxUpload < filesToUpload.length) {
        const error = `최대 ${config.maxCount}개까지 업로드 가능합니다. ${maxUpload}개만 업로드됩니다.`
        setError(error)
        options?.onError?.(error)
      }

      try {
        setError(null)
        setUploading(true)

        const uploadPromises = filesToUpload.slice(0, maxUpload).map(uploadFile)
        const uploadedFiles = await Promise.all(uploadPromises)

        const newFiles = [...files, ...uploadedFiles]
        setFiles(newFiles)
        options?.onUploadComplete?.(newFiles)

        return uploadedFiles
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '파일 업로드 실패'
        setError(errorMessage)
        options?.onError?.(errorMessage)
        throw err
      } finally {
        setUploading(false)
        setUploadProgress(0)
      }
    },
    [config, files, uploadFile, options]
  )

  // 파일 삭제
  const removeFile = useCallback(
    (fileId: string) => {
      setFiles(prev => {
        const newFiles = prev.filter(f => f.id !== fileId)
        options?.onUploadComplete?.(newFiles)
        return newFiles
      })
    },
    [options]
  )

  // 모든 파일 삭제
  const clearFiles = useCallback(() => {
    setFiles([])
    options?.onUploadComplete?.([])
  }, [options])

  // 파일 선택 input 트리거
  const triggerFileSelect = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = config.accept.join(',')
    input.multiple = config.multiple

    input.onchange = e => {
      const target = e.target as HTMLInputElement
      if (target.files && target.files.length > 0) {
        if (config.multiple) {
          uploadMultiple(target.files)
        } else {
          uploadSingle(target.files[0])
        }
      }
    }

    input.click()
  }, [config, uploadSingle, uploadMultiple])

  // 드래그 앤 드롭 핸들러
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const droppedFiles = Array.from(e.dataTransfer.files)
      if (droppedFiles.length > 0) {
        if (config.multiple) {
          uploadMultiple(droppedFiles)
        } else {
          uploadSingle(droppedFiles[0])
        }
      }
    },
    [config.multiple, uploadSingle, uploadMultiple]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  return {
    files,
    uploading,
    uploadProgress,
    error,
    uploadSingle,
    uploadMultiple,
    removeFile,
    clearFiles,
    triggerFileSelect,
    handleDrop,
    handleDragOver,
    config,
  }
}
