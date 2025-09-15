'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SharedMarkupEditor } from '@/components/markup/SharedMarkupEditor'
import { useUser } from '@/hooks/use-user'
import { ArrowLeft } from 'lucide-react'
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
  const { user, profile } = useUser()
  const [drawingFile, setDrawingFile] = useState<DrawingFile | null>(null)
  const [markupDocument, setMarkupDocument] = useState<any>(null)

  useEffect(() => {
    // localStorage에서 선택된 도면 불러오기
    const savedDrawing = localStorage.getItem('selected_drawing')
    if (savedDrawing) {
      try {
        const drawing = JSON.parse(savedDrawing)
        setDrawingFile(drawing)

        // MarkupDocument 형식으로 변환
        setMarkupDocument({
          id: drawing.id,
          title: drawing.name,
          original_blueprint_url: drawing.url,
          markup_data: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      } catch (error) {
        console.error('Error parsing drawing data:', error)
        toast.error('도면 데이터를 불러올 수 없습니다.')
      }
    }
  }, [])

  const handleSave = async (document: any) => {
    try {
      // 로컬 스토리지에 마킹 데이터 저장
      const markupData = {
        ...document,
        originalDrawing: drawingFile,
        savedAt: new Date().toISOString(),
      }

      localStorage.setItem('saved_markup_document', JSON.stringify(markupData))

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
          <div className="w-12" /> {/* 공간 확보용 */}
        </header>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📐</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">도면을 선택해주세요</h2>
            <p className="text-gray-600 mb-6">먼저 도면마킹 섹션에서 도면을 업로드해주세요</p>
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              도면 선택하러 가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50">
      <SharedMarkupEditor
        profile={profile}
        mode="worker"
        onSave={handleSave}
        onClose={handleClose}
        initialDocument={markupDocument}
      />
    </div>
  )
}
