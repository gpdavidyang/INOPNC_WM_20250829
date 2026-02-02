'use client'

import SharedMarkupEditor from '@/components/markup/SharedMarkupEditor'
import { Pencil, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { DrawingItem } from '@/hooks/use-drawing-manager'

export function DrawingMarkupTab({
  worklogId,
  siteId,
  onSuccess,
  editingDocument,
  onClearEdit,
}: {
  worklogId: string
  siteId?: string
  onSuccess: () => void
  editingDocument?: DrawingItem | null
  onClearEdit: () => void
}) {
  const [selectedBaseDrawing, setSelectedBaseDrawing] = useState<DrawingItem | null>(null)
  const localFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingDocument) {
      setSelectedBaseDrawing(editingDocument)
    }
  }, [editingDocument])

  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = event => {
      setSelectedBaseDrawing({
        id: `local-${Date.now()}`,
        title: file.name,
        url: event.target?.result as string,
        category: 'other',
        created_at: new Date().toISOString(),
      })
    }
    reader.readAsDataURL(file)
  }

  if (selectedBaseDrawing) {
    return (
      <div className="min-h-[900px] flex flex-col relative bg-[#1a1a1e]">
        <SharedMarkupEditor
          initialDocument={{
            ...selectedBaseDrawing,
            original_blueprint_url:
              selectedBaseDrawing.original_blueprint_url || selectedBaseDrawing.url,
            original_blueprint_filename:
              selectedBaseDrawing.original_blueprint_filename || selectedBaseDrawing.title,
            markup_data: selectedBaseDrawing.markup_data || [],
          }}
          onClose={() => {
            setSelectedBaseDrawing(null)
            onClearEdit()
          }}
          onSave={async doc => {
            const mId =
              editingDocument?.markup_document_id ||
              (editingDocument?.id?.startsWith('markup-')
                ? editingDocument.id.replace('markup-', '')
                : editingDocument?.id)

            const payload = {
              ...doc,
              drawing_id: selectedBaseDrawing.id.startsWith('local-')
                ? undefined
                : selectedBaseDrawing.id,
              markup_document_id: mId,
              worklog_ids: [worklogId],
              site_id: siteId,
              published: true,
            }
            const res = await fetch('/api/docs/drawings/markups/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
            if (res.ok) {
              toast.success('마킹 도면이 저장되어 일지에 연동되었습니다.')
              setSelectedBaseDrawing(null)
              onClearEdit()
              onSuccess()
            } else {
              toast.error('저장 실패')
            }
          }}
          embedded={false}
          savePrompt={editingDocument ? 'overwrite' : 'save-as'}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-10 p-12 h-full bg-[#f8faff] rounded-[40px]">
      <div className="relative">
        <div className="h-32 w-32 bg-white rounded-[48px] shadow-xl flex items-center justify-center text-[#31a3fa] border border-[#f0f4ff] animate-in zoom-in-50 duration-500">
          <Pencil className="h-14 w-14" />
        </div>
        <div className="absolute -bottom-2 -right-2 h-12 w-12 bg-[#31a3fa] rounded-2xl flex items-center justify-center text-white shadow-lg border-4 border-white animate-bounce">
          <Upload className="h-5 w-5" />
        </div>
      </div>

      <div className="space-y-4 text-center max-w-[520px]">
        <h4 className="text-[24px] font-black text-[#1f2942] tracking-tight">도면 마킹 시작하기</h4>
        <p className="text-[15px] font-bold text-[#9aa4c5] leading-relaxed">
          내 컴퓨터의 도면 파일을 불러와 치수나 의견을 마킹하고,
          <br />
          현재 작업일지에 결과물을 증빙 자료로 즉시 연동합니다.
        </p>
      </div>

      <div className="w-full max-w-[520px]">
        <button
          type="button"
          onClick={() => localFileInputRef.current?.click()}
          className="w-full flex items-center gap-6 p-6 rounded-[28px] bg-white border border-[#e0e6f3] hover:border-[#31a3fa] hover:bg-[#f0f4ff]/30 transition-all group"
        >
          <div className="h-16 w-16 rounded-2xl bg-[#f0f4ff] flex items-center justify-center text-[#31a3fa] group-hover:scale-110 transition-transform">
            <Upload className="h-8 w-8" />
          </div>
          <div className="text-left">
            <div className="text-[17px] font-black text-[#1f2942]">내 컴퓨터 파일 불러오기</div>
            <div className="text-[13px] font-bold text-[#9aa4c5]">
              이미지/PDF 파일을 선택해 마킹을 시작합니다
            </div>
          </div>
        </button>
      </div>

      <input
        type="file"
        ref={localFileInputRef}
        className="hidden"
        accept="image/*,.pdf"
        onChange={handleLocalFileSelect}
      />
    </div>
  )
}
