'use client'

import React from 'react'
import { toast } from 'sonner'
import {
  MousePointer,
  Hand,
  Stamp as StampIcon,
  Type as TypeIcon,
  Pencil,
  Square,
  Trash2,
} from 'lucide-react'
import type { MarkupEditorState, MarkupObject, StampMarkup, ToolType } from '@/types/markup'
import { TopToolbar } from './toolbar/top-toolbar'
import { ToolPalette } from './toolbar/tool-palette'
import { BottomStatusbar } from './toolbar/bottom-statusbar'
import MarkupCanvas from './canvas/markup-canvas'
import { useCanvasState } from './hooks/use-canvas-state'
import { useMarkupTools } from './hooks/use-markup-tools'

type AnyDoc = {
  id?: string
  title?: string
  original_blueprint_url?: string
  original_blueprint_filename?: string
  markup_data?: MarkupObject[]
}

interface SharedMarkupEditorProps {
  profile?: { id: string; full_name?: string | null } | null
  mode?: 'worker' | 'admin'
  initialDocument: AnyDoc
  onSave?: (document: AnyDoc) => Promise<void> | void
  onClose?: () => void
  embedded?: boolean
}

const DEFAULT_STAMP: Required<NonNullable<MarkupEditorState['toolState']['stampSettings']>> = {
  // user preference: red/medium/circle
  shape: 'circle',
  size: 'medium',
  color: 'red',
}

const TEXT_SIZE_MAP: Record<'small' | 'medium' | 'large', number> = {
  small: 12,
  medium: 14,
  large: 18,
}

function genId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function sizeToPixels(size: 'small' | 'medium' | 'large') {
  switch (size) {
    case 'small':
      return 18
    case 'large':
      return 36
    default:
      return 24
  }
}

export function SharedMarkupEditor({
  profile,
  mode = 'worker',
  initialDocument,
  onSave,
  onClose,
  embedded,
}: SharedMarkupEditorProps) {
  const isMobile = Boolean(embedded)
  const [editorState, setEditorState] = React.useState<MarkupEditorState>(() => ({
    currentFile: initialDocument as unknown as any,
    originalBlueprint: null,
    toolState: {
      activeTool: 'select',
      isDrawing: false,
      selectedObjects: [],
      clipboard: [],
      stampSettings: DEFAULT_STAMP,
    },
    viewerState: {
      zoom: 1,
      panX: 0,
      panY: 0,
      imageWidth: 0,
      imageHeight: 0,
    },
    markupObjects: Array.isArray(initialDocument?.markup_data)
      ? (initialDocument.markup_data as MarkupObject[])
      : [],
    selectedObjects: [],
    undoStack: [],
    redoStack: [],
    isLoading: false,
    isSaving: false,
    showSavePage: false,
    showOpenDialog: false,
  }))

  React.useEffect(() => {
    if (!initialDocument) return
    setEditorState(prev => ({
      ...prev,
      currentFile: {
        ...(prev.currentFile || {}),
        ...(initialDocument as Record<string, unknown>),
      },
    }))
  }, [initialDocument])

  const { zoomIn, zoomOut, resetZoom, pan } = useCanvasState(editorState, setEditorState)
  const { undo, redo, deleteSelected, copySelected, paste } = useMarkupTools(
    editorState,
    setEditorState
  )

  // Local tool preferences
  const [textSize, setTextSize] = React.useState<'small' | 'medium' | 'large'>('medium')
  const [textColor, setTextColor] = React.useState<'gray' | 'red' | 'blue'>('gray')
  const [penColor, setPenColor] = React.useState<'gray' | 'red' | 'blue'>('red')
  const [penWidth, setPenWidth] = React.useState<1 | 3 | 5>(3)
  const [boxSize, setBoxSize] = React.useState<'small' | 'medium' | 'large'>('medium')

  const [showMobileSheet, setShowMobileSheet] = React.useState(false)
  const stampToastRef = React.useRef<string | number | null>(null)
  const [isExporting, setIsExporting] = React.useState(false)

  const bgUrl = (initialDocument?.original_blueprint_url || '') as string

  // Load image dimensions once
  React.useEffect(() => {
    if (!bgUrl) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () =>
      setEditorState(prev => ({
        ...prev,
        viewerState: { ...prev.viewerState, imageWidth: img.width, imageHeight: img.height },
      }))
    img.src = bgUrl
  }, [bgUrl])

  const addObjectWithUndo = React.useCallback(
    (obj: MarkupObject) => {
      setEditorState(prev => ({
        ...prev,
        markupObjects: [...prev.markupObjects, obj],
        selectedObjects: [obj.id],
        undoStack: [...prev.undoStack, prev.markupObjects],
        redoStack: [],
      }))
    },
    [setEditorState]
  )

  // Pointer handlers
  const isPanningRef = React.useRef(false)
  const lastPointRef = React.useRef<{ x: number; y: number } | null>(null)
  const dragSelectedRef = React.useRef<{
    active: boolean
    start: { x: number; y: number } | null
    initialObjects: MarkupObject[] | null
    pos: Record<string, { x: number; y: number }>
  }>({ active: false, start: null, initialObjects: null, pos: {} })

  const worldFromClient = React.useCallback(
    (pt: { x: number; y: number }) => {
      const { zoom, panX, panY } = editorState.viewerState
      return { x: (pt.x - panX) / zoom, y: (pt.y - panY) / zoom }
    },
    [editorState.viewerState]
  )

  const handlePointerDown = React.useCallback(
    (client: { x: number; y: number }) => {
      const tool = editorState.toolState.activeTool
      const p = worldFromClient(client)

      if (tool === 'pan') {
        isPanningRef.current = true
        lastPointRef.current = client
        return
      }

      if (tool === 'stamp') {
        const s = editorState.toolState.stampSettings || DEFAULT_STAMP
        const obj: StampMarkup = {
          id: genId('stamp'),
          type: 'stamp',
          x: p.x,
          y: p.y,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          shape: s.shape,
          size: s.size,
          color: s.color,
        }
        addObjectWithUndo(obj)
        return
      }

      if (tool === 'text') {
        const content = window.prompt('텍스트 입력') || ''
        if (!content.trim()) return
        const obj: MarkupObject = {
          id: genId('text'),
          type: 'text',
          x: p.x,
          y: p.y,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          content,
          fontSize: TEXT_SIZE_MAP[textSize],
          fontColor: colorToHex(textColor),
        } as any
        addObjectWithUndo(obj)
        return
      }

      if (tool.startsWith('box-')) {
        const color = tool === 'box-red' ? 'red' : tool === 'box-blue' ? 'blue' : 'gray'
        const label = color === 'red' ? '작업진행' : color === 'blue' ? '작업완료' : '자재구간'
        // begin drawing box
        setEditorState(prev => ({
          ...prev,
          toolState: { ...prev.toolState, isDrawing: true },
        }))
        lastPointRef.current = p
        // temp object attached during move handled in move handler (as preview not required, we finalize on up)
        ;(lastPointRef as any).currentBoxMeta = { color, label, start: p, size: boxSize }
        return
      }

      if (tool === 'pen') {
        setEditorState(prev => ({ ...prev, toolState: { ...prev.toolState, isDrawing: true } }))
        lastPointRef.current = p
        ;(lastPointRef as any).currentPath = [p]
        return
      }

      // select (hit-test + drag start)
      const hitId = hitTest(editorState.markupObjects, p)
      if (hitId) {
        const selectedIds = [hitId]
        const pos: Record<string, { x: number; y: number }> = {}
        editorState.markupObjects.forEach((o: any) => {
          if (selectedIds.includes(o.id)) pos[o.id] = { x: o.x, y: o.y }
        })
        dragSelectedRef.current = {
          active: true,
          start: p,
          initialObjects: editorState.markupObjects,
          pos,
        }
        setEditorState(prev => ({ ...prev, selectedObjects: selectedIds }))
        return
      }
      setEditorState(prev => ({ ...prev, selectedObjects: [] }))
    },
    [
      editorState.toolState.activeTool,
      editorState.toolState.stampSettings,
      editorState.markupObjects,
      worldFromClient,
      addObjectWithUndo,
      textSize,
      textColor,
      boxSize,
    ]
  )

  const handlePointerMove = React.useCallback(
    (client: { x: number; y: number }) => {
      const tool = editorState.toolState.activeTool
      if (tool === 'pan' && isPanningRef.current && lastPointRef.current) {
        const dx = client.x - lastPointRef.current.x
        const dy = client.y - lastPointRef.current.y
        pan(dx, dy)
        lastPointRef.current = client
        return
      }

      // handle dragging selected in select mode
      if (editorState.toolState.activeTool === 'select' && dragSelectedRef.current.active) {
        const start = dragSelectedRef.current.start
        if (start) {
          const now = worldFromClient(client)
          const dx = now.x - start.x
          const dy = now.y - start.y
          const base = dragSelectedRef.current.pos
          setEditorState(prev => ({
            ...prev,
            markupObjects: prev.markupObjects.map((o: any) =>
              prev.selectedObjects.includes(o.id)
                ? {
                    ...o,
                    x: (base[o.id]?.x ?? o.x) + dx,
                    y: (base[o.id]?.y ?? o.y) + dy,
                    modifiedAt: new Date().toISOString(),
                  }
                : o
            ),
          }))
        }
        return
      }

      if (!editorState.toolState.isDrawing) return

      if (tool === 'pen' && (lastPointRef as any).currentPath) {
        const p = worldFromClient(client)
        ;(lastPointRef as any).currentPath.push(p)
      }
    },
    [editorState.toolState.isDrawing, editorState.toolState.activeTool, pan, worldFromClient]
  )

  const handlePointerUp = React.useCallback(
    (client: { x: number; y: number }) => {
      const tool = editorState.toolState.activeTool
      if (tool === 'pan') {
        isPanningRef.current = false
        lastPointRef.current = null
        return
      }

      if (tool === 'select' && dragSelectedRef.current.active) {
        const init = dragSelectedRef.current.initialObjects
        dragSelectedRef.current.active = false
        dragSelectedRef.current.start = null
        dragSelectedRef.current.initialObjects = null
        dragSelectedRef.current.pos = {}
        if (init) {
          setEditorState(prev => ({ ...prev, undoStack: [...prev.undoStack, init], redoStack: [] }))
        }
        return
      }

      if (tool.startsWith('box-') && editorState.toolState.isDrawing) {
        const meta = (lastPointRef as any).currentBoxMeta
        if (meta) {
          const start = meta.start as { x: number; y: number }
          const end = worldFromClient(client)
          const w = Math.max(1, Math.abs(end.x - start.x))
          const h = Math.max(1, Math.abs(end.y - start.y))
          const x = Math.min(start.x, end.x)
          const y = Math.min(start.y, end.y)
          let labelText = meta.label
          if (meta.color === 'gray') {
            try {
              const userInput =
                typeof window !== 'undefined'
                  ? window.prompt('구역명을 입력하세요', labelText || '')
                  : null
              if (userInput && userInput.trim()) {
                labelText = userInput.trim()
              }
            } catch {
              // ignore prompt errors; fallback to default label
            }
          }
          const obj: MarkupObject = {
            id: genId('box'),
            type: 'box',
            x,
            y,
            width: w,
            height: h,
            color: meta.color,
            label: labelText,
            size: meta.size,
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
          } as any
          addObjectWithUndo(obj)
        }
        setEditorState(prev => ({ ...prev, toolState: { ...prev.toolState, isDrawing: false } }))
        ;(lastPointRef as any).currentBoxMeta = undefined
        return
      }

      if (tool === 'pen' && editorState.toolState.isDrawing) {
        const path = (lastPointRef as any).currentPath as Array<{ x: number; y: number }>
        if (Array.isArray(path) && path.length > 1) {
          const obj: MarkupObject = {
            id: genId('pen'),
            type: 'drawing',
            x: path[0].x,
            y: path[0].y,
            path,
            strokeColor: colorToHex(penColor),
            strokeWidth: penWidth,
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
          } as any
          addObjectWithUndo(obj)
        }
        setEditorState(prev => ({ ...prev, toolState: { ...prev.toolState, isDrawing: false } }))
        ;(lastPointRef as any).currentPath = undefined
        return
      }
    },
    [
      editorState.toolState.isDrawing,
      editorState.toolState.activeTool,
      addObjectWithUndo,
      worldFromClient,
    ]
  )

  const handleDownloadImage = React.useCallback(async () => {
    if (!bgUrl) {
      toast.error('원본 도면을 찾을 수 없습니다.')
      return
    }
    try {
      setIsExporting(true)
      const image = await loadImageForExport(bgUrl)
      const width = image.naturalWidth || image.width || editorState.viewerState.imageWidth || 0
      const height = image.naturalHeight || image.height || editorState.viewerState.imageHeight || 0
      if (!width || !height) {
        throw new Error('도면 크기를 확인할 수 없습니다.')
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('이미지 캔버스를 초기화할 수 없습니다.')
      }

      ctx.drawImage(image, 0, 0, width, height)
      drawMarkupObjectsToCanvas(ctx, editorState.markupObjects)

      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = buildDownloadFileName(initialDocument)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('이미지 파일로 저장했습니다.')
    } catch (error) {
      console.error('Markup image download failed:', error)
      toast.error('이미지 저장에 실패했습니다.')
    } finally {
      setIsExporting(false)
    }
  }, [
    bgUrl,
    editorState.markupObjects,
    editorState.viewerState.imageHeight,
    editorState.viewerState.imageWidth,
    initialDocument,
  ])

  const setTool = (tool: ToolType) => {
    setEditorState(prev => ({ ...prev, toolState: { ...prev.toolState, activeTool: tool } }))
    // Mobile UX: open tool settings automatically for tools that have sub options
    if (isMobile) {
      const hasSubOptions =
        tool === 'text' || tool === 'pen' || (typeof tool === 'string' && tool.startsWith('box-'))
      // For 'stamp', restore legacy behavior: show quick-select toast instead of sheet
      if (tool === 'stamp') {
        // Show legacy quick toast and also open the sheet as a reliable fallback
        setShowMobileSheet(true)
        showStampQuickToast()
      } else {
        setShowMobileSheet(hasSubOptions)
      }
    }
  }

  function showStampQuickToast() {
    try {
      if (stampToastRef.current) {
        toast.dismiss(stampToastRef.current)
      }

      const selectStamp = (
        updates: Partial<NonNullable<MarkupEditorState['toolState']['stampSettings']>>
      ) => {
        setStamp(updates)
        // Re-open to reflect active state immediately
        showStampQuickToast()
      }

      const id = toast.custom(
        t => (
          <div className="pointer-events-auto w-[min(92vw,380px)] rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
            <div className="mb-2 text-sm font-medium text-gray-800">스탬프 설정</div>
            <div className="grid gap-3">
              <div>
                <div className="mb-1 text-xs text-gray-500">색상</div>
                <div className="flex items-center gap-2">
                  <StampColor
                    color="red"
                    active={
                      (editorState.toolState.stampSettings?.color || DEFAULT_STAMP.color) === 'red'
                    }
                    onClick={() => selectStamp({ color: 'red' })}
                  />
                  <StampColor
                    color="blue"
                    active={
                      (editorState.toolState.stampSettings?.color || DEFAULT_STAMP.color) === 'blue'
                    }
                    onClick={() => selectStamp({ color: 'blue' })}
                  />
                  <StampColor
                    color="gray"
                    active={
                      (editorState.toolState.stampSettings?.color || DEFAULT_STAMP.color) === 'gray'
                    }
                    onClick={() => selectStamp({ color: 'gray' })}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs text-gray-500">모양</div>
                <div className="flex flex-wrap items-center gap-2">
                  <ShapeChip
                    shape="circle"
                    active={
                      (editorState.toolState.stampSettings?.shape || DEFAULT_STAMP.shape) ===
                      'circle'
                    }
                    onClick={() => selectStamp({ shape: 'circle' })}
                  />
                  <ShapeChip
                    shape="triangle"
                    active={
                      (editorState.toolState.stampSettings?.shape || DEFAULT_STAMP.shape) ===
                      'triangle'
                    }
                    onClick={() => selectStamp({ shape: 'triangle' })}
                  />
                  <ShapeChip
                    shape="square"
                    active={
                      (editorState.toolState.stampSettings?.shape || DEFAULT_STAMP.shape) ===
                      'square'
                    }
                    onClick={() => selectStamp({ shape: 'square' })}
                  />
                  <ShapeChip
                    shape="star"
                    active={
                      (editorState.toolState.stampSettings?.shape || DEFAULT_STAMP.shape) === 'star'
                    }
                    onClick={() => selectStamp({ shape: 'star' })}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs text-gray-500">크기</div>
                <div className="flex flex-wrap items-center gap-2">
                  <SizeChip
                    size="small"
                    active={
                      (editorState.toolState.stampSettings?.size || DEFAULT_STAMP.size) === 'small'
                    }
                    onClick={() => selectStamp({ size: 'small' })}
                  />
                  <SizeChip
                    size="medium"
                    active={
                      (editorState.toolState.stampSettings?.size || DEFAULT_STAMP.size) === 'medium'
                    }
                    onClick={() => selectStamp({ size: 'medium' })}
                  />
                  <SizeChip
                    size="large"
                    active={
                      (editorState.toolState.stampSettings?.size || DEFAULT_STAMP.size) === 'large'
                    }
                    onClick={() => selectStamp({ size: 'large' })}
                  />
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button className="rounded border px-2 py-1 text-xs" onClick={() => toast.dismiss(t)}>
                닫기
              </button>
            </div>
          </div>
        ),
        {
          duration: 4000,
          position: 'bottom-center',
        }
      )

      stampToastRef.current = id
    } catch (error) {
      console.warn('Failed to display stamp picker toast', error)
    }
  }

  const setStamp = (
    updates: Partial<NonNullable<MarkupEditorState['toolState']['stampSettings']>>
  ) =>
    setEditorState(prev => ({
      ...prev,
      toolState: {
        ...prev.toolState,
        stampSettings: { ...(prev.toolState.stampSettings || DEFAULT_STAMP), ...updates },
      },
    }))

  const doSave = async () => {
    const payload: AnyDoc = {
      ...(editorState.currentFile || {}),
      title: (editorState.currentFile as any)?.title || initialDocument?.title || '무제 도면',
      original_blueprint_url:
        (editorState.currentFile as any)?.original_blueprint_url ||
        initialDocument?.original_blueprint_url,
      original_blueprint_filename:
        (editorState.currentFile as any)?.original_blueprint_filename ||
        initialDocument?.original_blueprint_filename,
      markup_data: editorState.markupObjects,
    }
    await onSave?.(payload)
  }

  const ContextContent = () => (
    <>
      {editorState.selectedObjects.length > 0 ? (
        <>
          <div className="text-xs font-medium text-gray-500">선택 항목</div>
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <button
                className="px-2 py-1 rounded border"
                onClick={() => deleteSelected()}
                disabled={editorState.selectedObjects.length === 0}
              >
                삭제
              </button>
              <button
                className="px-2 py-1 rounded border"
                onClick={copySelected}
                disabled={editorState.selectedObjects.length === 0}
              >
                복사
              </button>
              <button
                className="px-2 py-1 rounded border"
                onClick={paste}
                disabled={editorState.toolState.clipboard.length === 0}
              >
                붙여넣기
              </button>
            </div>

            {editorState.selectedObjects.length === 1 &&
              (() => {
                const sel = editorState.markupObjects.find(
                  o => o.id === editorState.selectedObjects[0]
                ) as any
                if (!sel) return null
                const apply = (updates: Partial<any>) => {
                  setEditorState(prev => ({
                    ...prev,
                    undoStack: [...prev.undoStack, prev.markupObjects],
                    redoStack: [],
                    markupObjects: prev.markupObjects.map((o: any) =>
                      o.id === sel.id
                        ? { ...o, ...updates, modifiedAt: new Date().toISOString() }
                        : o
                    ),
                  }))
                }
                if (sel.type === 'box') {
                  return (
                    <div className="grid gap-2">
                      <div className="text-xs text-gray-500">색/의미</div>
                      <div className="grid grid-cols-3 gap-2">
                        <ColorTool
                          color="gray"
                          active={sel.color === 'gray'}
                          label="자재구간"
                          onClick={() => apply({ color: 'gray', label: '자재구간' })}
                        />
                        <ColorTool
                          color="red"
                          active={sel.color === 'red'}
                          label="작업진행"
                          onClick={() => apply({ color: 'red', label: '작업진행' })}
                        />
                        <ColorTool
                          color="blue"
                          active={sel.color === 'blue'}
                          label="작업완료"
                          onClick={() => apply({ color: 'blue', label: '작업완료' })}
                        />
                      </div>
                      <div className="text-xs text-gray-500">크기</div>
                      <div className="flex flex-wrap items-center gap-2">
                        <SizeChip
                          size="small"
                          active={(sel as any).size === 'small'}
                          onClick={() => {
                            setBoxSize('small')
                            apply({ size: 'small' })
                          }}
                        />
                        <SizeChip
                          size="medium"
                          active={(sel as any).size === 'medium' || !(sel as any).size}
                          onClick={() => {
                            setBoxSize('medium')
                            apply({ size: 'medium' })
                          }}
                        />
                        <SizeChip
                          size="large"
                          active={(sel as any).size === 'large'}
                          onClick={() => {
                            setBoxSize('large')
                            apply({ size: 'large' })
                          }}
                        />
                      </div>
                    </div>
                  )
                }
                if (sel.type === 'text') {
                  return (
                    <div className="grid gap-2">
                      <div className="text-xs text-gray-500">텍스트 편집</div>
                      <button
                        className="px-2 py-1 rounded border"
                        onClick={() => {
                          const t = window.prompt('텍스트 수정', sel.content || '')
                          if (t != null) apply({ content: t })
                        }}
                      >
                        내용 수정
                      </button>
                      <div className="text-xs text-gray-500">크기</div>
                      <div className="flex flex-wrap items-center gap-2">
                        <SizeChip
                          size="small"
                          active={detectTextSize(sel.fontSize) === 'small'}
                          onClick={() => {
                            setTextSize('small')
                            apply({ fontSize: TEXT_SIZE_MAP.small })
                          }}
                        />
                        <SizeChip
                          size="medium"
                          active={detectTextSize(sel.fontSize) === 'medium'}
                          onClick={() => {
                            setTextSize('medium')
                            apply({ fontSize: TEXT_SIZE_MAP.medium })
                          }}
                        />
                        <SizeChip
                          size="large"
                          active={detectTextSize(sel.fontSize) === 'large'}
                          onClick={() => {
                            setTextSize('large')
                            apply({ fontSize: TEXT_SIZE_MAP.large })
                          }}
                        />
                      </div>
                    </div>
                  )
                }
                if (sel.type === 'stamp') {
                  return (
                    <div className="grid gap-2">
                      <div className="text-xs text-gray-500">스탬프 속성</div>
                      <div className="grid grid-cols-3 gap-2">
                        <StampColor
                          color="red"
                          active={sel.color === 'red'}
                          onClick={() => apply({ color: 'red' })}
                        />
                        <StampColor
                          color="blue"
                          active={sel.color === 'blue'}
                          onClick={() => apply({ color: 'blue' })}
                        />
                        <StampColor
                          color="gray"
                          active={sel.color === 'gray'}
                          onClick={() => apply({ color: 'gray' })}
                        />
                      </div>
                      <div className="text-xs text-gray-500">크기</div>
                      <div className="flex flex-wrap items-center gap-2">
                        <SizeChip
                          size="small"
                          active={sel.size === 'small'}
                          onClick={() => {
                            setStamp({ size: 'small' })
                            apply({ size: 'small' })
                          }}
                        />
                        <SizeChip
                          size="medium"
                          active={sel.size === 'medium'}
                          onClick={() => {
                            setStamp({ size: 'medium' })
                            apply({ size: 'medium' })
                          }}
                        />
                        <SizeChip
                          size="large"
                          active={sel.size === 'large'}
                          onClick={() => {
                            setStamp({ size: 'large' })
                            apply({ size: 'large' })
                          }}
                        />
                      </div>
                    </div>
                  )
                }
                return null
              })()}
          </div>
        </>
      ) : (
        <>
          {editorState.toolState.activeTool.startsWith('box-') && (
            <>
              <div className="text-xs font-medium text-gray-500">박스</div>
              <div className="grid grid-cols-3 gap-2">
                <ColorTool
                  color="gray"
                  active={editorState.toolState.activeTool === 'box-gray'}
                  label="자재구간"
                  onClick={() => setTool('box-gray')}
                />
                <ColorTool
                  color="red"
                  active={editorState.toolState.activeTool === 'box-red'}
                  label="작업진행"
                  onClick={() => setTool('box-red')}
                />
                <ColorTool
                  color="blue"
                  active={editorState.toolState.activeTool === 'box-blue'}
                  label="작업완료"
                  onClick={() => setTool('box-blue')}
                />
              </div>
            </>
          )}
          {editorState.toolState.activeTool === 'stamp' && (
            <>
              <div className="text-xs font-medium text-gray-500">스탬프</div>
              <div className="grid gap-2">
                <div className="grid grid-cols-3 gap-2">
                  <StampColor
                    color="red"
                    active={
                      (editorState.toolState.stampSettings?.color || DEFAULT_STAMP.color) === 'red'
                    }
                    onClick={() => setStamp({ color: 'red' })}
                  />
                  <StampColor
                    color="blue"
                    active={
                      (editorState.toolState.stampSettings?.color || DEFAULT_STAMP.color) === 'blue'
                    }
                    onClick={() => setStamp({ color: 'blue' })}
                  />
                  <StampColor
                    color="gray"
                    active={
                      (editorState.toolState.stampSettings?.color || DEFAULT_STAMP.color) === 'gray'
                    }
                    onClick={() => setStamp({ color: 'gray' })}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ShapeChip
                    shape="circle"
                    active={
                      (editorState.toolState.stampSettings?.shape || DEFAULT_STAMP.shape) ===
                      'circle'
                    }
                    onClick={() => setStamp({ shape: 'circle' })}
                  />
                  <ShapeChip
                    shape="triangle"
                    active={
                      (editorState.toolState.stampSettings?.shape || DEFAULT_STAMP.shape) ===
                      'triangle'
                    }
                    onClick={() => setStamp({ shape: 'triangle' })}
                  />
                  <ShapeChip
                    shape="square"
                    active={
                      (editorState.toolState.stampSettings?.shape || DEFAULT_STAMP.shape) ===
                      'square'
                    }
                    onClick={() => setStamp({ shape: 'square' })}
                  />
                  <ShapeChip
                    shape="star"
                    active={
                      (editorState.toolState.stampSettings?.shape || DEFAULT_STAMP.shape) === 'star'
                    }
                    onClick={() => setStamp({ shape: 'star' })}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <SizeChip
                    size="small"
                    active={
                      (editorState.toolState.stampSettings?.size || DEFAULT_STAMP.size) === 'small'
                    }
                    onClick={() => setStamp({ size: 'small' })}
                  />
                  <SizeChip
                    size="medium"
                    active={
                      (editorState.toolState.stampSettings?.size || DEFAULT_STAMP.size) === 'medium'
                    }
                    onClick={() => setStamp({ size: 'medium' })}
                  />
                  <SizeChip
                    size="large"
                    active={
                      (editorState.toolState.stampSettings?.size || DEFAULT_STAMP.size) === 'large'
                    }
                    onClick={() => setStamp({ size: 'large' })}
                  />
                </div>
              </div>
            </>
          )}
          {editorState.toolState.activeTool === 'text' && (
            <>
              <div className="text-xs font-medium text-gray-500">텍스트</div>
              <div className="flex flex-wrap items-center gap-2">
                <SizeChip
                  size="small"
                  active={textSize === 'small'}
                  onClick={() => setTextSize('small')}
                />
                <SizeChip
                  size="medium"
                  active={textSize === 'medium'}
                  onClick={() => setTextSize('medium')}
                />
                <SizeChip
                  size="large"
                  active={textSize === 'large'}
                  onClick={() => setTextSize('large')}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StampColor
                  color="gray"
                  active={textColor === 'gray'}
                  onClick={() => setTextColor('gray')}
                />
                <StampColor
                  color="red"
                  active={textColor === 'red'}
                  onClick={() => setTextColor('red')}
                />
                <StampColor
                  color="blue"
                  active={textColor === 'blue'}
                  onClick={() => setTextColor('blue')}
                />
              </div>
            </>
          )}
          {editorState.toolState.activeTool.startsWith('box-') && (
            <>
              <div className="text-xs font-medium text-gray-500">도형</div>
              <div className="flex flex-wrap items-center gap-2">
                <SizeChip
                  size="small"
                  active={boxSize === 'small'}
                  onClick={() => setBoxSize('small')}
                />
                <SizeChip
                  size="medium"
                  active={boxSize === 'medium'}
                  onClick={() => setBoxSize('medium')}
                />
                <SizeChip
                  size="large"
                  active={boxSize === 'large'}
                  onClick={() => setBoxSize('large')}
                />
              </div>
            </>
          )}
          {editorState.toolState.activeTool === 'pen' && (
            <>
              <div className="text-xs font-medium text-gray-500">펜</div>
              <div className="flex flex-wrap items-center gap-2">
                <StampColor
                  color="gray"
                  active={penColor === 'gray'}
                  onClick={() => setPenColor('gray')}
                />
                <StampColor
                  color="red"
                  active={penColor === 'red'}
                  onClick={() => setPenColor('red')}
                />
                <StampColor
                  color="blue"
                  active={penColor === 'blue'}
                  onClick={() => setPenColor('blue')}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <WidthChip w={1} active={penWidth === 1} onClick={() => setPenWidth(1)} />
                <WidthChip w={3} active={penWidth === 3} onClick={() => setPenWidth(3)} />
                <WidthChip w={5} active={penWidth === 5} onClick={() => setPenWidth(5)} />
              </div>
            </>
          )}
        </>
      )}
    </>
  )

  return (
    <div className="flex h-full w-full flex-col gap-2">
      {/* Top toolbar (desktop/admin only) */}
      {!isMobile && (
        <TopToolbar>
          <div className="flex items-center gap-2">
            <button
              className={`px-2 py-1 rounded border ${editorState.toolState.activeTool === 'select' ? 'bg-gray-100' : ''}`}
              onClick={() => setTool('select')}
            >
              선택
            </button>
            <button
              className={`px-2 py-1 rounded border ${editorState.toolState.activeTool === 'pan' ? 'bg-gray-100' : ''}`}
              onClick={() => setTool('pan')}
            >
              이동
            </button>
            <button
              className={`px-2 py-1 rounded border ${editorState.toolState.activeTool === 'pen' ? 'bg-gray-100' : ''}`}
              onClick={() => setTool('pen')}
            >
              펜
            </button>
            <button className="px-2 py-1 rounded border" onClick={zoomOut}>
              -
            </button>
            <button className="px-2 py-1 rounded border" onClick={zoomIn}>
              +
            </button>
            <button className="px-2 py-1 rounded border" onClick={resetZoom}>
              100%
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 rounded border"
              onClick={() => deleteSelected()}
              disabled={editorState.selectedObjects.length === 0}
              title="선택 삭제"
            >
              삭제
            </button>
            <button
              className="px-2 py-1 rounded border"
              onClick={undo}
              disabled={editorState.undoStack.length === 0}
            >
              되돌리기
            </button>
            <button
              className="px-2 py-1 rounded border"
              onClick={redo}
              disabled={editorState.redoStack.length === 0}
            >
              다시하기
            </button>
            <button
              className="px-2 py-1 rounded border"
              onClick={copySelected}
              disabled={editorState.selectedObjects.length === 0}
              title="선택 복사"
            >
              복사
            </button>
            <button
              className="px-2 py-1 rounded border"
              onClick={paste}
              disabled={editorState.toolState.clipboard.length === 0}
              title="붙여넣기"
            >
              붙여넣기
            </button>
            <button
              className="px-3 py-1.5 rounded border"
              onClick={handleDownloadImage}
              disabled={isExporting || !bgUrl}
              title="마킹된 이미지를 다운로드"
            >
              {isExporting ? '내보내는 중...' : '이미지 다운로드'}
            </button>
            <button
              className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700"
              onClick={doSave}
              disabled={editorState.isSaving}
            >
              저장
            </button>
            {onClose && (
              <button className="px-3 py-1.5 rounded border" onClick={onClose}>
                닫기
              </button>
            )}
          </div>
        </TopToolbar>
      )}

      {/* Middle area */}
      <div className="flex min-h-0 flex-1 gap-2">
        {/* Tool palette */}
        {!isMobile && (
          <div className="w-56 shrink-0">
            <ToolPalette>
              <div className="grid gap-3">
                <div className="text-xs font-medium text-gray-500">도구</div>
                <div className="grid grid-cols-3 gap-2">
                  <IconToggle
                    active={editorState.toolState.activeTool === 'select'}
                    label="선택"
                    onClick={() => setTool('select')}
                  >
                    <MousePointer className="w-4 h-4" />
                  </IconToggle>
                  <IconToggle
                    active={editorState.toolState.activeTool === 'pan'}
                    label="이동"
                    onClick={() => setTool('pan')}
                  >
                    <Hand className="w-4 h-4" />
                  </IconToggle>
                  <IconToggle
                    active={editorState.toolState.activeTool === 'pen'}
                    label="펜"
                    onClick={() => setTool('pen')}
                  >
                    <Pencil className="w-4 h-4" />
                  </IconToggle>
                  <IconToggle
                    active={editorState.toolState.activeTool === 'text'}
                    label="텍스트"
                    onClick={() => setTool('text')}
                  >
                    <TypeIcon className="w-4 h-4" />
                  </IconToggle>
                  <IconToggle
                    active={editorState.toolState.activeTool === 'stamp'}
                    label="스탬프"
                    onClick={() => setTool('stamp')}
                  >
                    <StampIcon className="w-4 h-4" />
                  </IconToggle>
                  <IconToggle
                    active={editorState.toolState.activeTool.startsWith('box-')}
                    label="박스"
                    onClick={() => setTool('box-gray')}
                  >
                    <Square className="w-4 h-4" />
                  </IconToggle>
                </div>
                <ContextContent />
              </div>
            </ToolPalette>
          </div>
        )}

        {/* Canvas */}
        <div className="min-h-0 flex-1">
          <MarkupCanvas
            backgroundUrl={bgUrl}
            viewerState={editorState.viewerState}
            objects={editorState.markupObjects}
            selectedIds={editorState.selectedObjects}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
        </div>
      </div>

      {/* Bottom status bar */}
      {!isMobile && (
        <BottomStatusbar>
          <div className="flex items-center gap-3">
            <span>줌: {Math.round(editorState.viewerState.zoom * 100)}%</span>
            <span>선택: {editorState.selectedObjects.length}개</span>
            <span>객체: {editorState.markupObjects.length}개</span>
          </div>
          <div className="flex flex-wrap items-center gap-2" />
        </BottomStatusbar>
      )}

      {/* Mobile bottom toolbar + sheet */}
      {isMobile && (
        <>
          <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-white">
            <div className="flex items-center justify-between px-2 py-2">
              <div className="flex items-center gap-2">
                <IconToggle
                  active={editorState.toolState.activeTool === 'select'}
                  label="선택"
                  onClick={() => setTool('select')}
                >
                  <MousePointer className="w-5 h-5" />
                </IconToggle>
                <IconToggle
                  active={editorState.toolState.activeTool === 'pan'}
                  label="이동"
                  onClick={() => setTool('pan')}
                >
                  <Hand className="w-5 h-5" />
                </IconToggle>
                <IconToggle
                  active={editorState.toolState.activeTool.startsWith('box-')}
                  label="박스"
                  onClick={() => setTool('box-gray')}
                >
                  <Square className="w-5 h-5" />
                </IconToggle>
                <IconToggle
                  active={editorState.toolState.activeTool === 'text'}
                  label="텍스트"
                  onClick={() => setTool('text')}
                >
                  <TypeIcon className="w-5 h-5" />
                </IconToggle>
                <IconToggle
                  active={editorState.toolState.activeTool === 'pen'}
                  label="펜"
                  onClick={() => setTool('pen')}
                >
                  <Pencil className="w-5 h-5" />
                </IconToggle>
                <IconToggle
                  active={editorState.toolState.activeTool === 'stamp'}
                  label="스탬프"
                  onClick={() => setTool('stamp')}
                >
                  <StampIcon className="w-5 h-5" />
                </IconToggle>
                {editorState.selectedObjects.length > 0 && (
                  <IconToggle active={false} label="삭제" onClick={() => deleteSelected()}>
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </IconToggle>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 text-sm rounded-md border"
                  onClick={handleDownloadImage}
                  disabled={isExporting || !bgUrl}
                >
                  {isExporting ? '저장 중...' : '이미지 저장'}
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 text-sm rounded-md border"
                  onClick={() => setShowMobileSheet(s => !s)}
                >
                  설정
                </button>
              </div>
            </div>
          </div>

          {showMobileSheet && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/30"
                onClick={() => setShowMobileSheet(false)}
              />
              <div className="fixed inset-x-0 bottom-12 z-50 max-h-[55vh] overflow-y-auto rounded-t-2xl border-t bg-white p-4 shadow-xl">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-700">도구 설정</div>
                  <button
                    className="px-2 py-1 text-sm rounded border"
                    onClick={() => setShowMobileSheet(false)}
                  >
                    닫기
                  </button>
                </div>
                <ContextContent />
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

function detectTextSize(fontSize?: number): 'small' | 'medium' | 'large' {
  if (!fontSize) return 'medium'
  if (fontSize <= TEXT_SIZE_MAP.small) return 'small'
  if (fontSize >= TEXT_SIZE_MAP.large) return 'large'
  return 'medium'
}

function colorToHex(c: string) {
  // simple mapping for common names; pass-through for hex
  const map: Record<string, string> = { red: '#ef4444', blue: '#3b82f6', gray: '#6b7280' }
  if (c.startsWith('#')) return c
  return map[c] || c
}

function hitTest(objects: MarkupObject[], p: { x: number; y: number }): string | null {
  // naive: iterate from top-most (last) and check bbox contains p
  for (let i = objects.length - 1; i >= 0; i--) {
    const o = objects[i] as any
    if (o.type === 'box') {
      if (p.x >= o.x && p.x <= o.x + o.width && p.y >= o.y && p.y <= o.y + o.height) return o.id
    } else if (o.type === 'stamp') {
      const r = sizeToPixels(o.size) / 2
      if (o.shape === 'circle') {
        const dx = p.x - o.x
        const dy = p.y - o.y
        if (dx * dx + dy * dy <= r * r) return o.id
      } else {
        // approximate by square bbox for other shapes
        if (p.x >= o.x - r && p.x <= o.x + r && p.y >= o.y - r && p.y <= o.y + r) return o.id
      }
    } else if (o.type === 'text') {
      // rough 10x per character width box
      const w = Math.max(40, (o.content?.length || 0) * 8)
      const h = o.fontSize || 14
      if (p.x >= o.x && p.x <= o.x + w && p.y >= o.y - h && p.y <= o.y) return o.id
    } else if (o.type === 'drawing') {
      // near a segment threshold
      const th = 6
      const path = o.path || []
      for (let j = 1; j < path.length; j++) {
        if (distToSeg(p, path[j - 1], path[j]) <= th) return o.id
      }
    }
  }
  return null
}

function distToSeg(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number }
) {
  const l2 = (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y)
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y)
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2
  t = Math.max(0, Math.min(1, t))
  const proj = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) }
  return Math.hypot(p.x - proj.x, p.y - proj.y)
}

async function loadImageForExport(url: string): Promise<HTMLImageElement> {
  if (!url) throw new Error('이미지 경로가 없습니다.')
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return loadImageElement(url)
  }
  const response = await fetch(url, { credentials: 'include' }).catch(error => {
    console.error('Failed to fetch blueprint for export:', error)
    throw new Error('도면 이미지를 불러올 수 없습니다.')
  })
  if (!response || !response.ok) {
    throw new Error('도면 이미지를 불러올 수 없습니다.')
  }
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  try {
    return await loadImageElement(objectUrl)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function drawMarkupObjectsToCanvas(ctx: CanvasRenderingContext2D, objects: MarkupObject[]) {
  objects.forEach(obj => {
    const anyObj = obj as any
    if (obj.type === 'box') {
      const stroke = colorToHex(anyObj.color || 'gray')
      const width = Number(anyObj.width) || 0
      const height = Number(anyObj.height) || 0
      ctx.save()
      ctx.strokeStyle = stroke
      ctx.lineWidth = getBoxStrokeWidth(anyObj.size)
      ctx.strokeRect(anyObj.x, anyObj.y, width, height)
      if (anyObj.label) {
        ctx.font = '12px Pretendard, sans-serif'
        ctx.fillStyle = stroke
        ctx.textBaseline = 'bottom'
        ctx.fillText(String(anyObj.label), anyObj.x + 4, Math.max(12, anyObj.y - 4))
      }
      ctx.restore()
      return
    }

    if (obj.type === 'text') {
      const fontSize = Number(anyObj.fontSize) || 14
      ctx.save()
      ctx.font = `${fontSize}px Pretendard, sans-serif`
      ctx.fillStyle = anyObj.fontColor || '#111'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText(String(anyObj.content || ''), anyObj.x, anyObj.y)
      ctx.restore()
      return
    }

    if (obj.type === 'drawing') {
      const path = Array.isArray(anyObj.path) ? anyObj.path : []
      if (path.length > 1) {
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(path[0].x, path[0].y)
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i].x, path[i].y)
        }
        ctx.strokeStyle = colorToHex(anyObj.strokeColor || '#ef4444')
        ctx.lineWidth = Number(anyObj.strokeWidth) || 2
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.stroke()
        ctx.restore()
      }
      return
    }

    if (obj.type === 'stamp') {
      drawStampOnCanvas(ctx, anyObj)
    }
  })
}

function drawStampOnCanvas(ctx: CanvasRenderingContext2D, obj: any) {
  const color = colorToHex(obj.color || '#ef4444')
  const size = sizeToPixels(obj.size || 'medium')
  const half = size / 2
  ctx.save()
  ctx.fillStyle = color
  ctx.globalAlpha = 0.85
  if (obj.shape === 'circle') {
    ctx.beginPath()
    ctx.arc(obj.x, obj.y, half, 0, Math.PI * 2)
    ctx.fill()
  } else if (obj.shape === 'square') {
    ctx.fillRect(obj.x - half, obj.y - half, size, size)
  } else if (obj.shape === 'triangle') {
    ctx.beginPath()
    ctx.moveTo(obj.x, obj.y - half)
    ctx.lineTo(obj.x - half, obj.y + half)
    ctx.lineTo(obj.x + half, obj.y + half)
    ctx.closePath()
    ctx.fill()
  } else {
    const pts = getStarPoints(obj.x, obj.y, half, half / 2)
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y)
    }
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

function getStarPoints(cx: number, cy: number, outer: number, inner: number) {
  const pts: Array<{ x: number; y: number }> = []
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2
    const radius = i % 2 === 0 ? outer : inner
    pts.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius })
  }
  return pts
}

function buildDownloadFileName(doc?: AnyDoc) {
  const base = doc?.title || doc?.original_blueprint_filename || 'markup-blueprint'
  return `${sanitizeFilename(base)}.png`
}

function sanitizeFilename(value: string) {
  return (
    value
      ?.toString()
      .replace(/[\\/:*?"<>|]+/g, '_')
      .replace(/\s+/g, '_')
      .slice(0, 80) || 'markup'
  )
}

function getBoxStrokeWidth(size?: 'small' | 'medium' | 'large'): number {
  if (size === 'small') return 2
  if (size === 'large') return 4
  return 3
}

export default SharedMarkupEditor

// Icon button used in palette
function IconToggle({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean
  onClick?: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-md border px-2 py-2 text-gray-700 hover:bg-gray-50 ${
        active ? 'ring-2 ring-blue-500 bg-gray-50' : ''
      }`}
    >
      {children}
    </button>
  )
}

function ColorTool({
  color,
  active,
  onClick,
  label,
}: {
  color: 'red' | 'blue' | 'gray'
  active?: boolean
  onClick?: () => void
  label: string
}) {
  const map: Record<typeof color, string> = {
    red: 'text-red-500 border-red-500/40 bg-red-50',
    blue: 'text-blue-500 border-blue-500/40 bg-blue-50',
    gray: 'text-gray-600 border-gray-500/40 bg-gray-50',
  } as any
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-md border px-2 py-2 ${map[color]} ${
        active ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <Square className="w-4 h-4" />
    </button>
  )
}

function StampColor({
  color,
  active,
  onClick,
}: {
  color: 'red' | 'blue' | 'gray'
  active?: boolean
  onClick?: () => void
}) {
  const bg = color === 'red' ? 'bg-red-500' : color === 'blue' ? 'bg-blue-500' : 'bg-gray-500'
  return (
    <button
      type="button"
      aria-label={`스탬프 색상 ${color}`}
      title={`스탬프 색상 ${color}`}
      onClick={onClick}
      className={`h-7 w-7 rounded-full ${bg} ${active ? 'ring-2 ring-blue-500' : ''}`}
    />
  )
}

function SizeChip({
  size,
  active,
  onClick,
}: {
  size: 'small' | 'medium' | 'large'
  active?: boolean
  onClick?: () => void
}) {
  const label = size === 'small' ? 'S' : size === 'large' ? 'L' : 'M'
  return (
    <button
      type="button"
      aria-label={`크기 ${label}`}
      title={`크기 ${label}`}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-md border px-2 py-1 text-xs ${
        active ? 'ring-2 ring-blue-500 bg-gray-50' : ''
      }`}
    >
      {label}
    </button>
  )
}

function WidthChip({
  w,
  active,
  onClick,
}: {
  w: 1 | 3 | 5
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      aria-label={`굵기 ${w}px`}
      title={`굵기 ${w}px`}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-md border px-2 py-1 text-xs ${
        active ? 'ring-2 ring-blue-500 bg-gray-50' : ''
      }`}
    >
      {w}px
    </button>
  )
}

function ShapeChip({
  shape,
  active,
  onClick,
}: {
  shape: 'circle' | 'triangle' | 'square' | 'star'
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      aria-label={`모양 ${shape}`}
      title={`모양 ${shape}`}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-md border px-2 py-1 ${
        active ? 'ring-2 ring-blue-500 bg-gray-50' : ''
      }`}
    >
      {shape === 'circle' && (
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <circle cx="6" cy="6" r="5" fill="#374151" />
        </svg>
      )}
      {shape === 'triangle' && (
        <svg width="12" height="12" viewBox="0 0 12 12">
          <polygon points="6,1 11,11 1,11" fill="#374151" />
        </svg>
      )}
      {shape === 'square' && <span className="inline-block h-3 w-3 bg-gray-700" />}
      {shape === 'star' && (
        <svg width="12" height="12" viewBox="0 0 24 24">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.9L18.18 22 12 18.77 5.82 22 7 14.17l-5-4.9 6.91-1.01z"
            fill="#374151"
          />
        </svg>
      )}
    </button>
  )
}
