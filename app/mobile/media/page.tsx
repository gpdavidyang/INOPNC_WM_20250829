'use client'

import { useEffect, useMemo, useState, useRef, type ReactNode } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'

type MediaTab = 'photo' | 'drawing'

interface DrawingItem {
  id: string
  title: string
  status: '마킹 완료' | '진행중' | '미마킹'
  worklogCount: number
  ctaLabel: string
  accent?: boolean
  markupCount?: number
  linkedWorklogs?: string[]
}

interface Option {
  value: string
  label: string
}

interface PhotoItem {
  id: string
  url: string
  filePath?: string | null
  name: string
  type: string
  siteId: string | null
  siteName: string | null
  worklogId: string | null
  workDate?: string | null
  status?: string | null
  uploadedAt?: string | null
  workDescription?: string | null
}

interface WorklogItem {
  id: string
  workDate?: string | null
  siteId?: string | null
  siteName?: string | null
  workDescription?: string | null
  locationLabel?: string | null
  status?: string | null
  authorName?: string | null
}

const PERIOD_OPTIONS: Option[] = [
  { value: 'all', label: '전체 기간' },
  { value: '7d', label: '최근 7일' },
  { value: '30d', label: '최근 30일' },
  { value: '90d', label: '최근 90일' },
]

export default function MediaManagementPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialTab = searchParams.get('tab') === 'drawing' ? 'drawing' : 'photo'
  const initialSiteId = searchParams.get('siteId') ?? 'all'

  const [activeTab, setActiveTab] = useState<MediaTab>(initialTab)
  const [siteFilterLabel, setSiteFilterLabel] = useState('전체 현장')
  const [periodFilterLabel, setPeriodFilterLabel] = useState('최근 7일')
  const [periodValue, setPeriodValue] = useState('7d')
  const [selectedSiteId, setSelectedSiteId] = useState<string>(initialSiteId)
  const [siteOptions, setSiteOptions] = useState<Option[]>([{ value: 'all', label: '전체 현장' }])
  const [siteLoading, setSiteLoading] = useState(false)
  const [siteError, setSiteError] = useState<string | null>(null)
  const [drawingLoading, setDrawingLoading] = useState(false)
  const [drawingError, setDrawingError] = useState<string | null>(null)
  const [drawings, setDrawings] = useState<DrawingItem[]>([])
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>([])
  const [photoLoading, setPhotoLoading] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [photoRefreshKey, setPhotoRefreshKey] = useState(0)
  const [worklogStatusFilter, setWorklogStatusFilter] = useState<
    'all' | 'draft' | 'submitted' | 'approved'
  >('all')
  const [worklogs, setWorklogs] = useState<WorklogItem[]>([])
  const [worklogLoading, setWorklogLoading] = useState(false)
  const [worklogError, setWorklogError] = useState<string | null>(null)
  const autoSiteSet = useRef(false)

  const filteredDrawings = useMemo(() => drawings, [drawings])
  const filteredPhotos = useMemo(() => {
    const matchPeriod = (dateStr?: string | null) => {
      if (periodValue === 'all') return true
      if (!dateStr) return false
      const target = new Date(dateStr)
      if (Number.isNaN(target.getTime())) return false
      const now = new Date()
      const diffMs = now.getTime() - target.getTime()
      const diffDays = diffMs / (1000 * 60 * 60 * 24)
      if (periodValue === '7d') return diffDays <= 7
      if (periodValue === '30d') return diffDays <= 30
      if (periodValue === '90d') return diffDays <= 90
      return true
    }
    const matchStatus = (status?: string | null) => {
      if (worklogStatusFilter === 'all') return true
      if (!status) return false
      const s = status.toLowerCase()
      if (worklogStatusFilter === 'draft') return s === 'draft' || s === 'pending'
      if (worklogStatusFilter === 'submitted') return s === 'submitted' || s === 'completed'
      if (worklogStatusFilter === 'approved') return s === 'approved'
      return true
    }
    return photoItems.filter(item => {
      // Prefer uploadedAt so newly added photos on 오래된 작업일지도 보인다
      const targetDate = item.uploadedAt || item.workDate
      return matchPeriod(targetDate) && matchStatus(item.status)
    })
  }, [photoItems, periodValue, worklogStatusFilter])

  const photosByWorklog = useMemo(() => {
    const map = new Map<string, { before: PhotoItem[]; after: PhotoItem[] }>()
    filteredPhotos.forEach(photo => {
      const key = photo.worklogId ? String(photo.worklogId) : ''
      if (!key) return
      const entry = map.get(key) || { before: [], after: [] }
      if (photo.type === 'after') entry.after.push(photo)
      else entry.before.push(photo)
      map.set(key, entry)
    })
    return map
  }, [filteredPhotos])

  const totalPhotos = filteredPhotos.length
  const totalLinkedWorklogs = useMemo(() => {
    const photoLinks = new Set<string>()
    filteredPhotos.forEach(p => {
      if (p.worklogId) photoLinks.add(String(p.worklogId))
    })
    const drawingLinks = filteredDrawings.flatMap(d => d.linkedWorklogs || [])
    drawingLinks.forEach(id => photoLinks.add(String(id)))
    return photoLinks.size
  }, [filteredDrawings, filteredPhotos])

  const photoCountsByWorklog = useMemo(() => {
    const map = new Map<string, { before: number; after: number }>()
    filteredPhotos.forEach(photo => {
      const key = photo.worklogId ? String(photo.worklogId) : ''
      if (!key) return
      const entry = map.get(key) || { before: 0, after: 0 }
      if (photo.type === 'before') entry.before += 1
      else entry.after += 1
      map.set(key, entry)
    })
    return map
  }, [filteredPhotos])

  const filteredWorklogs = useMemo(() => {
    const matches = (status?: string | null) => {
      if (worklogStatusFilter === 'all') return true
      if (!status) return false
      const s = status.toLowerCase()
      if (worklogStatusFilter === 'draft') return s === 'draft' || s === 'pending'
      if (worklogStatusFilter === 'submitted') return s === 'submitted' || s === 'completed'
      if (worklogStatusFilter === 'approved') return s === 'approved'
      return true
    }
    return worklogs.filter(w => matches(w.status))
  }, [worklogs, worklogStatusFilter])

  useEffect(() => {
    const cached = (() => {
      try {
        const raw = localStorage.getItem('selected_site')
        if (!raw) return null
        return JSON.parse(raw) as { id?: string; name?: string }
      } catch {
        return null
      }
    })()

    if (initialSiteId && initialSiteId !== 'all') {
      setSelectedSiteId(initialSiteId)
      return
    }

    if (cached?.id) {
      setSelectedSiteId(cached.id)
      if (cached.name) setSiteFilterLabel(cached.name)
    }
  }, [initialSiteId])

  useEffect(() => {
    let isActive = true
    const controller = new AbortController()
    const fetchSites = async () => {
      setSiteLoading(true)
      setSiteError(null)
      try {
        const res = await fetch('/api/mobile/sites/list', {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`sites list failed (${res.status})`)
        const json = await res.json().catch(() => ({}))
        const list: Option[] = (
          Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []
        ).map((item: any) => ({
          value: String(item.id),
          label: item.name || item.title || '현장',
        }))
        if (!isActive) return
        setSiteOptions([{ value: 'all', label: '전체 현장' }, ...list])
      } catch (err) {
        if (!isActive) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        console.error('[media] site list error', err)
        setSiteError('현장 목록을 불러올 수 없습니다.')
        setSiteOptions([{ value: 'all', label: '전체 현장' }])
      } finally {
        if (isActive) setSiteLoading(false)
      }
    }
    fetchSites()
    return () => {
      isActive = false
      controller.abort()
    }
  }, [])

  useEffect(() => {
    const matched = siteOptions.find(opt => opt.value === selectedSiteId)
    if (matched) {
      setSiteFilterLabel(matched.label)
    } else if (selectedSiteId === 'all') {
      setSiteFilterLabel('전체 현장')
    }
  }, [selectedSiteId, siteOptions])

  useEffect(() => {
    let isActive = true
    const controller = new AbortController()
    const fetchPhotos = async () => {
      setPhotoLoading(true)
      setPhotoError(null)
      try {
        const params = new URLSearchParams()
        params.set('limit', '100')
        if (selectedSiteId && selectedSiteId !== 'all') params.set('site_id', selectedSiteId)
        const res = await fetch(`/api/mobile/media/photos?${params.toString()}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`사진 목록 조회 실패(${res.status})`)
        const json = await res.json()
        if (!isActive) return
        setPhotoItems(json?.data?.photos || [])
      } catch (err) {
        if (!isActive) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        console.error('[media] photo fetch error', err)
        setPhotoError('사진 목록을 불러올 수 없습니다.')
        setPhotoItems([])
      } finally {
        if (isActive) setPhotoLoading(false)
      }
    }
    fetchPhotos()
    return () => {
      isActive = false
      controller.abort()
    }
  }, [selectedSiteId, photoRefreshKey])

  useEffect(() => {
    let isActive = true
    const controller = new AbortController()
    const fetchWorklogs = async () => {
      setWorklogLoading(true)
      setWorklogError(null)
      try {
        const params = new URLSearchParams()
        params.set('limit', '15')
        params.set('page', '1')
        if (selectedSiteId && selectedSiteId !== 'all') params.set('site_id', selectedSiteId)
        const res = await fetch(`/api/mobile/daily-reports?${params.toString()}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`작업일지 조회 실패(${res.status})`)
        const json = await res.json()
        const reports: any[] = json?.data?.reports || []
        const mapped: WorklogItem[] = reports.map(report => {
          const location =
            report?.location_info ||
            report?.location ||
            (report?.work_content && report.work_content.location_info)
          const locLabel = location
            ? [location.block, location.dong, location.unit].filter(Boolean).join(' ')
            : null
          return {
            id: report?.id,
            workDate: report?.work_date || report?.workDate || null,
            siteId: report?.site_id || report?.siteId || report?.sites?.id || null,
            siteName: report?.sites?.name || report?.site_name || report?.siteName || null,
            authorName:
              report?.member_name ||
              report?.writer_name ||
              report?.author_name ||
              report?.created_by_name ||
              null,
            workDescription:
              report?.work_description ||
              report?.title ||
              (Array.isArray(report?.work_content?.workProcesses) &&
              report.work_content.workProcesses.length
                ? report.work_content.workProcesses.join(', ')
                : null),
            locationLabel: locLabel,
            status: report?.status || null,
          }
        })
        if (!isActive) return
        setWorklogs(mapped)
      } catch (err) {
        if (!isActive) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        console.error('[media] worklog fetch error', err)
        setWorklogError('작업일지 목록을 불러올 수 없습니다.')
        setWorklogs([])
      } finally {
        if (isActive) setWorklogLoading(false)
      }
    }
    fetchWorklogs()
    return () => {
      isActive = false
      controller.abort()
    }
  }, [selectedSiteId])

  useEffect(() => {
    if (autoSiteSet.current) return
    if (selectedSiteId !== 'all') return
    const first = worklogs.find(w => w.siteId)
    if (!first || !first.siteId) return
    const match = siteOptions.find(opt => opt.value === first.siteId)
    const nextLabel = match?.label || first.siteName || '현장'
    setSelectedSiteId(first.siteId)
    setSiteFilterLabel(nextLabel)
    try {
      localStorage.setItem('selected_site', JSON.stringify({ id: first.siteId, name: nextLabel }))
    } catch {
      /* ignore */
    }
    autoSiteSet.current = true
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    params.set('siteId', first.siteId)
    if (activeTab) params.set('tab', activeTab)
    const query = params.toString()
    router.replace(query ? `/mobile/media?${query}` : '/mobile/media', { scroll: false })
  }, [worklogs, selectedSiteId, siteOptions, searchParams, router, activeTab])

  useEffect(() => {
    if (selectedSiteId === 'all') {
      setDrawings([])
      setDrawingError(null)
      setDrawingLoading(false)
      return
    }

    let isActive = true
    const controller = new AbortController()

    const fetchDrawings = async () => {
      setDrawingLoading(true)
      setDrawingError(null)
      try {
        const params = new URLSearchParams()
        params.set('site_id', selectedSiteId)
        params.set('include_shared', 'true')
        const res = await fetch(`/api/markup-documents/list?${params.toString()}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!res.ok) {
          throw new Error(`마킹 도면 조회 실패(${res.status})`)
        }
        const json = await res.json()
        const docs: any[] = json?.data?.documents || []
        const mapped: DrawingItem[] = docs.map(doc => {
          const markupCount =
            typeof doc.markupCount === 'number'
              ? doc.markupCount
              : Array.isArray(doc.markupData)
                ? doc.markupData.length
                : 0
          const linkedWorklogs: string[] = Array.isArray(doc.linkedWorklogs)
            ? doc.linkedWorklogs.map(String)
            : []
          const status: DrawingItem['status'] =
            markupCount > 0 || linkedWorklogs.length > 0 ? '마킹 완료' : '미마킹'
          return {
            id: doc.id,
            title: doc.title || doc.original_blueprint_filename || '도면',
            status,
            worklogCount: linkedWorklogs.length,
            ctaLabel: status === '마킹 완료' ? '열기' : '마킹 시작',
            markupCount,
            linkedWorklogs,
          }
        })

        if (!isActive) return
        setDrawings(mapped)
      } catch (err) {
        if (!isActive) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        console.error('[media] drawing fetch error', err)
        setDrawingError('도면 목록을 불러올 수 없습니다.')
        setDrawings([])
      } finally {
        if (isActive) setDrawingLoading(false)
      }
    }

    fetchDrawings()
    return () => {
      isActive = false
      controller.abort()
    }
  }, [selectedSiteId])

  const handleTabChange = (tab: MediaTab) => {
    setActiveTab(tab)
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    params.set('tab', tab)
    if (selectedSiteId && selectedSiteId !== 'all') params.set('siteId', selectedSiteId)
    const query = params.toString()
    router.replace(query ? `/mobile/media?${query}` : '/mobile/media', { scroll: false })
  }

  const handleSelectSite = (value: string) => {
    setSelectedSiteId(value)
    const match = siteOptions.find(opt => opt.value === value)
    const nextLabel = match?.label || (value === 'all' ? '전체 현장' : value)
    setSiteFilterLabel(nextLabel)
    try {
      if (value === 'all') {
        localStorage.removeItem('selected_site')
      } else {
        localStorage.setItem('selected_site', JSON.stringify({ id: value, name: nextLabel }))
      }
    } catch {
      /* ignore storage */
    }

    const params = new URLSearchParams(Array.from(searchParams.entries()))
    if (value && value !== 'all') {
      params.set('siteId', value)
    } else {
      params.delete('siteId')
    }
    if (activeTab) params.set('tab', activeTab)
    const query = params.toString()
    router.replace(query ? `/mobile/media?${query}` : '/mobile/media', { scroll: false })
  }

  const handleSelectPeriod = (value: string) => {
    const match = PERIOD_OPTIONS.find(opt => opt.value === value)
    setPeriodValue(value)
    setPeriodFilterLabel(match?.label ?? '전체 기간')
  }

  const buildMarkupUrl = (mode: 'upload' | 'start' | 'resume', docId?: string) => {
    const params = new URLSearchParams()
    params.set('mode', mode)
    if (selectedSiteId && selectedSiteId !== 'all') params.set('siteId', selectedSiteId)
    if (docId) params.set('docId', docId)
    return `/mobile/markup-tool?${params.toString()}`
  }

  const handleOpenMarkup = (mode: 'upload' | 'start' | 'resume', docId?: string) => {
    const url = buildMarkupUrl(mode, docId)
    window.location.href = url
  }

  return (
    <MobileLayoutWithAuth>
      <div className="min-h-screen bg-[#f4f6fb] px-4 py-5 pb-16">
        <div className="mx-auto max-w-[480px] space-y-4 overflow-y-auto pb-6">
          <div className="flex gap-2">
            <CustomSelect
              value={selectedSiteId}
              onValueChange={handleSelectSite}
              disabled={siteLoading}
            >
              <CustomSelectTrigger className="h-11 rounded-[14px] border border-[#dde3f2] bg-white px-3 py-2.5 text-sm font-semibold text-[#485270] shadow-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0 focus:border-[#dde3f2]">
                <CustomSelectValue placeholder="전체 현장">
                  {siteLoading ? '현장 불러오는 중...' : siteFilterLabel}
                </CustomSelectValue>
              </CustomSelectTrigger>
              <CustomSelectContent className="rounded-xl border border-[#dde3f2]">
                {siteOptions.map(opt => (
                  <CustomSelectItem key={opt.value} value={opt.value} className="text-sm">
                    {opt.label}
                  </CustomSelectItem>
                ))}
              </CustomSelectContent>
            </CustomSelect>

            <CustomSelect value={periodValue} onValueChange={handleSelectPeriod}>
              <CustomSelectTrigger className="h-11 rounded-[14px] border border-[#dde3f2] bg-white px-3 py-2.5 text-sm font-semibold text-[#485270] shadow-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0 focus:border-[#dde3f2]">
                <CustomSelectValue placeholder="전체 기간">{periodFilterLabel}</CustomSelectValue>
              </CustomSelectTrigger>
              <CustomSelectContent className="rounded-xl border border-[#dde3f2]">
                {PERIOD_OPTIONS.map(opt => (
                  <CustomSelectItem key={opt.value} value={opt.value} className="text-sm">
                    {opt.label}
                  </CustomSelectItem>
                ))}
              </CustomSelectContent>
            </CustomSelect>

            <CustomSelect
              value={worklogStatusFilter}
              onValueChange={v => setWorklogStatusFilter(v as any)}
            >
              <CustomSelectTrigger className="h-11 rounded-[14px] border border-[#dde3f2] bg-white px-3 py-2.5 text-sm font-semibold text-[#485270] shadow-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0 focus:border-[#dde3f2]">
                <CustomSelectValue placeholder="작업일지 상태">
                  {worklogStatusFilter === 'all'
                    ? '전체'
                    : worklogStatusFilter === 'draft'
                      ? '임시'
                      : worklogStatusFilter === 'submitted'
                        ? '제출'
                        : '승인'}
                </CustomSelectValue>
              </CustomSelectTrigger>
              <CustomSelectContent className="rounded-xl border border-[#dde3f2]">
                <CustomSelectItem value="all" className="text-sm">
                  전체
                </CustomSelectItem>
                <CustomSelectItem value="draft" className="text-sm">
                  임시
                </CustomSelectItem>
                <CustomSelectItem value="submitted" className="text-sm">
                  제출
                </CustomSelectItem>
                <CustomSelectItem value="approved" className="text-sm">
                  승인
                </CustomSelectItem>
              </CustomSelectContent>
            </CustomSelect>
          </div>
          {siteError ? <p className="text-xs text-red-500">{siteError}</p> : null}

          <div className="flex border-b border-[#e3e7f2]">
            <TabButton active={activeTab === 'photo'} onClick={() => handleTabChange('photo')}>
              사진
            </TabButton>
            <TabButton active={activeTab === 'drawing'} onClick={() => handleTabChange('drawing')}>
              도면
            </TabButton>
          </div>

          {activeTab === 'photo' ? (
            <>
              <RecentWorklogsPanel
                worklogs={filteredWorklogs}
                loading={worklogLoading}
                error={worklogError}
                photoCountsByWorklog={photoCountsByWorklog}
                photosByWorklog={photosByWorklog}
                onUploaded={() => setPhotoRefreshKey(prev => prev + 1)}
              />
            </>
          ) : (
            <DrawingTab
              drawingItems={filteredDrawings}
              stats={{
                photos: totalPhotos,
                drawings: filteredDrawings.length,
                linked: totalLinkedWorklogs,
              }}
              onUploadClick={() => handleOpenMarkup('upload')}
              onResumeClick={() => {
                const firstDoc = filteredDrawings[0]
                handleOpenMarkup(firstDoc ? 'resume' : 'upload', firstDoc?.id)
              }}
              onRowAction={item =>
                handleOpenMarkup(
                  item.markupCount && item.markupCount > 0 ? 'resume' : 'start',
                  item.id
                )
              }
              siteLabel={siteFilterLabel}
              siteRequired={selectedSiteId === 'all'}
              loading={drawingLoading}
              error={drawingError}
            />
          )}
        </div>
      </div>
    </MobileLayoutWithAuth>
  )
}

function normalizeUrl(url?: string | null) {
  if (!url) return ''
  try {
    const parsed = new URL(
      url,
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    )
    return parsed.toString()
  } catch {
    return ''
  }
}

function PhotoThumb({ url, name }: { url: string; name: string }) {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const label = name?.trim() || '사진'
  const initials = label.slice(0, 2)
  const safeUrl = normalizeUrl(url)
  const showFallback = error || !safeUrl

  return (
    <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-[#e0e6f3] bg-gradient-to-br from-[#eef4ff] to-[#f9fbff]">
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold text-[#4c5a80]">
        <svg className="h-4 w-4 stroke-[#9aa4c5]" viewBox="0 0 24 24">
          <rect x="4" y="7" width="16" height="11" rx="2" ry="2" fill="none" strokeWidth="1.5" />
          <circle cx="12" cy="12.5" r="3" fill="none" strokeWidth="1.5" />
          <path d="M9 7l1-2h4l1 2" fill="none" strokeWidth="1.5" />
        </svg>
        <span className="leading-none">{initials}</span>
      </div>
      {!showFallback && (
        <Image
          src={safeUrl}
          alt={name}
          width={64}
          height={64}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity ${loaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
    </div>
  )
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex-1 py-2.5 text-sm font-semibold ${
        active ? 'text-[#31a3fa]' : 'text-[#7f8ba7]'
      }`}
    >
      {children}
      <span
        className={`absolute inset-x-0 -bottom-[1px] h-0.5 ${
          active ? 'bg-[#31a3fa]' : 'bg-transparent'
        }`}
      />
    </button>
  )
}

function DrawingTab({
  drawingItems,
  stats,
  onUploadClick,
  onResumeClick,
  onRowAction,
  siteLabel,
  siteRequired,
  loading,
  error,
}: {
  drawingItems: DrawingItem[]
  stats: { photos: number; drawings: number; linked: number }
  onUploadClick: () => void
  onResumeClick: () => void
  onRowAction: (item: DrawingItem) => void
  siteLabel: string
  siteRequired: boolean
  loading?: boolean
  error?: string | null
}) {
  return (
    <div className="space-y-3">
      <section className="rounded-2xl border border-[#e0e6f3] bg-white p-4 shadow-[0_6px_20px_rgba(16,36,94,0.08)]">
        <div className="mb-3">
          <h2 className="text-[15px] font-bold text-[#1f2942]">도면 마킹 관리</h2>
          <p className="mt-1 text-xs text-[#99a4c3]">
            도면파일을 업로드하고, 보수위치를 마킹하여 작업일지와 연결합니다.
          </p>
          {!siteRequired && (
            <p className="mt-1 text-[11px] text-[#7a86a5]">선택된 현장: {siteLabel}</p>
          )}
        </div>

        <div className="mb-2 flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-xl border border-[#d2ddf4] bg-[#f5f7fe] px-4 py-2.5 text-sm font-semibold text-[#111f4d] hover:bg-[#e9edfd]"
            onClick={onUploadClick}
            disabled={siteRequired}
          >
            새 도면 업로드
          </button>
          <button
            type="button"
            className="flex-1 rounded-xl bg-[#111f4d] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_14px_rgba(8,29,96,0.35)] hover:bg-[#0c1740]"
            onClick={onResumeClick}
            disabled={siteRequired}
          >
            마킹 이어하기
          </button>
        </div>

        {loading ? (
          <p className="mt-3 text-sm text-[#7f8ba7]">도면을 불러오는 중...</p>
        ) : error ? (
          <p className="mt-3 text-sm text-red-500">{error}</p>
        ) : drawingItems.length === 0 ? (
          <p className="mt-3 text-sm text-[#7f8ba7]">
            {siteRequired
              ? '현장을 선택하면 도면 목록이 표시됩니다.'
              : '도면이 없습니다. 업로드해 시작하세요.'}
          </p>
        ) : (
          <div className="mt-2 divide-y divide-[#eef1f8]">
            {drawingItems.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-[#222b45]">{item.title}</div>
                  <div className="text-[11px] text-[#9aa4c5]">
                    {item.status} · 작업일지 {item.worklogCount}건
                  </div>
                  {item.linkedWorklogs && item.linkedWorklogs.length > 0 && (
                    <div className="text-[11px] text-[#b0bad5]">
                      연결 ID: {item.linkedWorklogs.slice(0, 2).join(', ')}
                      {item.linkedWorklogs.length > 2
                        ? ` 외 ${item.linkedWorklogs.length - 2}건`
                        : ''}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className={`rounded-full border border-[#dde3f2] px-4 py-1.5 text-xs font-semibold ${
                    item.accent
                      ? 'bg-[#31a3fa] text-white shadow-[0_4px_10px_rgba(49,163,250,0.3)]'
                      : 'bg-[#f7f9ff] text-[#4c5a80]'
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                  onClick={() => onRowAction(item)}
                  disabled={siteRequired}
                >
                  {item.ctaLabel}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-3 gap-2">
        <StatCard label="사진 수" value={stats.photos} />
        <StatCard label="도면 수" value={stats.drawings} />
        <StatCard label="연결된 작업일지" value={stats.linked} />
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[14px] border border-[#e0e6f3] bg-white px-2 py-3 text-center text-[11px] text-[#7a86a5] shadow-[0_4px_12px_rgba(16,36,94,0.06)]">
      <div className="text-lg font-bold text-[#111f4d]">{value}</div>
      <div>{label}</div>
    </div>
  )
}

function RecentWorklogsPanel({
  worklogs,
  loading,
  error,
  photoCountsByWorklog,
  photosByWorklog,
  onUploaded,
}: {
  worklogs: WorklogItem[]
  loading?: boolean
  error?: string | null
  photoCountsByWorklog: Map<string, { before: number; after: number }>
  photosByWorklog: Map<string, WorklogPhotos>
  onUploaded: () => void
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const toggle = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="mt-2 space-y-3">
      {loading ? (
        <p className="text-sm text-[#7f8ba7]">불러오는 중...</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : worklogs.length === 0 ? (
        <p className="text-sm text-[#7f8ba7]">표시할 작업일지가 없습니다.</p>
      ) : (
        worklogs.map(log => {
          const counts = log.id ? photoCountsByWorklog.get(log.id) : undefined
          const photoSet = log.id ? photosByWorklog.get(log.id) : undefined
          const isExpanded = log.id ? expandedIds.has(log.id) : false
          return (
            <div
              key={log.id}
              className="rounded-2xl border border-[#e0e6f3] bg-white px-3 py-3 shadow-[0_2px_10px_rgba(16,36,94,0.08)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[#7f8ba7]">
                    {log.workDate || '-'} · {log.siteName || '미지정'}
                  </div>
                  <div className="truncate text-sm font-semibold text-[#1f2942]">
                    {log.workDescription || '작업내역 미기재'}
                  </div>
                  {log.authorName && (
                    <div className="text-[11px] text-[#9aa4c5]">작성자: {log.authorName}</div>
                  )}
                  {log.locationLabel && (
                    <div className="text-[11px] text-[#9aa4c5]">작업공간: {log.locationLabel}</div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                    <span className="rounded-lg bg-[#eef4ff] px-2 py-1 text-[#3b5ccc]">
                      보수 전 {counts?.before ?? 0}장
                    </span>
                    <span className="rounded-lg bg-[#f2fbf3] px-2 py-1 text-[#2f8f46]">
                      보수 후 {counts?.after ?? 0}장
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={log.status} />
                  {log.id && (
                    <button
                      type="button"
                      onClick={() => toggle(log.id!)}
                      className="text-xs font-semibold text-[#31a3fa] hover:text-[#1f8edc]"
                    >
                      {isExpanded ? '접기' : '사진 업로드 열기'}
                    </button>
                  )}
                </div>
              </div>
              {log.id && isExpanded && (
                <div className="mt-2">
                  <PhotoUploadInline worklogId={log.id} onUploaded={onUploaded} photos={photoSet} />
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

function PhotoUploadInline({
  worklogId,
  photos,
  onUploaded,
}: {
  worklogId: string
  photos?: WorklogPhotos
  onUploaded: () => void
}) {
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ url: string; name: string }>({ url: '', name: '' })
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const beforeList = photos?.before || []
  const afterList = photos?.after || []
  const beforeCount = beforeList.length
  const afterCount = afterList.length
  const MAX_PER_TYPE = 30

  const handleDelete = async (photoId: string) => {
    if (!photoId) return
    if (typeof window !== 'undefined' && !window.confirm('이 사진을 삭제하시겠습니까?')) return
    setWorkingId(photoId)
    try {
      const res = await fetch(`/api/mobile/media/photos/${encodeURIComponent(photoId)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || `삭제 실패 (${res.status})`)
      onUploaded()
    } catch (err) {
      console.error('[media] delete error', err)
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다.')
    } finally {
      setWorkingId(null)
    }
  }

  const handleMove = async (photoId: string, targetType: 'before' | 'after') => {
    if (!photoId) return
    setWorkingId(photoId)
    try {
      const res = await fetch(`/api/mobile/media/photos/${encodeURIComponent(photoId)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_type: targetType }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || `이동 실패 (${res.status})`)
      onUploaded()
    } catch (err) {
      console.error('[media] move error', err)
      alert(err instanceof Error ? err.message : '이동에 실패했습니다.')
    } finally {
      setWorkingId(null)
    }
  }

  const renderPreview = (items: PhotoItem[], currentType: 'before' | 'after') => {
    if (!items.length) return <span className="text-[11px] text-[#9aa4c5]">미리보기 없음</span>
    return (
      <div className="grid grid-cols-2 gap-2">
        {items.map(item => {
          const src = normalizeUrl(item.url)
          return (
            <div
              key={item.id}
              className="relative h-16 w-16 overflow-hidden rounded-lg border border-[#e0e6f3] bg-[#f7f9ff]"
              onClick={() => {
                if (src) {
                  setPreview({ url: src, name: item.name })
                  setIsPreviewOpen(true)
                }
              }}
            >
              {src ? (
                <Image
                  src={src}
                  alt={item.name}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] text-[#9aa4c5]">
                  N/A
                </div>
              )}
              <div className="absolute top-1 right-1 flex flex-col gap-1">
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation()
                    handleDelete(item.id)
                  }}
                  disabled={workingId === item.id}
                  className="flex h-4 w-4 items-center justify-center rounded-md border border-[#f1d5d5] bg-[#fff5f5] text-[#d14343] shadow-[0_1px_3px_rgba(0,0,0,0.1)] disabled:opacity-60"
                  aria-label="삭제"
                >
                  {workingId === item.id ? (
                    <span className="text-[9px]">…</span>
                  ) : (
                    <svg
                      className="h-2.5 w-2.5"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      fill="none"
                      strokeWidth="2"
                    >
                      <path d="M6 6l12 12M6 18L18 6" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation()
                    handleMove(item.id, currentType === 'before' ? 'after' : 'before')
                  }}
                  disabled={workingId === item.id}
                  className="flex h-4 w-4 items-center justify-center rounded-md border border-[#d8e4ff] bg-[#f4f7ff] text-[#2f6fda] shadow-[0_1px_3px_rgba(0,0,0,0.1)] disabled:opacity-60"
                  aria-label={currentType === 'before' ? '보수 후로 이동' : '보수 전으로 이동'}
                >
                  {currentType === 'before' ? (
                    <svg
                      className="h-2.5 w-2.5"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      fill="none"
                      strokeWidth="2"
                    >
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                  ) : (
                    <svg
                      className="h-2.5 w-2.5"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      fill="none"
                      strokeWidth="2"
                    >
                      <path d="M15 5l-7 7 7 7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <section className="space-y-2 rounded-xl border border-[#d5def3] bg-white p-3">
        <div className="text-xs font-semibold text-[#1f2942]">사진 업로드</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-[#1f2942]">보수 전</div>
            <InlineDropzone
              label="보수 전"
              worklogId={worklogId}
              photoType="before"
              currentCount={beforeCount}
              maxCount={MAX_PER_TYPE}
              onUploaded={onUploaded}
            />
          </div>
          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-[#1f2942]">보수 후</div>
            <InlineDropzone
              label="보수 후"
              worklogId={worklogId}
              photoType="after"
              currentCount={afterCount}
              maxCount={MAX_PER_TYPE}
              onUploaded={onUploaded}
            />
          </div>
        </div>
      </section>

      <section className="space-y-2 rounded-xl border border-[#d5def3] bg-white p-3">
        <div className="text-xs font-semibold text-[#1f2942]">업로드 된 사진</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-[#e0e6f3] bg-[#f9fbff] p-2">
            <div className="mb-1 text-[11px] font-semibold text-[#1f2942]">보수 전</div>
            {renderPreview(beforeList, 'before')}
          </div>
          <div className="rounded-lg border border-[#e0e6f3] bg-[#f9fbff] p-2">
            <div className="mb-1 text-[11px] font-semibold text-[#1f2942]">보수 후</div>
            {renderPreview(afterList, 'after')}
          </div>
        </div>
      </section>

      {isPreviewOpen && preview?.url && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-white p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold text-[#1f2942] truncate">
                {preview.name || '사진'}
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="rounded-lg bg-[#f4f7ff] px-3 py-1 text-[12px] font-semibold text-[#1f2942]"
                aria-label="닫기"
              >
                닫기
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-[#e0e6f3] bg-[#f9fbff]">
              <Image
                src={preview.url}
                alt={preview.name}
                width={1200}
                height={900}
                className="h-[50vh] w-full object-contain bg-black/5"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InlineDropzone({
  label,
  worklogId,
  photoType,
  currentCount,
  maxCount,
  onUploaded,
}: {
  label: string
  worklogId: string
  photoType: 'before' | 'after'
  currentCount: number
  maxCount: number
  onUploaded: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return
    if (!worklogId) return
    const available = maxCount - currentCount
    if (available <= 0) {
      setError(`최대 ${maxCount}장까지 업로드할 수 있습니다.`)
      event.target.value = ''
      return
    }
    const slice = files.slice(0, available)
    if (slice.length === 0) {
      event.target.value = ''
      return
    }
    setError(null)
    setUploading(true)
    setSuccess(false)

    const form = new FormData()
    slice.forEach(file => {
      if (photoType === 'before') {
        form.append('before_photos', file)
      } else {
        form.append('after_photos', file)
      }
    })

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    fetch(`/api/mobile/daily-reports/${encodeURIComponent(worklogId)}/additional-photos`, {
      method: 'POST',
      body: form,
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async res => {
        const json = await res.json().catch(() => ({}))
        if (!res.ok || !json?.success) {
          throw new Error(json?.error || `업로드 실패 (${res.status})`)
        }
        setSuccess(true)
        onUploaded()
      })
      .catch(err => {
        if (err?.name === 'AbortError') {
          setError('업로드가 지연되어 취소되었습니다. 다시 시도해주세요.')
        } else {
          setError(err?.message || '업로드에 실패했습니다.')
        }
      })
      .finally(() => {
        clearTimeout(timeout)
        setUploading(false)
        event.target.value = ''
        setTimeout(() => setSuccess(false), 2000)
      })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      className="flex h-24 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#d5def3] bg-white text-xs font-semibold text-[#4c5a80] shadow-sm transition-colors hover:bg-[#f4f7ff]"
    >
      <svg className="h-6 w-6 stroke-[#b4bfdc]" viewBox="0 0 24 24">
        <rect x="4" y="7" width="16" height="11" rx="2" ry="2" fill="none" strokeWidth="1.5" />
        <circle cx="12" cy="12.5" r="3" fill="none" strokeWidth="1.5" />
        <path d="M9 7l1-2h4l1 2" fill="none" strokeWidth="1.5" />
      </svg>
      {uploading && <span className="text-[10px] font-normal text-[#31a3fa]">업로드 중...</span>}
      {success && <span className="text-[10px] font-normal text-[#2f8f46]">완료</span>}
      {error && <span className="text-[10px] font-normal text-red-500">{error}</span>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
    </button>
  )
}

function StatusBadge({ status }: { status?: string | null }) {
  const normalize = (s?: string | null) => {
    const val = (s || '').toLowerCase()
    if (val === 'draft' || val === 'pending') return 'draft'
    if (val === 'submitted' || val === 'completed') return 'submitted'
    if (val === 'approved') return 'approved'
    return 'draft'
  }
  const key = normalize(status)
  const label =
    key === 'draft' ? '임시' : key === 'submitted' ? '제출' : key === 'approved' ? '승인' : '임시'
  const theme: Record<string, { bg: string; text: string; border: string }> = {
    draft: { bg: '#f7f7fb', text: '#6b7280', border: '#e5e7eb' },
    submitted: { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    approved: { bg: '#ecfdf3', text: '#15803d', border: '#bbf7d0' },
  }
  const t = theme[key] || theme.draft
  return (
    <span
      className="whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-semibold"
      style={{ background: t.bg, color: t.text, border: `1px solid ${t.border}` }}
    >
      {label}
    </span>
  )
}
