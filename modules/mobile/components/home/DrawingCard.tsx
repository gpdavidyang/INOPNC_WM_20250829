'use client'

import React, { useState, useRef } from 'react'
import { toast } from 'sonner'

interface DrawingFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadDate: Date
}

interface DrawingCardProps {
  className?: string
}

export const DrawingCard: React.FC<DrawingCardProps> = ({ className = '' }) => {
  const [drawingFiles, setDrawingFiles] = useState<DrawingFile[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_FILES = 10

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    if (drawingFiles.length + files.length > MAX_FILES) {
      toast.error(`최대 ${MAX_FILES}개까지 업로드 가능합니다.`)
      return
    }

    const newFiles: DrawingFile[] = Array.from(files).map(file => ({
      id: `${Date.now()}_${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      uploadDate: new Date(),
    }))

    const updatedFiles = [...drawingFiles, ...newFiles]
    setDrawingFiles(updatedFiles)
    toast.success(`${files.length}개 도면이 추가되었습니다.`)
  }

  const removeFile = (id: string) => {
    const updatedFiles = drawingFiles.filter(f => f.id !== id)
    setDrawingFiles(updatedFiles)
    toast.info('도면이 삭제되었습니다.')
  }

  const handleUpload = () => {
    fileInputRef.current?.click()
  }

  const handleLoad = async () => {
    // TODO: Implement loading saved drawings
    toast.info('저장된 도면을 불러오는 기능은 준비 중입니다.')
  }

  const handleSave = async () => {
    if (drawingFiles.length === 0) {
      toast.error('저장할 도면을 선택해주세요.')
      return
    }

    setIsSaving(true)
    try {
      // TODO: API call to save drawings
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      toast.success('도면이 저장되었습니다.')
    } catch (error) {
      toast.error('도면 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <section className={`section mb-3.5 ${className}`}>
      <div className="work-form-container">
        <div className="form-section drawing-section">
          <div className="section-header mb-3">
            <h3 className="section-title">도면마킹</h3>
            <span className="upload-counter">
              {drawingFiles.length}/{MAX_FILES}
            </span>
          </div>

          {/* 도면 목록 표시 영역 */}
          {drawingFiles.length > 0 && (
            <div className="drawing-files-list mb-3">
              {drawingFiles.map(file => (
                <div key={file.id} className="drawing-file-item">
                  <div className="file-info">
                    <span className="file-icon">📐</span>
                    <div className="file-details">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                  <button
                    className="file-remove-btn"
                    onClick={() => removeFile(file.id)}
                    aria-label="도면 삭제"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 도면이 없을 때 플레이스홀더 */}
          {drawingFiles.length === 0 && (
            <div className="drawing-placeholder mb-3">
              <div className="placeholder-icon">📐</div>
              <p className="placeholder-text">도면을 업로드하거나 불러오세요</p>
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="drawing-actions">
            <button className="btn btn-outline" onClick={handleUpload} disabled={isSaving}>
              업로드
            </button>
            <button className="btn btn-secondary" onClick={handleLoad} disabled={isSaving}>
              불러오기
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? '저장 중...' : '저장하기'}
            </button>
          </div>

          {/* 숨겨진 파일 입력 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,.dwg,.dxf"
            multiple
            hidden
            onChange={e => handleFileSelect(e.target.files)}
          />
        </div>
      </div>
    </section>
  )
}

export default DrawingCard
