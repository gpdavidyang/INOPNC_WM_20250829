'use client'

import React, { useRef } from 'react'
import { WorkLogAttachments, AttachedFile } from '../../types/work-log.types'
import { useFileUpload } from '../../hooks/use-file-upload'
import { formatFileSize } from '../../utils/work-log-utils'

interface FileUploadSectionProps {
  attachments: WorkLogAttachments
  onChange: (attachments: WorkLogAttachments) => void
  readonly?: boolean
}

export const FileUploadSection: React.FC<FileUploadSectionProps> = React.memo(
  ({ attachments, onChange, readonly = false }) => {
    const photosUpload = useFileUpload('photos', {
      onUploadComplete: files => {
        onChange({ ...attachments, photos: files })
      },
    })

    const drawingsUpload = useFileUpload('drawings', {
      onUploadComplete: files => {
        onChange({ ...attachments, drawings: files })
      },
    })

    const confirmationsUpload = useFileUpload('confirmations', {
      onUploadComplete: files => {
        onChange({ ...attachments, confirmations: files })
      },
    })

    const renderUploadArea = React.useCallback(
      (
        type: keyof WorkLogAttachments,
        upload: ReturnType<typeof useFileUpload>,
        icon: React.ReactNode,
        label: string,
        color: string
      ) => {
        const files = attachments[type]
        const hasFiles = files.length > 0

        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {icon}
              <span className="font-medium text-gray-700">{label}</span>
              <span className="text-sm text-gray-500">
                ({files.length}/{upload.config.maxCount})
              </span>
            </div>

            {!readonly && (
              <div
                onClick={upload.triggerFileSelect}
                onDrop={upload.handleDrop}
                onDragOver={upload.handleDragOver}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-300 transform
              ${upload.uploading ? 'bg-gray-50 cursor-wait scale-95' : 'hover:bg-gray-50 hover:scale-105 active:scale-95'}
              ${upload.error ? 'border-red-300 bg-red-50 animate-pulse' : `border-${color}-300 hover:border-${color}-400 hover:shadow-lg`}
            `}
              >
                {upload.uploading ? (
                  <div className="space-y-2">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
                    <p className="text-sm text-gray-600">업로드 중... {upload.uploadProgress}%</p>
                  </div>
                ) : (
                  <>
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className={`mx-auto mb-2 text-${color}-400`}
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <p className="text-sm text-gray-600 mb-1">파일을 드래그하거나 클릭하여 선택</p>
                    <p className="text-xs text-gray-500">
                      최대 {formatFileSize(upload.config.maxSize)} /{' '}
                      {upload.config.accept.join(', ')}
                    </p>
                  </>
                )}
              </div>
            )}

            {upload.error && <p className="text-sm text-red-500">{upload.error}</p>}

            {hasFiles && (
              <div className="space-y-2">
                {type === 'photos' ? (
                  // 사진 썸네일 그리드
                  <div className="grid grid-cols-4 gap-2">
                    {files.map((file, index) => (
                      <div
                        key={file.id}
                        className="relative group animate-fadeIn"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden transition-transform duration-200 hover:scale-105">
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-full object-cover transition-opacity duration-200 hover:opacity-90"
                          />
                        </div>
                        {!readonly && (
                          <button
                            onClick={() => upload.removeFile(file.id)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                            >
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  // 일반 파일 리스트
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg transition-all duration-200 hover:bg-gray-100 hover:shadow-sm animate-fadeIn"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center transition-transform duration-200 hover:scale-110`}
                          >
                            {type === 'drawings' ? (
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className={`text-${color}-500`}
                              >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                              </svg>
                            ) : (
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className={`text-${color}-500`}
                              >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <polyline points="16 11 12 15 10 13" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        {!readonly && (
                          <button
                            onClick={() => upload.removeFile(file.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      },
      [attachments, readonly]
    )

    return (
      <div className="space-y-6">
        <h3 className="font-semibold text-gray-900">첨부파일</h3>

        {/* 사진 업로드 */}
        {renderUploadArea(
          'photos',
          photosUpload,
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-blue-500"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>,
          '사진',
          'blue'
        )}

        {/* 도면 업로드 */}
        {renderUploadArea(
          'drawings',
          drawingsUpload,
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-green-500"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>,
          '도면',
          'green'
        )}

        {/* 확인서 업로드 */}
        {renderUploadArea(
          'confirmations',
          confirmationsUpload,
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-red-500"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <polyline points="16 11 12 15 10 13" />
          </svg>,
          '확인서',
          'red'
        )}
      </div>
    )
  }
)
