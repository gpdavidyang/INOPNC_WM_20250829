'use client'

import React from 'react'
import {
  MousePointer,
  Hand,
  Stamp as StampIcon,
  Type as TypeIcon,
  Pencil,
  Square,
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

  const { zoomIn, zoomOut, resetZoom, pan } = useCanvasState(editorState, setEditorState)
  const { undo, redo, deleteSelected } = useMarkupTools(editorState, setEditorState)

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
          fontSize: 14,
          fontColor: '#111827',
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
        ;(lastPointRef as any).currentBoxMeta = { color, label, start: p }
        return
      }

      if (tool === 'pen') {
        setEditorState(prev => ({ ...prev, toolState: { ...prev.toolState, isDrawing: true } }))
        lastPointRef.current = p
        ;(lastPointRef as any).currentPath = [p]
        return
      }

      // select (simple hit-test)
      const hitId = hitTest(editorState.markupObjects, p)
      setEditorState(prev => ({ ...prev, selectedObjects: hitId ? [hitId] : [] }))
    },
    [
      editorState.toolState.activeTool,
      editorState.toolState.stampSettings,
      editorState.markupObjects,
      worldFromClient,
      addObjectWithUndo,
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

      if (tool.startsWith('box-') && editorState.toolState.isDrawing) {
        const meta = (lastPointRef as any).currentBoxMeta
        if (meta) {
          const start = meta.start as { x: number; y: number }
          const end = worldFromClient(client)
          const w = Math.max(1, Math.abs(end.x - start.x))
          const h = Math.max(1, Math.abs(end.y - start.y))
          const x = Math.min(start.x, end.x)
          const y = Math.min(start.y, end.y)
          const obj: MarkupObject = {
            id: genId('box'),
            type: 'box',
            x,
            y,
            width: w,
            height: h,
            color: meta.color,
            label: meta.label,
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
            strokeColor: '#ef4444',
            strokeWidth: 2,
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

  const setTool = (tool: ToolType) =>
    setEditorState(prev => ({ ...prev, toolState: { ...prev.toolState, activeTool: tool } }))

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

  return (
    <div className="flex h-full w-full flex-col gap-2">
      {/* Top toolbar */}
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
            팬
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

      {/* Middle area */}
      <div className="flex min-h-0 flex-1 gap-2">
        {/* Tool palette */}
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
              </div>

              <div className="h-px bg-gray-200" />
              <div className="text-xs font-medium text-gray-500">박스</div>
              <div className="grid grid-cols-3 gap-2">
                <ColorTool
                  color="red"
                  active={editorState.toolState.activeTool === 'box-red'}
                  label="박스 빨강"
                  onClick={() => setTool('box-red')}
                />
                <ColorTool
                  color="blue"
                  active={editorState.toolState.activeTool === 'box-blue'}
                  label="박스 파랑"
                  onClick={() => setTool('box-blue')}
                />
                <ColorTool
                  color="gray"
                  active={editorState.toolState.activeTool === 'box-gray'}
                  label="박스 회색"
                  onClick={() => setTool('box-gray')}
                />
              </div>

              <div className="h-px bg-gray-200" />
              <div className="text-xs font-medium text-gray-500">스탬프 설정</div>
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
                <select
                  className="rounded border px-2 py-1"
                  value={editorState.toolState.stampSettings?.shape || DEFAULT_STAMP.shape}
                  onChange={e => setStamp({ shape: e.target.value as any })}
                >
                  <option value="circle">원</option>
                  <option value="triangle">삼각형</option>
                  <option value="square">사각형</option>
                  <option value="star">별</option>
                </select>
                <select
                  className="rounded border px-2 py-1"
                  value={editorState.toolState.stampSettings?.size || DEFAULT_STAMP.size}
                  onChange={e => setStamp({ size: e.target.value as any })}
                >
                  <option value="small">작게</option>
                  <option value="medium">중간</option>
                  <option value="large">크게</option>
                </select>
                <button className="px-2 py-1 rounded border" onClick={() => deleteSelected()}>
                  선택 삭제
                </button>
              </div>
            </div>
          </ToolPalette>
        </div>

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
      <BottomStatusbar>
        <div className="flex items-center gap-3">
          <span>줌: {Math.round(editorState.viewerState.zoom * 100)}%</span>
          <span>선택: {editorState.selectedObjects.length}개</span>
          <span>객체: {editorState.markupObjects.length}개</span>
        </div>
      </BottomStatusbar>
    </div>
  )
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
