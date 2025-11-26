'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface ShareOption {
  id: string
  label: string
  icon: string
  type: 'url' | 'email' | 'kakao' | 'qr'
  description: string
}

interface DrawingShareModalProps {
  isOpen: boolean
  onClose: () => void
  documentId: string
  documentTitle: string
  imageUrl: string
  markupData?: any[]
}

export const DrawingShareModal: React.FC<DrawingShareModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  imageUrl,
  markupData,
}) => {
  const [shareUrl, setShareUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [emailTo, setEmailTo] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [shareExpiry, setShareExpiry] = useState('7') // days
  const [requireAuth, setRequireAuth] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)

  const shareOptions: ShareOption[] = [
    {
      id: 'url',
      label: 'URL 링크 복사',
      icon: '🔗',
      type: 'url',
      description: '공유 링크를 클립보드에 복사합니다',
    },
    {
      id: 'email',
      label: '이메일로 전송',
      icon: '📧',
      type: 'email',
      description: '이메일로 도면을 공유합니다',
    },
    {
      id: 'kakao',
      label: '카카오톡 공유',
      icon: '💬',
      type: 'kakao',
      description: '카카오톡으로 공유합니다',
    },
    {
      id: 'qr',
      label: 'QR 코드 생성',
      icon: '📱',
      type: 'qr',
      description: 'QR 코드로 쉽게 공유합니다',
    },
  ]

  // 공유 URL 생성
  const generateShareUrl = async () => {
    setIsGenerating(true)
    const supabase = createClient()

    try {
      // 공유 토큰 생성
      const shareToken = `share_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + parseInt(shareExpiry))

      // 공유 레코드 생성
      const { error } = await supabase.from('shared_documents').insert({
        document_id: documentId,
        share_token: shareToken,
        title: documentTitle,
        image_url: imageUrl,
        markup_data: markupData,
        expires_at: expiryDate.toISOString(),
        require_auth: requireAuth,
        view_count: 0,
      })

      if (error) throw error

      // 공유 URL 생성
      const baseUrl = window.location.origin
      const url = `${baseUrl}/shared/drawing/${shareToken}`
      setShareUrl(url)

      return url
    } catch (error) {
      console.error('Error generating share URL:', error)
      toast.error('공유 링크 생성 실패')
      return null
    } finally {
      setIsGenerating(false)
    }
  }

  // QR 코드 생성
  const generateQRCode = async (url: string) => {
    try {
      // QR 코드 API 사용 (예: qr-server.com)
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`
      setQrCode(qrUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
      toast.error('QR 코드 생성 실패')
    }
  }

  // 공유 처리
  const handleShare = async (option: ShareOption) => {
    let url = shareUrl

    // URL이 없으면 먼저 생성
    if (!url) {
      url = await generateShareUrl()
      if (!url) return
    }

    switch (option.type) {
      case 'url':
        // 클립보드에 복사
        try {
          await navigator.clipboard.writeText(url)
          toast.success('링크가 클립보드에 복사되었습니다')
        } catch (error) {
          console.error('Clipboard error:', error)
          toast.error('링크 복사 실패')
        }
        break

      case 'email':
        // 이메일 전송
        if (!emailTo) {
          toast.error('이메일 주소를 입력하세요')
          return
        }

        const subject = encodeURIComponent(`[도면 공유] ${documentTitle}`)
        const body = encodeURIComponent(
          `${emailMessage}\n\n도면 보기: ${url}\n\n유효기간: ${shareExpiry}일`
        )
        window.location.href = `mailto:${emailTo}?subject=${subject}&body=${body}`
        toast.success('이메일 앱이 열렸습니다')
        break

      case 'kakao':
        // 카카오톡 공유 (Kakao SDK 필요)
        if (typeof window !== 'undefined' && (window as any).Kakao) {
          const Kakao = (window as any).Kakao

          if (!Kakao.isInitialized()) {
            Kakao.init(process.env.NEXT_PUBLIC_KAKAO_APP_KEY)
          }

          Kakao.Link.sendDefault({
            objectType: 'feed',
            content: {
              title: documentTitle,
              description: '도면이 공유되었습니다',
              imageUrl: imageUrl,
              link: {
                mobileWebUrl: url,
                webUrl: url,
              },
            },
            buttons: [
              {
                title: '도면 보기',
                link: {
                  mobileWebUrl: url,
                  webUrl: url,
                },
              },
            ],
          })
        } else {
          // Kakao SDK가 없으면 웹 공유 API 사용
          if (navigator.share) {
            try {
              await navigator.share({
                title: documentTitle,
                text: '도면을 확인하세요',
                url: url,
              })
              toast.success('공유 완료')
            } catch (error) {
              console.error('Share error:', error)
              toast.error('공유 실패')
            }
          } else {
            toast.error('카카오톡 공유를 사용할 수 없습니다')
          }
        }
        break

      case 'qr':
        // QR 코드 생성
        await generateQRCode(url)
        toast.success('QR 코드가 생성되었습니다')
        break
    }
  }

  // 모달이 열릴 때 공유 URL 생성
  useEffect(() => {
    if (isOpen && !shareUrl) {
      generateShareUrl()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal-content" onClick={e => e.stopPropagation()}>
        <div className="share-modal-header">
          <h3 className="share-modal-title">도면 공유</h3>
          <button className="share-modal-close" onClick={onClose} aria-label="닫기">
            닫기
          </button>
        </div>

        <div className="share-modal-body">
          {/* 공유 설정 */}
          <div className="share-settings">
            <div className="setting-group">
              <label htmlFor="expiry">유효기간</label>
              <select
                id="expiry"
                value={shareExpiry}
                onChange={e => setShareExpiry(e.target.value)}
                className="setting-select"
              >
                <option value="1">1일</option>
                <option value="7">7일</option>
                <option value="30">30일</option>
                <option value="90">90일</option>
                <option value="365">1년</option>
              </select>
            </div>

            <div className="setting-group">
              <label className="setting-checkbox">
                <input
                  type="checkbox"
                  checked={requireAuth}
                  onChange={e => setRequireAuth(e.target.checked)}
                />
                <span>로그인 필요</span>
              </label>
              <p className="setting-hint">체크하면 로그인한 사용자만 볼 수 있습니다</p>
            </div>
          </div>

          {/* 공유 URL */}
          {shareUrl && (
            <div className="share-url-container">
              <label>공유 링크</label>
              <div className="share-url-input-group">
                <input type="text" value={shareUrl} readOnly className="share-url-input" />
                <button
                  className="btn btn-small btn-primary"
                  onClick={() => handleShare({ type: 'url' } as ShareOption)}
                >
                  복사
                </button>
              </div>
            </div>
          )}

          {/* 공유 옵션 버튼들 */}
          <div className="share-options">
            {shareOptions.map(option => (
              <button
                key={option.id}
                className="share-option-btn"
                onClick={() => {
                  if (option.type === 'email') {
                    // 이메일 입력 폼 표시
                    const emailSection = document.getElementById('email-section')
                    if (emailSection) {
                      emailSection.style.display = 'block'
                      emailSection.scrollIntoView({ behavior: 'smooth' })
                    }
                  } else {
                    handleShare(option)
                  }
                }}
                disabled={isGenerating}
              >
                <span className="share-option-icon">{option.icon}</span>
                <span className="share-option-label">{option.label}</span>
                <span className="share-option-desc">{option.description}</span>
              </button>
            ))}
          </div>

          {/* 이메일 입력 섹션 */}
          <div id="email-section" className="email-section" style={{ display: 'none' }}>
            <h4>이메일로 전송</h4>
            <div className="form-group">
              <label htmlFor="email-to">받는 사람</label>
              <input
                id="email-to"
                type="email"
                value={emailTo}
                onChange={e => setEmailTo(e.target.value)}
                placeholder="email@example.com"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email-message">메시지 (선택)</label>
              <textarea
                id="email-message"
                value={emailMessage}
                onChange={e => setEmailMessage(e.target.value)}
                placeholder="추가 메시지를 입력하세요"
                className="form-textarea"
                rows={3}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={() => handleShare({ type: 'email' } as ShareOption)}
            >
              이메일 전송
            </button>
          </div>

          {/* QR 코드 표시 */}
          {qrCode && (
            <div className="qr-code-section">
              <h4>QR 코드</h4>
              <img src={qrCode} alt="QR Code" className="qr-code-image" />
              <p className="qr-hint">스마트폰으로 스캔하세요</p>
              <button
                className="btn btn-outline"
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = qrCode
                  link.download = `qr_${documentTitle}.png`
                  link.click()
                }}
              >
                QR 코드 다운로드
              </button>
            </div>
          )}
        </div>

        <div className="share-modal-footer">
          <p className="share-footer-note">공유된 도면은 설정한 유효기간 후 자동으로 만료됩니다</p>
        </div>
      </div>
    </div>
  )
}

export default DrawingShareModal
