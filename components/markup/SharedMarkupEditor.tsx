'use client'

import { ZoomIn, ZoomOut } from 'lucide-react'
import React from 'react'
import { toast } from 'sonner'

import { useMarkupEngine } from './core/use-markup-engine'
import { usePointerHandlers } from './core/use-pointer-handlers'
import { hitTest } from './utils/canvas-utils'

import MarkupCanvas from './canvas/markup-canvas'
import { ToolSidebar } from './parts/ToolSidebar'
import { ContextContent } from './parts/context-content'
import { TopToolbar } from './toolbar/top-toolbar'

import type { ToolType } from '@/types/markup'

export const TEXT_SIZE_MAP = { small: 12, medium: 14, large: 18 }

interface SharedMarkupEditorProps {
  initialDocument: any
  onSave?: (doc: any) => Promise<void> | void
  onClose?: () => void
  embedded?: boolean
  savePrompt?: 'none' | 'save-as'
}

export function SharedMarkupEditor({
  initialDocument,
  onSave,
  onClose,
  embedded,
  savePrompt = 'none',
}: SharedMarkupEditorProps) {
  const isMobile = Boolean(embedded)

  // 1. Core Engine
  const engine = useMarkupEngine(initialDocument?.markup_data || [])
  const {
    state,
    setState,
    addObject,
    updateObject,
    deleteSelected,
    undo,
    redo,
    setTool,
    zoomIn,
    zoomOut,
    resetZoom,
  } = engine

  // 2. Preferences
  const [boxShape, setBoxShape] = React.useState<any>('square')
  const [boxSize, setBoxSize] = React.useState<any>('medium')
  const [penColor, setPenColor] = React.useState<any>('red')
  const [penWidth, setPenWidth] = React.useState<any>(3)
  const [textSize, setTextSize] = React.useState<any>('medium')
  const [textColor, setTextColor] = React.useState<any>('gray')
  const [showMobileSheet, setShowMobileSheet] = React.useState(false)

  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false)
  const [saveTitle, setSaveTitle] = React.useState('')

  const bgUrl = initialDocument?.original_blueprint_url || ''

  const resolveOriginalFilename = React.useCallback(() => {
    const raw =
      (initialDocument?.original_blueprint_filename as string | undefined) ||
      (initialDocument?.original_blueprint_file_name as string | undefined) ||
      (initialDocument?.file_name as string | undefined) ||
      (initialDocument?.title as string | undefined) ||
      ''
    return raw.toString().trim()
  }, [initialDocument])

  const splitNameExt = React.useCallback((filename: string) => {
    const trimmed = (filename || '').trim()
    if (!trimmed) return { base: '도면', ext: '' }
    const lastSlash = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'))
    const justName = lastSlash >= 0 ? trimmed.slice(lastSlash + 1) : trimmed
    const lastDot = justName.lastIndexOf('.')
    if (lastDot <= 0 || lastDot === justName.length - 1) return { base: justName, ext: '' }
    const base = justName.slice(0, lastDot)
    const ext = justName.slice(lastDot) // includes dot
    return { base: base || justName, ext: ext || '' }
  }, [])

  const buildSuggestedTitle = React.useCallback(() => {
    const originalName = resolveOriginalFilename()
    const { base, ext } = splitNameExt(originalName)
    const suffix = '_마킹'
    const nextBase = base.endsWith(suffix) ? base : `${base}${suffix}`
    return `${nextBase}${ext}`
  }, [resolveOriginalFilename, splitNameExt])

  // 3. Load image dimensions and initialize viewer
  React.useEffect(() => {
    if (!bgUrl) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setState(prev => ({
        ...prev,
        viewerState: {
          ...prev.viewerState,
          imageWidth: img.width,
          imageHeight: img.height,
        },
      }))
    }
    img.src = bgUrl
  }, [bgUrl, setState])

  // 4. Pointer Handlers
  const worldFromClient = React.useCallback(
    (pt: { x: number; y: number }) => {
      const { zoom, panX, panY } = state.viewerState
      const rect = document.querySelector('.markup-canvas-container')?.getBoundingClientRect()
      return {
        x: (pt.x - (rect?.left || 0) - panX) / zoom,
        y: (pt.y - (rect?.top || 0) - panY) / zoom,
      }
    },
    [state.viewerState]
  )

  const handlers = usePointerHandlers({
    state,
    setState,
    setPreviewObject: engine.setPreviewObject,
    addObject,
    worldFromClient,
    hitTest,
    boxShape,
    boxSize,
    penColor,
    penWidth,
    textSize,
    textColor,
  })

  // 4. Wrap setTool for mobile UX
  const handleSetTool = (t: ToolType) => {
    setTool(t)
    if (isMobile) {
      const hasOptions =
        t === 'text' || t === 'pen' || t.startsWith('box-') || t === 'select' || t === 'stamp'
      setShowMobileSheet(hasOptions)
    }
  }

  const performSave = async () => {
    const isSaveAs = savePrompt === 'save-as'
    const payload = {
      ...initialDocument,
      title: saveTitle.trim() || initialDocument?.title,
      published: isSaveAs ? true : (initialDocument as any)?.published,
      markup_data: state.markupObjects,
    }
    try {
      setState(s => ({ ...s, isSaving: true }))
      await onSave?.(payload)
      toast.success('저장되었습니다.')
    } catch (e) {
      toast.error('저장에 실패했습니다.')
    } finally {
      setState(s => ({ ...s, isSaving: false }))
    }
  }

  const handleSaveClick = () => {
    if (savePrompt !== 'save-as') {
      performSave()
      return
    }
    setSaveTitle(buildSuggestedTitle())
    setSaveDialogOpen(true)
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#f8f9fc]">
      {savePrompt === 'save-as' && saveDialogOpen && (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="border-b px-5 py-4">
              <div className="text-sm font-extrabold text-[#1f2942]">다른 이름으로 저장</div>
              <div className="mt-1 text-xs text-[#7f8ba7]">
                파일명을 입력해 새 버전으로 저장합니다.
              </div>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#4c5a80]">파일명</label>
                <input
                  value={saveTitle}
                  onChange={e => setSaveTitle(e.target.value)}
                  placeholder="파일명을 입력하세요 (필수)"
                  className="w-full rounded-xl border border-[#e0e6f3] bg-white px-3 py-2 text-sm font-semibold text-[#1f2942] outline-none focus:border-[#31a3fa]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t px-5 py-4">
              <button
                type="button"
                onClick={() => setSaveDialogOpen(false)}
                className="rounded-xl border border-[#e0e6f3] bg-white px-4 py-2 text-xs font-extrabold text-[#5a6182] hover:bg-[#f4f6fb]"
              >
                취소
              </button>
              <button
                type="button"
                disabled={state.isSaving || !saveTitle.trim()}
                onClick={async () => {
                  if (!saveTitle.trim()) {
                    toast.error('파일명을 입력해 주세요.')
                    return
                  }
                  const originalName = resolveOriginalFilename()
                  if (originalName && saveTitle.trim() === originalName.trim()) {
                    toast.error('원본과 동일한 파일명은 사용할 수 없습니다.')
                    return
                  }
                  setSaveDialogOpen(false)
                  await performSave()
                }}
                className="rounded-xl bg-[#31a3fa] px-4 py-2 text-xs font-extrabold text-white shadow-sm disabled:opacity-60"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {!isMobile && (
        <TopToolbar>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 rounded border bg-white text-sm font-medium"
              onClick={onClose}
            >
              닫기
            </button>
            <div className="h-4 w-px bg-gray-200 mx-2" />
            <span className="text-sm font-bold text-gray-700">
              {initialDocument?.title || '도면 마킹'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-1.5 rounded-lg bg-blue-500 text-white text-sm font-bold shadow-sm"
              onClick={handleSaveClick}
            >
              저장하기
            </button>
          </div>
        </TopToolbar>
      )}

      <div className="flex min-h-0 flex-1">
        <ToolSidebar
          activeTool={state.toolState.activeTool}
          setTool={handleSetTool}
          hasSelection={state.selectedObjects.length > 0}
          deleteSelected={deleteSelected}
          undo={undo}
          canUndo={state.undoStack.length > 0}
          redo={redo}
          canRedo={state.redoStack.length > 0}
          onSave={handleSaveClick}
          isSaving={state.isSaving}
        />

        {!isMobile && (
          <div className="w-80 shrink-0 border-r bg-white p-6 overflow-y-auto">
            <ContextContent
              state={state}
              activeTool={state.toolState.activeTool}
              boxShape={boxShape}
              setBoxShape={setBoxShape}
              boxSize={boxSize}
              setBoxSize={setBoxSize}
              textSize={textSize}
              setTextSize={setTextSize}
              textColor={textColor}
              setTextColor={setTextColor}
              penColor={penColor}
              setPenColor={setPenColor}
              penWidth={penWidth}
              setPenWidth={setPenWidth}
              setTool={handleSetTool}
              deleteSelected={deleteSelected}
              copySelected={engine.copySelected}
              pasteSelected={engine.paste}
              updateObject={updateObject}
            />
          </div>
        )}

        <div className="markup-canvas-container min-h-0 flex-1 relative bg-gray-100">
          {/* Legend (범례) */}
          <div className="absolute left-4 top-4 z-20 flex flex-col gap-1.5 rounded-2xl border border-white/40 bg-white/70 p-3 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-sm shadow-red-200" />
              <span className="text-xs font-bold text-gray-700">작업진행</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-200" />
              <span className="text-xs font-bold text-gray-700">작업완료</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-gray-500 shadow-sm shadow-gray-200" />
              <span className="text-xs font-bold text-gray-700">기타</span>
            </div>
          </div>

          {/* Floating Mobile Controls */}
          <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
            <button
              onClick={zoomIn}
              className="h-11 w-11 flex items-center justify-center rounded-full bg-white shadow-lg text-gray-700 active:scale-90"
            >
              <ZoomIn className="h-6 w-6" />
            </button>
            <button
              onClick={zoomOut}
              className="h-11 w-11 flex items-center justify-center rounded-full bg-white shadow-lg text-gray-700 active:scale-90"
            >
              <ZoomOut className="h-6 w-6" />
            </button>
            <button
              onClick={resetZoom}
              className="h-11 w-11 flex items-center justify-center rounded-full bg-white shadow-lg text-xs font-bold text-gray-700 active:scale-90"
            >
              1:1
            </button>
          </div>

          <MarkupCanvas
            backgroundUrl={initialDocument?.original_blueprint_url || ''}
            viewerState={state.viewerState}
            objects={state.markupObjects}
            selectedIds={state.selectedObjects}
            onPointerDown={handlers.handlePointerDown}
            onPointerMove={handlers.handlePointerMove}
            onPointerUp={handlers.handlePointerUp}
            previewObject={engine.previewObject}
          />
        </div>
      </div>

      {/* Mobile Bottom Sheet */}
      {isMobile && showMobileSheet && (
        <div className="fixed inset-0 z-[200] flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setShowMobileSheet(false)}
          />
          <div className="relative z-10 flex max-h-[70vh] flex-col rounded-t-[32px] bg-white shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-gray-200" />
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="text-lg font-bold text-gray-800">도구 설정</div>
              <button className="text-blue-500 font-bold" onClick={() => setShowMobileSheet(false)}>
                완료
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-6 pb-12">
              <ContextContent
                state={state}
                activeTool={state.toolState.activeTool}
                boxShape={boxShape}
                setBoxShape={setBoxShape}
                boxSize={boxSize}
                setBoxSize={setBoxSize}
                textSize={textSize}
                setTextSize={setTextSize}
                textColor={textColor}
                setTextColor={setTextColor}
                penColor={penColor}
                setPenColor={setPenColor}
                penWidth={penWidth}
                setPenWidth={setPenWidth}
                setTool={handleSetTool}
                deleteSelected={deleteSelected}
                copySelected={engine.copySelected}
                pasteSelected={engine.paste}
                updateObject={updateObject}
                setStamp={engine.setStamp}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SharedMarkupEditor
