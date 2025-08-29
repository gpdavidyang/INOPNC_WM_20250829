import { useCallback } from 'react'
import type { MarkupEditorState } from '@/types/markup'
import type { MarkupDocument } from '@/types'

interface SaveDocumentParams {
  fileName: string
  location: 'personal' | 'shared'
  description?: string
  blueprintUrl: string
  blueprintFileName: string
}

export function useFileManager(
  editorState: MarkupEditorState,
  setEditorState: React.Dispatch<React.SetStateAction<MarkupEditorState>>
) {
  const saveDocument = useCallback(async ({
    fileName,
    location,
    description,
    blueprintUrl,
    blueprintFileName
  }: SaveDocumentParams) => {
    setEditorState(prev => ({ ...prev, isSaving: true }))

    try {
      const payload = {
        title: fileName,
        description,
        original_blueprint_url: blueprintUrl,
        original_blueprint_filename: blueprintFileName,
        markup_data: editorState.markupObjects,
        location,
        preview_image_url: null // TODO: Generate preview image
      }

      let response: Response
      
      if (editorState.currentFile?.id) {
        // 기존 문서 업데이트
        response = await fetch(`/api/markup-documents/${editorState.currentFile.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        })
      } else {
        // 새 문서 생성
        response = await fetch('/api/markup-documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        })
      }

      const result = await response.json()

      if (!response.ok) {
        console.error('Save document failed:', result)
        throw new Error(result.error || 'Failed to save document')
      }

      if (result.success) {
        setEditorState(prev => ({
          ...prev,
          currentFile: result.data,
          isSaving: false,
          showSaveDialog: false
        }))
        
        return result.data
      } else {
        throw new Error(result.error || 'Save failed')
      }
    } catch (error) {
      console.error('Failed to save document:', error)
      setEditorState(prev => ({ ...prev, isSaving: false }))
      throw error
    }
  }, [editorState, setEditorState])

  const openDocument = useCallback(async (document: MarkupDocument) => {
    setEditorState(prev => ({ ...prev, isLoading: true }))

    try {
      // API에서 최신 데이터 가져오기
      const response = await fetch(`/api/markup-documents/${document.id}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load document')
      }

      if (result.success) {
        const loadedDocument = result.data

        setEditorState(prev => ({
          ...prev,
          currentFile: loadedDocument,
          markupObjects: loadedDocument.markup_data || [],
          isLoading: false,
          showOpenDialog: false
        }))

        return {
          document: loadedDocument,
          blueprintUrl: loadedDocument.original_blueprint_url,
          blueprintFileName: loadedDocument.original_blueprint_filename
        }
      } else {
        throw new Error(result.error || 'Load failed')
      }
    } catch (error) {
      console.error('Failed to open document:', error)
      setEditorState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }, [setEditorState])

  return {
    saveDocument,
    openDocument
  }
}