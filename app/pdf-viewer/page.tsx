'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Download, Share2, ZoomIn, ZoomOut, RotateCw, X, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function PDFViewerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pdfUrl, setPdfUrl] = useState<string>('')
  const [title, setTitle] = useState<string>('문서 뷰어')
  const [documentNumber, setDocumentNumber] = useState<string>('')
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [controlTimeout, setControlTimeout] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const url = searchParams.get('url')
    const docTitle = searchParams.get('title') || 'PTW 작업허가서'
    const docNumber = searchParams.get('docNumber') || 'PTW-2025-55386936'
    
    if (url) {
      setPdfUrl(decodeURIComponent(url))
      setTitle(docTitle)
      setDocumentNumber(docNumber)
    } else {
      // 기본값으로 PTW 문서 사용
      setPdfUrl('/documents/PTW-2025-55386936.pdf')
      setTitle('PTW 작업허가서')
      setDocumentNumber('PTW-2025-55386936')
    }
  }, [searchParams])

  // 키보드 및 브라우저 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleGoBack()
      } else if (event.key === ' ' || event.key === 'Enter') {
        // 스페이스바나 엔터로 컨트롤 토글
        event.preventDefault()
        handleScreenTouch()
      }
    }

    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault()
      handleGoBack()
    }

    // 이벤트 리스너 등록
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('popstate', handlePopState)
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('popstate', handlePopState)
    }
  }, []) // 빈 의존성 배열로 한 번만 실행

  // 컨트롤 자동 숨김 기능
  const hideControlsAfterDelay = () => {
    if (controlTimeout) clearTimeout(controlTimeout)
    
    const timeout = setTimeout(() => {
      setShowControls(false)
    }, 3000) // 3초 후 숨김
    
    setControlTimeout(timeout)
  }

  // 화면 터치 시 컨트롤 표시/숨김 토글
  const handleScreenTouch = () => {
    setShowControls(prev => {
      const newValue = !prev
      if (newValue) {
        hideControlsAfterDelay()
      }
      return newValue
    })
  }

  // PDF 로드 완료
  const handlePdfLoad = () => {
    setIsLoading(false)
    hideControlsAfterDelay()
  }

  // 뒤로가기 처리 - 향상된 네비게이션
  const handleGoBack = () => {
    try {
      // PWA 환경에서는 window.close() 시도
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                    (window.navigator as any).standalone === true

      if (isPWA && window.opener) {
        window.close()
      } else if (window.history.length > 2) {
        router.back()
      } else {
        // 직접 접근한 경우 대시보드로 이동
        router.push('/dashboard')
      }
    } catch (error) {
      // 오류 발생 시 안전하게 대시보드로 이동
      router.push('/dashboard')
    }
  }

  // 다운로드 기능
  const handleDownload = () => {
    try {
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `${documentNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('파일 다운로드를 시작합니다.')
    } catch (error) {
      toast.error('다운로드에 실패했습니다.')
    }
  }

  // 공유 기능 (PWA 지원)
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: title,
          text: `${documentNumber} 문서`,
          url: window.location.href
        })
        toast.success('공유되었습니다.')
      } else {
        // 공유 API가 지원되지 않는 경우 URL 복사
        await navigator.clipboard.writeText(window.location.href)
        toast.success('링크가 복사되었습니다.')
      }
    } catch (error) {
      toast.error('공유에 실패했습니다.')
    }
  }

  // 페이지 컨트롤 - 브라우저의 기본 PDF 뷰어 기능 활용
  const handleZoomIn = () => {
    // PDF에 JavaScript 명령 전송 (브라우저에서 지원하는 경우)
    const iframe = document.querySelector('iframe') as HTMLIFrameElement
    if (iframe && iframe.contentWindow) {
      try {
        iframe.src = iframe.src.replace(/#.*$/, '') + '#zoom=150'
      } catch (error) {
        toast.info('줌 기능은 브라우저의 PDF 뷰어를 사용해주세요.')
      }
    }
  }

  if (!pdfUrl) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">PDF 파일을 찾을 수 없습니다.</p>
          <Button variant="outline" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            돌아가기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative select-none">
      {/* 상단 컨트롤 바 */}
      <div 
        className={`absolute top-0 left-0 right-0 z-50 transition-all duration-300 ${
          showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="bg-black/90 backdrop-blur-sm border-b border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                className="text-white hover:bg-white/10 p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="text-white">
                <p className="text-sm font-medium truncate max-w-[200px]">{title}</p>
                <p className="text-xs text-gray-300">{documentNumber}</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowControls(false)}
              className="text-white hover:bg-white/10 p-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* PDF 뷰어 */}
      <div 
        className="h-screen w-full"
        onClick={handleScreenTouch}
        onTouchStart={handleScreenTouch}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-black flex items-center justify-center z-30">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
              <p className="text-lg">문서를 불러오는 중...</p>
            </div>
          </div>
        )}
        
        <iframe
          src={`${pdfUrl}#view=FitH&toolbar=1&navpanes=0&scrollbar=1`}
          className="w-full h-full border-none"
          title={title}
          style={{ 
            background: '#000',
            colorScheme: 'dark'
          }}
          onLoad={handlePdfLoad}
          onError={() => {
            setIsLoading(false)
            toast.error('PDF 파일을 불러올 수 없습니다.')
          }}
        />
      </div>

      {/* 하단 컨트롤 바 */}
      <div 
        className={`absolute bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
          showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        <div className="bg-black/90 backdrop-blur-sm border-t border-gray-700 px-4 py-3">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="text-white hover:bg-white/10 p-3"
              title="공유"
            >
              <Share2 className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-white hover:bg-white/10 p-3"
              title="다운로드"
            >
              <Download className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="text-white hover:bg-white/10 p-3"
              title="확대"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowControls(!showControls)}
              className="text-white hover:bg-white/10 p-3"
              title="메뉴"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 안전 영역 지원 (iPhone 등) */}
      <style jsx global>{`
        @supports (padding: env(safe-area-inset-top)) {
          .pdf-viewer-top {
            padding-top: env(safe-area-inset-top);
          }
          .pdf-viewer-bottom {
            padding-bottom: env(safe-area-inset-bottom);
          }
        }
      `}</style>
    </div>
  )
}