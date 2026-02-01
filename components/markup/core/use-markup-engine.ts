'use client'

import type { MarkupEditorState, MarkupObject, StampToolState, ToolType } from '@/types/markup'
import React from 'react'

const DEFAULT_STAMP: Required<StampToolState> = {
  shape: 'circle',
  size: 'medium',
  color: 'red',
}

export function useMarkupEngine(initialObjects: MarkupObject[] = []) {
  const [state, setState] = React.useState<MarkupEditorState>(() => ({
    currentFile: null,
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
    markupObjects: initialObjects,
    selectedObjects: [],
    undoStack: [],
    redoStack: [],
    isLoading: false,
    isSaving: false,
    showSavePage: false,
    showOpenDialog: false,
  }))

  const [previewObject, setPreviewObject] = React.useState<MarkupObject | null>(null)

  // Actions
  const setTool = React.useCallback((tool: ToolType) => {
    setState(prev => ({
      ...prev,
      toolState: { ...prev.toolState, activeTool: tool },
    }))
  }, [])

  const selectObjects = React.useCallback((ids: string[]) => {
    setState(prev => ({ ...prev, selectedObjects: ids }))
  }, [])

  const addObject = React.useCallback((obj: MarkupObject, select = true) => {
    setState(prev => ({
      ...prev,
      markupObjects: [...prev.markupObjects, obj],
      selectedObjects: select ? [obj.id] : [],
      undoStack: [...prev.undoStack, prev.markupObjects],
      redoStack: [],
    }))
  }, [])

  const updateObject = React.useCallback((id: string, updates: Partial<MarkupObject>) => {
    setState(prev => ({
      ...prev,
      undoStack: [...prev.undoStack, prev.markupObjects],
      redoStack: [],
      markupObjects: prev.markupObjects.map(obj =>
        obj.id === id ? { ...obj, ...updates, modifiedAt: new Date().toISOString() } : obj
      ),
    }))
  }, [])

  const deleteSelected = React.useCallback(() => {
    setState(prev => {
      if (prev.selectedObjects.length === 0) return prev
      return {
        ...prev,
        undoStack: [...prev.undoStack, prev.markupObjects],
        redoStack: [],
        markupObjects: prev.markupObjects.filter(obj => !prev.selectedObjects.includes(obj.id)),
        selectedObjects: [],
      }
    })
  }, [])

  const undo = React.useCallback(() => {
    setState(prev => {
      if (prev.undoStack.length === 0) return prev
      const last = prev.undoStack[prev.undoStack.length - 1]
      return {
        ...prev,
        undoStack: prev.undoStack.slice(0, -1),
        redoStack: [...prev.redoStack, prev.markupObjects],
        markupObjects: last,
        selectedObjects: [],
      }
    })
  }, [])

  const redo = React.useCallback(() => {
    setState(prev => {
      if (prev.redoStack.length === 0) return prev
      const next = prev.redoStack[prev.redoStack.length - 1]
      return {
        ...prev,
        redoStack: prev.redoStack.slice(0, -1),
        undoStack: [...prev.undoStack, prev.markupObjects],
        markupObjects: next,
        selectedObjects: [],
      }
    })
  }, [])

  const copySelected = React.useCallback(() => {
    setState(prev => ({
      ...prev,
      toolState: {
        ...prev.toolState,
        clipboard: prev.markupObjects.filter(o => prev.selectedObjects.includes(o.id)),
      },
    }))
  }, [])

  const paste = React.useCallback(() => {
    setState(prev => {
      if (prev.toolState.clipboard.length === 0) return prev
      const pasted = prev.toolState.clipboard.map(obj => ({
        ...obj,
        id: `${obj.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        x: obj.x + 20,
        y: obj.y + 20,
        modifiedAt: new Date().toISOString(),
      }))
      return {
        ...prev,
        undoStack: [...prev.undoStack, prev.markupObjects],
        redoStack: [],
        markupObjects: [...prev.markupObjects, ...pasted],
        selectedObjects: pasted.map(o => o.id),
      }
    })
  }, [])

  const setStamp = React.useCallback((updates: Partial<StampToolState>) => {
    setState(prev => ({
      ...prev,
      toolState: {
        ...prev.toolState,
        stampSettings: {
          ...(prev.toolState.stampSettings || DEFAULT_STAMP),
          ...updates,
        },
      },
    }))
  }, [])

  const zoomIn = React.useCallback(() => {
    setState(prev => ({
      ...prev,
      viewerState: {
        ...prev.viewerState,
        zoom: Math.min(5, prev.viewerState.zoom * 1.2),
      },
    }))
  }, [])

  const zoomOut = React.useCallback(() => {
    setState(prev => ({
      ...prev,
      viewerState: {
        ...prev.viewerState,
        zoom: Math.max(0.2, prev.viewerState.zoom / 1.2),
      },
    }))
  }, [])

  const resetZoom = React.useCallback(() => {
    setState(prev => ({
      ...prev,
      viewerState: { ...prev.viewerState, zoom: 1, panX: 0, panY: 0 },
    }))
  }, [])

  const setPan = React.useCallback((x: number, y: number) => {
    setState(prev => ({
      ...prev,
      viewerState: { ...prev.viewerState, panX: x, panY: y },
    }))
  }, [])

  return {
    state,
    setState,
    previewObject,
    setPreviewObject,
    setTool,
    selectObjects,
    addObject,
    updateObject,
    deleteSelected,
    undo,
    redo,
    copySelected,
    paste,
    setStamp,
    zoomIn,
    zoomOut,
    resetZoom,
    setPan,
  }
}
