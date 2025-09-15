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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, type: 'before' | 'after') => {
    e.preventDefault()
    e.stopPropagation()

    const files = e.dataTransfer.files
    handleFileSelect(files, type)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const togglePhotoCategory = (id: string, currentType: 'before' | 'after') => {
    const sourceFiles = currentType === 'before' ? beforeFiles : afterFiles
    const targetFiles = currentType === 'before' ? afterFiles : beforeFiles
    const setSourceFiles = currentType === 'before' ? setBeforeFiles : setAfterFiles
    const setTargetFiles = currentType === 'before' ? setAfterFiles : setBeforeFiles

    const fileToMove = sourceFiles.find(f => f.id === id)
    if (fileToMove && targetFiles.length < MAX_FILES) {
      setSourceFiles(sourceFiles.filter(f => f.id !== id))
      setTargetFiles([...targetFiles, fileToMove])
      toast.success(`사진이 ${currentType === 'before' ? '보수 후' : '보수 전'}로 이동되었습니다.`)
    } else if (targetFiles.length >= MAX_FILES) {
      toast.error('대상 카테고리가 가득 찼습니다.')
    }
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
      // 로컬 스토리지에 임시 저장 (실제 업로드 API 구현 전)
      const photoData = {
        beforePhotos: beforeFiles.map(f => ({
          id: f.id,
          name: f.name,
          size: f.size,
          type: f.type,
          uploadDate: f.uploadDate,
        })),
        afterPhotos: afterFiles.map(f => ({
          id: f.id,
          name: f.name,
          size: f.size,
          type: f.type,
          uploadDate: f.uploadDate,
        })),
        savedAt: new Date().toISOString(),
      }

      // 로컬 스토리지에 저장
      localStorage.setItem('worklog_photos', JSON.stringify(photoData))

      // 콘솔에 저장 데이터 출력 (main.html과 동일)
      console.log('📸 사진 데이터 저장:', photoData)
      console.log(`보수 전: ${beforeFiles.length}장, 보수 후: ${afterFiles.length}장`)

      toast.success(
        `사진이 저장되었습니다. (보수 전: ${beforeFiles.length}장, 보수 후: ${afterFiles.length}장)`
      )
    } catch (error) {
      console.error('사진 저장 실패:', error)
      toast.error('사진 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className={`section mb-3.5 ${className}`}>
      <div className="work-form-container">
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">사진업로드</h3>
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
                onDrop={e => handleDrop(e, 'before')}
                onDragOver={handleDragOver}
              >
                {beforeFiles.length === 0 ? (
                  <div className="upload-placeholder">
                    <div className="upload-icon">📷</div>
                    <p className="upload-text">사진을 추가하세요</p>
                  </div>
                ) : (
                  <div className="photo-thumbnails-container">
                    {beforeFiles.map(file => (
                      <div key={file.id} className="photo-thumbnail">
                        <img src={file.url} alt={file.name} />
                        <button
                          className="delete-photo-btn"
                          onClick={e => {
                            e.stopPropagation()
                            removeFile(file.id, 'before')
                          }}
                        >
                          ×
                        </button>
                        <button
                          className="move-photo-btn"
                          onClick={e => {
                            e.stopPropagation()
                            togglePhotoCategory(file.id, 'before')
                          }}
                        >
                          ↔
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
                onDrop={e => handleDrop(e, 'after')}
                onDragOver={handleDragOver}
              >
                {afterFiles.length === 0 ? (
                  <div className="upload-placeholder">
                    <div className="upload-icon">📷</div>
                    <p className="upload-text">사진을 추가하세요</p>
                  </div>
                ) : (
                  <div className="photo-thumbnails-container">
                    {afterFiles.map(file => (
                      <div key={file.id} className="photo-thumbnail">
                        <img src={file.url} alt={file.name} />
                        <button
                          className="delete-photo-btn"
                          onClick={e => {
                            e.stopPropagation()
                            removeFile(file.id, 'after')
                          }}
                        >
                          ×
                        </button>
                        <button
                          className="move-photo-btn"
                          onClick={e => {
                            e.stopPropagation()
                            togglePhotoCategory(file.id, 'after')
                          }}
                        >
                          ↔
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
