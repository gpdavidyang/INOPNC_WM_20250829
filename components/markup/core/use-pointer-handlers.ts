'use client'

import type { MarkupEditorState, MarkupObject } from '@/types/markup'
import React from 'react'
import { colorToHex } from '../utils/color-utils'

interface PointerHandlersProps {
  state: MarkupEditorState
  setState: React.Dispatch<React.SetStateAction<MarkupEditorState>>
  setPreviewObject: (obj: MarkupObject | null) => void
  addObject: (obj: MarkupObject, select?: boolean) => void
  worldFromClient: (pt: { x: number; y: number }) => { x: number; y: number }
  hitTest: (objects: MarkupObject[], p: { x: number; y: number }) => string | null

  // Preferences
  boxShape: string
  boxSize: 'small' | 'medium' | 'large'
  penColor: string
  penWidth: number
  textSize: 'small' | 'medium' | 'large'
  textColor: string
}

export function usePointerHandlers({
  state,
  setState,
  setPreviewObject,
  addObject,
  worldFromClient,
  hitTest,
  boxShape,
  boxSize,
  penColor,
  penWidth,
  textSize,
  textColor,
}: PointerHandlersProps) {
  const activePointers = React.useRef<Map<number, { x: number; y: number }>>(new Map())
  const lastPinchDist = React.useRef<number | null>(null)
  const isPanningRef = React.useRef(false)
  const lastPointRef = React.useRef<{ x: number; y: number } | null>(null)

  // For selection dragging
  const dragSelectedRef = React.useRef<{
    active: boolean
    start: { x: number; y: number } | null
    initialObjects: MarkupObject[] | null
    pos: Record<string, { x: number; y: number }>
  }>({ active: false, start: null, initialObjects: null, pos: {} })

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      const client = { x: e.clientX, y: e.clientY }
      activePointers.current.set(e.pointerId, client)

      if (activePointers.current.size >= 2) {
        lastPinchDist.current = null
        return
      }

      const tool = state.toolState.activeTool
      const p = worldFromClient(client)

      if (tool === 'pan') {
        isPanningRef.current = true
        lastPointRef.current = client
        return
      }

      // Clear selection if starting a drawing tool
      if (tool.startsWith('box-') || tool === 'pen' || tool === 'stamp') {
        if (state.selectedObjects.length > 0) {
          setState(prev => ({ ...prev, selectedObjects: [] }))
        }
      }

      if (tool.startsWith('box-')) {
        const color = tool === 'box-red' ? 'red' : tool === 'box-blue' ? 'blue' : 'gray'

        setState(prev => ({
          ...prev,
          toolState: { ...prev.toolState, isDrawing: true },
        }))
        lastPointRef.current = p
        ;(lastPointRef as any).currentBoxMeta = {
          color,
          start: p,
          size: boxSize,
        }
        return
      }

      if (tool === 'pen') {
        setState(prev => ({ ...prev, toolState: { ...prev.toolState, isDrawing: true } }))
        lastPointRef.current = p
        ;(lastPointRef as any).currentPath = [p]
        return
      }

      if (tool === 'stamp') {
        const settings = state.toolState.stampSettings || {
          shape: 'circle',
          size: 'medium',
          color: 'red',
        }
        const obj: MarkupObject = {
          id: `stamp-${Date.now()}`,
          type: 'stamp',
          x: p.x,
          y: p.y,
          shape: settings.shape,
          size: settings.size,
          color: settings.color,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
        } as any
        addObject(obj, false)
        return
      }

      if (tool === 'text') {
        const userInput = window.prompt('텍스트를 입력하세요', '')
        if (userInput?.trim()) {
          const sizeMap = { small: 12, medium: 14, large: 18 }
          const obj: MarkupObject = {
            id: `text-${Date.now()}`,
            type: 'text',
            x: p.x,
            y: p.y,
            content: userInput.trim(),
            fontSize: sizeMap[textSize] || 14,
            fontColor: colorToHex(textColor),
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
          } as any
          addObject(obj, true)
        }
        return
      }

      // select (hit-test + drag start)
      const hitId = hitTest(state.markupObjects, p)
      if (hitId) {
        const selectedIds = [hitId]
        const pos: Record<string, { x: number; y: number }> = {}
        state.markupObjects.forEach((o: any) => {
          if (selectedIds.includes(o.id)) pos[o.id] = { x: o.x, y: o.y }
        })
        dragSelectedRef.current = {
          active: true,
          start: p,
          initialObjects: state.markupObjects,
          pos,
        }
        setState(prev => ({ ...prev, selectedObjects: selectedIds }))
        return
      }
      setState(prev => ({ ...prev, selectedObjects: [] }))
    },
    [
      state.toolState.activeTool,
      state.toolState.stampSettings,
      state.selectedObjects,
      state.markupObjects,
      worldFromClient,
      setState,
      hitTest,
      boxSize,
      textSize,
      textColor,
    ]
  )

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent) => {
      const client = { x: e.clientX, y: e.clientY }
      const prev = activePointers.current.get(e.pointerId)
      activePointers.current.set(e.pointerId, client)

      // Pinch Zoom
      if (activePointers.current.size === 2) {
        const pts = Array.from(activePointers.current.values())
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
        if (lastPinchDist.current != null) {
          const delta = dist / lastPinchDist.current
          setState(prevS => ({
            ...prevS,
            viewerState: {
              ...prevS.viewerState,
              zoom: Math.max(0.2, Math.min(5, prevS.viewerState.zoom * delta)),
            },
          }))
        }
        lastPinchDist.current = dist
        return
      }

      if (activePointers.current.size > 1) return

      const tool = state.toolState.activeTool

      if (tool === 'pan' && isPanningRef.current && lastPointRef.current) {
        const dx = client.x - lastPointRef.current.x
        const dy = client.y - lastPointRef.current.y
        setState(prevS => ({
          ...prevS,
          viewerState: {
            ...prevS.viewerState,
            panX: prevS.viewerState.panX + dx,
            panY: prevS.viewerState.panY + dy,
          },
        }))
        lastPointRef.current = client
        return
      }

      if (tool === 'select' && dragSelectedRef.current.active && dragSelectedRef.current.start) {
        const p = worldFromClient(client)
        const dx = p.x - dragSelectedRef.current.start.x
        const dy = p.y - dragSelectedRef.current.start.y
        const base = dragSelectedRef.current.pos
        setState(prevS => ({
          ...prevS,
          markupObjects: prevS.markupObjects.map(o =>
            prevS.selectedObjects.includes(o.id)
              ? {
                  ...o,
                  x: (base[o.id]?.x ?? o.x) + dx,
                  y: (base[o.id]?.y ?? o.y) + dy,
                  modifiedAt: new Date().toISOString(),
                }
              : o
          ),
        }))
        return
      }

      if (!state.toolState.isDrawing) return

      if (tool === 'pen' && (lastPointRef as any).currentPath) {
        const p = worldFromClient(client)
        ;(lastPointRef as any).currentPath.push(p)
        setPreviewObject({
          id: 'preview-pen',
          type: 'drawing',
          x: (lastPointRef as any).currentPath[0].x,
          y: (lastPointRef as any).currentPath[0].y,
          path: [...(lastPointRef as any).currentPath],
          strokeColor: colorToHex(penColor),
          strokeWidth: penWidth,
        } as any)
        return
      }

      if (tool.startsWith('box-')) {
        const meta = (lastPointRef as any).currentBoxMeta
        if (meta) {
          const start = meta.start
          const now = worldFromClient(client)
          const w = Math.max(1, Math.abs(now.x - start.x))
          const h = Math.max(1, Math.abs(now.y - start.y))
          const x = Math.min(start.x, now.x)
          const y = Math.min(start.y, now.y)
          setPreviewObject({
            id: 'preview-box',
            type: 'box',
            x,
            y,
            width: w,
            height: h,
            color: meta.color,
            label: meta.label,
            size: meta.size,
            shape: boxShape,
          } as any)
        }
      }
    },
    [
      state.toolState.activeTool,
      state.toolState.isDrawing,
      state.selectedObjects,
      worldFromClient,
      setState,
      setPreviewObject,
      penColor,
      penWidth,
      boxShape,
    ]
  )

  const handlePointerUp = React.useCallback(
    (e: React.PointerEvent) => {
      const client = { x: e.clientX, y: e.clientY }
      activePointers.current.delete(e.pointerId)
      if (activePointers.current.size < 2) {
        lastPinchDist.current = null
      }

      if (activePointers.current.size > 0) return

      const tool = state.toolState.activeTool
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
          setState(prev => ({ ...prev, undoStack: [...prev.undoStack, init], redoStack: [] }))
        }
        return
      }

      setPreviewObject(null)

      if (tool.startsWith('box-') && state.toolState.isDrawing) {
        const meta = (lastPointRef as any).currentBoxMeta
        if (meta) {
          const start = meta.start
          const end = worldFromClient(client)
          const w = Math.max(1, Math.abs(end.x - start.x))
          const h = Math.max(1, Math.abs(end.y - start.y))
          const x = Math.min(start.x, end.x)
          const y = Math.min(start.y, end.y)

          let labelText = ''
          if (meta.color === 'gray' && typeof window !== 'undefined') {
            const userInput = window.prompt('구역명이나 라벨을 입력하세요 (필요시)', '')
            if (userInput?.trim()) labelText = userInput.trim()
          }

          const obj: MarkupObject = {
            id: `box-${Date.now()}`,
            type: 'box',
            x,
            y,
            width: w,
            height: h,
            color: meta.color,
            label: labelText || undefined,
            size: meta.size,
            shape: boxShape as any,
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
          } as any
          addObject(obj, false)
        }
        setState(prev => ({ ...prev, toolState: { ...prev.toolState, isDrawing: false } }))
        ;(lastPointRef as any).currentBoxMeta = undefined
        return
      }

      if (tool === 'pen' && state.toolState.isDrawing) {
        const path = (lastPointRef as any).currentPath
        if (path?.length > 1) {
          const obj: MarkupObject = {
            id: `pen-${Date.now()}`,
            type: 'drawing',
            x: path[0].x,
            y: path[0].y,
            path,
            strokeColor: colorToHex(penColor),
            strokeWidth: penWidth,
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
          } as any
          addObject(obj, false)
        }
        setState(prev => ({ ...prev, toolState: { ...prev.toolState, isDrawing: false } }))
        ;(lastPointRef as any).currentPath = undefined
        return
      }
    },
    [
      state.toolState.activeTool,
      state.toolState.isDrawing,
      worldFromClient,
      setState,
      setPreviewObject,
      addObject,
      boxShape,
      penColor,
      penWidth,
    ]
  )

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  }
}
