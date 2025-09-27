'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Paperclip, Search, X } from 'lucide-react'
import {
  createMaterialRequest as createNpcMaterialRequest,
  recordInventoryTransaction,
} from '@/app/actions/npc-materials'
import { useToast } from '@/components/ui/use-toast'

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

const EMPTY_ATTACHMENTS: AttachmentBuckets = {
  drawings: [],
  ptw: [],
  photos: [],
}

const formatDateDisplay = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

const todayISO = () => new Date().toISOString().split('T')[0]

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
    const params = new URLSearchParams({ limit: '6' })
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

export default function SiteInfoPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentSite, setCurrentSite] = useState<SiteInfoResponse | null>(null)
  const [attachments, setAttachments] = useState<AttachmentBuckets>(EMPTY_ATTACHMENTS)
  const [npcSummary, setNpcSummary] = useState<NpcSummary | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSessionExpired, setIsSessionExpired] = useState(false)

  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [siteResults, setSiteResults] = useState<SiteSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const [showAttachmentPopup, setShowAttachmentPopup] = useState(false)
  const [attachmentFocus, setAttachmentFocus] = useState<'drawings' | 'ptw' | 'photos' | null>(null)

  const [showDetail, setShowDetail] = useState(false)
  const { toast } = useToast()

  const [showNpcRecordModal, setShowNpcRecordModal] = useState(false)
  const [showNpcRequestModal, setShowNpcRequestModal] = useState(false)
  const [recordTransactionType, setRecordTransactionType] = useState<'in' | 'out'>('in')
  const [recordQuantity, setRecordQuantity] = useState('')
  const [recordDate, setRecordDate] = useState(todayISO())
  const [recordNotes, setRecordNotes] = useState('')
  const [isSubmittingRecord, setIsSubmittingRecord] = useState(false)
  const [requestQuantity, setRequestQuantity] = useState('')
  const [requestNotes, setRequestNotes] = useState('')
  const [requestUrgency, setRequestUrgency] = useState<'normal' | 'urgent' | 'emergency'>('normal')
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)

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

  const loadAll = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    setIsSessionExpired(false)

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
        return
      }

      setCurrentSite(site)

      const [siteAttachments, npc] = await Promise.all([
        loadSiteAttachments(site.id),
        loadNpcSummary(site.id),
      ])

      setAttachments(siteAttachments)
      setNpcSummary(npc)
    } catch (error) {
      if (error instanceof HttpError && error.status === 401) {
        setErrorMessage('세션이 만료되었습니다. 다시 로그인해주세요.')
        setIsSessionExpired(true)
        setCurrentSite(null)
        setAttachments(EMPTY_ATTACHMENTS)
        setNpcSummary(null)
        setMonthlyStats({ siteCount: 0, totalManDays: 0, workDays: 0 })
      } else {
        console.error('[SiteInfo] loadAll failed', error)
        setErrorMessage(error instanceof Error ? error.message : '데이터를 불러오지 못했습니다.')
        setMonthlyStats(prev => prev ?? { siteCount: 0, totalManDays: 0, workDays: 0 })
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (showNpcRecordModal) {
      setRecordTransactionType('in')
      setRecordQuantity('')
      setRecordNotes('')
      setRecordDate(todayISO())
    }
  }, [showNpcRecordModal])

  useEffect(() => {
    if (showNpcRequestModal) {
      setRequestQuantity('')
      setRequestNotes('')
      setRequestUrgency('normal')
    }
  }, [showNpcRequestModal])

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

  const displayedSiteResults = useMemo(() => siteResults.slice(0, 2), [siteResults])

  const handleAttachmentOpen = (category: 'drawings' | 'ptw' | 'photos' | null) => {
    setAttachmentFocus(category)
    setShowAttachmentPopup(true)
  }

  const handleSiteSelection = async (siteId: string) => {
    if (!siteId) return

    try {
      setIsRefreshing(true)
      await switchCurrentSite(siteId)
      await loadAll()
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
        description: 'NPC-1000 기록을 등록하려면 먼저 현장을 선택해주세요.',
        variant: 'warning',
      })
      return
    }
    setShowNpcRecordModal(true)
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
    setShowNpcRequestModal(true)
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
        materialCode: 'NPC-1000',
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

      setShowNpcRecordModal(false)
      await refreshNpcSummary()
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
        materialCode: 'NPC-1000',
        requestedQuantity: quantityValue,
        requestDate: new Date().toISOString(),
        notes: combinedNotes || undefined,
      })

      if (!result?.success) {
        throw new Error(result?.error || '자재 요청을 저장하지 못했습니다.')
      }

      toast({
        title: '자재 요청이 등록되었습니다.',
        description: `${currentSite.name}에 NPC-1000 ${quantityValue.toLocaleString()}말 요청이 본사로 전달되었습니다.`,
        variant: 'success',
      })

      setShowNpcRequestModal(false)
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

  const renderManagerContact = (manager: ManagerContact) => (
    <div className="info-row" role="row" key={`${manager.role}-${manager.phone}`}>
      <span className="info-label" role="gridcell">
        {manager.role === 'construction_manager'
          ? '소장'
          : manager.role === 'safety_manager'
            ? '안전'
            : '담당'}
      </span>
      <span className="info-value" role="gridcell">
        {manager.name}
      </span>
      <div className="info-actions" role="gridcell">
        <button
          className="action-btn"
          onClick={() => (window.location.href = `tel:${manager.phone}`)}
        >
          통화
        </button>
      </div>
    </div>
  )

  const attachmentCategories = useMemo(() => {
    return [
      { key: 'drawings' as const, title: '현장 공도면', files: attachments.drawings },
      { key: 'ptw' as const, title: 'PTW', files: attachments.ptw },
      { key: 'photos' as const, title: '현장 사진', files: attachments.photos },
    ]
  }, [attachments])

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
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .site-title {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
        }

        .site-actions {
          display: flex;
          gap: 8px;
        }

        .btn-attachment,
        .btn-detail {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 8px 16px;
          color: var(--text);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .btn-detail {
          background: var(--brand);
          color: #fff;
          border-color: var(--brand);
        }

        .btn-attachment:hover,
        .btn-detail:hover {
          background: rgba(26, 37, 79, 0.9);
          color: #fff;
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

        .site-stats-section {
          margin-bottom: 24px;
        }

        .stat-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
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

        .stat-workdays {
          color: #99a4be;
          background-color: rgba(153, 164, 190, 0.05);
          border-color: rgba(153, 164, 190, 0.2);
        }

        :global([data-theme='dark']) .stat {
          background: rgba(15, 23, 42, 0.9);
          border-color: var(--attendance-border-dark, rgba(49, 163, 250, 0.25));
          color: #e9eef5;
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
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

        .site-info-grid {
          display: grid;
          gap: 12px;
        }

        .info-row {
          display: grid;
          grid-template-columns: 70px 1fr auto;
          align-items: center;
          gap: 8px;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--muted);
        }

        .info-value {
          font-size: 15px;
          font-weight: 600;
          color: var(--text);
        }

        .info-actions {
          display: flex;
          gap: 6px;
        }

        .action-btn {
          background: var(--blue);
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 12px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .action-btn:hover {
          background: rgba(0, 104, 254, 0.85);
        }

        .action-btn.secondary {
          background: #f3f4f6;
          color: var(--text);
          border: 1px solid var(--border);
        }

        .toggle-section {
          display: flex;
          justify-content: center;
          margin-top: 16px;
        }

        .detail-section {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
        }

        .detail-item {
          background: var(--brand-ghost);
          border-radius: 12px;
          padding: 12px;
        }

        .detail-label {
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 4px;
        }

        .detail-value {
          font-size: 14px;
          font-weight: 600;
        }

        .site-doc-buttons {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }

        .site-doc-button {
          flex: 1;
          height: 48px;
          border-radius: 14px;
          border: 1px solid var(--border);
          background: var(--card);
          color: var(--text);
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .site-doc-button:hover {
          background: var(--brand-ghost);
          border-color: var(--blue);
        }

        .search-bar-container {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .search-input-wrapper {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
          background: #f5f8fd;
          border-radius: 20px;
          padding: 8px 12px;
          height: 48px;
        }

        .search-icon {
          color: #999;
          margin-right: 8px;
        }

        .search-input-new {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          font:
            400 16px 'Noto Sans KR',
            system-ui,
            -apple-system,
            'Segoe UI',
            Roboto,
            sans-serif;
          color: #333;
        }

        .clear-btn,
        .cancel-btn {
          border: none;
          background: transparent;
          color: var(--blue);
          font-weight: 600;
          cursor: pointer;
        }

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

        .site-summary-title {
          font-size: 15px;
          font-weight: 600;
          color: #1a56db;
        }

        .site-summary-date {
          font-size: 13px;
          color: #6b7280;
        }

        .npc-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px;
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

        .npc-kpi-label {
          font-size: 12px;
          color: var(--muted);
        }

        .npc-kpi-value {
          font-size: 18px;
          font-weight: 700;
          margin-top: 6px;
        }

        .npc-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 8px;
        }

        .npc-btn {
          border-radius: 12px;
          height: 48px;
          font-weight: 600;
          border: 1px solid var(--border);
          background: var(--card);
          cursor: pointer;
          transition: background 0.2s ease;
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
          background: var(--blue);
          color: #fff;
          border-color: var(--blue);
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
          z-index: 1100;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 24px 16px;
          background: rgba(15, 23, 42, 0.35);
        }

        @media (min-width: 640px) {
          .npc-modal-overlay {
            align-items: center;
          }
        }

        .npc-modal {
          width: min(520px, 100%);
          max-height: 90vh;
          background: var(--card);
          border-radius: 20px;
          border: 1px solid var(--border);
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .npc-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
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

        .npc-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding-top: 8px;
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

        .modal-secondary-button:disabled,
        .modal-primary-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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

          .site-doc-buttons {
            flex-direction: column;
          }
        }

        @media (max-width: 480px) {
          .site-summary-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
        }
      `}</style>

      <div className="site-header">
        <h1 className="site-title">현장정보</h1>
        <div className="site-actions">
          <button className="btn-attachment" onClick={() => handleAttachmentOpen(null)}>
            <Paperclip size={16} /> 첨부파일
          </button>
          <button className="btn-detail" onClick={() => setShowDetail(prev => !prev)}>
            {showDetail ? '간단' : '상세'}
          </button>
        </div>
      </div>

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
        <div className="site-info-card" role="main">
          <div className="card-header">
            <div>
              <h2 className="q" style={{ marginBottom: 4 }}>
                {currentSite.name}
              </h2>
              <div style={{ color: '#6b7280', fontSize: 14 }}>
                {currentSite.address.full_address}
              </div>
            </div>
            <div className="header-actions">
              <div className="work-date">
                {formatDateDisplay(currentSite.construction_period?.end_date)}
              </div>
              <button className="btn-detail" onClick={() => setShowDetail(prev => !prev)}>
                {showDetail ? '간단' : '상세'}
              </button>
            </div>
          </div>

          <div className="site-info-grid" role="grid" aria-label="현장 기본 정보">
            {currentSite.managers.map(renderManagerContact)}

            <div className="info-row" role="row">
              <span className="info-label">주소</span>
              <span className="info-value">{currentSite.address.full_address || '-'}</span>
              <div className="info-actions">
                <button
                  className="action-btn secondary"
                  onClick={() =>
                    navigator.clipboard?.writeText(currentSite.address.full_address || '')
                  }
                >
                  복사
                </button>
              </div>
            </div>

            {currentSite.accommodation && (
              <div className="info-row" role="row">
                <span className="info-label">숙소</span>
                <span className="info-value">{currentSite.accommodation.full_address}</span>
                <div className="info-actions">
                  <button
                    className="action-btn secondary"
                    onClick={() =>
                      navigator.clipboard?.writeText(currentSite.accommodation?.full_address || '')
                    }
                  >
                    복사
                  </button>
                </div>
              </div>
            )}

            <div className="info-row" role="row">
              <span className="info-label">공정</span>
              <span className="info-value">
                {currentSite.process.work_process} / {currentSite.process.work_section}
              </span>
              <div className="info-actions" />
            </div>
          </div>

          {showDetail && (
            <div className="detail-section">
              <div className="detail-grid">
                <div className="detail-item">
                  <p className="detail-label">부재명</p>
                  <p className="detail-value">{currentSite.process.member_name}</p>
                </div>
                <div className="detail-item">
                  <p className="detail-label">작업기간</p>
                  <p className="detail-value">
                    {formatDateDisplay(currentSite.construction_period?.start_date)} ~{' '}
                    {formatDateDisplay(currentSite.construction_period?.end_date)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="site-doc-buttons" role="group" aria-label="현장 자료">
            <button className="site-doc-button" onClick={() => handleAttachmentOpen('drawings')}>
              현장 공도면
            </button>
            <button className="site-doc-button" onClick={() => handleAttachmentOpen('ptw')}>
              PTW
            </button>
          </div>
        </div>
      ) : (
        <div className="card">현재 배정된 현장이 없습니다.</div>
      )}

      {!isLoading && monthlyStats && (
        <section className="site-stats-section" role="region" aria-label="출력 현황 통계">
          <div className="stat-grid">
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
          </div>
        </section>
      )}

      <section className="card site-search-card" role="region" aria-label="참여 현장 검색">
        <div className="card-header">
          <div className="q">참여 현장</div>
        </div>
        <div className="divider" />

        <div className="search-bar-container">
          <div className="search-input-wrapper">
            <Search className="search-icon" width={16} height={16} />
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
          <button className="cancel-btn" onClick={() => setSearchQuery('')} aria-label="검색 취소">
            취소
          </button>
        </div>

        <div className="site-summary-list" role="list">
          {isSearching ? (
            <div className="site-summary-item" role="listitem">
              검색 중입니다...
            </div>
          ) : displayedSiteResults.length ? (
            displayedSiteResults.map(site => {
              const formattedDate = formatDateDisplay(site.construction_period?.end_date)
              const isSelected = currentSite?.id === site.id
              return (
                <div
                  key={site.id}
                  className={`site-summary-item${isSelected ? ' selected' : ''}`}
                  role="listitem"
                  onClick={() => handleSiteSelection(site.id)}
                >
                  <div className="site-summary-content">
                    <div className="site-summary-title">{site.name}</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>{site.address}</div>
                  </div>
                  <div className="site-summary-date">{formattedDate}</div>
                </div>
              )
            })
          ) : (
            <div className="site-summary-item" role="listitem">
              검색 결과가 없습니다.
            </div>
          )}
        </div>

        <div className="divider" />

        <div className="npc-card" role="region" aria-label="NPC-1000 재고관리">
          <div className="npc-header">
            <div className="npc-title">NPC-1000 재고관리</div>
            {isRefreshing && <span style={{ fontSize: 13, color: '#6b7280' }}>업데이트 중...</span>}
          </div>

          <div className="npc-kpi" role="group" aria-label="재고 지표">
            <div className="npc-kpi-item" role="group">
              <p className="npc-kpi-label">오늘 입고</p>
              <p className="npc-kpi-value">{npcSummary?.today.incoming ?? 0}</p>
            </div>
            <div className="npc-kpi-item" role="group">
              <p className="npc-kpi-label">오늘 사용</p>
              <p className="npc-kpi-value">{npcSummary?.today.used ?? 0}</p>
            </div>
            <div className="npc-kpi-item" role="group">
              <p className="npc-kpi-label">현재 재고</p>
              <p className="npc-kpi-value">
                {npcSummary?.today.stock ?? npcSummary?.cumulative.currentStock ?? 0}
              </p>
            </div>
          </div>

          <div className="npc-buttons">
            <button type="button" className="npc-btn npc-btn-ghost">
              로그 보기
            </button>
            <button type="button" className="npc-btn npc-btn-ghost" onClick={handleOpenNpcRequest}>
              자재 요청
            </button>
            <button type="button" className="npc-btn npc-btn-primary" onClick={handleOpenNpcRecord}>
              입고 기록
            </button>
          </div>
        </div>
      </section>

      {showNpcRecordModal && (
        <div className="npc-modal-overlay" role="dialog" aria-modal="true">
          <div className="npc-modal">
            <div className="npc-modal-header">
              <h3>NPC-1000 입고·사용 기록</h3>
              <button
                type="button"
                className="npc-modal-close"
                onClick={() => setShowNpcRecordModal(false)}
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

              <div className="npc-modal-field">
                <label htmlFor="npc-transaction-type" className="modal-label">
                  거래 유형
                </label>
                <select
                  id="npc-transaction-type"
                  className="modal-select"
                  value={recordTransactionType}
                  onChange={event =>
                    setRecordTransactionType(event.target.value === 'out' ? 'out' : 'in')
                  }
                >
                  <option value="in">입고</option>
                  <option value="out">사용</option>
                </select>
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
                  className="modal-input"
                  value={recordQuantity}
                  onChange={event => setRecordQuantity(event.target.value)}
                  placeholder="0"
                  inputMode="decimal"
                />
              </div>

              <div className="npc-modal-field">
                <label htmlFor="npc-record-date" className="modal-label">
                  기록 일자
                </label>
                <input
                  id="npc-record-date"
                  type="date"
                  className="modal-input"
                  value={recordDate}
                  onChange={event => setRecordDate(event.target.value)}
                />
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

              <div className="npc-modal-actions">
                <button
                  type="button"
                  className="modal-secondary-button"
                  onClick={() => setShowNpcRecordModal(false)}
                  disabled={isSubmittingRecord}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="modal-primary-button"
                  disabled={isSubmittingRecord}
                >
                  {isSubmittingRecord ? '저장 중...' : '기록 저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNpcRequestModal && (
        <div className="npc-modal-overlay" role="dialog" aria-modal="true">
          <div className="npc-modal">
            <div className="npc-modal-header">
              <h3>NPC-1000 자재 요청</h3>
              <button
                type="button"
                className="npc-modal-close"
                onClick={() => setShowNpcRequestModal(false)}
                aria-label="닫기"
              >
                <X size={18} />
              </button>
            </div>
            <form className="npc-modal-body" onSubmit={handleNpcRequestSubmit}>
              <div className="npc-modal-field" role="group" aria-label="선택된 현장">
                <span className="modal-label">현장</span>
                <span className="modal-value">{currentSite?.name ?? '-'}</span>
              </div>

              <div className="npc-modal-field">
                <label htmlFor="npc-request-quantity" className="modal-label">
                  요청 수량 (말)
                </label>
                <input
                  id="npc-request-quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  className="modal-input"
                  value={requestQuantity}
                  onChange={event => setRequestQuantity(event.target.value)}
                  placeholder="0"
                  inputMode="decimal"
                />
              </div>

              <div className="npc-modal-field">
                <label htmlFor="npc-request-urgency" className="modal-label">
                  긴급도
                </label>
                <select
                  id="npc-request-urgency"
                  className="modal-select"
                  value={requestUrgency}
                  onChange={event =>
                    setRequestUrgency(
                      event.target.value === 'urgent'
                        ? 'urgent'
                        : event.target.value === 'emergency'
                          ? 'emergency'
                          : 'normal'
                    )
                  }
                >
                  <option value="normal">일반</option>
                  <option value="urgent">긴급</option>
                  <option value="emergency">최우선</option>
                </select>
              </div>

              <div className="npc-modal-field">
                <label htmlFor="npc-request-notes" className="modal-label">
                  요청 내용
                </label>
                <textarea
                  id="npc-request-notes"
                  className="modal-textarea"
                  rows={4}
                  value={requestNotes}
                  onChange={event => setRequestNotes(event.target.value)}
                  placeholder="필요 수량과 사유를 입력해주세요."
                />
              </div>

              <div className="npc-modal-actions">
                <button
                  type="button"
                  className="modal-secondary-button"
                  onClick={() => setShowNpcRequestModal(false)}
                  disabled={isSubmittingRequest}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="modal-primary-button"
                  disabled={isSubmittingRequest}
                >
                  {isSubmittingRequest ? '요청 중...' : '요청 등록'}
                </button>
              </div>
            </form>
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
