'use client'

import React, { useRef, useState } from 'react'
import { Modal } from '@/modules/mobile/components/common/Modal'

interface DocumentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  documentId?: string
  documentTitle?: string
  documentType?: string
  isPublic?: boolean
  onUploadComplete?: (uploaded: any[]) => void
}

interface UploadState {
  file: File | null
  isUploading: boolean
  error: string | null
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  documentType,
  isPublic = false,
  onUploadComplete,
}) => {
  const [state, setState] = useState<UploadState>({ file: null, isUploading: false, error: null })
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  if (!isOpen) return null

  const resetAndClose = () => {
    setState({ file: null, isUploading: false, error: null })
    onClose()
  }

  const handleSelectFile: React.ChangeEventHandler<HTMLInputElement> = event => {
    const file = event.target.files?.[0]
    if (!file) {
      setState(prev => ({ ...prev, file: null }))
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setState(prev => ({ ...prev, error: '파일 크기는 최대 10MB까지 가능합니다.' }))
      return
    }

    setState({ file, isUploading: false, error: null })
  }

  const handleUpload = async () => {
    if (!state.file) {
      setState(prev => ({ ...prev, error: '업로드할 파일을 선택해주세요.' }))
      return
    }

    setState(prev => ({ ...prev, isUploading: true, error: null }))

    try {
      const formData = new FormData()
      formData.append('file', state.file)
      formData.append('documentType', documentType || 'other')
      formData.append('isPublic', isPublic ? 'true' : 'false')
      formData.append('category', documentId || 'mobile-document')
      formData.append('description', `${documentTitle ?? state.file.name} (모바일 업로드)`)

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody?.error || '업로드에 실패했습니다.')
      }

      const result = await response.json()
      onUploadComplete?.(Array.isArray(result?.data) ? result.data : [result?.data])
      resetAndClose()
    } catch (error) {
      setState(prev => ({
        ...prev,
        isUploading: false,
        error: error instanceof Error ? error.message : '업로드에 실패했습니다.',
      }))
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!state.isUploading) {
          resetAndClose()
        }
      }}
      title={`파일 업로드${documentTitle ? ` - ${documentTitle}` : ''}`}
      size="medium"
      showCloseButton
      closeOnBackdropClick={!state.isUploading}
      closeOnEscape={!state.isUploading}
    >
      <div className="document-upload-modal">
        <div className="upload-field">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleSelectFile}
            disabled={state.isUploading}
          />
          {state.file && (
            <div className="selected-file">
              <span className="file-name">{state.file.name}</span>
              <span className="file-size">{(state.file.size / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
          )}
        </div>

        {state.error && (
          <div className="upload-error" role="alert">
            {state.error}
          </div>
        )}

        <div className="upload-actions">
          <button
            type="button"
            className="action-btn action-secondary"
            onClick={resetAndClose}
            disabled={state.isUploading}
          >
            취소
          </button>
          <button
            type="button"
            className="action-btn action-primary"
            onClick={handleUpload}
            disabled={state.isUploading || !state.file}
          >
            {state.isUploading ? '업로드 중...' : '업로드'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .document-upload-modal {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .upload-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .selected-file {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: #4b5563;
        }

        .upload-error {
          color: #ef4444;
          font-size: 14px;
        }

        .upload-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .action-btn {
          min-width: 96px;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          border: none;
          transition: opacity 0.2s ease;
        }

        .action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .action-primary {
          background: #1a254f;
          color: #ffffff;
        }

        .action-secondary {
          background: #e2e8f0;
          color: #1f2937;
        }
      `}</style>
    </Modal>
  )
}
