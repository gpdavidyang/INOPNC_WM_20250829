'use client'

import React, { useState, useRef } from 'react'
import { toast } from 'sonner'

interface PhotoUploadSectionProps {
  className?: string
  onBeforePhotosChange?: (count: number) => void
  onAfterPhotosChange?: (count: number) => void
  onDrawingsChange?: (count: number) => void
}

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadDate: Date
}

export const PhotoUploadSection: React.FC<PhotoUploadSectionProps> = ({
  className = '',
  onBeforePhotosChange,
  onAfterPhotosChange,
  onDrawingsChange,
}) => {
  const [beforeFiles, setBeforeFiles] = useState<UploadedFile[]>([])
  const [afterFiles, setAfterFiles] = useState<UploadedFile[]>([])
  const [drawingFiles, setDrawingFiles] = useState<UploadedFile[]>([])

  const beforeInputRef = useRef<HTMLInputElement>(null)
  const afterInputRef = useRef<HTMLInputElement>(null)
  const drawingInputRef = useRef<HTMLInputElement>(null)

  const MAX_FILES = 10

  const handleFileSelect = (files: FileList | null, type: 'before' | 'after' | 'drawing') => {
    if (!files) return

    const currentFiles =
      type === 'before' ? beforeFiles : type === 'after' ? afterFiles : drawingFiles

    const setFiles =
      type === 'before' ? setBeforeFiles : type === 'after' ? setAfterFiles : setDrawingFiles

    if (currentFiles.length + files.length > MAX_FILES) {
      toast.error(`최대 ${MAX_FILES}개까지 업로드 가능합니다.`)
      return
    }

    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      id: `${Date.now()}_${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      uploadDate: new Date(),
    }))

    const updatedFiles = [...currentFiles, ...newFiles]
    setFiles(updatedFiles)

    // Callback to parent component
    if (type === 'before' && onBeforePhotosChange) {
      onBeforePhotosChange(updatedFiles.length)
    } else if (type === 'after' && onAfterPhotosChange) {
      onAfterPhotosChange(updatedFiles.length)
    } else if (type === 'drawing' && onDrawingsChange) {
      onDrawingsChange(updatedFiles.length)
    }

    toast.success(`${files.length}개 파일이 추가되었습니다.`)
  }

  const removeFile = (id: string, type: 'before' | 'after' | 'drawing') => {
    const setFiles =
      type === 'before' ? setBeforeFiles : type === 'after' ? setAfterFiles : setDrawingFiles

    const currentFiles =
      type === 'before' ? beforeFiles : type === 'after' ? afterFiles : drawingFiles

    const updatedFiles = currentFiles.filter(f => f.id !== id)
    setFiles(updatedFiles)

    // Callback to parent component
    if (type === 'before' && onBeforePhotosChange) {
      onBeforePhotosChange(updatedFiles.length)
    } else if (type === 'after' && onAfterPhotosChange) {
      onAfterPhotosChange(updatedFiles.length)
    } else if (type === 'drawing' && onDrawingsChange) {
      onDrawingsChange(updatedFiles.length)
    }
  }

  return (
    <div className={`photo-upload-section ${className}`}>
      {/* 사진 업로드 - 전/후 분리 */}
      <div className="card p-5 mb-3.5">
        <div className="section-header mb-3">
          <h3 className="section-title">사진 업로드</h3>
          <span className="upload-tag">↔ 전/후 구분</span>
        </div>

        <div className="photo-upload-grid">
          {/* 보수 전 영역 */}
          <div className="upload-area before-area">
            <div className="upload-header">
              <span className="upload-label">보수 전</span>
              <span className="upload-counter">
                <span className="counter-number">{beforeFiles.length}</span>
                <span className="counter-divider">/</span>
                <span className="counter-total">{MAX_FILES}</span>
              </span>
            </div>
            <div className="upload-dropzone" onClick={() => beforeInputRef.current?.click()}>
              {beforeFiles.length === 0 ? (
                <div className="upload-placeholder">
                  <div className="upload-icon" aria-hidden="true">
                    <svg
                      width="36"
                      height="36"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                  <p className="upload-text">사진을 추가하세요</p>
                </div>
              ) : (
                <div className="uploaded-files-grid">
                  {beforeFiles.map(file => (
                    <div key={file.id} className="uploaded-file-thumb">
                      <img src={file.url} alt={file.name} />
                      <button
                        className="file-remove-btn"
                        onClick={e => {
                          e.stopPropagation()
                          removeFile(file.id, 'before')
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input
              ref={beforeInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={e => handleFileSelect(e.target.files, 'before')}
            />
          </div>

          {/* 보수 후 영역 */}
          <div className="upload-area after-area">
            <div className="upload-header">
              <span className="upload-label">보수 후</span>
              <span className="upload-counter">
                <span className="counter-number">{afterFiles.length}</span>
                <span className="counter-divider">/</span>
                <span className="counter-total">{MAX_FILES}</span>
              </span>
            </div>
            <div className="upload-dropzone" onClick={() => afterInputRef.current?.click()}>
              {afterFiles.length === 0 ? (
                <div className="upload-placeholder">
                  <div className="upload-icon" aria-hidden="true">
                    <svg
                      width="36"
                      height="36"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                  <p className="upload-text">사진을 추가하세요</p>
                </div>
              ) : (
                <div className="uploaded-files-grid">
                  {afterFiles.map(file => (
                    <div key={file.id} className="uploaded-file-thumb">
                      <img src={file.url} alt={file.name} />
                      <button
                        className="file-remove-btn"
                        onClick={e => {
                          e.stopPropagation()
                          removeFile(file.id, 'after')
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input
              ref={afterInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={e => handleFileSelect(e.target.files, 'after')}
            />
          </div>
        </div>
      </div>

      {/* 도면 섹션 */}
      <div className="card p-5 drawing-section">
        <div className="section-header mb-3">
          <h3 className="section-title">도면</h3>
          <span className="upload-counter">
            {drawingFiles.length}/{MAX_FILES}
          </span>
        </div>
        <div
          className="upload-dropzone single-upload"
          onClick={() => drawingInputRef.current?.click()}
        >
          {drawingFiles.length === 0 ? (
            <div className="upload-placeholder">
              <div className="upload-icon">📐</div>
              <p className="upload-text">도면을 추가하세요</p>
            </div>
          ) : (
            <div className="uploaded-files-list">
              {drawingFiles.map(file => (
                <div key={file.id} className="uploaded-file-item">
                  <span className="file-name">{file.name}</span>
                  <button
                    className="file-remove-btn"
                    onClick={e => {
                      e.stopPropagation()
                      removeFile(file.id, 'drawing')
                    }}
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <input
          ref={drawingInputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          hidden
          onChange={e => handleFileSelect(e.target.files, 'drawing')}
        />
      </div>
    </div>
  )
}

export default PhotoUploadSection
