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
    try {
      // 로컬 스토리지에서 도면 데이터 불러오기
      const savedData = localStorage.getItem('worklog_drawings')
      if (savedData) {
        const parsed = JSON.parse(savedData)
        toast.success(`저장된 도면 ${parsed.drawings?.length || 0}개를 불러왔습니다.`)
        console.log('📐 불러온 도면 데이터:', parsed)
      } else {
        toast.info('저장된 도면이 없습니다.')
      }
    } catch (error) {
      console.error('도면 불러오기 실패:', error)
      toast.error('도면을 불러오는데 실패했습니다.')
    }
  }

  const handleSave = async () => {
    if (drawingFiles.length === 0) {
      toast.error('저장할 도면을 선택해주세요.')
      return
    }

    setIsSaving(true)
    try {
      // 로컬 스토리지에 임시 저장 (실제 업로드 API 구현 전)
      const drawingData = {
        drawings: drawingFiles.map(f => ({
          id: f.id,
          name: f.name,
          size: f.size,
          type: f.type,
          uploadDate: f.uploadDate,
        })),
        savedAt: new Date().toISOString(),
      }

      // 로컬 스토리지에 저장
      localStorage.setItem('worklog_drawings', JSON.stringify(drawingData))

      // 콘솔에 저장 데이터 출력 (main.html과 동일)
      console.log('📐 도면 데이터 저장:', drawingData)
      console.log(`도면 ${drawingFiles.length}개 저장됨`)

      toast.success(`도면이 저장되었습니다. (${drawingFiles.length}개 파일)`)
    } catch (error) {
      console.error('도면 저장 실패:', error)
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
