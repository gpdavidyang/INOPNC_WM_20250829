import { useCallback } from 'react'
import type { MarkupEditorState, MarkupObject } from '@/types/markup'

export function useMarkupTools(
  editorState: MarkupEditorState,
  setEditorState: React.Dispatch<React.SetStateAction<MarkupEditorState>>
) {
  const undo = useCallback(() => {
    if (editorState.undoStack.length > 0) {
      const previousState = editorState.undoStack[editorState.undoStack.length - 1]
      const currentState = editorState.markupObjects
      
      setEditorState(prev => ({
        ...prev,
        markupObjects: previousState,
        undoStack: prev.undoStack.slice(0, -1),
        redoStack: [...prev.redoStack, currentState]
      }))
    }
  }, [editorState.undoStack, editorState.markupObjects, setEditorState])

  const redo = useCallback(() => {
    if (editorState.redoStack.length > 0) {
      const nextState = editorState.redoStack[editorState.redoStack.length - 1]
      const currentState = editorState.markupObjects
      
      setEditorState(prev => ({
        ...prev,
        markupObjects: nextState,
        redoStack: prev.redoStack.slice(0, -1),
        undoStack: [...prev.undoStack, currentState]
      }))
    }
  }, [editorState.redoStack, editorState.markupObjects, setEditorState])

  const deleteSelected = useCallback(() => {
    if (editorState.selectedObjects.length > 0) {
      const currentState = editorState.markupObjects
      const newObjects = currentState.filter(
        obj => !editorState.selectedObjects.includes(obj.id)
      )
      
      setEditorState(prev => ({
        ...prev,
        markupObjects: newObjects,
        selectedObjects: [],
        undoStack: [...prev.undoStack, currentState],
        redoStack: []
      }))
    }
  }, [editorState.selectedObjects, editorState.markupObjects, setEditorState])

  const copySelected = useCallback(() => {
    if (editorState.selectedObjects.length > 0) {
      const selectedItems = editorState.markupObjects.filter(
        obj => editorState.selectedObjects.includes(obj.id)
      )
      
      setEditorState(prev => ({
        ...prev,
        toolState: {
          ...prev.toolState,
          clipboard: selectedItems
        }
      }))
    }
  }, [editorState.selectedObjects, editorState.markupObjects, setEditorState])

  const paste = useCallback(() => {
    if (editorState.toolState.clipboard.length > 0) {
      const currentState = editorState.markupObjects
      const pastedObjects: MarkupObject[] = editorState.toolState.clipboard.map(obj => ({
        ...obj,
        id: `${obj.type}-${Date.now()}-${Math.random()}`,
        x: obj.x + 20,
        y: obj.y + 20,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      }))
      
      setEditorState(prev => ({
        ...prev,
        markupObjects: [...prev.markupObjects, ...pastedObjects],
        selectedObjects: pastedObjects.map(obj => obj.id),
        undoStack: [...prev.undoStack, currentState],
        redoStack: []
      }))
    }
  }, [editorState.toolState.clipboard, editorState.markupObjects, setEditorState])

  const deselectAll = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      selectedObjects: []
    }))
  }, [setEditorState])

  return {
    undo,
    redo,
    deleteSelected,
    copySelected,
    paste,
    deselectAll
  }
}