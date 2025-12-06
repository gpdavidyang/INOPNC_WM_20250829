'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import SiteForm from '@/components/admin/sites/SiteForm'
import {
  BrandTabs as Tabs,
  BrandTabsContent as TabsContent,
  BrandTabsList as TabsList,
  BrandTabsTrigger as TabsTrigger,
} from '@/components/ui/brand-tabs'
import DataTable, { type Column } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/use-confirm'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DEFAULT_SHARED_DOCUMENT_CATEGORIES,
  type SharedDocumentCategoryOption,
} from '@/lib/constants/shared-document-categories'
import {
  resolveSharedDocCategoryLabel,
  matchesSharedDocCategory,
} from '@/lib/documents/shared-documents'
import { openFileRecordInNewTab } from '@/lib/files/preview'
import { TableSkeleton } from '@/components/ui/loading-skeleton'
import StatsCard from '@/components/ui/stats-card'
import {
  MATERIAL_PRIORITY_BADGE_VARIANTS,
  MATERIAL_PRIORITY_LABELS,
  isMaterialPriorityValue,
  type MaterialPriorityValue,
} from '@/lib/materials/priorities'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import EmptyState from '@/components/ui/empty-state'
import { useRouter, useSearchParams } from 'next/navigation'
import InvoiceDocumentsManager, {
  InvoiceStageProgress,
} from '@/components/admin/invoice/InvoiceDocumentsManager'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, RefreshCw } from 'lucide-react'
import { SitePhotosPanel } from '@/components/admin/sites/SitePhotosPanel'
// Dialog replaced with dedicated page for assignments

// 한글 표시용 매핑 테이블
const CATEGORY_LABELS: Record<string, string> = {
  shared: '공유자료',
  markup: '도면마킹',
  required: '필수서류',
  required_user_docs: '필수서류(개인)',
  invoice: '기성청구',
  photo_grid: '사진대지',
  personal: '개인문서',
  certificate: '증명서류',
  blueprint: '도면류',
  drawing: '도면',
  report: '보고서',
  other: '기타',
  general: '일반',
}

type InvoiceStageKey = 'start' | 'progress' | 'completion'

const INVOICE_STAGE_LABELS: Record<InvoiceStageKey, string> = {
  start: '착수 단계',
  progress: '진행 단계',
  completion: '완료 단계',
}

const PRIORITY_NOTE_TAG_REGEX =
  /^\s*\[(?:낮음|보통|높음|긴급|일반|최우선|low|normal|high|urgent)\]\s*/i

const cleanPriorityNote = (note?: string | null): string => {
  if (!note) return ''
  return note.replace(PRIORITY_NOTE_TAG_REGEX, '').trim()
}

const numberFormatter = new Intl.NumberFormat('ko-KR')

const normalizeRequestItems = (rawItems: any[]): any[] => {
  if (!Array.isArray(rawItems)) return []
  return rawItems.map(item => ({
    id: item.id,
    material_id: item.material_id,
    requested_quantity: item.requested_quantity,
    approved_quantity: item.approved_quantity,
    delivered_quantity: item.delivered_quantity,
    unit_price: item.unit_price,
    notes: item.notes,
    material_name: item.material_name || item.materials?.name || null,
    material_code: item.material_code || item.materials?.code || null,
    specification: item.specification || item.materials?.specification || null,
    unit: item.unit || item.materials?.unit || null,
  }))
}

const normalizeRequests = (rows: any[], fallbackSiteName: string): Array<any> => {
  if (!Array.isArray(rows)) return []
  return rows.map(row => {
    const normalizedItems = normalizeRequestItems(row.items || row.material_request_items || [])
    const priorityValue = isMaterialPriorityValue(row?.priority)
      ? (row.priority as MaterialPriorityValue)
      : null
    return {
      ...row,
      priority: priorityValue,
      request_date: row.request_date || row.created_at || null,
      items: normalizedItems,
      material_request_items: normalizedItems,
      sites:
        row.sites && row.sites.name
          ? row.sites
          : {
              id: row.site_id || null,
              name: row.site_name || fallbackSiteName,
            },
    }
  })
}

const summarizeMaterial = (items: any[]): string => {
  if (!Array.isArray(items) || items.length === 0) return '-'
  const primary = items[0]
  const baseLabel = primary.material_name || primary.material_code || '자재'
  return items.length > 1 ? `${baseLabel} 외 ${items.length - 1}건` : baseLabel
}

const summarizeQuantity = (items: any[]): string => {
  if (!Array.isArray(items) || items.length === 0) return '-'
  const total = items.reduce(
    (sum: number, item: any) => sum + Number(item.requested_quantity ?? 0),
    0
  )
  if (!total) return '-'
  const unit = items.length === 1 ? items[0]?.unit || '' : ''
  const formatted = numberFormatter.format(total)
  return unit ? `${formatted} ${unit}` : formatted
}

const DEFAULT_SHARED_CATEGORY_LABEL_MAP = DEFAULT_SHARED_DOCUMENT_CATEGORIES.reduce(
  (acc, option) => {
    acc[option.value] = option.label
    return acc
  },
  {} as Record<string, string>
)

const STATUS_LABELS: Record<string, string> = {
  planning: '준비 중',
  active: '진행 중',
  inactive: '중단',
  completed: '완료',
  archived: '보관',
  deleted: '삭제됨',
  uploaded: '업로드됨',
  approved: '승인',
  pending: '대기',
  rejected: '반려',
  fulfilled: '완료',
  ordered: '발주',
  preparing: '준비 중',
  shipped: '출고',
  in_transit: '운송 중',
  delivered: '완료',
  cancelled: '취소',
}
// 현장 상태 전용 라벨 (개요 탭)
const SITE_STATUS_LABELS: Record<string, string> = {
  planning: '준비 중',
  active: '진행 중',
  inactive: '중단',
  completed: '완료',
}

const EMPTY_MATERIAL_STATS = {
  inventory_total: 0,
  low_stock: 0,
  out_of_stock: 0,
  pending_requests: 0,
  open_shipments: 0,
}

const QUANTITY_FORMATTER = new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
})

const INVENTORY_STATUS_LABELS: Record<string, string> = {
  normal: '정상',
  low: '부족',
  out: '소진',
}

const INVENTORY_STATUS_STYLES: Record<string, string> = {
  normal: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  low: 'border border-amber-200 bg-amber-50 text-amber-700',
  out: 'border border-rose-200 bg-rose-50 text-rose-700',
}

const STATUS_BADGE_STYLES: Record<string, string> = {
  pending: 'border border-amber-200 bg-amber-50 text-amber-700',
  approved: 'border border-blue-200 bg-blue-50 text-blue-700',
  ordered: 'border border-indigo-200 bg-indigo-50 text-indigo-700',
  fulfilled: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  delivered: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  preparing: 'border border-sky-200 bg-sky-50 text-sky-700',
  shipped: 'border border-purple-200 bg-purple-50 text-purple-700',
  in_transit: 'border border-purple-200 bg-purple-50 text-purple-700',
  cancelled: 'border border-slate-200 bg-slate-50 text-slate-600',
  rejected: 'border border-rose-200 bg-rose-50 text-rose-700',
}

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  in: '입고',
  out: '출고',
  usage: '사용',
  return: '반품',
  adjustment: '조정',
  transfer: '이동',
  shipment: '출고',
  shipped: '출고',
  production: '생산',
}

const TRANSACTION_TYPE_STYLES: Record<string, string> = {
  in: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  out: 'border border-purple-200 bg-purple-50 text-purple-700',
  usage: 'border border-purple-200 bg-purple-50 text-purple-700',
  shipment: 'border border-purple-200 bg-purple-50 text-purple-700',
  shipped: 'border border-purple-200 bg-purple-50 text-purple-700',
  return: 'border border-slate-200 bg-slate-50 text-slate-600',
  adjustment: 'border border-amber-200 bg-amber-50 text-amber-700',
  transfer: 'border border-sky-200 bg-sky-50 text-sky-700',
  production: 'border border-indigo-200 bg-indigo-50 text-indigo-700',
}

const REFERENCE_LABELS: Record<string, string> = {
  material_request: '입고요청',
  daily_report: '작업일지',
  shipment: '출고',
  production: '생산',
  adjustment: '재고조정',
}

const DEFAULT_BADGE_STYLE = 'border border-slate-200 bg-slate-50 text-slate-700'

const ORGANIZATION_TYPE_LABELS: Record<string, string> = {
  general_contractor: '원청',
  subcontractor: '협력사',
  supplier: '자재업체',
  partner: '파트너',
}

type Props = {
  siteId: string
  site: any
  organization?: any | null
  initialDocs: any[]
  initialReports: any[]
  initialAssignments: any[]
  initialRequests: any[]
}

export default function SiteDetailTabs({
  siteId,
  site,
  organization,
  initialDocs: _initialDocs,
  initialReports,
  initialAssignments,
  initialRequests,
}: Props) {
  const { confirm } = useConfirm()
  const { toast } = useToast()
  // Materials tab configuration flags
  const SHOW_INVENTORY_SNAPSHOT = process.env.NEXT_PUBLIC_SHOW_INVENTORY_SNAPSHOT === 'true'
  const ROLE_KO: Record<string, string> = {
    worker: '작업자',
    site_manager: '현장관리자',
    supervisor: '감리/감독',
  }
  const searchParams = useSearchParams()
  const router = useRouter()
  const normalizeTab = (value: string | null) => {
    if (!value) return 'overview'
    if (value === 'documents') return 'invoices'
    if (value === 'drawings') return 'shared'
    return value
  }
  const [tab, setTab] = useState<string>(normalizeTab(searchParams.get('tab')))

  useEffect(() => {
    const t = normalizeTab(searchParams.get('tab'))
    setTab(t)
  }, [searchParams])

  const onTabChange = (value: string) => {
    setTab(value)
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', value)
      router.replace(url.pathname + url.search)
    } catch {
      /* noop */
    }
  }
  const [drawings, setDrawings] = useState<any[]>([])
  const [drawingsLoading, setDrawingsLoading] = useState(false)
  const [stats, setStats] = useState<{ reports: number; labor: number } | null>(null)
  const [statsLoading, setStatsLoading] = useState<boolean>(true)
  const [invoiceProgress, setInvoiceProgress] = useState<InvoiceStageProgress | null>(null)
  const [sharedDocs, setSharedDocs] = useState<any[]>([])
  const [sharedDeleting, setSharedDeleting] = useState<Record<string, boolean>>({})
  const [sharedDocsLoading, setSharedDocsLoading] = useState(false)
  const [sharedDocsRefreshing, setSharedDocsRefreshing] = useState(false)
  const [sharedSubCategory, setSharedSubCategory] = useState<string>('all')
  const [sharedCategoryOptions, setSharedCategoryOptions] = useState<
    SharedDocumentCategoryOption[]
  >(DEFAULT_SHARED_DOCUMENT_CATEGORIES)
  const [sharedSearch, setSharedSearch] = useState('')
  const [sharedDateFrom, setSharedDateFrom] = useState('')
  const [sharedDateTo, setSharedDateTo] = useState('')
  const [sharedStats, setSharedStats] = useState<{
    total_documents: number
    by_type?: Record<string, number>
  } | null>(null)
  const [sharedDownloading, setSharedDownloading] = useState<Record<string, boolean>>({})
  const [sharedEditingDocId, setSharedEditingDocId] = useState<string | null>(null)
  const [sharedEditDraft, setSharedEditDraft] = useState<{
    title: string
    subCategory: string | null
  } | null>(null)
  const [sharedUpdating, setSharedUpdating] = useState<Record<string, boolean>>({})
  const [sharedWorklogMeta, setSharedWorklogMeta] = useState<
    Record<
      string,
      {
        work_date?: string | null
        component_name?: string | null
        work_process?: string | null
        process_type?: string | null
      }
    >
  >({})
  const sharedCategoryLabelMap = useMemo(() => {
    const next = { ...DEFAULT_SHARED_CATEGORY_LABEL_MAP }
    sharedCategoryOptions.forEach(option => {
      next[option.value] = option.label
    })
    return next
  }, [sharedCategoryOptions])
  const sharedFilterOptions = useMemo(
    () => [{ value: 'all', label: '전체' }, ...sharedCategoryOptions],
    [sharedCategoryOptions]
  )
  const sharedSubCategoryLabel = useMemo(() => {
    return sharedFilterOptions.find(option => option.value === sharedSubCategory)?.label || '전체'
  }, [sharedFilterOptions, sharedSubCategory])
  const resolveSharedCategoryLabel = useCallback(
    (doc: any) => resolveSharedDocCategoryLabel(doc, sharedCategoryLabelMap),
    [sharedCategoryLabelMap]
  )
  const formatSharedWorklogLabel = useCallback(
    (id: string): string => {
      const meta = sharedWorklogMeta[id]
      if (!meta) return `#${id}`
      const dateLabel = meta.work_date
        ? new Date(meta.work_date).toLocaleDateString('ko-KR')
        : '날짜 미정'
      const componentLabel = meta.component_name || '부재 미정'
      const processLabel = meta.work_process || meta.process_type || '공정 미정'
      return `${dateLabel} · ${componentLabel} · ${processLabel}`
    },
    [sharedWorklogMeta]
  )
  const fallbackSiteName = (site?.name as string | undefined) || '-'
  const [recentReports, setRecentReports] = useState<any[]>(initialReports || [])
  // Reports tab state
  const [reportsQuery, setReportsQuery] = useState('')
  const [reportsSort, setReportsSort] = useState<
    'date_desc' | 'date_asc' | 'status' | 'workers_desc' | 'workers_asc'
  >('date_desc')
  const [reportsPage, setReportsPage] = useState(0)
  const [reportsPageSize, setReportsPageSize] = useState(20)
  const [reportsHasNext, setReportsHasNext] = useState(false)
  const [reportsTotal, setReportsTotal] = useState<number | null>(null)
  const [recentAssignments, setRecentAssignments] = useState<any[]>(initialAssignments || [])
  const [recentRequests, setRecentRequests] = useState<any[]>(
    normalizeRequests(initialRequests || [], fallbackSiteName)
  )
  const [laborByUser, setLaborByUser] = useState<Record<string, number>>({})
  const [globalLaborByUser, setGlobalLaborByUser] = useState<Record<string, number>>({})
  const [sharedView, setSharedView] = useState<'drawings' | 'documents'>('documents')
  const [reportsLoading, setReportsLoading] = useState(false)
  const [assignmentsLoading, setAssignmentsLoading] = useState(false)
  const [requestsLoading, setRequestsLoading] = useState(false)
  // Assignments UI state
  // Assignments now handled on dedicated page: /dashboard/admin/sites/[id]/assign
  const [assignmentQuery, setAssignmentQuery] = useState('')
  const [assignmentSort, setAssignmentSort] = useState<
    | 'name_asc'
    | 'name_desc'
    | 'role'
    | 'company'
    | 'date_desc'
    | 'date_asc'
    | 'labor_desc'
    | 'labor_asc'
  >('date_desc')
  const [availableCount, setAvailableCount] = useState<number | null>(null)
  const [assignmentRole, setAssignmentRole] = useState<
    'all' | 'worker' | 'site_manager' | 'supervisor'
  >('all')

  // Materials tab state
  const [materialsQuery, setMaterialsQuery] = useState('')
  const [materialsSort, setMaterialsSort] = useState<
    'date_desc' | 'date_asc' | 'status' | 'number'
  >('date_desc')
  const [materialsStatus, setMaterialsStatus] = useState<
    'all' | 'pending' | 'approved' | 'rejected' | 'fulfilled' | 'cancelled'
  >('all')
  const [inventory, setInventory] = useState<any[]>([])
  const [shipments, setShipments] = useState<any[]>([])
  const [materialsStats, setMaterialsStats] = useState({ ...EMPTY_MATERIAL_STATS })
  const [invLoading, setInvLoading] = useState(false)
  const [shipLoading, setShipLoading] = useState(false)
  const [invQuery, setInvQuery] = useState('')
  const [shipQuery, setShipQuery] = useState('')
  // Pagination states
  const [assignPage, setAssignPage] = useState(0)
  const [assignPageSize, setAssignPageSize] = useState(20)
  const [assignHasNext, setAssignHasNext] = useState(false)

  const fetchSharedDocs = useCallback(
    async (options?: { silent?: boolean; subCategory?: string }) => {
      const silent = options?.silent ?? false
      const subCategory = options?.subCategory ?? sharedSubCategory
      const limit = 20
      if (silent) setSharedDocsRefreshing(true)
      else setSharedDocsLoading(true)
      try {
        const params = new URLSearchParams({
          category: 'shared',
          limit: String(limit),
        })
        if (subCategory && subCategory !== 'all') {
          params.set('type', subCategory)
        }
        const res = await fetch(`/api/admin/sites/${siteId}/documents?${params.toString()}`, {
          cache: 'no-store',
          credentials: 'include',
        })
        const json = await res.json().catch(() => ({}))
        if (res.ok && json?.success && Array.isArray(json.data)) {
          const sorted = [...json.data].sort((a: any, b: any) => {
            const ad = new Date(a.created_at || 0).getTime()
            const bd = new Date(b.created_at || 0).getTime()
            return bd - ad
          })
          setSharedDocs(sorted.slice(0, limit))
          setSharedStats(
            json?.statistics && typeof json.statistics === 'object'
              ? (json.statistics as { total_documents: number; by_type?: Record<string, number> })
              : null
          )
          if (json?.worklog_map && typeof json.worklog_map === 'object') {
            setSharedWorklogMeta(json.worklog_map as Record<string, any>)
          } else {
            setSharedWorklogMeta({})
          }
        }
      } catch {
        void 0
      } finally {
        if (silent) setSharedDocsRefreshing(false)
        else setSharedDocsLoading(false)
      }
    },
    [sharedSubCategory, siteId]
  )

  useEffect(() => {
    let mounted = true
    const controller = new AbortController()
    async function loadSharedCategories() {
      try {
        const res = await fetch('/api/admin/document-categories/shared', {
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        })
        const json = await res.json().catch(() => ({}))
        if (!mounted) return
        if (res.ok && Array.isArray(json?.data)) {
          setSharedCategoryOptions(json.data)
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Failed to load shared document categories, using defaults.', error)
        }
      }
    }
    void loadSharedCategories()
    return () => {
      mounted = false
      controller.abort()
    }
  }, [])

  useEffect(() => {
    if (sharedSubCategory === 'all') return
    const exists = sharedCategoryOptions.some(option => option.value === sharedSubCategory)
    if (!exists) setSharedSubCategory('all')
  }, [sharedCategoryOptions, sharedSubCategory])

  const startSharedEdit = useCallback(
    (doc: any) => {
      if (doc?.metadata?.source_table === 'markup_documents') {
        const markupId =
          doc?.metadata?.markup_document_id ||
          doc?.metadata?.source_id ||
          (typeof doc?.id === 'string' && doc.id.startsWith('shared-')
            ? doc.id.replace('shared-', '')
            : null)
        if (markupId) {
          try {
            router.push(`/dashboard/admin/tools/markup?docId=${markupId}`)
          } catch {
            window.location.href = `/dashboard/admin/tools/markup?docId=${markupId}`
          }
        } else {
          toast({
            title: '연결된 도면을 찾을 수 없습니다',
            description: '도면마킹 문서 ID를 확인할 수 없습니다.',
            variant: 'destructive',
          })
        }
        return
      }
      const docId = doc?.id ? String(doc.id) : null
      if (!docId) {
        toast({
          title: '수정할 수 없습니다',
          description: '문서 식별자를 찾을 수 없습니다.',
          variant: 'destructive',
        })
        return
      }
      const meta =
        doc?.metadata && typeof doc.metadata === 'object'
          ? (doc.metadata as Record<string, any>)
          : {}
      const initialTitle =
        typeof doc?.title === 'string' && doc.title.trim().length > 0
          ? doc.title
          : doc?.file_name || meta?.file_name || ''
      const rawSubCategory =
        (typeof doc?.sub_category === 'string' && doc.sub_category) ||
        (typeof meta?.sub_category === 'string' && meta.sub_category) ||
        (typeof meta?.subcategory === 'string' && meta.subcategory) ||
        null
      const normalizedSubCategory =
        typeof rawSubCategory === 'string' && rawSubCategory.trim().length > 0
          ? rawSubCategory.trim()
          : null
      setSharedEditingDocId(docId)
      setSharedEditDraft({
        title: initialTitle || '',
        subCategory: normalizedSubCategory,
      })
    },
    [toast]
  )

  const cancelSharedEdit = useCallback(() => {
    setSharedEditingDocId(null)
    setSharedEditDraft(null)
  }, [])

  const handleSharedEditSubmit = useCallback(async () => {
    if (!sharedEditingDocId || !sharedEditDraft) return
    const docId = sharedEditingDocId
    const trimmedTitle = (sharedEditDraft.title || '').trim()
    if (trimmedTitle.length === 0) {
      toast({
        title: '문서명을 입력해 주세요',
        description: '문서명은 비워둘 수 없습니다.',
        variant: 'destructive',
      })
      return
    }

    setSharedUpdating(prev => ({ ...prev, [docId]: true }))

    try {
      const payload = {
        id: docId,
        title: trimmedTitle,
        sub_category: sharedEditDraft.subCategory,
      }
      const res = await fetch(`/api/admin/sites/${siteId}/documents`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.success || !json?.data) {
        const message = json?.error || res.statusText || '공유자료 정보를 수정할 수 없습니다.'
        throw new Error(message)
      }

      const updatedDoc = json.data
      setSharedDocs(prev =>
        Array.isArray(prev)
          ? prev.map(item => (String(item?.id) === docId ? updatedDoc : item))
          : prev
      )
      toast({
        title: '수정 완료',
        description: '문서 정보가 업데이트되었습니다.',
      })
      cancelSharedEdit()
      void fetchSharedDocs({ silent: true })
    } catch (error: any) {
      console.error('Shared document update failed:', error)
      toast({
        title: '수정 실패',
        description: error?.message || '공유자료 정보를 수정할 수 없습니다.',
        variant: 'destructive',
      })
    } finally {
      setSharedUpdating(prev => {
        const next = { ...prev }
        delete next[docId]
        return next
      })
    }
  }, [cancelSharedEdit, fetchSharedDocs, sharedEditDraft, sharedEditingDocId, siteId, toast])

  const handleSharedDelete = useCallback(
    async (doc: any) => {
      const docId = doc?.id ? String(doc.id) : null
      if (!docId) {
        toast({
          title: '삭제할 수 없습니다',
          description: '문서 식별자를 찾을 수 없습니다.',
          variant: 'destructive',
        })
        return
      }
      if (doc?.metadata?.source_table === 'markup_documents') {
        toast({
          title: '삭제할 수 없습니다',
          description: '도면마킹 문서는 도면마킹 도구에서 삭제하세요.',
          variant: 'destructive',
        })
        return
      }

      const ok = await confirm({
        title: '공유자료 삭제',
        description: '선택한 공유자료를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
        confirmText: '삭제',
        cancelText: '취소',
        variant: 'destructive',
      })
      if (!ok) return

      setSharedDeleting(prev => ({ ...prev, [docId]: true }))
      try {
        const res = await fetch(
          `/api/admin/sites/${siteId}/documents?id=${encodeURIComponent(docId)}`,
          {
            method: 'DELETE',
            credentials: 'include',
          }
        )
        const json = await res.json().catch(() => ({}))
        if (!res.ok || json?.error) {
          const message = json?.error || res.statusText || '삭제에 실패했습니다.'
          throw new Error(message)
        }

        setSharedDocs(prev => prev.filter(item => String(item?.id) !== docId))
        if (sharedEditingDocId === docId) {
          cancelSharedEdit()
        }
        toast({ title: '삭제 완료', description: '공유자료가 삭제되었습니다.' })
        void fetchSharedDocs({ silent: true })
      } catch (error: any) {
        console.error('Shared document delete failed:', error)
        toast({
          title: '삭제 실패',
          description: error?.message || '공유자료 삭제에 실패했습니다.',
          variant: 'destructive',
        })
      } finally {
        setSharedDeleting(prev => {
          const next = { ...prev }
          delete next[docId]
          return next
        })
      }
    },
    [cancelSharedEdit, confirm, fetchSharedDocs, sharedEditingDocId, siteId, toast]
  )

  const handleSharedDownload = useCallback(
    async (doc: any) => {
      const docId = doc?.id ? String(doc.id) : null
      const fileUrl = doc ? getSharedDocFileUrl(doc) : null

      if (!fileUrl) {
        toast({
          title: '다운로드할 수 없습니다',
          description: '파일 경로를 찾을 수 없습니다.',
          variant: 'destructive',
        })
        return
      }

      if (docId) {
        setSharedDownloading(prev => ({ ...prev, [docId]: true }))
      }

      try {
        const response = await fetch(fileUrl, { cache: 'no-store' })
        if (!response.ok) {
          throw new Error(`Failed to fetch file. Status: ${response.status}`)
        }
        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        const meta =
          doc?.metadata && typeof doc.metadata === 'object'
            ? (doc.metadata as Record<string, any>)
            : {}
        const originalExt =
          meta?.original_extension ||
          meta?.extension ||
          meta?.file_extension ||
          (doc?.file_name && doc.file_name.includes('.') ? doc.file_name.split('.').pop() : '')
        let fileName = doc?.file_name || doc?.title || 'shared-document'
        if (originalExt && fileName && !fileName.includes('.'))
          fileName = `${fileName}.${originalExt}`
        const disposition = response.headers.get('Content-Disposition')
        if (!fileName && disposition) {
          const match = disposition.match(/filename[^;=\n]*=((['\"]).*?\2|[^;\n]*)/)
          if (match?.[1]) fileName = match[1].replace(/['"]/g, '')
        }
        link.href = blobUrl
        link.download = fileName || 'shared-document'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000)
      } catch (error) {
        console.error('Shared document download failed:', error)
        toast({
          title: '다운로드 실패',
          description: '파일을 저장할 수 없습니다. 다시 시도해 주세요.',
          variant: 'destructive',
        })
      } finally {
        if (docId) {
          setSharedDownloading(prev => {
            const next = { ...prev }
            delete next[docId]
            return next
          })
        }
      }
    },
    [toast]
  )

  const invoiceStageSummary = useMemo(() => {
    if (!invoiceProgress) return null
    const keys: InvoiceStageKey[] = ['start', 'progress', 'completion']
    const items = keys.map(key => {
      const required = invoiceProgress[key]?.required ?? 0
      const fulfilled = invoiceProgress[key]?.fulfilled ?? 0
      const ratio = required > 0 ? Math.min(fulfilled / required, 1) : 0
      return { key, required, fulfilled, ratio }
    })
    const totalRequired = items.reduce((acc, item) => acc + item.required, 0)
    const totalFulfilled = items.reduce(
      (acc, item) => acc + Math.min(item.fulfilled, item.required),
      0
    )
    return { items, totalRequired, totalFulfilled }
  }, [invoiceProgress])
  const [assignTotal, setAssignTotal] = useState<number | null>(null)
  const [reqPage, setReqPage] = useState(0)
  const [reqPageSize, setReqPageSize] = useState(20)
  const [reqHasNext, setReqHasNext] = useState(false)
  const [reqTotal, setReqTotal] = useState<number | null>(null)
  const [reqRows, setReqRows] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [txnLoading, setTxnLoading] = useState(false)
  const [txnPage, setTxnPage] = useState(0)
  const [txnPageSize, setTxnPageSize] = useState(20)
  const [txnHasNext, setTxnHasNext] = useState(false)
  const [txnQuery, setTxnQuery] = useState('')
  const [txnTotal, setTxnTotal] = useState<number | null>(null)
  const isSharedDocsRefreshing =
    sharedDocsRefreshing || (sharedDocsLoading && sharedDocs.length > 0)
  const sharedTotalDocuments = sharedStats?.total_documents ?? sharedDocs.length
  const sharedDocumentCount = sharedStats?.by_type?.document ?? null
  const sharedPhotoCount = sharedStats?.by_type?.photo ?? null
  const normalizedSharedSearch = sharedSearch.trim().toLowerCase()
  const filteredSharedDocs = useMemo(() => {
    return sharedDocs.filter(doc => {
      const title = String(doc?.title || doc?.file_name || '').toLowerCase()
      const description = String(doc?.description || '').toLowerCase()
      const uploader = String(doc?.profiles?.full_name || '').toLowerCase()
      const categoryLabel = resolveSharedCategoryLabel(doc).toLowerCase()
      const searchTarget = `${title} ${description} ${uploader} ${categoryLabel}`
      const matchesSearch = normalizedSharedSearch
        ? searchTarget.includes(normalizedSharedSearch)
        : true

      const createdAt = typeof doc?.created_at === 'string' ? doc.created_at.slice(0, 10) : ''
      const matchesFrom = sharedDateFrom ? createdAt >= sharedDateFrom : true
      const matchesTo = sharedDateTo ? createdAt <= sharedDateTo : true

      return matchesSearch && matchesFrom && matchesTo
    })
  }, [normalizedSharedSearch, resolveSharedCategoryLabel, sharedDateFrom, sharedDateTo, sharedDocs])
  const filteredSharedCount = filteredSharedDocs.length

  type InventoryDisplayRow = {
    id: string
    material: ReactNode
    code: string
    quantity: ReactNode
    minimum: ReactNode
    status: ReactNode
    updated: string
  }

  type RequestDisplayRow = {
    id: string
    site: ReactNode
    material: ReactNode
    quantity: ReactNode
    requester: ReactNode
    date: string
    priority: ReactNode
    notes: ReactNode
  }

  type ShipmentDisplayRow = {
    id: string
    number: ReactNode
    items: ReactNode
    quantity: ReactNode
    status: ReactNode
    date: string
  }

  type TransactionDisplayRow = {
    id: string
    date: string
    type: ReactNode
    material: ReactNode
    quantity: ReactNode
    reference: ReactNode
  }

  const inventoryColumns: Column<InventoryDisplayRow>[] = [
    { key: 'material', header: '자재', render: row => row.material },
    { key: 'code', header: '코드', accessor: row => row.code },
    { key: 'quantity', header: '재고', align: 'right', render: row => row.quantity },
    { key: 'minimum', header: '최소재고', align: 'right', render: row => row.minimum },
    { key: 'status', header: '상태', render: row => row.status },
    { key: 'updated', header: '업데이트', accessor: row => row.updated },
  ]

  const requestColumns: Column<RequestDisplayRow>[] = [
    { key: 'site', header: '현장명', render: row => row.site },
    { key: 'material', header: '자재명', render: row => row.material },
    { key: 'quantity', header: '요청수량', align: 'right', render: row => row.quantity },
    { key: 'requester', header: '요청자', render: row => row.requester },
    { key: 'date', header: '요청일', accessor: row => row.date },
    { key: 'priority', header: '긴급도', render: row => row.priority },
    { key: 'notes', header: '비고', render: row => row.notes },
  ]

  const shipmentColumns: Column<ShipmentDisplayRow>[] = [
    { key: 'number', header: '출고번호', render: row => row.number },
    { key: 'items', header: '품목', render: row => row.items },
    { key: 'quantity', header: '수량', align: 'right', render: row => row.quantity },
    { key: 'status', header: '상태', render: row => row.status },
    { key: 'date', header: '출고일', accessor: row => row.date },
  ]

  const transactionColumns: Column<TransactionDisplayRow>[] = [
    { key: 'date', header: '일자', accessor: row => row.date },
    { key: 'type', header: '유형', render: row => row.type },
    { key: 'material', header: '자재', render: row => row.material },
    { key: 'quantity', header: '수량', align: 'right', render: row => row.quantity },
    { key: 'reference', header: '참조', render: row => row.reference },
  ]

  const filteredInventory = useMemo(() => {
    return (Array.isArray(inventory) ? inventory : []).filter((it: any) => {
      const q = invQuery.trim().toLowerCase()
      if (!q) return true
      const name = String(it?.materials?.name || '').toLowerCase()
      const code = String(it?.materials?.code || '').toLowerCase()
      return name.includes(q) || code.includes(q)
    })
  }, [inventory, invQuery])

  const inventoryTableRows: InventoryDisplayRow[] = useMemo(() => {
    return filteredInventory.map((it: any) => {
      const linkTarget = it?.materials?.code
        ? `/dashboard/admin/materials?tab=inventory&search=${encodeURIComponent(it.materials.code)}&site_id=${siteId}`
        : null

      const nameNode = (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{it?.materials?.name || '-'}</span>
          {it?.materials?.specification ? (
            <span className="text-xs text-muted-foreground">{it.materials.specification}</span>
          ) : null}
        </div>
      )

      return {
        id: String(it?.id || ''),
        material:
          linkTarget !== null ? (
            <a
              href={linkTarget}
              className="underline text-blue-600"
              title="자재관리 인벤토리로 이동"
            >
              {nameNode}
            </a>
          ) : (
            nameNode
          ),
        code: it?.materials?.code || '-',
        quantity: formatQuantityDisplay(it?.quantity, it?.materials?.unit),
        minimum:
          it?.minimum_stock !== null && it?.minimum_stock !== undefined
            ? formatQuantityDisplay(it.minimum_stock, it?.materials?.unit)
            : '-',
        status: renderInventoryStatusBadge(it?.status),
        updated: it?.last_updated ? new Date(it.last_updated).toLocaleDateString('ko-KR') : '-',
      }
    })
  }, [filteredInventory, siteId])

  const requestTableRows: RequestDisplayRow[] = useMemo(() => {
    return (reqRows || []).map((rq: any, idx?: number) => {
      const requestId = rq?.id || String(idx ?? '')
      const requestNumber = rq?.request_number || requestId
      const siteName = rq?.sites?.name || fallbackSiteName
      const materialSummary = renderRequestItemsCell(rq?.material_request_items)
      const detailLink = (
        <a
          className="text-xs text-primary underline-offset-2 hover:underline"
          href={`/dashboard/admin/materials/requests/${requestId}`}
        >
          요청 상세
        </a>
      )
      const priorityValue = isMaterialPriorityValue(rq?.priority)
        ? (rq.priority as MaterialPriorityValue)
        : null
      const notes = cleanPriorityNote(rq?.notes)
      return {
        id: requestId,
        site: (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{siteName}</span>
            <span className="text-xs text-muted-foreground">{requestNumber}</span>
          </div>
        ),
        material: (
          <div className="flex flex-col gap-1">
            {materialSummary}
            {detailLink}
          </div>
        ),
        quantity: renderRequestQuantityCell(rq?.material_request_items),
        requester: rq?.requested_by ? (
          <a
            href={`/dashboard/admin/users/${rq.requested_by}`}
            className="underline-offset-2 hover:underline"
            title="사용자 상세 보기"
          >
            {rq?.requester?.full_name || rq?.requested_by}
          </a>
        ) : (
          <span>{rq?.requester?.full_name || '-'}</span>
        ),
        date: rq?.request_date ? new Date(rq.request_date).toLocaleDateString('ko-KR') : '-',
        priority: priorityValue ? (
          <Badge variant={MATERIAL_PRIORITY_BADGE_VARIANTS[priorityValue]}>
            {MATERIAL_PRIORITY_LABELS[priorityValue]}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
        notes: (
          <span className="text-sm text-foreground max-w-[200px] truncate">{notes || '-'}</span>
        ),
      }
    })
  }, [reqRows, fallbackSiteName])

  const filteredShipments = useMemo(() => {
    return (Array.isArray(shipments) ? shipments : []).filter((s: any) => {
      const q = shipQuery.trim().toLowerCase()
      if (!q) return true
      const num = String(s?.shipment_number || s?.id || '').toLowerCase()
      const st = String(s?.status || '').toLowerCase()
      return num.includes(q) || st.includes(q)
    })
  }, [shipments, shipQuery])

  const shipmentTableRows: ShipmentDisplayRow[] = useMemo(
    () =>
      filteredShipments.map((s: any) => ({
        id: String(s?.id || ''),
        number: (
          <a
            href={`/dashboard/admin/materials/shipments/${s.id}`}
            className="underline text-blue-600"
          >
            {s?.shipment_number || s?.id}
          </a>
        ),
        items: renderShipmentItemsCell(s?.shipment_items),
        quantity: renderShipmentQuantityCell(s?.shipment_items),
        status: renderStatusBadge(s?.status),
        date: s?.shipment_date ? new Date(s.shipment_date).toLocaleDateString('ko-KR') : '-',
      })),
    [filteredShipments]
  )

  const filteredTransactions = useMemo(() => {
    return (transactions || []).filter((t: any) => {
      const q = txnQuery.trim().toLowerCase()
      if (!q) return true
      const name = String(t?.materials?.name || '').toLowerCase()
      const code = String(t?.materials?.code || '').toLowerCase()
      return name.includes(q) || code.includes(q)
    })
  }, [transactions, txnQuery])

  const transactionTableRows: TransactionDisplayRow[] = useMemo(
    () =>
      filteredTransactions.map((t: any) => ({
        id: String(t?.id || ''),
        date: t?.transaction_date ? new Date(t.transaction_date).toLocaleDateString('ko-KR') : '-',
        type: renderTransactionTypeBadge(t?.transaction_type),
        material: renderTransactionMaterialCell(t),
        quantity: formatQuantityDisplay(t?.quantity, t?.materials?.unit),
        reference: renderTransactionReferenceCell(t),
      })),
    [filteredTransactions]
  )

  // Load drawings for site (uses server API with fallback to documents)
  useEffect(() => {
    let ignore = false
    ;(async () => {
      setDrawingsLoading(true)
      try {
        const res = await fetch(
          `/api/docs/drawings?siteId=${encodeURIComponent(siteId)}&limit=50`,
          {
            cache: 'no-store',
            credentials: 'include',
          }
        )
        const j = await res.json().catch(() => ({}))
        if (!ignore && res.ok && j?.success) setDrawings(Array.isArray(j.data) ? j.data : [])
      } finally {
        setDrawingsLoading(false)
      }
    })()
    return () => {
      ignore = true
    }
  }, [siteId])

  // Assignments tab: server-backed search/sort (fallback to client for labor sorting)
  useEffect(() => {
    if (tab !== 'assignments') return
    let active = true
    ;(async () => {
      try {
        setAssignmentsLoading(true)
        const params = new URLSearchParams()
        if (assignmentQuery.trim()) params.set('q', assignmentQuery.trim())
        if (assignmentRole !== 'all') params.set('role', assignmentRole)
        // Map sort for server (labor sorts handled client-side)
        let sort: 'name' | 'role' | 'company' | 'date' = 'date'
        let order: 'asc' | 'desc' = 'desc'
        switch (assignmentSort) {
          case 'name_asc':
            sort = 'name'
            order = 'asc'
            break
          case 'name_desc':
            sort = 'name'
            order = 'desc'
            break
          case 'role':
            sort = 'role'
            order = 'asc'
            break
          case 'company':
            sort = 'company'
            order = 'asc'
            break
          case 'date_asc':
            sort = 'date'
            order = 'asc'
            break
          case 'date_desc':
          case 'labor_desc':
          case 'labor_asc':
          default:
            sort = 'date'
            order = 'desc'
            break
        }
        params.set('sort', sort)
        params.set('order', order)
        params.set('limit', String(assignPageSize + 1))
        params.set('offset', String(assignPage * assignPageSize))
        const res = await fetch(`/api/admin/sites/${siteId}/assignments?${params.toString()}`, {
          cache: 'no-store',
          credentials: 'include',
        })
        const j = await res.json().catch(() => ({}))
        if (!active) return
        if (res.ok && j?.success && Array.isArray(j.data)) {
          const arr = j.data as any[]
          setAssignHasNext(arr.length > assignPageSize)
          setRecentAssignments(arr.slice(0, assignPageSize))
          if (typeof j.total === 'number') setAssignTotal(j.total)
        }
      } catch {
        // noop
      } finally {
        if (active) setAssignmentsLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [tab, assignmentQuery, assignmentSort, assignmentRole, siteId, assignPage, assignPageSize])

  // Materials tab: fetch inventory + shipments summary
  useEffect(() => {
    if (tab !== 'materials') return
    let active = true
    ;(async () => {
      try {
        setInvLoading(true)
        setShipLoading(true)
        const res = await fetch(`/api/admin/sites/${siteId}/materials/summary`, {
          cache: 'no-store',
          credentials: 'include',
        })
        const j = await res.json().catch(() => ({}))
        if (!active) return
        if (res.ok && j?.success) {
          const inventoryData = Array.isArray(j.data?.inventory) ? j.data.inventory : []
          const shipmentData = Array.isArray(j.data?.shipments) ? j.data.shipments : []
          setInventory(inventoryData)
          setShipments(shipmentData)
          if (j.data?.stats) {
            setMaterialsStats({
              inventory_total: Number(j.data.stats.inventory_total ?? 0) || 0,
              low_stock: Number(j.data.stats.low_stock ?? 0) || 0,
              out_of_stock: Number(j.data.stats.out_of_stock ?? 0) || 0,
              pending_requests: Number(j.data.stats.pending_requests ?? 0) || 0,
              open_shipments: Number(j.data.stats.open_shipments ?? 0) || 0,
            })
          } else {
            setMaterialsStats({ ...EMPTY_MATERIAL_STATS })
          }
        } else {
          setInventory([])
          setShipments([])
          setMaterialsStats({ ...EMPTY_MATERIAL_STATS })
        }
      } catch {
        // noop
      } finally {
        if (active) {
          setInvLoading(false)
          setShipLoading(false)
        }
      }
    })()
    return () => {
      active = false
    }
  }, [tab, siteId])

  // Materials tab: fetch requests (paged)
  useEffect(() => {
    if (tab !== 'materials') return
    let active = true
    ;(async () => {
      try {
        setRequestsLoading(true)
        const params = new URLSearchParams()
        if (materialsQuery.trim()) params.set('q', materialsQuery.trim())
        if (materialsStatus !== 'all') params.set('status', materialsStatus)
        // sort mapping
        let sort: 'date' | 'status' | 'number' = 'date'
        let order: 'asc' | 'desc' = 'desc'
        switch (materialsSort) {
          case 'date_asc':
            sort = 'date'
            order = 'asc'
            break
          case 'status':
            sort = 'status'
            order = 'asc'
            break
          case 'number':
            sort = 'number'
            order = 'asc'
            break
          case 'date_desc':
          default:
            sort = 'date'
            order = 'desc'
        }
        params.set('sort', sort)
        params.set('order', order)
        params.set('limit', String(reqPageSize + 1))
        params.set('offset', String(reqPage * reqPageSize))
        const res = await fetch(
          `/api/admin/sites/${siteId}/materials/requests?${params.toString()}`,
          {
            cache: 'no-store',
            credentials: 'include',
          }
        )
        const j = await res.json().catch(() => ({}))
        if (!active) return
        if (res.ok && j?.success && Array.isArray(j.data)) {
          const arr = j.data as any[]
          setReqHasNext(arr.length > reqPageSize)
          setReqRows(arr.slice(0, reqPageSize))
          if (typeof j.total === 'number') setReqTotal(j.total)
        } else {
          setReqHasNext(false)
          setReqRows([])
          setReqTotal(0)
        }
      } finally {
        if (active) setRequestsLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [tab, siteId, materialsQuery, materialsStatus, materialsSort, reqPage, reqPageSize])

  // Materials tab: fetch transactions (paged)
  useEffect(() => {
    if (tab !== 'materials') return
    let active = true
    ;(async () => {
      try {
        setTxnLoading(true)
        const params = new URLSearchParams()
        if (txnQuery.trim()) params.set('q', txnQuery.trim())
        params.set('limit', String(txnPageSize + 1))
        params.set('offset', String(txnPage * txnPageSize))
        const res = await fetch(
          `/api/admin/sites/${siteId}/materials/transactions?${params.toString()}`,
          {
            cache: 'no-store',
            credentials: 'include',
          }
        )
        const j = await res.json().catch(() => ({}))
        if (!active) return
        if (res.ok && j?.success && Array.isArray(j.data)) {
          const arr = j.data as any[]
          setTxnHasNext(arr.length > txnPageSize)
          setTransactions(arr.slice(0, txnPageSize))
          if (typeof j.total === 'number') setTxnTotal(j.total)
        } else {
          setTxnHasNext(false)
          setTransactions([])
          setTxnTotal(0)
        }
      } finally {
        if (active) setTxnLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [tab, siteId, txnQuery, txnPage, txnPageSize])

  // Load site statistics (작업일지 수, 총공수)
  useEffect(() => {
    let active = true
    setStatsLoading(true)
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/sites/${siteId}/stats`, {
          cache: 'no-store',
          credentials: 'include',
        })
        const json = await res.json().catch(() => ({}))
        if (!active) return
        if (res.ok && json?.success) {
          setStats({
            reports: json.data?.daily_reports_count || 0,
            labor: json.data?.total_labor_hours || 0,
          })
        } else {
          setStats({ reports: 0, labor: 0 })
        }
      } catch (_) {
        if (active) setStats({ reports: 0, labor: 0 })
      } finally {
        if (active) setStatsLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [siteId])

  // Client-side refresh for recent sections (ensures data even if SSR missed due to env/RLS)
  useEffect(() => {
    void fetchSharedDocs()

    // Recent daily reports minimal fetch for overview section
    ;(async () => {
      try {
        setReportsLoading(true)
        const res = await fetch(`/api/admin/sites/${siteId}/daily-reports?status=all&limit=10`, {
          cache: 'no-store',
          credentials: 'include',
        })
        const json = await res.json().catch(() => ({}))
        if (res.ok && json?.success && Array.isArray(json.data)) setRecentReports(json.data)
      } catch {
        void 0
      } finally {
        setReportsLoading(false)
      }
    })()

    // Recent assignments + per-user labor
    ;(async () => {
      try {
        setAssignmentsLoading(true)
        const res = await fetch(`/api/admin/sites/${siteId}/assignments`, {
          cache: 'no-store',
          credentials: 'include',
        })
        const json = await res.json().catch(() => ({}))
        if (res.ok && json?.success && Array.isArray(json.data)) {
          const data = json.data
          setRecentAssignments(data)
          const ids = data.map((a: any) => a.user_id).filter(Boolean)
          if (ids.length > 0) {
            try {
              const rs = await fetch(
                `/api/admin/sites/${siteId}/labor-summary?users=${encodeURIComponent(ids.join(','))}`,
                {
                  cache: 'no-store',
                  credentials: 'include',
                }
              )
              const jj = await rs.json().catch(() => ({}))
              if (rs.ok && jj?.success && jj.data) setLaborByUser(jj.data)
            } catch {
              void 0
            }
            // Global labor (across all sites)
            try {
              const gr = await fetch(
                `/api/admin/users/labor-summary?users=${encodeURIComponent(ids.join(','))}`,
                { cache: 'no-store', credentials: 'include' }
              )
              const gj = await gr.json().catch(() => ({}))
              if (gr.ok && gj?.success && gj.data) setGlobalLaborByUser(gj.data)
            } catch {
              void 0
            }
          }
        }
        // If request fails or returns unexpected shape, keep SSR-provided assignments
      } catch {
        // Swallow errors and preserve initial SSR data
      } finally {
        setAssignmentsLoading(false)
      }
    })()

    // Recent material requests
    ;(async () => {
      try {
        setRequestsLoading(true)
        const res = await fetch(
          `/api/admin/sites/${siteId}/materials/requests?limit=10&order=desc&sort=date`,
          { cache: 'no-store', credentials: 'include' }
        )
        const json = await res.json().catch(() => ({}))
        if (res.ok && json?.success && Array.isArray(json.data))
          setRecentRequests(normalizeRequests(json.data, fallbackSiteName))
      } catch {
        void 0
      } finally {
        setRequestsLoading(false)
      }
    })()
  }, [siteId, fetchSharedDocs, fallbackSiteName])

  // Reports tab: server-backed search/sort/pagination
  useEffect(() => {
    if (tab !== 'reports') return
    let active = true
    ;(async () => {
      try {
        setReportsLoading(true)
        const params = new URLSearchParams()
        if (reportsQuery.trim()) params.set('q', reportsQuery.trim())
        let sort: 'date' | 'status' | 'workers' = 'date'
        let order: 'asc' | 'desc' = 'desc'
        switch (reportsSort) {
          case 'date_asc':
            sort = 'date'
            order = 'asc'
            break
          case 'status':
            sort = 'status'
            order = 'asc'
            break
          case 'workers_desc':
            sort = 'workers'
            order = 'desc'
            break
          case 'workers_asc':
            sort = 'workers'
            order = 'asc'
            break
          case 'date_desc':
          default:
            sort = 'date'
            order = 'desc'
        }
        params.set('sort', sort)
        params.set('order', order)
        params.set('limit', String(reportsPageSize + 1))
        params.set('offset', String(reportsPage * reportsPageSize))
        params.set('status', 'all')
        const res = await fetch(`/api/admin/sites/${siteId}/daily-reports?${params.toString()}`, {
          cache: 'no-store',
          credentials: 'include',
        })
        const json = await res.json().catch(() => ({}))
        if (!active) return
        if (res.ok && json?.success && Array.isArray(json.data)) {
          const arr = json.data as any[]
          setReportsHasNext(arr.length > reportsPageSize)
          setRecentReports(arr.slice(0, reportsPageSize))
          if (typeof json.total === 'number') setReportsTotal(json.total)
        } else {
          setReportsHasNext(false)
          setRecentReports([])
          setReportsTotal(0)
        }
      } finally {
        if (active) setReportsLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [tab, reportsQuery, reportsSort, reportsPage, reportsPageSize, siteId])

  // Fetch available workers count to show capacity hint in Assignments actions
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/sites/${siteId}/workers/available`, {
          cache: 'no-store',
          credentials: 'include',
        })
        const j = await res.json().catch(() => ({}))
        if (!active) return
        if (res.ok && (typeof j?.total === 'number' || Array.isArray(j?.data))) {
          setAvailableCount(
            typeof j.total === 'number' ? j.total : Array.isArray(j.data) ? j.data.length : 0
          )
        } else {
          setAvailableCount(null)
        }
      } catch {
        if (active) setAvailableCount(null)
      }
    })()
    return () => {
      active = false
    }
  }, [siteId])

  return (
    <div>
      <Tabs value={tab} onValueChange={onTabChange} className="w-full">
        <TabsList className="sticky top-0 z-10" fill>
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="reports">작업일지</TabsTrigger>
          <TabsTrigger value="invoices">기성청구</TabsTrigger>
          <TabsTrigger value="shared">공유자료</TabsTrigger>
          <TabsTrigger value="photos">사진</TabsTrigger>
          <TabsTrigger value="assignments">배정</TabsTrigger>
          <TabsTrigger value="materials">자재</TabsTrigger>
          <TabsTrigger value="edit">정보 수정</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground">
            <div>
              <div className="text-xs">상태</div>
              <div className="text-foreground font-medium">
                {site?.status ? SITE_STATUS_LABELS[String(site.status)] || '미정' : '-'}
              </div>
            </div>
            <div>
              <div className="text-xs">기간</div>
              <div>
                {site?.start_date ? new Date(site.start_date).toLocaleDateString('ko-KR') : '-'} ~{' '}
                {site?.end_date ? new Date(site.end_date).toLocaleDateString('ko-KR') : '-'}
              </div>
            </div>
            <div>
              <div className="text-xs">현장관리자</div>
              <div>{site?.manager_name || '-'}</div>
            </div>
            <div>
              <div className="text-xs">안전관리자</div>
              <div>{site?.safety_manager_name || '-'}</div>
            </div>
            <div>
              <div className="text-xs">안전관리자 이메일</div>
              <div>{(site as any)?.safety_manager_email || '-'}</div>
            </div>
            <div>
              <div className="text-xs">숙소 전화번호</div>
              <div>{(site as any)?.accommodation_phone || '-'}</div>
            </div>
            <div>
              <div className="text-xs">작업일지 수</div>
              <div className="text-foreground font-medium">
                {statsLoading ? '…' : (stats?.reports ?? 0)}
              </div>
            </div>
            <div>
              <div className="text-xs">총공수</div>
              <div className="text-foreground font-medium">
                {statsLoading ? '…' : `${formatLabor(stats?.labor ?? 0)} 공수`}
              </div>
            </div>
          </div>

          <section className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">소속(시공사) 정보</h3>
                <p className="text-xs text-muted-foreground">
                  현장에 연동된 시공업체의 기본 정보를 확인하세요.
                </p>
              </div>
              {organization?.id ? (
                <Button asChild variant="outline" size="sm">
                  <a href={`/dashboard/admin/organizations/${organization.id}`}>
                    소속(시공)사 상세
                  </a>
                </Button>
              ) : null}
            </div>
            {organization ? (
              <dl className="mt-4 grid gap-4 text-sm text-muted-foreground md:grid-cols-2">
                <div>
                  <dt className="text-xs">소속명</dt>
                  <dd className="text-foreground font-medium">{organization?.name || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs">구분</dt>
                  <dd className="text-foreground">
                    {organization?.type
                      ? ORGANIZATION_TYPE_LABELS[String(organization.type)] || organization.type
                      : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs">대표 연락처</dt>
                  <dd className="text-foreground">
                    {organization?.contact_phone || organization?.phone || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs">대표 이메일</dt>
                  <dd className="text-foreground">
                    {organization?.contact_email || organization?.email || '-'}
                  </dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-xs">주소</dt>
                  <dd className="text-foreground">{organization?.address || '-'}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">연결된 시공사 정보가 없습니다.</p>
            )}
          </section>

          {invoiceStageSummary ? (
            <section className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground">기성 문서 진행도</h3>
                  <p className="text-xs text-muted-foreground">
                    단계별 필수 문서 등록 현황을 확인하세요.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {invoiceStageSummary.totalRequired > 0 ? (
                    <Badge variant="outline" className="text-xs">
                      완료 {invoiceStageSummary.totalFulfilled}/{invoiceStageSummary.totalRequired}
                    </Badge>
                  ) : null}
                  <Button size="sm" variant="outline" onClick={() => setTab('invoices')}>
                    관리 페이지로 이동
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {invoiceStageSummary.items.map(item => (
                  <div key={item.key} className="rounded-md border bg-white px-3 py-3 shadow-sm">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{INVOICE_STAGE_LABELS[item.key]}</span>
                      {item.required > 0 ? (
                        <span>
                          {Math.min(item.fulfilled, item.required)}/{item.required}
                        </span>
                      ) : (
                        <span>필수 없음</span>
                      )}
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                      {item.required > 0 ? (
                        <div
                          className="h-2 rounded-full bg-blue-500 transition-all"
                          style={{ width: `${Math.round(item.ratio * 100)}%` }}
                        />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* 최근 작업일지 (moved before documents) */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-muted-foreground">최근 작업일지</h3>
              <Button asChild variant="ghost" size="sm">
                <a href={`/dashboard/admin/daily-reports?site_id=${siteId}`}>더 보기</a>
              </Button>
            </div>
            <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
              {reportsLoading && recentReports.length === 0 ? (
                <TableSkeleton rows={5} />
              ) : (
                <DataTable<any>
                  data={recentReports}
                  rowKey={(r: any) => r.id || `${r.work_date}-${r.member_name || ''}`}
                  stickyHeader
                  emptyMessage="표시할 작업일지가 없습니다."
                  columns={
                    [
                      {
                        key: 'work_date',
                        header: '작업일자',
                        sortable: true,
                        accessor: (r: any) => (r?.work_date ? new Date(r.work_date).getTime() : 0),
                        render: (r: any) => (
                          <a
                            href={`/dashboard/admin/daily-reports/${r.id}`}
                            className="underline text-blue-600 font-medium text-foreground"
                            title="작업일지 상세 보기"
                          >
                            {r?.work_date ? new Date(r.work_date).toLocaleDateString('ko-KR') : '-'}
                          </a>
                        ),
                        width: 110,
                        headerClassName: 'whitespace-nowrap',
                      },
                      {
                        key: 'site_name',
                        header: '현장',
                        sortable: true,
                        accessor: (_r: any) => site?.name || '',
                        render: (r: any) => (
                          <div className="font-medium text-foreground">
                            <a
                              href={`/dashboard/admin/sites/${r?.site_id || siteId}`}
                              className="underline-offset-2 hover:underline"
                              title="현장 상세 보기"
                            >
                              {site?.name || '-'}
                            </a>
                            <div className="text-xs text-muted-foreground">
                              {site?.address || '-'}
                            </div>
                          </div>
                        ),
                        width: 220,
                        headerClassName: 'whitespace-nowrap',
                      },
                      {
                        key: 'component_name',
                        header: '부재명',
                        sortable: true,
                        accessor: (r: any) => r?.component_name || r?.member_name || '',
                        render: (r: any) => r?.component_name || r?.member_name || '-',
                        width: 180,
                        headerClassName: 'whitespace-nowrap',
                      },
                      {
                        key: 'work_process',
                        header: '작업공정',
                        sortable: true,
                        accessor: (r: any) => r?.work_process || r?.process_type || '',
                        render: (r: any) => r?.work_process || r?.process_type || '-',
                        width: 160,
                        headerClassName: 'whitespace-nowrap',
                      },
                      {
                        key: 'work_section',
                        header: '작업구간',
                        sortable: true,
                        accessor: (r: any) => r?.work_section || '',
                        render: (r: any) => r?.work_section || '-',
                        width: 160,
                        headerClassName: 'whitespace-nowrap',
                      },
                      {
                        key: 'author',
                        header: '작성자',
                        sortable: false,
                        accessor: (r: any) => r?.created_by_profile?.full_name || '',
                        render: (r: any) => r?.created_by_profile?.full_name || '-',
                        width: 140,
                        headerClassName: 'whitespace-nowrap',
                      },
                      {
                        key: 'status',
                        header: '상태',
                        sortable: true,
                        accessor: (r: any) => r?.status || '',
                        render: (r: any) => (
                          <Badge variant={r?.status === 'submitted' ? 'default' : 'outline'}>
                            {r?.status === 'submitted'
                              ? '제출됨'
                              : r?.status === 'draft'
                                ? '임시'
                                : r?.status || '미정'}
                          </Badge>
                        ),
                        width: 90,
                        headerClassName: 'whitespace-nowrap',
                      },
                      {
                        key: 'workers',
                        header: '인원',
                        sortable: false,
                        accessor: (r: any) => r?.worker_details_count ?? r?.total_workers ?? 0,
                        render: (r: any) =>
                          String(r?.worker_details_count ?? r?.total_workers ?? 0),
                        width: 70,
                        headerClassName: 'whitespace-nowrap',
                      },
                      {
                        key: 'docs',
                        header: '문서',
                        sortable: false,
                        accessor: (r: any) => r?.daily_documents_count ?? 0,
                        render: (r: any) => String(r?.daily_documents_count ?? 0),
                        width: 70,
                        headerClassName: 'whitespace-nowrap',
                      },
                      {
                        key: 'total_manhours',
                        header: '총공수',
                        sortable: true,
                        accessor: (r: any) => r?.total_manhours ?? 0,
                        render: (r: any) => formatLabor(Number(r?.total_manhours ?? 0)),
                        width: 90,
                        headerClassName: 'whitespace-nowrap',
                      },
                      {
                        key: 'actions',
                        header: '작업',
                        sortable: false,
                        align: 'left',
                        width: 210,
                        className: 'whitespace-nowrap',
                        render: (r: any) => (
                          <div className="flex justify-start gap-1">
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="px-2 py-1 text-xs"
                            >
                              <a href={`/dashboard/admin/daily-reports/${r.id}`}>상세</a>
                            </Button>
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="px-2 py-1 text-xs"
                            >
                              <a href={`/dashboard/admin/daily-reports/${r.id}/edit`}>수정</a>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="px-2 py-1 text-xs"
                              onClick={async () => {
                                const ok = await confirm({
                                  title: '작업일지 삭제',
                                  description:
                                    '이 작업일지를 삭제하시겠습니까? 되돌릴 수 없습니다.',
                                  confirmText: '삭제',
                                  cancelText: '취소',
                                  variant: 'destructive',
                                })
                                if (!ok) return
                                try {
                                  const res = await fetch(`/api/admin/daily-reports/${r.id}`, {
                                    method: 'DELETE',
                                  })
                                  if (!res.ok) throw new Error('삭제 실패')
                                  if (typeof window !== 'undefined') window.location.reload()
                                } catch (e) {
                                  alert((e as Error)?.message || '삭제 중 오류가 발생했습니다.')
                                }
                              }}
                            >
                              삭제
                            </Button>
                          </div>
                        ),
                      },
                    ] as Column<any>[]
                  }
                />
              )}
            </div>
          </section>

          {/* (moved above) 최근 작업일지 */}

          {/* 배정 작업자 */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-muted-foreground">배정 작업자</h3>
              <div className="flex items-center gap-2">
                {typeof availableCount === 'number' && (
                  <span className="text-xs text-muted-foreground">
                    가용 인원: <span className="font-medium text-foreground">{availableCount}</span>
                  </span>
                )}
                <Button asChild variant="secondary" size="sm">
                  <a href={`/dashboard/admin/sites/${siteId}/assign`}>사용자 배정</a>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <a href={`/dashboard/admin/assignment?site_id=${siteId}`}>더 보기</a>
                </Button>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
              {/* Quick filter/sort (overview section) */}
              <div className="flex items-center gap-2 mb-3">
                <input
                  value={assignmentQuery}
                  onChange={e => setAssignmentQuery(e.target.value)}
                  placeholder="이름/소속/역할 검색"
                  className="w-48 rounded border px-3 py-1.5 text-sm"
                />
                <select
                  value={assignmentRole}
                  onChange={e => setAssignmentRole(e.target.value as any)}
                  className="rounded border px-2 py-1.5 text-sm"
                  aria-label="역할 필터"
                >
                  <option value="all">전체 역할</option>
                  <option value="worker">작업자</option>
                  <option value="site_manager">현장관리자</option>
                  <option value="supervisor">감리/감독</option>
                </select>
                <select
                  value={assignmentSort}
                  onChange={e => setAssignmentSort(e.target.value as any)}
                  className="rounded border px-2 py-1.5 text-sm"
                  aria-label="정렬"
                >
                  <option value="date_desc">배정일 최신순</option>
                  <option value="date_asc">배정일 오래된순</option>
                  <option value="name_asc">이름 오름차순</option>
                  <option value="name_desc">이름 내림차순</option>
                  <option value="role">역할</option>
                  <option value="company">소속</option>
                  <option value="labor_desc">공수 많은순</option>
                  <option value="labor_asc">공수 적은순</option>
                </select>
              </div>
              {assignmentsLoading && recentAssignments.length === 0 ? (
                <TableSkeleton rows={5} />
              ) : (
                <>
                  <DataTable<any>
                    data={filteredAndSortedAssignments(
                      recentAssignments,
                      laborByUser,
                      assignmentQuery,
                      assignmentSort,
                      assignmentRole
                    )}
                    rowKey={(a: any, idx?: number) => a.id || a.user_id || idx || 'assign'}
                    stickyHeader
                    emptyMessage="배정된 사용자가 없습니다."
                    columns={
                      [
                        {
                          key: 'name',
                          header: '이름',
                          sortable: true,
                          accessor: (a: any) => a?.profile?.full_name || a?.user_id || '',
                          render: (a: any) => (
                            <a
                              href={`/dashboard/admin/users/${a.user_id}`}
                              className="underline text-blue-600 font-medium text-foreground"
                              title="사용자 상세 보기"
                            >
                              {a?.profile?.full_name || a?.user_id}
                            </a>
                          ),
                          width: '16%',
                        },
                        {
                          key: 'company',
                          header: '소속',
                          sortable: true,
                          accessor: (a: any) => a?.profile?.organization?.name || '',
                          render: (a: any) => a?.profile?.organization?.name || '-',
                          width: '12%',
                        },
                        {
                          key: 'email',
                          header: '이메일',
                          sortable: true,
                          accessor: (a: any) => a?.profile?.email || '',
                          render: (a: any) => (
                            <span
                              className="truncate inline-block max-w-[240px]"
                              title={a?.profile?.email || ''}
                            >
                              {a?.profile?.email || '-'}
                            </span>
                          ),
                          width: '16%',
                        },
                        {
                          key: 'phone',
                          header: '전화',
                          sortable: true,
                          accessor: (a: any) => a?.profile?.phone || '',
                          render: (a: any) => a?.profile?.phone || '-',
                          align: 'center',
                          width: '12%',
                        },
                        {
                          key: 'role',
                          header: '역할',
                          sortable: true,
                          accessor: (a: any) => a?.role || '',
                          render: (a: any) => ROLE_KO[String(a?.role || '')] || a?.role || '-',
                          align: 'center',
                          width: '9%',
                        },
                        {
                          key: 'site_labor',
                          header: '현장 공수',
                          sortable: true,
                          accessor: (a: any) => Number(laborByUser[a?.user_id] ?? 0),
                          render: (a: any) =>
                            `${Math.max(0, laborByUser[a.user_id] ?? 0).toFixed(1)} 공수`,
                          align: 'right',
                          width: '8%',
                        },
                        {
                          key: 'global_labor',
                          header: '전체 공수',
                          sortable: true,
                          accessor: (a: any) => Number(globalLaborByUser[a?.user_id] ?? 0),
                          render: (a: any) =>
                            `${Math.max(0, globalLaborByUser[a.user_id] ?? 0).toFixed(1)} 공수`,
                          align: 'right',
                          width: '8%',
                        },
                        {
                          key: 'assigned_at',
                          header: '배정일',
                          sortable: true,
                          accessor: (a: any) => a?.assigned_date || '',
                          render: (a: any) =>
                            a?.assigned_date
                              ? new Date(a.assigned_date).toLocaleDateString('ko-KR')
                              : '-',
                          align: 'center',
                          width: '9%',
                        },
                        {
                          key: 'actions',
                          header: '작업',
                          sortable: false,
                          render: (a: any) => (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const res = await fetch(
                                    `/api/admin/sites/${siteId}/workers/unassign`,
                                    {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ worker_id: a.user_id }),
                                    }
                                  )
                                  const j = await res.json().catch(() => ({}))
                                  if (!res.ok || j?.error) throw new Error(j?.error || '제외 실패')
                                  if (typeof window !== 'undefined') window.location.reload()
                                } catch {
                                  alert('제외 중 오류가 발생했습니다.')
                                }
                              }}
                            >
                              제외
                            </Button>
                          ),
                          align: 'center',
                          width: '8%',
                          headerClassName: 'whitespace-nowrap',
                        },
                      ] as Column<any>[]
                    }
                  />
                  {(() => {
                    const rows = filteredAndSortedAssignments(
                      recentAssignments,
                      laborByUser,
                      assignmentQuery,
                      assignmentSort,
                      assignmentRole
                    )
                    if (rows.length === 0) return null
                    const totalSite = rows.reduce(
                      (s, a: any) => s + Math.max(0, Number(laborByUser[a.user_id] ?? 0)),
                      0
                    )
                    const totalGlobal = rows.reduce(
                      (s, a: any) => s + Math.max(0, Number(globalLaborByUser[a.user_id] ?? 0)),
                      0
                    )
                    return (
                      <div className="mt-2 text-xs text-muted-foreground text-right">
                        합계: 현장 공수 {totalSite.toFixed(1)} / 전체 공수 {totalGlobal.toFixed(1)}
                      </div>
                    )
                  })()}
                </>
              )}
            </div>
          </section>
          {/* AssignUsersDialog removed in favor of dedicated page */}

          {/* 최근 자재 요청 */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-muted-foreground">최근 자재 요청</h3>
              <Button asChild variant="ghost" size="sm">
                <a href={`/dashboard/admin/materials?tab=requests&site_id=${siteId}`}>더 보기</a>
              </Button>
            </div>
            <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
              {requestsLoading && recentRequests.length === 0 ? (
                <TableSkeleton rows={5} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>현장명</TableHead>
                      <TableHead>자재명</TableHead>
                      <TableHead className="text-right">요청수량</TableHead>
                      <TableHead>요청자</TableHead>
                      <TableHead>요청일</TableHead>
                      <TableHead>긴급도</TableHead>
                      <TableHead>비고</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-10">
                          <EmptyState description="표시할 요청이 없습니다." />
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentRequests.map((rq: any) => {
                        const requesterName = rq?.requester?.full_name || rq?.requested_by || '-'
                        const requesterLink = rq?.requested_by
                          ? `/dashboard/admin/users/${rq.requested_by}`
                          : null
                        const items = Array.isArray(rq.items)
                          ? rq.items
                          : Array.isArray(rq.material_request_items)
                            ? rq.material_request_items
                            : []
                        const siteLabel =
                          rq?.sites?.name || (site?.name as string | undefined) || '-'
                        const materialSummary = summarizeMaterial(items)
                        const quantitySummary = summarizeQuantity(items)
                        const priorityValue = isMaterialPriorityValue(rq?.priority)
                          ? (rq.priority as MaterialPriorityValue)
                          : null
                        const notes = cleanPriorityNote(rq?.notes)

                        return (
                          <TableRow key={rq.id || rq.request_number}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium text-foreground">{siteLabel}</span>
                                <span className="text-xs text-muted-foreground">
                                  {rq?.request_number || rq?.id || ''}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                              {materialSummary}
                            </TableCell>
                            <TableCell className="text-right">{quantitySummary}</TableCell>
                            <TableCell>
                              {requesterLink ? (
                                <a
                                  href={requesterLink}
                                  className="underline-offset-2 hover:underline"
                                  title="사용자 상세 보기"
                                >
                                  {requesterName}
                                </a>
                              ) : (
                                <span>{requesterName}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {rq?.request_date
                                ? new Date(rq.request_date).toLocaleDateString('ko-KR')
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {priorityValue ? (
                                <Badge variant={MATERIAL_PRIORITY_BADGE_VARIANTS[priorityValue]}>
                                  {MATERIAL_PRIORITY_LABELS[priorityValue]}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="max-w-[180px] truncate">{notes || '-'}</TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </section>
        </TabsContent>

        {/* Reports Tab moved above (inside Tabs) */}

        {/* Reports Tab (moved inside Tabs) */}
        <TabsContent value="reports" className="mt-4">
          <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
            <DataTable<any>
              data={recentReports}
              rowKey={(r: any) => r.id || `${r.work_date}-${r.member_name || ''}`}
              stickyHeader
              emptyMessage="표시할 작업일지가 없습니다."
              columns={
                [
                  {
                    key: 'work_date',
                    header: '작업일자',
                    sortable: true,
                    accessor: (r: any) => (r?.work_date ? new Date(r.work_date).getTime() : 0),
                    render: (r: any) => (
                      <a
                        href={`/dashboard/admin/daily-reports/${r.id}`}
                        className="underline text-blue-600 font-medium text-foreground"
                        title="작업일지 상세 보기"
                      >
                        {r?.work_date ? new Date(r.work_date).toLocaleDateString('ko-KR') : '-'}
                      </a>
                    ),
                    width: 110,
                    headerClassName: 'whitespace-nowrap',
                  },
                  {
                    key: 'site_name',
                    header: '현장',
                    sortable: true,
                    accessor: (_r: any) => site?.name || '',
                    render: (r: any) => (
                      <div className="font-medium text-foreground">
                        <a
                          href={`/dashboard/admin/sites/${r?.site_id || siteId}`}
                          className="underline-offset-2 hover:underline"
                          title="현장 상세 보기"
                        >
                          {site?.name || '-'}
                        </a>
                        <div className="text-xs text-muted-foreground">{site?.address || '-'}</div>
                      </div>
                    ),
                    width: 220,
                    headerClassName: 'whitespace-nowrap',
                  },
                  {
                    key: 'component_name',
                    header: '부재명',
                    sortable: true,
                    accessor: (r: any) => r?.component_name || r?.member_name || '',
                    render: (r: any) => r?.component_name || r?.member_name || '-',
                    width: 180,
                    headerClassName: 'whitespace-nowrap',
                  },
                  {
                    key: 'work_process',
                    header: '작업공정',
                    sortable: true,
                    accessor: (r: any) => r?.work_process || r?.process_type || '',
                    render: (r: any) => r?.work_process || r?.process_type || '-',
                    width: 160,
                    headerClassName: 'whitespace-nowrap',
                  },
                  {
                    key: 'work_section',
                    header: '작업구간',
                    sortable: true,
                    accessor: (r: any) => r?.work_section || '',
                    render: (r: any) => r?.work_section || '-',
                    width: 160,
                    headerClassName: 'whitespace-nowrap',
                  },
                  {
                    key: 'author',
                    header: '작성자',
                    sortable: false,
                    accessor: (r: any) => r?.created_by_profile?.full_name || r?.created_by || '',
                    render: (r: any) =>
                      r?.created_by ? (
                        <a
                          href={`/dashboard/admin/users/${r.created_by}`}
                          className="underline-offset-2 hover:underline"
                          title="사용자 상세 보기"
                        >
                          {r?.created_by_profile?.full_name || r.created_by}
                        </a>
                      ) : (
                        <span>{r?.created_by_profile?.full_name || '-'}</span>
                      ),
                    width: 140,
                    headerClassName: 'whitespace-nowrap',
                  },
                  {
                    key: 'status',
                    header: '상태',
                    sortable: true,
                    accessor: (r: any) => r?.status || '',
                    render: (r: any) => (
                      <Badge variant={r?.status === 'submitted' ? 'default' : 'outline'}>
                        {r?.status === 'submitted'
                          ? '제출됨'
                          : r?.status === 'draft'
                            ? '임시'
                            : r?.status || '미정'}
                      </Badge>
                    ),
                    width: 90,
                    headerClassName: 'whitespace-nowrap',
                  },
                  {
                    key: 'workers',
                    header: '인원',
                    sortable: false,
                    accessor: (r: any) =>
                      r?.worker_count ?? r?.worker_details_count ?? r?.total_workers ?? 0,
                    render: (r: any) =>
                      String(r?.worker_count ?? r?.worker_details_count ?? r?.total_workers ?? 0),
                    width: 70,
                    headerClassName: 'whitespace-nowrap',
                  },
                  {
                    key: 'docs',
                    header: '문서',
                    sortable: false,
                    accessor: (r: any) => r?.document_count ?? r?.daily_documents_count ?? 0,
                    render: (r: any) => String(r?.document_count ?? r?.daily_documents_count ?? 0),
                    width: 70,
                    headerClassName: 'whitespace-nowrap',
                  },
                  {
                    key: 'total_manhours',
                    header: '총공수',
                    sortable: true,
                    accessor: (r: any) => r?.total_manhours ?? 0,
                    render: (r: any) => formatLabor(Number(r?.total_manhours ?? 0)),
                    width: 90,
                    headerClassName: 'whitespace-nowrap',
                  },
                  {
                    key: 'actions',
                    header: '작업',
                    sortable: false,
                    align: 'left',
                    width: 210,
                    className: 'whitespace-nowrap',
                    render: (r: any) => (
                      <div className="flex justify-start gap-1">
                        <Button asChild variant="outline" size="sm" className="px-2 py-1 text-xs">
                          <a href={`/dashboard/admin/daily-reports/${r.id}`}>상세</a>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="px-2 py-1 text-xs">
                          <a href={`/dashboard/admin/daily-reports/${r.id}/edit`}>수정</a>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-2 py-1 text-xs"
                          onClick={async () => {
                            const ok = await confirm({
                              title: '작업일지 삭제',
                              description: '이 작업일지를 삭제하시겠습니까? 되돌릴 수 없습니다.',
                              confirmText: '삭제',
                              cancelText: '취소',
                              variant: 'destructive',
                            })
                            if (!ok) return
                            try {
                              const res = await fetch(`/api/admin/daily-reports/${r.id}`, {
                                method: 'DELETE',
                              })
                              if (!res.ok) throw new Error('삭제 실패')
                              if (typeof window !== 'undefined') window.location.reload()
                            } catch (e) {
                              alert((e as Error)?.message || '삭제 중 오류가 발생했습니다.')
                            }
                          }}
                        >
                          삭제
                        </Button>
                      </div>
                    ),
                  },
                ] as Column<any>[]
              }
            />
          </div>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="mt-4 space-y-4">
          <InvoiceDocumentsManager
            siteId={siteId}
            siteName={site?.name}
            organizationId={site?.organization_id}
            onProgressUpdate={setInvoiceProgress}
          />
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="mt-4">
          <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <input
                  value={assignmentQuery}
                  onChange={e => setAssignmentQuery(e.target.value)}
                  placeholder="이름/이메일/소속/역할 검색"
                  className="w-64 rounded border px-3 py-2 text-sm"
                />
                <select
                  value={assignmentRole}
                  onChange={e => setAssignmentRole(e.target.value as any)}
                  className="rounded border px-2 py-2 text-sm"
                  aria-label="역할 필터"
                >
                  <option value="all">전체 역할</option>
                  <option value="worker">작업자</option>
                  <option value="site_manager">현장관리자</option>
                  <option value="supervisor">감리/감독</option>
                </select>
                <select
                  value={assignmentSort}
                  onChange={e => setAssignmentSort(e.target.value as any)}
                  className="rounded border px-2 py-2 text-sm"
                  aria-label="정렬"
                >
                  <option value="date_desc">배정일 최신순</option>
                  <option value="date_asc">배정일 오래된순</option>
                  <option value="name_asc">이름 오름차순</option>
                  <option value="name_desc">이름 내림차순</option>
                  <option value="role">역할</option>
                  <option value="company">소속</option>
                  <option value="labor_desc">공수 많은순</option>
                  <option value="labor_asc">공수 적은순</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                {typeof availableCount === 'number' && (
                  <span className="text-xs text-muted-foreground">
                    가용 인원: <span className="font-medium text-foreground">{availableCount}</span>
                  </span>
                )}
                <Button asChild variant="outline" size="sm">
                  <a
                    href={(() => {
                      const p = new URLSearchParams()
                      if (assignmentQuery.trim()) p.set('q', assignmentQuery.trim())
                      if (assignmentRole !== 'all') p.set('role', assignmentRole)
                      let sort: 'name' | 'role' | 'company' | 'date' = 'date'
                      let order: 'asc' | 'desc' = 'desc'
                      switch (assignmentSort) {
                        case 'name_asc':
                          sort = 'name'
                          order = 'asc'
                          break
                        case 'name_desc':
                          sort = 'name'
                          order = 'desc'
                          break
                        case 'role':
                          sort = 'role'
                          order = 'asc'
                          break
                        case 'company':
                          sort = 'company'
                          order = 'asc'
                          break
                        case 'date_asc':
                          sort = 'date'
                          order = 'asc'
                          break
                        default:
                          sort = 'date'
                          order = 'desc'
                      }
                      p.set('sort', sort)
                      p.set('order', order)
                      return `/api/admin/sites/${siteId}/assignments/export?${p.toString()}`
                    })()}
                  >
                    엑셀 다운로드
                  </a>
                </Button>
                <Button asChild variant="secondary" size="sm">
                  <a href={`/dashboard/admin/sites/${siteId}/assign`}>사용자 배정</a>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-muted-foreground">
                {typeof assignTotal === 'number' && <span>총 {assignTotal}건</span>}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">페이지 크기</label>
                <select
                  value={assignPageSize}
                  onChange={e => {
                    setAssignPage(0)
                    setAssignPageSize(Number(e.target.value))
                  }}
                  className="rounded border px-2 py-1 text-xs"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
            {assignmentsLoading && recentAssignments.length === 0 ? (
              <TableSkeleton rows={6} />
            ) : (
              <>
                <DataTable<any>
                  data={filteredAndSortedAssignments(
                    recentAssignments,
                    laborByUser,
                    assignmentQuery,
                    assignmentSort,
                    assignmentRole
                  )}
                  rowKey={(a: any, idx?: number) => a.id || a.user_id || idx || 'assign'}
                  stickyHeader
                  emptyMessage="배정된 사용자가 없습니다."
                  columns={
                    [
                      {
                        key: 'name',
                        header: '이름',
                        sortable: true,
                        accessor: (a: any) => a?.profile?.full_name || a?.user_id || '',
                        render: (a: any) => (
                          <a
                            href={`/dashboard/admin/users/${a.user_id}`}
                            className="underline text-blue-600 font-medium text-foreground"
                            title="사용자 상세 보기"
                          >
                            {a?.profile?.full_name || a?.user_id}
                          </a>
                        ),
                        width: '16%',
                      },
                      {
                        key: 'company',
                        header: '소속',
                        sortable: true,
                        accessor: (a: any) => a?.profile?.organization?.name || '',
                        render: (a: any) => a?.profile?.organization?.name || '-',
                        width: '12%',
                      },
                      {
                        key: 'email',
                        header: '이메일',
                        sortable: true,
                        accessor: (a: any) => a?.profile?.email || '',
                        render: (a: any) => (
                          <span
                            className="truncate inline-block max-w-[240px]"
                            title={a?.profile?.email || ''}
                          >
                            {a?.profile?.email || '-'}
                          </span>
                        ),
                        width: '16%',
                      },
                      {
                        key: 'phone',
                        header: '전화',
                        sortable: true,
                        accessor: (a: any) => a?.profile?.phone || '',
                        render: (a: any) => a?.profile?.phone || '-',
                        align: 'center',
                        width: '12%',
                      },
                      {
                        key: 'role',
                        header: '역할',
                        sortable: true,
                        accessor: (a: any) => a?.role || '',
                        render: (a: any) => ROLE_KO[String(a?.role || '')] || a?.role || '-',
                        align: 'center',
                        width: '9%',
                      },
                      {
                        key: 'site_labor',
                        header: '현장 공수',
                        sortable: true,
                        accessor: (a: any) => Number(laborByUser[a?.user_id] ?? 0),
                        render: (a: any) =>
                          `${Math.max(0, laborByUser[a.user_id] ?? 0).toFixed(1)} 공수`,
                        align: 'right',
                        width: '8%',
                      },
                      {
                        key: 'global_labor',
                        header: '전체 공수',
                        sortable: true,
                        accessor: (a: any) => Number(globalLaborByUser[a?.user_id] ?? 0),
                        render: (a: any) =>
                          `${Math.max(0, globalLaborByUser[a.user_id] ?? 0).toFixed(1)} 공수`,
                        align: 'right',
                        width: '8%',
                      },
                      {
                        key: 'assigned_at',
                        header: '배정일',
                        sortable: true,
                        accessor: (a: any) => a?.assigned_date || '',
                        render: (a: any) =>
                          a?.assigned_date
                            ? new Date(a.assigned_date).toLocaleDateString('ko-KR')
                            : '-',
                        align: 'center',
                        width: '9%',
                      },
                      {
                        key: 'actions',
                        header: '작업',
                        sortable: false,
                        render: (a: any) => (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const res = await fetch(
                                  `/api/admin/sites/${siteId}/workers/unassign`,
                                  {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ worker_id: a.user_id }),
                                  }
                                )
                                const j = await res.json().catch(() => ({}))
                                if (!res.ok || j?.error) throw new Error(j?.error || '제외 실패')
                                if (typeof window !== 'undefined') window.location.reload()
                              } catch {
                                alert('제외 중 오류가 발생했습니다.')
                              }
                            }}
                          >
                            제외
                          </Button>
                        ),
                        align: 'center',
                        width: '8%',
                        headerClassName: 'whitespace-nowrap',
                      },
                    ] as Column<any>[]
                  }
                />
                {(() => {
                  const rows = filteredAndSortedAssignments(
                    recentAssignments,
                    laborByUser,
                    assignmentQuery,
                    assignmentSort,
                    assignmentRole
                  )
                  if (rows.length === 0) return null
                  const totalSite = rows.reduce(
                    (s, a: any) => s + Math.max(0, Number(laborByUser[a.user_id] ?? 0)),
                    0
                  )
                  const totalGlobal = rows.reduce(
                    (s, a: any) => s + Math.max(0, Number(globalLaborByUser[a.user_id] ?? 0)),
                    0
                  )
                  return (
                    <div className="mt-2 text-xs text-muted-foreground text-right">
                      합계: 현장 공수 {totalSite.toFixed(1)} / 전체 공수 {totalGlobal.toFixed(1)}
                    </div>
                  )
                })()}
              </>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssignPage(0)}
              disabled={assignPage === 0}
            >
              처음
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssignPage(p => Math.max(0, p - 1))}
              disabled={assignPage === 0}
            >
              이전
            </Button>
            <span className="text-xs text-muted-foreground">
              페이지 {assignPage + 1}
              {typeof assignTotal === 'number' && assignPageSize > 0
                ? ` / ${Math.max(1, Math.ceil(assignTotal / assignPageSize))}`
                : ''}
            </span>
            <input
              type="number"
              min={1}
              className="w-16 rounded border px-2 py-1 text-xs"
              placeholder="이동"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const val = Number((e.target as HTMLInputElement).value)
                  if (Number.isFinite(val) && val >= 1) {
                    const pageZero = val - 1
                    if (typeof assignTotal === 'number' && assignPageSize > 0) {
                      const last = Math.max(0, Math.ceil(assignTotal / assignPageSize) - 1)
                      setAssignPage(Math.min(last, pageZero))
                    } else {
                      setAssignPage(pageZero)
                    }
                  }
                }
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssignPage(p => p + 1)}
              disabled={!assignHasNext}
            >
              다음
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (typeof assignTotal === 'number' && assignPageSize > 0) {
                  const last = Math.max(0, Math.ceil(assignTotal / assignPageSize) - 1)
                  setAssignPage(last)
                }
              }}
              disabled={
                !(
                  typeof assignTotal === 'number' &&
                  assignPageSize > 0 &&
                  assignPage + 1 < Math.ceil((assignTotal || 0) / assignPageSize)
                )
              }
            >
              끝
            </Button>
          </div>
          {/* AssignUsersDialog removed in favor of dedicated page */}
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-4">
            <StatsCard label="관리 자재" value={materialsStats.inventory_total} />
            <StatsCard label="재고 부족" value={materialsStats.low_stock} />
            <StatsCard label="재고 소진" value={materialsStats.out_of_stock} />
            <StatsCard label="대기 요청" value={materialsStats.pending_requests} />
          </div>

          <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <input
                  value={materialsQuery}
                  onChange={e => setMaterialsQuery(e.target.value)}
                  placeholder="요청번호/요청자 검색"
                  className="w-64 rounded border px-3 py-2 text-sm"
                />
                <select
                  value={materialsStatus}
                  onChange={e => setMaterialsStatus(e.target.value as any)}
                  className="rounded border px-2 py-2 text-sm"
                >
                  <option value="all">전체 상태</option>
                  <option value="pending">대기</option>
                  <option value="approved">승인</option>
                  <option value="rejected">반려</option>
                  <option value="fulfilled">완료</option>
                  <option value="cancelled">취소</option>
                </select>
                <select
                  value={materialsSort}
                  onChange={e => setMaterialsSort(e.target.value as any)}
                  className="rounded border px-2 py-2 text-sm"
                >
                  <option value="date_desc">요청일 최신순</option>
                  <option value="date_asc">요청일 오래된순</option>
                  <option value="status">상태</option>
                  <option value="number">요청번호</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href={`/dashboard/admin/materials?tab=requests&site_id=${siteId}`}>
                    자재관리로 이동
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a
                    href={(() => {
                      const p = new URLSearchParams()
                      if (materialsQuery.trim()) p.set('q', materialsQuery.trim())
                      if (materialsStatus !== 'all') p.set('status', materialsStatus)
                      let sort: 'date' | 'status' | 'number' = 'date'
                      let order: 'asc' | 'desc' = 'desc'
                      switch (materialsSort) {
                        case 'date_asc':
                          sort = 'date'
                          order = 'asc'
                          break
                        case 'status':
                          sort = 'status'
                          order = 'asc'
                          break
                        case 'number':
                          sort = 'number'
                          order = 'asc'
                          break
                        default:
                          sort = 'date'
                          order = 'desc'
                      }
                      p.set('sort', sort)
                      p.set('order', order)
                      return `/api/admin/sites/${siteId}/materials/requests/export?${p.toString()}`
                    })()}
                  >
                    엑셀 다운로드
                  </a>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-muted-foreground">
                {typeof reqTotal === 'number' && <span>총 {reqTotal}건</span>}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">페이지 크기</label>
                <select
                  value={reqPageSize}
                  onChange={e => {
                    setReqPage(0)
                    setReqPageSize(Number(e.target.value))
                  }}
                  className="rounded border px-2 py-1 text-xs"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
            {requestsLoading && requestTableRows.length === 0 ? (
              <TableSkeleton rows={6} />
            ) : (
              <DataTable<RequestDisplayRow>
                data={requestTableRows}
                rowKey="id"
                stickyHeader
                emptyMessage="요청 내역이 없습니다."
                columns={requestColumns}
              />
            )}
            <div className="flex items-center justify-end gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReqPage(p => Math.max(0, p - 1))}
                disabled={reqPage === 0}
              >
                이전
              </Button>
              <span className="text-xs text-muted-foreground">
                페이지 {reqPage + 1}
                {typeof reqTotal === 'number' && reqPageSize > 0
                  ? ` / ${Math.max(1, Math.ceil(reqTotal / reqPageSize))}`
                  : ''}
              </span>
              <input
                type="number"
                min={1}
                className="w-16 rounded border px-2 py-1 text-xs"
                placeholder="이동"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const val = Number((e.target as HTMLInputElement).value)
                    if (Number.isFinite(val) && val >= 1) {
                      const pageZero = val - 1
                      if (typeof reqTotal === 'number' && reqPageSize > 0) {
                        const last = Math.max(0, Math.ceil(reqTotal / reqPageSize) - 1)
                        setReqPage(Math.min(last, pageZero))
                      } else {
                        setReqPage(pageZero)
                      }
                    }
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReqPage(p => p + 1)}
                disabled={!reqHasNext}
              >
                다음
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (typeof reqTotal === 'number' && reqPageSize > 0) {
                    const last = Math.max(0, Math.ceil(reqTotal / reqPageSize) - 1)
                    setReqPage(last)
                  }
                }}
                disabled={
                  !(
                    typeof reqTotal === 'number' &&
                    reqPageSize > 0 &&
                    reqPage + 1 < Math.ceil((reqTotal || 0) / reqPageSize)
                  )
                }
              >
                끝
              </Button>
            </div>
          </div>

          {/* Inventory snapshot (hidden by default in single-material mode) */}
          {SHOW_INVENTORY_SNAPSHOT && (
            <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-muted-foreground">재고 스냅샷</h3>
                <div className="flex items-center gap-2">
                  <input
                    value={invQuery}
                    onChange={e => setInvQuery(e.target.value)}
                    placeholder="자재명/코드 검색"
                    className="w-56 rounded border px-3 py-2 text-sm"
                  />
                </div>
              </div>
              {invLoading && inventoryTableRows.length === 0 ? (
                <TableSkeleton rows={5} />
              ) : (
                <DataTable<InventoryDisplayRow>
                  data={inventoryTableRows}
                  rowKey="id"
                  stickyHeader
                  emptyMessage="재고 데이터가 없습니다."
                  columns={inventoryColumns}
                />
              )}
            </div>
          )}

          {/* Recent shipments */}
          <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                최근 출고
                {materialsStats.open_shipments > 0 ? (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                    진행중 {materialsStats.open_shipments}건
                  </span>
                ) : null}
              </h3>
              <div className="flex items-center gap-2">
                <input
                  value={shipQuery}
                  onChange={e => setShipQuery(e.target.value)}
                  placeholder="출고번호/상태 검색"
                  className="w-56 rounded border px-3 py-2 text-sm"
                />
                <Button asChild variant="ghost" size="sm">
                  <a href={`/dashboard/admin/materials?tab=shipments&site_id=${siteId}`}>
                    출고 전체 보기
                  </a>
                </Button>
              </div>
            </div>
            {shipLoading && shipmentTableRows.length === 0 ? (
              <TableSkeleton rows={5} />
            ) : (
              <DataTable<ShipmentDisplayRow>
                data={shipmentTableRows}
                rowKey="id"
                stickyHeader
                emptyMessage="최근 출고 내역이 없습니다."
                columns={shipmentColumns}
              />
            )}
          </div>

          {/* Recent transactions */}
          <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-muted-foreground">최근 입출고</h3>
              <div className="flex items-center gap-2">
                <input
                  value={txnQuery}
                  onChange={e => {
                    setTxnPage(0)
                    setTxnQuery(e.target.value)
                  }}
                  placeholder="자재명/코드 검색"
                  className="w-56 rounded border px-3 py-2 text-sm"
                />
                <Button asChild variant="ghost" size="sm">
                  <a href={`/dashboard/admin/materials?tab=inventory&site_id=${siteId}`}>
                    입출고 전체 보기
                  </a>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-muted-foreground">
                {typeof txnTotal === 'number' && <span>총 {txnTotal}건</span>}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">페이지 크기</label>
                <select
                  value={txnPageSize}
                  onChange={e => {
                    setTxnPage(0)
                    setTxnPageSize(Number(e.target.value))
                  }}
                  className="rounded border px-2 py-1 text-xs"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
            {txnLoading && transactionTableRows.length === 0 ? (
              <TableSkeleton rows={5} />
            ) : (
              <DataTable<TransactionDisplayRow>
                data={transactionTableRows}
                rowKey="id"
                stickyHeader
                emptyMessage="최근 입출고 내역이 없습니다."
                columns={transactionColumns}
              />
            )}
            <div className="flex items-center justify-end gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTxnPage(0)}
                disabled={txnPage === 0}
              >
                처음
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTxnPage(p => Math.max(0, p - 1))}
                disabled={txnPage === 0}
              >
                이전
              </Button>
              <span className="text-xs text-muted-foreground">
                페이지 {txnPage + 1}
                {typeof txnTotal === 'number' && txnPageSize > 0
                  ? ` / ${Math.max(1, Math.ceil(txnTotal / txnPageSize))}`
                  : ''}
              </span>
              <input
                type="number"
                min={1}
                className="w-16 rounded border px-2 py-1 text-xs"
                placeholder="이동"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const val = Number((e.target as HTMLInputElement).value)
                    if (Number.isFinite(val) && val >= 1) {
                      const pageZero = val - 1
                      if (typeof txnTotal === 'number' && txnPageSize > 0) {
                        const last = Math.max(0, Math.ceil(txnTotal / txnPageSize) - 1)
                        setTxnPage(Math.min(last, pageZero))
                      } else {
                        setTxnPage(pageZero)
                      }
                    }
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTxnPage(p => p + 1)}
                disabled={!txnHasNext}
              >
                다음
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (typeof txnTotal === 'number' && txnPageSize > 0) {
                    const last = Math.max(0, Math.ceil(txnTotal / txnPageSize) - 1)
                    setTxnPage(last)
                  }
                }}
                disabled={
                  !(
                    typeof txnTotal === 'number' &&
                    txnPageSize > 0 &&
                    txnPage + 1 < Math.ceil((txnTotal || 0) / txnPageSize)
                  )
                }
              >
                끝
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Shared Materials Tab */}
        <TabsContent value="shared" className="mt-4 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground">현장 공유자료</h3>
              <p className="text-xs text-muted-foreground">
                현장 작업자 및 관리자가 열람하는 공도면과 공지·점검 자료입니다.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm">
                <a href={`/dashboard/admin/sites/${siteId}/shared/upload`}>공유자료 업로드</a>
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSharedView('drawings')}
              className={`px-3 py-1 text-xs rounded border ${
                sharedView === 'drawings'
                  ? 'bg-gray-100 border-gray-400'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              도면
            </button>
            <button
              type="button"
              onClick={() => setSharedView('documents')}
              className={`px-3 py-1 text-xs rounded border ${
                sharedView === 'documents'
                  ? 'bg-gray-100 border-gray-400'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              공유문서
            </button>
          </div>
          {sharedView === 'drawings' ? (
            drawingsLoading ? (
              <div className="text-sm text-muted-foreground">도면을 불러오는 중입니다...</div>
            ) : drawings.length === 0 ? (
              <div className="text-sm text-muted-foreground">등록된 도면이 없습니다.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {drawings.map((d: any, idx: number) => (
                  <div
                    key={`${d?.id ?? d?.url ?? d?.title ?? 'drawing'}-${idx}`}
                    className="rounded border p-3"
                  >
                    <div className="font-medium text-foreground truncate">{d.title || '도면'}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {(d.category === 'plan' && '공도면') ||
                        (d.category === 'progress' && '작업도면') ||
                        '기타'}
                      {d.created_at
                        ? ` · ${new Date(d.created_at).toLocaleDateString('ko-KR')}`
                        : ''}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          openFileRecordInNewTab({
                            file_url: d.url,
                            storage_bucket: d.storage_bucket,
                            storage_path: d.storage_path || d.folder_path,
                            file_name: d.title,
                            title: d.title,
                          })
                        }
                        disabled={!d.url && !d.storage_path}
                      >
                        보기
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="rounded-lg border bg-card shadow-sm">
              <div className="flex flex-col gap-3 border-b bg-muted/40 px-4 py-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    공유자료
                    {isSharedDocsRefreshing ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    전체 {sharedTotalDocuments}건 · 최신 {sharedDocs.length}건 표시 · 필터 적용{' '}
                    {filteredSharedCount}건
                  </p>
                  {sharedDocumentCount !== null || sharedPhotoCount !== null ? (
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      {sharedDocumentCount !== null ? (
                        <span>문서 {sharedDocumentCount}건</span>
                      ) : null}
                      {sharedPhotoCount !== null ? <span>이미지 {sharedPhotoCount}건</span> : null}
                    </div>
                  ) : null}
                </div>
                <div className="grid w-full gap-2 grid-cols-1 md:grid-cols-5">
                  <Input
                    value={sharedSearch}
                    onChange={event => setSharedSearch(event.target.value)}
                    placeholder="검색어 (제목·설명·업로더)"
                    aria-label="공유자료 검색어"
                    className="h-9 w-full"
                  />
                  <Input
                    type="date"
                    value={sharedDateFrom}
                    onChange={event => setSharedDateFrom(event.target.value)}
                    aria-label="조회 시작 일자"
                    className="h-9 w-full"
                  />
                  <Input
                    type="date"
                    value={sharedDateTo}
                    onChange={event => setSharedDateTo(event.target.value)}
                    aria-label="조회 종료 일자"
                    className="h-9 w-full"
                  />
                  <CustomSelect value={sharedSubCategory} onValueChange={setSharedSubCategory}>
                    <CustomSelectTrigger
                      aria-label="분류 필터"
                      className="h-9 min-h-0 w-full rounded-md border border-input bg-background px-3 text-left text-sm"
                    >
                      <CustomSelectValue>{sharedSubCategoryLabel}</CustomSelectValue>
                    </CustomSelectTrigger>
                    <CustomSelectContent>
                      {sharedFilterOptions.map(option => (
                        <CustomSelectItem key={option.value} value={option.value}>
                          {option.label}
                        </CustomSelectItem>
                      ))}
                    </CustomSelectContent>
                  </CustomSelect>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1 h-9 w-full md:h-9"
                    onClick={() => fetchSharedDocs({ silent: true })}
                    disabled={sharedDocsRefreshing}
                  >
                    {sharedDocsRefreshing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    새로고침
                  </Button>
                </div>
              </div>
              <div className="px-4 py-4">
                {sharedDocsLoading && sharedDocs.length === 0 ? (
                  <TableSkeleton rows={5} />
                ) : sharedDocs.length === 0 ? (
                  <div className="text-sm text-muted-foreground">등록된 공유문서가 없습니다.</div>
                ) : filteredSharedCount === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    선택한 조건에 해당하는 공유문서가 없습니다.
                  </div>
                ) : (
                  <Table className="min-w-[720px] text-sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          등록일
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          문서명
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          분류
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          작업일지
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          업로더
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          용량
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">
                          동작
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSharedDocs.map((doc: any, idx: number) => {
                        const docId = doc?.id ? String(doc.id) : `${idx}`
                        const metadata = parseSharedDocMetadata(doc)
                        const uploader =
                          doc?.profiles?.full_name ||
                          doc?.uploaded_by_profile?.full_name ||
                          metadata?.uploader ||
                          ''
                        const deleting = Boolean(sharedDeleting[docId])
                        const fileUrl = getSharedDocFileUrl(doc)
                        const hasPreview = Boolean(fileUrl)
                        const downloadHref = fileUrl ?? null
                        const hasDownload = Boolean(downloadHref)
                        const downloading = docId ? Boolean(sharedDownloading[docId]) : false
                        const isMarkupDoc = metadata?.source_table === 'markup_documents'
                        const markupOpenHref = buildMarkupToolHrefForDoc(
                          doc,
                          siteId,
                          metadata,
                          fileUrl
                        )
                        const isEditing = sharedEditingDocId === docId
                        const editDraft = isEditing && sharedEditDraft ? sharedEditDraft : null
                        const updating = Boolean(sharedUpdating[docId])
                        const titleValue = editDraft?.title ?? ''
                        const canSave = titleValue.trim().length > 0
                        const hasExistingCategory =
                          editDraft?.subCategory &&
                          sharedCategoryOptions.some(
                            option => option.value === editDraft.subCategory
                          )
                        const editSubCategoryValue = editDraft?.subCategory ?? '__none'
                        const linkedWorklogIds = (() => {
                          const metaArray = Array.isArray(metadata?.linked_worklog_ids)
                            ? metadata.linked_worklog_ids.filter(
                                (value: unknown): value is string =>
                                  typeof value === 'string' && value.length > 0
                              )
                            : []
                          if (metaArray.length > 0) return metaArray
                          if (metadata?.linked_worklog_id)
                            return [String(metadata.linked_worklog_id)]
                          if (metadata?.daily_report_id) return [String(metadata.daily_report_id)]
                          if (
                            Array.isArray(doc?.linked_worklog_ids) &&
                            doc.linked_worklog_ids.length > 0
                          ) {
                            return doc.linked_worklog_ids.filter(
                              (value: unknown): value is string =>
                                typeof value === 'string' && value.length > 0
                            )
                          }
                          if (doc?.linked_worklog_id) return [String(doc.linked_worklog_id)]
                          return []
                        })()
                        const snapshotPdfUrl =
                          typeof metadata?.snapshot_pdf_url === 'string' &&
                          metadata.snapshot_pdf_url.length > 0
                            ? metadata.snapshot_pdf_url
                            : undefined
                        return (
                          <TableRow key={docId}>
                            <TableCell className="align-top text-xs text-muted-foreground">
                              {doc?.created_at
                                ? new Date(doc.created_at).toLocaleString('ko-KR')
                                : '-'}
                            </TableCell>
                            <TableCell className="align-top">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <Input
                                    value={titleValue}
                                    onChange={event => {
                                      const value = event.target.value
                                      if (!isEditing) return
                                      setSharedEditDraft(prev =>
                                        prev ? { ...prev, title: value } : prev
                                      )
                                    }}
                                    placeholder="문서명을 입력하세요"
                                    className="h-9"
                                    disabled={updating}
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    원본 파일명: {doc?.file_name || '-'}
                                  </p>
                                  {doc?.description ? (
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {doc.description}
                                    </p>
                                  ) : null}
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  {hasPreview && fileUrl ? (
                                    <a
                                      href={fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-left font-medium text-foreground underline-offset-2 transition hover:underline"
                                    >
                                      {doc?.title || doc?.file_name || '-'}
                                    </a>
                                  ) : (
                                    <span className="text-left font-medium text-foreground">
                                      {doc?.title || doc?.file_name || '-'}
                                    </span>
                                  )}
                                  {doc?.description ? (
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {doc.description}
                                    </p>
                                  ) : null}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="align-top">
                              {isEditing ? (
                                <Select
                                  value={editSubCategoryValue}
                                  onValueChange={value => {
                                    if (!isEditing) return
                                    setSharedEditDraft(prev =>
                                      prev
                                        ? {
                                            ...prev,
                                            subCategory: value === '__none' ? null : value,
                                          }
                                        : prev
                                    )
                                  }}
                                  disabled={updating}
                                >
                                  <SelectTrigger className="h-9 min-w-[160px]">
                                    <SelectValue placeholder="분류 선택" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__none">분류 없음</SelectItem>
                                    {!hasExistingCategory && editDraft?.subCategory ? (
                                      <SelectItem value={editDraft.subCategory}>
                                        {sharedCategoryLabelMap[editDraft.subCategory] ||
                                          `${editDraft.subCategory} (미등록)`}
                                      </SelectItem>
                                    ) : null}
                                    {sharedCategoryOptions.map(option => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Badge variant="secondary">{resolveSharedCategoryLabel(doc)}</Badge>
                              )}
                            </TableCell>
                            <TableCell className="align-top text-xs text-muted-foreground">
                              {linkedWorklogIds.length > 0 ? (
                                <div className="flex flex-col gap-1">
                                  {linkedWorklogIds.map(id => (
                                    <a
                                      key={id}
                                      href={`/dashboard/admin/daily-reports/${id}`}
                                      className="rounded-md border border-blue-200 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50"
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      {formatSharedWorklogLabel(id)}
                                    </a>
                                  ))}
                                </div>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell className="align-top text-sm text-muted-foreground">
                              {uploader || '-'}
                            </TableCell>
                            <TableCell className="align-top text-sm text-muted-foreground">
                              {formatFileSize(doc?.file_size)}
                            </TableCell>
                            <TableCell className="align-top">
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                {markupOpenHref ? (
                                  <Button asChild size="sm" variant="secondary" className="gap-1">
                                    <a href={markupOpenHref}>열기</a>
                                  </Button>
                                ) : null}
                                {hasPreview && fileUrl ? (
                                  <Button asChild size="sm" variant="outline" className="gap-1">
                                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                      미리보기
                                    </a>
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="outline" className="gap-1" disabled>
                                    미리보기
                                  </Button>
                                )}
                                {snapshotPdfUrl ? (
                                  <Button asChild size="sm" variant="outline" className="gap-1">
                                    <a
                                      href={snapshotPdfUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      PDF
                                    </a>
                                  </Button>
                                ) : null}
                                {hasDownload && downloadHref ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1"
                                    onClick={() => {
                                      void handleSharedDownload(doc)
                                    }}
                                    disabled={downloading}
                                  >
                                    {downloading ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      '다운로드'
                                    )}
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="outline" className="gap-1" disabled>
                                    다운로드
                                  </Button>
                                )}
                                {isEditing ? (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={cancelSharedEdit}
                                      disabled={updating}
                                      className="gap-1"
                                    >
                                      취소
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={handleSharedEditSubmit}
                                      disabled={updating || !canSave}
                                      className="gap-1"
                                    >
                                      {updating ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        '저장'
                                      )}
                                    </Button>
                                  </>
                                ) : isMarkupDoc ? null : (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => startSharedEdit(doc)}
                                      disabled={!doc?.id}
                                      className="gap-1"
                                    >
                                      수정
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleSharedDelete(doc)}
                                      disabled={!doc?.id || deleting}
                                      className="gap-1"
                                    >
                                      {deleting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        '삭제'
                                      )}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="mt-4">
          <SitePhotosPanel siteId={siteId} />
        </TabsContent>

        {/* Edit Tab */}
        <TabsContent value="edit" className="mt-4">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <SiteForm
              key={siteId}
              mode="edit"
              siteId={siteId}
              initial={site}
              onSuccess={() => {
                if (typeof window !== 'undefined') window.location.reload()
              }}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function formatLabor(n: number): string {
  const v = Math.floor(Number(n) * 10) / 10
  return v.toFixed(1)
}

function formatFileSize(size: unknown): string {
  const value = Number(size)
  if (!Number.isFinite(value) || value <= 0) return '-'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let v = value
  let idx = 0
  while (v >= 1024 && idx < units.length - 1) {
    v /= 1024
    idx += 1
  }
  const formatted = v >= 10 ? v.toFixed(0) : v.toFixed(1)
  return `${formatted} ${units[idx]}`
}

function formatQuantityDisplay(value: unknown, unit?: string | null): string {
  const num = Number(value)
  if (!Number.isFinite(num)) return '-'
  const formatted = QUANTITY_FORMATTER.format(num)
  if (!unit || unit.trim().length === 0) return formatted
  return `${formatted} ${unit}`.trim()
}

function renderInventoryStatusBadge(status: string | null | undefined) {
  const key = String(status || '').toLowerCase()
  const className = INVENTORY_STATUS_STYLES[key] || DEFAULT_BADGE_STYLE
  const label = INVENTORY_STATUS_LABELS[key] || STATUS_LABELS[key] || status || '-'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  )
}

function renderStatusBadge(status: string | null | undefined) {
  const key = String(status || '').toLowerCase()
  const className = STATUS_BADGE_STYLES[key] || DEFAULT_BADGE_STYLE
  const label = STATUS_LABELS[key] || status || '-'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  )
}

function renderShipmentItemsCell(items: unknown) {
  const list = Array.isArray(items) ? items : []
  if (list.length === 0) return <span className="text-sm text-muted-foreground">-</span>
  const first = list[0] as any
  const label = first?.materials?.name || first?.materials?.code || '자재'
  const quantity = formatQuantityDisplay(first?.quantity, first?.materials?.unit)
  const remaining = list.length - 1
  return (
    <div className="flex flex-col">
      <span className="font-medium text-foreground">{label}</span>
      <span className="text-xs text-muted-foreground">
        {quantity}
        {remaining > 0 ? ` · 외 ${remaining}건` : ''}
      </span>
    </div>
  )
}

function renderShipmentQuantityCell(items: unknown) {
  const list = Array.isArray(items) ? items : []
  if (list.length === 0) return <span className="text-sm text-muted-foreground">-</span>
  const totals = new Map<string, number>()
  list.forEach(item => {
    const unit = (item as any)?.materials?.unit || ''
    const qty = Number((item as any)?.quantity ?? 0)
    if (!Number.isFinite(qty)) return
    totals.set(unit, (totals.get(unit) || 0) + qty)
  })
  return (
    <div className="flex flex-col items-end">
      {Array.from(totals.entries()).map(([unit, qty]) => (
        <span key={unit || 'default'} className="text-sm font-medium text-foreground">
          {formatQuantityDisplay(qty, unit || undefined)}
        </span>
      ))}
      <span className="text-xs text-muted-foreground">{list.length}건</span>
    </div>
  )
}

function renderRequestItemsCell(items: unknown) {
  const list = Array.isArray(items) ? items : []
  if (list.length === 0) return <span className="text-sm text-muted-foreground">-</span>
  const first = list[0] as any
  const label = first?.material_name || first?.material_code || '자재'
  const quantity = formatQuantityDisplay(first?.requested_quantity, first?.unit)
  const remaining = list.length - 1
  return (
    <div className="flex flex-col">
      <span className="font-medium text-foreground">{label}</span>
      <span className="text-xs text-muted-foreground">
        {quantity}
        {remaining > 0 ? ` · 외 ${remaining}건` : ''}
      </span>
    </div>
  )
}

function renderRequestQuantityCell(items: unknown) {
  const list = Array.isArray(items) ? items : []
  if (list.length === 0) return <span className="text-sm text-muted-foreground">-</span>
  const totals = new Map<string, number>()
  list.forEach(item => {
    const unit = (item as any)?.unit || ''
    const qty = Number((item as any)?.requested_quantity ?? 0)
    if (!Number.isFinite(qty)) return
    totals.set(unit, (totals.get(unit) || 0) + qty)
  })
  return (
    <div className="flex flex-col items-end">
      {Array.from(totals.entries()).map(([unit, qty]) => (
        <span key={unit || 'default'} className="text-sm font-medium text-foreground">
          {formatQuantityDisplay(qty, unit || undefined)}
        </span>
      ))}
      <span className="text-xs text-muted-foreground">{list.length}건</span>
    </div>
  )
}

function renderTransactionTypeBadge(type: string | null | undefined) {
  const key = String(type || '').toLowerCase()
  const className = TRANSACTION_TYPE_STYLES[key] || DEFAULT_BADGE_STYLE
  const label = TRANSACTION_TYPE_LABELS[key] || type || '-'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  )
}

function renderTransactionMaterialCell(t: any) {
  const primary = t?.materials?.name || t?.materials?.code || '-'
  const code = t?.materials?.code || ''
  const unit = t?.materials?.unit || ''
  const secondaryParts: string[] = []
  if (code && code !== primary) secondaryParts.push(code)
  if (unit) secondaryParts.push(unit)
  return (
    <div className="flex flex-col">
      <span className="font-medium text-foreground">{primary}</span>
      {secondaryParts.length > 0 ? (
        <span className="text-xs text-muted-foreground">{secondaryParts.join(' · ')}</span>
      ) : null}
    </div>
  )
}

function renderTransactionReferenceCell(t: any) {
  const typeKey = String(t?.reference_type || '').toLowerCase()
  const label = REFERENCE_LABELS[typeKey] || t?.reference_type || ''
  const referenceId = t?.reference_id
  const notes = typeof t?.notes === 'string' ? t.notes : ''
  if (!label && !referenceId && !notes) {
    return <span className="text-sm text-muted-foreground">-</span>
  }
  return (
    <div className="flex flex-col">
      {label ? <span className="font-medium text-foreground">{label}</span> : null}
      {referenceId ? <span className="text-xs text-muted-foreground">{referenceId}</span> : null}
      {notes ? (
        <span className="text-xs text-muted-foreground">{truncateText(notes, 60)}</span>
      ) : null}
    </div>
  )
}

function truncateText(value: string, limit = 60): string {
  if (!value) return ''
  return value.length > limit ? `${value.slice(0, limit)}...` : value
}

// 미리보기 링크 생성 헬퍼(전용 뷰어 → 파일 미리보기 → 상세 페이지 순)
function buildDocPreviewHref(d: any): string {
  const category = String(d?.category_type || d?.categoryType || '')
  const sub = String(d?.sub_category || d?.subType || d?.metadata?.sub_type || '')
  const docType = String(d?.document_type || d?.documentType || d?.metadata?.document_type || '')
  const url: string | undefined = d?.file_url || d?.fileUrl
  const mime: string | undefined = d?.mime_type || d?.mimeType
  // 1) 전용 뷰어 라우트 우선
  if (category === 'markup') return `/dashboard/admin/documents/${d.id}`
  if (category === 'photo_grid') {
    const direct = getSharedDocFileUrl(d)
    if (direct) return direct
    const siteId =
      (d?.site_id && String(d.site_id)) ||
      (d?.site?.id && String(d.site.id)) ||
      (d?.metadata?.site_id && String(d.metadata.site_id)) ||
      null
    if (siteId) return `/dashboard/admin/sites/${siteId}?tab=photos`
    return '/dashboard/admin/sites'
  }

  // PTW 추정: 문서유형/하위유형/메타데이터로 식별 → PTW 뷰어
  if (docType === 'ptw' || sub === 'safety_certificate' || category === 'ptw') {
    return `/dashboard/admin/documents/ptw/${d.id}`
  }

  // 기본: 통합 문서 뷰어 경로로 이동
  return `/dashboard/admin/documents/${d.id}`
}

function getSharedDocFileUrl(doc: any): string | null {
  const meta = doc?.metadata && typeof doc.metadata === 'object' ? doc.metadata : {}
  const candidates = [
    doc?.file_url,
    doc?.fileUrl,
    doc?.url,
    meta?.public_url,
    meta?.preview_url,
    meta?.file_url,
    meta?.signed_url,
  ]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) return candidate
  }
  return null
}

function parseSharedDocMetadata(doc: any): Record<string, any> {
  const raw = doc?.metadata
  if (!raw) return {}
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw))
    return raw as Record<string, any>
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
    } catch {
      return {}
    }
  }
  return {}
}

function getMarkupDocumentIdFromMetadata(metadata: Record<string, any>): string | null {
  const candidates = [
    metadata?.markup_document_id,
    metadata?.source_id,
    metadata?.document_id,
    metadata?.markup_id,
  ]
  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim()
    }
  }
  return null
}

function isMarkupEligibleSharedDoc(doc: any): boolean {
  return matchesSharedDocCategory(doc, 'construction') || matchesSharedDocCategory(doc, 'progress')
}

function buildMarkupToolHrefForDoc(
  doc: any,
  siteId: string,
  metadata: Record<string, any>,
  preResolvedUrl?: string | null
): string | null {
  const markupId = getMarkupDocumentIdFromMetadata(metadata)
  if (metadata?.source_table === 'markup_documents' && markupId) {
    return `/dashboard/admin/tools/markup?docId=${markupId}`
  }
  if (!isMarkupEligibleSharedDoc(doc)) return null
  const fileUrl = preResolvedUrl || getSharedDocFileUrl(doc)
  if (!fileUrl) return null
  const params = new URLSearchParams()
  params.set('blueprintUrl', fileUrl)
  const title = doc?.title || doc?.file_name || '도면'
  params.set('title', title)
  const resolvedSiteId =
    (typeof doc?.site_id === 'string' && doc.site_id) ||
    (typeof metadata?.site_id === 'string' && metadata.site_id) ||
    siteId
  if (resolvedSiteId) params.set('siteId', resolvedSiteId)
  if (doc?.id) params.set('unifiedDocumentId', String(doc.id))
  return `/dashboard/admin/tools/markup?${params.toString()}`
}

// Helpers: filter/sort for assignments and requests
function normalizeString(v: unknown): string {
  return String(v ?? '').toLowerCase()
}

function filteredAndSortedAssignments(
  items: any[],
  laborMap: Record<string, number>,
  query: string,
  sort:
    | 'name_asc'
    | 'name_desc'
    | 'role'
    | 'company'
    | 'date_desc'
    | 'date_asc'
    | 'labor_desc'
    | 'labor_asc',
  roleFilter: 'all' | 'worker' | 'site_manager' | 'supervisor'
): any[] {
  const q = query.trim().toLowerCase()
  let rows = Array.isArray(items) ? [...items] : []
  if (q) {
    rows = rows.filter(a => {
      const fields = [
        a?.profile?.full_name,
        a?.profile?.email,
        a?.profile?.organization?.name,
        a?.role,
      ].map(normalizeString)
      return fields.some(f => f.includes(q))
    })
  }
  // Role filter
  if (roleFilter !== 'all') {
    rows = rows.filter(a => normalizeString(a?.role) === roleFilter)
  }

  rows.sort((a, b) => {
    const nameA = normalizeString(a?.profile?.full_name)
    const nameB = normalizeString(b?.profile?.full_name)
    const roleA = normalizeString(a?.role)
    const roleB = normalizeString(b?.role)
    const compA = normalizeString(a?.profile?.organization?.name)
    const compB = normalizeString(b?.profile?.organization?.name)
    const dateA = a?.assigned_date ? new Date(a.assigned_date).getTime() : 0
    const dateB = b?.assigned_date ? new Date(b.assigned_date).getTime() : 0
    const laborA = Number.isFinite(Number(laborMap[a?.user_id])) ? Number(laborMap[a.user_id]) : 0
    const laborB = Number.isFinite(Number(laborMap[b?.user_id])) ? Number(laborMap[b.user_id]) : 0

    switch (sort) {
      case 'name_asc':
        return nameA.localeCompare(nameB)
      case 'name_desc':
        return nameB.localeCompare(nameA)
      case 'role':
        return roleA.localeCompare(roleB) || nameA.localeCompare(nameB)
      case 'company':
        return compA.localeCompare(compB) || nameA.localeCompare(nameB)
      case 'date_asc':
        return dateA - dateB
      case 'labor_desc':
        return laborB - laborA || nameA.localeCompare(nameB)
      case 'labor_asc':
        return laborA - laborB || nameA.localeCompare(nameB)
      case 'date_desc':
      default:
        return dateB - dateA
    }
  })
  return rows
}
