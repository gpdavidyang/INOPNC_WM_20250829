'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { PHOTO_SHEET_PRESETS } from '@/components/photo-sheet/presets'

interface SiteOption {
  id: string
  name: string
}

interface WorkOptionSetting {
  id: string
  option_type: 'component_type' | 'process_type'
  option_value: string
  option_label: string
  display_order: number
}

interface DailyReportListItem {
  id: string
  work_date: string
  member_name?: string | null
  process_type?: string | null
  component_name?: string | null
  work_section?: string | null
  before_photos?: Array<{ url?: string }>
  after_photos?: Array<{ url?: string }>
  additional_before_photos?: Array<{ url?: string }>
  additional_after_photos?: Array<{ url?: string }>
}

interface PhotoItem {
  url: string
  id?: string | number
}

const resolvePhotoUrl = (photo: unknown): string | null => {
  if (!photo) return null
  if (typeof photo === 'string') {
    const trimmed = photo.trim()
    return trimmed || null
  }
  if (typeof photo === 'object') {
    const record = photo as Record<string, unknown>
    const candidates = [
      record['url'],
      record['file_url'],
      record['fileUrl'],
      record['public_url'],
      record['publicUrl'],
      record['download_url'],
      record['downloadUrl'],
      record['signed_url'],
      record['signedUrl'],
    ]
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim()
      }
    }
  }
  return null
}

const normalizePhotoItems = (photos?: unknown[]): PhotoItem[] => {
  if (!Array.isArray(photos)) return []
  return photos
    .map((photo, index) => {
      const url = resolvePhotoUrl(photo)
      if (!url) return null
      if (photo && typeof photo === 'object') {
        const record = photo as Record<string, unknown>
        const id = record['id']
        const uploadOrder = record['upload_order']
        const order = record['order']
        const normalizedId =
          typeof id === 'string' || typeof id === 'number'
            ? id
            : typeof uploadOrder === 'number'
              ? uploadOrder
              : typeof order === 'number'
                ? order
                : index
        return { url, id: normalizedId }
      }
      return { url, id: index }
    })
    .filter((item): item is PhotoItem => Boolean(item))
}

const countPhotoItems = (...groups: Array<unknown[] | undefined>): number =>
  groups.reduce((sum, group) => sum + normalizePhotoItems(group).length, 0)

export default function CreateFromDailyReport({ onCreated }: { onCreated?: () => void }) {
  // Filters
  const [sites, setSites] = useState<SiteOption[]>([])
  const [siteId, setSiteId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Work options for meta autofill/edit
  const [componentOptions, setComponentOptions] = useState<WorkOptionSetting[]>([])
  const [processOptions, setProcessOptions] = useState<WorkOptionSetting[]>([])

  const [reports, setReports] = useState<DailyReportListItem[]>([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [reportDetail, setReportDetail] = useState<any | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const layoutPresets = useMemo(
    () => PHOTO_SHEET_PRESETS.filter(p => ['1x1', '2x1', '2x2', '3x2'].includes(p.id)),
    []
  )
  const [layoutPresetId, setLayoutPresetId] = useState<string>('2x2')
  const selectedLayout = useMemo(() => {
    const fallback = layoutPresets.find(p => p.id === '2x2') || layoutPresets[0]
    return layoutPresets.find(p => p.id === layoutPresetId) || fallback
  }, [layoutPresets, layoutPresetId])
  const [pageCount, setPageCount] = useState<number>(1)

  // Selected photos
  type Selected = { url: string; order: number }
  const [selectedBefore, setSelectedBefore] = useState<Selected[]>([])
  const [selectedAfter, setSelectedAfter] = useState<Selected[]>([])
  const perPageSlots = selectedLayout.rows * selectedLayout.cols
  const selectedPhotoTotal = selectedBefore.length + selectedAfter.length

  useEffect(() => {
    if (perPageSlots <= 0) return
    const neededPages = Math.max(1, Math.ceil(selectedPhotoTotal / perPageSlots))
    setPageCount(prev => (prev < neededPages ? neededPages : prev || 1))
  }, [perPageSlots, selectedPhotoTotal])

  const totalCapacity = perPageSlots * Math.max(1, pageCount)

  const recommendPresetId = useCallback((count: number) => {
    if (count <= 1) return '1x1'
    if (count <= 2) return '2x1'
    if (count <= 4) return '2x2'
    return '3x2'
  }, [])

  const handleAutoLayout = () => {
    const count = selectedPhotoTotal
    if (count === 0) {
      alert('먼저 사진을 선택해 주세요.')
      return
    }
    const targetId = recommendPresetId(count)
    setLayoutPresetId(targetId)
    const preset = layoutPresets.find(p => p.id === targetId) || selectedLayout
    const capacityPerPage = preset.rows * preset.cols
    setPageCount(Math.max(1, Math.ceil(count / capacityPerPage)))
  }

  // Meta fields
  const [componentName, setComponentName] = useState('')
  const [componentNameOther, setComponentNameOther] = useState('')
  const [workProcess, setWorkProcess] = useState('')
  const [workProcessOther, setWorkProcessOther] = useState('')
  const [workSection, setWorkSection] = useState('')
  const [workDate, setWorkDate] = useState('')

  const isOtherComponent = componentName === '__OTHER__'
  const isOtherProcess = workProcess === '__OTHER__'

  // Load sites & options
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/sites', { cache: 'no-store', credentials: 'include' })
        const json = await res.json().catch(() => null)
        if (mounted) setSites((json?.data || []) as SiteOption[])
      } catch (e) {
        void 0
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
        const comp = (await compRes.json().catch(() => [])) as WorkOptionSetting[]
        const proc = (await procRes.json().catch(() => [])) as WorkOptionSetting[]
        if (mounted) {
          setComponentOptions(Array.isArray(comp) ? comp : [])
          setProcessOptions(Array.isArray(proc) ? proc : [])
        }
      } catch (e) {
        void 0
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // Load reports for site and date filters
  const loadReports = useCallback(async () => {
    if (!siteId) return
    setLoadingReports(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('status', 'submitted')
      params.set('limit', '50')
      if (dateFrom && dateFrom === dateTo) {
        params.set('date', dateFrom)
      }
      const res = await fetch(`/api/admin/sites/${siteId}/daily-reports?${params.toString()}`, {
        cache: 'no-store',
        credentials: 'include',
      })
      const json = await res.json().catch(() => ({}))
      const list = Array.isArray(json?.data) ? json.data : []
      setReports(list)
    } catch (e) {
      setReports([])
      setError('작업일지 목록을 불러오지 못했습니다')
    } finally {
      setLoadingReports(false)
    }
  }, [siteId, dateFrom, dateTo])

  useEffect(() => {
    void loadReports()
  }, [loadReports])

  // Load detail for selected report
  const pickReport = async (id: string) => {
    setSelectedReportId(id)
    setLoadingDetail(true)
    setError(null)
    try {
      // Prefer using the loaded list item to avoid extra roundtrip and potential 404
      const item = reports.find(r => r.id === id)
      if (item) {
        const dr = item as any
        setWorkDate(dr?.work_date || '')
        setWorkSection(dr?.work_section || '')
        const comp = dr?.component_name || ''
        const proc = dr?.work_process || dr?.process_type || ''
        const compMatch = componentOptions.find(o => o.option_label === comp)
        const procMatch = processOptions.find(o => o.option_label === proc)
        setComponentName(compMatch ? compMatch.option_label : comp ? '__OTHER__' : '')
        setComponentNameOther(compMatch ? '' : comp || '')
        setWorkProcess(procMatch ? procMatch.option_label : proc ? '__OTHER__' : '')
        setWorkProcessOther(procMatch ? '' : proc || '')

        const before: PhotoItem[] = [
          ...normalizePhotoItems(dr?.before_photos),
          ...normalizePhotoItems(dr?.additional_before_photos),
        ]
        const after: PhotoItem[] = [
          ...normalizePhotoItems(dr?.after_photos),
          ...normalizePhotoItems(dr?.additional_after_photos),
        ]

        setSelectedBefore([])
        setSelectedAfter([])
        setReportDetail({ daily_report: dr, _candidates: { before, after } })
        // Scroll detail into view for better feedback
        setTimeout(() => {
          const el = document.getElementById('pg-dr-detail')
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 0)
        return
      }

      // Fallback to integrated endpoint
      const res = await fetch(`/api/admin/daily-reports/${id}/integrated`, { cache: 'no-store' })
      if (!res.ok) throw new Error('상세 조회 실패')
      const detail = await res.json()
      setReportDetail(detail)
      const dr = detail?.daily_report || {}
      setWorkDate(dr?.work_date || '')
      setWorkSection(dr?.work_section || '')
      const comp = dr?.component_name || ''
      const proc = dr?.work_process || dr?.process_type || ''
      const compMatch = componentOptions.find(o => o.option_label === comp)
      const procMatch = processOptions.find(o => o.option_label === proc)
      setComponentName(compMatch ? compMatch.option_label : comp ? '__OTHER__' : '')
      setComponentNameOther(compMatch ? '' : comp || '')
      setWorkProcess(procMatch ? procMatch.option_label : proc ? '__OTHER__' : '')
      setWorkProcessOther(procMatch ? '' : proc || '')

      let before: PhotoItem[] = [
        ...normalizePhotoItems(dr?.before_photos),
        ...normalizePhotoItems(dr?.additional_before_photos),
      ]
      let after: PhotoItem[] = [
        ...normalizePhotoItems(dr?.after_photos),
        ...normalizePhotoItems(dr?.additional_after_photos),
      ]
      const docs = detail?.documents || {}
      if (before.length === 0 && after.length === 0 && Array.isArray(docs['photo'])) {
        before = normalizePhotoItems(docs['photo'])
      }
      setSelectedBefore([])
      setSelectedAfter([])
      setReportDetail((prev: any) => ({ ...prev, _candidates: { before, after } }))
      setTimeout(() => {
        const el = document.getElementById('pg-dr-detail')
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 0)
    } catch (e: any) {
      setError(e?.message || '상세 조회 실패')
      setReportDetail(null)
    } finally {
      setLoadingDetail(false)
    }
  }

  // Helpers: selection/reorder
  const addBefore = (p: PhotoItem) => {
    if (selectedBefore.find(x => x.url === p.url)) return
    setSelectedBefore(prev => [...prev, { url: p.url, order: prev.length }])
  }
  const addAfter = (p: PhotoItem) => {
    if (selectedAfter.find(x => x.url === p.url)) return
    setSelectedAfter(prev => [...prev, { url: p.url, order: prev.length }])
  }
  const removeBefore = (i: number) => {
    const list = selectedBefore.slice()
    list.splice(i, 1)
    list.forEach((x, idx) => (x.order = idx))
    setSelectedBefore(list)
  }
  const removeAfter = (i: number) => {
    const list = selectedAfter.slice()
    list.splice(i, 1)
    list.forEach((x, idx) => (x.order = idx))
    setSelectedAfter(list)
  }
  const reorder = (kind: 'before' | 'after', i: number, dir: -1 | 1) => {
    const list = kind === 'before' ? selectedBefore.slice() : selectedAfter.slice()
    const target = i + dir
    if (target < 0 || target >= list.length) return
    const [it] = list.splice(i, 1)
    list.splice(target, 0, it)
    list.forEach((x, idx) => (x.order = idx))
    if (kind === 'before') setSelectedBefore(list)
    else setSelectedAfter(list)
  }

  const submitting = useMemo(() => false, [])
  const canSubmit = useMemo(() => {
    const compOk = !!componentName && (!isOtherComponent || !!componentNameOther.trim())
    const procOk = !!workProcess && (!isOtherProcess || !!workProcessOther.trim())
    const siteOk = !!siteId || !!reportDetail?.site?.id || !!reportDetail?.daily_report?.site_id
    const totalPhotos = selectedBefore.length + selectedAfter.length
    const havePhotos = totalPhotos > 0
    return compOk && procOk && siteOk && !!workDate && havePhotos
  }, [
    componentName,
    componentNameOther,
    isOtherComponent,
    workProcess,
    workProcessOther,
    isOtherProcess,
    siteId,
    reportDetail,
    workDate,
    selectedBefore.length,
    selectedAfter.length,
  ])

  const buildReportSummary = useCallback(() => {
    const detail =
      (reportDetail?.daily_report as any) || reports.find(r => r.id === selectedReportId)
    if (!detail) return ''
    const parts: string[] = []
    const workDate = detail.work_date || detail.date || ''
    if (workDate) {
      try {
        parts.push(
          new Date(workDate).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })
        )
      } catch {
        parts.push(workDate)
      }
    }
    if (detail.component_name || detail.member_name) {
      parts.push(detail.component_name || detail.member_name)
    }
    if (detail.process_type) {
      parts.push(detail.process_type)
    }
    return parts.join(' / ')
  }, [reportDetail, reports, selectedReportId])

  const handleCreate = async () => {
    if (!canSubmit) return
    try {
      const finalComponentName = isOtherComponent ? componentNameOther.trim() : componentName
      const finalWorkProcess = isOtherProcess ? workProcessOther.trim() : workProcess
      const finalSiteId = siteId || reportDetail?.site?.id || reportDetail?.daily_report?.site_id

      const all = [
        ...selectedBefore.map(p => ({ ...p, stage: 'before' as const })),
        ...selectedAfter.map(p => ({ ...p, stage: 'after' as const })),
      ]
      const count = all.length
      const rows = selectedLayout.rows
      const cols = selectedLayout.cols
      const items = all.map((p, idx) => ({
        index: idx,
        member: finalComponentName || null,
        process: finalWorkProcess || null,
        content: workSection || null,
        stage: p.stage,
        image_url: p.url,
      }))

      const form = new FormData()
      form.append('title', finalComponentName || '사진대지')
      form.append('site_id', finalSiteId)
      form.append('orientation', 'portrait')
      form.append('rows', String(rows))
      form.append('cols', String(cols))
      form.append('status', 'final')
      if (selectedReportId) {
        form.append('source_daily_report_id', selectedReportId)
        const summary = buildReportSummary()
        if (summary) form.append('source_daily_report_summary', summary)
      }
      form.append('items', JSON.stringify(items))

      const res = await fetch('/api/photo-sheets', {
        method: 'POST',
        body: form,
        credentials: 'include',
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) throw new Error(json?.error || '생성 실패')
      if (onCreated) onCreated()
      alert('사진대지가 생성되었습니다.')
    } catch (e: any) {
      alert(e?.message || '생성 실패')
    }
  }

  const candidates = reportDetail?._candidates || { before: [], after: [] }

  // Reset reports and selections to empty state while keeping filters
  const handleReset = () => {
    setReports([])
    setSelectedReportId(null)
    setReportDetail(null)
    setSelectedBefore([])
    setSelectedAfter([])
    setError(null)
    setLoadingReports(false)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div className="md:col-span-2">
          <Label>현장</Label>
          <Select value={siteId} onValueChange={setSiteId}>
            <SelectTrigger aria-label="현장 선택">
              <SelectValue placeholder="현장을 선택" />
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
        <div>
          <Label>시작일</Label>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div>
          <Label>종료일</Label>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadReports()}
            disabled={!siteId || loadingReports}
          >
            불러오기
          </Button>
          <Button type="button" variant="outline" onClick={handleReset} disabled={loadingReports}>
            초기화
          </Button>
        </div>
      </div>

      {/* Layout selection */}
      <div className="rounded border bg-white p-4 space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="md:w-48">
            <Label>사진수량 (행×열)</Label>
            <Select value={layoutPresetId} onValueChange={setLayoutPresetId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="선택" />
              </SelectTrigger>
              <SelectContent>
                {layoutPresets.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-muted-foreground">선택한 사진: {selectedPhotoTotal}장</span>
          <span className="text-muted-foreground">현재 배치 수용량: {totalCapacity}장</span>
          <span className="text-muted-foreground">필요 페이지 수는 자동으로 맞춰집니다.</span>
        </div>
      </div>

      {/* Reports list */}
      <div className="rounded border overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-3 py-2">날짜</th>
              <th className="px-3 py-2">부재/공정</th>
              <th className="px-3 py-2">작성자</th>
              <th className="px-3 py-2">사진(전/후)</th>
              <th className="px-3 py-2">동작</th>
            </tr>
          </thead>
          <tbody>
            {loadingReports ? (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                  불러오는 중...
                </td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                  작업일지가 없습니다. 필터를 조정해 보세요.
                </td>
              </tr>
            ) : (
              reports.map(r => (
                <tr
                  key={r.id}
                  className={`border-t ${selectedReportId === r.id ? 'bg-blue-50/40' : ''}`}
                >
                  <td className="px-3 py-2">
                    {r.work_date ? new Date(r.work_date).toLocaleDateString('ko-KR') : '-'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-foreground">{r.component_name || '-'}</div>
                    <div className="text-xs text-muted-foreground">{r.process_type || '-'}</div>
                  </td>
                  <td className="px-3 py-2">{r.member_name || '-'}</td>
                  <td className="px-3 py-2">
                    {(() => {
                      const beforeCount = countPhotoItems(
                        r.before_photos,
                        r.additional_before_photos
                      )
                      const afterCount = countPhotoItems(r.after_photos, r.additional_after_photos)
                      const total = beforeCount + afterCount
                      if (total === 0) return <span className="text-muted-foreground">-</span>
                      return (
                        <span>
                          전 {beforeCount} / 후 {afterCount}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="px-3 py-2">
                    <Button variant="outline" size="compact" onClick={() => void pickReport(r.id)}>
                      사진 선택
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail and selection */}
      {selectedReportId && (
        <div id="pg-dr-detail" className="rounded-lg border bg-white p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label>부재명</Label>
              <Select value={componentName} onValueChange={setComponentName}>
                <SelectTrigger aria-label="부재명 선택">
                  <SelectValue placeholder="부재명 선택" />
                </SelectTrigger>
                <SelectContent>
                  {componentOptions.map(opt => {
                    const isOther = opt.option_value === 'other' || opt.option_label === '기타'
                    const value = isOther ? '__OTHER__' : opt.option_label
                    return (
                      <SelectItem key={opt.id} value={value}>
                        {isOther ? '기타(직접입력)' : opt.option_label}
                      </SelectItem>
                    )
                  })}
                  {!componentOptions.some(
                    o => o.option_value === 'other' || o.option_label === '기타'
                  ) && <SelectItem value="__OTHER__">기타(직접입력)</SelectItem>}
                </SelectContent>
              </Select>
              {isOtherComponent && (
                <Input
                  className="mt-1"
                  placeholder="부재명을 직접 입력"
                  value={componentNameOther}
                  onChange={e => setComponentNameOther(e.target.value)}
                />
              )}
            </div>
            <div className="space-y-1">
              <Label>작업공정</Label>
              <Select value={workProcess} onValueChange={setWorkProcess}>
                <SelectTrigger aria-label="작업공정 선택">
                  <SelectValue placeholder="작업공정 선택" />
                </SelectTrigger>
                <SelectContent>
                  {processOptions.map(opt => {
                    const isOther = opt.option_value === 'other' || opt.option_label === '기타'
                    const value = isOther ? '__OTHER__' : opt.option_label
                    return (
                      <SelectItem key={opt.id} value={value}>
                        {isOther ? '기타(직접입력)' : opt.option_label}
                      </SelectItem>
                    )
                  })}
                  {!processOptions.some(
                    o => o.option_value === 'other' || o.option_label === '기타'
                  ) && <SelectItem value="__OTHER__">기타(직접입력)</SelectItem>}
                </SelectContent>
              </Select>
              {isOtherProcess && (
                <Input
                  className="mt-1"
                  placeholder="작업공정을 직접 입력"
                  value={workProcessOther}
                  onChange={e => setWorkProcessOther(e.target.value)}
                />
              )}
            </div>
            <div className="space-y-1">
              <Label>작업구간</Label>
              <Input
                value={workSection}
                onChange={e => setWorkSection(e.target.value)}
                placeholder="예: 3구간 A"
              />
            </div>
            <div className="space-y-1">
              <Label>작업일자</Label>
              <Input type="date" value={workDate} onChange={e => setWorkDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold">작업 전 선택 ({selectedBefore.length})</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {selectedBefore.map((p, i) => (
                  <div
                    key={`${p.url}-${i}`}
                    className="relative rounded border overflow-hidden group"
                  >
                    <img src={p.url} alt={`전 ${i + 1}`} className="w-full h-24 object-cover" />
                    <div className="absolute inset-x-0 bottom-0 flex justify-between p-1 bg-black/50 opacity-0 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        className="text-xs text-white"
                        onClick={() => reorder('before', i, -1)}
                      >
                        ↑
                      </button>
                      <span className="text-xs text-white">{i + 1}</span>
                      <button
                        type="button"
                        className="text-xs text-white"
                        onClick={() => reorder('before', i, 1)}
                      >
                        ↓
                      </button>
                    </div>
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 text-xs"
                      onClick={() => removeBefore(i)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <div className="text-xs text-muted-foreground mb-1">일지의 ‘전’ 사진</div>
                <div className="grid grid-cols-6 gap-2">
                  {candidates.before.map((p: PhotoItem, i: number) => (
                    <button
                      key={`${p.url}-${i}`}
                      type="button"
                      className="rounded border overflow-hidden hover:ring-2 hover:ring-blue-500"
                      onClick={() => addBefore(p)}
                    >
                      <img
                        src={p.url}
                        alt={`전 후보 ${i + 1}`}
                        className="w-full h-16 object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold">작업 후 선택 ({selectedAfter.length})</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {selectedAfter.map((p, i) => (
                  <div
                    key={`${p.url}-${i}`}
                    className="relative rounded border overflow-hidden group"
                  >
                    <img src={p.url} alt={`후 ${i + 1}`} className="w-full h-24 object-cover" />
                    <div className="absolute inset-x-0 bottom-0 flex justify-between p-1 bg-black/50 opacity-0 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        className="text-xs text-white"
                        onClick={() => reorder('after', i, -1)}
                      >
                        ↑
                      </button>
                      <span className="text-xs text-white">{i + 1}</span>
                      <button
                        type="button"
                        className="text-xs text-white"
                        onClick={() => reorder('after', i, 1)}
                      >
                        ↓
                      </button>
                    </div>
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 text-xs"
                      onClick={() => removeAfter(i)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <div className="text-xs text-muted-foreground mb-1">일지의 ‘후’ 사진</div>
                <div className="grid grid-cols-6 gap-2">
                  {candidates.after.map((p: PhotoItem, i: number) => (
                    <button
                      key={`${p.url}-${i}`}
                      type="button"
                      className="rounded border overflow-hidden hover:ring-2 hover:ring-blue-500"
                      onClick={() => addAfter(p)}
                    >
                      <img
                        src={p.url}
                        alt={`후 후보 ${i + 1}`}
                        className="w-full h-16 object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => void handleCreate()} disabled={!canSubmit || loadingDetail}>
              사진대지 생성
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
