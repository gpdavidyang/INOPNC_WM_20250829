'use client'

import { Button } from '@/components/ui/button'
import { Eye, Save, XCircle } from 'lucide-react'
import { useCallback } from 'react'
import { toast } from 'sonner'

import { usePhotoSheetEditor } from './hooks/usePhotoSheetEditor'
import { PhotoSheetBulkActions } from './parts/PhotoSheetBulkActions'
import { PhotoSheetGrid } from './parts/PhotoSheetGrid'
import { PhotoSheetHeader } from './parts/PhotoSheetHeader'

interface PhotoSheetEditorProps {
  onSaved?: (id: string, status: 'draft' | 'final') => void
  sheetId?: string
  onClose?: () => void
}

export default function PhotoSheetEditor({
  onSaved,
  sheetId: externalSheetId,
  onClose,
}: PhotoSheetEditorProps) {
  const p = usePhotoSheetEditor(externalSheetId)

  const openPreviewTab = useCallback(
    async (autoPrint: boolean) => {
      // Basic implementation of the preview logic
      const previewItems = await Promise.all(
        p.tiles.map(async t => {
          let url = t.previewUrl || ''
          if (t.file) {
            url = await new Promise<string>(resolve => {
              const reader = new FileReader()
              reader.onload = () => resolve(String(reader.result))
              reader.readAsDataURL(t.file!)
            })
          }
          return {
            id: t.id,
            member: t.member,
            process: t.process,
            content: t.content,
            stage: t.stage,
            previewUrl: url,
          }
        })
      )

      const previewData = {
        title: p.title,
        siteId: p.siteId,
        siteName: p.siteName,
        rows: p.preset.rows,
        cols: p.preset.cols,
        orientation: p.orientation,
        items: previewItems,
      }

      try {
        const res = await fetch('/api/photo-sheets/preview-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(previewData),
        })
        const j = await res.json()
        if (res.ok && j?.id) {
          window.location.assign(
            `/dashboard/admin/tools/photo-grid/preview/live?${autoPrint ? 'auto=print&' : ''}id=${j.id}`
          )
        }
      } catch (e) {
        toast.error('미리보기를 생성할 수 없습니다.')
      }
    },
    [p]
  )

  const saveSheet = async (status: 'draft' | 'final') => {
    p.setSaving(true)
    try {
      const form = new FormData()
      form.append('title', p.title)
      form.append('site_id', p.siteId)
      form.append('orientation', p.orientation)
      form.append('rows', String(p.preset.rows))
      form.append('cols', String(p.preset.cols))
      form.append('status', status)

      const itemsPayload = p.tiles.map((t, i) => ({
        index: i,
        member: t.member || null,
        process: t.process || null,
        content: t.content || null,
        stage: t.stage || null,
        image_url: t.previewUrl && !t.previewUrl.startsWith('blob:') ? t.previewUrl : null,
        mime: t.file?.type || null,
      }))
      form.append('items', JSON.stringify(itemsPayload))

      p.tiles.forEach((t, i) => {
        if (t.file) form.append(`file_${i}`, t.file)
      })

      const res = await fetch(p.sheetId ? `/api/photo-sheets/${p.sheetId}` : '/api/photo-sheets', {
        method: p.sheetId ? 'PUT' : 'POST',
        body: form,
      })
      const json = await res.json()

      if (res.ok && json?.success) {
        toast.success(status === 'final' ? '사진대지가 생성되었습니다.' : '초안이 저장되었습니다.')
        onSaved?.(json.data?.id || p.sheetId, status)
      } else {
        throw new Error(json?.error || '저장 중 오류가 발생했습니다.')
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      p.setSaving(false)
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
      {/* Header Controls */}
      <PhotoSheetHeader
        siteId={p.siteId}
        setSiteId={p.setSiteId}
        sites={p.sites}
        presetId={p.presetId}
        setPresetId={p.setPresetId}
        loadingSites={false}
      />

      {/* Message Info */}
      {(p.message || p.sheetId) && (
        <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border rounded-2xl">
          <div className="flex items-center gap-3">
            {p.sheetId && (
              <span className="text-[10px] font-black text-muted-foreground uppercase opacity-50">
                Document ID: {p.sheetId}
              </span>
            )}
            {p.message && <span className="text-xs font-bold text-blue-600">{p.message}</span>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => p.setMessage('')}
            className="h-6 w-6 rounded-full"
          >
            <XCircle className="w-3.5 h-3.5 opacity-30" />
          </Button>
        </div>
      )}

      {/* Bulk Actions */}
      <PhotoSheetBulkActions
        bulkMember={p.bulkMember}
        setBulkMember={p.setBulkMember}
        bulkProcess={p.bulkProcess}
        setBulkProcess={p.setBulkProcess}
        componentOptions={p.componentOptions}
        processOptions={p.processOptions}
        onApply={p.applyBulkMetadata}
        onReset={() => {
          p.setBulkMember('')
          p.setBulkProcess('')
        }}
      />

      {/* Main Grid Area */}
      <PhotoSheetGrid
        pageCount={p.pageCount}
        photosPerPage={p.photosPerPage}
        tiles={p.tiles}
        preset={p.preset}
        onTileFileChange={p.handleTileFileChange}
        onUpdateTile={p.updateTile}
        componentOptions={p.componentOptions}
        processOptions={p.processOptions}
      />

      {/* Footer Actions */}
      <div className="sticky bottom-8 left-0 right-0 z-30 flex items-center justify-center p-2">
        <div className="bg-white/80 backdrop-blur-xl border-2 border-primary/10 shadow-2xl rounded-3xl p-3 flex items-center gap-2 animate-in slide-in-from-bottom-8 duration-500">
          <Button
            variant="ghost"
            onClick={onClose}
            className="rounded-2xl px-6 font-bold text-muted-foreground"
          >
            닫기
          </Button>
          <div className="w-px h-8 bg-gray-200 mx-2" />
          <Button
            variant="outline"
            onClick={() => openPreviewTab(false)}
            disabled={!p.canSave}
            className="rounded-2xl px-6 font-bold gap-2 border-2"
          >
            <Eye className="w-4 h-4" /> 미리보기
          </Button>
          <Button
            onClick={() => saveSheet('final')}
            disabled={p.saving || !p.canSave}
            className="rounded-2xl px-10 font-black gap-2 shadow-xl shadow-blue-500/20"
          >
            {p.saving ? '처리 중...' : '사진대지 생성 및 저장'}
            <Save className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
