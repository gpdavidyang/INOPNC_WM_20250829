'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { Modal } from '@/modules/mobile/components/common/Modal'

interface DocumentShareModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDocuments: string[]
  documents: Array<{
    id: string
    title: string
    hasUpload?: boolean
  }>
}

export const DocumentShareModal: React.FC<DocumentShareModalProps> = ({
  isOpen,
  onClose,
  selectedDocuments,
  documents,
}) => {
  const { toast } = useToast()
  const selectedDocumentInfo = useMemo(
    () => documents.filter(doc => selectedDocuments.includes(doc.id)),
    [documents, selectedDocuments]
  )

  const uploadedDocuments = useMemo(
    () => selectedDocumentInfo.filter(doc => doc.hasUpload),
    [selectedDocumentInfo]
  )

  const hasSharableDocuments = uploadedDocuments.length > 0
  const primaryDocument = uploadedDocuments[0] ?? null

  const [shareUrl, setShareUrl] = useState('')
  const [shareError, setShareError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const generateShareLink = useCallback(async () => {
    if (!primaryDocument) {
      setShareUrl('')
      return
    }

    try {
      setIsGenerating(true)
      setShareError(null)

      const response = await fetch(`/api/shared-documents/${primaryDocument.id}/share`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ allowDownload: true, expiresInHours: 48 }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || '공유 링크를 생성하지 못했습니다.')
      }

      const payload = await response.json()
      setShareUrl(payload.shareUrl)
    } catch (error) {
      console.error('문서 공유 링크 생성 실패:', error)
      setShareError(error instanceof Error ? error.message : '공유 링크를 생성하지 못했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }, [primaryDocument])

  useEffect(() => {
    if (isOpen && primaryDocument) {
      generateShareLink()
    } else {
      setShareUrl('')
      setShareError(null)
      setIsGenerating(false)
    }
  }, [generateShareLink, isOpen, primaryDocument])

  const ensureShareUrl = () => {
    if (!hasSharableDocuments) {
      toast({
        title: '공유 제한',
        description: '업로드된 문서만 공유할 수 있습니다.',
        variant: 'warning',
      })
      return null
    }

    if (shareError) {
      toast({ title: '공유 링크 생성 실패', description: shareError, variant: 'destructive' })
      return null
    }

    if (!shareUrl) {
      toast({ title: '링크 준비 중', description: '공유 링크를 준비 중입니다.', variant: 'info' })
      return null
    }

    return shareUrl
  }

  const handleEmailShare = () => {
    const url = ensureShareUrl()
    if (!url) return

    const subject = `문서 공유: ${uploadedDocuments.length}개 파일`
    const bodyLines = uploadedDocuments.map(doc => `• ${doc.title}`).join('\n')
    const body = `선택된 문서를 공유합니다.\n\n${bodyLines}\n\n열람 링크: ${url}`
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

    window.location.href = mailtoLink
    onClose()
  }

  const handleKakaoShare = () => {
    const url = ensureShareUrl()
    if (!url) return

    const shareText = `${uploadedDocuments.map(doc => `• ${doc.title}`).join('\n')}\n\n${url}`

    if (typeof window !== 'undefined' && (window as typeof window & { Kakao?: any }).Kakao) {
      try {
        ;(window as typeof window & { Kakao?: any }).Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: '문서 공유',
            description: shareText,
            link: {
              mobileWebUrl: url,
              webUrl: url,
            },
          },
        })
        onClose()
        return
      } catch (error) {
        console.error('Kakao share error:', error)
      }
    }

    navigator.clipboard
      ?.writeText(shareText)
      .then(() =>
        toast({ title: '복사 완료', description: '링크를 복사했습니다.', variant: 'success' })
      )
      .catch(() =>
        toast({
          title: '복사 실패',
          description: '링크 복사에 실패했습니다.',
          variant: 'destructive',
        })
      )
  }

  const handleCopyLink = () => {
    const url = ensureShareUrl()
    if (!url) return

    navigator.clipboard
      ?.writeText(url)
      .then(() =>
        toast({ title: '복사 완료', description: '공유 링크를 복사했습니다.', variant: 'success' })
      )
      .catch(() =>
        toast({
          title: '복사 실패',
          description: '공유 링크 복사에 실패했습니다.',
          variant: 'destructive',
        })
      )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`문서 공유 (${selectedDocumentInfo.length}개)`}
      size="small"
      showCloseButton
      closeOnBackdropClick
      closeOnEscape
    >
      <div className="share-modal">
        <div className="share-summary">
          <span className="summary-label">선택된 문서</span>
          {selectedDocumentInfo.length === 0 ? (
            <p className="summary-empty">선택된 문서가 없습니다.</p>
          ) : (
            <ul className="summary-list">
              {selectedDocumentInfo.map(doc => (
                <li key={doc.id} className="summary-item">
                  <span className="summary-title">{doc.title}</span>
                  <span className={`summary-status ${doc.hasUpload ? 'uploaded' : 'pending'}`}>
                    {doc.hasUpload ? '업로드 완료' : '업로드 대기'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {!hasSharableDocuments && selectedDocumentInfo.length > 0 && (
          <div className="share-warning" role="alert">
            <strong>공유 제한 안내</strong>
            <p>업로드되지 않은 문서는 공유할 수 없습니다.</p>
          </div>
        )}

        {primaryDocument && (
          <div className="share-link-panel" role="status">
            <div className="share-link-title">공유 링크</div>
            {uploadedDocuments.length > 1 && (
              <p className="share-link-message">
                여러 문서가 선택된 경우 첫 번째 문서 기준으로 링크를 생성합니다.
              </p>
            )}
            {isGenerating ? (
              <p className="share-link-message">공유 링크를 생성 중입니다...</p>
            ) : shareError ? (
              <p className="share-link-error">{shareError}</p>
            ) : shareUrl ? (
              <div className="share-link-value">{shareUrl}</div>
            ) : (
              <p className="share-link-message">공유 링크를 준비 중입니다.</p>
            )}
          </div>
        )}

        <div className="share-actions">
          <button
            type="button"
            className="share-action copy"
            onClick={handleCopyLink}
            disabled={!hasSharableDocuments || isGenerating}
          >
            <span className="action-icon">🔗</span>
            링크 복사
          </button>
          <button
            type="button"
            className="share-action email"
            onClick={handleEmailShare}
            disabled={!hasSharableDocuments || isGenerating}
          >
            <span className="action-icon">📧</span>
            이메일로 공유
          </button>
          <button
            type="button"
            className="share-action kakao"
            onClick={handleKakaoShare}
            disabled={!hasSharableDocuments || isGenerating}
          >
            <span className="action-icon">💬</span>
            카카오톡으로 공유
          </button>
        </div>
      </div>

      <style jsx>{`
        .share-modal {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .share-summary {
          background: rgba(148, 163, 184, 0.07);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 12px;
          padding: 16px;
        }

        .summary-label {
          display: block;
          font-size: var(--fs-ctl, 14px);
          font-weight: 600;
          color: #1a254f;
          margin-bottom: 12px;
        }

        .summary-empty {
          font-size: var(--fs-ctl, 14px);
          color: #64748b;
          margin: 0;
        }

        .summary-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: var(--fs-ctl, 14px);
          color: #1f2937;
        }

        .summary-status {
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: var(--fs-tiny, 12px);
          font-weight: 600;
        }

        .summary-status.uploaded {
          background: rgba(34, 197, 94, 0.12);
          color: #15803d;
        }

        .summary-status.pending {
          background: rgba(249, 115, 22, 0.12);
          color: #b45309;
        }

        .share-warning {
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 10px;
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.08);
          color: #b91c1c;
        }

        .share-warning strong {
          display: block;
          margin-bottom: 4px;
          font-size: var(--fs-ctl, 14px);
        }

        .share-warning p {
          margin: 0;
          font-size: var(--fs-tiny, 12px);
        }

        .share-link-panel {
          border: 1px dashed rgba(59, 130, 246, 0.4);
          border-radius: 10px;
          padding: 14px 16px;
          background: rgba(59, 130, 246, 0.05);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .share-link-title {
          font-size: var(--fs-ctl, 14px);
          font-weight: 600;
          color: #1a254f;
        }

        .share-link-message {
          font-size: var(--fs-tiny, 12px);
          color: #64748b;
        }

        .share-link-error {
          font-size: var(--fs-tiny, 12px);
          color: #dc2626;
        }

        .share-link-value {
          font-size: var(--fs-tiny, 12px);
          color: #1e3a8a;
          word-break: break-all;
          background: rgba(255, 255, 255, 0.9);
          padding: 6px 8px;
          border-radius: 6px;
        }

        .share-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .share-action {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid rgba(37, 99, 235, 0.15);
          background: #ffffff;
          color: #1a254f;
          font-size: var(--fs-ctl, 14px);
          font-weight: 600;
          cursor: pointer;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .share-action:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .share-action:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.15);
        }

        .share-action.copy {
          border-color: rgba(59, 130, 246, 0.25);
          background: rgba(59, 130, 246, 0.12);
        }

        .share-action.email {
          border-color: rgba(37, 99, 235, 0.2);
          background: rgba(37, 99, 235, 0.08);
        }

        .share-action.kakao {
          border-color: rgba(245, 158, 11, 0.25);
          background: rgba(245, 158, 11, 0.1);
        }

        .action-icon {
          font-size: var(--fs-heading, 20px);
        }

        [data-theme='dark'] .share-summary {
          background: rgba(15, 23, 42, 0.6);
          border-color: rgba(148, 163, 184, 0.25);
        }

        [data-theme='dark'] .summary-label {
          color: #e2e8f0;
        }

        [data-theme='dark'] .summary-item {
          color: #e2e8f0;
        }

        [data-theme='dark'] .share-warning {
          background: rgba(239, 68, 68, 0.18);
          border-color: rgba(239, 68, 68, 0.35);
          color: #fecaca;
        }

        [data-theme='dark'] .share-action {
          background: rgba(30, 41, 59, 0.8);
          border-color: rgba(30, 64, 175, 0.4);
          color: #e2e8f0;
        }

        [data-theme='dark'] .share-link-panel {
          background: rgba(30, 41, 59, 0.7);
          border-color: rgba(59, 130, 246, 0.35);
        }

        [data-theme='dark'] .share-link-title {
          color: #bfdbfe;
        }

        [data-theme='dark'] .share-link-value {
          background: rgba(15, 23, 42, 0.8);
          color: #bfdbfe;
        }

        [data-theme='dark'] .share-action.kakao {
          border-color: rgba(250, 204, 21, 0.35);
          background: rgba(250, 204, 21, 0.15);
        }
      `}</style>
    </Modal>
  )
}
