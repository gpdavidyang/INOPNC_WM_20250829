'use client'

import type { UnifiedAttachment } from '@/types/daily-reports'
import { useEffect, useState } from 'react'

export const useWorklogDrawings = (
  mode: 'create' | 'edit',
  isAdmin: boolean,
  reportId: string | null,
  siteId: string | null,
  initialDrawings: UnifiedAttachment[] = []
) => {
  const [drawings, setDrawings] = useState<UnifiedAttachment[]>(initialDrawings)

  useEffect(() => {
    setDrawings(initialDrawings)
  }, [initialDrawings])

  useEffect(() => {
    if (mode !== 'edit' || !isAdmin || !reportId) return

    const controller = new AbortController()
    const params = new URLSearchParams()
    params.set('worklog_id', String(reportId))
    if (siteId) params.set('site_id', String(siteId))
    ;(async () => {
      try {
        const res = await fetch(`/api/mobile/media/drawings?${params.toString()}`, {
          signal: controller.signal,
        })
        const json = await res.json().catch(() => null)
        if (!json?.success) return
        const records = Array.isArray(json?.data?.drawings) ? json.data.drawings : []
        const mapped: UnifiedAttachment[] = records
          .map((rec: any): UnifiedAttachment | null => {
            const previewUrl =
              rec?.previewUrl ||
              rec?.preview_url ||
              rec?.preview_image_url ||
              rec?.snapshot_url ||
              null
            const originalUrl = rec?.url || rec?.file_url || null
            const name = rec?.title || rec?.file_name || '도면'
            const id = rec?.markupId || rec?.markup_document_id || rec?.id
            if (!id) return null
            return {
              id: String(id),
              type: 'drawing',
              name: String(name),
              url: String(previewUrl || originalUrl || ''),
              uploadedAt: rec?.createdAt || rec?.created_at || undefined,
              uploadedByName: rec?.uploaderName || rec?.uploader?.full_name || undefined,
              metadata: {
                source: rec?.source,
                original_url: originalUrl || undefined,
                preview_url: previewUrl || undefined,
                markup_document_id:
                  rec?.markupId || rec?.markup_document_id || rec?.source_id || undefined,
                linked_worklog_id: reportId,
                site_id: siteId || undefined,
              },
            }
          })
          .filter((v: any): v is UnifiedAttachment => Boolean(v))

        if (mapped.length === 0) return

        setDrawings(prev => {
          const byKey = new Map<string, UnifiedAttachment>()
          const keyOf = (att: UnifiedAttachment) => {
            const meta =
              att.metadata && typeof att.metadata === 'object' ? (att.metadata as any) : {}
            return (
              meta?.markup_document_id || meta?.source_id || meta?.original_url || att.id || att.url
            )
          }
          for (const item of prev) byKey.set(String(keyOf(item)), item)
          for (const item of mapped) byKey.set(String(keyOf(item)), item)
          return Array.from(byKey.values())
        })
      } catch (error) {
        if ((error as any)?.name === 'AbortError') return
        console.warn('[useWorklogDrawings] failed to load drawings:', error)
      }
    })()

    return () => controller.abort()
  }, [mode, isAdmin, reportId, siteId])

  return {
    drawings,
    setDrawings,
  }
}
