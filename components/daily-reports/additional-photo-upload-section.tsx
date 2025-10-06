'use client'

import React, { useCallback, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { AdditionalPhotoData } from '@/types/daily-reports'

type FileValidationError = { code: string; message: string; filename?: string }

function validateFiles(
  files: File[],
  opts: { maxFileSize: number; allowedTypes: string[]; maxFilesPerType: number }
) {
  const errors: FileValidationError[] = []
  for (const f of files) {
    if (!opts.allowedTypes.includes(f.type)) {
      errors.push({ code: 'TYPE', message: '지원하지 않는 파일 형식입니다.', filename: f.name })
    }
    if (f.size > opts.maxFileSize) {
      errors.push({ code: 'SIZE', message: '파일 크기가 너무 큽니다.', filename: f.name })
    }
  }
  return { errors }
}

interface AdditionalPhotoUploadSectionProps {
  beforePhotos: AdditionalPhotoData[]
  afterPhotos: AdditionalPhotoData[]
  onBeforePhotosChange: (photos: AdditionalPhotoData[]) => void
  onAfterPhotosChange: (photos: AdditionalPhotoData[]) => void
  maxPhotosPerType?: number
  maxFileSize?: number // in bytes
  disabled?: boolean
}

const MAX_PHOTOS_PER_TYPE = 30
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export default function AdditionalPhotoUploadSection({
  beforePhotos,
  afterPhotos,
  onBeforePhotosChange,
  onAfterPhotosChange,
  maxPhotosPerType = MAX_PHOTOS_PER_TYPE,
  maxFileSize = MAX_FILE_SIZE,
  disabled = false,
}: AdditionalPhotoUploadSectionProps) {
  const [activeTab, setActiveTab] = useState<'before' | 'after'>('before')
  const [dragOver, setDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [errors, setErrors] = useState<FileValidationError[]>([])

  const beforeInputRef = useRef<HTMLInputElement>(null)
  const afterInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(
    (files: FileList, photoType: 'before' | 'after') => {
      const currentPhotos = photoType === 'before' ? beforePhotos : afterPhotos
      const remainingSlots = maxPhotosPerType - currentPhotos.length

      if (remainingSlots <= 0) {
        setErrors([
          {
            code: 'TOO_MANY_FILES',
            message: `${photoType === 'before' ? '작업전' : '작업후'} 사진은 최대 ${maxPhotosPerType}장까지 업로드할 수 있습니다.`,
          },
        ])
        return
      }

      const filesToProcess = Array.from(files).slice(0, remainingSlots)

      // 파일 검증
      const validationResult = validateFiles(filesToProcess, {
        maxFileSize,
        allowedTypes: ALLOWED_TYPES,
        maxFilesPerType: remainingSlots,
      })

      setErrors(validationResult.errors)

      // 유효한 파일들로만 AdditionalPhotoData 생성
      const newPhotos: AdditionalPhotoData[] = []
      const validFiles = filesToProcess.filter(file => {
        // 해당 파일에 대한 에러가 없는지 확인
        return !validationResult.errors.some(error => error.filename === file.name)
      })

      validFiles.forEach((file, index) => {
        const photoData: AdditionalPhotoData = {
          id: `temp-${Date.now()}-${index}`,
          file,
          filename: file.name,
          photo_type: photoType,
          file_size: file.size,
          upload_order: currentPhotos.length + newPhotos.length + 1,
          description: '',
        }
        newPhotos.push(photoData)
      })

      if (newPhotos.length > 0) {
        const updateHandler = photoType === 'before' ? onBeforePhotosChange : onAfterPhotosChange
        updateHandler([...currentPhotos, ...newPhotos])
      }
    },
    [
      beforePhotos,
      afterPhotos,
      maxPhotosPerType,
      maxFileSize,
      onBeforePhotosChange,
      onAfterPhotosChange,
    ]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent, photoType: 'before' | 'after') => {
      e.preventDefault()
      setDragOver(false)

      if (disabled) return

      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleFileSelect(files, photoType)
      }
    },
    [handleFileSelect, disabled]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled) setDragOver(true)
    },
    [disabled]
  )

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const removePhoto = useCallback(
    (photoId: string, photoType: 'before' | 'after') => {
      const currentPhotos = photoType === 'before' ? beforePhotos : afterPhotos
      const updatedPhotos = currentPhotos.filter(photo => photo.id !== photoId)

      // 순서 재정렬
      const reorderedPhotos = updatedPhotos.map((photo, index) => ({
        ...photo,
        upload_order: index + 1,
      }))

      const updateHandler = photoType === 'before' ? onBeforePhotosChange : onAfterPhotosChange
      updateHandler(reorderedPhotos)
    },
    [beforePhotos, afterPhotos, onBeforePhotosChange, onAfterPhotosChange]
  )

  const updatePhotoDescription = useCallback(
    (photoId: string, description: string, photoType: 'before' | 'after') => {
      const currentPhotos = photoType === 'before' ? beforePhotos : afterPhotos
      const updatedPhotos = currentPhotos.map(photo =>
        photo.id === photoId ? { ...photo, description } : photo
      )

      const updateHandler = photoType === 'before' ? onBeforePhotosChange : onAfterPhotosChange
      updateHandler(updatedPhotos)
    },
    [beforePhotos, afterPhotos, onBeforePhotosChange, onAfterPhotosChange]
  )

  const getImagePreviewUrl = useCallback((photo: AdditionalPhotoData) => {
    if (photo.url) return photo.url
    if (photo.file) return URL.createObjectURL(photo.file)
    return null
  }, [])

  const openFileDialog = useCallback((photoType: 'before' | 'after') => {
    const inputRef = photoType === 'before' ? beforeInputRef : afterInputRef
    inputRef.current?.click()
  }, [])

  const renderPhotoGrid = useCallback(
    (photos: AdditionalPhotoData[], photoType: 'before' | 'after') => {
      if (photos.length === 0) {
        return (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <ImageIcon className="h-8 w-8 opacity-40" />
            </div>
            <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
              {photoType === 'before' ? '작업전' : '작업후'} 사진이 없습니다
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              위의 업로드 영역을 사용하여 사진을 추가해보세요
            </p>
          </div>
        )
      }

      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, index) => {
            const previewUrl = getImagePreviewUrl(photo)
            return (
              <div key={photo.id} className="relative group">
                {/* 사진 미리보기 */}
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 group-hover:shadow-md transition-all duration-200">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={`${photoType} photo ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}

                  {/* 삭제 버튼 */}
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id!, photoType)}
                    disabled={disabled}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 hover:scale-110 disabled:opacity-50 shadow-lg"
                    title="사진 삭제"
                  >
                    <X className="h-3 w-3" />
                  </button>

                  {/* 순서 표시 */}
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md font-medium">
                    #{photo.upload_order}
                  </div>

                  {/* 파일 크기 표시 */}
                  {photo.file_size && (
                    <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md">
                      {Math.round(photo.file_size / 1024)}KB
                    </div>
                  )}
                </div>

                {/* 설명 입력 */}
                <div className="mt-3">
                  <textarea
                    value={photo.description || ''}
                    onChange={e => updatePhotoDescription(photo.id!, e.target.value, photoType)}
                    placeholder="사진 설명을 입력하세요..."
                    disabled={disabled}
                    className="w-full text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 resize-none disabled:opacity-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    rows={2}
                    maxLength={100}
                  />
                  {photo.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                      {photo.description.length}/100
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )
    },
    [getImagePreviewUrl, removePhoto, updatePhotoDescription, disabled]
  )

  const currentPhotos = activeTab === 'before' ? beforePhotos : afterPhotos
  const remainingSlots = maxPhotosPerType - currentPhotos.length

  return (
    <div className="space-y-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-gray-700">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">추가 사진 업로드</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            작업전후 사진을 별도로 관리할 수 있습니다
          </p>
        </div>
      </div>

      {/* 탭 헤더 */}
      <div className="flex bg-gray-50 dark:bg-gray-800 rounded-t-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setActiveTab('before')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 ${
            activeTab === 'before'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border-r border-gray-200 dark:border-gray-600'
              : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-750'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <span>작업전</span>
            <span
              className={`px-2 py-0.5 text-xs rounded-full ${
                activeTab === 'before'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
              }`}
            >
              {beforePhotos.length}/{maxPhotosPerType}
            </span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('after')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 ${
            activeTab === 'after'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border-l border-gray-200 dark:border-gray-600'
              : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-750'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <span>작업후</span>
            <span
              className={`px-2 py-0.5 text-xs rounded-full ${
                activeTab === 'after'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
              }`}
            >
              {afterPhotos.length}/{maxPhotosPerType}
            </span>
          </div>
        </button>
      </div>

      {/* 에러 메시지 */}
      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div className="ml-2">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-400">업로드 오류</h4>
              <div className="mt-1 text-xs text-red-700 dark:text-red-300">
                {errors.map((error, index) => (
                  <p key={index}>
                    {error.filename ? `${error.filename}: ` : ''}
                    {error.message}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 업로드 영역 */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
          dragOver
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-[1.01] shadow-lg'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50'} ${
          remainingSlots === 0 ? 'opacity-60 cursor-not-allowed' : ''
        }`}
        onDrop={e => handleDrop(e, activeTab)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && remainingSlots > 0 && openFileDialog(activeTab)}
      >
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div
              className={`p-3 rounded-full ${dragOver ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-700'} transition-colors`}
            >
              <Upload className={`h-6 w-6 ${dragOver ? 'text-blue-500' : 'text-gray-400'}`} />
            </div>
            <div
              className={`p-3 rounded-full ${dragOver ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-700'} transition-colors`}
            >
              <Camera className={`h-6 w-6 ${dragOver ? 'text-blue-500' : 'text-gray-400'}`} />
            </div>
          </div>

          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {activeTab === 'before' ? '작업전' : '작업후'} 사진 업로드
          </h3>

          {remainingSlots > 0 ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                파일을 드래그하거나 클릭하여 선택하세요
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="hidden sm:inline">최대 </span>
                  {remainingSlots}장<span className="hidden sm:inline"> 더 업로드 가능</span>
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  JPG, PNG, WEBP
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="hidden sm:inline">파일당 </span>최대{' '}
                  {Math.round(maxFileSize / 1024 / 1024)}MB
                </span>
              </div>
            </>
          ) : (
            <div className="text-center">
              <p className="text-sm text-orange-600 dark:text-orange-400 mb-2 font-medium">
                최대 업로드 개수에 도달했습니다
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                사진을 삭제한 후 새로운 사진을 업로드할 수 있습니다
              </p>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={activeTab === 'before' ? beforeInputRef : afterInputRef}
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(',')}
          onChange={e => e.target.files && handleFileSelect(e.target.files, activeTab)}
          disabled={disabled || remainingSlots === 0}
          className="hidden"
        />
      </div>

      {/* 사진 그리드 */}
      <div className="min-h-[200px]">{renderPhotoGrid(currentPhotos, activeTab)}</div>

      {/* 업로드 버튼 */}
      {remainingSlots > 0 && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => openFileDialog(activeTab)}
            disabled={disabled}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            {activeTab === 'before' ? '작업전' : '작업후'} 사진 추가
          </button>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 px-2">
            {remainingSlots}장 남음
          </div>
        </div>
      )}
    </div>
  )
}
