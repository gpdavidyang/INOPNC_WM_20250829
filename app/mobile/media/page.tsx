'use client'

import { SharedMarkupEditor } from '@/components/markup/SharedMarkupEditor'
import { renderMarkupSnapshotDataUrl } from '@/components/markup/utils/snapshot'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { useUnifiedAuth } from '@/hooks/use-unified-auth'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'
import { DrawingBrowser } from '@/modules/mobile/components/markup/DrawingBrowser'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

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
  memberTypes: string[]
  workProcesses: string[]
  workTypes: string[]
}

interface LinkedDrawingRecord {
  id: string
  title: string
  url: string
  previewUrl?: string | null
  source: 'markup' | 'shared'
  markupId?: string
  createdAt?: string | null
}

interface PendingMarkupItem {
  id: string
  title: string
  previewUrl?: string | null
  sourceUrl?: string | null
  createdAt?: string | null
  markupCount?: number
}

type WorklogMetaKey = 'memberTypes' | 'workProcesses' | 'workTypes'

const parseJsonRecord = (input: unknown): Record<string, any> => {
  if (!input) return {}
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input)
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, any>) : {}
    } catch {
      return {}
    }
  }
  if (typeof input === 'object') return input as Record<string, any>
  return {}
}

const ensureStringArray = (input: unknown): string[] => {
  if (!Array.isArray(input)) return []
  return input
    .map(item => {
      if (typeof item === 'string') return item.trim()
      if (typeof item === 'number' || typeof item === 'boolean') return String(item).trim()
      if (item && typeof item === 'object') {
        if (typeof (item as any).name === 'string') return (item as any).name.trim()
        if (typeof (item as any).label === 'string') return (item as any).label.trim()
        if (typeof (item as any).value === 'string') return (item as any).value.trim()
      }
      return ''
    })
    .filter(Boolean)
}

const dedupeStrings = (values: string[]): string[] => {
  const seen = new Set<string>()
  const result: string[] = []
  values.forEach(value => {
    const trimmed = value.trim()
    if (!trimmed || seen.has(trimmed)) return
    seen.add(trimmed)
    result.push(trimmed)
  })
  return result
}

const extractWorklogMeta = (report: any) => {
  const workContent = parseJsonRecord(report?.work_content)
  const noteData = parseJsonRecord(report?.additional_notes)
  const tasks = Array.isArray(workContent?.tasks) ? workContent.tasks : []
  const fromTasks = (key: WorklogMetaKey) =>
    tasks.flatMap((task: any) => ensureStringArray(task?.[key]))

  const memberCandidates = [
    ...ensureStringArray(workContent?.memberTypes),
    ...ensureStringArray(noteData?.memberTypes),
    ...fromTasks('memberTypes'),
  ]
  if (memberCandidates.length === 0) {
    ;[report?.component_name, report?.member_name].forEach(value => {
      if (typeof value === 'string' && value.trim()) memberCandidates.push(value.trim())
    })
  }

  const processCandidates = [
    ...ensureStringArray(workContent?.workProcesses),
    ...ensureStringArray(noteData?.workContents),
    ...fromTasks('workProcesses'),
  ]
  if (processCandidates.length === 0) {
    ;[report?.process_type, report?.work_process].forEach(value => {
      if (typeof value === 'string' && value.trim()) processCandidates.push(value.trim())
    })
  }

  const typeCandidates = [
    ...ensureStringArray(workContent?.workTypes),
    ...ensureStringArray(noteData?.workTypes),
    ...fromTasks('workTypes'),
  ]
  if (typeCandidates.length === 0) {
    const fallback = typeof report?.work_section === 'string' ? report.work_section : null
    if (fallback && fallback.trim()) typeCandidates.push(fallback.trim())
  }

  return {
    memberTypes: dedupeStrings(memberCandidates),
    workProcesses: dedupeStrings(processCandidates),
    workTypes: dedupeStrings(typeCandidates),
  }
}

const mapDailyReportToWorklogItem = (report: any): WorklogItem => {
  const meta = extractWorklogMeta(report)
  const location =
    report?.location_info ||
    report?.location ||
    (report?.work_content && report.work_content.location_info)
  const locLabel = location ? [location.block, location.dong, location.unit].filter(Boolean) : []
  const id = report?.id ? String(report.id) : ''
  const siteIdRaw = report?.site_id || report?.siteId || report?.sites?.id
  const siteId = siteIdRaw ? String(siteIdRaw) : null
  return {
    id,
    workDate: report?.work_date || report?.workDate || null,
    siteId,
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
    locationLabel: locLabel.length ? locLabel.join(' ') : null,
    status: report?.status || null,
    memberTypes: meta.memberTypes,
    workProcesses: meta.workProcesses,
    workTypes: meta.workTypes,
  }
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
  const deepLinkWorklogId = searchParams.get('worklogId')
  const consumeDeepLink = () => {
    if (!deepLinkWorklogId) return
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    params.delete('worklogId')
    const query = params.toString()
    router.replace(query ? `/mobile/media?${query}` : '/mobile/media', { scroll: false })
  }

  const [activeTab, setActiveTab] = useState<MediaTab>(initialTab)
  const [siteFilterLabel, setSiteFilterLabel] = useState('전체 현장')
  const [periodFilterLabel, setPeriodFilterLabel] = useState(
    deepLinkWorklogId ? '전체 기간' : '최근 7일'
  )
  const [periodValue, setPeriodValue] = useState(deepLinkWorklogId ? 'all' : '7d')
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
    'all' | 'draft' | 'submitted' | 'approved' | 'rejected'
  >('all')
  const [worklogs, setWorklogs] = useState<WorklogItem[]>([])
  const [worklogLoading, setWorklogLoading] = useState(false)
  const [worklogError, setWorklogError] = useState<string | null>(null)
  const [drawingCountsByWorklog, setDrawingCountsByWorklog] = useState<Map<string, number>>(
    () => new Map()
  )
  const [stats, setStats] = useState<{
    photoCount: number
    drawingCount: number
    linkedWorklogCount: number
  }>({ photoCount: 0, drawingCount: 0, linkedWorklogCount: 0 })
  const [statsLoading, setStatsLoading] = useState(false)
  const { user, profile } = useUnifiedAuth()

  // 마킹 도구 오버레이 상태
  const [markupEditor, setMarkupEditor] = useState<{
    open: boolean
    mode: 'upload' | 'start' | 'resume'
    docId?: string
    worklogId?: string
    showBrowser: boolean
    drawingFile: any | null
    markupDocument: any | null
  }>({
    open: false,
    mode: 'start',
    showBrowser: false,
    drawingFile: null,
    markupDocument: null,
  })
  const markupObjectUrlRef = useRef<string | null>(null)

  // 통합 뷰어 상태
  const [drawingViewer, setDrawingViewer] = useState<{
    open: boolean
    url: string
    title: string
  }>({
    open: false,
    url: '',
    title: '',
  })

  const handleOpenViewer = (url: string, title?: string) => {
    setDrawingViewer({
      open: true,
      url,
      title: title || '도면 보기',
    })
  }
  const [drawingRefreshToken, setDrawingRefreshToken] = useState(0)
  const autoSiteSet = useRef(false)

  const matchPeriod = useMemo(() => {
    return (dateStr?: string | null) => {
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
  }, [periodValue])

  const matchStatus = useMemo(() => {
    return (status?: string | null) => {
      if (worklogStatusFilter === 'all') return true
      if (!status) return false
      const s = status.toLowerCase()
      if (worklogStatusFilter === 'draft') return s === 'draft' || s === 'pending'
      if (worklogStatusFilter === 'submitted') return s === 'submitted' || s === 'completed'
      if (worklogStatusFilter === 'approved') return s === 'approved'
      if (worklogStatusFilter === 'rejected') return s === 'rejected'
      return false
    }
  }, [worklogStatusFilter])

  const filteredWorklogs = useMemo(() => {
    return worklogs.filter(w => matchStatus(w.status) && matchPeriod(w.workDate))
  }, [worklogs, matchStatus, matchPeriod])

  const filteredWorklogIds = useMemo(
    () => filteredWorklogs.map(w => w.id).filter((id): id is string => Boolean(id)),
    [filteredWorklogs]
  )

  const filteredWorklogIdsKey = useMemo(() => filteredWorklogIds.join(','), [filteredWorklogIds])

  const filteredPhotos = useMemo(() => {
    const allowedWorklogs = new Set(filteredWorklogIds)
    return photoItems.filter(item => {
      const worklogId = item.worklogId ? String(item.worklogId) : ''
      if (!worklogId || !allowedWorklogs.has(worklogId)) return false
      // Prefer uploadedAt so newly added photos on 오래된 작업일지도 보인다
      const targetDate = item.uploadedAt || item.workDate
      return matchPeriod(targetDate) && matchStatus(item.status)
    })
  }, [photoItems, filteredWorklogIdsKey, matchPeriod, matchStatus])

  const [photoTotalsByWorklog, setPhotoTotalsByWorklog] = useState<Map<string, number>>(
    () => new Map()
  )

  useEffect(() => {
    if (filteredWorklogIds.length === 0) {
      setPhotoTotalsByWorklog(new Map())
      return
    }

    let cancelled = false
    const controller = new AbortController()

    const load = async () => {
      const ids = filteredWorklogIds
      const settled = await Promise.allSettled(
        ids.map(async worklogId => {
          const params = new URLSearchParams()
          params.set('worklog_id', worklogId)
          params.set('limit', '1')
          const res = await fetch(`/api/mobile/media/photos?${params.toString()}`, {
            cache: 'no-store',
            signal: controller.signal,
          })
          const json = await res.json().catch(() => ({}))
          const total =
            typeof json?.data?.total === 'number'
              ? json.data.total
              : Array.isArray(json?.data?.photos)
                ? json.data.photos.length
                : 0
          return Number.isFinite(total) ? total : 0
        })
      )

      if (cancelled) return

      const next = new Map<string, number>()
      settled.forEach((result, idx) => {
        const id = ids[idx]
        if (!id) return
        next.set(id, result.status === 'fulfilled' ? result.value : 0)
      })
      setPhotoTotalsByWorklog(next)
    }

    void load()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [filteredWorklogIdsKey])

  const totalPhotos = stats.photoCount

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

  const totalDrawings = stats.drawingCount

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

  const totalLinkedWorklogs = stats.linkedWorklogCount

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

        if (periodValue !== 'all') {
          const days = parseInt(periodValue)
          const date = new Date()
          date.setDate(date.getDate() - days)
          params.set('start_date', date.toISOString().split('T')[0])
        }
        if (worklogStatusFilter !== 'all') {
          params.set('status', worklogStatusFilter)
        }

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
  }, [selectedSiteId, photoRefreshKey, periodValue, worklogStatusFilter])

  useEffect(() => {
    let isActive = true
    const controller = new AbortController()
    const fetchWorklogs = async () => {
      setWorklogLoading(true)
      setWorklogError(null)
      try {
        const params = new URLSearchParams()
        params.set('limit', '50')
        params.set('page', '1')
        if (selectedSiteId && selectedSiteId !== 'all') params.set('site_id', selectedSiteId)

        if (periodValue !== 'all') {
          const days = parseInt(periodValue)
          const date = new Date()
          date.setDate(date.getDate() - days)
          params.set('start_date', date.toISOString().split('T')[0])
        }
        if (worklogStatusFilter !== 'all') {
          params.set('status', worklogStatusFilter)
        }

        const res = await fetch(`/api/mobile/daily-reports?${params.toString()}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`작업일지 조회 실패(${res.status})`)
        const json = await res.json()
        const reports: any[] = json?.data?.reports || []
        const mapped: WorklogItem[] = reports.map(mapDailyReportToWorklogItem)
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
  }, [selectedSiteId, periodValue, worklogStatusFilter])

  useEffect(() => {
    if (!deepLinkWorklogId) return
    if (worklogs.some(w => w.id === deepLinkWorklogId)) return

    let isActive = true
    const controller = new AbortController()

    const fetchTarget = async () => {
      try {
        const res = await fetch(
          `/api/mobile/daily-reports/${encodeURIComponent(deepLinkWorklogId)}`,
          {
            cache: 'no-store',
            signal: controller.signal,
          }
        )
        const json = await res.json().catch(() => ({}))
        if (!isActive) return
        if (!res.ok || json?.error) return

        const report = json?.data
        if (!report?.id) return
        const mapped = mapDailyReportToWorklogItem(report)
        if (!mapped?.id) return

        setWorklogs(prev => (prev.some(w => w.id === mapped.id) ? prev : [mapped, ...prev]))
      } catch (err) {
        if (!isActive) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        console.warn('[media] deeplink worklog fetch skipped:', err)
      }
    }

    void fetchTarget()
    return () => {
      isActive = false
      controller.abort()
    }
  }, [deepLinkWorklogId, worklogs])

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
    // tab, period, status 등을 유지
    if (activeTab) params.set('tab', activeTab)
    if (periodValue && periodValue !== '7d') params.set('period', periodValue)
    if (worklogStatusFilter && worklogStatusFilter !== 'all')
      params.set('status', worklogStatusFilter)

    const query = params.toString()
    router.replace(query ? `/mobile/media?${query}` : '/mobile/media', { scroll: false })
  }, [
    worklogs,
    selectedSiteId,
    siteOptions,
    searchParams,
    router,
    activeTab,
    periodValue,
    worklogStatusFilter,
  ])

  // 통합 통계 fetching
  useEffect(() => {
    let isActive = true
    const controller = new AbortController()

    const fetchStats = async () => {
      setStatsLoading(true)
      try {
        const params = new URLSearchParams()
        if (selectedSiteId && selectedSiteId !== 'all') params.set('site_id', selectedSiteId)

        if (periodValue !== 'all') {
          const days = parseInt(periodValue)
          const date = new Date()
          date.setDate(date.getDate() - days)
          params.set('start_date', date.toISOString().split('T')[0])
        }
        if (worklogStatusFilter !== 'all') {
          params.set('status', worklogStatusFilter)
        }

        const res = await fetch(`/api/mobile/media/stats?${params.toString()}`, {
          signal: controller.signal,
          cache: 'no-store',
        })
        const json = await res.json()
        if (isActive && json.success) {
          setStats(json.data)
        }
      } catch (err) {
        if (isActive) console.warn('[media] stats fetch failed', err)
      } finally {
        if (isActive) setStatsLoading(false)
      }
    }

    fetchStats()
    return () => {
      isActive = false
      controller.abort()
    }
  }, [selectedSiteId, periodValue, worklogStatusFilter, photoRefreshKey, drawingRefreshToken])

  // 도면 수(업로드 된 도면) 카운트는 "전체 현장"에서도 각 작업일지별로 항상 계산되어야 함.
  useEffect(() => {
    let isActive = true
    const controller = new AbortController()

    const fetchCounts = async () => {
      try {
        if (!filteredWorklogIds.length) {
          setDrawingCountsByWorklog(new Map())
          return
        }

        const params = new URLSearchParams()
        filteredWorklogIds.forEach(id => params.append('worklog_id', id))
        if (selectedSiteId && selectedSiteId !== 'all') {
          params.set('siteId', selectedSiteId)
        }

        const res = await fetch(`/api/mobile/media/drawings/all-counts?${params.toString()}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || json?.success === false) throw new Error(json?.error || '도면 수 조회 실패')

        if (!isActive) return
        const counts = new Map<string, number>()
        Object.entries(json?.data || {}).forEach(([wId, c]) => {
          counts.set(String(wId), typeof c === 'number' ? c : Number(c) || 0)
        })
        setDrawingCountsByWorklog(counts)
      } catch (error) {
        if (!isActive) return
        if (error instanceof DOMException && error.name === 'AbortError') return
        console.warn('[media] drawing count fetch failed', error)
        setDrawingCountsByWorklog(new Map())
      }
    }

    fetchCounts()
    return () => {
      isActive = false
      controller.abort()
    }
  }, [filteredWorklogIdsKey, selectedSiteId, drawingRefreshToken])

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

        setDrawings(mapped)
      } catch (err) {
        if (!isActive) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        console.error('[media] drawing fetch error', err)
        setDrawingError('도면 목록을 불러올 수 없습니다.')
        setDrawingCountsByWorklog(new Map())
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
  }, [selectedSiteId, drawingRefreshToken])

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

  const handleOpenMarkup = (
    mode: 'upload' | 'start' | 'resume',
    docId?: string,
    targetWorklogId?: string,
    directDrawing?: any // Add this to pass drawing data immediately
  ) => {
    const baseEditorState = {
      open: true,
      mode,
      docId: directDrawing && mode === 'start' ? undefined : docId,
      worklogId: targetWorklogId || markupEditor.worklogId,
      showBrowser: mode === 'upload',
      drawingFile: null,
      markupDocument: null,
    }

    if (directDrawing) {
      const directUrl = typeof directDrawing.url === 'string' ? directDrawing.url : ''
      if (directUrl.startsWith('blob:')) {
        markupObjectUrlRef.current = directUrl
      }
      // If we have direct drawing data, set it immediately
      const drawingFile = {
        id: directDrawing.id,
        name: directDrawing.title || directDrawing.name,
        size: 0,
        type: 'image',
        url: directDrawing.url,
        file: directDrawing.file,
        siteId: directDrawing.siteId,
        uploadDate: new Date(),
      }

      const markupDocument = {
        id: directDrawing.id,
        title: directDrawing.title || directDrawing.name,
        original_blueprint_filename: directDrawing.title || directDrawing.name,
        original_blueprint_url: directDrawing.url,
        markup_data: directDrawing.markupData || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setMarkupEditor({
        ...baseEditorState,
        drawingFile,
        markupDocument,
        showBrowser: false,
      })
    } else {
      setMarkupEditor(baseEditorState)
    }
  }

  useEffect(() => {
    if (markupEditor.open) return
    const url = markupObjectUrlRef.current
    if (url && url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url)
      } catch {
        // ignore
      }
    }
    markupObjectUrlRef.current = null
  }, [markupEditor.open])

  // 도면 브라우저에서 도면 선택 시
  const handleDrawingSelect = (drawing: any) => {
    const drawingFile = {
      id: drawing.id,
      name: drawing.name || drawing.title,
      size: drawing.size || 0,
      type: drawing.type || 'image',
      url: drawing.url,
      siteId: drawing.siteId,
      uploadDate: drawing.uploadDate || new Date(),
    }

    const markupDocument = {
      id: drawing.id,
      title: drawing.name || drawing.title,
      original_blueprint_filename: drawing.name || drawing.title,
      original_blueprint_url: drawing.url,
      markup_data: drawing.markupData || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setMarkupEditor(prev => ({
      ...prev,
      drawingFile,
      markupDocument,
      showBrowser: false,
    }))
  }

  // 마킹 저장 로직 (app/mobile/markup-tool/page.tsx 로직 준용)
  const handleMarkupSave = async (doc: any) => {
    const worklogId = markupEditor.worklogId

    try {
      // 1) 서버 저장
      const publish = Boolean(doc?.published)
      const payload = {
        title: (doc?.title || markupEditor.drawingFile?.name || '무제 도면') as string,
        description: doc.description || '',
        markup_data: Array.isArray(doc.markup_data) ? doc.markup_data : [],
        preview_image_url: doc.preview_image_url || undefined,
      }

      let savedId: string | undefined

      const blueprintUrl =
        (markupEditor.drawingFile?.url as string | undefined) ||
        (doc?.original_blueprint_url as string | undefined) ||
        ''
      const previewDataUrl = await renderMarkupSnapshotDataUrl(blueprintUrl, payload.markup_data)
      if (publish && !previewDataUrl && !payload.preview_image_url) {
        throw new Error('진행도면 저장을 위한 미리보기 생성에 실패했습니다.')
      }

      const isUuid = (value?: string | null) =>
        typeof value === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

      const ensureBlueprintUpload = async () => {
        const currentUrl = blueprintUrl
        const blueprintFileName =
          (markupEditor.drawingFile?.name as string | undefined) || 'blueprint.png'
        if (!currentUrl) return { url: '', fileName: blueprintFileName }
        const isEphemeral =
          currentUrl.startsWith('blob:') ||
          currentUrl.startsWith('data:') ||
          currentUrl.startsWith('filesystem:') ||
          currentUrl.startsWith('capacitor:') ||
          currentUrl.startsWith('capacitor-file:')
        if (!isEphemeral) return { url: currentUrl, fileName: blueprintFileName }
        try {
          const sourceFile: File | null =
            markupEditor.drawingFile?.file instanceof File ? markupEditor.drawingFile.file : null
          let uploadFile: File | null = sourceFile
          let safeName = blueprintFileName

          if (!uploadFile && currentUrl.startsWith('data:')) {
            const match = /^data:([^;]+);base64,(.+)$/i.exec(currentUrl)
            if (!match) throw new Error('지원하지 않는 파일 형식입니다.')
            const [, mimeType, base64] = match
            const bin = atob(base64)
            const bytes = new Uint8Array(bin.length)
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
            const inferredType = mimeType || 'image/png'
            const ext = (safeName.split('.').pop() || '').toLowerCase()
            const hasExt = Boolean(ext && ext.length <= 5)
            safeName = hasExt
              ? safeName
              : `blueprint.${(inferredType.split('/')[1] || 'png').split(';')[0]}`
            uploadFile = new File([bytes], safeName, { type: inferredType })
          }

          if (!uploadFile) {
            throw new Error('원본 도면 업로드에 실패했습니다. 파일을 다시 선택해 주세요.')
          }

          const fd = new FormData()
          fd.append('file', uploadFile)
          const uploadRes = await fetch('/api/uploads/preview', { method: 'POST', body: fd })
          const uploadJson = await uploadRes.json().catch(() => ({}))
          if (!uploadRes.ok || !uploadJson?.url) {
            throw new Error(uploadJson?.error || '도면 업로드에 실패했습니다.')
          }
          return { url: uploadJson.url as string, fileName: safeName }
        } catch (err) {
          console.warn('Blueprint upload failed:', err)
          throw err
        }
      }

      if (!markupEditor.drawingFile) {
        throw new Error('마킹할 도면을 먼저 선택해주세요.')
      }

      const ensured = await ensureBlueprintUpload()
      const drawingId = isUuid(markupEditor.drawingFile?.id)
        ? markupEditor.drawingFile.id
        : undefined
      const siteIdForSave =
        selectedSiteId && selectedSiteId !== 'all'
          ? selectedSiteId
          : (markupEditor.drawingFile?.siteId as string | undefined) || undefined
      if (!drawingId && !siteIdForSave) {
        throw new Error('현장을 먼저 선택해주세요.')
      }

      const body = {
        ...(drawingId ? { drawingId } : {}),
        siteId: siteIdForSave,
        original_blueprint_url: ensured.url || blueprintUrl || undefined,
        original_blueprint_filename:
          ensured.fileName || markupEditor.drawingFile?.name || undefined,
        title: payload.title,
        description: payload.description,
        markupData: payload.markup_data,
        preview_image_url: payload.preview_image_url,
        preview_image_data: previewDataUrl,
        published: publish,
        linked_worklog_id: worklogId || undefined,
        linked_worklog_ids: worklogId ? [worklogId] : undefined,
      }

      const res = await fetch('/api/docs/drawings/markups/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok || json?.success === false) throw new Error(json?.error || '마킹 저장 실패')
      savedId = json?.data?.markup?.id

      // 2) 작업일지 연동 (필요한 경우)
      if (worklogId && savedId) {
        const res = await fetch(`/api/markup-documents/${savedId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ linked_worklog_ids: [worklogId] }),
        })
        if (!res.ok) console.warn('작업일지 연동 실패')
      }

      toast.success(publish ? '진행도면으로 저장했습니다.' : '마킹을 저장했습니다.')

      // 갱신 및 닫기
      setMarkupEditor(prev => ({ ...prev, open: false }))
      onRefreshAll() // 전체 데이터 새로고침
    } catch (error) {
      console.error('Save error:', error)
      if (
        error instanceof TypeError &&
        typeof error.message === 'string' &&
        error.message.toLowerCase().includes('failed to fetch')
      ) {
        toast.error(
          '브라우저 보안 정책으로 원본 도면 업로드에 실패했습니다. 파일을 다시 선택해 주세요.'
        )
        return
      }
      toast.error(error instanceof Error ? error.message : '저장에 실패했습니다.')
    }
  }

  const onRefreshAll = () => {
    setPhotoRefreshKey(prev => prev + 1)
    setDrawingRefreshToken(prev => prev + 1)
  }

  // Resume/Start 모드 시 기존 문서 프리로드
  useEffect(() => {
    if (!markupEditor.open || !markupEditor.docId) return

    const preload = async () => {
      try {
        const res = await fetch(`/api/markup-documents/${markupEditor.docId}`, {
          cache: 'no-store',
        })
        if (res.ok) {
          const json = await res.json()
          const doc = json?.data
          if (doc) {
            handleDrawingSelect({
              id: doc.id,
              title: doc.title,
              name: doc.original_blueprint_filename || doc.title,
              url: doc.file_url || doc.original_blueprint_url,
              markupData: doc.markup_data || [],
            })
          }
        }
      } catch (error) {
        console.warn('Preload failed:', error)
      }
    }

    if (markupEditor.mode === 'resume' || (markupEditor.mode === 'start' && markupEditor.docId)) {
      preload()
    }
  }, [markupEditor.open, markupEditor.docId, markupEditor.mode])

  return (
    <>
      {/* 통합 뷰어 오버레이 (최상단 레이어) */}
      {drawingViewer.open && (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-black bg-opacity-95 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-between border-b border-white border-opacity-10 bg-black px-4 py-3 text-white">
            <button
              type="button"
              onClick={() => setDrawingViewer(prev => ({ ...prev, open: false }))}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-bold text-white active:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
              닫기
            </button>
            <div className="max-w-[200px] truncate text-center text-sm font-bold">
              {drawingViewer.title}
            </div>
            <div className="w-12" />
          </div>
          <div className="relative flex-1 overflow-auto bg-black flex items-center justify-center">
            {drawingViewer.url.toLowerCase().endsWith('.pdf') ? (
              <iframe
                src={drawingViewer.url}
                className="h-full w-full border-none"
                title="PDF Viewer"
              />
            ) : (
              <img
                src={drawingViewer.url}
                alt={drawingViewer.title}
                className="max-h-full max-w-full object-contain"
              />
            )}
          </div>
        </div>
      )}

      {/* 도면 마킹 도구 오버레이 (최상단 레이어) */}
      {markupEditor.open && (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-white pt-[env(safe-area-inset-top)]">
          <div className="flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
            <button
              type="button"
              onClick={() => setMarkupEditor(prev => ({ ...prev, open: false }))}
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-bold text-[#6b7280] active:bg-gray-200"
            >
              <ArrowLeft className="h-4 w-4" />
              뒤로
            </button>
            <h2 className="text-sm font-bold text-[#1f2942]">
              {markupEditor.showBrowser ? '도면 선택' : '도면 마킹 작업'}
            </h2>
            <div className="w-12" />
          </div>

          <div className="flex-1 overflow-hidden bg-[#f8f9fc]">
            {markupEditor.showBrowser ? (
              <DrawingBrowser
                selectedSite={selectedSiteId === 'all' ? undefined : selectedSiteId}
                userId={user?.id || ''}
                onDrawingSelect={handleDrawingSelect}
                initialMode={markupEditor.mode === 'upload' ? 'upload' : 'browse'}
              />
            ) : markupEditor.markupDocument ? (
              <div className="h-full">
                <SharedMarkupEditor
                  profile={profile}
                  mode="worker"
                  initialDocument={markupEditor.markupDocument}
                  onSave={handleMarkupSave}
                  onClose={() => setMarkupEditor(prev => ({ ...prev, open: false }))}
                  embedded={true}
                  savePrompt="save-as"
                />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center p-10 text-center">
                <div className="space-y-6">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                    <svg
                      className="h-10 w-10"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-[#1f2942]">마킹할 도면을 선택해주세요</h3>
                    <p className="text-sm text-[#9aa4c5]">
                      저장된 도면을 불러와서 치수 측정을 시작합니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMarkupEditor(prev => ({ ...prev, showBrowser: true }))}
                    className="w-full rounded-xl bg-[#31a3fa] py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 active:scale-[0.98]"
                  >
                    도면 불러오기
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
                          : worklogStatusFilter === 'approved'
                            ? '승인'
                            : '반려'}
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
                  <CustomSelectItem value="rejected" className="text-sm">
                    반려
                  </CustomSelectItem>
                </CustomSelectContent>
              </CustomSelect>
            </div>
            {siteError ? <p className="text-xs text-red-500">{siteError}</p> : null}

            <div className="flex border-b border-[#e3e7f2]">
              <TabButton active={activeTab === 'photo'} onClick={() => handleTabChange('photo')}>
                사진
              </TabButton>
              <TabButton
                active={activeTab === 'drawing'}
                onClick={() => handleTabChange('drawing')}
              >
                도면
              </TabButton>
            </div>

            {activeTab === 'photo' ? (
              <>
                <div className="space-y-3">
                  <section className="rounded-2xl border border-[#e0e6f3] bg-white p-4 shadow-[0_6px_20px_rgba(16,36,94,0.08)]">
                    <div className="mb-4">
                      <h2 className="text-[15px] font-bold text-[#1f2942]">사진 업로드 & 보기</h2>
                      <p className="mt-1 text-xs text-[#99a4c3]">
                        작업일지를 선택해 보수 전/후 사진을 업로드하고 확인하세요.
                      </p>
                      {selectedSiteId && selectedSiteId !== 'all' ? (
                        <p className="mt-1 text-[11px] text-[#7a86a5]">
                          선택된 현장: {siteFilterLabel}
                        </p>
                      ) : (
                        <p className="mt-1 text-[11px] text-[#b91c1c]">
                          현장을 먼저 선택해 주세요.
                        </p>
                      )}
                    </div>
                    <RecentWorklogsPanel
                      worklogs={filteredWorklogs}
                      loading={worklogLoading}
                      error={worklogError}
                      photoCountsByWorklog={photoCountsByWorklog}
                      photosByWorklog={photosByWorklog}
                      onUploaded={() => setPhotoRefreshKey(prev => prev + 1)}
                      initialExpandedWorklogId={deepLinkWorklogId}
                      onConsumeDeepLink={consumeDeepLink}
                    />
                  </section>
                  <section className="grid grid-cols-3 gap-2">
                    <StatCard label="사진 수" value={totalPhotos} />
                    <StatCard label="도면 수" value={totalDrawings} />
                    <StatCard label="연결된 작업일지" value={totalLinkedWorklogs} />
                  </section>
                </div>
              </>
            ) : (
              <>
                <DrawingWorklogsPanel
                  worklogs={filteredWorklogs}
                  loading={worklogLoading}
                  error={worklogError}
                  drawingCountsByWorklog={drawingCountsByWorklog}
                  onRefresh={() => setDrawingRefreshToken(prev => prev + 1)}
                  siteId={selectedSiteId === 'all' ? undefined : selectedSiteId}
                  siteLabel={siteFilterLabel}
                  onOpenMarkup={handleOpenMarkup}
                  onOpenViewer={handleOpenViewer}
                  drawingLoading={drawingLoading}
                  drawingError={drawingError}
                  initialExpandedWorklogId={deepLinkWorklogId}
                  onConsumeDeepLink={consumeDeepLink}
                />
                <section className="grid grid-cols-3 gap-2">
                  <StatCard label="사진 수" value={totalPhotos} />
                  <StatCard label="도면 수" value={totalDrawings} />
                  <StatCard label="연결된 작업일지" value={totalLinkedWorklogs} />
                </section>
              </>
            )}
          </div>
        </div>
      </MobileLayoutWithAuth>
    </>
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
  initialExpandedWorklogId,
  onConsumeDeepLink,
}: {
  worklogs: WorklogItem[]
  loading?: boolean
  error?: string | null
  photoCountsByWorklog: Map<string, { before: number; after: number }>
  photosByWorklog: Map<string, WorklogPhotos>
  onUploaded: () => void
  initialExpandedWorklogId?: string | null
  onConsumeDeepLink?: () => void
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const autoExpanded = useRef(false)
  const toggle = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  useEffect(() => {
    if (autoExpanded.current) return
    if (!initialExpandedWorklogId) return
    if (!worklogs.some(w => w.id === initialExpandedWorklogId)) return

    autoExpanded.current = true
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.add(initialExpandedWorklogId)
      return next
    })
    onConsumeDeepLink?.()
    requestAnimationFrame(() => {
      const target = document.getElementById(`worklog-card-${initialExpandedWorklogId}`)
      target?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    })
  }, [initialExpandedWorklogId, worklogs, onConsumeDeepLink])

  return (
    <div className="space-y-3">
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
              id={`worklog-card-${log.id}`}
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
                  <WorklogMetaList
                    memberTypes={log.memberTypes}
                    workProcesses={log.workProcesses}
                    workTypes={log.workTypes}
                  />
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
                      {isExpanded ? '접기' : '사진 업로드/보기'}
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
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
      className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#d5def3] bg-white text-xs font-semibold text-[#4c5a80] shadow-sm transition-colors hover:bg-[#f4f7ff]"
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
    if (val === 'rejected') return 'rejected'
    return 'draft'
  }
  const key = normalize(status)
  const config: Record<string, { label: string; bg: string; text: string; border: string }> = {
    draft: { label: '임시', bg: '#f7f7fb', text: '#6b7280', border: '#e5e7eb' },
    submitted: { label: '제출', bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    approved: { label: '승인', bg: '#ecfdf3', text: '#15803d', border: '#bbf7d0' },
    rejected: { label: '반려', bg: '#fff5f5', text: '#d14343', border: '#f1d5d5' },
  }
  const c = config[key] || config.draft
  return (
    <span
      className="whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-semibold"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {c.label}
    </span>
  )
}

function WorklogMetaList({
  memberTypes,
  workProcesses,
  workTypes,
}: {
  memberTypes: string[]
  workProcesses: string[]
  workTypes: string[]
}) {
  const formatValue = (values: string[]) => (values.length ? values.join(', ') : '미입력')
  const items = [
    { label: '부재명', value: formatValue(memberTypes) },
    { label: '작업공정', value: formatValue(workProcesses) },
    { label: '작업유형', value: formatValue(workTypes) },
  ]
  return (
    <div className="mt-1 space-y-1 text-[11px]">
      {items.map(item => (
        <div key={item.label} className="flex flex-wrap gap-1">
          <span className="text-[#8f97b3]">{item.label}:</span>
          <span className="font-semibold text-[#1f2942]">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

function DrawingWorklogsPanel({
  worklogs,
  loading,
  error,
  drawingCountsByWorklog,
  onRefresh,
  siteId,
  siteLabel,
  onOpenMarkup,
  onOpenViewer,
  drawingLoading,
  drawingError,
  initialExpandedWorklogId,
  onConsumeDeepLink,
}: {
  worklogs: WorklogItem[]
  loading?: boolean
  error?: string | null
  drawingCountsByWorklog: Map<string, number>
  onRefresh: () => void
  siteId?: string
  siteLabel: string
  onOpenMarkup: (mode: 'upload' | 'start' | 'resume', docId?: string) => void
  onOpenViewer: (url: string, title?: string) => void
  drawingLoading?: boolean
  drawingError?: string | null
  initialExpandedWorklogId?: string | null
  onConsumeDeepLink?: () => void
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const autoExpanded = useRef(false)
  const toggle = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  useEffect(() => {
    if (autoExpanded.current) return
    if (!initialExpandedWorklogId) return
    if (!worklogs.some(w => w.id === initialExpandedWorklogId)) return

    autoExpanded.current = true
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.add(initialExpandedWorklogId)
      return next
    })
    onConsumeDeepLink?.()
    requestAnimationFrame(() => {
      const target = document.getElementById(`worklog-card-${initialExpandedWorklogId}`)
      target?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    })
  }, [initialExpandedWorklogId, worklogs, onConsumeDeepLink])

  return (
    <div className="space-y-3">
      <section className="rounded-2xl border border-[#e0e6f3] bg-white p-4 shadow-[0_6px_20px_rgba(16,36,94,0.08)]">
        <div className="mb-4">
          <h2 className="text-[15px] font-bold text-[#1f2942]">도면 업로드 & 연동</h2>
          <p className="mt-1 text-xs text-[#99a4c3]">
            작업일지를 선택해 도면을 업로드하고 도면마킹도구 결과를 연결하세요.
          </p>
          <p className="mt-1 text-[11px] text-[#7a86a5]">선택된 현장: {siteLabel}</p>
          {drawingLoading && (
            <p className="mt-1 text-[11px] text-[#7f8ba7]">도면 정보를 불러오는 중...</p>
          )}
          {drawingError && <p className="mt-1 text-[11px] text-red-500">{drawingError}</p>}
        </div>

        {loading ? (
          <p className="text-sm text-[#7f8ba7]">작업일지를 불러오는 중...</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : worklogs.length === 0 ? (
          <p className="text-sm text-[#7f8ba7]">표시할 작업일지가 없습니다.</p>
        ) : (
          worklogs.map(log => {
            const drawingCount = log.id ? drawingCountsByWorklog.get(log.id) || 0 : 0
            const isExpanded = log.id ? expandedIds.has(log.id) : false
            const effectiveSiteId = log.siteId || siteId
            const effectiveSiteLabel = log.siteName || siteLabel
            return (
              <div
                key={log.id}
                id={`worklog-card-${log.id}`}
                className="mb-3 rounded-2xl border border-[#e0e6f3] bg-[#fefeff] px-3 py-3 shadow-[0_2px_10px_rgba(16,36,94,0.08)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-[#7f8ba7]">
                      {log.workDate || '-'} · {log.siteName || siteLabel || '미지정'}
                    </div>
                    <div className="truncate text-sm font-semibold text-[#1f2942]">
                      {log.workDescription || '작업내역 미기재'}
                    </div>
                    {log.authorName && (
                      <div className="text-[11px] text-[#9aa4c5]">작성자: {log.authorName}</div>
                    )}
                    {log.locationLabel && (
                      <div className="text-[11px] text-[#9aa4c5]">
                        작업공간: {log.locationLabel}
                      </div>
                    )}
                    <WorklogMetaList
                      memberTypes={log.memberTypes}
                      workProcesses={log.workProcesses}
                      workTypes={log.workTypes}
                    />
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                      <span className="rounded-lg bg-[#f3f0ff] px-2 py-1 text-[#5b4ac7]">
                        도면 {drawingCount}건
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
                        disabled={!effectiveSiteId}
                      >
                        {isExpanded ? '접기' : '도면 업로드/보기'}
                      </button>
                    )}
                  </div>
                </div>
                {log.id && isExpanded && (
                  <div className="mt-3">
                    <DrawingManagerInline
                      worklogId={log.id}
                      siteId={effectiveSiteId || undefined}
                      siteName={effectiveSiteLabel}
                      onRefresh={onRefresh}
                      onOpenMarkup={onOpenMarkup}
                      onOpenViewer={onOpenViewer}
                    />
                  </div>
                )}
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}

function DrawingManagerInline({
  worklogId,
  siteId,
  siteName,
  onRefresh,
  onOpenMarkup,
  onOpenViewer,
}: {
  worklogId: string
  siteId?: string
  siteName?: string | null
  onRefresh: () => void
  onOpenMarkup: (
    mode: 'upload' | 'start' | 'resume',
    docId?: string,
    targetWorklogId?: string,
    directDrawing?: any
  ) => void
  onOpenViewer: (url: string, title?: string) => void
}) {
  const [activeTab, setActiveTab] = useState<'list' | 'upload' | 'tool'>('list')
  const [linked, setLinked] = useState<LinkedDrawingRecord[]>([])
  const [worklogMeta, setWorklogMeta] = useState<{
    work_date?: string | null
    work_description?: string | null
  } | null>(null)
  const [linkedLoading, setLinkedLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docType, setDocType] = useState<'progress_drawing' | 'blueprint'>('progress_drawing')
  const [uploading, setUploading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const markupFileInputRef = useRef<HTMLInputElement | null>(null)

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1)
    onRefresh()
  }

  const handlePickMarkupFile = () => {
    if (!siteId) {
      toast.error('현장을 먼저 선택해주세요.')
      return
    }
    markupFileInputRef.current?.click()
  }

  const handleMarkupFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0]
      if (!file) return

      if (!file.type.startsWith('image/')) {
        toast.error('마킹할 도면은 이미지 파일만 지원합니다. (PNG/JPG/WEBP)')
        return
      }

      const objectUrl = URL.createObjectURL(file)

      const drawingData = {
        id: undefined,
        name: file.name,
        title: file.name,
        url: objectUrl,
        size: file.size,
        type: file.type,
        uploadDate: new Date(),
        isMarked: false,
        source: 'local',
        siteId,
        siteName,
        markupData: [],
        file,
      }

      onOpenMarkup('start', undefined, worklogId, drawingData)
    } catch (error) {
      console.error('[media] markup file select failed', error)
      toast.error(error instanceof Error ? error.message : '파일을 불러오지 못했습니다.')
    } finally {
      if (event.target) event.target.value = ''
    }
  }

  useEffect(() => {
    let cancelled = false
    const fetchLinked = async () => {
      setLinkedLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('worklog_id', worklogId)
        if (siteId) params.set('site_id', siteId)
        const res = await fetch(`/api/mobile/media/drawings?${params.toString()}`, {
          cache: 'no-store',
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || json?.error) throw new Error(json?.error || '도면을 불러올 수 없습니다.')
        if (!cancelled) {
          if (json?.data?.worklog) {
            setWorklogMeta(json.data.worklog)
          }
          setLinked(json?.data?.drawings || [])
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[media] linked drawings error', err)
          setLinked([])
        }
      } finally {
        if (!cancelled) setLinkedLoading(false)
      }
    }
    fetchLinked()
    return () => {
      cancelled = true
    }
  }, [worklogId, siteId, refreshKey])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('업로드할 파일을 선택해주세요.')
      return
    }
    if (!siteId) {
      toast.error('현장을 먼저 선택해주세요.')
      return
    }
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', selectedFile)
      form.append('siteId', siteId)
      form.append('documentType', docType)
      form.append('worklogId', worklogId)
      const res = await fetch('/api/site-documents/upload', {
        method: 'POST',
        body: form,
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) throw new Error(json?.error || '업로드에 실패했습니다.')
      toast.success('도면을 업로드했습니다.')
      setSelectedFile(null)
      triggerRefresh()
    } catch (err) {
      console.error('[media] drawing upload failed', err)
      toast.error(err instanceof Error ? err.message : '업로드 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const handleUnlink = async (e: React.MouseEvent, record: LinkedDrawingRecord) => {
    e.stopPropagation()
    if (!confirm('이 도면을 작업일지에서 연결 해제하시겠습니까?')) return

    try {
      const res = await fetch('/api/mobile/media/drawings/unlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drawingId: record.id,
          worklogId: worklogId,
          source: record.source,
        }),
      })
      if (!res.ok) throw new Error('연결 해제 실패')
      toast.success('도면 연결을 해제했습니다.')
      triggerRefresh()
    } catch (err) {
      toast.error('오류가 발생했습니다.')
    }
  }

  const handleOpenDrawing = (record: LinkedDrawingRecord) => {
    if (record.source === 'markup' && record.markupId) {
      onOpenMarkup('resume', record.markupId, worklogId)
      return
    }
    onOpenViewer(record.url, record.title)
  }

  const handleStartMarkingFromExisting = (e: React.MouseEvent, record: LinkedDrawingRecord) => {
    e.stopPropagation()
    // Convert current drawing into a format for the editor
    const docId = record.markupId || record.id
    // If it's already a markup, resume it. If it's a file, start from it.
    if (record.source === 'markup') {
      onOpenMarkup('resume', docId, worklogId)
    } else {
      // It's a file from UDS
      onOpenMarkup('resume', undefined, worklogId) // We need a way to pass the URL
      // Actually, handleDrawingSelect is what we need.
      // Let's refine onOpenMarkup to take a starting document if needed.
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-[#e0e6f3] bg-white p-4 shadow-sm">
      {/* 탭 헤더 */}
      <div className="flex gap-1 rounded-xl bg-[#f4f6fb] p-1">
        {[
          { key: 'list', label: '업로드 된 도면' },
          { key: 'upload', label: '파일 업로드' },
          { key: 'tool', label: '도면마킹도구' },
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-white text-[#31a3fa] shadow-sm'
                : 'text-[#8f97b3] hover:text-[#5a6182]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: 업로드 된 도면 (조회) */}
      {activeTab === 'list' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-bold text-[#1f2942]">연계 도면 리스트</h3>
            <button
              type="button"
              onClick={triggerRefresh}
              className="text-[11px] text-[#31a3fa] font-medium"
            >
              새로고침
            </button>
          </div>

          {linkedLoading ? (
            <div className="flex flex-col items-center py-8 text-[#7f8ba7]">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#31a3fa] border-t-transparent mb-2" />
              <p className="text-xs">도면을 불러오는 중...</p>
            </div>
          ) : linked.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-[#7f8ba7]">
              <div className="mb-2 text-2xl">📁</div>
              <p className="text-xs">연결된 도면이 없습니다.</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {linked.map(record => (
                <div
                  key={record.id}
                  className="flex items-center gap-3 rounded-xl border border-[#e0e6f3] bg-[#fdfdff] p-3 transition-colors active:bg-[#f0f4ff]"
                  onClick={() => handleOpenDrawing(record)}
                >
                  {/* Thumbnail Placeholder */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#f0f4ff] text-[#31a3fa]">
                    {record.previewUrl ? (
                      <img
                        src={record.previewUrl}
                        alt=""
                        className="h-full w-full rounded-lg object-cover"
                      />
                    ) : (
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-[#1f2942]">{record.title}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          record.source === 'markup'
                            ? 'bg-[#f3f0ff] text-[#5b4ac7]'
                            : 'bg-[#eff6ff] text-[#2563eb]'
                        }`}
                      >
                        {record.source === 'markup' ? '마킹' : '파일'}
                      </span>
                      {(record.documentType === 'blueprint' ||
                        record.documentType === 'construction_drawing') && (
                        <span className="bg-[#fef3c7] text-[#92400e] text-[10px] font-bold px-1.5 py-0.5 rounded">
                          공도면
                        </span>
                      )}
                      {record.documentType === 'progress_drawing' && (
                        <span className="bg-[#dcfce7] text-[#166534] text-[10px] font-bold px-1.5 py-0.5 rounded">
                          진행도면
                        </span>
                      )}
                      <span className="text-[11px] text-[#9aa4c5]">
                        {record.createdAt
                          ? new Date(record.createdAt).toLocaleDateString('ko-KR')
                          : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        if (record.source === 'markup') {
                          onOpenMarkup('resume', record.markupId, worklogId, record)
                        } else if (record.markupId) {
                          onOpenMarkup('resume', record.markupId, worklogId, record)
                        } else {
                          onOpenMarkup('start', record.id, worklogId, record)
                        }
                      }}
                      className="p-1.5 text-[#31a3fa] hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold">마킹</span>
                    </button>
                    <button
                      type="button"
                      onClick={e => handleUnlink(e, record)}
                      className="p-1.5 text-[#ef4444] hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: 파일 업로드 (신규) */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#4c5a80]">도면 종류 (필수)</label>
            <div className="flex gap-2">
              {[
                { value: 'progress_drawing', label: '진행 도면' },
                { value: 'blueprint', label: '공 도면' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDocType(opt.value as any)}
                  className={`flex-1 rounded-lg border py-2.5 text-xs font-bold transition-all ${
                    docType === opt.value
                      ? 'border-[#31a3fa] bg-[#effaff] text-[#31a3fa]'
                      : 'border-[#dfe4f4] bg-white text-[#8f97b3]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d5def3] bg-[#f9fbff] py-8 transition-colors active:bg-[#f0f4ff]"
            onClick={() => document.getElementById(`drawing-upload-${worklogId}`)?.click()}
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#31a3fa] shadow-sm">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </div>
            <p className="text-xs font-bold text-[#1f2942]">
              {selectedFile ? selectedFile.name : '파일을 선택하거나 촬영하세요'}
            </p>
            <p className="mt-1 text-[10px] text-[#9aa4c5]">PDF, JPG, PNG 지원 (최대 10MB)</p>
            <input
              id={`drawing-upload-${worklogId}`}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || uploading || !siteId}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a2a6b] py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/10 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {uploading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                업로드 중...
              </>
            ) : (
              '현재 작업일지에 도면 연동'
            )}
          </button>

          {!siteId && (
            <p className="text-center text-[10px] font-medium text-red-500">
              * 현장을 먼저 선택해야 업로드할 수 있습니다.
            </p>
          )}
        </div>
      )}

      {/* Tab 3: 도면마킹도구 (도구 실행) */}
      {activeTab === 'tool' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#eff6ff] p-4">
            <h4 className="flex items-center gap-1.5 text-sm font-bold text-[#1f2942]">
              <span className="text-lg">📏</span> 도면마킹도구 연동
            </h4>
            <p className="mt-1.5 text-xs font-medium leading-relaxed text-[#4c5a80]">
              촬영한 사진이나 업로드된 도면에 마킹(치수, 텍스트)을 하여 현재 작업일지의 연계
              도면으로 즉시 저장합니다.
            </p>
          </div>

          <div className="grid gap-3">
            <input
              ref={markupFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleMarkupFileChange}
            />
            <button
              type="button"
              onClick={handlePickMarkupFile}
              className="flex items-center gap-3 rounded-xl border border-[#dfe4f4] bg-white p-3.5 transition-all active:bg-[#f8f9ff]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0f4ff] text-[#31a3fa]">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-[#1f2942]">마킹할 도면 불러오기</div>
                <div className="text-[11px] text-[#9aa4c5]">로컬 이미지 파일 선택</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
