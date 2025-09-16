'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SharedMarkupEditor } from '@/components/markup/SharedMarkupEditor'
import { DrawingBrowser } from '@/modules/mobile/components/markup/DrawingBrowser'
import { useUser } from '@/hooks/use-user'
import { ArrowLeft, FolderOpen } from 'lucide-react'
import { toast } from 'sonner'

interface DrawingFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadDate: Date
}

export default function MarkupToolPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile } = useUser()
  const [drawingFile, setDrawingFile] = useState<DrawingFile | null>(null)
  const [markupDocument, setMarkupDocument] = useState<any>(null)
  const [showBrowser, setShowBrowser] = useState(false)
  const [selectedSite, setSelectedSite] = useState<{ id: string; name: string } | null>(null)

  // URL 파라미터로 모드 확인
  const mode = searchParams.get('mode')

  useEffect(() => {
    // 모드에 따라 초기 화면 설정
    if (mode === 'browse' || mode === 'upload') {
      setShowBrowser(true)
    }

    // localStorage에서 선택된 현장 정보 불러오기
    const savedSite = localStorage.getItem('selected_site')
    if (savedSite) {
      try {
        const site = JSON.parse(savedSite)
        setSelectedSite(site)
      } catch (error) {
        console.error('Error parsing site data:', error)
      }
    }

    // localStorage에서 선택된 도면 불러오기
    const savedDrawing = localStorage.getItem('selected_drawing')
    if (savedDrawing) {
      try {
        const drawing = JSON.parse(savedDrawing)
        setDrawingFile(drawing)

        // 마킹 데이터가 있는지 확인
        const markupData = drawing.markupData || drawing.markup_data || []

        // MarkupDocument 형식으로 변환
        setMarkupDocument({
          id: drawing.id,
          title: drawing.name || drawing.title,
          original_blueprint_url: drawing.url,
          markup_data: markupData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        // 계속 작업 모드인 경우 메시지 표시
        if (mode === 'continue' && markupData.length > 0) {
          toast.info(`이전 작업을 계속합니다. (${markupData.length}개 마킹)`)
        }
      } catch (error) {
        console.error('Error parsing drawing data:', error)
        toast.error('도면 데이터를 불러올 수 없습니다.')
      }
    } else if (!mode) {
      // 도면이 없고 모드도 지정되지 않은 경우 브라우저 표시
      setShowBrowser(true)
    }
  }, [mode])

  const handleSave = async (document: any) => {
    try {
      // 로컬 스토리지에 마킹 데이터 저장
      const markupData = {
        ...document,
        originalDrawing: drawingFile,
        savedAt: new Date().toISOString(),
      }

      localStorage.setItem('saved_markup_document', JSON.stringify(markupData))

      // 최근 마킹 도면으로 저장
      const recentMarkup = {
        id: document.id,
        title: document.title,
        blueprintUrl: document.original_blueprint_url,
        updatedAt: new Date().toISOString(),
        markupCount: document.markup_data?.length || 0,
      }
      localStorage.setItem('recent_markup', JSON.stringify(recentMarkup))

      console.log('📐 마킹 도면 저장:', markupData)
      toast.success('마킹이 저장되었습니다.')

      // 저장 후 뒤로 가기
      setTimeout(() => {
        router.back()
      }, 1000)
    } catch (error) {
      console.error('Save error:', error)
      toast.error('저장에 실패했습니다.')
    }
  }

  const handleClose = () => {
    router.back()
  }

  // DrawingBrowser에서 도면 선택 핸들러
  const handleDrawingSelect = (drawing: any) => {
    setDrawingFile({
      id: drawing.id,
      name: drawing.name || drawing.title,
      size: drawing.size || 0,
      type: drawing.type || 'image',
      url: drawing.url,
      uploadDate: drawing.uploadDate || new Date(),
    })

    setMarkupDocument({
      id: drawing.id,
      title: drawing.name || drawing.title,
      original_blueprint_url: drawing.url,
      markup_data: drawing.markupData || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    setShowBrowser(false)
    toast.success('도면을 불러왔습니다. 마킹을 시작하세요.')
  }

  // 사용자 정보가 없거나 도면이 없는 경우
  if (!profile) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // DrawingBrowser 표시
  if (showBrowser) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <header className="flex items-center justify-between p-4 bg-white border-b">
          <button
            onClick={handleClose}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            뒤로
          </button>
          <h1 className="text-lg font-semibold">도면 선택</h1>
          <button
            onClick={() => setShowBrowser(false)}
            className="text-sm text-blue-600 hover:text-blue-700"
            disabled={!drawingFile}
          >
            {drawingFile ? '마킹하기' : ''}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <DrawingBrowser
            selectedSite={selectedSite?.id}
            siteName={selectedSite?.name}
            userId={profile?.id || user?.id}
            onDrawingSelect={handleDrawingSelect}
            initialMode={mode === 'upload' ? 'upload' : 'browse'}
          />
        </div>
      </div>
    )
  }

  // 도면이 없는 경우
  if (!drawingFile || !markupDocument) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <header className="flex items-center justify-between p-4 bg-white border-b">
          <button
            onClick={handleClose}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            뒤로
          </button>
          <h1 className="text-lg font-semibold">도면 마킹</h1>
          <button
            onClick={() => setShowBrowser(true)}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
          >
            <FolderOpen size={18} />
            도면 선택
          </button>
        </header>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📐</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">도면을 선택해주세요</h2>
            <p className="text-gray-600 mb-6">도면을 선택하여 마킹을 시작하세요</p>
            <button
              onClick={() => setShowBrowser(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              도면 선택하기
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* 상단 헤더 - 네비게이션과 저장 버튼 */}
      <header className="flex items-center justify-between p-3 bg-white border-b">
        <button
          onClick={handleClose}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">뒤로</span>
        </button>

        <h1 className="text-base font-semibold flex-1 text-center">도면 마킹</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBrowser(true)}
            className="p-2 text-gray-600 hover:text-gray-900"
            title="도면 변경"
          >
            <FolderOpen size={20} />
          </button>
          <button
            onClick={() => {
              // 저장 트리거
              const saveEvent = new CustomEvent('markupSave')
              window.dispatchEvent(saveEvent)
            }}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            저장
          </button>
        </div>
      </header>

      {/* 마킹 에디터 */}
      <div className="flex-1 relative">
        <SharedMarkupEditor
          profile={profile}
          mode="worker"
          onSave={handleSave}
          onClose={handleClose}
          initialDocument={markupDocument}
        />
      </div>
    </div>
  )
}
