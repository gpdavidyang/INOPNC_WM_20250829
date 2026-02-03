'use client'

import React, { useCallback, useEffect, useState } from 'react'

import { DrawingItem, useDrawingManager } from '@/hooks/use-drawing-manager'
import { format } from 'date-fns'
import {
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Loader2,
  Maximize2,
  Pencil,
  X,
} from 'lucide-react'
import Image from 'next/image'

export function DrawingListTab({
  worklogId,
  siteId,
  refreshKey,
  onRefresh,
  onEditMarkup,
}: {
  worklogId: string
  siteId?: string
  refreshKey: number
  onRefresh: () => void
  onEditMarkup: (doc: DrawingItem) => void
}) {
  const [items, setItems] = useState<DrawingItem[]>([])
  const [selectedImg, setSelectedImg] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const { loading, fetchDrawings, unlinkDrawing } = useDrawingManager()

  const load = useCallback(async () => {
    const data = await fetchDrawings(worklogId, siteId)
    setItems(data)
  }, [worklogId, siteId, fetchDrawings])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const handleUnlink = async (e: React.MouseEvent, doc: DrawingItem) => {
    e.stopPropagation()
    if (!confirm('작업일지와의 연결을 해제하시겠습니까? (파일은 삭제되지 않습니다)')) return
    const success = await unlinkDrawing(doc.id, worklogId, doc.category)
    if (success) {
      load()
      onRefresh()
    }
  }

  if (loading && items.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-[#31a3fa] opacity-20" />
          <Loader2 className="h-10 w-10 animate-spin text-[#31a3fa] absolute top-0 left-0 [animation-delay:-0.15s]" />
        </div>
        <p className="text-[13px] font-black text-[#9aa4c5] animate-pulse">
          도면 데이터를 가져오고 있습니다
        </p>
      </div>
    )

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-[#31a3fa] rounded-full" />
          <h4 className="text-[17px] font-black text-[#1f2942]">업로드 된 도면 리스트</h4>
          <span className="ml-1 px-3 py-1 bg-[#f0f4ff] text-[#31a3fa] text-[12px] font-black rounded-full">
            {items.length}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white p-1 rounded-xl border shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-primary/10 text-primary shadow-inner'
                  : 'text-[#9aa4c5] hover:text-primary/60'
              }`}
              title="카드형 보기"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-primary/10 text-primary shadow-inner'
                  : 'text-[#9aa4c5] hover:text-primary/60'
              }`}
              title="리스트형 보기"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={load}
            className="px-4 py-2 bg-[#f0f4ff] hover:bg-[#e0eaff] text-[#31a3fa] text-[13px] font-black rounded-xl transition-all active:scale-95 flex items-center gap-2 shadow-sm border border-[#31a3fa]/10"
          >
            새로고침
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20 bg-[#fdfdff] rounded-[32px] border-2 border-dashed border-[#e0e6f3] mx-2">
          <div className="h-24 w-24 bg-white rounded-[32px] shadow-sm border border-[#e0e6f3] flex items-center justify-center text-[#e0e6f3] mb-6">
            <ImageIcon className="h-12 w-12" />
          </div>
          <p className="text-[18px] font-black text-[#1f2942]">연결된 도면이 없습니다</p>
          <p className="text-[14px] mt-2 text-[#9aa4c5] font-bold leading-relaxed whitespace-pre-line">
            다른 탭에서 도면을 업로드하거나
            {' \n '}
            도면 마킹 도구로 새 도면을 만들어보세요.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
          {items.map(doc => (
            <div
              key={doc.id}
              className="group flex flex-col rounded-[24px] border border-[#e0e6f3] bg-white overflow-hidden transition-all hover:border-[#31a3fa] hover:shadow-[0_12px_32px_rgba(49,163,250,0.08)]"
            >
              <div
                className="aspect-[4/3] bg-[#f8faff] relative overflow-hidden cursor-pointer"
                onClick={() => setSelectedImg(doc.url)}
              >
                {doc.preview_url || doc.url ? (
                  <Image
                    src={doc.preview_url || doc.url}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    unoptimized
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <FileText className="h-12 w-12 text-[#31a3fa] opacity-20" />
                  </div>
                )}

                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="h-10 w-10 bg-white/90 rounded-full flex items-center justify-center text-[#31a3fa] shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                    <Maximize2 className="h-5 w-5" />
                  </div>
                </div>

                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-lg backdrop-blur-md shadow-sm self-start ${
                      doc.category === 'progress'
                        ? 'bg-[#f3f0ff]/90 text-[#5b4ac7]'
                        : 'bg-[#eff6ff]/90 text-[#2563eb]'
                    }`}
                  >
                    {doc.category === 'progress' ? '🎨 마킹 완료' : '📄 일반 도면'}
                  </span>
                </div>
              </div>

              <div className="p-4 flex flex-col gap-3">
                <div className="space-y-1">
                  <div className="truncate text-[15px] font-black text-[#1f2942] group-hover:text-[#31a3fa] transition-colors">
                    {doc.title}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        doc.sub_category === 'construction_drawing' || doc.category === 'plan'
                          ? 'bg-[#fef3c7] text-[#92400e]'
                          : 'bg-[#dcfce7] text-[#166534]'
                      }`}
                    >
                      {doc.sub_category === 'construction_drawing' || doc.category === 'plan'
                        ? '공도면'
                        : '진행도면'}
                    </span>
                    <span className="text-[12px] font-bold text-[#9aa4c5]">
                      {doc.created_at ? format(new Date(doc.created_at), 'yyyy. MM. dd.') : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#f0f4ff]">
                  <button
                    onClick={() => onEditMarkup(doc)}
                    className="flex-1 h-10 rounded-xl bg-[#f0f4ff] hover:bg-[#31a3fa] text-[#31a3fa] hover:text-white text-[13px] font-black transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Pencil className="h-4 w-4" />
                    수정하기
                  </button>
                  <button
                    onClick={e => handleUnlink(e, doc)}
                    className="h-9 px-3 flex items-center justify-center text-[#9aa4c5] hover:text-[#ef4444] hover:bg-[#ef4444]/5 rounded-xl transition-all active:scale-95 text-[12px] font-black border border-transparent hover:border-[#ef4444]/20"
                  >
                    해제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2 pb-10">
          {items.map(doc => (
            <div
              key={doc.id}
              className="group flex items-center gap-4 p-3 pr-4 rounded-2xl border border-[#e0e6f3] bg-white transition-all hover:border-[#31a3fa] hover:shadow-sm"
            >
              {/* Thumbnail Mini */}
              <div
                className="h-16 w-16 shrink-0 rounded-xl bg-[#f8faff] overflow-hidden cursor-pointer"
                onClick={() => setSelectedImg(doc.url)}
              >
                {doc.preview_url || doc.url ? (
                  <Image
                    src={doc.preview_url || doc.url}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    unoptimized
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[#31a3fa]/30">
                    <FileText className="h-6 w-6" />
                  </div>
                )}
              </div>

              {/* Info Column */}
              <div className="flex-1 min-w-0 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="truncate text-[15px] font-black text-[#1f2942] group-hover:text-[#31a3fa] transition-colors">
                    {doc.title}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[12px] font-bold text-[#9aa4c5]">
                      {doc.created_at ? format(new Date(doc.created_at), 'yyyy. MM. dd.') : ''}
                    </span>
                    <span className="w-1 h-1 bg-[#e0e6f3] rounded-full" />
                    <span className="text-[12px] font-bold text-[#9aa4c5]">
                      {doc.category === 'progress' ? '🎨 마킹' : '📄 파일'}
                    </span>
                  </div>
                </div>

                {/* Sub-Badges */}
                <div className="hidden md:flex items-center gap-2 border-l border-[#f0f4ff] pl-4">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      doc.sub_category === 'construction_drawing' || doc.category === 'plan'
                        ? 'bg-[#fef3c7] text-[#92400e]'
                        : 'bg-[#dcfce7] text-[#166534]'
                    }`}
                  >
                    {doc.sub_category === 'construction_drawing' || doc.category === 'plan'
                      ? '공도면'
                      : '진행도면'}
                  </span>
                </div>
              </div>

              {/* Actions Mini */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onEditMarkup(doc)}
                  className="h-9 px-4 rounded-xl bg-[#f0f4ff] hover:bg-[#31a3fa] text-[#31a3fa] hover:text-white text-[12px] font-black transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  마킹
                </button>
                <button
                  onClick={e => handleUnlink(e, doc)}
                  className="h-9 px-3 flex items-center justify-center text-[#9aa4c5] hover:text-[#ef4444] hover:bg-[#ef4444]/5 rounded-xl transition-all active:scale-95 text-[12px] font-black border border-transparent hover:border-[#ef4444]/20"
                >
                  해제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Viewer */}
      {selectedImg && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex flex-col animate-in fade-in duration-300"
          onClick={() => setSelectedImg(null)}
        >
          <div className="h-16 flex items-center justify-between px-6 text-white bg-black/20 backdrop-blur-sm relative z-10">
            <div className="text-[15px] font-bold truncate max-w-md">도면 크게 보기</div>
            <button
              className="h-10 w-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-all"
              onClick={() => setSelectedImg(null)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 relative flex items-center justify-center p-8 overflow-hidden">
            <Image
              src={selectedImg}
              alt=""
              width={1600}
              height={1200}
              className="max-w-full max-h-full object-contain shadow-2xl animate-in zoom-in-95 duration-500 select-none pointer-events-none"
              onClick={e => e.stopPropagation()}
              unoptimized
            />
          </div>
          <div className="h-16 flex items-center justify-center px-6 text-white/40 text-[12px] font-medium">
            마킹 도구 탭에서 이 도면을 수정할 수 있습니다.
          </div>
        </div>
      )}
    </div>
  )
}
