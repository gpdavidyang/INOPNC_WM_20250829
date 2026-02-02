'use client'

import { createClient } from '@/lib/supabase/client'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

export interface DrawingItem {
  id: string
  title: string
  url: string
  preview_url?: string
  category: 'plan' | 'progress' | 'other'
  created_at: string
  size?: number
  mime?: string
  sub_category?: string
  markup_data?: any[]
  original_blueprint_url?: string
  original_blueprint_filename?: string
  markup_document_id?: string
}
export function useDrawingManager() {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const fetchDrawings = useCallback(async (worklogId: string, siteId?: string) => {
    setLoading(true)
    try {
      let url = `/api/docs/drawings?worklog_id=${worklogId}`
      if (siteId) url += `&siteId=${siteId}`
      const res = await fetch(url)
      const json = await res.json()
      if (json.success) return json.data as DrawingItem[]
      return []
    } catch (err) {
      console.error('[DrawingManager] fetch error:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchBaseDrawings = useCallback(async (siteId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/docs/drawings?siteId=${siteId}&category=plan&limit=100`)
      const json = await res.json()
      if (json.success) return json.data as DrawingItem[]
      return []
    } catch (err) {
      console.error('[DrawingManager] fetch base error:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const unlinkDrawing = useCallback(
    async (drawingId: string, worklogId: string, category: string) => {
      try {
        const res = await fetch('/api/mobile/media/drawings/unlink', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            drawingId: drawingId.replace('markup-', ''),
            worklogId: worklogId,
            source: category === 'progress' ? 'markup' : 'shared',
          }),
        })
        if (res.ok) {
          toast.success('연결이 해제되었습니다.')
          return true
        }
        return false
      } catch (err) {
        toast.error('해제 실패')
        return false
      }
    },
    []
  )

  const uploadDrawings = useCallback(
    async (files: File[], worklogId: string, siteId: string, docType: 'progress' | 'plan') => {
      if (files.length === 0 || !siteId) return false
      setUploading(true)
      const supabase = createClient()

      try {
        for (const file of files) {
          const filePath = `drawings/${siteId}/${Date.now()}_${file.name}`
          const { error: uploadErr } = await supabase.storage
            .from('documents')
            .upload(filePath, file)

          if (uploadErr) throw uploadErr

          const {
            data: { publicUrl },
          } = supabase.storage.from('documents').getPublicUrl(filePath)

          await supabase.from('unified_document_system').insert({
            title: file.name.split('.')[0],
            file_name: file.name,
            file_url: publicUrl,
            file_size: file.size,
            mime_type: file.type,
            category_type: 'shared',
            sub_category: docType === 'plan' ? 'construction_drawing' : 'progress_drawing',
            site_id: siteId,
            status: 'active',
            metadata: {
              linked_worklog_id: worklogId,
              linked_worklog_ids: [worklogId],
              daily_report_id: worklogId,
              worklog_id: worklogId,
            },
          })
        }
        toast.success('도면이 업로드 및 연동되었습니다.')
        return true
      } catch (err) {
        console.error('[DrawingManager] upload error:', err)
        toast.error('업로드 실패')
        return false
      } finally {
        setUploading(false)
      }
    },
    []
  )

  return {
    loading,
    uploading,
    fetchDrawings,
    fetchBaseDrawings,
    unlinkDrawing,
    uploadDrawings,
  }
}
