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
  raw?: File
}

interface PhotoUploadCardProps {
  className?: string
}

export const PhotoUploadCard: React.FC<
  PhotoUploadCardProps & { selectedSite?: string; workDate?: string }
> = ({ className = '', selectedSite, workDate }) => {
  const [beforeFiles, setBeforeFiles] = useState<UploadedFile[]>([])
  const [afterFiles, setAfterFiles] = useState<UploadedFile[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [lastSaveInfo, setLastSaveInfo] = useState<{ before: number; after: number } | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)

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
      raw: file,
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
    setLastSavedAt(null)
    setLastSaveInfo(null)
    setLastError(null)
    toast.info('사진이 모두 초기화되었습니다.')
  }

  const handleSave = async () => {
    if (beforeFiles.length === 0 && afterFiles.length === 0) {
      toast.error('업로드할 사진을 선택해주세요.')
      return
    }

    setIsSaving(true)
    try {
      // Ensure we have site/date
      if (!selectedSite || !workDate) {
        toast.error('현장/작업일자를 먼저 선택해주세요.')
        setIsSaving(false)
        return
      }

      // 1) Ensure draft daily report exists (or update if exists)
      const ensureRes = await fetch('/api/mobile/daily-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: selectedSite,
          work_date: workDate,
          status: 'draft',
          work_description: '사진 업로드',
          total_workers: 0,
        }),
      })
      const ensureJson = await ensureRes.json()
      if (!ensureRes.ok) {
        throw new Error(ensureJson?.error || ensureJson?.details || '작업일지 생성에 실패했습니다.')
      }
      const reportId = ensureJson?.data?.id
      if (!reportId) throw new Error('작업일지 ID를 확인할 수 없습니다.')

      // 2) Upload additional photos directly
      const form = new FormData()
      beforeFiles.forEach(f => f.raw && form.append('before_photos', f.raw!, f.name))
      afterFiles.forEach(f => f.raw && form.append('after_photos', f.raw!, f.name))

      const upRes = await fetch(
        `/api/mobile/daily-reports/${encodeURIComponent(reportId)}/additional-photos`,
        {
          method: 'POST',
          body: form,
        }
      )
      const upJson = await upRes.json()
      if (!upRes.ok || upJson?.error) {
        const msg = upJson?.error || (Array.isArray(upJson?.errors) && upJson.errors[0])
        throw new Error(msg || '추가 사진 업로드에 실패했습니다.')
      }

      // 3) Local fallback save for UX continuity
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
        `사진이 업로드되었습니다. (보수 전: ${beforeFiles.length}장, 보수 후: ${afterFiles.length}장)`
      )
      setLastSavedAt(photoData.savedAt)
      setLastSaveInfo({ before: beforeFiles.length, after: afterFiles.length })
      setLastError(null)
    } catch (error) {
      console.error('사진 저장 실패:', error)
      toast.error('사진 저장에 실패했습니다.')
      setLastError('사진 저장에 실패했습니다. 네트워크 또는 저장공간을 확인해주세요.')
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
            <span className="form-note">↔ 전/후 업로드</span>
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
                    <div
                      className="upload-icon"
                      aria-hidden="true"
                      style={{ transform: 'scale(0.8)' }}
                    >
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
                    <p className="upload-text" style={{ fontSize: 12 }}>
                      사진을 추가하세요
                    </p>
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
                    <div
                      className="upload-icon"
                      aria-hidden="true"
                      style={{ transform: 'scale(0.8)' }}
                    >
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
                    <p className="upload-text" style={{ fontSize: 12 }}>
                      사진을 추가하세요
                    </p>
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

          {/* 저장 상태 안내 영역 */}
          <div className="upload-status" style={{ marginTop: 8 }}>
            {lastSavedAt && lastSaveInfo && (
              <p className="upload-status-ok">
                저장 완료: {new Date(lastSavedAt).toLocaleString('ko-KR')} • 보수 전{' '}
                {lastSaveInfo.before}장 / 보수 후 {lastSaveInfo.after}장
              </p>
            )}
            {lastError && (
              <p className="text-sm" style={{ color: '#b91c1c' }}>
                {lastError}
              </p>
            )}
            {!lastSavedAt && !lastError && (
              <p className="materials-hint mt-2">
                저장하기를 누르면 선택한 사진 목록이 기기에 임시 저장 됨. 작업일지 제출 시 서버로
                함께 업로드 됨.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default PhotoUploadCard
