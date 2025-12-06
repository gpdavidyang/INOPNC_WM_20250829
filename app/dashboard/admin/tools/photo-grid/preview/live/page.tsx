'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import PhotoSheetPrint from '@/components/photo-sheet/PhotoSheetPrint'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'

type ItemMeta = {
  id: string
  member?: string
  process?: string
  content?: string
  stage?: 'before' | 'after'
  previewUrl?: string
}

type PreviewData = {
  title: string
  siteId?: string | null
  siteName: string
  rows: number
  cols: number
  orientation: 'portrait' | 'landscape'
  items: ItemMeta[]
  templateMode?: boolean
  sheetId?: string | null
}

export default function LivePreviewPage() {
  const [data, setData] = useState<PreviewData | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const params = useSearchParams()

  useEffect(() => {
    try {
      const id = params.get('id')
      const sheetId = params.get('sheet_id')
      if (id) {
        // Try server API fetch first (most reliable in Incognito)
        ;(async () => {
          try {
            const res = await fetch(`/api/photo-sheets/preview-session/${encodeURIComponent(id)}`, {
              cache: 'no-store',
              credentials: 'include',
            })
            const j = await res.json().catch(() => ({}))
            if (res.ok && j?.success && j.data) {
              setData(j.data as PreviewData)
              return
            }
          } catch (_e) {
            /* ignore */
          }
        })()
        // Try opener global store first (works in Incognito and avoids storage limits)
        try {
          const fromOpener = (window.opener &&
            (window.opener as any).__PHOTO_PREVIEW_STORE &&
            (window.opener as any).__PHOTO_PREVIEW_STORE[id]) as PreviewData | undefined
          if (fromOpener) {
            setData(fromOpener)
            return
          }
        } catch (_e) {
          /* ignore */
        }
        const raw = localStorage.getItem(`photosheet-preview:${id}`)
        if (raw) {
          setData(JSON.parse(raw) as PreviewData)
          try {
            localStorage.removeItem(`photosheet-preview:${id}`)
          } catch (_e) {
            /* ignore */
          }
          return
        }
      }
      // If sheet_id is provided, fetch the sheet detail and build preview data
      if (sheetId) {
        ;(async () => {
          try {
            const res = await fetch(`/api/photo-sheets/${encodeURIComponent(sheetId)}`, {
              cache: 'no-store',
              credentials: 'include',
            })
            const j = await res.json().catch(() => ({}))
            if (res.ok && j?.success && j?.data) {
              const s = j.data as any
              const items = Array.isArray(s.items) ? s.items : []
              const preview = {
                title: (s.title || '').trim(),
                sheetId: s.id || null,
                siteId: s.site_id || s.site?.id || null,
                siteName: s.site?.name || '',
                rows: Number(s.rows) || 1,
                cols: Number(s.cols) || 1,
                orientation: (s.orientation === 'landscape' ? 'landscape' : 'portrait') as
                  | 'portrait'
                  | 'landscape',
                templateMode: false,
                items: items.map((it: any, i: number) => ({
                  id: String(i),
                  member: it.member_name || undefined,
                  process: it.process_name || undefined,
                  content: it.content || undefined,
                  stage: it.stage || undefined,
                  previewUrl: it.image_url || undefined,
                })),
              } as PreviewData
              setData(preview)
              return
            }
          } catch (_e) {
            /* ignore */
          }
        })()
      }
      // window.name payload (psdata:<base64-json>) support
      const wn = typeof window !== 'undefined' ? window.name || '' : ''
      if (wn.startsWith('psdata:')) {
        const b64 = wn.slice(7)
        try {
          const json = JSON.parse(decodeURIComponent(escape(atob(b64)))) as PreviewData
          setData(json)
          return
        } catch (_e) {
          /* ignore */
        }
      }
      // Fallback: window.name-based key
      const nm = typeof window !== 'undefined' ? window.name || '' : ''
      if (nm.startsWith('psk:')) {
        const kid = nm.slice(4)
        const raw2 = localStorage.getItem(`photosheet-preview:${kid}`)
        if (raw2) {
          setData(JSON.parse(raw2) as PreviewData)
          try {
            localStorage.removeItem(`photosheet-preview:${kid}`)
          } catch (_e) {
            /* ignore */
          }
          return
        }
      }
      const legacy = sessionStorage.getItem('photosheet-preview')
      if (legacy) {
        setData(JSON.parse(legacy) as PreviewData)
        return
      }
    } catch {
      setData(null)
    }
  }, [params])

  // Fallbacks: receive preview via postMessage from opener, and retry polling for a short time
  useEffect(() => {
    let done = false
    const handler = (ev: MessageEvent) => {
      if (!ev || typeof ev.data !== 'object') return
      if ((ev.data as any)?.type === 'photosheet-preview' && (ev.data as any)?.data) {
        setData((ev.data as any).data as PreviewData)
        done = true
      } else if ((ev.data as any)?.type === 'navigate' && (ev.data as any)?.url) {
        try {
          window.location.href = String((ev.data as any).url)
        } catch (_e) {
          /* ignore */
        }
      }
    }
    window.addEventListener('message', handler)
    const id = params.get('id') || (window.name?.startsWith('psk:') ? window.name.slice(4) : '')
    // Actively request from opener as a final handshake (Incognito safe)
    try {
      if (window.opener && id)
        window.opener.postMessage(
          { type: 'request-photosheet-preview', id },
          window.location.origin
        )
    } catch (_e) {
      /* ignore */
    }
    let attempts = 0
    const iv = window.setInterval(() => {
      if (done || attempts++ > 20) {
        window.clearInterval(iv)
        return
      }
      try {
        if (id && window.opener && (window.opener as any).__PHOTO_PREVIEW_STORE) {
          const d = (window.opener as any).__PHOTO_PREVIEW_STORE[id]
          if (d) {
            setData(d as PreviewData)
            window.clearInterval(iv)
          }
        }
      } catch (_e) {
        /* ignore */
      }
    }, 200)
    return () => {
      window.removeEventListener('message', handler)
      try {
        window.clearInterval(iv)
      } catch (_e) {
        /* ignore */
      }
    }
  }, [params])

  useEffect(() => {
    if (data && params.get('auto') === 'print') {
      const t = setTimeout(() => window.print(), 300)
      return () => clearTimeout(t)
    }
  }, [data, params])

  const content = useMemo(() => {
    if (!data) return null
    return (
      <PhotoSheetPrint
        title={data.title}
        siteName={data.siteName}
        rows={data.rows}
        cols={data.cols}
        orientation={data.orientation}
        items={data.items}
        templateMode={data.templateMode}
      />
    )
  }, [data])

  const handleSave = useCallback(async () => {
    if (!data) return
    if (!data.siteId) {
      setSaveMessage('현장 정보가 없어 저장할 수 없습니다.')
      return
    }
    try {
      setSaving(true)
      setSaveMessage(null)
      const form = new FormData()
      const normalizedTitle = data.title?.trim() || ''
      form.append('title', normalizedTitle)
      form.append('site_id', data.siteId)
      form.append('orientation', data.orientation)
      form.append('rows', String(data.rows))
      form.append('cols', String(data.cols))
      form.append('status', 'final')

      const itemsPayload: Array<{
        index: number
        member: string | null
        process: string | null
        content: string | null
        stage: string | null
        image_url: string | null
      }> = []

      await Promise.all(
        data.items.map(async (item, index) => {
          const payload = {
            index,
            member: item.member || null,
            process: item.process || null,
            content: item.content || null,
            stage: item.stage || null,
            image_url: null as string | null,
          }
          const url = item.previewUrl || ''
          if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
            payload.image_url = url
          } else if (url) {
            const response = await fetch(url)
            const blob = await response.blob()
            const contentType = response.headers.get('content-type') || 'image/png'
            const extension = contentType.split('/')[1] || 'png'
            const filename = `photo-${index + 1}.${extension}`
            form.append(`file_${index}`, blob, filename)
          }
          itemsPayload.push(payload)
        })
      )

      form.append('items', JSON.stringify(itemsPayload))

      const res = await fetch('/api/photo-sheets', {
        method: 'POST',
        body: form,
        credentials: 'include',
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || '저장에 실패했습니다.')
      }
      setSaveMessage('사진대지가 저장되었습니다.')
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }, [data])

  const canSave = useMemo(() => {
    if (!data) return false
    if (!data.siteId) return false
    if (data.sheetId) return false
    return data.items.length > 0
  }, [data])

  if (!data) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        미리보기 데이터를 찾을 수 없습니다. 에디터에서 다시 시도해 주세요.
      </div>
    )
  }

  const helperMessage =
    saveMessage ||
    (!data.siteId
      ? '현장 정보가 없어 저장 버튼이 비활성화되었습니다.'
      : data.sheetId
        ? '이미 저장된 사진대지입니다.'
        : null)

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="사진대지 미리보기"
        description="작업 전/후 사진과 부재명·공정·내용을 포함한 사진대지를 인쇄 전에 미리 확인하는 화면입니다."
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '현장작업 관리' },
          { label: '사진대지 관리', href: '/dashboard/admin/tools/photo-grid' },
          { label: '미리보기' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={() => void handleSave()} disabled={!canSave || saving}>
              {saving ? '저장 중…' : '저장'}
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              인쇄
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                try {
                  if (window.history.length > 1) {
                    window.history.back()
                  } else {
                    window.location.assign('/dashboard/admin/tools/photo-grid')
                  }
                } catch {
                  window.location.assign('/dashboard/admin/tools/photo-grid')
                }
              }}
            >
              닫기
            </Button>
          </div>
        }
      />
      {helperMessage && (
        <div className="px-4 sm:px-6 lg:px-8 text-sm text-muted-foreground">{helperMessage}</div>
      )}
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="w-full overflow-x-auto">
          <div className="mx-auto min-w-max flex justify-center">{content}</div>
        </div>
      </div>
    </div>
  )
}
