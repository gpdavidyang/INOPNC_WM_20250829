'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

type PhotoSheetItem = {
  item_index: number
  member_name?: string | null
  process_name?: string | null
  content?: string | null
  stage?: 'before' | 'after' | null
  image_url?: string | null
}

type PhotoSheetRow = {
  id: string
  title: string
  created_at: string
  rows: number
  cols: number
  orientation: 'portrait' | 'landscape'
  status?: 'draft' | 'final'
  site?: { id: string; name: string } | null
  items?: PhotoSheetItem[]
}

export default function PhotoGridList() {
  const [items, setItems] = useState<PhotoSheetRow[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Fetch helper
  const fetchList = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/photo-sheets', { cache: 'no-store', credentials: 'include' })
      const json = await res.json().catch(() => null)
      const list = Array.isArray(json?.data) ? (json.data as PhotoSheetRow[]) : []
      setItems(list)
    } catch {
      // keep existing items if fetch fails
      // console.warn('Failed to fetch photo sheets list')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    fetchList().catch(() => void 0)
    const onSaved = (e: Event) => {
      if (!mounted) return
      const anyEvt = e as any
      const row = anyEvt?.detail as Partial<PhotoSheetRow> | undefined
      if (row && row.id) {
        setItems(prev => {
          const exists = prev.some(it => it.id === row.id)
          if (exists)
            return prev.map(it => (it.id === row.id ? ({ ...it, ...row } as PhotoSheetRow) : it))
          return [
            {
              id: String(row.id),
              title: row.title || '사진대지',
              created_at: row.created_at || new Date().toISOString(),
              rows: (row.rows as number) || 1,
              cols: (row.cols as number) || 1,
              orientation: (row.orientation as any) || 'portrait',
              status: (row.status as any) || 'final',
              site: row.site as any,
              items: [],
            },
            ...prev,
          ]
        })
      }
      fetchList().catch(() => void 0)
    }
    const onFocus = () => {
      if (mounted) fetchList().catch(() => void 0)
    }
    window.addEventListener('photosheet-saved', onSaved as EventListener)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      mounted = false
      window.removeEventListener('photosheet-saved', onSaved as EventListener)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [])

  // Respond to preview requests using opener store
  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      try {
        if (!ev || typeof ev.data !== 'object') return
        if ((ev.data as any)?.type === 'request-photosheet-preview') {
          const id = String((ev.data as any).id || '')
          const store = (window as any).__PHOTO_PREVIEW_STORE
          const data = store ? store[id] : undefined
          if (data) {
            ;(ev.source as WindowProxy | null)?.postMessage(
              { type: 'photosheet-preview', data, id },
              window.location.origin
            )
          }
        }
      } catch (_e) {
        /* ignore */
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('이 사진대지를 삭제하시겠습니까? 삭제 후 되돌릴 수 없습니다.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/photo-sheets/${id}`, {
        method: 'DELETE',
        cache: 'no-store',
        credentials: 'include',
      })
      if (!res.ok) {
        const msg = await res.text().catch(() => '')
        throw new Error(msg || '삭제에 실패했습니다')
      }
      setItems(prev => prev.filter(it => it.id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제에 실패했습니다')
    } finally {
      setDeletingId(null)
    }
  }

  const openHtmlPreview = async (item: PhotoSheetRow, autoPrint = false) => {
    // Fetch full sheet with items
    const res = await fetch(`/api/photo-sheets/${encodeURIComponent(item.id)}`, {
      cache: 'no-store',
      credentials: 'include',
    })
    const json = await res.json().catch(() => null)
    const sheet = res.ok && json?.success && json?.data ? (json.data as PhotoSheetRow) : item
    const previewData = {
      title: sheet.title || '사진대지',
      siteName: sheet.site?.name || '',
      rows: sheet.rows,
      cols: sheet.cols,
      orientation: sheet.orientation,
      templateMode: false,
      items: (sheet.items || []).map((it, i) => ({
        id: String(i),
        previewUrl: it.image_url || '',
        content: it.content || undefined,
        member: it.member_name || undefined,
        process: it.process_name || undefined,
      })),
    }
    const key = `ps_${Date.now()}_${Math.random().toString(36).slice(2)}`
    try {
      const g: any = window as any
      if (!g.__PHOTO_PREVIEW_STORE) g.__PHOTO_PREVIEW_STORE = {}
      g.__PHOTO_PREVIEW_STORE[key] = previewData
    } catch (_e) {
      /* ignore */
    }
    try {
      localStorage.setItem(`photosheet-preview:${key}`, JSON.stringify(previewData))
    } catch {
      /* ignore */
    }
    const qs = `${autoPrint ? '?auto=print' : ''}${autoPrint ? '&' : '?'}id=${encodeURIComponent(key)}`
    // Try server-side preview session first
    try {
      const res = await fetch('/api/photo-sheets/preview-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(previewData),
        credentials: 'include',
      })
      const j = await res.json().catch(() => null)
      if (res.ok && j?.success && j?.id) {
        const url = `/dashboard/admin/tools/photo-grid/preview/live?${autoPrint ? 'auto=print&' : ''}id=${encodeURIComponent(j.id as string)}`
        window.open(url, '_blank')
        return
      }
    } catch (_e) {
      /* ignore */
    }

    const url = `/dashboard/admin/tools/photo-grid/preview/live${qs}`
    const w = window.open('about:blank', '_blank')
    try {
      if (w) {
        try {
          const json = JSON.stringify(previewData)
          const b64 = btoa(unescape(encodeURIComponent(json)))
          ;(w as any).name = `psdata:${b64}`
        } catch {
          try {
            ;(w as any).name = `psk:${key}`
          } catch (_e) {
            /* ignore */
          }
        }
        try {
          w.location.href = url
        } catch {
          w?.postMessage({ type: 'navigate', url }, '*')
        }
        setTimeout(() => {
          try {
            w.postMessage({ type: 'photosheet-preview', data: previewData }, window.location.origin)
          } catch (_e) {
            /* ignore */
          }
        }, 400)
      }
    } catch (_e) {
      /* ignore */
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left">
            <th className="px-3 py-2">생성일</th>
            <th className="px-3 py-2">현장</th>
            <th className="px-3 py-2">제목/격자</th>
            <th className="px-3 py-2">상태</th>
            <th className="px-3 py-2">동작</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                로딩 중...
              </td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                생성된 사진대지가 없습니다.
              </td>
            </tr>
          ) : (
            items.map(item => {
              return (
                <tr key={item.id} className="border-t">
                  <td className="px-3 py-2">
                    {item.created_at ? new Date(item.created_at).toLocaleString('ko-KR') : '-'}
                  </td>
                  <td className="px-3 py-2">{item.site?.name || '-'}</td>
                  <td className="px-3 py-2">
                    <div className="text-foreground">{item.title || '사진대지'}</div>
                    <div className="text-xs text-muted-foreground">
                      {(item.rows || 0) + '×' + (item.cols || 0)} ·{' '}
                      {item.orientation === 'landscape' ? '가로' : '세로'}
                    </div>
                  </td>
                  <td className="px-3 py-2">{item.status === 'final' ? '확정' : '초안'}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="compact"
                        onClick={() => openHtmlPreview(item, false)}
                      >
                        미리보기
                      </Button>
                      <Button
                        variant="outline"
                        size="compact"
                        onClick={() => openHtmlPreview(item, true)}
                      >
                        인쇄
                      </Button>
                      <Button
                        variant="destructive"
                        size="compact"
                        onClick={() => void handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        aria-label="사진대지 삭제"
                        title="삭제"
                      >
                        {deletingId === item.id ? '삭제 중…' : '삭제'}
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
