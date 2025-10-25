'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PHOTO_SHEET_PRESETS, type GridPreset, type Orientation } from './presets'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/custom-select'
import { Separator } from '@/components/ui/separator'
import PhotoSheetPrint from './PhotoSheetPrint'

type SiteOption = { id: string; name: string }
type WorkOption = {
  id: string
  option_type: 'component_type' | 'process_type'
  option_label: string
}

type Tile = {
  id: string
  member?: string
  process?: string
  content?: string
  stage?: 'before' | 'after'
  file?: File
  previewUrl?: string
}

type ExistingSheet = {
  id: string
  title: string
  rows: number
  cols: number
  orientation: Orientation
  status: 'draft' | 'final'
  created_at?: string
}

type EditorProps = { onSaved?: (id: string, status: 'draft' | 'final') => void }

export default function PhotoSheetEditor({ onSaved }: EditorProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const [orientation, setOrientation] = useState<Orientation>('portrait')
  const [presetId, setPresetId] = useState<string>('2x2')
  const preset = useMemo<GridPreset>(
    () => PHOTO_SHEET_PRESETS.find(p => p.id === presetId) || PHOTO_SHEET_PRESETS[3],
    [presetId]
  )
  const [pageCount, setPageCount] = useState<number>(1)

  const [title, setTitle] = useState('사진대지')
  const [siteId, setSiteId] = useState('')
  const [siteName, setSiteName] = useState('')
  const [sheetId, setSheetId] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [loadingSheet, setLoadingSheet] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [messageType, setMessageType] = useState<'info' | 'error'>('info')
  // Use unified layout across editor preview and list preview
  const templateMode = false
  const [existingSheets, setExistingSheets] = useState<ExistingSheet[]>([])
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [sites, setSites] = useState<SiteOption[]>([])
  const [loadingSites, setLoadingSites] = useState(false)

  const [componentOptions, setComponentOptions] = useState<WorkOption[]>([])
  const [processOptions, setProcessOptions] = useState<WorkOption[]>([])

  const totalSlots = preset.rows * preset.cols * Math.max(1, pageCount)
  const [tiles, setTiles] = useState<Tile[]>(() =>
    Array.from({ length: totalSlots }, (_, i) => ({ id: String(i) }))
  )

  useEffect(() => {
    setTiles(prev => {
      const nextLen = totalSlots
      const next: Tile[] = []
      for (let i = 0; i < nextLen; i++) {
        next[i] = prev[i] || { id: String(i) }
      }
      // revoke URLs for removed items
      prev.slice(nextLen).forEach(t => t.previewUrl && URL.revokeObjectURL(t.previewUrl))
      return next
    })
  }, [totalSlots])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoadingSites(true)
        const res = await fetch('/api/sites', { cache: 'no-store', credentials: 'include' })
        const json = await res.json().catch(() => null)
        const list = (json?.data || []) as SiteOption[]
        if (mounted) setSites(list)
      } catch {
        /* ignore */
      } finally {
        setLoadingSites(false)
      }
    })()
    ;(async () => {
      try {
        const [compRes, procRes] = await Promise.all([
          fetch('/api/admin/work-options?option_type=component_type', {
            cache: 'no-store',
            credentials: 'include',
          }),
          fetch('/api/admin/work-options?option_type=process_type', {
            cache: 'no-store',
            credentials: 'include',
          }),
        ])
        const comp = (await compRes.json().catch(() => [])) as WorkOption[]
        const proc = (await procRes.json().catch(() => [])) as WorkOption[]
        if (mounted) {
          setComponentOptions(Array.isArray(comp) ? comp : [])
          setProcessOptions(Array.isArray(proc) ? proc : [])
        }
      } catch {
        if (mounted) {
          setComponentOptions([])
          setProcessOptions([])
        }
      }
    })()
    return () => {
      mounted = false
      tiles.forEach(t => t.previewUrl && URL.revokeObjectURL(t.previewUrl))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Respond to preview data requests from preview tab
  useEffect(() => {
    const onMessage = async (ev: MessageEvent) => {
      try {
        if (!ev || typeof ev.data !== 'object') return
        if ((ev.data as any)?.type === 'request-photosheet-preview') {
          const reqId = String((ev.data as any).id || '')
          const itemsWithUrls = await Promise.all(
            tiles.map(async t => {
              let url = t.previewUrl || ''
              if (t.file) {
                try {
                  url = await fileToDataUrl(t.file)
                } catch (_e) {
                  /* ignore */
                }
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
            title,
            siteName,
            rows: preset.rows,
            cols: preset.cols,
            orientation,
            templateMode: false,
            items: itemsWithUrls,
          }
          ;(ev.source as WindowProxy | null)?.postMessage(
            { type: 'photosheet-preview', data: previewData, id: reqId },
            window.location.origin
          )
        }
      } catch (_e) {
        /* ignore */
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [title, siteName, preset.rows, preset.cols, orientation, tiles])

  // Auto-load by query param (?sheet_id=...)
  useEffect(() => {
    try {
      const url = new URL(window.location.href)
      const sid = url.searchParams.get('sheet_id')
      if (sid && !sheetId) {
        void loadSheet(sid)
      }
      const siteParam = url.searchParams.get('site_id')
      if (siteParam && !siteId) setSiteId(siteParam)
    } catch {
      /* noop for SSR */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const s = sites.find(s => s.id === siteId)
    setSiteName(s?.name || '')
  }, [siteId, sites])

  // Fetch existing photo sheets for selected site
  useEffect(() => {
    let active = true
    if (!siteId) {
      setExistingSheets([])
      return
    }
    ;(async () => {
      try {
        setLoadingExisting(true)
        const res = await fetch(`/api/photo-sheets?site_id=${encodeURIComponent(siteId)}`, {
          cache: 'no-store',
          credentials: 'include',
        })
        const json = await res.json().catch(() => null)
        if (!active) return
        if (res.ok && json?.success && Array.isArray(json.data)) {
          const list = (json.data as any[]).map(it => ({
            id: it.id,
            title: it.title || '사진대지',
            rows: Number(it.rows) || 1,
            cols: Number(it.cols) || 1,
            orientation: (it.orientation as Orientation) || 'portrait',
            status: (it.status as 'draft' | 'final') || 'draft',
            created_at: it.created_at,
          })) as ExistingSheet[]
          setExistingSheets(list)
        } else {
          setExistingSheets([])
        }
      } catch {
        if (active) setExistingSheets([])
      } finally {
        if (active) setLoadingExisting(false)
      }
    })()
    return () => {
      active = false
    }
  }, [siteId])

  const onTileFileChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setTiles(prev => {
      const next = prev.slice()
      const old = next[index]
      if (old?.previewUrl) URL.revokeObjectURL(old.previewUrl)
      next[index] = { ...old, file, previewUrl: URL.createObjectURL(file) }
      return next
    })
    e.currentTarget.value = ''
  }

  const updateTile = (index: number, patch: Partial<Tile>) => {
    setTiles(prev => {
      const next = prev.slice()
      next[index] = { ...next[index], ...patch }
      return next
    })
  }

  const canPrint = useMemo(
    () => !!title && !!siteId && tiles.some(t => t.previewUrl),
    [title, siteId, tiles]
  )

  const printRef = useRef<HTMLDivElement>(null)

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'))
      reader.readAsDataURL(file)
    })

  const openPreviewTab = useCallback(
    async (autoPrint: boolean) => {
      // Build image URLs that are valid across tabs: prefer http(s), else embed data URLs
      const itemsWithUrls = await Promise.all(
        tiles.map(async t => {
          let url = t.previewUrl || ''
          if (t.file) {
            // Convert to data URL so new tab can load without blob scope
            try {
              url = await fileToDataUrl(t.file)
            } catch {
              // fallback: keep existing previewUrl if any
            }
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
        title,
        siteName,
        rows: preset.rows,
        cols: preset.cols,
        orientation,
        templateMode: false,
        items: itemsWithUrls,
      }
      // Save to localStorage with ephemeral key so new tab can read
      const key = `ps_${Date.now()}_${Math.random().toString(36).slice(2)}`
      // Also keep in opener global store to avoid storage limits in Incognito
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
        /* ignore storage errors */
      }
      const qs = `${autoPrint ? '?auto=print' : ''}${autoPrint ? '&' : '?'}id=${encodeURIComponent(key)}`
      // Try server-side preview session first (robust in Incognito)
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
          window.location.assign(url)
          return
        }
      } catch (_e) {
        /* ignore */
      }

      const url = `/dashboard/admin/tools/photo-grid/preview/live${qs}`
      try {
        try {
          const json = JSON.stringify(previewData)
          const b64 = btoa(unescape(encodeURIComponent(json)))
          window.name = `psdata:${b64}`
        } catch {
          try {
            window.name = `psk:${key}`
          } catch (_e) {
            /* ignore */
          }
        }
        window.location.assign(url)
      } catch (_e) {
        /* ignore */
      }
    },
    [title, siteName, preset.rows, preset.cols, orientation, tiles]
  )

  const buildItemsPayload = () => {
    const items = tiles.map((t, i) => ({
      index: i,
      member: t.member || null,
      process: t.process || null,
      content: t.content || null,
      stage: t.stage || null,
      // If previewUrl is a blob:, omit; server will use uploaded file. If http(s), send as image_url
      image_url: t.previewUrl && !t.previewUrl.startsWith('blob:') ? t.previewUrl : null,
      mime: t.file?.type || null,
    }))
    return JSON.stringify(items)
  }

  const saveSheet = async (status: 'draft' | 'final') => {
    setSaving(true)
    setMessage('')
    setMessageType('info')
    try {
      const form = new FormData()
      form.append('title', title)
      form.append('site_id', siteId)
      form.append('orientation', orientation)
      form.append('rows', String(preset.rows))
      form.append('cols', String(preset.cols))
      form.append('status', status)
      form.append('items', buildItemsPayload())
      tiles.forEach((t, i) => {
        if (t.file) form.append(`file_${i}`, t.file as File)
      })

      let res: Response
      if (sheetId) {
        res = await fetch(`/api/photo-sheets/${sheetId}`, { method: 'PUT', body: form })
      } else {
        res = await fetch('/api/photo-sheets', { method: 'POST', body: form })
      }
      const text = await res.text().catch(() => '')
      let json: any = null
      try {
        json = text ? JSON.parse(text) : null
      } catch (_e) {
        void 0
      }
      if (!res.ok || !json?.success) {
        const detail = json?.error || text || '저장에 실패했습니다'
        throw new Error(detail)
      }
      const id = json?.data?.id || sheetId
      if (id) setSheetId(id)
      try {
        if (typeof window !== 'undefined') {
          const eventDetail = {
            id,
            status,
            title,
            rows: preset.rows,
            cols: preset.cols,
            orientation,
            site: siteId ? { id: siteId, name: siteName } : undefined,
            created_at: new Date().toISOString(),
          }
          try {
            window.dispatchEvent(new CustomEvent('photosheet-saved', { detail: eventDetail }))
          } catch (_e) {
            /* ignore */
          }
        }
        onSaved?.(id as string, status)
      } catch (_e) {
        /* ignore */
      }
      setMessage(status === 'final' ? '확정 저장되었습니다.' : '초안이 저장되었습니다.')
      setMessageType('info')
    } catch (e) {
      const msg = e instanceof Error ? e.message : '저장 중 오류가 발생했습니다.'
      console.error('PhotoSheet save error:', msg)
      setMessage(msg)
      setMessageType('error')
    } finally {
      setSaving(false)
    }
  }

  const loadSheet = async (id: string) => {
    if (!id) return
    setLoadingSheet(true)
    setMessage('')
    try {
      const res = await fetch(`/api/photo-sheets/${encodeURIComponent(id)}`, { cache: 'no-store' })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) throw new Error(json?.error || '불러오기에 실패했습니다')
      const s = json.data
      setSheetId(s.id)
      setTitle(s.title || '사진대지')
      setOrientation((s.orientation as Orientation) || 'portrait')
      // Update preset via rows/cols; pick matching preset if available, else keep current and set pageCount appropriately
      const match = PHOTO_SHEET_PRESETS.find(p => p.rows === s.rows && p.cols === s.cols)
      if (match) setPresetId(match.id)
      setSiteId(s.site_id)
      const items: any[] = Array.isArray(s.items) ? s.items : []
      const perPage = s.rows * s.cols
      const pg = Math.max(1, Math.ceil(items.length / Math.max(1, perPage)))
      setPageCount(pg)
      // Build tiles array sized to rows*cols*pages
      setTiles(() => {
        const total = s.rows * s.cols * pg
        const arr: Tile[] = Array.from({ length: total }, (_, i) => ({ id: String(i) }))
        items.forEach((it: any) => {
          const idx = Number(it.item_index)
          if (!Number.isFinite(idx) || idx < 0 || idx >= total) return
          arr[idx] = {
            id: String(idx),
            member: it.member_name || undefined,
            process: it.process_name || undefined,
            content: it.content || undefined,
            stage: it.stage || undefined,
            previewUrl: it.image_url || undefined,
          }
        })
        return arr
      })
      setMessage('불러오기 완료')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '불러오기 중 오류가 발생했습니다.')
    } finally {
      setLoadingSheet(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 상단 설정 영역 (외부 컨테이너에 포함되어 렌더) */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <div className="space-y-1">
          <Label htmlFor="site">현장명</Label>
          <Select value={siteId} onValueChange={setSiteId}>
            <SelectTrigger id="site" aria-label="현장 선택" disabled={loadingSites}>
              <SelectValue placeholder={loadingSites ? '로딩 중...' : '현장 선택'} />
            </SelectTrigger>
            <SelectContent>
              {sites.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>방향</Label>
          <Select value={orientation} onValueChange={v => setOrientation(v as Orientation)}>
            <SelectTrigger aria-label="방향 선택">
              <SelectValue placeholder="세로/가로" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="portrait">세로</SelectItem>
              <SelectItem value="landscape">가로</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>사진수량 (행×열)</Label>
          <Select value={presetId} onValueChange={setPresetId}>
            <SelectTrigger aria-label="프리셋 선택">
              <SelectValue placeholder="프리셋" />
            </SelectTrigger>
            <SelectContent>
              {PHOTO_SHEET_PRESETS.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="pages">페이지 수</Label>
          <Input
            id="pages"
            type="number"
            min={1}
            value={pageCount}
            onChange={e => setPageCount(Math.max(1, Number(e.target.value) || 1))}
          />
        </div>
      </div>
      {/* 기존 사진대지 불러오기: 현장명 선택 아래로 재배치, 라벨 스타일 통일 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="existingSheet">기존 사진대지 불러오기</Label>
          <Select
            value={''}
            onValueChange={v => {
              if (v) void loadSheet(v)
            }}
            disabled={loadingExisting || !siteId || existingSheets.length === 0}
          >
            <SelectTrigger id="existingSheet" aria-label="기존 사진대지 선택">
              <SelectValue
                placeholder={
                  loadingExisting
                    ? '로딩 중…'
                    : existingSheets.length
                      ? '선택하세요'
                      : '해당 현장의 사진대지가 없습니다.'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {existingSheets.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {(s.title || '사진대지') +
                    ' · ' +
                    (s.rows + '×' + s.cols) +
                    ' · ' +
                    (s.orientation === 'landscape' ? '가로' : '세로') +
                    (s.created_at
                      ? ' · ' + new Date(s.created_at).toLocaleDateString('ko-KR')
                      : '')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={loadingExisting || !siteId}
            onClick={() => {
              // refetch
              const current = siteId
              setTimeout(() => {
                // trigger effect by temporary clearing and restoring
                setExistingSheets([])
                if (current) {
                  fetch(`/api/photo-sheets?site_id=${encodeURIComponent(current)}`, {
                    cache: 'no-store',
                    credentials: 'include',
                  })
                    .then(r => r.json().catch(() => null))
                    .then(json => {
                      const list = Array.isArray(json?.data) ? (json.data as any[]) : []
                      setExistingSheets(
                        list.map(it => ({
                          id: it.id,
                          title: it.title || '사진대지',
                          rows: Number(it.rows) || 1,
                          cols: Number(it.cols) || 1,
                          orientation: (it.orientation as Orientation) || 'portrait',
                          status: (it.status as 'draft' | 'final') || 'draft',
                          created_at: it.created_at,
                        }))
                      )
                    })
                    .catch(() => void 0)
                }
              }, 0)
            }}
          >
            새로고침
          </Button>
        </div>
      </div>
      <Separator className="my-4" />

      {/* 상태/알림 문구 */}
      <div
        className={
          messageType === 'error'
            ? 'text-xs rounded border border-red-200 bg-red-50 text-red-700 px-2 py-1'
            : 'text-xs text-muted-foreground'
        }
        role="status"
        aria-live="polite"
      >
        {sheetId ? `문서 ID: ${sheetId}` : ''}
        {message ? `${sheetId ? ' • ' : ''}${message}` : ''}
      </div>

      {Array.from({ length: Math.max(1, pageCount) }).map((_, pageIdx) => {
        const start = pageIdx * (preset.rows * preset.cols)
        const end = start + preset.rows * preset.cols
        const pageTiles = tiles.slice(start, end)
        return (
          <div key={pageIdx} className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">페이지 {pageIdx + 1}</h4>
              <div className="text-xs text-muted-foreground">
                사진 {start + 1}–{end}
              </div>
            </div>
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${preset.cols}, minmax(0, 1fr))` }}
            >
              {pageTiles.map((t, i) => (
                <div key={t.id} className="border rounded p-3">
                  <div className="aspect-video w-full bg-muted flex items-center justify-center overflow-hidden rounded border">
                    {t.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.previewUrl}
                        alt={`사진 ${start + i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <label className="text-sm text-muted-foreground cursor-pointer">
                        이미지를 클릭하여 업로드
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={onTileFileChange(start + i)}
                        />
                      </label>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
                    <div>
                      <Label className="text-xs">보수 전/후</Label>
                      <Select
                        value={t.stage || ''}
                        onValueChange={v =>
                          updateTile(start + i, { stage: v as 'before' | 'after' })
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="before">보수 전</SelectItem>
                          <SelectItem value="after">보수 후</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">부재명</Label>
                      <Select
                        value={t.member || ''}
                        onValueChange={v => updateTile(start + i, { member: v })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {componentOptions.map(o => (
                            <SelectItem key={o.id} value={o.option_label}>
                              {o.option_label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">공정</Label>
                      <Select
                        value={t.process || ''}
                        onValueChange={v => updateTile(start + i, { process: v })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {processOptions.map(o => (
                            <SelectItem key={o.id} value={o.option_label}>
                              {o.option_label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-3">
                      <Label className="text-xs">내용</Label>
                      <Input
                        value={t.content || ''}
                        onChange={e => updateTile(start + i, { content: e.target.value })}
                        placeholder="내용 입력"
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={saving || !siteId}
          onClick={() => void saveSheet('final')}
        >
          {saving ? '저장 중…' : '저장'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!canPrint}
          onClick={() => {
            void openPreviewTab(false)
          }}
        >
          미리보기
        </Button>
      </div>

      {/* Print Preview DOM (hidden). Render only after mount to avoid hydration mismatch. */}
      {mounted && (
        <div
          ref={printRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '-10000px',
            top: '-10000px',
            width: 0,
            height: 0,
            overflow: 'hidden',
          }}
        >
          <PhotoSheetPrint
            title={title}
            siteName={siteName}
            rows={preset.rows}
            cols={preset.cols}
            orientation={orientation}
            items={tiles.map(t => ({
              id: t.id,
              member: t.member,
              process: t.process,
              content: t.content,
              stage: t.stage,
              previewUrl: t.previewUrl,
            }))}
            templateMode={false}
          />
        </div>
      )}
    </div>
  )
}
