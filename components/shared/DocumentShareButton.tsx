'use client'




export default function DocumentShareButton({ children, variant = "primary", size = "md", disabled = false, loading = false, onClick, className, ...props }: ButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareLink, setShareLink] = useState<string | null>(null)
  
  const supabase = createClient()

  // Size classes
  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-9 w-9 text-base',
    lg: 'h-10 w-10 text-lg'
  }

  // Variant classes
  const variantClasses = {
    default: 'bg-blue-600 hover:bg-blue-700 text-white',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700',
    ghost: 'hover:bg-gray-100 text-gray-600'
  }

  // Generate shareable link
  const generateShareLink = async () => {
    setLoading(true)
    try {
      // In a real implementation, you might create a temporary sharing token
      // For now, we'll use the direct document URL
      const baseUrl = window.location.origin
      const link = `${baseUrl}/shared/${document.id}?token=temp`
      setShareLink(link)
      return link
    } catch (error) {
      console.error('Failed to generate share link:', error)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Copy to clipboard
  const copyToClipboard = async () => {
    const link = shareLink || await generateShareLink()
    if (!link) return

    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  // Share via email
  const shareViaEmail = async () => {
    const link = shareLink || await generateShareLink()
    if (!link) return

    const subject = `공유 문서: ${document.title}`
    const body = `안녕하세요,\n\n다음 문서를 공유합니다:\n\n제목: ${document.title}\n설명: ${document.description || '설명 없음'}\n\n링크: ${link}\n\n감사합니다.`
    
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoUrl)
  }

  // Native share (if supported)
  const shareNative = async () => {
    if (!navigator.share) {
      copyToClipboard()
      return
    }

    const link = shareLink || await generateShareLink()
    if (!link) return

    try {
      await navigator.share({
        title: `공유 문서: ${document.title}`,
        text: document.description || '',
        url: link
      })
      onShare?.()
    } catch (error) {
      // User cancelled or error occurred
      console.debug('Share cancelled:', error)
    }
  }

  const buttonClass = `
    inline-flex items-center justify-center rounded-md font-medium transition-colors
    focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
    disabled:pointer-events-none disabled:opacity-50
    ${sizeClasses[size]} ${variantClasses[variant]}
  `.trim()

  return (
    <div className="relative">
      {/* Main Share Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClass}
        title="문서 공유"
      >
        <Share2 className="h-4 w-4" />
        {showLabel && size !== 'sm' && (
          <span className="ml-2">공유</span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
            {/* Document Info */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="font-medium text-gray-900 dark:text-white text-sm">
                {document.title}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {document.description || '설명 없음'}
              </div>
            </div>

            {/* Share Options */}
            <div className="py-1">
              {/* Copy Link */}
              <button
                onClick={copyToClipboard}
                disabled={loading}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center disabled:opacity-50"
              >
                {copied ? (
                  <Check className="h-4 w-4 mr-3 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 mr-3" />
                )}
                {copied ? '링크 복사됨!' : '링크 복사'}
              </button>

              {/* Email Share */}
              <button
                onClick={shareViaEmail}
                disabled={loading}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center disabled:opacity-50"
              >
                <Mail className="h-4 w-4 mr-3" />
                이메일로 공유
              </button>

              {/* Native Share (if supported) */}
              {navigator.share && (
                <button
                  onClick={shareNative}
                  disabled={loading}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center disabled:opacity-50"
                >
                  <Share2 className="h-4 w-4 mr-3" />
                  다른 앱으로 공유
                </button>
              )}

              <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
                {/* Advanced Permissions */}
                <button
                  onClick={() => {
                    setIsOpen(false)
                    onShare?.() // This would typically open a full permissions modal
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <Users className="h-4 w-4 mr-3" />
                  권한 관리
                </button>
              </div>
            </div>

            {/* Loading/Status */}
            {loading && (
              <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                  링크 생성 중...
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
import type { ButtonProps } from '@/types/components'
}