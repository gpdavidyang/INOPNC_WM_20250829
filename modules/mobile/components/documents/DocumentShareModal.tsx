'use client'

import React, { useState } from 'react'
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

interface ShareOption {
  id: string
  name: string
  icon: string
  description: string
  disabled?: boolean
}

export const DocumentShareModal: React.FC<DocumentShareModalProps> = ({
  isOpen,
  onClose,
  selectedDocuments,
  documents,
}) => {
  const [isSharing, setIsSharing] = useState(false)
  const [shareMessage, setShareMessage] = useState('')

  const shareOptions: ShareOption[] = [
    {
      id: 'email',
      name: '이메일로 공유',
      icon: '📧',
      description: '선택한 문서를 이메일로 전송합니다.',
    },
    {
      id: 'link',
      name: '링크 복사',
      icon: '🔗',
      description: '공유 링크를 클립보드에 복사합니다.',
    },
    {
      id: 'download',
      name: 'ZIP 다운로드',
      icon: '📦',
      description: '선택한 문서들을 ZIP 파일로 다운로드합니다.',
    },
    {
      id: 'qr',
      name: 'QR 코드',
      icon: '📱',
      description: 'QR 코드를 생성하여 공유합니다.',
    },
    {
      id: 'kakao',
      name: '카카오톡',
      icon: '💬',
      description: '카카오톡으로 문서를 공유합니다.',
      disabled: !window.Kakao || typeof window === 'undefined',
    },
  ]

  // 선택된 문서들 정보
  const selectedDocumentInfo = documents.filter(doc => 
    selectedDocuments.includes(doc.id)
  )

  // 업로드된 문서만 필터링
  const uploadedDocuments = selectedDocumentInfo.filter(doc => doc.hasUpload)

  const handleShare = async (optionId: string) => {
    if (uploadedDocuments.length === 0) {
      alert('업로드된 문서만 공유할 수 있습니다.')
      return
    }

    setIsSharing(true)

    try {
      switch (optionId) {
        case 'email':
          await handleEmailShare()
          break
        case 'link':
          await handleLinkShare()
          break
        case 'download':
          await handleDownloadShare()
          break
        case 'qr':
          await handleQRShare()
          break
        case 'kakao':
          await handleKakaoShare()
          break
        default:
          console.log('Unknown share option:', optionId)
      }
    } catch (error) {
      console.error('Share error:', error)
      alert('공유 중 오류가 발생했습니다.')
    } finally {
      setIsSharing(false)
    }
  }

  const handleEmailShare = async () => {
    const subject = `문서 공유: ${uploadedDocuments.length}개 파일`
    const body = `공유된 문서:\n${uploadedDocuments.map(doc => `• ${doc.title}`).join('\n')}\n\n메시지: ${shareMessage}`
    
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = mailtoLink
    
    setTimeout(() => {
      onClose()
      alert('이메일 앱이 열렸습니다.')
    }, 500)
  }

  const handleLinkShare = async () => {
    const shareUrl = `${window.location.origin}/shared-documents?ids=${selectedDocuments.join(',')}`
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      alert('공유 링크가 클립보드에 복사되었습니다.')
      onClose()
    } catch (error) {
      // 클립보드 API 실패 시 fallback
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('공유 링크가 복사되었습니다.')
      onClose()
    }
  }

  const handleDownloadShare = async () => {
    // 실제 구현에서는 서버 API를 호출하여 ZIP 파일 생성
    console.log('Creating ZIP file for documents:', uploadedDocuments)
    
    // 시뮬레이션: 다운로드 시작
    const link = document.createElement('a')
    link.href = '#' // 실제로는 서버에서 생성된 ZIP 파일 URL
    link.download = `documents_${new Date().toISOString().slice(0, 10)}.zip`
    link.click()
    
    alert(`${uploadedDocuments.length}개 문서의 ZIP 다운로드를 시작합니다.`)
    onClose()
  }

  const handleQRShare = async () => {
    const shareUrl = `${window.location.origin}/shared-documents?ids=${selectedDocuments.join(',')}`
    
    // QR 코드 생성 (실제 구현에서는 QR 코드 라이브러리 사용)
    console.log('Generating QR code for:', shareUrl)
    alert('QR 코드가 생성되었습니다.\n(실제 구현에서는 QR 코드 이미지가 표시됩니다)')
  }

  const handleKakaoShare = async () => {
    // 카카오톡 공유 (Kakao SDK 필요)
    if (typeof window !== 'undefined' && window.Kakao) {
      try {
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: '문서 공유',
            description: `${uploadedDocuments.length}개의 문서가 공유되었습니다.`,
            imageUrl: '/images/document-share-icon.png',
            link: {
              mobileWebUrl: window.location.href,
              webUrl: window.location.href,
            },
          },
        })
        onClose()
      } catch (error) {
        console.error('Kakao share error:', error)
        alert('카카오톡 공유에 실패했습니다.')
      }
    } else {
      alert('카카오톡 공유 기능을 사용할 수 없습니다.')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`문서 공유 (${selectedDocuments.length}개 선택)`}
      size="medium"
      showCloseButton={true}
      closeOnBackdropClick={true}
      closeOnEscape={true}
    >
      <div className="document-share-content">
        {/* 선택된 문서 목록 */}
        <div className="selected-documents">
          <h4>선택된 문서</h4>
          <div className="document-list">
            {selectedDocumentInfo.map(doc => (
              <div key={doc.id} className="document-item">
                <div className="document-info">
                  <span className="document-name">{doc.title}</span>
                  <span className={`document-status ${doc.hasUpload ? 'uploaded' : 'pending'}`}>
                    {doc.hasUpload ? '업로드 완료' : '업로드 대기'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 메시지 입력 */}
        <div className="share-message">
          <label htmlFor="shareMessage">공유 메시지 (선택사항)</label>
          <textarea
            id="shareMessage"
            value={shareMessage}
            onChange={(e) => setShareMessage(e.target.value)}
            placeholder="공유할 때 함께 전달할 메시지를 입력하세요..."
            rows={3}
            maxLength={200}
          />
          <div className="message-counter">{shareMessage.length}/200</div>
        </div>

        {/* 공유 방법 선택 */}
        <div className="share-options">
          <h4>공유 방법 선택</h4>
          <div className="options-grid">
            {shareOptions.map(option => (
              <button
                key={option.id}
                className={`share-option ${option.disabled ? 'disabled' : ''} ${isSharing ? 'sharing' : ''}`}
                onClick={() => handleShare(option.id)}
                disabled={option.disabled || isSharing}
              >
                <div className="option-icon">{option.icon}</div>
                <div className="option-content">
                  <div className="option-name">{option.name}</div>
                  <div className="option-description">{option.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 공유 제한 안내 */}
        {uploadedDocuments.length < selectedDocuments.length && (
          <div className="share-notice">
            <div className="notice-icon">⚠️</div>
            <div className="notice-content">
              <strong>공유 제한 안내</strong>
              <p>
                업로드되지 않은 문서는 공유할 수 없습니다. 
                {selectedDocuments.length - uploadedDocuments.length}개의 문서가 제외됩니다.
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .document-share-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-height: 70vh;
          overflow-y: auto;
        }

        .selected-documents h4,
        .share-options h4 {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
          margin: 0 0 12px 0;
        }

        .document-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .document-item {
          padding: 12px;
          background: var(--card-bg, #f9fafb);
          border-radius: 8px;
          border: 1px solid var(--border-color, #e0e0e0);
        }

        .document-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .document-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary, #1a1a1a);
        }

        .document-status {
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 500;
        }

        .document-status.uploaded {
          background: var(--success-bg, #dcfce7);
          color: var(--success-text, #166534);
        }

        .document-status.pending {
          background: var(--warning-bg, #fef3c7);
          color: var(--warning-text, #92400e);
        }

        .share-message {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .share-message label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
        }

        .share-message textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 8px;
          font-size: 14px;
          line-height: 1.5;
          resize: vertical;
          font-family: inherit;
        }

        .share-message textarea:focus {
          outline: none;
          border-color: var(--primary-color, #2563eb);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .message-counter {
          font-size: 12px;
          color: var(--text-secondary, #666666);
          text-align: right;
        }

        .options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 12px;
        }

        .share-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .share-option:hover:not(.disabled):not(.sharing) {
          border-color: var(--primary-color, #2563eb);
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
        }

        .share-option.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .share-option.sharing {
          opacity: 0.7;
          cursor: wait;
        }

        .option-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .option-content {
          flex: 1;
        }

        .option-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
          margin-bottom: 4px;
        }

        .option-description {
          font-size: 12px;
          color: var(--text-secondary, #666666);
          line-height: 1.4;
        }

        .share-notice {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: var(--warning-bg, #fffbeb);
          border: 1px solid var(--warning-border, #fed7aa);
          border-radius: 8px;
        }

        .notice-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .notice-content strong {
          font-size: 14px;
          color: var(--warning-text, #92400e);
          display: block;
          margin-bottom: 4px;
        }

        .notice-content p {
          font-size: 13px;
          color: var(--text-secondary, #666666);
          margin: 0;
          line-height: 1.4;
        }

        /* Dark theme */
        [data-theme='dark'] .selected-documents h4,
        [data-theme='dark'] .share-options h4,
        [data-theme='dark'] .share-message label {
          color: var(--text-primary-dark, #f1f5f9);
        }

        [data-theme='dark'] .document-item {
          background: var(--card-bg-dark, #1e293b);
          border-color: var(--border-color-dark, #334155);
        }

        [data-theme='dark'] .document-name {
          color: var(--text-primary-dark, #f1f5f9);
        }

        [data-theme='dark'] .share-option {
          background: var(--card-bg-dark, #1e293b);
          border-color: var(--border-color-dark, #334155);
        }

        [data-theme='dark'] .option-name {
          color: var(--text-primary-dark, #f1f5f9);
        }

        /* Mobile responsive */
        @media (max-width: 640px) {
          .options-grid {
            grid-template-columns: 1fr;
          }

          .document-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }
      `}</style>
    </Modal>
  )
}