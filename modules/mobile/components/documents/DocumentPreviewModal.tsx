'use client'

import React, { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { Modal } from '@/modules/mobile/components/common/Modal'

interface DocumentPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  document: {
    id: string
    title: string
    hasUpload?: boolean
  } | null
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  document,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // 문서 미리보기 데이터 로딩 시뮬레이션
  useEffect(() => {
    if (isOpen && document) {
      setIsLoading(true)
      setError(null)

      // 실제 구현에서는 API 호출을 통해 문서 데이터를 가져옴
      const loadDocumentData = setTimeout(() => {
        setIsLoading(false)
        // 임시로 업로드 여부에 따라 상태 결정
        if (!document.hasUpload) {
          setError('업로드된 문서가 없습니다.')
        }
      }, 800)

      return () => clearTimeout(loadDocumentData)
    }
  }, [isOpen, document])

  if (!document) return null

  const handleDownload = () => {
    console.log('Download document:', document.id)
    // 실제 구현에서는 파일 다운로드 로직 구현
    toast({
      title: '다운로드',
      description: `${document.title} 다운로드를 시작합니다.`,
      variant: 'success',
    })
  }

  const handleShare = () => {
    console.log('Share document:', document.id)
    // 실제 구현에서는 공유 기능 구현
    if (navigator.share) {
      navigator.share({
        title: document.title,
        text: `${document.title} 문서를 공유합니다.`,
        url: window.location.href,
      })
    } else {
      // 웹 공유 API를 지원하지 않는 경우 클립보드 복사
      navigator.clipboard?.writeText(window.location.href)
      toast({
        title: '복사 완료',
        description: '링크가 클립보드에 복사되었습니다.',
        variant: 'success',
      })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="문서 미리보기"
      size="medium"
      showCloseButton={true}
      closeOnBackdropClick={true}
      closeOnEscape={true}
    >
      <div className="document-preview-content">
        <div className="document-header">
          <div className="document-title">{document.title}</div>
          <div className="document-meta">
            <span className="document-status">
              {document.hasUpload ? '✅ 업로드 완료' : '⏳ 업로드 대기'}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="document-loading">
            <div className="loading-spinner"></div>
            <p>문서를 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="document-error">
            <div className="error-icon">📄</div>
            <h4>문서 미리보기 불가</h4>
            <p>{error}</p>
            <p className="error-hint">문서를 먼저 업로드해주세요.</p>
          </div>
        ) : (
          <div className="document-content">
            <div className="document-preview-area">
              <div className="preview-placeholder">
                <div className="preview-icon">📋</div>
                <p>문서 미리보기</p>
                <p className="preview-subtitle">
                  실제 구현에서는 PDF, 이미지 등의 문서를 여기에 표시합니다.
                </p>
              </div>
            </div>

            <div className="document-info">
              <div className="info-row">
                <span className="info-label">문서 유형:</span>
                <span className="info-value">필수서류</span>
              </div>
              <div className="info-row">
                <span className="info-label">업로드 날짜:</span>
                <span className="info-value">{document.hasUpload ? '2025.09.16' : '-'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">파일 크기:</span>
                <span className="info-value">{document.hasUpload ? '2.3 MB' : '-'}</span>
              </div>
            </div>
          </div>
        )}

        <div className="document-actions">
          {document.hasUpload && !error && (
            <>
              <button className="action-btn action-btn-secondary" onClick={handleShare}>
                <span className="btn-icon">🔗</span>
                공유하기
              </button>
              <button className="action-btn action-btn-primary" onClick={handleDownload}>
                <span className="btn-icon">⬇️</span>
                다운로드
              </button>
            </>
          )}
          {!document.hasUpload && (
            <button
              className="action-btn action-btn-primary"
              onClick={() => {
                onClose()
                // 업로드 모달 열기 (추후 구현)
                console.log('Open upload modal for:', document.id)
              }}
            >
              <span className="btn-icon">📁</span>
              파일 업로드
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .document-preview-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-height: 400px;
        }

        .document-header {
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-color, #e0e0e0);
        }

        .document-title {
          font-size: var(--fs-heading, 20px);
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
          margin-bottom: 8px;
        }

        .document-meta {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .document-status {
          font-size: var(--fs-ctl, 14px);
          padding: 4px 8px;
          border-radius: 6px;
          background: var(--success-bg, #f0f9ff);
          color: var(--success-text, #0369a1);
        }

        .document-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: var(--text-secondary, #666666);
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--border-color, #e0e0e0);
          border-top-color: var(--primary-color, #2563eb);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .document-error {
          text-align: center;
          padding: 40px 20px;
          color: var(--text-secondary, #666666);
        }

        .error-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .document-error h4 {
          font-size: var(--fs-body, 15px);
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
          margin: 0 0 8px 0;
        }

        .error-hint {
          font-size: var(--fs-ctl, 14px);
          color: var(--text-muted, #9ca3af);
          margin-top: 8px;
        }

        .document-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .document-preview-area {
          flex: 1;
          min-height: 200px;
          background: var(--card-bg, #f9fafb);
          border-radius: 8px;
          border: 1px dashed var(--border-color, #e0e0e0);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preview-placeholder {
          text-align: center;
          color: var(--text-secondary, #666666);
        }

        .preview-icon {
          font-size: 40px;
          margin-bottom: 12px;
        }

        .preview-subtitle {
          font-size: var(--fs-tiny, 12px);
          color: var(--text-muted, #9ca3af);
          margin-top: 8px;
          max-width: 200px;
        }

        .document-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 16px;
          background: var(--card-bg, #f9fafb);
          border-radius: 8px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .info-label {
          font-size: var(--fs-ctl, 14px);
          color: var(--text-secondary, #666666);
        }

        .info-value {
          font-size: var(--fs-ctl, 14px);
          font-weight: 500;
          color: var(--text-primary, #1a1a1a);
        }

        .document-actions {
          display: flex;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid var(--border-color, #e0e0e0);
        }

        .action-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          border: none;
          border-radius: 8px;
          font-size: var(--fs-ctl, 14px);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn-primary {
          background: var(--primary-color, #2563eb);
          color: white;
        }

        .action-btn-primary:hover {
          background: var(--primary-hover, #1d4ed8);
        }

        .action-btn-secondary {
          background: var(--secondary-bg, #f1f5f9);
          color: var(--text-primary, #1a1a1a);
          border: 1px solid var(--border-color, #e0e0e0);
        }

        .action-btn-secondary:hover {
          background: var(--secondary-hover, #e2e8f0);
        }

        .btn-icon {
          font-size: var(--fs-body, 15px);
        }

        /* Dark theme */
        [data-theme='dark'] .document-title {
          color: var(--text-primary-dark, #f1f5f9);
        }

        [data-theme='dark'] .document-preview-area {
          background: var(--card-bg-dark, #1e293b);
          border-color: var(--border-color-dark, #334155);
        }

        [data-theme='dark'] .document-info {
          background: var(--card-bg-dark, #1e293b);
        }

        [data-theme='dark'] .info-value {
          color: var(--text-primary-dark, #f1f5f9);
        }

        /* Mobile responsive */
        @media (max-width: 640px) {
          .document-actions {
            flex-direction: column;
          }

          .action-btn {
            width: 100%;
          }
        }
      `}</style>
    </Modal>
  )
}
