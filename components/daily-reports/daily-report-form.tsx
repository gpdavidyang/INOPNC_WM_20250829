'use client'

import AdditionalPhotoUploadSection from '@/components/daily-reports/additional-photo-upload-section'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useLaborHourOptions } from '@/hooks/use-labor-hour-options'
import { useWorkOptions } from '@/hooks/use-work-options'
import {
  FALLBACK_LABOR_HOUR_DEFAULT,
  FALLBACK_LABOR_HOUR_OPTIONS,
  normalizeLaborHourOptions,
} from '@/lib/labor/labor-hour-options'
import { cn } from '@/lib/utils'
import type { DailyReport, Material, Profile, Site } from '@/types'
import type {
  AdditionalPhotoData,
  UnifiedDailyReport,
  UnifiedMaterialEntry,
} from '@/types/daily-reports'
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  ChevronDown,
  ChevronUp,
  FileText,
  MapPin,
  MessageSquare,
  Package,
  Plus,
  Settings,
  Shield,
  Trash2,
  Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
// Use REST endpoints to avoid importing server actions in client

// 통합된 Props 인터페이스
interface DailyReportFormProps {
  mode: 'create' | 'edit'
  sites: Site[]
  currentUser: Profile
  materials?: Material[]
  workers?: Profile[]
  reportData?: DailyReport & {
    site?: unknown
    work_logs?: unknown[]
    weather_conditions?: unknown
    photo_groups?: unknown[]
    worker_entries?: unknown[]
    additional_photos?: unknown[]
  }
  initialUnifiedReport?: UnifiedDailyReport
  // When true, suppress internal header (title/back/toggle)
  hideHeader?: boolean
}

interface WorkContentEntry {
  id: string
  memberName: string
  memberNameOther?: string
  processType: string
  processTypeOther?: string
  workSection: string
  beforePhotos: File[]
  afterPhotos: File[]
  beforePhotoPreviews: string[]
  afterPhotoPreviews: string[]
}

interface WorkerEntry {
  id: string
  worker_id: string
  labor_hours: number
  worker_name?: string
  is_direct_input?: boolean
}

interface PhotoEntry {
  id: string
  type: 'before' | 'after'
  file: File | null
  preview: string | null
}

interface MaterialUsageFormEntry {
  id: string
  materialId?: string | null
  materialCode?: string | null
  materialName: string
  unit?: string | null
  quantity: string
  notes?: string
}

type MaterialInventoryEntry = {
  materialId: string
  quantity: number
  unit?: string | null
  minimum?: number | null
  status?: 'normal' | 'low' | 'out'
  name?: string
}

interface MaterialOptionItem {
  id: string
  name: string
  code: string | null
  unit: string | null
}

const formatLaborHourLabel = (value: number) =>
  Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)

const ORGANIZATION_UNASSIGNED_LABEL = '소속사 미지정'
const ORGANIZATION_UNKNOWN_LABEL = '소속사 정보 없음'

const createReportKey = (reportData?: DailyReportFormProps['reportData'] | null) => {
  if (!reportData) return null
  if (reportData.id) return String(reportData.id)
  const siteId = (reportData.site_id as string | undefined) || ''
  const workDate = (reportData.work_date as string | undefined) || ''
  return siteId || workDate ? `${siteId}-${workDate}` : null
}

const buildFormDataFromReport = (
  mode: DailyReportFormProps['mode'],
  reportData: DailyReportFormProps['reportData'],
  currentUser: Profile
) => {
  if (mode === 'edit' && reportData) {
    return {
      site_id:
        reportData.site_id ||
        (currentUser as unknown as { site_id?: string | null })?.site_id ||
        '',
      partner_company_id: reportData.partner_company_id || '',
      work_date: reportData.work_date || new Date().toISOString().split('T')[0],
      member_name: reportData.member_name || '',
      process_type: reportData.process_type || '',
      total_workers: reportData.total_workers || 0,
      total_labor_hours:
        (reportData as any).total_labor_hours !== undefined
          ? Number((reportData as any).total_labor_hours) || 0
          : 0,
      npc1000_incoming: reportData.npc1000_incoming || 0,
      npc1000_used: reportData.npc1000_used || 0,
      npc1000_remaining: reportData.npc1000_remaining || 0,
      issues: reportData.issues || '',
      component_name: reportData.component_name || '',
      work_process: reportData.work_process || '',
      work_section: reportData.work_section || '',
      hq_request: reportData.hq_request || '',
      created_by: reportData.created_by || currentUser.full_name,
    }
  }
  return {
    site_id: (currentUser as unknown as { site_id?: string | null })?.site_id || '',
    partner_company_id: '',
    work_date: new Date().toISOString().split('T')[0],
    member_name: '',
    process_type: '',
    total_workers: 0,
    total_labor_hours: 0,
    npc1000_incoming: 0,
    npc1000_used: 0,
    npc1000_remaining: 0,
    issues: '',
    component_name: '',
    work_process: '',
    work_section: '',
    hq_request: '',
    created_by: currentUser.full_name,
  }
}

const buildWorkEntriesFromReport = (
  mode: DailyReportFormProps['mode'],
  reportData: DailyReportFormProps['reportData']
): WorkContentEntry[] => {
  if (mode === 'edit' && reportData?.work_logs?.length) {
    return reportData.work_logs.map((log: any, index: number) => ({
      id: log?.id || `work-${index}-${Math.random().toString(36).slice(2, 8)}`,
      memberName: log?.component_type || '',
      memberNameOther: log?.component_type_other || '',
      processType: log?.process_type || '',
      processTypeOther: log?.process_type_other || '',
      workSection: log?.work_section || '',
      beforePhotos: [],
      afterPhotos: [],
      beforePhotoPreviews: [],
      afterPhotoPreviews: [],
    }))
  }
  return [
    {
      id: `work-${Math.random().toString(36).slice(2, 8)}`,
      memberName: '',
      memberNameOther: '',
      processType: '',
      processTypeOther: '',
      workSection: '',
      beforePhotos: [],
      afterPhotos: [],
      beforePhotoPreviews: [],
      afterPhotoPreviews: [],
    },
  ]
}

const buildWorkerEntriesFromReport = (
  mode: DailyReportFormProps['mode'],
  reportData: DailyReportFormProps['reportData'],
  canManageWorkers: boolean,
  coerceLaborHour: (value: unknown) => number,
  defaultLaborHour: number
): WorkerEntry[] => {
  if (mode === 'edit' && reportData?.worker_entries?.length) {
    return reportData.worker_entries.map((entry: any, index: number) => ({
      id: entry?.id || `worker-${index}-${Math.random().toString(36).slice(2, 8)}`,
      worker_id: entry?.worker_id || '',
      labor_hours: coerceLaborHour(entry?.labor_hours),
      worker_name: entry?.worker_name || '',
      is_direct_input: entry?.is_direct_input || false,
    }))
  }
  if (!canManageWorkers) return []
  return [
    {
      id: `worker-${Math.random().toString(36).slice(2, 8)}`,
      worker_id: '',
      labor_hours: defaultLaborHour,
      worker_name: '',
      is_direct_input: false,
    },
  ]
}

const buildMaterialUsageEntriesFromReport = (
  mode: DailyReportFormProps['mode'],
  reportData: DailyReportFormProps['reportData']
): MaterialUsageFormEntry[] => {
  const fromReportData =
    mode === 'edit' && Array.isArray((reportData as any)?.materials)
      ? ((reportData as any)?.materials as UnifiedMaterialEntry[])
      : Array.isArray((reportData as any)?.material_usage)
        ? ((reportData as any)?.material_usage as UnifiedMaterialEntry[])
        : []

  if (fromReportData.length === 0) return []

  return fromReportData.map((entry, index) => ({
    id: entry.id || `material-${index}`,
    materialId: entry.materialId || null,
    materialCode: entry.materialCode || null,
    materialName: entry.materialName || entry.materialCode || `자재-${index + 1}`,
    unit:
      sanitizeUnitLabel(
        entry.unit || (entry as any)?.unit_label || (entry as any)?.unitName || null
      ) ?? DEFAULT_MATERIAL_UNIT,
    quantity: entry.quantity !== undefined && entry.quantity !== null ? String(entry.quantity) : '',
    notes: entry.notes || '',
  }))
}

const buildAdditionalPhotosFromReport = (
  mode: DailyReportFormProps['mode'],
  reportData: DailyReportFormProps['reportData']
): AdditionalPhotoData[] => {
  if (mode === 'edit' && reportData?.additional_photos?.length) {
    return (reportData.additional_photos as AdditionalPhotoData[]).map((photo, index) => {
      const legacyPhoto = photo as AdditionalPhotoData & {
        preview?: string | null
        file_name?: string
      }
      return {
        id: legacyPhoto.id ?? `existing-${index}`,
        photo_type: legacyPhoto.photo_type === 'after' ? 'after' : 'before',
        description: legacyPhoto.description || '',
        file: null,
        url: legacyPhoto.url || legacyPhoto.preview || null,
        path: legacyPhoto.path,
        filename: legacyPhoto.filename || legacyPhoto.file_name || `photo-${index + 1}.jpg`,
        upload_order: legacyPhoto.upload_order ?? index + 1,
        file_size: legacyPhoto.file_size,
      }
    })
  }
  return []
}

const interpretMaterialActiveFlag = (value: unknown): boolean | null => {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value
  const normalized = String(value).trim().toLowerCase()
  if (['true', '1', 'y', 'yes', 'active', 'enabled'].includes(normalized)) return true
  if (['false', '0', 'n', 'no', 'inactive', 'disabled'].includes(normalized)) return false
  return null
}

const sanitizeUnitLabel = (value: unknown): string | null => {
  if (value === null || value === undefined) return null
  const normalized = String(value).trim()
  if (!normalized) return null
  return normalized
}

const MATERIAL_UNIT_OPTIONS = ['말', '장', '개', 'kg', 'm', 'm²', 'EA'] as const
const DEFAULT_MATERIAL_UNIT = MATERIAL_UNIT_OPTIONS[0]

const DEFAULT_MATERIAL_KEYWORD = 'npc1000'
const normalizeMaterialKeyword = (value?: string | null) =>
  value
    ? value
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
    : ''

const isSelectableMaterial = (material: any): boolean => {
  const activeFlag = interpretMaterialActiveFlag(material?.is_active)
  if (activeFlag !== null) return activeFlag

  const useFlag = interpretMaterialActiveFlag(
    material?.use_yn ??
      material?.useYn ??
      material?.use_flag ??
      material?.useFlag ??
      material?.is_use ??
      material?.isUse
  )
  if (useFlag !== null) return useFlag

  const statusFlag = interpretMaterialActiveFlag(material?.status)
  if (statusFlag !== null) return statusFlag

  return true
}

// Role-based permissions helper
const useRolePermissions = (currentUser: Profile) => {
  const isAdmin = ['admin', 'system_admin'].includes(currentUser.role)
  const isSiteManager = currentUser.role === 'site_manager'
  const isWorker = currentUser.role === 'worker'

  return {
    isAdmin,
    isSiteManager,
    isWorker,
    canViewAllSites: isAdmin,
    canEditAnyReport: isAdmin,
    canViewAdvancedFeatures: isAdmin || isSiteManager,
    canManageWorkers: isAdmin || isSiteManager,
    canApproveReports: isAdmin || isSiteManager,
    canAccessSystemSettings: isAdmin,
    roleDisplayName: isAdmin ? '관리자' : isSiteManager ? '현장관리자' : '작업자',
  }
}

// Compact collapsible section component
const CollapsibleSection = ({
  title,
  icon: Icon,
  children,
  isExpanded,
  onToggle,
  badge,
  required = false,
  adminOnly = false,
  managerOnly = false,
  permissions,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  isExpanded: boolean
  onToggle: () => void
  badge?: React.ReactNode
  required?: boolean
  adminOnly?: boolean
  managerOnly?: boolean
  permissions?: ReturnType<typeof useRolePermissions>
}) => {
  // 권한 체크
  if (adminOnly && !permissions?.isAdmin) return null
  if (managerOnly && !permissions?.canViewAdvancedFeatures) return null

  const getBorderColor = () => {
    if (adminOnly) return 'border-[#8DA0CD] shadow-sm'
    // Align manager-only sections with neutral tone for consistency
    return 'border-gray-200 dark:border-gray-700'
  }

  const getHeaderBg = () => {
    if (adminOnly) return 'hover:bg-[rgba(141,160,205,0.15)]'
    // Manager-only sections use the default hover background
    return 'hover:bg-[#F3F7FA] dark:hover:bg-gray-700'
  }

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border overflow-hidden',
        getBorderColor()
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full px-3 py-2.5 flex items-center justify-between transition-all duration-200',
          getHeaderBg()
        )}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'p-1.5 rounded',
              adminOnly ? 'bg-[rgba(141,160,205,0.25)]' : 'bg-[#F3F7FA]'
            )}
          >
            <Icon className={cn('h-4 w-4', adminOnly ? 'text-[#1B419C]' : 'text-[#5F7AB9]')} />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {title}
              {required && <span className="text-red-500 ml-1">*</span>}
            </h3>
            {adminOnly && (
              <Badge className="px-1.5 py-0.5 text-xs bg-[rgba(141,160,205,0.25)] text-[#1B419C] border-[#8DA0CD]">
                <Shield className="h-3 w-3 mr-1" />
                관리자
              </Badge>
            )}
            {managerOnly && !adminOnly && (
              <Badge className="px-1.5 py-0.5 text-xs bg-[rgba(255,70,28,0.12)] text-[#E62C00] border-[#FF461C]">
                <Settings className="h-3 w-3 mr-1" />
                관리자/현장관리자
              </Badge>
            )}
            {badge}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronUp className="h-3 w-3 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronDown className="h-3 w-3 text-gray-600 dark:text-gray-400" />
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 pt-2 border-t border-gray-100 dark:border-gray-700 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  )
}

export default function DailyReportForm({
  mode,
  sites,
  currentUser,
  materials = [],
  workers = [],
  reportData,
  initialUnifiedReport,
  hideHeader = false,
}: DailyReportFormProps) {
  const router = useRouter()
  const permissions = useRolePermissions(currentUser)
  const { options: laborHourOptionState } = useLaborHourOptions()
  const allowedLaborHours = useMemo(
    () =>
      normalizeLaborHourOptions(
        laborHourOptionState.length > 0
          ? laborHourOptionState
          : Array.from(FALLBACK_LABOR_HOUR_OPTIONS)
      ),
    [laborHourOptionState]
  )
  const defaultLaborHour = useMemo(() => {
    const positive = allowedLaborHours.find(value => value > 0)
    return typeof positive === 'number'
      ? positive
      : (allowedLaborHours[0] ?? FALLBACK_LABOR_HOUR_DEFAULT)
  }, [allowedLaborHours])
  const isAllowedLaborHourValue = useCallback(
    (value: number) => allowedLaborHours.some(option => option === value),
    [allowedLaborHours]
  )
  const coerceLaborHourValue = useCallback(
    (value: unknown) => {
      const numeric = Number(value)
      return Number.isFinite(numeric) && isAllowedLaborHourValue(numeric)
        ? numeric
        : defaultLaborHour
    },
    [defaultLaborHour, isAllowedLaborHourValue]
  )
  const [loading, setLoading] = useState(false)
  const [loadingType, setLoadingType] = useState<'draft' | 'submit' | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Section expansion states - 역할별 초기 확장 상태
  const [expandedSections, setExpandedSections] = useState({
    siteInfo: true,
    workContent: true,
    workers: permissions.canManageWorkers, // 관리자/현장관리자만 기본 확장
    photos: false,
    additionalPhotos: false,
    drawings: false,
    requests: false,
    materials: permissions.canViewAdvancedFeatures, // 고급 기능
    specialNotes: false,
    adminFeatures: false, // 관리자 전용 기능
  })

  // Global toggle state
  const [allExpanded, setAllExpanded] = useState(false)

  // Form state - 편집 모드일 때 기존 데이터로 초기화
  const [formData, setFormData] = useState(() =>
    buildFormDataFromReport(mode, reportData, currentUser)
  )

  // Partner companies and filtered sites
  const [partnerCompanies, setPartnerCompanies] = useState<any[]>([])
  const [siteFilterPartnerId, setSiteFilterPartnerId] = useState('')
  const [filteredSites, setFilteredSites] = useState<Site[]>(sites)
  const [loadingPartners, setLoadingPartners] = useState(false)
  const [reportHydrationKey, setReportHydrationKey] = useState<string | null>(() =>
    mode === 'edit' ? createReportKey(reportData) : null
  )

  const selectedSiteId = useMemo(() => {
    const reportSiteId = (reportData as any)?.site_id
    const initialSiteId =
      initialUnifiedReport && 'siteId' in initialUnifiedReport
        ? (initialUnifiedReport as UnifiedDailyReport).siteId
        : undefined
    return formData.site_id || reportSiteId || initialSiteId || ''
  }, [formData.site_id, reportData?.site_id, initialUnifiedReport?.siteId])

  const selectedSiteRecord = useMemo(() => {
    if (!selectedSiteId) return null
    const normalizedId = String(selectedSiteId)
    return (
      filteredSites.find(site => String(site?.id) === normalizedId) ||
      sites.find(site => String(site?.id) === normalizedId) ||
      null
    )
  }, [selectedSiteId, filteredSites, sites])

  const selectedOrganizationLabel = useMemo(() => {
    if (!selectedSiteRecord) return ORGANIZATION_UNASSIGNED_LABEL
    const record: any = selectedSiteRecord
    const organizationName =
      record.organization_name || record.organizations?.name || record.organization?.name || ''
    if (organizationName) return organizationName
    return record.organization_id ? ORGANIZATION_UNKNOWN_LABEL : ORGANIZATION_UNASSIGNED_LABEL
  }, [selectedSiteRecord])

  useEffect(() => {
    setFormData(prev => {
      const nextPartnerId = selectedSiteRecord?.organization_id
        ? String(selectedSiteRecord.organization_id)
        : ''
      if ((prev.partner_company_id || '') === nextPartnerId) {
        return prev
      }
      return { ...prev, partner_company_id: nextPartnerId }
    })
  }, [selectedSiteRecord])

  const [materialInventory, setMaterialInventory] = useState<
    Record<string, MaterialInventoryEntry>
  >({})
  const [materialInventoryLoading, setMaterialInventoryLoading] = useState(false)
  const [materialInventoryError, setMaterialInventoryError] = useState<string | null>(null)

  // Work options
  const { componentTypes, processTypes, loading: optionsLoading } = useWorkOptions()

  // Load partner companies based on user role
  useEffect(() => {
    const loadPartnerCompanies = async () => {
      // All users can now view and select partner companies
      // Worker and Site Manager can see all partner companies

      setLoadingPartners(true)
      try {
        const response = await fetch('/api/admin/organizations/partner-companies')
        if (response.ok) {
          const data = await response.json()
          setPartnerCompanies(data)
        }
      } catch (error) {
        console.error('Failed to load partner companies:', error)
      } finally {
        setLoadingPartners(false)
      }
    }

    loadPartnerCompanies()
  }, [permissions.canViewAdvancedFeatures])

  // Filter sites based on optional partner filter
  useEffect(() => {
    const withCurrentSite = (list: any[]): any[] => {
      const currentSiteId =
        formData.site_id ||
        (reportData as any)?.site_id ||
        (initialUnifiedReport ? (initialUnifiedReport as any).siteId : '')
      if (!currentSiteId) return Array.isArray(list) ? list : []
      const normalized = Array.isArray(list) ? [...list] : []
      const hasSite = normalized.some(site => String(site?.id) === String(currentSiteId))
      if (hasSite) return normalized
      const fallback = sites.find(site => String(site.id) === String(currentSiteId))
      if (fallback) normalized.push(fallback)
      return normalized
    }

    const filterSites = async () => {
      if (!siteFilterPartnerId) {
        setFilteredSites(withCurrentSite(sites))
        return
      }

      try {
        const response = await fetch(
          `/api/sites/by-partner?partner_company_id=${siteFilterPartnerId}`
        )
        if (response.ok) {
          const partnerSites = await response.json()
          setFilteredSites(withCurrentSite(partnerSites))
        } else {
          console.error('Failed to fetch sites for partner')
          setFilteredSites(withCurrentSite(sites)) // Fallback to all sites
        }
      } catch (error) {
        console.error('Error fetching partner sites:', error)
        setFilteredSites(withCurrentSite(sites)) // Fallback to all sites
      }
    }

    filterSites()
  }, [siteFilterPartnerId, formData.site_id, sites, reportData?.site_id, initialUnifiedReport])

  // Work content entries
  const [workEntries, setWorkEntries] = useState<WorkContentEntry[]>(() =>
    buildWorkEntriesFromReport(mode, reportData)
  )

  // Worker entries
  const [workerEntries, setWorkerEntries] = useState<WorkerEntry[]>(() =>
    buildWorkerEntriesFromReport(
      mode,
      reportData,
      permissions.canManageWorkers,
      coerceLaborHourValue,
      defaultLaborHour
    )
  )
  useEffect(() => {
    setWorkerEntries(prev =>
      prev.map(entry =>
        isAllowedLaborHourValue(entry.labor_hours)
          ? entry
          : { ...entry, labor_hours: defaultLaborHour }
      )
    )
  }, [isAllowedLaborHourValue, defaultLaborHour])

  const totalLaborHoursFromEntries = useMemo(
    () =>
      workerEntries.reduce((sum, entry) => {
        const value = Number(entry.labor_hours || 0)
        return Number.isFinite(value) ? sum + value : sum
      }, 0),
    [workerEntries]
  )

  // Material usage entries
  const [materialUsageEntries, setMaterialUsageEntries] = useState<MaterialUsageFormEntry[]>(() =>
    buildMaterialUsageEntriesFromReport(mode, reportData)
  )

  const mapMaterialToOption = useCallback(
    (material: any): MaterialOptionItem => ({
      id: String(material.id),
      name:
        material.name ||
        material.material_name ||
        material.title ||
        material.code ||
        '이름 없는 자재',
      code: material.code || material.material_code || null,
      unit: sanitizeUnitLabel(material.unit || material.unit_name || material.unit_symbol || null),
    }),
    []
  )

  const materialOptionsFromProps = useMemo(() => {
    const list = Array.isArray(materials) ? (materials as Array<any>) : []
    return list.map(mapMaterialToOption)
  }, [materials, mapMaterialToOption])

  const [materialOptionsState, setMaterialOptionsState] = useState(materialOptionsFromProps)

  useEffect(() => {
    setMaterialOptionsState(materialOptionsFromProps)
  }, [materialOptionsFromProps])

  useEffect(() => {
    if (!selectedSiteId) {
      setMaterialInventory({})
      setMaterialInventoryError(null)
      setMaterialInventoryLoading(false)
      return
    }
    let ignore = false
    setMaterialInventoryLoading(true)
    setMaterialInventoryError(null)
    fetch(`/api/admin/sites/${selectedSiteId}/materials/summary`, {
      cache: 'no-store',
      credentials: 'include',
    })
      .then(async response => {
        const payload = await response.json().catch(() => ({}))
        if (!response.ok || payload?.success === false) {
          throw new Error(payload?.error || 'INVENTORY_FETCH_FAILED')
        }
        const inventoryList = Array.isArray(payload?.data?.inventory) ? payload.data.inventory : []
        const map: Record<string, MaterialInventoryEntry> = {}
        inventoryList.forEach((item: any) => {
          const materialId = item?.material_id ? String(item.material_id) : null
          if (!materialId) return
          const rawQuantity =
            typeof item.quantity === 'number'
              ? item.quantity
              : typeof item.current_stock === 'number'
                ? item.current_stock
                : 0
          const quantity = Number.isFinite(rawQuantity) ? rawQuantity : 0
          map[materialId] = {
            materialId,
            quantity,
            unit:
              (typeof item?.materials?.unit === 'string' && item.materials.unit) ||
              (typeof item?.unit === 'string' && item.unit) ||
              null,
            minimum:
              item?.minimum_stock === null || item?.minimum_stock === undefined
                ? null
                : Number.isFinite(Number(item.minimum_stock))
                  ? Number(item.minimum_stock)
                  : null,
            status: item?.status || null,
            name: item?.materials?.name || item?.material_name || '',
          }
        })
        if (!ignore) {
          setMaterialInventory(map)
        }
      })
      .catch(error => {
        console.error('[DailyReportForm] inventory fetch failed', error)
        const friendlyMessage = (() => {
          if (error instanceof Error) {
            const raw = error.message || ''
            if (raw === 'INVENTORY_FETCH_FAILED') {
              return '재고 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
            }
            const normalized = raw.toLowerCase()
            if (
              normalized.includes('internal server error') ||
              normalized.includes('failed to fetch')
            ) {
              return '재고 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
            }
            return raw
          }
          return '재고 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
        })()
        if (!ignore) {
          setMaterialInventory({})
          setMaterialInventoryError(friendlyMessage)
        }
      })
      .finally(() => {
        if (!ignore) {
          setMaterialInventoryLoading(false)
        }
      })
    return () => {
      ignore = true
    }
  }, [selectedSiteId])

  useEffect(() => {
    let ignore = false
    const endpoints: Array<{
      url: string
      label: string
      normalize: (json: any) => any[]
    }> = [
      {
        url: '/api/admin/materials/active',
        label: 'admin',
        normalize: json =>
          json?.success && Array.isArray(json.data)
            ? json.data.filter((item: any) => {
                if (typeof item?.is_deleted === 'boolean' && item.is_deleted) return false
                return isSelectableMaterial(item)
              })
            : [],
      },
      {
        url: '/api/mobile/materials',
        label: 'mobile',
        normalize: json =>
          json?.success && Array.isArray(json.data)
            ? json.data.filter((item: any) => item && item.id)
            : [],
      },
    ]

    const loadMaterials = async () => {
      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint.url, { credentials: 'include', cache: 'no-store' })
          if (!res.ok) continue
          const json = await res.json().catch(() => null)
          const rows = endpoint.normalize(json)
          if (!rows.length) continue
          const mapped = rows.map(mapMaterialToOption)
          if (ignore) return
          console.info(`[DailyReportForm] loaded ${mapped.length} materials from ${endpoint.label}`)
          setMaterialOptionsState(mapped)
          return
        } catch (error) {
          console.warn(`[DailyReportForm] ${endpoint.label} materials fetch failed`, error)
        }
      }
      console.warn('[DailyReportForm] no material endpoints returned data')
    }

    loadMaterials()
    return () => {
      ignore = true
    }
  }, [mapMaterialToOption])

  const getDefaultMaterialOption = useCallback(() => {
    if (!materialOptionsState.length) return null
    const match = materialOptionsState.find(option => {
      const nameToken = normalizeMaterialKeyword(option.name)
      const codeToken = normalizeMaterialKeyword(option.code)
      return (
        nameToken.includes(DEFAULT_MATERIAL_KEYWORD) ||
        (codeToken ? codeToken.includes(DEFAULT_MATERIAL_KEYWORD) : false)
      )
    })
    return match ?? materialOptionsState[0]
  }, [materialOptionsState])

  useEffect(() => {
    if (!materialOptionsState.length) return
    const defaultOption = getDefaultMaterialOption()
    if (!defaultOption) return
    setMaterialUsageEntries(prev => {
      let changed = false
      const next = prev.map(entry => {
        if (entry.materialId || entry.materialName.trim().length > 0) return entry
        changed = true
        return {
          ...entry,
          materialId: defaultOption.id,
          materialCode: defaultOption.code ?? null,
          materialName: defaultOption.name,
          unit: sanitizeUnitLabel(defaultOption.unit) ?? DEFAULT_MATERIAL_UNIT,
        }
      })
      return changed ? next : prev
    })
  }, [materialOptionsState, getDefaultMaterialOption])

  const materialOptionMap = useMemo(() => {
    const map = new Map<string, MaterialOptionItem>()
    materialOptionsState.forEach(option => {
      map.set(option.id, option)
    })
    return map
  }, [materialOptionsState])

  const addMaterialEntry = useCallback(() => {
    setMaterialUsageEntries(prev => {
      const defaultOption = getDefaultMaterialOption()
      return [
        ...prev,
        {
          id: `material-${Date.now()}`,
          materialId: defaultOption?.id ?? null,
          materialCode: defaultOption?.code ?? null,
          materialName: defaultOption?.name ?? '',
          unit: sanitizeUnitLabel(defaultOption?.unit ?? null) ?? DEFAULT_MATERIAL_UNIT,
          quantity: '',
          notes: '',
        },
      ]
    })
  }, [getDefaultMaterialOption])

  const handleRemoveMaterial = useCallback((entryId: string) => {
    setMaterialUsageEntries(prev => prev.filter(entry => entry.id !== entryId))
  }, [])

  const handleMaterialSelect = useCallback(
    (entryId: string, selectedValue: string) => {
      setMaterialUsageEntries(prev =>
        prev.map(entry => {
          if (entry.id !== entryId) return entry
          if (selectedValue === '__unset__') {
            return {
              ...entry,
              materialId: null,
              materialCode: null,
              materialName: '',
              unit: null,
            }
          }
          const option = materialOptionMap.get(selectedValue)
          return {
            ...entry,
            materialId: selectedValue,
            materialCode: option?.code ?? null,
            materialName: option?.name ?? entry.materialName,
            unit: sanitizeUnitLabel(option?.unit ?? entry.unit ?? null) ?? DEFAULT_MATERIAL_UNIT,
          }
        })
      )
    },
    [materialOptionMap]
  )

  const handleMaterialQuantityChange = useCallback((entryId: string, value: string) => {
    setMaterialUsageEntries(prev =>
      prev.map(entry => (entry.id === entryId ? { ...entry, quantity: value } : entry))
    )
  }, [])

  const handleMaterialUnitChange = useCallback((entryId: string, value: string) => {
    const sanitized = sanitizeUnitLabel(value) ?? DEFAULT_MATERIAL_UNIT
    setMaterialUsageEntries(prev =>
      prev.map(entry => (entry.id === entryId ? { ...entry, unit: sanitized } : entry))
    )
  }, [])

  const handleMaterialNoteChange = useCallback((entryId: string, value: string) => {
    setMaterialUsageEntries(prev =>
      prev.map(entry => (entry.id === entryId ? { ...entry, notes: value } : entry))
    )
  }, [])

  const materialUnitOptions = useMemo(() => {
    const unique = new Set<string>(MATERIAL_UNIT_OPTIONS)
    materialUsageEntries.forEach(entry => {
      const unit = sanitizeUnitLabel(entry.unit)
      if (unit) unique.add(unit)
    })
    return Array.from(unique)
  }, [materialUsageEntries])

  const materialSummary = useMemo(() => {
    const aggregate = new Map<string, { name: string; unit: string | null; quantity: number }>()
    materialUsageEntries.forEach(entry => {
      const option = entry.materialId ? materialOptionMap.get(entry.materialId) : null
      const label = entry.materialName?.trim() || option?.name || ''
      if (!label) return

      const quantityValue = Number(entry.quantity)
      if (!Number.isFinite(quantityValue) || quantityValue === 0) return

      const unitValue = sanitizeUnitLabel(entry.unit || option?.unit || null)
      const key = `${label}|${unitValue || ''}`
      const current = aggregate.get(key)
      aggregate.set(key, {
        name: label,
        unit: unitValue,
        quantity: Number(((current?.quantity || 0) + quantityValue).toFixed(3)),
      })
    })
    return Array.from(aggregate.values())
  }, [materialUsageEntries, materialOptionMap])

  // Additional photos
  const [additionalPhotos, setAdditionalPhotos] = useState<AdditionalPhotoData[]>(() =>
    buildAdditionalPhotosFromReport(mode, reportData)
  )

  useEffect(() => {
    if (mode !== 'edit' || !reportData) return
    const nextKey = createReportKey(reportData)
    if (nextKey && nextKey === reportHydrationKey) return
    setFormData(buildFormDataFromReport(mode, reportData, currentUser))
    setWorkEntries(buildWorkEntriesFromReport(mode, reportData))
    setWorkerEntries(
      buildWorkerEntriesFromReport(
        mode,
        reportData,
        permissions.canManageWorkers,
        coerceLaborHourValue,
        defaultLaborHour
      )
    )
    setMaterialUsageEntries(buildMaterialUsageEntriesFromReport(mode, reportData))
    setAdditionalPhotos(buildAdditionalPhotosFromReport(mode, reportData))
    setReportHydrationKey(nextKey ?? null)
  }, [
    mode,
    reportData,
    currentUser,
    permissions.canManageWorkers,
    reportHydrationKey,
    coerceLaborHourValue,
    defaultLaborHour,
  ])

  // Users list for admin: current user + workers (deduped)
  const userOptions = useMemo(() => {
    const map = new Map<string, Profile>()
    const push = (u?: Profile | null) => {
      if (!u || !u.id) return
      if (!map.has(u.id)) map.set(u.id, u)
    }
    push(currentUser)
    ;(workers || []).forEach(w => push(w as Profile))
    return Array.from(map.values())
      .map(u => ({ id: String(u.id), name: u.full_name || '', role: (u as any).role || '' }))
      .filter(u => u.name)
  }, [currentUser, workers])

  // Created-by selection state (for admin-only override)
  const [createdByUserId, setCreatedByUserId] = useState<string>(() => {
    const raw = (reportData as any)?.created_by || formData.created_by || ''
    // try match by id
    const byId = userOptions.find(u => u.id === raw)?.id
    if (byId) return byId
    // try match by name
    const byName = userOptions.find(u => u.name === raw)?.id
    return byName || String((currentUser as any).id || '')
  })

  // 페이지 헤더 - 모드와 권한에 따른 표시
  const getPageTitle = () => {
    const modeText = mode === 'create' ? '작성' : '편집'
    const roleText = permissions.roleDisplayName
    return `작업일지 ${modeText}`
  }

  const getRoleIcon = () => {
    // Color mapping aligned to brand guide
    // Admin → Dark Blue, Site Manager → Orange, Worker → Mid Blue
    if (permissions.isAdmin) return <Shield className="h-5 w-5 text-[#1B419C]" />
    if (permissions.isSiteManager) return <Settings className="h-5 w-5 text-[#FF461C]" />
    return <Users className="h-5 w-5 text-[#5F7AB9]" />
  }

  const getRoleBadgeColor = () => {
    // Badge color tokens using Basic Colors
    if (permissions.isAdmin) return 'bg-[rgba(141,160,205,0.15)] text-[#1B419C] border-[#8DA0CD]'
    if (permissions.isSiteManager)
      return 'bg-[rgba(255,70,28,0.12)] text-[#E62C00] border-[#FF461C]'
    return 'bg-[rgba(243,247,250,1)] text-[#5F7AB9] border-[#BAC6E1]'
  }

  const getBreadcrumb = () => {
    if (permissions.isAdmin) {
      return mode === 'create' ? '/dashboard/admin/daily-reports' : '/dashboard/admin/daily-reports'
    }
    return '/dashboard/daily-reports'
  }

  // Section toggle functions
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const toggleAllSections = () => {
    const newState = !allExpanded
    setAllExpanded(newState)
    setExpandedSections(prev =>
      Object.keys(prev).reduce(
        (acc, key) => {
          acc[key as keyof typeof expandedSections] = newState
          return acc
        },
        {} as typeof expandedSections
      )
    )
  }

  // Form submission
  const handleSubmit = async (isDraft = false) => {
    try {
      setLoading(true)
      setLoadingType(isDraft ? 'draft' : 'submit')
      setError(null)

      const materialUsagePayload = materialUsageEntries
        .map(entry => {
          const quantityValue = Number(entry.quantity)
          const hasName = entry.materialName?.trim().length > 0

          if (!hasName && !entry.materialId) {
            return null
          }

          return {
            id: entry.id && !entry.id.startsWith('material-') ? entry.id : undefined,
            material_id: entry.materialId || null,
            material_code: entry.materialCode || null,
            material_name: hasName ? entry.materialName.trim() : '',
            quantity: Number.isFinite(quantityValue) ? quantityValue : 0,
            unit: entry.unit || null,
            notes: entry.notes?.trim() || null,
          }
        })
        .filter(
          (
            item
          ): item is {
            id?: string
            material_id: string | null
            material_code: string | null
            material_name: string
            quantity: number
            unit: string | null
            notes: string | null
          } => Boolean(item && item.material_name)
        )

      const exceededMaterials = materialUsageEntries.filter(entry => {
        if (!entry.materialId) return false
        const inventoryInfo = materialInventory[entry.materialId]
        if (!inventoryInfo) return false
        const quantityValue = Number(entry.quantity)
        return Number.isFinite(quantityValue) && quantityValue > inventoryInfo.quantity
      })

      if (exceededMaterials.length > 0) {
        const message = '재고를 초과한 자재 사용량이 있습니다. 수량을 조정해 주세요.'
        setError(message)
        toast.error(message)
        setLoading(false)
        setLoadingType(null)
        return
      }

      const primaryEntry = workEntries[0]
      const normalizeLabel = (value?: string | null) => (value || '').trim()
      const resolvedMemberName = primaryEntry
        ? primaryEntry.memberName === '기타'
          ? normalizeLabel(primaryEntry.memberNameOther) ||
            normalizeLabel(formData.member_name) ||
            primaryEntry.memberName
          : normalizeLabel(primaryEntry.memberName) || normalizeLabel(formData.member_name)
        : normalizeLabel(formData.member_name)
      const resolvedProcessType = primaryEntry
        ? primaryEntry.processType === '기타'
          ? normalizeLabel(primaryEntry.processTypeOther) ||
            normalizeLabel(formData.process_type) ||
            primaryEntry.processType
          : normalizeLabel(primaryEntry.processType) || normalizeLabel(formData.process_type)
        : normalizeLabel(formData.process_type)
      const existingMemberName = normalizeLabel((reportData as any)?.member_name)
      const existingProcessType = normalizeLabel((reportData as any)?.process_type)
      const existingWorkSection = normalizeLabel((reportData as any)?.work_section)
      const resolvedWorkSection = normalizeLabel(primaryEntry?.workSection) || existingWorkSection

      const workerEntriesPayload = permissions.canManageWorkers
        ? workerEntries
            .map(entry => {
              const trimmedName = (entry.worker_name || '').trim()
              const hasWorkerReference = entry.worker_id && entry.worker_id.length > 0
              const resolvedName =
                trimmedName ||
                (hasWorkerReference
                  ? workers.find(worker => worker.id === entry.worker_id)?.full_name || ''
                  : '')
              return {
                ...entry,
                worker_id: hasWorkerReference ? entry.worker_id : null,
                worker_name: resolvedName,
                is_direct_input: entry.is_direct_input || !hasWorkerReference,
              }
            })
            .filter(entry => {
              const hasLabor = isAllowedLaborHourValue(entry.labor_hours) && entry.labor_hours > 0
              const hasWorkerInfo =
                (typeof entry.worker_id === 'string' && entry.worker_id.length > 0) ||
                (entry.worker_name && entry.worker_name.trim().length > 0)
              return hasLabor && hasWorkerInfo
            })
        : []

      const effectiveSiteId = selectedSiteId
      if (!effectiveSiteId) {
        throw new Error('현장 정보가 비어 있어 저장할 수 없습니다.')
      }

      const nextMemberName = resolvedMemberName || existingMemberName
      const nextProcessType = resolvedProcessType || existingProcessType

      const submitData: Record<string, any> = {
        id: reportData?.id,
        site_id: effectiveSiteId,
        partner_company_id: formData.partner_company_id || null,
        work_date: formData.work_date,
        // created_by should be a user id in DB
        created_by: createdByUserId || undefined,
        member_name: nextMemberName || null,
        process_type: nextProcessType || null,
        component_name: nextMemberName || null,
        work_process: nextProcessType || null,
        work_section: resolvedWorkSection || null,
        total_workers: Number(formData.total_workers ?? 0) || 0,
        total_labor_hours: Number(formData.total_labor_hours ?? 0) || 0,
        npc1000_incoming: Number(formData.npc1000_incoming ?? 0) || 0,
        npc1000_used: Number(formData.npc1000_used ?? 0) || 0,
        npc1000_remaining: Number(formData.npc1000_remaining ?? 0) || 0,
        issues: normalizeLabel(formData.issues) || null,
        hq_request: normalizeLabel(formData.hq_request) || null,
        status: isDraft ? 'draft' : 'submitted',
        work_entries: workEntries,
        worker_entries: workerEntriesPayload,
        material_usage: materialUsagePayload,
        additional_photos: additionalPhotos,
      }
      console.debug('작업일지 제출 payload', submitData)

      let ok = false
      if (mode === 'edit' && reportData) {
        const res = await fetch(`/api/admin/daily-reports/${reportData.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        })
        if (res.status === 409) {
          const j = await res.json().catch(() => ({}))
          const existingId = j?.existing_id
          setError(j?.error || '중복된 작업일지가 있습니다.')
          toast.error(j?.error || '중복된 작업일지가 있습니다.', {
            action: existingId
              ? {
                  label: '해당 일지로 이동',
                  onClick: () => router.push(`/dashboard/admin/daily-reports/${existingId}`),
                }
              : undefined,
          })
          ok = false
        } else {
          if (!res.ok) {
            const errPayload = await res.json().catch(() => ({}))
            console.error('작업일지 수정 실패 응답:', errPayload)
            setError(errPayload?.error || '작업일지 저장에 실패했습니다.')
            toast.error(errPayload?.error || '작업일지 저장에 실패했습니다.')
          }
          ok = res.ok
        }
      } else {
        const res = await fetch('/api/admin/daily-reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        })
        if (res.status === 409) {
          const j = await res.json().catch(() => ({}))
          const existingId = j?.existing_id
          setError(j?.error || '중복된 작업일지가 있습니다.')
          toast.error(j?.error || '중복된 작업일지가 있습니다.', {
            action: existingId
              ? {
                  label: '해당 일지로 이동',
                  onClick: () => router.push(`/dashboard/admin/daily-reports/${existingId}`),
                }
              : undefined,
          })
          ok = false
        } else {
          if (!res.ok) {
            const errPayload = await res.json().catch(() => ({}))
            console.error('작업일지 생성 실패 응답:', errPayload)
            setError(errPayload?.error || '작업일지 저장에 실패했습니다.')
            toast.error(errPayload?.error || '작업일지 저장에 실패했습니다.')
          }
          ok = res.ok
        }
      }

      if (ok) {
        toast.success(`작업일지가 ${isDraft ? '임시 상태로 저장' : '제출'}되었습니다.`)
        router.push(getBreadcrumb())
      } else {
        setError('작업일지 저장에 실패했습니다.')
        toast.error('작업일지 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setError('예상치 못한 오류가 발생했습니다.')
      toast.error('예상치 못한 오류가 발생했습니다.')
    } finally {
      setLoading(false)
      setLoadingType(null)
    }
  }

  // External toggle-all control via window event
  React.useEffect(() => {
    const handler = () => toggleAllSections()
    window.addEventListener('toggle-all-sections', handler)
    return () => window.removeEventListener('toggle-all-sections', handler)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {!hideHeader && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => router.push(getBreadcrumb())}
                  className="flex items-center gap-2 text-gray-600 hover:text-[#15347C] hover:bg-[#F3F7FA]"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>돌아가기</span>
                </Button>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  {getRoleIcon()}
                  <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={toggleAllSections} className="text-sm">
                  {allExpanded ? '모두 접기' : '모두 펼치기'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700 font-medium">오류</span>
            </div>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Section 1: 현장 정보 (항상 표시) */}
          <CollapsibleSection
            title="현장 정보"
            icon={MapPin}
            isExpanded={expandedSections.siteInfo}
            onToggle={() => toggleSection('siteInfo')}
            required={true}
            permissions={permissions}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="site_id">현장 선택 *</Label>
                <CustomSelect
                  value={formData.site_id}
                  onValueChange={value => setFormData(prev => ({ ...prev, site_id: value }))}
                >
                  <CustomSelectTrigger>
                    <CustomSelectValue placeholder="현장을 선택하세요" />
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    {filteredSites.map(site => (
                      <CustomSelectItem key={site.id} value={site.id}>
                        {site.name}
                      </CustomSelectItem>
                    ))}
                  </CustomSelectContent>
                </CustomSelect>
              </div>
              <div>
                <Label>소속 (자동)</Label>
                <Input value={selectedOrganizationLabel} readOnly />
                <p className="text-xs text-gray-500 mt-1">
                  현장을 선택하면 연결된 소속이 자동으로 표시됩니다.
                </p>
              </div>
              <div>
                <Label htmlFor="work_date">작업일자 *</Label>
                <Input
                  id="work_date"
                  type="date"
                  value={formData.work_date}
                  onChange={e => setFormData(prev => ({ ...prev, work_date: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <Label htmlFor="partner_filter">현장 필터 (소속)</Label>
                <CustomSelect
                  value={siteFilterPartnerId || 'all'}
                  onValueChange={value => setSiteFilterPartnerId(value === 'all' ? '' : value)}
                >
                  <CustomSelectTrigger>
                    <CustomSelectValue placeholder="소속으로 현장을 필터링하세요" />
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    <CustomSelectItem value="all">전체 소속</CustomSelectItem>
                    {partnerCompanies.map(company => (
                      <CustomSelectItem key={company.id} value={company.id}>
                        {company.company_name}
                      </CustomSelectItem>
                    ))}
                  </CustomSelectContent>
                </CustomSelect>
                {loadingPartners && (
                  <p className="text-xs text-gray-500 mt-1">소속 목록을 불러오는 중...</p>
                )}
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 2: 작업 내역 */}
          <CollapsibleSection
            title="작업 내역"
            icon={FileText}
            isExpanded={expandedSections.workContent}
            onToggle={() => toggleSection('workContent')}
            required={true}
            permissions={permissions}
            badge={<Badge variant="outline">{workEntries.length}개</Badge>}
          >
            <div className="space-y-4">
              {workEntries.map((entry, index) => (
                <div key={entry.id} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">작업 내역 #{index + 1}</h4>
                    {workEntries.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setWorkEntries(prev => prev.filter((_, i) => i !== index))
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>부재명</Label>
                      <CustomSelect
                        value={entry.memberName}
                        onValueChange={value => {
                          const newEntries = [...workEntries]
                          newEntries[index] = {
                            ...newEntries[index],
                            memberName: value,
                            memberNameOther:
                              value === '기타' ? newEntries[index].memberNameOther || '' : '',
                          }
                          setWorkEntries(newEntries)
                        }}
                      >
                        <CustomSelectTrigger>
                          <CustomSelectValue placeholder="부재명 선택" />
                        </CustomSelectTrigger>
                        <CustomSelectContent>
                          {componentTypes.map(type => (
                            <CustomSelectItem key={type.id} value={type.option_label}>
                              {type.option_label}
                            </CustomSelectItem>
                          ))}
                          {!componentTypes.some(t => t.option_label === '기타') && (
                            <CustomSelectItem value="기타">기타</CustomSelectItem>
                          )}
                        </CustomSelectContent>
                      </CustomSelect>
                      {entry.memberName === '기타' && (
                        <Input
                          className="mt-2"
                          placeholder="부재명을 직접 입력하세요"
                          value={entry.memberNameOther || ''}
                          onChange={e => {
                            const newEntries = [...workEntries]
                            newEntries[index] = {
                              ...newEntries[index],
                              memberNameOther: e.target.value,
                            }
                            setWorkEntries(newEntries)
                          }}
                        />
                      )}
                    </div>
                    <div>
                      <Label>작업공정</Label>
                      <CustomSelect
                        value={entry.processType}
                        onValueChange={value => {
                          const newEntries = [...workEntries]
                          newEntries[index] = {
                            ...newEntries[index],
                            processType: value,
                            processTypeOther:
                              value === '기타' ? newEntries[index].processTypeOther || '' : '',
                          }
                          setWorkEntries(newEntries)
                        }}
                      >
                        <CustomSelectTrigger>
                          <CustomSelectValue placeholder="작업공정 선택" />
                        </CustomSelectTrigger>
                        <CustomSelectContent>
                          {processTypes.map(type => (
                            <CustomSelectItem key={type.id} value={type.option_label}>
                              {type.option_label}
                            </CustomSelectItem>
                          ))}
                          {!processTypes.some(t => t.option_label === '기타') && (
                            <CustomSelectItem value="기타">기타</CustomSelectItem>
                          )}
                        </CustomSelectContent>
                      </CustomSelect>
                      {entry.processType === '기타' && (
                        <Input
                          className="mt-2"
                          placeholder="작업공정을 직접 입력하세요"
                          value={entry.processTypeOther || ''}
                          onChange={e => {
                            const newEntries = [...workEntries]
                            newEntries[index] = {
                              ...newEntries[index],
                              processTypeOther: e.target.value,
                            }
                            setWorkEntries(newEntries)
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label>작업 구간</Label>
                    <Input
                      value={entry.workSection}
                      onChange={e => {
                        const newEntries = [...workEntries]
                        newEntries[index] = { ...newEntries[index], workSection: e.target.value }
                        setWorkEntries(newEntries)
                      }}
                      placeholder="작업 구간을 입력하세요"
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setWorkEntries(prev => [
                    ...prev,
                    {
                      id: `work-${Date.now()}`,
                      memberName: '',
                      memberNameOther: '',
                      processType: '',
                      processTypeOther: '',
                      workSection: '',
                      beforePhotos: [],
                      afterPhotos: [],
                      beforePhotoPreviews: [],
                      afterPhotoPreviews: [],
                    },
                  ])
                }}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                작업 내역 추가
              </Button>
            </div>
          </CollapsibleSection>

          {/* Section 3: 인력 관리 (관리자/현장관리자만) */}
          {permissions.canManageWorkers && (
            <CollapsibleSection
              title="인력 관리"
              icon={Users}
              isExpanded={expandedSections.workers}
              onToggle={() => toggleSection('workers')}
              managerOnly={true}
              permissions={permissions}
              badge={<Badge variant="outline">{workerEntries.length}명</Badge>}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2 text-sm text-gray-600">
                    등록된 작업자:{' '}
                    <span className="font-semibold text-gray-900">{workerEntries.length}</span>명
                  </div>
                  <div className="rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2 text-sm text-gray-600">
                    공수 합계:{' '}
                    <span className="font-semibold text-gray-900">
                      {totalLaborHoursFromEntries.toFixed(1)}
                    </span>{' '}
                    공수
                  </div>
                </div>
                {workerEntries.map((entry, index) => (
                  <div key={entry.id} className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">작업자 #{index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setWorkerEntries(prev => prev.filter((_, i) => i !== index))
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>작업자 선택</Label>
                        <CustomSelect
                          value={entry.is_direct_input ? 'direct' : entry.worker_id || ''}
                          onValueChange={value => {
                            const newEntries = [...workerEntries]
                            const isDirect = value === 'direct'
                            const selectedWorker = workers.find(worker => worker.id === value)
                            newEntries[index] = {
                              ...newEntries[index],
                              worker_id: isDirect ? '' : value,
                              worker_name: isDirect
                                ? ''
                                : selectedWorker?.full_name || newEntries[index].worker_name || '',
                              is_direct_input: isDirect,
                            }
                            setWorkerEntries(newEntries)
                          }}
                        >
                          <CustomSelectTrigger>
                            <CustomSelectValue placeholder="작업자 선택" />
                          </CustomSelectTrigger>
                          <CustomSelectContent>
                            <CustomSelectItem value="direct">직접 입력</CustomSelectItem>
                            {workers.map(worker => (
                              <CustomSelectItem key={worker.id} value={worker.id}>
                                {worker.full_name}
                              </CustomSelectItem>
                            ))}
                          </CustomSelectContent>
                        </CustomSelect>
                      </div>
                      {entry.is_direct_input && (
                        <div>
                          <Label>작업자 이름</Label>
                          <Input
                            value={entry.worker_name || ''}
                            onChange={e => {
                              const newEntries = [...workerEntries]
                              newEntries[index] = {
                                ...newEntries[index],
                                worker_name: e.target.value,
                                is_direct_input: true,
                              }
                              setWorkerEntries(newEntries)
                            }}
                            placeholder="작업자 이름을 입력하세요"
                          />
                        </div>
                      )}
                      <div>
                        <Label>공수</Label>
                        <CustomSelect
                          value={
                            isAllowedLaborHourValue(entry.labor_hours)
                              ? formatLaborHourLabel(entry.labor_hours)
                              : ''
                          }
                          onValueChange={value => {
                            const newEntries = [...workerEntries]
                            newEntries[index] = {
                              ...newEntries[index],
                              labor_hours: coerceLaborHourValue(parseFloat(value)),
                            }
                            setWorkerEntries(newEntries)
                          }}
                        >
                          <CustomSelectTrigger>
                            <CustomSelectValue placeholder="공수를 선택하세요" />
                          </CustomSelectTrigger>
                          <CustomSelectContent>
                            {allowedLaborHours.map(option => {
                              const optionValue = formatLaborHourLabel(option)
                              return (
                                <CustomSelectItem key={optionValue} value={optionValue}>
                                  {optionValue} 공수
                                </CustomSelectItem>
                              )
                            })}
                          </CustomSelectContent>
                        </CustomSelect>
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setWorkerEntries(prev => [
                      ...prev,
                      {
                        id: `worker-${Date.now()}`,
                        worker_id: '',
                        labor_hours: defaultLaborHour,
                        worker_name: '',
                        is_direct_input: false,
                      },
                    ])
                  }}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  작업자 추가
                </Button>
              </div>
            </CollapsibleSection>
          )}

          {/* Section 4: 자재 사용 현황 (고급 기능) */}
          {permissions.canViewAdvancedFeatures && (
            <CollapsibleSection
              title="자재 사용 현황"
              icon={Package}
              isExpanded={expandedSections.materials}
              onToggle={() => toggleSection('materials')}
              managerOnly={true}
              permissions={permissions}
            >
              <div className="space-y-4">
                {materialSummary.length > 0 && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <div className="mb-2 font-medium text-slate-800">자재별 사용 합계</div>
                    <div className="flex flex-wrap gap-2">
                      {materialSummary.map(item => (
                        <Badge
                          key={`${item.name}-${item.unit || 'unit'}`}
                          variant="secondary"
                          className="bg-white text-slate-700 border-slate-200"
                        >
                          {item.name}: {item.quantity}
                          {item.unit ? ` ${item.unit}` : ''}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {materialUsageEntries.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                    <p className="font-medium text-slate-700">등록된 자재 사용 내역이 없습니다.</p>
                    <p className="mt-1 text-slate-500">
                      자재는 본사 관리자 &gt; 자재 관리 설정에서 사전에 등록할 수 있으며, 필요한
                      경우 아래 “자재 추가” 버튼을 눌러 직접 작성할 수도 있습니다.
                    </p>
                  </div>
                ) : (
                  materialUsageEntries.map((entry, index) => {
                    const selectedOption =
                      entry.materialId && materialOptionMap.get(entry.materialId)
                    const selectValue = entry.materialId ?? '__unset__'
                    const inventoryInfo = entry.materialId
                      ? materialInventory[entry.materialId]
                      : null
                    const quantityValue = Number(entry.quantity)
                    const exceedsInventory =
                      Boolean(inventoryInfo) &&
                      Number.isFinite(quantityValue) &&
                      quantityValue > (inventoryInfo?.quantity ?? 0)
                    return (
                      <div
                        key={entry.id}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-5 shadow-xs"
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-600">
                              {index + 1}
                            </span>
                            <span>
                              {entry.materialName
                                ? entry.materialName
                                : selectedOption?.name || '자재 미지정'}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-slate-500 hover:text-red-600"
                            onClick={() => handleRemoveMaterial(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>자재 선택</Label>
                            <CustomSelect
                              value={selectValue}
                              onValueChange={value => handleMaterialSelect(entry.id, value)}
                            >
                              <CustomSelectTrigger className="w-full">
                                <CustomSelectValue
                                  placeholder="자재를 선택하세요"
                                  className="truncate"
                                />
                              </CustomSelectTrigger>
                              <CustomSelectContent>
                                <CustomSelectItem value="__unset__">선택 안 함</CustomSelectItem>
                                {materialOptionsState.map(option => (
                                  <CustomSelectItem key={option.id} value={option.id}>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{option.name}</span>
                                    </div>
                                  </CustomSelectItem>
                                ))}
                              </CustomSelectContent>
                            </CustomSelect>
                            <p className="text-xs text-muted-foreground">
                              자재관리 도구에서 활성화된 자재만 목록에 표시됩니다.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label>자재명</Label>
                            <Input
                              value={entry.materialName}
                              readOnly
                              placeholder="자재를 선택하세요"
                              className="bg-muted/50 cursor-not-allowed"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>사용량</Label>
                            <Input
                              type="number"
                              inputMode="decimal"
                              value={entry.quantity}
                              onChange={e => handleMaterialQuantityChange(entry.id, e.target.value)}
                              placeholder="예: 12.5"
                              className={cn(
                                exceedsInventory &&
                                  'border-destructive text-destructive focus-visible:ring-destructive'
                              )}
                              aria-invalid={exceedsInventory || undefined}
                            />
                            <div className="text-xs text-muted-foreground">
                              {materialInventoryLoading ? (
                                '현장 재고를 확인하는 중입니다...'
                              ) : inventoryInfo ? (
                                <span
                                  className={cn(
                                    inventoryInfo.quantity <= 0 && 'text-destructive font-medium'
                                  )}
                                >
                                  현재 재고{' '}
                                  <strong>
                                    {inventoryInfo.quantity.toLocaleString()}
                                    {inventoryInfo.unit ? ` ${inventoryInfo.unit}` : ''}
                                  </strong>
                                  {typeof inventoryInfo.minimum === 'number'
                                    ? ` / 최소 ${inventoryInfo.minimum.toLocaleString()}`
                                    : ''}
                                </span>
                              ) : materialInventoryError ? (
                                <span className="text-muted-foreground">
                                  {materialInventoryError}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">재고 정보 없음</span>
                              )}
                              {exceedsInventory && (
                                <span className="mt-1 block text-destructive font-medium">
                                  입력 수량이 현재 재고를 초과합니다.
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>단위</Label>
                            <CustomSelect
                              value={entry.unit || DEFAULT_MATERIAL_UNIT}
                              onValueChange={value => handleMaterialUnitChange(entry.id, value)}
                            >
                              <CustomSelectTrigger className="w-full">
                                <CustomSelectValue placeholder="단위를 선택하세요" />
                              </CustomSelectTrigger>
                              <CustomSelectContent>
                                {materialUnitOptions.map(option => (
                                  <CustomSelectItem key={option} value={option}>
                                    {option}
                                  </CustomSelectItem>
                                ))}
                              </CustomSelectContent>
                            </CustomSelect>
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label>비고</Label>
                            <Textarea
                              value={entry.notes ?? ''}
                              onChange={e => handleMaterialNoteChange(entry.id, e.target.value)}
                              placeholder="자재 사용 관련 특이사항이나 메모를 입력하세요"
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}

                <div className="flex flex-col gap-2">
                  <Button type="button" variant="outline" onClick={addMaterialEntry}>
                    <Plus className="h-4 w-4 mr-2" />
                    자재 추가
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    자재 목록은 본사 관리자 &gt; 자재 관리 &gt; 기초 마스터에서 관리할 수 있습니다.
                  </p>
                </div>
              </div>
            </CollapsibleSection>
          )}

          {/* Section 6: 추가 사진 */}
          <CollapsibleSection
            title="추가 사진"
            icon={Camera}
            isExpanded={expandedSections.additionalPhotos}
            onToggle={() => toggleSection('additionalPhotos')}
            permissions={permissions}
            badge={<Badge variant="outline">{additionalPhotos.length}개</Badge>}
          >
            <AdditionalPhotoUploadSection
              photos={additionalPhotos}
              onPhotosChange={setAdditionalPhotos}
            />
          </CollapsibleSection>

          {/* Section 7: 본사 요청사항 */}
          <CollapsibleSection
            title="본사 요청사항"
            icon={MessageSquare}
            isExpanded={expandedSections.requests}
            onToggle={() => toggleSection('requests')}
            permissions={permissions}
          >
            <div>
              <Label>요청사항</Label>
              <Textarea
                value={formData.hq_request || ''}
                onChange={e => setFormData(prev => ({ ...prev, hq_request: e.target.value }))}
                placeholder="본사에 전달할 요청사항이 있으면 입력하세요"
                rows={4}
              />
            </div>
          </CollapsibleSection>

          {permissions.isAdmin && (
            <CollapsibleSection
              title="관리자 전용 기능"
              icon={Shield}
              isExpanded={expandedSections.adminFeatures}
              onToggle={() => toggleSection('adminFeatures')}
              adminOnly={true}
              permissions={permissions}
            >
              <div className="space-y-4">
                <div className="p-4 bg-[rgba(141,160,205,0.15)] border border-[#8DA0CD] rounded-lg">
                  <h4 className="font-medium text-[#1B419C] mb-3">관리자 권한 기능</h4>
                  <div className="space-y-2 text-sm text-[#5F7AB9]">
                    <p className="font-medium">
                      이 섹션은 관리자(admin/system_admin)만 사용 가능합니다.
                    </p>

                    <div className="mt-2 space-y-1">
                      <p className="font-medium text-[#15347C]">📋 주요 기능:</p>
                      <ul className="ml-4 space-y-1 list-disc">
                        <li>
                          <strong>작성자 이름 수정:</strong> 다른 사람을 대신하여 작업일지 작성 가능
                        </li>
                        <li>
                          <strong>총 작업자 수:</strong> 전체 현장 인원 수를 수동으로 조정 (급여
                          계산에 반영)
                        </li>
                      </ul>
                    </div>

                    <div className="mt-2 space-y-1">
                      <p className="font-medium text-[#15347C]">🎯 사용 목적:</p>
                      <ul className="ml-4 space-y-1 list-disc">
                        <li>현장 작업자가 직접 작성하지 못한 경우 대리 작성</li>
                        <li>잘못 입력된 정보의 수정 및 보정</li>
                        <li>특수 상황에서의 유연한 대처</li>
                      </ul>
                    </div>

                    <p className="mt-2 text-xs text-[#8DA0CD] italic">
                      ※ 추후 승인 프로세스, 일괄 처리 등 추가 기능이 확장될 예정입니다.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>작성자 (수정 가능)</Label>
                    <CustomSelect
                      value={createdByUserId}
                      onValueChange={val => {
                        setCreatedByUserId(val)
                        const selected = userOptions.find(u => u.id === val)
                        setFormData(prev => ({ ...prev, created_by: selected?.name || '' }))
                      }}
                    >
                      <CustomSelectTrigger className="border-[#8DA0CD]">
                        <CustomSelectValue placeholder="사용자 리스트" />
                      </CustomSelectTrigger>
                      <CustomSelectContent>
                        {userOptions.map(u => (
                          <CustomSelectItem key={u.id} value={u.id}>
                            {u.name}
                          </CustomSelectItem>
                        ))}
                      </CustomSelectContent>
                    </CustomSelect>
                    <p className="text-xs text-gray-500 mt-1">
                      다른 작업자를 대신하여 작성 시 사용
                    </p>
                  </div>
                  <div>
                    <Label>총 작업자 수</Label>
                    <Input
                      type="number"
                      value={formData.total_workers || 0}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, total_workers: Number(e.target.value) }))
                      }
                      placeholder="총 작업자 수"
                      className="border-[#8DA0CD] focus:border-[#5F7AB9]"
                    />
                    <p className="text-xs text-gray-500 mt-1">현장 전체 인원 수 (급여 계산 기준)</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label>총 공수</Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.total_labor_hours ?? 0}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            total_labor_hours: Number(e.target.value),
                          }))
                        }
                        placeholder="총 공수"
                        className="border-[#8DA0CD] focus:border-[#5F7AB9]"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setFormData(prev => ({
                            ...prev,
                            total_labor_hours: Number(totalLaborHoursFromEntries.toFixed(2)),
                          }))
                        }
                        className="border-[#8DA0CD] text-[#1B419C]"
                      >
                        공수 합계 반영
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      현재 작업자 공수 합계:{' '}
                      <span className="font-semibold text-gray-700">
                        {totalLaborHoursFromEntries.toFixed(2)}
                      </span>{' '}
                      공수
                    </p>
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          )}
        </div>

        {/* Submit Buttons - Enhanced with role-based styling */}
        <div className="mt-8 bg-white p-6 rounded-lg border shadow-sm">
          {/* Action Summary removed per admin UX cleanup */}

          {/* Error Display */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(getBreadcrumb())}
              disabled={loading}
              className="min-w-[80px]"
            >
              취소
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="min-w-[120px] border-[#8DA0CD] text-[#5F7AB9] hover:bg-[#F3F7FA]"
            >
              {loading && loadingType === 'draft' ? '저장 중...' : '임시 저장'}
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={loading}
              className={cn(
                'min-w-[160px] font-semibold text-white',
                permissions.isAdmin
                  ? 'bg-gradient-to-r from-[#1B419C] to-[#15347C] hover:from-[#15347C] hover:to-[#1B419C]'
                  : permissions.isSiteManager
                    ? 'bg-gradient-to-r from-[#FF461C] to-[#E62C00] hover:from-[#E62C00] hover:to-[#FF461C]'
                    : 'bg-gradient-to-r from-[#8DA0CD] to-[#5F7AB9] hover:from-[#5F7AB9] hover:to-[#8DA0CD]'
              )}
            >
              {loading && loadingType === 'submit'
                ? '처리 중...'
                : mode === 'create'
                  ? '작업일지 제출'
                  : '수정사항 저장'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
