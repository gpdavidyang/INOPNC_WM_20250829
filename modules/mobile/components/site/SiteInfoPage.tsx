'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import '@/modules/mobile/styles/attendance.css'
import { TMap } from '@/lib/external-apps'
import { Download, Search, X } from 'lucide-react'
import {
  createMaterialRequest as createNpcMaterialRequest,
  recordInventoryTransaction,
  getMaterialsData as getNPCMaterialsData,
} from '@/app/actions/materials-inventory'
import { useToast } from '@/components/ui/use-toast'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
  PhSelectTrigger,
} from '@/components/ui/custom-select'

type ManagerRole = 'construction_manager' | 'assistant_manager' | 'safety_manager'

interface ManagerContact {
  role: ManagerRole
  name: string
  phone: string
  email?: string
}

interface SiteAddress {
  id: string
  site_id: string
  full_address: string
  latitude?: number
  longitude?: number
  postal_code?: string
}

interface SiteInfoResponse {
  id: string
  name: string
  address: SiteAddress
  customer_company?: {
    id: string
    company_name?: string | null
  }
  accommodation?: {
    id: string
    site_id: string
    accommodation_name: string
    full_address: string
  }
  process: {
    member_name: string
    work_process: string
    work_section: string
  }
  managers: ManagerContact[]
  construction_period: {
    start_date: string | null
    end_date: string | null
  }
  is_active: boolean
  ptw_document?: { id: string; file_url: string; file_name: string }
  blueprint_document?: { id: string; file_url: string; file_name: string }
}

interface SiteSearchResult {
  id: string
  name: string
  address: string
  construction_period?: {
    start_date: string
    end_date: string
  }
  progress_percentage?: number
  participant_count?: number
  is_active: boolean
}

interface AttachmentFile {
  id: string
  name: string
  url: string
  size?: string
  date?: string
  type?: string
  rawType?: string
}

interface AttachmentBuckets {
  drawings: AttachmentFile[]
  ptw: AttachmentFile[]
  photos: AttachmentFile[]
}

interface NpcSummary {
  today: {
    incoming: number
    used: number
    stock: number
  }
  cumulative: {
    totalIncoming: number
    totalUsed: number
    currentStock: number
  }
}

interface DailyReportItem {
  work_date: string
  npc1000_incoming?: number | null
  npc1000_used?: number | null
  npc1000_remaining?: number | null
}

interface MonthlyStats {
  siteCount: number
  totalManDays: number
  workDays: number
}

interface SiteLaborStats {
  totalHours: number
  totalManDays: number
}

interface NpcTransaction {
  transaction_type: 'in' | 'out'
  quantity: number
  transaction_date: string | null
  created_at: string | null
  notes?: string | null
  materials?: {
    code?: string | null
    name?: string | null
  } | null
}

const EMPTY_ATTACHMENTS: AttachmentBuckets = {
  drawings: [],
  ptw: [],
  photos: [],
}

const DEFAULT_SITE_DISPLAY_COUNT = 3

const getCompanyAbbreviation = (companyName?: string | null, fallbackName?: string | null) => {
  // Prefer explicit company name
  if (companyName && companyName.trim()) return companyName.trim()

  const src = (fallbackName || '').trim()
  if (!src) return '미정'
  // If fallback starts with [브랜드], extract the bracket content
  const m = src.match(/^\[([^\]]+)\]/)
  if (m && m[1]) return m[1]
  // Otherwise use first 2 visible characters (Korean-safe)
  const characters = Array.from(src.replace(/\s+/g, ''))
  return characters.slice(0, 2).join('')
}

const getLastWorkDateValue = (site: SiteSearchResult) =>
  site.last_work_date ?? site.construction_period?.end_date ?? null

const formatDateDisplay = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

// Home search style: include weekday like 2025.09.21(토)
const formatDateDisplayWithWeekday = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'] as const
  const w = weekdays[date.getDay()]
  return `${year}.${month}.${day}(${w})`
}

const todayISO = () => new Date().toISOString().split('T')[0]

const formatQuantityValue = (value: number) =>
  Number.isInteger(value) ? value.toString() : value.toFixed(1)

class HttpError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function fetchJSON<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init)
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    const message = text || `Request failed (${response.status})`
    throw new HttpError(message, response.status)
  }
  try {
    return (await response.json()) as T
  } catch (error) {
    throw new HttpError('Invalid JSON response', response.status)
  }
}

async function loadCurrentSite(): Promise<SiteInfoResponse | null> {
  try {
    const { data } = await fetchJSON<{ data: SiteInfoResponse }>('/api/sites/current', {
      cache: 'no-store',
    })
    return data
  } catch (error) {
    if (error instanceof HttpError) {
      if (error.status === 404) {
        return null
      }
      throw error
    }
    console.error('[SiteInfo] Failed to load current site', error)
    return null
  }
}

async function loadSiteAttachments(siteId: string): Promise<AttachmentBuckets> {
  try {
    const params = new URLSearchParams({
      site_id: siteId,
      limit: '50',
      status: 'active',
    })

    const { data } = await fetchJSON<{ data: Array<any> }>(
      `/api/unified-documents/v2?${params.toString()}`,
      { cache: 'no-store' }
    )

    const buckets: AttachmentBuckets = {
      drawings: [],
      ptw: [],
      photos: [],
    }(data || []).forEach(doc => {
      if (!doc?.file_url || !doc?.file_name) return

      const attachment: AttachmentFile = {
        id: doc.id,
        name: doc.title || doc.file_name,
        url: doc.file_url,
        size: doc.file_size ? `${doc.file_size}KB` : undefined,
        date: doc.created_at,
        type: doc.document_type,
        rawType: doc.sub_type,
      }

      const lowerType = (doc.document_type || '').toLowerCase()
      const lowerTitle = (doc.title || '').toLowerCase()

      if (lowerType === 'blueprint' || lowerType === 'drawing' || lowerTitle.includes('도면')) {
        buckets.drawings.push(attachment)
        return
      }

      if (lowerType === 'ptw' || lowerTitle.includes('ptw') || lowerTitle.includes('작업허가')) {
        buckets.ptw.push(attachment)
        return
      }

      if (lowerType.includes('photo') || lowerType.includes('image')) {
        buckets.photos.push(attachment)
        return
      }

      // Fallback: put into drawings for blueprint-like documents
      buckets.drawings.push(attachment)
    })

    return buckets
  } catch (error) {
    console.error('[SiteInfo] Failed to load attachments', error)
    return EMPTY_ATTACHMENTS
  }
}

async function loadNpcSummary(siteId: string): Promise<NpcSummary | null> {
  try {
    const params = new URLSearchParams({ site_id: siteId, limit: '30' })
    const { data } = await fetchJSON<{
      data: {
        reports: DailyReportItem[]
      }
    }>(`/api/mobile/daily-reports?${params.toString()}`, { cache: 'no-store' })

    const reports = data?.reports ?? []
    if (!reports.length)
      return {
        today: { incoming: 0, used: 0, stock: 0 },
        cumulative: { totalIncoming: 0, totalUsed: 0, currentStock: 0 },
      }

    const today = todayISO()
    const todayReport = reports.find(report => report.work_date === today)

    const cumulative = reports.reduce(
      (acc, report) => {
        const incoming = Number(report.npc1000_incoming ?? 0)
        const used = Number(report.npc1000_used ?? 0)
        const remaining = Number(report.npc1000_remaining ?? 0)

        return {
          totalIncoming: acc.totalIncoming + incoming,
          totalUsed: acc.totalUsed + used,
          currentStock: acc.currentStock === null ? remaining : acc.currentStock,
        }
      },
      { totalIncoming: 0, totalUsed: 0, currentStock: null as number | null }
    )

    const latestStock = reports.length
      ? Number(reports[0].npc1000_remaining ?? cumulative.currentStock ?? 0)
      : 0

    return {
      today: {
        incoming: Number(todayReport?.npc1000_incoming ?? 0),
        used: Number(todayReport?.npc1000_used ?? 0),
        stock: Number(todayReport?.npc1000_remaining ?? latestStock ?? 0),
      },
      cumulative: {
        totalIncoming: cumulative.totalIncoming,
        totalUsed: cumulative.totalUsed,
        currentStock: latestStock,
      },
    }
  } catch (error) {
    console.error('[SiteInfo] Failed to load NPC summary', error)
    return null
  }
}

async function loadSiteSearch(siteName: string): Promise<SiteSearchResult[]> {
  try {
    // NPC 섹션의 현장 선택은 전체 리스트가 필요하므로 넉넉한 상한(백엔드 cap 100)에 맞춰 요청
    const params = new URLSearchParams({ limit: '100' })
    if (siteName.trim()) {
      params.set('siteName', siteName.trim())
    }

    const { data } = await fetchJSON<{ data: SiteSearchResult[] }>(
      `/api/sites/search?${params.toString()}`,
      { cache: 'no-store' }
    )

    return data || []
  } catch (error) {
    console.error('[SiteInfo] Failed to search sites', error)
    return []
  }
}

async function switchCurrentSite(siteId: string) {
  await fetchJSON<{ success: boolean }>('/api/sites/switch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ siteId }),
  })
}

async function loadMonthlyStats(date = new Date()): Promise<MonthlyStats | null> {
  try {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const response = await fetchJSON<{
      success: boolean
      data?: { siteCount?: number; totalManDays?: number; workDays?: number }
    }>(`/api/salary/monthly?year=${year}&month=${month}`, { cache: 'no-store' })

    if (!response?.success || !response.data) {
      return null
    }

    const { siteCount = 0, totalManDays = 0, workDays = 0 } = response.data

    return {
      siteCount,
      totalManDays,
      workDays,
    }
  } catch (error) {
    console.error('[SiteInfo] Failed to load monthly stats', error)
    return null
  }
}

async function loadSiteLaborStats(siteId: string): Promise<SiteLaborStats> {
  try {
    const response = await fetchJSON<{
      success: boolean
      data?: { totalHours?: number; totalManDays?: number }
    }>(`/api/mobile/sites/${siteId}/stats`, { cache: 'no-store' })

    if (!response?.success || !response.data) {
      return { totalHours: 0, totalManDays: 0 }
    }

    const totalHours = Number(response.data.totalHours ?? 0)
    const totalManDays = Number(response.data.totalManDays ?? 0)

    return {
      totalHours: Number(totalHours.toFixed(2)),
      totalManDays: Number(totalManDays.toFixed(1)),
    }
  } catch (error) {
    console.error('[SiteInfo] Failed to load site labor stats', error)
    return { totalHours: 0, totalManDays: 0 }
  }
}

function extractCityFromAddress(address?: string | null): string | null {
  if (!address) return null
  const tokens = address.split(/\s+/)
  for (const token of tokens) {
    if (/([가-힣]+)(시|군|구)$/.test(token)) return token.replace(/,/g, '')
  }
  return tokens[0] || null
}

function formatWeatherLabel(weather?: string | null): string | null {
  if (!weather) return null
  const map: Record<string, string> = {
    sunny: '맑음',
    clear: '맑음',
    cloudy: '흐림',
    overcast: '흐림',
    rainy: '비',
    rain: '비',
    snow: '눈',
    windy: '바람',
    foggy: '안개',
    storm: '폭풍',
  }
  const key = weather.toLowerCase()
  return map[key] || weather
}

async function loadTodayReportSummary(
  siteId: string
): Promise<{ headcount: number; weather?: string | null }> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const params = new URLSearchParams({
      site_id: siteId,
      start_date: today,
      end_date: today,
      limit: '1',
    })
    const res = await fetch(`/api/mobile/daily-reports?${params.toString()}`, { cache: 'no-store' })
    if (!res.ok) return { headcount: 0 }
    const json = await res.json()
    const report = Array.isArray(json?.data?.reports) ? json.data.reports[0] : null
    const headcount =
      Number(
        report?.total_workers ||
          (Array.isArray(report?.worker_assignments) ? report.worker_assignments.length : 0)
      ) || 0
    const weather = report?.weather || null
    return { headcount, weather }
  } catch {
    return { headcount: 0 }
  }
}

export default function SiteInfoPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentSite, setCurrentSite] = useState<SiteInfoResponse | null>(null)
  const [attachments, setAttachments] = useState<AttachmentBuckets>(EMPTY_ATTACHMENTS)
  const [npcSummary, setNpcSummary] = useState<NpcSummary | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSessionExpired, setIsSessionExpired] = useState(false)

  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null)
  const [siteLaborStats, setSiteLaborStats] = useState<SiteLaborStats>({
    totalHours: 0,
    totalManDays: 0,
  })
  const [todayHeadcount, setTodayHeadcount] = useState(0)
  const [, setTodayWeather] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [siteResults, setSiteResults] = useState<SiteSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showAllSites, setShowAllSites] = useState(false)
  const [showSiteBottomSheet, setShowSiteBottomSheet] = useState(false)

  const [showAttachmentPopup, setShowAttachmentPopup] = useState(false)
  const [attachmentFocus, setAttachmentFocus] = useState<'drawings' | 'ptw' | 'photos' | null>(null)

  const { toast } = useToast()

  const [showDetail, setShowDetail] = useState(false)
  const [showNpcRecordSheet, setShowNpcRecordSheet] = useState(false)
  const [showNpcRequestSheet, setShowNpcRequestSheet] = useState(false)
  const [showNpcLogSheet, setShowNpcLogSheet] = useState(false)
  const [npcTransactions, setNpcTransactions] = useState<NpcTransaction[]>([])
  const [allTransactions, setAllTransactions] = useState<NpcTransaction[]>([])
  const [materialsOptions, setMaterialsOptions] = useState<Array<{ code: string; name: string }>>(
    []
  )
  const [selectedLogMaterialCode, setSelectedLogMaterialCode] = useState<string>('ALL')
  const [recordMaterialCode, setRecordMaterialCode] = useState<string>('NPC-1000')
  const [requestMaterialCode, setRequestMaterialCode] = useState<string>('NPC-1000')
  const [isLoadingNpcLogs, setIsLoadingNpcLogs] = useState(false)
  const [npcLogError, setNpcLogError] = useState<string | null>(null)
  const [recordTransactionType, setRecordTransactionType] = useState<'in' | 'out'>('in')
  const [recordQuantity, setRecordQuantity] = useState('')
  const [recordDate, setRecordDate] = useState(todayISO())
  const [recordNotes, setRecordNotes] = useState('')
  const [isSubmittingRecord, setIsSubmittingRecord] = useState(false)
  const [requestQuantity, setRequestQuantity] = useState('')
  const [requestNotes, setRequestNotes] = useState('')
  const [requestUrgency, setRequestUrgency] = useState<'normal' | 'urgent' | 'emergency'>('normal')
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)

  const todayDisplay = useMemo(() => todayISO(), [])

  const npcLogSummary = useMemo(() => {
    return npcTransactions.reduce(
      (acc, tx) => {
        const qty = Number(tx.quantity) || 0
        if (tx.transaction_type === 'out') {
          acc.usage += qty
        } else {
          acc.incoming += qty
        }
        return acc
      },
      { incoming: 0, usage: 0 }
    )
  }, [npcTransactions])

  const refreshNpcSummary = useCallback(async () => {
    if (!currentSite) return

    try {
      setIsRefreshing(true)
      const updatedSummary = await loadNpcSummary(currentSite.id)
      setNpcSummary(updatedSummary)
    } catch (error) {
      console.error('[SiteInfo] Failed to refresh NPC summary', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [currentSite])

  const loadNpcLogs = useCallback(async (siteId: string) => {
    setIsLoadingNpcLogs(true)
    setNpcLogError(null)
    setNpcTransactions([])
    setAllTransactions([])

    try {
      const result = await getNPCMaterialsData({ siteId, limit: 100 })

      if (!result?.success) {
        setNpcTransactions([])
        setNpcLogError(result?.error || '로그 데이터를 불러오지 못했습니다.')
        return
      }

      const transactions = (result.data?.transactions ?? []) as NpcTransaction[]
      const inventory = (result.data?.inventory ?? []) as Array<{
        materials?: { code?: string | null; name?: string | null }
      }>

      const options = Array.from(
        new Map(
          inventory
            .map(i => ({ code: i.materials?.code || '', name: i.materials?.name || '' }))
            .filter(m => !!m.code)
            .map(m => [m.code as string, { code: m.code as string, name: m.name as string }])
        ).values()
      )

      setMaterialsOptions(options)
      // Prefer NPC-1000 if present, otherwise first option, otherwise ALL
      const defaultCode = options.find(o => o.code === 'NPC-1000')?.code || options[0]?.code
      setSelectedLogMaterialCode(defaultCode || 'ALL')
      setRecordMaterialCode(defaultCode || 'NPC-1000')
      setRequestMaterialCode(defaultCode || 'NPC-1000')

      // keep raw
      setAllTransactions(
        transactions.map(tx => ({
          transaction_type: tx.transaction_type === 'out' ? 'out' : 'in',
          quantity: Number(tx.quantity) || 0,
          transaction_date: tx.transaction_date ?? tx.created_at ?? null,
          created_at: tx.created_at ?? null,
          notes: tx.notes ?? '',
          materials: tx.materials ?? null,
        }))
      )
    } catch (error) {
      console.error('[SiteInfo] Failed to load NPC logs', error)
      setNpcTransactions([])
      setNpcLogError('로그 데이터를 불러오지 못했습니다.')
    } finally {
      setIsLoadingNpcLogs(false)
    }
  }, [])

  // Re-filter transactions for logs when selection changes
  useEffect(() => {
    if (!allTransactions.length) {
      setNpcTransactions([])
      return
    }
    if (selectedLogMaterialCode === 'ALL') {
      setNpcTransactions(allTransactions)
    } else {
      setNpcTransactions(
        allTransactions.filter(tx => tx.materials?.code === selectedLogMaterialCode)
      )
    }
  }, [allTransactions, selectedLogMaterialCode])

  const loadAll = async (options?: { openSheet?: boolean }) => {
    setIsLoading(true)
    setErrorMessage(null)
    setIsSessionExpired(false)
    let shouldOpenSheet = Boolean(options?.openSheet)

    try {
      const [site, stats] = await Promise.all([loadCurrentSite(), loadMonthlyStats()])

      setMonthlyStats(
        stats ?? {
          siteCount: 0,
          totalManDays: 0,
          workDays: 0,
        }
      )

      if (!site) {
        setCurrentSite(null)
        setAttachments(EMPTY_ATTACHMENTS)
        setNpcSummary(null)
        setSiteLaborStats({ totalHours: 0, totalManDays: 0 })
        setShowNpcRecordSheet(false)
        setShowNpcRequestSheet(false)
        setShowNpcLogSheet(false)
        shouldOpenSheet = false
        return
      }

      setCurrentSite(site)
      setNpcTransactions([])
      setNpcLogError(null)

      const [siteAttachments, npc, laborStats, todaySummary] = await Promise.all([
        loadSiteAttachments(site.id),
        loadNpcSummary(site.id),
        loadSiteLaborStats(site.id),
        loadTodayReportSummary(site.id),
      ])

      setAttachments(siteAttachments)
      setNpcSummary(npc)
      setSiteLaborStats(laborStats)
      setTodayHeadcount(todaySummary.headcount)
      const label = formatWeatherLabel(todaySummary.weather)
      const city = extractCityFromAddress(site.address.full_address)
      setTodayWeather(label ? `${city ? city + ' ' : ''}${label}` : city || '')

      // Preload materials options (light query)
      try {
        const preload = await getNPCMaterialsData({ siteId: site.id, limit: 1 })
        if (preload?.success) {
          const inventory = (preload.data?.inventory ?? []) as Array<{
            materials?: { code?: string | null; name?: string | null }
          }>
          const options = Array.from(
            new Map(
              inventory
                .map(i => ({ code: i.materials?.code || '', name: i.materials?.name || '' }))
                .filter(m => !!m.code)
                .map(m => [m.code as string, { code: m.code as string, name: m.name as string }])
            ).values()
          )
          setMaterialsOptions(options)
          const defaultCode = options.find(o => o.code === 'NPC-1000')?.code || options[0]?.code
          if (defaultCode) {
            setRecordMaterialCode(defaultCode)
            setRequestMaterialCode(defaultCode)
          }
        }
      } catch {
        // ignore preload errors
      }
    } catch (error) {
      if (error instanceof HttpError && error.status === 401) {
        setErrorMessage('세션이 만료되었습니다. 다시 로그인해주세요.')
        setIsSessionExpired(true)
        setCurrentSite(null)
        setAttachments(EMPTY_ATTACHMENTS)
        setNpcSummary(null)
        setMonthlyStats({ siteCount: 0, totalManDays: 0, workDays: 0 })
        setSiteLaborStats({ totalHours: 0, totalManDays: 0 })
        setShowNpcRecordSheet(false)
        setShowNpcRequestSheet(false)
        setShowNpcLogSheet(false)
        shouldOpenSheet = false
      } else {
        console.error('[SiteInfo] loadAll failed', error)
        setErrorMessage(error instanceof Error ? error.message : '데이터를 불러오지 못했습니다.')
        setMonthlyStats(prev => prev ?? { siteCount: 0, totalManDays: 0, workDays: 0 })
        setSiteLaborStats(prev => prev ?? { totalHours: 0, totalManDays: 0 })
        shouldOpenSheet = false
      }
    } finally {
      setIsLoading(false)
      if (shouldOpenSheet) {
        setShowSiteBottomSheet(true)
      }
    }
  }

  useEffect(() => {
    if (showNpcRecordSheet) {
      setRecordTransactionType('in')
      setRecordQuantity('')
      setRecordNotes('')
      setRecordDate(todayISO())
    }
  }, [showNpcRecordSheet])

  useEffect(() => {
    if (showNpcRequestSheet) {
      setRequestQuantity('')
      setRequestNotes('')
      setRequestUrgency('normal')
    }
  }, [showNpcRequestSheet])

  useEffect(() => {
    loadAll()
  }, [])

  useEffect(() => {
    let cancelled = false

    const fetchSites = async () => {
      setIsSearching(true)
      try {
        const results = await loadSiteSearch(searchQuery)
        if (!cancelled) {
          setSiteResults(results)
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false)
        }
      }
    }

    const timer = setTimeout(fetchSites, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [searchQuery])

  const displayedSiteResults = useMemo(() => {
    if (searchQuery.trim()) {
      return siteResults
    }
    const limit = showAllSites ? siteResults.length : DEFAULT_SITE_DISPLAY_COUNT
    return siteResults.slice(0, limit)
  }, [siteResults, showAllSites, searchQuery])

  const npcSiteOptions = useMemo(() => {
    const options: Array<{ id: string; name: string }> = []
    const seen = new Set<string>()

    const addOption = (id?: string, name?: string | null) => {
      if (!id || seen.has(id)) return
      options.push({ id, name: name?.trim() || '이름 없음' })
      seen.add(id)
    }

    addOption(currentSite?.id, currentSite?.name)
    displayedSiteResults.forEach(site => addOption(site.id, site.name))
    siteResults.forEach(site => addOption(site.id, site.name))

    return options
  }, [currentSite?.id, currentSite?.name, displayedSiteResults, siteResults])

  const selectedNpcSiteId = useMemo(() => {
    if (!npcSiteOptions.length) {
      return ''
    }

    const currentId = currentSite?.id
    if (currentId && npcSiteOptions.some(option => option.id === currentId)) {
      return currentId
    }

    return npcSiteOptions[0].id
  }, [npcSiteOptions, currentSite?.id])

  const handleAttachmentOpen = (category: 'drawings' | 'ptw' | 'photos' | null) => {
    setAttachmentFocus(category)
    setShowAttachmentPopup(true)
  }

  // 진행도면 액션 모달 상태
  const [progressModal, setProgressModal] = useState<{
    open: boolean
    mode: 'choose' | 'empty'
    item: any | null
  }>({ open: false, mode: 'choose', item: null })
  const closeProgressModal = () => setProgressModal(prev => ({ ...prev, open: false }))
  const openLatestProgressInNewTab = async () => {
    const item = progressModal.item
    if (!item) return
    try {
      let finalUrl: string = item.url
      try {
        const s = await fetch(`/api/files/signed-url?url=${encodeURIComponent(item.url)}`)
        const sj = await s.json().catch(() => ({}))
        finalUrl = sj?.url || item.url
      } catch {
        /* ignore */
      }
      try {
        const chk = await fetch(`/api/files/check?url=${encodeURIComponent(finalUrl)}`)
        const cj = await chk.json().catch(() => ({}))
        if (!cj?.exists) {
          toast({
            title: '파일 없음',
            description: '파일을 찾을 수 없습니다. 관리자에게 재업로드를 요청해 주세요.',
            variant: 'destructive',
          })
          return
        }
      } catch {
        /* ignore */
      }
      window.open(finalUrl, '_blank')
      closeProgressModal()
    } catch (e) {
      console.error('[SiteInfo] open latest progress drawing failed', e)
      toast({ title: '파일을 여는 중 오류가 발생했습니다.', variant: 'destructive' })
    }
  }
  const openLatestProgressInMarkupTool = () => {
    const item = progressModal.item
    if (!item || !currentSite?.id) return
    try {
      const drawingData = {
        id: String(item.id),
        name: String(item.title || '진행도면'),
        title: String(item.title || '진행도면'),
        url: String(item.url),
        size: Number(item.size || 0),
        type: 'progress',
        uploadDate: new Date(),
        isMarked: false,
        source: 'site_documents',
        siteId: currentSite.id,
        siteName: currentSite.name,
      }
      localStorage.setItem('selected_drawing', JSON.stringify(drawingData))
    } catch {
      /* ignore */
    }
    closeProgressModal()
    window.location.href = '/mobile/markup-tool'
  }
  const goToDocumentsForUpload = () => {
    if (!currentSite?.id) return
    const qs = new URLSearchParams({
      tab: 'drawings',
      siteId: currentSite.id,
      category: 'progress',
    })
    closeProgressModal()
    window.location.href = `/mobile/documents?${qs.toString()}`
  }

  // 진행도면: 해당 현장의 최신 progress_drawing으로 연결
  const handleOpenLatestProgressDrawing = async () => {
    try {
      if (!currentSite?.id) {
        toast({ title: '현장 정보가 없습니다.', variant: 'destructive' })
        return
      }

      const params = new URLSearchParams({
        siteId: currentSite.id,
        category: 'progress',
        limit: '1',
        page: '1',
      })

      const res = await fetch(`/api/docs/drawings?${params.toString()}`, { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))

      if (!res.ok || !json?.success) {
        toast({ title: '진행도면을 불러올 수 없습니다.', variant: 'destructive' })
        return
      }

      const item = Array.isArray(json?.data) ? json.data[0] : null

      // Modal UX: 안내/선택을 모달로 처리
      if (!item) {
        setProgressModal(prev => ({ ...prev, open: true, mode: 'empty', item: null }))
        return
      }
      setProgressModal({ open: true, mode: 'choose', item })
      return

      if (!item) {
        const goUpload = window.confirm(
          '해당 현장의 진행도면이 등록되어 있지 않습니다.\n문서함으로 이동하여 진행도면을 업로드하시겠습니까?'
        )
        if (goUpload) {
          const qs = new URLSearchParams({
            tab: 'drawings',
            siteId: currentSite.id,
            category: 'progress',
          })
          window.location.href = `/mobile/documents?${qs.toString()}`
        }
        return
      }

      // 액션 선택: 보기(새 탭) / 마킹 도구 열기
      const openView = window.confirm(
        '최신 진행도면을 새 탭에서 보시겠습니까?\n취소를 누르면 마킹 도구로 이동합니다.'
      )

      // 보기를 선택한 경우: 서명 URL 생성 후 존재 여부 확인 → 새 탭
      if (openView) {
        try {
          let finalUrl: string = item.url
          try {
            const s = await fetch(`/api/files/signed-url?url=${encodeURIComponent(item.url)}`)
            const sj = await s.json().catch(() => ({}))
            finalUrl = sj?.url || item.url
          } catch {
            /* ignore */
          }

          try {
            const chk = await fetch(`/api/files/check?url=${encodeURIComponent(finalUrl)}`)
            const cj = await chk.json().catch(() => ({}))
            if (!cj?.exists) {
              toast({
                title: '파일 없음',
                description: '파일을 찾을 수 없습니다. 관리자에게 재업로드를 요청해 주세요.',
                variant: 'destructive',
              })
              return
            }
          } catch {
            /* ignore */
          }

          window.open(finalUrl, '_blank')
          return
        } catch (e) {
          console.error('[SiteInfo] open latest progress drawing failed', e)
          toast({ title: '파일을 여는 중 오류가 발생했습니다.', variant: 'destructive' })
          return
        }
      }

      // 마킹 도구 이동: 로컬 브리징 후 이동
      try {
        const drawingData = {
          id: String(item.id),
          name: String(item.title || '진행도면'),
          title: String(item.title || '진행도면'),
          url: String(item.url),
          size: Number(item.size || 0),
          type: 'progress',
          uploadDate: new Date(),
          isMarked: false,
          source: 'site_documents',
          siteId: currentSite.id,
          siteName: currentSite.name,
        }
        localStorage.setItem('selected_drawing', JSON.stringify(drawingData))
      } catch {
        /* ignore localStorage errors */
      }

      window.location.href = '/mobile/markup-tool'
    } catch (error) {
      console.error('[SiteInfo] Failed to open latest progress drawing', error)
      toast({ title: '처리 중 오류가 발생했습니다.', variant: 'destructive' })
    }
  }

  const copyToClipboard = (value: string, message: string) => {
    if (!value) return

    navigator.clipboard
      ?.writeText(value)
      .then(() => {
        toast({ title: '복사 완료', description: message, variant: 'success' })
      })
      .catch(() => {
        toast({ title: '복사에 실패했습니다.', variant: 'destructive' })
      })
  }

  const openMapForAddress = async (address?: string | null) => {
    if (!address) return
    await TMap.search(address)
  }

  const closeSiteBottomSheet = () => setShowSiteBottomSheet(false)

  const handleCallContact = (phone?: string) => {
    if (!phone) return
    window.location.href = `tel:${phone}`
  }

  const handleOpenOtherDocuments = () => {
    closeSiteBottomSheet()
    window.location.href = '/mobile/documents'
  }

  const handleOpenWorklogList = () => {
    closeSiteBottomSheet()
    window.location.href = '/mobile/worklog'
  }

  // If navigated with #materials-inventory-section, ensure section is focused/visible after mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    if (hash === '#materials-inventory-section') {
      // Defer to allow content render
      setTimeout(() => {
        const el = document.getElementById('materials-inventory-section')
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    }
  }, [])

  const handleSiteSelection = async (siteId: string) => {
    if (!siteId) return
    if (siteId === currentSite?.id) {
      setShowSiteBottomSheet(true)
      return
    }

    const fallbackSiteInfo =
      siteResults.find(site => site.id === siteId) ||
      displayedSiteResults.find(site => site.id === siteId)

    setIsRefreshing(true)
    setShowSiteBottomSheet(false)
    setShowNpcRecordSheet(false)
    setShowNpcRequestSheet(false)
    setShowNpcLogSheet(false)

    if (fallbackSiteInfo) {
      const fallbackSite: SiteInfoResponse = {
        id: fallbackSiteInfo.id,
        name: fallbackSiteInfo.name,
        address: {
          id: fallbackSiteInfo.id,
          site_id: fallbackSiteInfo.id,
          full_address:
            fallbackSiteInfo.address || currentSite?.address.full_address || '주소 정보 없음',
          latitude: undefined,
          longitude: undefined,
          postal_code: undefined,
        },
        customer_company: currentSite?.customer_company,
        accommodation: currentSite?.accommodation,
        process: currentSite?.process ?? {
          member_name: '미정',
          work_process: '미정',
          work_section: '미정',
        },
        managers: currentSite?.managers ?? [],
        construction_period: fallbackSiteInfo.construction_period ??
          currentSite?.construction_period ?? { start_date: null, end_date: null },
        is_active: fallbackSiteInfo.is_active,
        ptw_document: currentSite?.ptw_document,
        blueprint_document: currentSite?.blueprint_document,
      }

      setCurrentSite(fallbackSite)
      setNpcSummary(null)
      setSiteLaborStats({ totalHours: 0, totalManDays: 0 })
      setNpcTransactions([])
      setNpcLogError(null)
    }

    try {
      await switchCurrentSite(siteId)
      await loadAll({ openSheet: true })
    } catch (error) {
      console.error('[SiteInfo] switch site failed', error)
      setErrorMessage('현장 전환에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsRefreshing(false)
      setShowDetail(false)
    }
  }

  const handleDownload = (file: AttachmentFile) => {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenNpcRecord = () => {
    if (!currentSite) {
      toast({
        title: '현장 정보가 필요합니다.',
        description: '입고/사용 기록을 등록하려면 먼저 현장을 선택해주세요.',
        variant: 'warning',
      })
      return
    }
    setShowNpcRecordSheet(true)
  }

  const handleOpenNpcRequest = () => {
    if (!currentSite) {
      toast({
        title: '현장 정보가 필요합니다.',
        description: '자재 요청은 현장을 선택한 뒤 진행할 수 있습니다.',
        variant: 'warning',
      })
      return
    }
    setShowNpcRequestSheet(true)
  }

  const handleOpenNpcLogs = async () => {
    if (!currentSite) {
      toast({
        title: '현장 정보가 필요합니다.',
        description: '로그를 확인하려면 현장을 선택해주세요.',
        variant: 'warning',
      })
      return
    }

    setShowNpcLogSheet(true)
    await loadNpcLogs(currentSite.id)
  }

  const handleNpcRecordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!currentSite) {
      toast({
        title: '현장 정보 없음',
        description: '현장을 선택한 뒤 다시 시도해주세요.',
        variant: 'warning',
      })
      return
    }

    const quantityValue = Number(recordQuantity)
    if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
      toast({
        title: '올바른 수량을 입력해주세요.',
        description: '입고/사용 수량은 0보다 큰 숫자여야 합니다.',
        variant: 'destructive',
      })
      return
    }

    if (!recordDate) {
      toast({
        title: '기록 일자를 선택해주세요.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmittingRecord(true)
    try {
      const result = await recordInventoryTransaction({
        siteId: currentSite.id,
        materialCode: recordMaterialCode,
        transactionType: recordTransactionType,
        quantity: quantityValue,
        transactionDate: recordDate,
        notes: recordNotes.trim() ? recordNotes.trim() : undefined,
      })

      if (!result?.success) {
        throw new Error(result?.error || '입고 기록을 저장하지 못했습니다.')
      }

      toast({
        title: recordTransactionType === 'in' ? '입고 기록 완료' : '사용 기록 완료',
        description: `${currentSite.name}에 ${quantityValue.toLocaleString()}말 ${recordTransactionType === 'in' ? '입고' : '사용'} 처리되었습니다.`,
        variant: 'success',
      })

      setShowNpcRecordSheet(false)
      await refreshNpcSummary()
      if (showNpcLogSheet) {
        await loadNpcLogs(currentSite.id)
      }
    } catch (error) {
      console.error('[SiteInfo] Failed to save NPC record', error)
      toast({
        title: '기록 저장에 실패했습니다.',
        description: error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmittingRecord(false)
    }
  }

  const handleNpcRequestSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!currentSite) {
      toast({
        title: '현장 정보 없음',
        description: '자재 요청은 현장을 선택한 뒤 진행해주세요.',
        variant: 'warning',
      })
      return
    }

    const quantityValue = Number(requestQuantity)
    if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
      toast({
        title: '올바른 요청 수량이 필요합니다.',
        description: '요청 수량은 0보다 큰 숫자로 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmittingRequest(true)
    try {
      const urgencyLabel =
        requestUrgency === 'normal' ? '일반' : requestUrgency === 'urgent' ? '긴급' : '최우선'
      const combinedNotes = [`[${urgencyLabel}]`, requestNotes.trim()].filter(Boolean).join(' ')

      const result = await createNpcMaterialRequest({
        siteId: currentSite.id,
        materialCode: requestMaterialCode,
        qty: quantityValue,
        requestDate: new Date().toISOString(),
        notes: combinedNotes || undefined,
      })

      if (!result?.success) {
        throw new Error(result?.error || '자재 요청을 저장하지 못했습니다.')
      }

      toast({
        title: '자재 요청이 등록되었습니다.',
        description: `${currentSite.name}에 ${requestMaterialCode} ${quantityValue.toLocaleString()}말 요청이 본사로 전달되었습니다.`,
        variant: 'success',
      })

      setShowNpcRequestSheet(false)
    } catch (error) {
      console.error('[SiteInfo] Failed to submit NPC request', error)
      toast({
        title: '자재 요청 등록에 실패했습니다.',
        description: error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmittingRequest(false)
    }
  }

  const attachmentCategories = useMemo(() => {
    return [
      { key: 'drawings' as const, title: '현장 공도면', files: attachments.drawings },
      { key: 'ptw' as const, title: 'PTW', files: attachments.ptw },
      { key: 'photos' as const, title: '현장 사진', files: attachments.photos },
    ]
  }, [attachments])

  const contactItems = useMemo(() => {
    if (!currentSite) return [] as Array<{ label: string; contact?: ManagerContact }>

    const siteManager = currentSite.managers.find(
      manager => manager.role === 'construction_manager'
    )
    const safetyManager = currentSite.managers.find(manager => manager.role === 'safety_manager')
    const others = currentSite.managers.filter(
      manager => manager.role !== 'construction_manager' && manager.role !== 'safety_manager'
    )

    const items: Array<{ label: string; contact?: ManagerContact }> = [
      { label: '담당자', contact: siteManager },
      { label: '안전', contact: safetyManager },
    ]

    others.forEach(other => {
      items.push({ label: '담당', contact: other })
    })

    return items
  }, [currentSite])

  useEffect(() => {
    if (searchQuery.trim()) {
      setShowAllSites(true)
    } else if (siteResults.length <= DEFAULT_SITE_DISPLAY_COUNT) {
      setShowAllSites(false)
    }
  }, [searchQuery, siteResults.length])

  const accommodationAddress = currentSite?.accommodation?.full_address?.trim() ?? ''
  const workerCount = todayHeadcount

  useEffect(() => {
    if (!showSiteBottomSheet) {
      document.body.style.overflow = ''
      return
    }

    document.body.style.overflow = 'hidden'

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeSiteBottomSheet()
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKey)
    }
  }, [showSiteBottomSheet])

  return (
    <div className="site-container">
      <style jsx>{`
        :root {
          --font: 'Noto Sans KR', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
          --bg: #f5f7fb;
          --card: #ffffff;
          --text: #101828;
          --muted: #667085;
          --brand: #1a254f;
          --brand-ghost: rgba(26, 37, 79, 0.06);
          --blue: #0068fe;
          --border: rgba(16, 24, 40, 0.1);
          --hover: rgba(16, 24, 40, 0.04);
        }

        /* Ensure content is scrollable above fixed BottomNav */
        :global(.mobile-container) {
          padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px) + 12px) !important;
        }

        /* Dark mode variable mapping for this page */
        :global([data-theme='dark']) .site-container {
          --bg: #0f172a;
          --card: #11151b;
          --text: #e9eef5;
          --muted: #a8b0bb;
          --border: #3a4048;
          --hover: rgba(30, 41, 59, 0.5);
        }

        .site-container {
          min-height: 100vh;
          background: var(--bg);
          font-family: var(--font);
          color: var(--text);
          padding: 20px;
          padding-bottom: 80px;
        }

        .site-header {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          margin-bottom: 24px;
        }

        .site-title {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
        }

        .site-info-card,
        .card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(16, 24, 40, 0.1);
        }

        .site-info-card {
          padding: 0;
          border: none;
          box-shadow: none;
        }

        .site-card {
          background: var(--card);
          border-radius: 20px;
          border: 1px solid rgba(26, 37, 79, 0.08);
          padding: 12px; /* match home card padding (p-3 = 12px) */
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
        }

        .site-card .site-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px; /* match home: compact header spacing */
        }

        .site-card .site-title {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #1a254f;
        }

        .site-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* .weather-info removed */

        .site-status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 34px;
          padding: 0 16px;
          border-radius: 16px;
          border: 1px solid #31a3fa;
          background: rgba(49, 163, 250, 0.12);
          color: #1a56db;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .site-status:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(49, 163, 250, 0.25);
        }

        .site-status.active {
          background: rgba(49, 163, 250, 0.2);
        }

        .site-details {
          display: flex;
          flex-direction: column;
          gap: 4px; /* match home: dense rows (space-y-1) */
        }

        .site-info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: transparent;
          padding: 2px 0; /* per-row vertical trim like home */
        }

        .info-label {
          font-size: 14px; /* match home: text-sm */
          line-height: 1.25rem; /* match Tailwind text-sm line-height (20px) */
          font-weight: 400; /* home label default weight */
          color: #6b7280;
          background: transparent;
        }

        .info-value {
          font-size: 14px; /* match home: text-sm */
          line-height: 1.25rem; /* match Tailwind text-sm line-height (20px) */
          font-weight: 500; /* home value default weight */
          color: #1a1a1a;
          background: transparent;
        }

        .info-value-strong {
          font-weight: 600; /* for 현장명 row to match home font-semibold */
        }

        .site-detail-content {
          margin-top: 12px; /* tighter spacing */
          padding-top: 12px; /* tighter spacing */
          border-top: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          gap: 12px; /* tighter spacing */
        }

        .site-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .detail-title {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #1a254f;
        }

        .detail-date-section {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .detail-date {
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
        }

        .update-btn {
          font-size: 14px;
          font-weight: 600;
          color: #1a254f;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 4px 12px;
          cursor: pointer;
        }

        .update-btn:hover {
          background: #e5e7eb;
        }

        .contact-section {
          display: flex;
          flex-direction: column;
          gap: 4px; /* minimize vertical gaps */
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 8px; /* tighter spacing between label/value/buttons */
        }

        .contact-label {
          width: 48px;
          font-size: 16px;
          font-weight: 500;
          color: #6b7280;
        }

        .contact-info {
          flex: 1;
          display: flex;
          justify-content: flex-start;
          align-items: center;
          gap: 6px; /* tighter spacing */
        }

        .contact-name {
          font-size: 16px;
          font-weight: 600;
          color: #1a1a1a;
          /* allow wrap to avoid truncation on small screens */
          max-width: none;
          overflow-wrap: anywhere;
          word-break: break-word;
          white-space: normal;
          line-height: 1.35;
          text-align: left;
        }

        .contact-phone {
          font-size: 16px;
          font-weight: 600;
          color: #1a1a1a;
          text-align: left;
          white-space: nowrap;
        }

        .call-btn {
          width: 52px;
          min-width: 52px;
          font-size: 14px;
          font-weight: 500;
          color: #1a254f;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 2px 6px; /* minimal padding */
          cursor: pointer;
        }

        .call-btn:hover {
          background: #e5e7eb;
        }

        .call-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .address-section {
          display: flex;
          flex-direction: column;
          gap: 6px; /* tighter spacing */
        }

        .address-item {
          display: flex;
          gap: 6px; /* tighter spacing */
          align-items: flex-start;
        }

        .address-label {
          width: 48px;
          font-size: 16px;
          font-weight: 500;
          color: #6b7280;
        }

        .address-info {
          flex: 1;
          display: flex;
          align-items: flex-start;
          justify-content: flex-end;
          gap: 6px; /* tighter spacing */
        }

        .address-text {
          flex: 1;
          font-size: 16px;
          font-weight: 600;
          color: #1a1a1a;
          line-height: 1.4;
          /* allow line wrapping for long addresses */
          white-space: normal;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .address-buttons {
          display: flex;
          flex-direction: column;
          gap: 4px; /* tighter button stack gap */
        }

        .copy-btn,
        .tmap-btn {
          width: 52px;
          min-width: 52px;
          font-size: 14px;
          font-weight: 500;
          color: #1a254f;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 2px 6px; /* minimal padding */
          cursor: pointer;
        }

        .copy-btn:hover,
        .tmap-btn:hover {
          background: #e5e7eb;
        }

        .copy-btn:disabled,
        .tmap-btn:disabled {
          cursor: not-allowed;
          opacity: 0.5;
          background: #f3f4f6;
        }

        .work-info-section {
          margin-top: 8px;
        }

        .work-info-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .work-info-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .work-label {
          font-size: 16px;
          font-weight: 500;
          color: #6b7280;
        }

        .work-value {
          font-size: 16px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .upload-section {
          margin-top: 8px;
        }

        .upload-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .upload-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .upload-label {
          font-size: 16px;
          font-weight: 500;
          color: #6b7280;
        }

        .upload-status {
          font-size: 16px;
          font-weight: 600;
          color: #1a254f;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 12px;
        }

        .btn {
          flex: 1;
          height: 48px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn.btn-secondary {
          border: 1px solid #d1d5db;
          background: #f9fafb;
          color: #374151;
        }

        .btn.btn-secondary:hover {
          background: #f3f4f6;
        }

        .btn.btn-primary {
          border: none;
          background: #1a254f;
          color: #fff;
        }

        .btn.btn-primary:hover {
          background: #142047;
        }

        :global([data-theme='dark'] .site-card) {
          background: rgba(17, 24, 39, 0.92);
          border-color: rgba(148, 163, 184, 0.25);
          box-shadow: 0 20px 48px rgba(2, 6, 23, 0.55);
        }

        :global([data-theme='dark'] .site-card .site-title) {
          color: #f8fafc;
        }

        /* dark .weather-info removed */

        :global([data-theme='dark'] .site-status) {
          border-color: rgba(59, 130, 246, 0.55);
          background: rgba(59, 130, 246, 0.25);
          color: #93c5fd;
        }

        :global([data-theme='dark'] .info-label) {
          color: #94a3b8;
        }

        :global([data-theme='dark'] .info-value) {
          color: #f1f5f9;
        }

        :global([data-theme='dark'] .site-detail-content) {
          border-top-color: rgba(148, 163, 184, 0.25);
        }

        :global([data-theme='dark'] .detail-title) {
          color: #e2e8f0;
        }

        :global([data-theme='dark'] .detail-date) {
          color: #94a3b8;
        }

        :global([data-theme='dark'] .update-btn) {
          background: rgba(30, 41, 59, 0.7);
          border-color: rgba(148, 163, 184, 0.35);
          color: #e2e8f0;
        }

        :global([data-theme='dark'] .contact-name),
        :global([data-theme='dark'] .contact-phone) {
          color: #f1f5f9;
        }

        :global([data-theme='dark'] .call-btn),
        :global([data-theme='dark'] .copy-btn),
        :global([data-theme='dark'] .tmap-btn) {
          background: rgba(30, 41, 59, 0.7);
          border-color: rgba(148, 163, 184, 0.35);
          color: #e2e8f0;
        }

        :global([data-theme='dark'] .address-text) {
          color: #e2e8f0;
        }

        :global([data-theme='dark'] .work-label) {
          color: #94a3b8;
        }

        :global([data-theme='dark'] .work-value) {
          color: #f1f5f9;
        }

        :global([data-theme='dark'] .upload-label) {
          color: #93c5fd;
        }

        :global([data-theme='dark'] .upload-status) {
          color: #bfdbfe;
        }

        :global([data-theme='dark'] .participation-stat) {
          background: rgba(30, 41, 59, 0.6);
          border-color: rgba(148, 163, 184, 0.25);
        }

        :global([data-theme='dark'] .participation-stat .label) {
          color: #cbd5e1;
        }

        :global([data-theme='dark'] .participation-stat .value) {
          color: #f1f5f9;
        }

        :global([data-theme='dark'] .clear-btn) {
          color: #94a3b8;
        }

        :global([data-theme='dark'] .clear-btn:hover) {
          color: #cbd5f5;
        }

        :global([data-theme='dark'] .btn.btn-secondary) {
          border-color: rgba(148, 163, 184, 0.35);
          background: rgba(30, 41, 59, 0.7);
          color: #e2e8f0;
        }

        :global([data-theme='dark'] .btn.btn-primary) {
          background: #0f3460;
        }

        :global([data-theme='dark'] .site-summary-item) {
          background: rgba(15, 23, 42, 0.92);
          border-color: rgba(148, 163, 184, 0.25);
        }

        :global([data-theme='dark'] .site-summary-item:hover) {
          border-color: rgba(148, 163, 184, 0.45);
          box-shadow: 0 18px 36px rgba(2, 6, 23, 0.6);
        }

        :global([data-theme='dark'] .site-summary-title) {
          color: #f8fafc !important;
        }

        :global([data-theme='dark'] .site-summary-tag) {
          color: #bfdbfe !important;
        }

        :global([data-theme='dark'] .site-summary-name) {
          color: #ffffff !important;
        }

        :global([data-theme='dark'] .site-summary-date) {
          color: #e2e8f0 !important;
        }

        :global([data-theme='dark'] .site-summary-status) {
          background: rgba(59, 130, 246, 0.25);
          color: #bfdbfe;
        }

        :global([data-theme='dark'] .site-summary-toggle) {
          color: #bfdbfe;
        }

        :global([data-theme='dark'] .npc-site-trigger) {
          background: rgba(30, 41, 59, 0.7);
          border-color: rgba(148, 163, 184, 0.35);
          color: #e2e8f0;
        }

        :global([data-theme='dark'] .npc-site-empty) {
          border-color: rgba(148, 163, 184, 0.25);
          background: rgba(30, 41, 59, 0.45);
          color: #cbd5f5;
        }

        :global([data-theme='dark'] .site-info-bottomsheet-content) {
          background: rgba(17, 24, 39, 0.95);
          border: 1px solid rgba(148, 163, 184, 0.15);
        }

        :global([data-theme='dark'] .site-info-bottomsheet-title) {
          color: #f1f5f9;
        }

        :global([data-theme='dark'] .site-info-bottomsheet-close) {
          background: rgba(30, 41, 59, 0.55);
          border-color: rgba(148, 163, 184, 0.35);
          color: #e2e8f0;
        }

        :global([data-theme='dark'] .site-info-sheet-summary) {
          background: rgba(30, 41, 59, 0.6);
          border-color: rgba(148, 163, 184, 0.2);
        }

        :global([data-theme='dark'] .site-info-sheet-summary-label) {
          color: #94a3b8;
        }

        :global([data-theme='dark'] .site-info-sheet-summary-value) {
          color: #e2e8f0;
        }

        :global([data-theme='dark'] .site-info-sheet-contact-name) {
          color: #e2e8f0;
        }

        :global([data-theme='dark'] .site-info-sheet-contact-phone) {
          color: #a5b4fc;
        }

        :global([data-theme='dark'] .site-info-sheet-contact-call) {
          border-color: rgba(148, 163, 184, 0.35);
          background: rgba(30, 41, 59, 0.55);
          color: #e2e8f0;
        }

        :global([data-theme='dark'] .site-info-sheet-address-value) {
          color: #f1f5f9;
        }

        :global([data-theme='dark'] .site-info-sheet-address-actions button) {
          border-color: rgba(148, 163, 184, 0.35);
          background: rgba(30, 41, 59, 0.55);
          color: #e2e8f0;
        }

        :global([data-theme='dark'] .site-info-sheet-actions button.ghost) {
          border-color: rgba(148, 163, 184, 0.35);
          background: rgba(30, 41, 59, 0.55);
          color: #e2e8f0;
        }

        :global([data-theme='dark'] .site-info-sheet-actions button.primary) {
          background: #0f3460;
        }

        :global([data-theme='dark'] .npc-site-trigger) {
          background: rgba(30, 41, 59, 0.7);
          border-color: rgba(148, 163, 184, 0.35);
          color: #e2e8f0;
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        /* 참여 현장 섹션 상하간격을 다른 섹션과 동일 수준으로 정렬 */
        .site-search-card .card-header {
          flex-direction: column;
          align-items: stretch;
          gap: 8px; /* was 12px */
          margin-bottom: 8px; /* tighten spacing below header */
        }

        .npc-card-section {
          margin-top: 24px;
        }

        /* NPC 섹션 타이틀을 다른 섹션과 동일한 헤더 스타일로 */
        .npc-card-section .card-header .q {
          font-size: 20px;
          color: #1a254f;
          font-weight: 700;
        }

        .divider {
          width: 100%;
          height: 1px;
          background: var(--border);
          margin: 16px 0;
        }

        .card-header .q {
          font-size: 16px;
          font-weight: 700;
        }

        .site-search-card .card-header .q {
          font-size: 20px;
          color: #1a254f;
        }
        :global([data-theme='dark']) .site-container .site-search-card .card-header .q {
          color: #f8fafc;
        }

        /* WorkLog(작업일지) 페이지의 통계 카드 스타일과 100% 일치 */
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 12px;
        }
        .stat {
          padding: 16px 0;
          border-radius: 14px;
          text-align: center;
          border: 1px solid currentColor;
        }
        .stat .num {
          font-size: 22px;
          font-weight: 700;
          line-height: 1.4;
        }
        .stat .label {
          font-size: 16px;
          font-weight: 600;
          line-height: 1.4;
        }
        .stat-workdays {
          color: #99a4be;
          background-color: rgba(153, 164, 190, 0.05);
          border-color: rgba(153, 164, 190, 0.2);
        }
        .stat-sites {
          color: #31a3fa;
          background-color: rgba(49, 163, 250, 0.05);
          border-color: rgba(49, 163, 250, 0.2);
        }
        .stat-hours {
          color: #1a254f;
          background-color: rgba(26, 37, 79, 0.05);
          border-color: rgba(26, 37, 79, 0.2);
        }
        :global([data-theme='dark']) .stat {
          background: rgba(15, 23, 42, 0.9);
          border-color: var(--attendance-border-dark);
          color: #e9eef5;
        }
        :global([data-theme='dark']) .stat .num {
          color: #f3f4f6;
        }
        :global([data-theme='dark']) .stat .label {
          color: #e5e7eb;
        }

        .card-header .work-date {
          font-size: 14px;
          background: var(--brand-ghost);
          padding: 6px 12px;
          border-radius: 12px;
        }

        .card-header .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .search-bar-container {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px; /* was 16px */
        }

        .search-input-wrapper {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
          background: transparent; /* match partner home */
          border-radius: 0;
          padding: 0;
          min-height: initial;
        }

        /* 검색 아이콘(돋보기) - 입력필드 좌측에 고정 표시 */
        .search-ico {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          width: 18px;
          height: 18px;
          color: #9ca3af;
          pointer-events: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        :global([data-theme='dark']) .site-container .search-ico {
          color: #a8b0bb;
        }

        .search-input-new {
          flex: 1;
          width: 100%;
          height: 40px; /* partner home height */
          padding: 0 12px 0 36px; /* partner home padding (with icon) */
          border: 1px solid var(--line);
          border-radius: 10px;
          background: var(--card);
          outline: none;
          font:
            400 14px 'Noto Sans KR',
            system-ui,
            -apple-system,
            'Segoe UI',
            Roboto,
            sans-serif;
          color: var(--text);
        }
        :global([data-theme='dark']) .site-container .search-input-new {
          background: var(--card);
          border-color: var(--line);
          color: var(--text);
        }
        :global([data-theme='dark']) .site-container .search-input-new::placeholder {
          color: var(--text-muted, #a8b0bb);
        }

        .clear-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border: none;
          background: transparent;
          color: #6b7280;
          cursor: pointer;
        }

        .clear-btn:hover {
          color: #1a254f;
        }

        .cancel-btn {
          border: none;
          background: transparent;
          color: var(--blue);
          font-weight: 600;
          cursor: pointer;
        }

        /* 참여 현장 리스트 — 이전 카드형 레이아웃 복원 */
        .site-summary-list {
          display: flex;
          flex-direction: column;
          background: #f8f9fa;
          border-radius: 12px;
          overflow: hidden;
        }

        .site-summary-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: #fff;
          border-bottom: 1px solid #e9ecef;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .site-summary-item:last-child {
          border-bottom: none;
        }

        .site-summary-item:hover {
          background: #f8f9fa;
        }

        .site-summary-item.selected {
          background: rgba(0, 104, 254, 0.1);
          border-color: rgba(0, 104, 254, 0.2);
        }

        /* 항목 헤더 행: 좌측 제목, 우측 날짜/상태 배치 */
        .site-summary-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          width: 100%;
        }
        .site-summary-main {
          min-width: 0;
          flex: 1 1 auto;
        }
        .site-summary-title {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        .site-summary-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .site-summary-tag {
          color: #6b7280;
          font-weight: 700;
          flex: 0 0 auto;
        }
        .site-summary-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 0 0 auto;
        }
        .site-summary-status {
          padding: 2px 8px;
          border-radius: 9999px;
          background: rgba(0, 104, 254, 0.08);
          color: #0068fe;
          font-size: 12px;
          font-weight: 700;
        }

        .site-summary-title {
          font-size: 15px;
          font-weight: 600;
          color: #1a56db;
        }

        .site-summary-date {
          font-size: 13px;
          color: #6b7280;
        }

        /* 더보기 버튼 - 작업일지 페이지와 동일 스타일 */
        /* 더보기 버튼 — 작업일지 스타일과 100% 동일 + 중앙정렬 보장 */
        .site-search-card .more-button-container {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          text-align: center;
          margin-top: 12px;
          margin-bottom: 16px;
        }
        .site-search-card .more-btn {
          padding: 10px 28px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--card);
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
          box-shadow: none;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .site-search-card .more-btn:hover {
          background: #f8faff;
        }

        .site-summary-item.selected {
          background: transparent;
          border: none;
          border-bottom: 1px solid var(--line);
          box-shadow: none;
        }
        :global([data-theme='dark']) .site-container .site-summary-item.selected {
          background: transparent;
          border: none;
          border-bottom: 1px solid var(--line);
          box-shadow: none;
        }

        .site-summary-header {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
          justify-content: space-between;
        }

        .site-summary-main {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .site-summary-title {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          line-height: 1.25;
          color: #1a254f;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .site-summary-tag {
          font-weight: 600;
          color: #1a254f;
          flex-shrink: 0;
        }

        .site-summary-name {
          font-weight: 600;
          color: #1a254f;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .site-summary-date {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        .site-summary-status {
          padding: 3px 8px;
          border-radius: 9999px;
          background: rgba(26, 86, 219, 0.12);
          color: #1a56db;
          font-size: 11px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .site-summary-right {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .site-summary-actions {
          margin-top: 8px;
          text-align: center;
        }

        .site-summary-toggle {
          border: none;
          background: transparent;
          color: #1a56db;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .site-info-bottomsheet {
          position: fixed;
          inset: 0;
          z-index: 1300;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .site-info-bottomsheet-overlay {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
        }

        .site-info-bottomsheet-content {
          position: relative;
          width: min(640px, 100%);
          background: var(--card);
          border-radius: 28px 28px 0 0;
          padding: 28px 24px 32px;
          box-shadow: 0 -18px 48px rgba(15, 23, 42, 0.18);
          max-height: 90vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .site-info-bottomsheet-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .site-info-bottomsheet-title {
          font-size: 20px;
          font-weight: 800;
          margin: 0;
          color: #0f172a;
        }

        .site-info-bottomsheet-close {
          border: 1px solid #d8ddef;
          background: #f5f7fb; /* match phone button */
          color: #1a254f;
          font-size: 14px;
          font-weight: 700;
          padding: 6px 14px; /* match phone button */
          border-radius: 12px; /* match phone button */
          cursor: pointer;
          line-height: 1.2;
          transition: all 0.2s ease;
        }

        .site-info-sheet-summary {
          background: #f5f7fb;
          border: 1px solid #e4e8f4;
          border-radius: 18px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .site-info-sheet-summary-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          font-size: 15px;
        }

        .site-info-sheet-summary-label {
          color: #6b7280;
          font-weight: 600;
        }

        .site-info-sheet-summary-value {
          color: #111c44;
          font-weight: 700;
          text-align: right;
        }

        .site-info-sheet-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .site-info-sheet-contact {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .site-info-sheet-contact-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .site-info-sheet-contact-label {
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
        }

        .site-info-sheet-contact-name {
          font-size: 15px;
          font-weight: 700;
          color: #111827;
        }

        .site-info-sheet-contact-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .site-info-sheet-contact-phone {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }

        .site-info-sheet-contact-call {
          border: 1px solid #d8ddef;
          background: #f5f7fb;
          color: #1a254f;
          border-radius: 12px;
          padding: 6px 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .site-info-sheet-contact-call:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .site-info-sheet-address-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .site-info-sheet-address-meta {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .site-info-sheet-address-label {
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
        }

        .site-info-sheet-address-value {
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          line-height: 1.4;
          word-break: keep-all;
        }

        .site-info-sheet-address-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .site-info-sheet-address-actions button {
          border: 1px solid #d8ddef;
          background: #f5f7fb; /* match phone button */
          color: #1a254f;
          font-weight: 700;
          padding: 6px 14px; /* match phone button */
          border-radius: 12px; /* match phone button */
          cursor: pointer;
          min-width: 0; /* align with phone button width behavior */
        }

        .site-info-sheet-address-actions button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .site-info-sheet-actions {
          display: flex;
          gap: 12px;
          margin-top: 4px;
        }

        .site-info-sheet-actions button {
          flex: 1;
          border-radius: 14px;
          height: 52px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
        }

        .site-info-sheet-actions button.ghost {
          border: 1px solid #d8ddef;
          background: #f5f7fb;
          color: #1a254f;
        }

        .site-info-sheet-actions button.primary {
          border: none;
          background: #1a254f;
          color: #fff;
        }

        @media (max-width: 480px) {
          .site-info-bottomsheet-content {
            padding: 24px 18px 28px;
          }

          .site-info-sheet-address-actions {
            flex-direction: row;
          }
        }

        .site-summary-toggle:hover {
          text-decoration: underline;
        }

        /* 내부 래퍼(.npc-card)의 테두리/배경 제거 — 외부 섹션(card)만 유지 */
        .npc-card {
          background: transparent;
          border: none;
          border-radius: 0;
          padding: 0;
        }

        .npc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .npc-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 700;
        }

        .npc-site-filter {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .npc-site-trigger {
          width: min(100%, 320px); /* let PhSelectTrigger provide visuals */
        }

        .npc-site-trigger[data-disabled='true'] {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .npc-site-content {
          min-width: 220px;
          max-height: 280px; /* 긴 목록도 스크롤로 모두 접근 가능 */
          overflow-y: auto;
        }

        .npc-site-item {
          font-size: 14px;
        }

        .npc-site-empty {
          width: min(100%, 320px);
          padding: 12px 16px;
          border-radius: 14px;
          border: 1px dashed #d1d5db;
          background: #f9fafb;
          font-size: 14px;
          color: #6b7280;
        }

        /* NPC-1000 KPI — 이전 그리드형 카드 복원 */
        .npc-kpi {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .npc-kpi-item {
          background: var(--brand-ghost);
          border-radius: 12px;
          padding: 14px;
          text-align: center;
        }
        /* Dark mode KPI base */
        :global([data-theme='dark']) .site-container .npc-kpi-item {
          background: #11151b;
          border-color: var(--border);
        }

        .npc-kpi-value {
          font-size: 22px;
          font-weight: 700;
          line-height: 1.4;
          margin: 0;
        }
        :global([data-theme='dark']) .site-container .npc-kpi-value {
          color: #f1f5f9;
        }

        .npc-kpi-label {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          line-height: 1.4;
        }
        :global([data-theme='dark']) .site-container .npc-kpi-label {
          color: #cbd5e1;
        }

        .npc-kpi-item--incoming {
          background: #f7f9ff;
          border-color: #ccd4e6;
        }
        :global([data-theme='dark']) .site-container .npc-kpi-item--incoming {
          background: rgba(30, 41, 59, 0.6);
          border-color: rgba(148, 163, 184, 0.35);
        }

        .npc-kpi-item--incoming .npc-kpi-value {
          color: #667085;
        }
        :global([data-theme='dark']) .site-container .npc-kpi-item--incoming .npc-kpi-value {
          color: #e2e8f0;
        }

        .npc-kpi-item--incoming .npc-kpi-label {
          color: #98a2b3;
        }
        :global([data-theme='dark']) .site-container .npc-kpi-item--incoming .npc-kpi-label {
          color: #cbd5e1;
        }

        .npc-kpi-item--usage {
          background: #f1f8ff;
          border-color: #3b82f6;
        }
        :global([data-theme='dark']) .site-container .npc-kpi-item--usage {
          background: rgba(30, 41, 59, 0.6);
          border-color: #2563eb;
        }

        .npc-kpi-item--usage .npc-kpi-value {
          color: #0d8af5;
        }
        :global([data-theme='dark']) .site-container .npc-kpi-item--usage .npc-kpi-value {
          color: #93c5fd;
        }

        .npc-kpi-item--usage .npc-kpi-label {
          color: #3b82f6;
        }
        :global([data-theme='dark']) .site-container .npc-kpi-item--usage .npc-kpi-label {
          color: #60a5fa;
        }

        .npc-kpi-item--stock {
          background: #f5f6fb;
          border-color: #1f2b5c;
        }
        :global([data-theme='dark']) .site-container .npc-kpi-item--stock {
          background: rgba(30, 41, 59, 0.6);
          border-color: #475569;
        }

        .npc-kpi-item--stock .npc-kpi-value {
          color: #1f2b5c;
        }
        :global([data-theme='dark']) .site-container .npc-kpi-item--stock .npc-kpi-value {
          color: #e2e8f0;
        }

        .npc-kpi-item--stock .npc-kpi-label {
          color: #1f2b5c;
        }
        :global([data-theme='dark']) .site-container .npc-kpi-item--stock .npc-kpi-label {
          color: #cbd5e1;
        }

        .npc-buttons {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          width: 100%;
        }

        .npc-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          height: 48px;
          font-weight: 700;
          border: 1px solid var(--border);
          background: var(--card);
          cursor: pointer;
          transition:
            background-color 0.2s ease,
            border-color 0.2s ease,
            color 0.2s ease;
          width: 100%;
          min-width: 0;
          white-space: nowrap;
        }

        /* Variants */
        .npc-btn-primary {
          background: #0068fe;
          border-color: #0068fe;
          color: #fff;
        }
        .npc-btn-primary:hover {
          background: #0057d6;
          border-color: #0057d6;
        }

        .npc-btn-ghost {
          background: rgba(49, 163, 250, 0.1);
          border-color: rgba(49, 163, 250, 0.3);
          color: #0068fe;
        }
        .npc-btn-ghost:hover {
          background: rgba(49, 163, 250, 0.15);
        }

        .npc-btn-white {
          background: #fff;
          border-color: var(--border);
          color: var(--text);
        }
        .npc-btn-white:hover {
          background: #f8fafc;
        }

        /* Dark theme variants */
        :global([data-theme='dark']) .site-container .npc-btn {
          border-color: var(--line);
          background: var(--card);
          color: var(--text);
        }
        :global([data-theme='dark']) .site-container .npc-btn-primary {
          background: #2f6bff;
          border-color: #2f6bff;
          color: #fff;
        }
        :global([data-theme='dark']) .site-container .npc-btn-ghost {
          background: rgba(49, 163, 250, 0.2);
          border-color: rgba(49, 163, 250, 0.35);
          color: #8fb3ff;
        }

        .npc-btn:hover {
          background: var(--hover);
        }

        .npc-btn-ghost {
          background: #f3f4f6;
          color: #374151;
          border-color: #d1d5db;
        }

        .npc-btn-ghost:hover {
          background: #e5e7eb;
          border-color: #9ca3af;
        }

        .npc-btn-primary {
          background: #1a254f;
          color: #fff;
          border-color: #1a254f;
        }

        /* White variant specifically for '로그 보기' */
        .npc-btn-white {
          background: #ffffff;
          color: #1a254f;
          border-color: #d1d5db;
        }
        .npc-btn-white:hover {
          background: #f5f7fb;
          border-color: #9ca3af;
        }

        :global([data-theme='dark'] .npc-card .npc-btn-ghost) {
          background: #374151;
          color: #e5e7eb;
          border-color: #4b5563;
        }

        :global([data-theme='dark'] .npc-card .npc-btn-ghost:hover) {
          background: #4b5563;
          border-color: #6b7280;
        }

        .npc-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1200;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 0 16px 16px;
          background: rgba(17, 24, 39, 0.45);
          backdrop-filter: blur(4px);
        }

        .npc-modal {
          width: min(520px, 100%);
          max-height: 82vh;
          background: var(--card);
          border-radius: 24px 24px 0 0;
          border: 1px solid rgba(209, 213, 219, 0.5);
          box-shadow: 0 -24px 60px rgba(15, 23, 42, 0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: npcSheetSlideUp 0.32s ease-out;
        }

        @keyframes npcSheetSlideUp {
          from {
            transform: translateY(28px);
            opacity: 0;
          }

          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .npc-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 20px 24px 16px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.7);
        }

        .npc-request-modal {
          max-width: 460px;
        }

        .npc-request-header {
          align-items: flex-start;
          gap: 14px;
        }

        .npc-request-headline {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .npc-request-subtitle {
          margin: 0;
          font-size: 13px;
          color: #6b7280;
          letter-spacing: -0.01em;
        }

        .npc-modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
        }

        .npc-modal-close {
          border: none;
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          border-radius: 999px;
          transition: background 0.2s ease;
        }

        .npc-modal-close:hover {
          background: rgba(16, 24, 40, 0.06);
          color: var(--text);
        }

        .npc-modal-body {
          padding: 20px 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
        }

        .npc-request-body {
          gap: 14px;
        }

        .npc-request-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        @media (max-width: 420px) {
          .npc-request-grid {
            grid-template-columns: 1fr;
          }
          .npc-request-input,
          .npc-request-trigger {
            max-width: 100%;
            min-width: 100%;
          }
        }

        .npc-modal-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .modal-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--muted);
        }

        .modal-value {
          font-size: 15px;
          font-weight: 600;
          color: var(--text);
        }

        .modal-input,
        .modal-select,
        .modal-textarea {
          width: 100%;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 15px;
          font-family: inherit;
          background: #f8fafc;
          color: var(--text);
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .npc-request-input {
          max-width: 180px;
        }

        .npc-request-trigger {
          min-width: 160px;
        }

        .npc-request-textarea {
          min-height: 88px;
        }

        .modal-select {
          appearance: none;
          background-image:
            linear-gradient(45deg, transparent 50%, #94a3b8 50%),
            linear-gradient(135deg, #94a3b8 50%, transparent 50%);
          background-position:
            calc(100% - 18px) calc(50% - 3px),
            calc(100% - 12px) calc(50% - 3px);
          background-size:
            6px 6px,
            6px 6px;
          background-repeat: no-repeat;
        }

        .modal-textarea {
          resize: vertical;
          min-height: 96px;
        }

        .modal-input:focus,
        .modal-select:focus,
        .modal-textarea:focus {
          border-color: var(--blue);
          outline: none;
          box-shadow: 0 0 0 3px rgba(0, 104, 254, 0.15);
        }

        :global(.modal-select-trigger) {
          background: #f8fafc !important;
          border-radius: 12px !important;
          border: 1px solid var(--border) !important;
          color: var(--text) !important;
          font-size: 15px !important;
          font-weight: 600 !important;
          height: 48px !important;
          padding: 12px 14px !important;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        :global(.modal-select-trigger:hover) {
          border-color: rgba(16, 24, 40, 0.2) !important;
        }

        :global(.modal-select-trigger:focus-visible),
        :global(.modal-select-trigger[data-state='open']) {
          outline: none !important;
          border-color: var(--blue) !important;
          box-shadow: 0 0 0 3px rgba(0, 104, 254, 0.15) !important;
        }

        :global(.modal-select-content) {
          background: var(--card) !important;
          border: 1px solid var(--border) !important;
          color: var(--text) !important;
        }

        :global(.modal-select-item) {
          font-size: 14px !important;
          font-weight: 600 !important;
          color: var(--text) !important;
        }

        :global(.modal-select-item[data-state='checked']) {
          background: rgba(0, 104, 254, 0.08) !important;
          color: var(--blue) !important;
        }

        .npc-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding-top: 8px;
        }

        .npc-request-actions {
          justify-content: flex-end;
        }

        .modal-secondary-button,
        .modal-primary-button {
          min-width: 110px;
          height: 44px;
          border-radius: 12px;
          font-weight: 600;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .modal-secondary-button {
          background: transparent;
          border-color: var(--border);
          color: var(--text);
        }

        .modal-secondary-button:hover {
          background: var(--hover);
        }

        .modal-primary-button {
          background: var(--blue);
          color: #fff;
          border-color: var(--blue);
        }

        .modal-primary-button:hover {
          background: rgba(0, 104, 254, 0.85);
        }

        .npc-request-submit {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 140px;
          height: 44px;
          background: #1a254f;
          border-color: #1a254f;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          border-radius: 12px;
          padding: 0 18px;
          transition: background 0.2s ease;
        }

        .npc-request-submit:hover {
          background: #131a3b;
          border-color: #131a3b;
        }

        .modal-secondary-button:disabled,
        .modal-primary-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .npc-log-modal .npc-modal-header {
          align-items: flex-start;
          padding-bottom: 12px;
        }

        .npc-log-title-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .npc-log-site {
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
        }

        .npc-log-summary {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          margin-left: auto;
          font-size: 12px;
          color: #6b7280;
        }

        .npc-log-summary-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
          text-align: left;
        }

        .npc-log-summary-item strong {
          font-size: 16px;
          color: #1a254f;
        }

        .npc-log-body {
          padding: 0 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .npc-record-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        @media (max-width: 480px) {
          .npc-record-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 380px) {
          .npc-record-grid {
            grid-template-columns: 1fr;
          }
        }

        .npc-record-input {
          max-width: 160px;
        }

        .npc-record-trigger {
          min-width: 140px;
        }

        .npc-record-date {
          min-width: 140px;
        }

        .npc-record-actions {
          justify-content: flex-end;
        }

        .npc-record-submit {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 132px;
          height: 44px;
          border-radius: 12px;
          font-weight: 600;
          background: #1a254f;
          border: 1px solid #1a254f;
          color: #fff;
          transition: background 0.2s ease;
        }

        .npc-record-submit:hover {
          background: #131a3b;
          border-color: #131a3b;
        }

        .npc-log-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 52vh;
          overflow-y: auto;
          padding-right: 4px;
        }

        .npc-log-entry {
          background: #f8f9fb;
          border: 1px solid rgba(209, 213, 219, 0.7);
          border-radius: 18px;
          padding: 14px 16px 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .npc-log-entry-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .npc-log-entry-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #6b7280;
        }

        .npc-log-entry-date {
          font-weight: 600;
          color: #1f2937;
        }

        .npc-log-entry-type {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 52px;
          height: 24px;
          padding: 0 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: -0.02em;
          text-transform: uppercase;
        }

        .npc-log-entry-type-in {
          background: rgba(13, 138, 245, 0.12);
          color: #0d8af5;
        }

        .npc-log-entry-type-out {
          background: rgba(220, 38, 38, 0.12);
          color: #dc2626;
        }

        .npc-log-entry-quantity {
          display: flex;
          align-items: baseline;
          gap: 4px;
          font-weight: 700;
          color: #1a254f;
          font-size: 18px;
        }

        .npc-log-entry-quantity-unit {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
        }

        .npc-log-entry-site {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #4b5563;
        }

        .npc-log-entry-site-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 24px;
          border-radius: 999px;
          background: rgba(26, 37, 79, 0.08);
          color: #1a254f;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 0.02em;
        }

        .npc-log-entry-site-name {
          font-weight: 600;
        }

        .npc-log-entry-note {
          font-size: 13px;
          line-height: 1.45;
          color: #6b7280;
          background: rgba(148, 163, 184, 0.12);
          padding: 10px 12px;
          border-radius: 12px;
        }

        .npc-log-empty {
          padding: 36px 16px;
          text-align: center;
          font-size: 14px;
          color: #98a2b3;
        }

        :global([data-theme='dark'] .npc-modal) {
          background: #111827;
          border-color: rgba(148, 163, 184, 0.18);
          box-shadow: 0 24px 60px rgba(2, 6, 23, 0.6);
        }

        :global([data-theme='dark'] .npc-modal-close:hover) {
          background: rgba(148, 163, 184, 0.15);
          color: #e2e8f0;
        }

        :global([data-theme='dark'] .npc-modal .modal-label) {
          color: #94a3b8;
        }

        :global([data-theme='dark'] .npc-modal .modal-value) {
          color: #e2e8f0;
        }

        :global([data-theme='dark'] .npc-modal .modal-input),
        :global([data-theme='dark'] .npc-modal .modal-select),
        :global([data-theme='dark'] .npc-modal .modal-textarea) {
          background: rgba(30, 41, 59, 0.65);
          border-color: rgba(148, 163, 184, 0.25);
          color: #e2e8f0;
        }

        :global([data-theme='dark'] .npc-modal .modal-input:focus),
        :global([data-theme='dark'] .npc-modal .modal-select:focus),
        :global([data-theme='dark'] .npc-modal .modal-textarea:focus) {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
        }

        :global([data-theme='dark'] .modal-select-trigger) {
          background: rgba(30, 41, 59, 0.65) !important;
          border-color: rgba(148, 163, 184, 0.25) !important;
          color: #e2e8f0 !important;
        }

        :global([data-theme='dark'] .modal-select-trigger:focus-visible),
        :global([data-theme='dark'] .modal-select-trigger[data-state='open']) {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25) !important;
        }

        :global([data-theme='dark'] .modal-select-content) {
          background: #111827 !important;
          border-color: rgba(148, 163, 184, 0.25) !important;
          color: #e2e8f0 !important;
        }

        :global([data-theme='dark'] .modal-select-item) {
          color: #e2e8f0 !important;
        }

        :global([data-theme='dark'] .modal-select-item[data-state='checked']) {
          background: rgba(59, 130, 246, 0.2) !important;
          color: #93c5fd !important;
        }

        :global([data-theme='dark'] .npc-request-modal) {
          background: #111827;
        }

        :global([data-theme='dark'] .npc-request-subtitle) {
          color: #94a3b8;
        }

        :global([data-theme='dark'] .npc-request-input) {
          background: rgba(30, 41, 59, 0.65);
        }

        :global([data-theme='dark'] .npc-request-submit) {
          background: #0f172a;
          border-color: #0f172a;
        }

        :global([data-theme='dark'] .npc-request-submit:hover) {
          background: #111c35;
          border-color: #111c35;
        }

        :global([data-theme='dark'] .npc-record-grid .modal-input),
        :global([data-theme='dark'] .npc-record-grid .modal-select) {
          background: rgba(30, 41, 59, 0.65);
        }

        :global([data-theme='dark'] .npc-record-submit) {
          background: #0f172a;
          border-color: #0f172a;
        }

        :global([data-theme='dark'] .npc-record-submit:hover) {
          background: #111c35;
          border-color: #111c35;
        }

        :global([data-theme='dark'] .npc-modal.npc-log-modal) {
          background: #111827;
          border-color: rgba(148, 163, 184, 0.25);
        }

        :global([data-theme='dark'] .npc-log-site) {
          color: #94a3b8;
        }

        :global([data-theme='dark'] .npc-log-summary-item strong) {
          color: #93c5fd;
        }

        :global([data-theme='dark'] .npc-log-entry) {
          background: rgba(30, 41, 59, 0.65);
          border-color: rgba(148, 163, 184, 0.22);
        }

        :global([data-theme='dark'] .npc-log-entry-date) {
          color: #e2e8f0;
        }

        :global([data-theme='dark'] .npc-log-entry-quantity) {
          color: #93c5fd;
        }

        :global([data-theme='dark'] .npc-log-entry-quantity-unit) {
          color: #cbd5f5;
        }

        :global([data-theme='dark'] .npc-log-entry-site-badge) {
          background: rgba(148, 163, 184, 0.25);
          color: #e2e8f0;
        }

        :global([data-theme='dark'] .npc-log-entry-site-name) {
          color: #e2e8f0;
        }

        :global([data-theme='dark'] .npc-log-entry-note) {
          background: rgba(59, 130, 246, 0.12);
          color: #bfdbfe;
        }

        :global([data-theme='dark'] .npc-log-empty) {
          color: #94a3b8;
        }

        .attachment-popup-overlay,
        .modal,
        .fullscreen-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          z-index: 1000;
        }

        .attachment-popup {
          background: var(--card);
          border-radius: 16px;
          width: min(700px, 100%);
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .attachment-popup-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px;
          border-bottom: 1px solid var(--border);
        }

        .attachment-popup-body {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
        }

        .attachment-category {
          margin-bottom: 24px;
        }

        .attachment-category[data-active='true'] {
          border: 1px solid var(--blue);
          border-radius: 12px;
          padding: 12px;
          background: rgba(0, 104, 254, 0.05);
        }

        .attachment-category-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 12px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 8px;
        }

        .attachment-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .attachment-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--bg);
        }

        .attachment-info {
          flex: 1;
        }

        .attachment-name {
          font-size: 14px;
          font-weight: 600;
        }

        .attachment-meta {
          font-size: 12px;
          color: var(--muted);
        }

        .no-files {
          padding: 24px;
          text-align: center;
          border: 1px dashed var(--border);
          border-radius: 10px;
          color: var(--muted);
        }

        .modal-content {
          background: var(--card);
          border-radius: 16px;
          padding: 24px;
          width: min(520px, 100%);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .fullscreen-modal-content {
          background: var(--card);
          border-radius: 16px;
          padding: 16px;
          width: min(900px, 100%);
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }

        @media (max-width: 768px) {
          .site-container {
            padding: 16px;
          }

          .detail-grid {
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          }

          .search-bar-container {
            flex-direction: column;
            align-items: stretch;
          }

          .participation-stats {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 6px;
          }

          .participation-stat {
            min-height: 46px;
            padding: 6px 4px;
          }

          .participation-stat .label {
            font-size: 11px;
          }

          .participation-stat .value {
            font-size: 16px;
          }

          .site-summary-item {
            padding: 14px 14px;
          }

          .site-summary-title {
            gap: 4px;
          }
        }

        @media (max-width: 480px) {
          .site-summary-item {
            padding: 12px;
            gap: 10px;
          }

          .site-summary-header {
            align-items: flex-start;
            gap: 10px;
          }

          .participation-stat {
            min-height: 42px;
            padding: 6px 3px;
          }

          .participation-stat .value {
            font-size: 15px;
          }

          .site-summary-footer {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }

          .site-summary-address {
            white-space: normal;
          }
        }

        /* Progress Modal */
        .progress-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1400;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(17, 24, 39, 0.45);
          padding: 16px;
          animation: fadeIn 0.2s ease-out;
        }
        .progress-modal {
          width: min(420px, 92%);
          background: var(--card);
          border-radius: 16px;
          border: 1px solid rgba(209, 213, 219, 0.6);
          box-shadow: 0 24px 60px rgba(2, 6, 23, 0.25);
          padding: 16px;
          animation: modalPop 0.24s ease-out;
        }
        .progress-modal-title {
          font-weight: 700;
          font-size: 18px;
          margin-bottom: 8px;
        }
        .progress-modal-desc {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 16px;
        }
        .progress-modal-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        .modal-btn {
          height: 40px;
          padding: 0 12px;
          border-radius: 10px;
          border: 1px solid #d1d5db;
          background: #fff;
          font-weight: 600;
        }
        .modal-btn-ghost {
          background: #f3f4f6;
        }
        .modal-btn-primary {
          border-color: #1a254f;
          background: #1a254f;
          color: #fff;
          font-weight: 700;
        }

        @keyframes modalPop {
          from {
            transform: translateY(8px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        :global([data-theme='dark'] .progress-modal) {
          background: #111827;
          border-color: rgba(148, 163, 184, 0.22);
          box-shadow: 0 24px 60px rgba(2, 6, 23, 0.6);
        }
        :global([data-theme='dark'] .progress-modal-desc) {
          color: #94a3b8;
        }
        :global([data-theme='dark'] .modal-btn) {
          border-color: rgba(148, 163, 184, 0.3);
          background: #0b1220;
          color: #e2e8f0;
        }
        :global([data-theme='dark'] .modal-btn-ghost) {
          background: rgba(30, 41, 59, 0.6);
        }
        :global([data-theme='dark'] .modal-btn-primary) {
          background: #0f172a;
          border-color: #0f172a;
        }
      `}</style>
      {/* 전역 강제 오버라이드: 빌드/캐시 상황에서도 확실히 반영되도록 높은 특이성과 !important 사용 */}
      <style jsx global>{`
        /* 참여 현장 리스트 - 카드형 컨테이너/아이템 복원 */
        .site-container .site-search-card .site-summary-list {
          display: flex !important;
          flex-direction: column !important;
          background: #f8f9fa !important;
          border-radius: 12px !important;
          overflow: hidden !important;
        }
        .site-container .site-search-card .site-summary-item {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 16px 20px !important;
          background: #fff !important;
          border-bottom: 1px solid #e9ecef !important;
          cursor: pointer !important;
          transition: background 0.2s ease !important;
        }
        .site-container .site-search-card .site-summary-item:last-child {
          border-bottom: none !important;
        }
        .site-container .site-search-card .site-summary-item:hover {
          background: #f8f9fa !important;
        }
        .site-container .site-search-card .site-summary-item.selected {
          background: rgba(0, 104, 254, 0.1) !important;
          border-color: rgba(0, 104, 254, 0.2) !important;
        }
        .site-container .site-search-card .site-summary-header {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 8px !important;
          width: 100% !important;
        }
        .site-container .site-search-card .site-summary-main {
          min-width: 0 !important;
          flex: 1 1 auto !important;
        }
        .site-container .site-search-card .site-summary-title {
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
          overflow: hidden !important;
          white-space: nowrap !important;
          text-overflow: ellipsis !important;
        }
        .site-container .site-search-card .site-summary-name {
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }
        .site-container .site-search-card .site-summary-right {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
        }
        .site-container .site-search-card .site-summary-date {
          font-size: 13px !important;
          color: #6b7280 !important;
        }
        .site-container .site-search-card .site-summary-status {
          padding: 2px 8px !important;
          border-radius: 9999px !important;
          background: rgba(0, 104, 254, 0.08) !important;
          color: #0068fe !important;
          font-size: 12px !important;
          font-weight: 700 !important;
        }

        /* NPC-1000 KPI - 3등분 그리드 카드 복원 */
        .site-container .npc-card .npc-kpi {
          display: grid !important;
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          gap: 12px !important;
          margin-bottom: 16px !important;
        }
        /* NPC 섹션 컨테이너를 카드와 동일하게 보이도록 보강 */
        .site-container .npc-card-section {
          background: var(--card) !important;
          border: 1px solid var(--border) !important;
          border-radius: 16px !important;
        }
        .site-container .npc-card-section .card-header {
          margin-bottom: 12px !important;
        }
        .site-container .npc-card .npc-kpi-item {
          background: rgba(26, 37, 79, 0.06) !important;
          border-radius: 12px !important;
          padding: 14px !important;
          text-align: center !important;
        }
        .site-container .npc-card .npc-kpi-label {
          font-size: 16px !important;
          font-weight: 600 !important;
          line-height: 1.4 !important;
          color: var(--muted) !important;
        }
        .site-container .npc-card .npc-kpi-value {
          font-size: 22px !important;
          font-weight: 700 !important;
          line-height: 1.4 !important;
          margin: 0 !important;
        }

        /* 자재 재고관리 하단 버튼 — 텍스트로 보이지 않도록 확실한 버튼 스타일 강제 */
        .site-container .npc-card .npc-buttons .npc-btn {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          height: 48px !important;
          border-radius: 12px !important;
          border: 1px solid var(--border) !important;
          background: var(--card) !important;
          font-weight: 700 !important;
          color: var(--text) !important;
          padding: 0 10px !important;
          text-decoration: none !important;
          cursor: pointer !important;
        }
        .site-container .npc-card .npc-buttons .npc-btn:hover {
          background: #f8faff !important;
        }
        /* 1행 3열 레이아웃 강제 */
        .site-container .npc-card .npc-buttons {
          display: grid !important;
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          gap: 8px !important;
          width: 100% !important;
        }
      `}</style>

      {/* 상단 페이지 제목 제거 요청으로 비노출 */}

      {errorMessage && (
        <div
          className="card"
          style={{ color: '#ef4444', display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          <div>{errorMessage}</div>
          {isSessionExpired && (
            <div>
              <button
                className="action-btn"
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
                onClick={() => {
                  window.location.href = '/auth/login'
                }}
              >
                다시 로그인하기
              </button>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="card">현장 정보를 불러오는 중입니다...</div>
      ) : currentSite ? (
        <div className="site-info-card" role="region" aria-label="현장 정보">
          <div className="site-card">
            <div className="site-header">
              <h3 className="site-title">현장 정보</h3>
              <div className="site-header-right">
                <button
                  type="button"
                  className={`site-status${showDetail ? ' active' : ''}`}
                  onClick={() => setShowDetail(prev => !prev)}
                  aria-expanded={showDetail}
                  aria-controls="site-detail-panel"
                >
                  {showDetail ? '접기' : '상세'}
                </button>
              </div>
            </div>

            <div className="site-details">
              <div className="site-info-item">
                <span className="info-label">소속</span>
                <span className="info-value">
                  {currentSite.customer_company?.company_name?.trim() || '미배정 상태'}
                </span>
              </div>
              <div className="site-info-item">
                <span className="info-label">현장명</span>
                <span className="info-value info-value-strong" title={currentSite.name}>
                  {currentSite.name}
                </span>
              </div>
              <div className="site-info-item">
                <span className="info-label">작업일</span>
                <span className="info-value">{formatDateDisplay(todayDisplay)}</span>
              </div>
              <div className="site-info-item">
                <span className="info-label">출력인원</span>
                <span className="info-value">{todayHeadcount}명</span>
              </div>
            </div>

            {/* 통계 카드 제거 요청에 따라 미노출 */}

            {showDetail && (
              <div
                id="site-detail-panel"
                className="site-detail-content"
                role="region"
                aria-label="현장 상세 정보"
              >
                <div className="site-detail-header">
                  <h4 className="detail-title">상세정보</h4>
                  <div className="detail-date-section">
                    <span className="detail-date">{formatDateDisplay(todayISO())}</span>
                    <button type="button" className="update-btn" onClick={() => loadAll()}>
                      새로고침
                    </button>
                  </div>
                </div>

                <div className="contact-section">
                  {contactItems.map((item, index) => (
                    <div
                      className="contact-item"
                      key={`${item.label}-${item.contact?.phone ?? index}`}
                    >
                      <div className="contact-label">{item.label}</div>
                      <div className="contact-info">
                        <span className="contact-name">{item.contact?.name || '-'}</span>
                        <span className="contact-phone">{item.contact?.phone || '-'}</span>
                      </div>
                      <button
                        type="button"
                        className="call-btn"
                        onClick={() =>
                          item.contact?.phone &&
                          (window.location.href = `tel:${item.contact.phone}`)
                        }
                        disabled={!item.contact?.phone}
                      >
                        전화
                      </button>
                    </div>
                  ))}
                </div>

                <div className="address-section" role="group" aria-label="주소 정보">
                  <div className="address-item">
                    <div className="address-label">주소</div>
                    <div className="address-info">
                      <span className="address-text">
                        {currentSite.address.full_address || '-'}
                      </span>
                      <div className="address-buttons">
                        <button
                          type="button"
                          className="copy-btn"
                          onClick={() =>
                            currentSite.address.full_address &&
                            copyToClipboard(
                              currentSite.address.full_address,
                              '현장 주소를 복사했습니다.'
                            )
                          }
                        >
                          복사
                        </button>
                        <button
                          type="button"
                          className="tmap-btn"
                          onClick={() => openMapForAddress(currentSite.address.full_address)}
                        >
                          T맵
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="address-item">
                    <div className="address-label">숙소</div>
                    <div className="address-info">
                      <span className="address-text">{accommodationAddress || '미지정'}</span>
                      <div className="address-buttons">
                        <button
                          type="button"
                          className="copy-btn"
                          onClick={() =>
                            accommodationAddress &&
                            copyToClipboard(accommodationAddress, '숙소 주소를 복사했습니다.')
                          }
                          disabled={!accommodationAddress}
                        >
                          복사
                        </button>
                        <button
                          type="button"
                          className="tmap-btn"
                          onClick={() => openMapForAddress(accommodationAddress)}
                          disabled={!accommodationAddress}
                        >
                          T맵
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="work-info-section">
                  <div className="work-info-grid">
                    <div className="work-info-item">
                      <div className="work-label">부재명</div>
                      <div className="work-value">{currentSite.process.member_name || '-'}</div>
                    </div>
                    <div className="work-info-item">
                      <div className="work-label">작업공정</div>
                      <div className="work-value">{currentSite.process.work_process || '-'}</div>
                    </div>
                    <div className="work-info-item">
                      <div className="work-label">작업유형</div>
                      <div className="work-value">{currentSite.process.work_section || '-'}</div>
                    </div>
                    <div className="work-info-item">
                      <div className="work-label">블럭/동/층</div>
                      <div className="work-value">-</div>
                    </div>
                  </div>
                </div>

                <div className="upload-section">
                  <div className="upload-grid">
                    <div className="upload-item">
                      <div className="upload-label">사진 업로드 현황</div>
                      <div className="upload-status">{attachments.photos.length}건</div>
                    </div>
                    <div className="upload-item">
                      <div className="upload-label">도면 업로드 현황</div>
                      <div className="upload-status">{attachments.drawings.length}건</div>
                    </div>
                  </div>
                </div>

                <div className="action-buttons">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleOpenLatestProgressDrawing}
                  >
                    진행도면
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleAttachmentOpen('ptw')}
                  >
                    PTW
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card">현재 배정된 현장이 없습니다.</div>
      )}

      <section className="card site-search-card" role="region" aria-label="참여 현장">
        <div className="card-header">
          <div className="q">참여 현장</div>
          {!isLoading && monthlyStats && (
            <section className="stat-grid" role="group" aria-label="이번 달 참여 현황">
              <div className="stat stat-sites">
                <div className="num">{monthlyStats.siteCount}</div>
                <div className="label">현장수</div>
              </div>
              <div className="stat stat-hours">
                <div className="num">
                  {Number.isInteger(monthlyStats.totalManDays)
                    ? monthlyStats.totalManDays
                    : monthlyStats.totalManDays.toFixed(1)}
                </div>
                <div className="label">공수</div>
              </div>
              <div className="stat stat-workdays">
                <div className="num">{monthlyStats.workDays}</div>
                <div className="label">근무일</div>
              </div>
            </section>
          )}
        </div>

        <div className="search-bar-container">
          <div className="search-input-wrapper">
            <span className="search-ico" aria-hidden="true">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="현장명 검색"
              className="search-input-new"
              aria-label="현장명 검색"
            />
            {searchQuery && (
              <button
                className="clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="검색어 지우기"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="site-summary-list" role="list">
          {isSearching ? (
            <div className="site-summary-item" role="listitem">
              검색 중입니다...
            </div>
          ) : displayedSiteResults.length ? (
            displayedSiteResults.map(site => {
              const isSelected = currentSite?.id === site.id
              const companyBadge = getCompanyAbbreviation(site.customer_company_name, site.name)
              const lastWorkDateText = formatDateDisplayWithWeekday(
                getLastWorkDateValue(site) || undefined
              )

              return (
                <div
                  key={site.id}
                  className={`site-summary-item${isSelected ? ' selected' : ''}`}
                  role="listitem"
                  onClick={() => handleSiteSelection(site.id)}
                >
                  <div className="site-summary-header">
                    <div className="site-summary-main">
                      <div className="site-summary-title" title={site.name}>
                        <span className="site-summary-tag">[{companyBadge}]</span>
                        <span className="site-summary-name">{site.name}</span>
                      </div>
                    </div>
                    <div className="site-summary-right">
                      <span className="site-summary-date">{lastWorkDateText}</span>
                      {isSelected && <span className="site-summary-status">현재</span>}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="site-summary-item" role="listitem">
              검색 결과가 없습니다.
            </div>
          )}
        </div>

        {!searchQuery.trim() && siteResults.length > DEFAULT_SITE_DISPLAY_COUNT && (
          <div className="more-button-container">
            <button
              type="button"
              className="more-btn"
              onClick={() => setShowAllSites(prev => !prev)}
            >
              {showAllSites ? '접기' : '더보기'}
            </button>
          </div>
        )}
      </section>

      <section
        id="materials-inventory-section"
        className="card npc-card-section"
        role="region"
        aria-label="자재 재고관리"
      >
        <div className="npc-card">
          <div className="card-header">
            <div className="q">자재 재고관리</div>
            {isRefreshing && <span style={{ fontSize: 13, color: '#6b7280' }}>업데이트 중...</span>}
          </div>

          <div className="npc-site-filter">
            {npcSiteOptions.length ? (
              <CustomSelect
                value={selectedNpcSiteId}
                onValueChange={value => {
                  if (!value || value === currentSite?.id) return
                  void handleSiteSelection(value)
                }}
              >
                <PhSelectTrigger
                  id="npc-site-select"
                  className="npc-site-trigger"
                  aria-label="현장 선택"
                >
                  <CustomSelectValue placeholder="현장을 선택하세요" />
                </PhSelectTrigger>
                <CustomSelectContent className="npc-site-content" align="start">
                  {npcSiteOptions.map(option => (
                    <CustomSelectItem key={option.id} value={option.id} className="npc-site-item">
                      {option.name}
                    </CustomSelectItem>
                  ))}
                </CustomSelectContent>
              </CustomSelect>
            ) : (
              <div className="npc-site-empty">선택 가능한 현장이 없습니다.</div>
            )}
          </div>

          <div className="npc-kpi" role="group" aria-label="재고 지표">
            <div className="npc-kpi-item npc-kpi-item--incoming" role="group">
              <p className="npc-kpi-value">{npcSummary?.today.incoming ?? 0}</p>
              <p className="npc-kpi-label">입고</p>
            </div>
            <div className="npc-kpi-item npc-kpi-item--usage" role="group">
              <p className="npc-kpi-value">{npcSummary?.today.used ?? 0}</p>
              <p className="npc-kpi-label">사용</p>
            </div>
            <div className="npc-kpi-item npc-kpi-item--stock" role="group">
              <p className="npc-kpi-value">
                {npcSummary?.today.stock ?? npcSummary?.cumulative.currentStock ?? 0}
              </p>
              <p className="npc-kpi-label">재고</p>
            </div>
          </div>

          <div className="npc-buttons">
            <button
              type="button"
              className="btn btn--outline"
              style={{ width: '100%' }}
              onClick={handleOpenNpcLogs}
            >
              로그 보기
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              style={{ width: '100%' }}
              onClick={handleOpenNpcRequest}
            >
              자재 요청
            </button>
            <button
              type="button"
              className="btn btn--primary"
              style={{ width: '100%' }}
              onClick={handleOpenNpcRecord}
            >
              입고 기록
            </button>
          </div>
        </div>
      </section>

      {showSiteBottomSheet && currentSite && (
        <div className="site-info-bottomsheet" role="dialog" aria-modal="true">
          <div className="site-info-bottomsheet-overlay" onClick={closeSiteBottomSheet} />
          <div className="site-info-bottomsheet-content">
            <div className="site-info-bottomsheet-header">
              <h3 className="site-info-bottomsheet-title">{currentSite.name}</h3>
              <button
                type="button"
                className="site-info-bottomsheet-close"
                onClick={closeSiteBottomSheet}
              >
                닫기
              </button>
            </div>

            <div className="site-info-sheet-summary" role="group" aria-label="현장 요약">
              <div className="site-info-sheet-summary-row">
                <span className="site-info-sheet-summary-label">소속</span>
                <span className="site-info-sheet-summary-value">
                  {currentSite.customer_company?.company_name?.trim() || '미배정'}
                </span>
              </div>
              <div className="site-info-sheet-summary-row">
                <span className="site-info-sheet-summary-label">현장명</span>
                <span className="site-info-sheet-summary-value">{currentSite.name}</span>
              </div>
              <div className="site-info-sheet-summary-row">
                <span className="site-info-sheet-summary-label">작업일</span>
                <span className="site-info-sheet-summary-value">{todayDisplay}</span>
              </div>
              <div className="site-info-sheet-summary-row">
                <span className="site-info-sheet-summary-label">출력인원</span>
                <span className="site-info-sheet-summary-value">
                  {workerCount.toLocaleString()}명
                </span>
              </div>
            </div>

            {contactItems.length > 0 && (
              <div className="site-info-sheet-section" role="group" aria-label="담당자 정보">
                {contactItems.map(item => {
                  const phone = item.contact?.phone?.trim() || ''
                  return (
                    <div
                      className="site-info-sheet-contact"
                      key={`${item.label}-${item.contact?.name ?? 'unknown'}`}
                    >
                      <div className="site-info-sheet-contact-meta">
                        <span className="site-info-sheet-contact-label">{item.label}</span>
                        <span className="site-info-sheet-contact-name">
                          {item.contact?.name || '-'}
                        </span>
                      </div>
                      <div className="site-info-sheet-contact-actions">
                        <span className="site-info-sheet-contact-phone">{phone || '-'}</span>
                        <button
                          type="button"
                          className="site-info-sheet-contact-call"
                          onClick={() => handleCallContact(phone)}
                          disabled={!phone}
                        >
                          전화
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="site-info-sheet-section" role="group" aria-label="주소 정보">
              <div className="site-info-sheet-address-row">
                <div className="site-info-sheet-address-meta">
                  <span className="site-info-sheet-address-label">주소</span>
                  <span className="site-info-sheet-address-value">
                    {currentSite.address.full_address || '-'}
                  </span>
                </div>
                <div className="site-info-sheet-address-actions">
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(currentSite.address.full_address, '현장 주소를 복사했습니다.')
                    }
                    disabled={!currentSite.address.full_address}
                  >
                    복사
                  </button>
                  <button
                    type="button"
                    onClick={() => openMapForAddress(currentSite.address.full_address)}
                    disabled={!currentSite.address.full_address}
                  >
                    T맵
                  </button>
                </div>
              </div>

              <div className="site-info-sheet-address-row">
                <div className="site-info-sheet-address-meta">
                  <span className="site-info-sheet-address-label">숙소</span>
                  <span className="site-info-sheet-address-value">
                    {accommodationAddress || '미지정'}
                  </span>
                </div>
                <div className="site-info-sheet-address-actions">
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(accommodationAddress, '숙소 주소를 복사했습니다.')
                    }
                    disabled={!accommodationAddress}
                  >
                    복사
                  </button>
                  <button
                    type="button"
                    onClick={() => openMapForAddress(accommodationAddress)}
                    disabled={!accommodationAddress}
                  >
                    T맵
                  </button>
                </div>
              </div>
            </div>

            <div className="site-info-sheet-actions" role="group" aria-label="현장 관련 작업">
              <button type="button" className="ghost" onClick={handleOpenOtherDocuments}>
                기타서류업로드
              </button>
              <button type="button" className="primary" onClick={handleOpenWorklogList}>
                작업일지목록
              </button>
            </div>
          </div>
        </div>
      )}

      {progressModal.open && (
        <div
          role="dialog"
          aria-modal="true"
          className="progress-modal-overlay"
          onClick={closeProgressModal}
        >
          <div className="progress-modal" onClick={e => e.stopPropagation()}>
            {progressModal.mode === 'choose' ? (
              <>
                <div className="progress-modal-title">진행도면 열기</div>
                <div className="progress-modal-desc">
                  최신 진행도면을 새 탭으로 보거나 마킹 도구로 열 수 있습니다.
                </div>
                <div className="progress-modal-actions">
                  <button
                    type="button"
                    className="modal-btn modal-btn-ghost"
                    onClick={closeProgressModal}
                  >
                    취소
                  </button>
                  <button type="button" className="modal-btn" onClick={openLatestProgressInNewTab}>
                    보기
                  </button>
                  <button
                    type="button"
                    className="modal-btn modal-btn-primary"
                    onClick={openLatestProgressInMarkupTool}
                  >
                    마킹 도구
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="progress-modal-title">진행도면 없음</div>
                <div className="progress-modal-desc">
                  해당 현장의 진행도면이 등록되어 있지 않습니다. 문서함에서 업로드하거나 마킹
                  도구에서 게시할 수 있습니다.
                </div>
                <div className="progress-modal-actions">
                  <button
                    type="button"
                    className="modal-btn modal-btn-ghost"
                    onClick={closeProgressModal}
                  >
                    닫기
                  </button>
                  <button
                    type="button"
                    className="modal-btn"
                    onClick={() => {
                      try {
                        if (currentSite)
                          localStorage.setItem(
                            'selected_site',
                            JSON.stringify({ id: currentSite.id, name: currentSite.name })
                          )
                      } catch {
                        /* ignore */
                      }
                      closeProgressModal()
                      window.location.href = '/mobile/markup-tool?mode=upload'
                    }}
                  >
                    마킹 도구(업로드)
                  </button>
                  <button
                    type="button"
                    className="modal-btn modal-btn-primary"
                    onClick={goToDocumentsForUpload}
                  >
                    문서함 이동
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {showNpcRecordSheet && (
        <div
          className="npc-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            if (!isSubmittingRecord) {
              setShowNpcRecordSheet(false)
            }
          }}
        >
          <div className="npc-modal" onClick={event => event.stopPropagation()}>
            <div className="npc-modal-header">
              <h3>입고/사용 기록</h3>
              <button
                type="button"
                className="npc-modal-close"
                onClick={() => setShowNpcRecordSheet(false)}
                aria-label="닫기"
              >
                <X size={18} />
              </button>
            </div>
            <form className="npc-modal-body" onSubmit={handleNpcRecordSubmit}>
              <div className="npc-modal-field" role="group" aria-label="선택된 현장">
                <span className="modal-label">현장</span>
                <span className="modal-value">{currentSite?.name ?? '-'}</span>
              </div>

              <div className="npc-record-grid">
                <div className="npc-modal-field">
                  <label htmlFor="npc-record-material" className="modal-label">
                    자재
                  </label>
                  <CustomSelect
                    value={recordMaterialCode}
                    onValueChange={value => setRecordMaterialCode(value)}
                  >
                    <CustomSelectTrigger
                      id="npc-record-material"
                      className="modal-select-trigger npc-record-trigger"
                      aria-label="자재 선택"
                    >
                      <CustomSelectValue placeholder="자재를 선택하세요" />
                    </CustomSelectTrigger>
                    <CustomSelectContent className="modal-select-content" align="start">
                      {materialsOptions.length === 0 ? (
                        <CustomSelectItem className="modal-select-item" value={recordMaterialCode}>
                          {recordMaterialCode || '자재 없음'}
                        </CustomSelectItem>
                      ) : (
                        materialsOptions.map(m => (
                          <CustomSelectItem
                            key={m.code}
                            className="modal-select-item"
                            value={m.code}
                          >
                            {m.name || m.code}
                          </CustomSelectItem>
                        ))
                      )}
                    </CustomSelectContent>
                  </CustomSelect>
                </div>
                <div className="npc-modal-field">
                  <label htmlFor="npc-record-transaction" className="modal-label">
                    유형
                  </label>
                  <CustomSelect
                    value={recordTransactionType}
                    onValueChange={value =>
                      setRecordTransactionType(value === 'out' ? 'out' : 'in')
                    }
                  >
                    <CustomSelectTrigger
                      id="npc-record-transaction"
                      className="modal-select-trigger npc-record-trigger"
                      aria-label="입고 또는 사용"
                    >
                      <CustomSelectValue />
                    </CustomSelectTrigger>
                    <CustomSelectContent className="modal-select-content" align="start">
                      <CustomSelectItem className="modal-select-item" value="in">
                        입고
                      </CustomSelectItem>
                      <CustomSelectItem className="modal-select-item" value="out">
                        사용
                      </CustomSelectItem>
                    </CustomSelectContent>
                  </CustomSelect>
                </div>

                <div className="npc-modal-field">
                  <label htmlFor="npc-record-quantity" className="modal-label">
                    수량 (말)
                  </label>
                  <input
                    id="npc-record-quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    className="modal-input npc-record-input"
                    value={recordQuantity}
                    onChange={event => setRecordQuantity(event.target.value)}
                    placeholder="0"
                    inputMode="decimal"
                  />
                </div>

                <div className="npc-modal-field">
                  <label htmlFor="npc-record-date" className="modal-label">
                    일자
                  </label>
                  <input
                    id="npc-record-date"
                    type="date"
                    className="modal-input npc-record-date"
                    value={recordDate}
                    onChange={event => setRecordDate(event.target.value)}
                  />
                </div>
              </div>

              <div className="npc-modal-field">
                <label htmlFor="npc-record-notes" className="modal-label">
                  비고
                </label>
                <textarea
                  id="npc-record-notes"
                  className="modal-textarea"
                  rows={3}
                  value={recordNotes}
                  onChange={event => setRecordNotes(event.target.value)}
                  placeholder="현장 메모나 관련 내용을 입력해주세요."
                />
              </div>

              <div className="npc-modal-actions npc-record-actions">
                <button type="submit" className="npc-record-submit" disabled={isSubmittingRecord}>
                  {isSubmittingRecord ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNpcRequestSheet && (
        <div
          className="npc-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            if (!isSubmittingRequest) {
              setShowNpcRequestSheet(false)
            }
          }}
        >
          <div className="npc-modal npc-request-modal" onClick={event => event.stopPropagation()}>
            <div className="npc-modal-header npc-request-header">
              <div className="npc-request-headline">
                <h3>자재 요청</h3>
                <p className="npc-request-subtitle">필요 수량과 긴급도를 입력해주세요.</p>
              </div>
              <button
                type="button"
                className="npc-modal-close"
                onClick={() => setShowNpcRequestSheet(false)}
                aria-label="닫기"
              >
                <X size={18} />
              </button>
            </div>
            <form className="npc-modal-body npc-request-body" onSubmit={handleNpcRequestSubmit}>
              <div className="npc-modal-field" role="group" aria-label="선택된 현장">
                <span className="modal-label">현장</span>
                <span className="modal-value">{currentSite?.name ?? '-'}</span>
              </div>

              <div className="npc-request-grid">
                <div className="npc-modal-field">
                  <label htmlFor="npc-request-material" className="modal-label">
                    자재
                  </label>
                  <CustomSelect
                    value={requestMaterialCode}
                    onValueChange={value => setRequestMaterialCode(value)}
                  >
                    <CustomSelectTrigger
                      id="npc-request-material"
                      className="modal-select-trigger npc-request-trigger"
                      aria-label="자재 선택"
                    >
                      <CustomSelectValue placeholder="자재를 선택하세요" />
                    </CustomSelectTrigger>
                    <CustomSelectContent className="modal-select-content" align="start">
                      {materialsOptions.length === 0 ? (
                        <CustomSelectItem className="modal-select-item" value={requestMaterialCode}>
                          {requestMaterialCode || '자재 없음'}
                        </CustomSelectItem>
                      ) : (
                        materialsOptions.map(m => (
                          <CustomSelectItem
                            key={m.code}
                            className="modal-select-item"
                            value={m.code}
                          >
                            {m.name || m.code}
                          </CustomSelectItem>
                        ))
                      )}
                    </CustomSelectContent>
                  </CustomSelect>
                </div>
                <div className="npc-modal-field">
                  <label htmlFor="npc-request-quantity" className="modal-label">
                    수량 (말)
                  </label>
                  <input
                    id="npc-request-quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    className="modal-input npc-request-input"
                    value={requestQuantity}
                    onChange={event => setRequestQuantity(event.target.value)}
                    placeholder="0"
                    inputMode="decimal"
                  />
                </div>

                <div className="npc-modal-field">
                  <label id="npc-request-urgency-label" className="modal-label">
                    긴급도
                  </label>
                  <CustomSelect
                    value={requestUrgency}
                    onValueChange={(value: 'normal' | 'urgent' | 'emergency') =>
                      setRequestUrgency(value)
                    }
                  >
                    <CustomSelectTrigger
                      id="npc-request-urgency"
                      className="modal-select-trigger npc-request-trigger"
                      aria-labelledby="npc-request-urgency-label"
                    >
                      <CustomSelectValue placeholder="선택" />
                    </CustomSelectTrigger>
                    <CustomSelectContent className="modal-select-content" align="start">
                      <CustomSelectItem className="modal-select-item" value="normal">
                        일반
                      </CustomSelectItem>
                      <CustomSelectItem className="modal-select-item" value="urgent">
                        긴급
                      </CustomSelectItem>
                      <CustomSelectItem className="modal-select-item" value="emergency">
                        최우선
                      </CustomSelectItem>
                    </CustomSelectContent>
                  </CustomSelect>
                </div>
              </div>

              <div className="npc-modal-field">
                <label htmlFor="npc-request-notes" className="modal-label">
                  요청 메모
                </label>
                <textarea
                  id="npc-request-notes"
                  className="modal-textarea npc-request-textarea"
                  rows={3}
                  value={requestNotes}
                  onChange={event => setRequestNotes(event.target.value)}
                  placeholder="필요 수량과 사유를 입력해주세요."
                />
              </div>

              <div className="npc-modal-actions npc-request-actions">
                <button type="submit" className="npc-request-submit" disabled={isSubmittingRequest}>
                  {isSubmittingRequest ? '요청 중...' : '요청 제출'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNpcLogSheet && (
        <div
          className="npc-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowNpcLogSheet(false)}
        >
          <div className="npc-modal npc-log-modal" onClick={event => event.stopPropagation()}>
            <div className="npc-modal-header npc-log-header">
              <div className="npc-log-title-group">
                <h3>입고/사용 로그</h3>
                <span className="npc-log-site">{currentSite?.name ?? '-'}</span>
              </div>
              <div
                className="npc-log-filter"
                style={{ display: 'flex', gap: 8, alignItems: 'center' }}
              >
                <span className="npc-log-filter-label" style={{ fontSize: 13, color: '#6b7280' }}>
                  자재
                </span>
                <CustomSelect
                  value={selectedLogMaterialCode}
                  onValueChange={value => setSelectedLogMaterialCode(value)}
                >
                  <CustomSelectTrigger className="modal-select-trigger" aria-label="자재 선택">
                    <CustomSelectValue placeholder="전체" />
                  </CustomSelectTrigger>
                  <CustomSelectContent className="modal-select-content" align="end">
                    <CustomSelectItem className="modal-select-item" value="ALL">
                      전체
                    </CustomSelectItem>
                    {materialsOptions.map(m => (
                      <CustomSelectItem key={m.code} className="modal-select-item" value={m.code}>
                        {m.name || m.code}
                      </CustomSelectItem>
                    ))}
                  </CustomSelectContent>
                </CustomSelect>
              </div>
              <div className="npc-log-summary">
                <span className="npc-log-summary-item" aria-label="총 입고">
                  <span className="npc-log-summary-label">입고</span>
                  <span className="npc-log-summary-value">
                    {formatQuantityValue(npcLogSummary.incoming)}
                    <span className="npc-log-summary-unit">말</span>
                  </span>
                </span>
                <span className="npc-log-summary-item" aria-label="총 사용">
                  <span className="npc-log-summary-label">사용</span>
                  <span className="npc-log-summary-value">
                    {formatQuantityValue(npcLogSummary.usage)}
                    <span className="npc-log-summary-unit">말</span>
                  </span>
                </span>
              </div>
              <button
                type="button"
                className="npc-modal-close"
                onClick={() => setShowNpcLogSheet(false)}
                aria-label="닫기"
              >
                <X size={18} />
              </button>
            </div>

            <div className="npc-log-body">
              {isLoadingNpcLogs ? (
                <div className="npc-log-empty">로그를 불러오는 중입니다...</div>
              ) : npcLogError ? (
                <div className="npc-log-empty">{npcLogError}</div>
              ) : npcTransactions.length === 0 ? (
                <div className="npc-log-empty">등록된 로그가 없습니다.</div>
              ) : (
                <div className="npc-log-list" role="list">
                  {npcTransactions.map((transaction, index) => {
                    const dateValue = transaction.transaction_date || transaction.created_at || ''
                    const formattedDate = dateValue ? formatDateDisplay(dateValue) : '-'
                    const typeLabel = transaction.transaction_type === 'out' ? '사용' : '입고'
                    const quantityValue = Number(transaction.quantity) || 0
                    const quantityText = formatQuantityValue(quantityValue)
                    const noteText = transaction.notes?.trim() ? transaction.notes.trim() : ''
                    const siteName =
                      currentSite?.name ?? transaction.materials?.name ?? '현장 미지정'
                    const siteBadge = getCompanyAbbreviation(
                      currentSite?.customer_company?.company_name,
                      siteName
                    )

                    return (
                      <div
                        className="npc-log-entry"
                        key={`${transaction.created_at ?? ''}-${index}`}
                        role="listitem"
                      >
                        <div className="npc-log-entry-top">
                          <div className="npc-log-entry-meta">
                            <span className="npc-log-entry-date">{formattedDate}</span>
                            <span
                              className={`npc-log-entry-type npc-log-entry-type-${transaction.transaction_type}`}
                            >
                              {typeLabel}
                            </span>
                          </div>
                          <div
                            className="npc-log-entry-quantity"
                            aria-label={`수량 ${quantityText}말`}
                          >
                            <span className="npc-log-entry-quantity-value">{quantityText}</span>
                            <span className="npc-log-entry-quantity-unit">말</span>
                          </div>
                        </div>
                        <div className="npc-log-entry-site">
                          <span className="npc-log-entry-site-badge">{siteBadge}</span>
                          <span className="npc-log-entry-site-name">{siteName}</span>
                        </div>
                        {noteText && (
                          <div className="npc-log-entry-note" aria-label="메모">
                            {noteText}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAttachmentPopup && (
        <div
          className="attachment-popup-overlay"
          onClick={() => {
            setShowAttachmentPopup(false)
            setAttachmentFocus(null)
          }}
        >
          <div className="attachment-popup" onClick={event => event.stopPropagation()}>
            <div className="attachment-popup-header">
              <h3>{currentSite?.name} 첨부파일</h3>
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowAttachmentPopup(false)
                  setAttachmentFocus(null)
                }}
              >
                닫기
              </button>
            </div>
            <div className="attachment-popup-body">
              {attachmentCategories.map(category => (
                <div
                  key={category.key}
                  className="attachment-category"
                  data-active={attachmentFocus === category.key}
                >
                  <div className="attachment-category-title">{category.title}</div>
                  <div className="attachment-list">
                    {category.files.length ? (
                      category.files.map(file => (
                        <div key={file.id} className="attachment-item">
                          <div className="attachment-info">
                            <div className="attachment-name">{file.name}</div>
                            <div className="attachment-meta">
                              {file.date ? formatDateDisplay(file.date) : '-'}
                            </div>
                          </div>
                          <div className="info-actions">
                            <button className="action-btn" onClick={() => handleDownload(file)}>
                              <Download size={14} /> 다운로드
                            </button>
                            <button
                              className="action-btn secondary"
                              onClick={() => window.open(file.url, '_blank', 'noopener,noreferrer')}
                            >
                              새 창에서 보기
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-files">등록된 파일이 없습니다.</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
