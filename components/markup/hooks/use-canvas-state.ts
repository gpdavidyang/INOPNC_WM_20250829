import { useCallback } from 'react'
import type { MarkupEditorState } from '@/types/markup'

export function useCanvasState(
  editorState: MarkupEditorState,
  setEditorState: React.Dispatch<React.SetStateAction<MarkupEditorState>>
) {
  const zoomIn = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      viewerState: {
        ...prev.viewerState,
        zoom: Math.min(prev.viewerState.zoom * 1.2, 5)
      }
    }))
  }, [setEditorState])

  const zoomOut = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      viewerState: {
        ...prev.viewerState,
        zoom: Math.max(prev.viewerState.zoom / 1.2, 0.25)
      }
    }))
  }, [setEditorState])

  const resetZoom = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      viewerState: {
        ...prev.viewerState,
        zoom: 1,
        panX: 0,
        panY: 0
      }
    }))
  }, [setEditorState])

  const pan = useCallback((deltaX: number, deltaY: number) => {
    setEditorState(prev => ({
      ...prev,
      viewerState: {
        ...prev.viewerState,
        panX: prev.viewerState.panX + deltaX,
        panY: prev.viewerState.panY + deltaY
      }
    }))
  }, [setEditorState])

  return {
    zoomIn,
    zoomOut,
    resetZoom,
    pan
  }
}