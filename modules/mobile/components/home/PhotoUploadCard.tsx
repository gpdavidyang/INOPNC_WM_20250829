'use client'

import React, { useState, useRef } from 'react'
import { toast } from 'sonner'

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadDate: Date
}

interface PhotoUploadCardProps {
  className?: string
}

export const PhotoUploadCard: React.FC<PhotoUploadCardProps> = ({ className = '' }) => {
  const [beforeFiles, setBeforeFiles] = useState<UploadedFile[]>([])
  const [afterFiles, setAfterFiles] = useState<UploadedFile[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const beforeInputRef = useRef<HTMLInputElement>(null)
  const afterInputRef = useRef<HTMLInputElement>(null)

  const MAX_FILES = 30

  const handleFileSelect = (files: FileList | null, type: 'before' | 'after') => {
    if (!files) return

    const currentFiles = type === 'before' ? beforeFiles : afterFiles
    const setFiles = type === 'before' ? setBeforeFiles : setAfterFiles

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
    toast.success(`${files.length}개 파일이 추가되었습니다.`)
  }

  const removeFile = (id: string, type: 'before' | 'after') => {
    const setFiles = type === 'before' ? setBeforeFiles : setAfterFiles
    const currentFiles = type === 'before' ? beforeFiles : afterFiles
    const updatedFiles = currentFiles.filter(f => f.id !== id)
    setFiles(updatedFiles)
  }

  const handleReset = () => {
    setBeforeFiles([])
    setAfterFiles([])
    toast.info('사진이 모두 초기화되었습니다.')
  }

  const handleSave = async () => {
    if (beforeFiles.length === 0 && afterFiles.length === 0) {
      toast.error('업로드할 사진을 선택해주세요.')
      return
    }

    setIsSaving(true)
    try {
      // TODO: API call to save photos
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      toast.success('사진이 저장되었습니다.')
    } catch (error) {
      toast.error('사진 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className={`section mb-3.5 ${className}`}>
      <div className="work-form-container">
        <div className="form-section">
          <div className="section-header mb-3">
            <h3 className="section-title">사진 업로드</h3>
            <span className="upload-hint">↔ 전/후 업로드</span>
          </div>

          <div className="photo-upload-grid">
            {/* 보수 전 영역 */}
            <div className="photo-upload-item">
              <div className="upload-header">
                <span className="upload-title">보수 전</span>
                <div className="upload-counter">
                  <span className="counter-number">{beforeFiles.length}</span>
                  <span className="counter-total">/{MAX_FILES}</span>
                </div>
              </div>
              <div
                className="upload-area before-area"
                onClick={() => beforeInputRef.current?.click()}
              >
                {beforeFiles.length === 0 ? (
                  <div className="upload-placeholder">
                    <div className="upload-icon">📷</div>
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
            <div className="photo-upload-item">
              <div className="upload-header">
                <span className="upload-title">보수 후</span>
                <div className="upload-counter">
                  <span className="counter-number">{afterFiles.length}</span>
                  <span className="counter-total">/{MAX_FILES}</span>
                </div>
              </div>
              <div
                className="upload-area after-area"
                onClick={() => afterInputRef.current?.click()}
              >
                {afterFiles.length === 0 ? (
                  <div className="upload-placeholder">
                    <div className="upload-icon">📷</div>
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

          {/* 액션 버튼들 */}
          <div className="upload-actions">
            <button className="btn btn-secondary" onClick={handleReset} disabled={isSaving}>
              처음부터
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PhotoUploadCard
