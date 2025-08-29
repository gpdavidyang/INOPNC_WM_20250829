'use client'

import React, { useState } from 'react'
import { 
  X, Share2, Copy, Check, MessageSquare, Mail, 
  Smartphone, Link2, QrCode, Users, ExternalLink
} from 'lucide-react'

interface ShareDialogProps {
  isOpen: boolean
  onClose: () => void
  document: {
    id: string
    name: string
    type: string
    url?: string
  }
  shareUrl: string
}

interface ShareOption {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  borderColor: string
  action: () => void
  description?: string
}

export default function ShareDialog({ isOpen, onClose, document, shareUrl }: ShareDialogProps) {
  const [copied, setCopied] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)

  if (!isOpen) return null

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleKakaoTalk = () => {
    const message = `📄 문서 공유: ${document.name}\n\n확인하기: ${shareUrl}`
    const kakaoUrl = `https://talk.kakao.com/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(message)}`
    window.open(kakaoUrl, '_blank')
    setSelectedMethod('kakao')
  }

  const handleSMS = () => {
    const message = `📄 문서 공유: ${document.name}\n\n확인하기: ${shareUrl}`
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`
    window.location.href = smsUrl
    setSelectedMethod('sms')
  }

  const handleEmail = () => {
    const subject = `문서 공유: ${document.name}`
    const body = `안녕하세요,\n\n다음 문서를 공유합니다:\n\n📄 문서명: ${document.name}\n🔗 링크: ${shareUrl}\n\n감사합니다.`
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = emailUrl
    setSelectedMethod('email')
  }


  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `문서 공유: ${document.name}`,
          text: `${document.name} 문서를 확인해보세요.`,
          url: shareUrl
        })
        setSelectedMethod('native')
      } catch (error) {
        console.error('Native sharing failed:', error)
      }
    }
  }

  const shareOptions: ShareOption[] = [
    {
      id: 'copy',
      name: '링크 복사',
      icon: copied ? Check : Copy,
      color: copied ? 'text-green-600' : 'text-blue-600',
      bgColor: copied ? 'bg-green-50' : 'bg-blue-50',
      borderColor: copied ? 'border-green-200' : 'border-blue-200',
      action: handleCopyLink,
      description: '링크를 클립보드에 복사'
    },
    {
      id: 'kakao',
      name: '카카오톡',
      icon: MessageSquare,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      action: handleKakaoTalk,
      description: '카카오톡으로 공유'
    },
    {
      id: 'sms',
      name: '문자메시지',
      icon: Smartphone,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      action: handleSMS,
      description: 'SMS로 링크 전송'
    },
    {
      id: 'email',
      name: '이메일',
      icon: Mail,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      action: handleEmail,
      description: '이메일로 전송'
    }
  ]

  // Add native share option if supported
  if (navigator.share) {
    shareOptions.push({
      id: 'native',
      name: '더 보기',
      icon: Share2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      action: handleNativeShare,
      description: '시스템 공유 메뉴'
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full mx-4 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Share2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                문서 공유
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                {document.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Share URL Preview - Compact */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="h-3 w-3 text-gray-500" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">공유 링크</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white dark:bg-gray-800 px-2 py-1.5 rounded border text-gray-600 dark:text-gray-400 truncate">
                {shareUrl}
              </code>
              <button
                onClick={handleCopyLink}
                className={`p-1.5 rounded-lg transition-colors ${
                  copied 
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>

          {/* Share Options Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {shareOptions.map((option) => {
              const IconComponent = option.icon
              const isSelected = selectedMethod === option.id
              
              return (
                <button
                  key={option.id}
                  onClick={option.action}
                  className={`
                    relative p-3 rounded-xl border-2 transition-all duration-200 hover:shadow-md group
                    ${isSelected ? 'ring-2 ring-offset-1 ring-blue-500' : ''}
                    ${option.bgColor} ${option.borderColor} hover:${option.bgColor.replace('50', '100')}
                    dark:${option.bgColor.replace('50', '900/20')} dark:${option.borderColor.replace('200', '700')}
                  `}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`
                      p-2 rounded-full transition-colors
                      ${option.color} group-hover:scale-110 transform transition-transform
                    `}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="text-center">
                      <div className={`font-medium text-xs ${option.color}`}>
                        {option.name}
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
                        {option.description}
                      </div>
                    </div>
                  </div>
                  
                  {/* Success indicator */}
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Additional Info - Compact */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="p-1 bg-blue-200 dark:bg-blue-800 rounded">
                <Users className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 text-xs">
                <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  공유 안내
                </div>
                <div className="text-blue-700 dark:text-blue-300 space-y-0.5">
                  <p>• 권한이 있는 사용자만 접근 가능합니다</p>
                  <p>• 민감한 정보는 주의하여 공유하세요</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium text-sm"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}