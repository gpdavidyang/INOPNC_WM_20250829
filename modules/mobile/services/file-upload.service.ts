import { createClient } from '@/lib/supabase/client'
import { AttachedFile } from '../types/work-log.types'

const supabase = createClient()

export interface FileUploadProgress {
  loaded: number
  total: number
  percentage: number
}

/**
 * 파일 업로드 서비스
 */
export class FileUploadService {
  /**
   * 단일 파일 업로드
   */
  static async uploadFile(
    file: File,
    bucket: string = 'work-log-attachments',
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<AttachedFile> {
    try {
      // 파일명 생성 (타임스탬프 + 원본 파일명)
      const timestamp = Date.now()
      const fileName = `${timestamp}_${file.name}`
      const filePath = `uploads/${fileName}`

      // Supabase Storage에 파일 업로드
      const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

      if (error) {
        throw new Error(`파일 업로드 실패: ${error.message}`)
      }

      // 업로드된 파일의 공개 URL 가져오기
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)

      if (!urlData.publicUrl) {
        throw new Error('파일 URL 생성 실패')
      }

      // AttachedFile 객체 반환
      return {
        id: timestamp.toString(),
        url: urlData.publicUrl,
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      }
    } catch (error) {
      console.error('FileUploadService.uploadFile error:', error)
      throw error
    }
  }

  /**
   * 다중 파일 업로드
   */
  static async uploadMultipleFiles(
    files: File[],
    bucket: string = 'work-log-attachments',
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<AttachedFile[]> {
    try {
      const uploadPromises = files.map((file, index) =>
        this.uploadFile(file, bucket, fileProgress => {
          if (onProgress) {
            const totalProgress = {
              loaded: index * 100 + fileProgress.percentage,
              total: files.length * 100,
              percentage: Math.round((index * 100 + fileProgress.percentage) / files.length),
            }
            onProgress(totalProgress)
          }
        })
      )

      const results = await Promise.all(uploadPromises)
      return results
    } catch (error) {
      console.error('FileUploadService.uploadMultipleFiles error:', error)
      throw error
    }
  }

  /**
   * 파일 삭제
   */
  static async deleteFile(fileUrl: string, bucket: string = 'work-log-attachments'): Promise<void> {
    try {
      // URL에서 파일 경로 추출
      const url = new URL(fileUrl)
      const pathSegments = url.pathname.split('/')
      const bucketIndex = pathSegments.indexOf(bucket)

      if (bucketIndex === -1) {
        throw new Error('잘못된 파일 URL입니다.')
      }

      const filePath = pathSegments.slice(bucketIndex + 1).join('/')

      const { error } = await supabase.storage.from(bucket).remove([filePath])

      if (error) {
        throw new Error(`파일 삭제 실패: ${error.message}`)
      }
    } catch (error) {
      console.error('FileUploadService.deleteFile error:', error)
      throw error
    }
  }

  /**
   * 파일 타입별 버킷 매핑
   */
  static getBucketForFileType(type: 'photos' | 'drawings' | 'confirmations'): string {
    const bucketMap = {
      photos: 'work-log-photos',
      drawings: 'work-log-drawings',
      confirmations: 'work-log-confirmations',
    }
    return bucketMap[type] || 'work-log-attachments'
  }

  /**
   * 파일 유효성 검사
   */
  static validateFile(
    file: File,
    maxSize: number = 10 * 1024 * 1024, // 10MB
    allowedTypes: string[] = ['image/*', 'application/pdf', '.dwg', '.dxf']
  ): { isValid: boolean; error?: string } {
    // 파일 크기 검사
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `파일 크기는 ${this.formatFileSize(maxSize)}를 초과할 수 없습니다.`,
      }
    }

    // 파일 타입 검사
    const isValidType = allowedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase())
      }
      if (type.includes('*')) {
        const baseType = type.split('/')[0]
        return file.type.startsWith(baseType)
      }
      return file.type === type
    })

    if (!isValidType) {
      return {
        isValid: false,
        error: '지원하지 않는 파일 형식입니다.',
      }
    }

    return { isValid: true }
  }

  /**
   * 파일 크기 포맷팅
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 이미지 파일 리사이징 (클라이언트 사이드)
   */
  static async resizeImage(
    file: File,
    maxWidth: number = 1920,
    maxHeight: number = 1080,
    quality: number = 0.8
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // 비율 계산
        let { width, height } = img

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }

        canvas.width = width
        canvas.height = height

        // 이미지 그리기
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          blob => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              })
              resolve(resizedFile)
            } else {
              reject(new Error('이미지 리사이징 실패'))
            }
          },
          file.type,
          quality
        )
      }

      img.onerror = () => reject(new Error('이미지 로드 실패'))
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * 드래그 앤 드롭 파일 처리
   */
  static extractFilesFromDataTransfer(dataTransfer: DataTransfer): File[] {
    const files: File[] = []

    if (dataTransfer.items) {
      // DataTransferItemList 사용
      for (let i = 0; i < dataTransfer.items.length; i++) {
        const item = dataTransfer.items[i]
        if (item.kind === 'file') {
          const file = item.getAsFile()
          if (file) files.push(file)
        }
      }
    } else {
      // FileList 사용 (폴백)
      for (let i = 0; i < dataTransfer.files.length; i++) {
        files.push(dataTransfer.files[i])
      }
    }

    return files
  }
}
