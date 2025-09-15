'use client'

import React, { useState, useRef } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface DrawingUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: (file: UploadedFile) => void
  siteId?: string
  userId?: string
}

interface UploadedFile {
  id: string
  name: string
  url: string
  size: number
  type: string
  uploadDate: Date
}

export const DrawingUploadModal: React.FC<DrawingUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  siteId,
  userId,
}) => {
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saveToShared, setSaveToShared] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 파일 크기 체크 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('파일 크기는 10MB 이하여야 합니다.')
      return
    }

    // 파일 타입 체크
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast.error('JPG, PNG, WebP, PDF 파일만 업로드 가능합니다.')
      return
    }

    setSelectedFile(file)
    setTitle(file.name.split('.')[0]) // 파일명을 기본 제목으로

    // 이미지 미리보기
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = e => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !title || !siteId) {
      toast.error('파일과 제목을 입력해주세요.')
      return
    }

    setUploading(true)
    const supabase = createClient()

    try {
      // 1. Storage에 파일 업로드
      const fileName = `drawings/${siteId}/${Date.now()}_${selectedFile.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile)

      if (uploadError) throw uploadError

      // 2. 공개 URL 가져오기
      const {
        data: { publicUrl },
      } = supabase.storage.from('documents').getPublicUrl(fileName)

      // 3. 공유문서함에 저장 (선택한 경우)
      if (saveToShared) {
        const { error: dbError } = await supabase.from('unified_documents').insert({
          title,
          description,
          file_url: publicUrl,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
          category_type: 'drawing',
          sub_type: 'uploaded',
          site_id: siteId,
          uploaded_by: userId,
          status: 'active',
        })

        if (dbError) throw dbError
      }

      // 4. 성공 처리
      const uploadedFile: UploadedFile = {
        id: `upload_${Date.now()}`,
        name: title,
        url: publicUrl,
        size: selectedFile.size,
        type: selectedFile.type,
        uploadDate: new Date(),
      }

      onUploadSuccess(uploadedFile)
      toast.success('도면 업로드 완료!')

      // 초기화
      setSelectedFile(null)
      setPreviewUrl(null)
      setTitle('')
      setDescription('')
      onClose()
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content drawing-upload-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">새 도면 업로드</h3>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* 파일 선택 영역 */}
          <div className="upload-area">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {selectedFile ? (
              <div className="file-preview">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="preview-image" />
                ) : (
                  <div className="pdf-preview">
                    <span className="pdf-icon">📄</span>
                    <p>{selectedFile.name}</p>
                  </div>
                )}
                <button
                  className="btn btn-outline btn-small"
                  onClick={() => fileInputRef.current?.click()}
                >
                  다른 파일 선택
                </button>
              </div>
            ) : (
              <button className="upload-trigger" onClick={() => fileInputRef.current?.click()}>
                <span className="upload-icon">📁</span>
                <p>클릭하여 파일 선택</p>
                <p className="upload-hint">JPG, PNG, WebP, PDF (최대 10MB)</p>
              </button>
            )}
          </div>

          {/* 파일 정보 입력 */}
          {selectedFile && (
            <>
              <div className="form-group">
                <label htmlFor="title">제목 *</label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="도면 제목을 입력하세요"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">설명</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="도면 설명 (선택사항)"
                  className="form-textarea"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={saveToShared}
                    onChange={e => setSaveToShared(e.target.checked)}
                  />
                  <span>공유문서함에 저장</span>
                </label>
                <p className="form-hint">체크하면 팀원들과 공유할 수 있는 문서함에 저장됩니다.</p>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={uploading}>
            취소
          </button>
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!selectedFile || !title || uploading}
          >
            {uploading ? '업로드 중...' : '업로드'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DrawingUploadModal
