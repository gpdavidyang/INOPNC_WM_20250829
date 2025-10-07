'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  ArrowLeft,
  AlertCircle,
  MapPin,
  Users,
  Settings,
  Shield,
  Plus,
  Camera,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  FileText,
  Package,
  Receipt,
  Image as ImageIcon,
  Trash2,
  Save,
  Send,
} from 'lucide-react'
import type { Profile, Site, Material, DailyReport } from '@/types'
import type { AdditionalPhotoData } from '@/types/daily-reports'
import { useWorkOptions } from '@/hooks/use-work-options'
import AdditionalPhotoUploadSection from '@/components/daily-reports/additional-photo-upload-section'
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
    receipts?: unknown[]
    additional_photos?: unknown[]
  }
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

interface ReceiptEntry {
  id: string
  category: string
  amount: string
  date: string
  file: File | null
  preview?: string | null
}

interface MaterialEntry {
  incoming: string
  used: string
  remaining: string
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
    if (managerOnly) return 'border-[#FF461C] shadow-sm'
    return 'border-gray-200 dark:border-gray-700'
  }

  const getHeaderBg = () => {
    if (adminOnly) return 'hover:bg-[rgba(141,160,205,0.15)]'
    if (managerOnly) return 'hover:bg-[rgba(255,70,28,0.08)]'
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
              adminOnly
                ? 'bg-[rgba(141,160,205,0.25)]'
                : managerOnly
                  ? 'bg-[rgba(255,70,28,0.12)]'
                  : 'bg-[#F3F7FA]'
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4',
                adminOnly ? 'text-[#1B419C]' : managerOnly ? 'text-[#E62C00]' : 'text-[#5F7AB9]'
              )}
            />
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
}: DailyReportFormProps) {
  const router = useRouter()
  const permissions = useRolePermissions(currentUser)
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
    receipts: false,
    drawings: false,
    requests: false,
    materials: permissions.canViewAdvancedFeatures, // 고급 기능
    specialNotes: false,
    adminFeatures: false, // 관리자 전용 기능
  })

  // Global toggle state
  const [allExpanded, setAllExpanded] = useState(false)

  // Form state - 편집 모드일 때 기존 데이터로 초기화
  const [formData, setFormData] = useState(() => {
    if (mode === 'edit' && reportData) {
      return {
        site_id: reportData.site_id || (currentUser as unknown).site_id || '',
        partner_company_id: reportData.partner_company_id || '',
        work_date: reportData.work_date || new Date().toISOString().split('T')[0],
        member_name: reportData.member_name || '',
        process_type: reportData.process_type || '',
        total_workers: reportData.total_workers || 0,
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
      site_id: (currentUser as unknown).site_id || '',
      partner_company_id: '',
      work_date: new Date().toISOString().split('T')[0],
      member_name: '',
      process_type: '',
      total_workers: 0,
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
  })

  // Work options
  const { componentTypes, processTypes, loading: optionsLoading } = useWorkOptions()

  // Partner companies and filtered sites
  const [partnerCompanies, setPartnerCompanies] = useState<any[]>([])
  const [filteredSites, setFilteredSites] = useState<Site[]>(sites)
  const [loadingPartners, setLoadingPartners] = useState(false)

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

  // Filter sites based on selected partner company
  useEffect(() => {
    const filterSites = async () => {
      if (!formData.partner_company_id) {
        setFilteredSites(sites)
        return
      }

      try {
        const response = await fetch(
          `/api/sites/by-partner?partner_company_id=${formData.partner_company_id}`
        )
        if (response.ok) {
          const partnerSites = await response.json()
          setFilteredSites(partnerSites)
        } else {
          console.error('Failed to fetch sites for partner')
          setFilteredSites(sites) // Fallback to all sites
        }
      } catch (error) {
        console.error('Error fetching partner sites:', error)
        setFilteredSites(sites) // Fallback to all sites
      }
    }

    filterSites()
  }, [formData.partner_company_id, sites])

  // Work content entries
  const [workEntries, setWorkEntries] = useState<WorkContentEntry[]>(() => {
    if (mode === 'edit' && reportData?.work_logs?.length) {
      return reportData.work_logs.map((log: unknown) => ({
        id: log.id || `work-${Date.now()}`,
        memberName: log.component_type || '',
        memberNameOther: log.component_type_other || '',
        processType: log.process_type || '',
        processTypeOther: log.process_type_other || '',
        workSection: log.work_section || '',
        beforePhotos: [],
        afterPhotos: [],
        beforePhotoPreviews: [],
        afterPhotoPreviews: [],
      }))
    }
    return [
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
    ]
  })

  // Worker entries
  const [workerEntries, setWorkerEntries] = useState<WorkerEntry[]>(() => {
    if (mode === 'edit' && reportData?.worker_entries?.length) {
      return reportData.worker_entries.map((entry: unknown) => ({
        id: entry.id || `worker-${Date.now()}`,
        worker_id: entry.worker_id || '',
        labor_hours: entry.labor_hours || 0,
        worker_name: entry.worker_name || '',
        is_direct_input: entry.is_direct_input || false,
      }))
    }
    return permissions.canManageWorkers
      ? [
          {
            id: `worker-${Date.now()}`,
            worker_id: '',
            labor_hours: 0,
            worker_name: '',
            is_direct_input: false,
          },
        ]
      : []
  })

  // Receipt entries
  const [receiptEntries, setReceiptEntries] = useState<ReceiptEntry[]>(() => {
    if (mode === 'edit' && reportData?.receipts?.length) {
      return reportData.receipts.map((receipt: unknown) => ({
        id: receipt.id || `receipt-${Date.now()}`,
        category: receipt.category || '',
        amount: receipt.amount || '',
        date: receipt.receipt_date || new Date().toISOString().split('T')[0],
        file: null,
        preview: null,
      }))
    }
    return [
      {
        id: `receipt-${Date.now()}`,
        category: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        file: null,
        preview: null,
      },
    ]
  })

  // NPC1000 Material tracking
  const [npc1000Materials, setNpc1000Materials] = useState<MaterialEntry>(() => {
    if (mode === 'edit' && reportData) {
      return {
        incoming: String(reportData.npc1000_incoming || ''),
        used: String(reportData.npc1000_used || ''),
        remaining: String(reportData.npc1000_remaining || ''),
      }
    }
    return {
      incoming: '',
      used: '',
      remaining: '',
    }
  })

  // Additional photos
  const [additionalPhotos, setAdditionalPhotos] = useState<AdditionalPhotoData[]>(() => {
    if (mode === 'edit' && reportData?.additional_photos?.length) {
      return reportData.additional_photos.map((photo: unknown) => ({
        id: photo.id,
        type: photo.photo_type,
        category: photo.category,
        description: photo.description,
        file: null,
        preview: photo.url || null,
        isExisting: true,
      }))
    }
    return []
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

      const submitData = {
        ...formData,
        status: isDraft ? 'draft' : 'submitted',
        npc1000_incoming: Number(npc1000Materials.incoming) || 0,
        npc1000_used: Number(npc1000Materials.used) || 0,
        npc1000_remaining: Number(npc1000Materials.remaining) || 0,
        work_entries: workEntries,
        worker_entries: permissions.canManageWorkers ? workerEntries : [],
        receipt_entries: receiptEntries.filter(r => r.file || mode === 'edit'),
        additional_photos: additionalPhotos,
      }

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
          ok = res.ok
        }
      }

      if (ok) {
        toast.success(`작업일지가 ${isDraft ? '임시저장' : '제출'}되었습니다.`)
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 - Enhanced with unified system branding */}
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
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <Badge className={cn('text-xs font-medium border shadow-sm', getRoleBadgeColor())}>
                  {permissions.roleDisplayName}
                </Badge>
                {mode === 'edit' && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-[#FFDF00] text-[#15347C] border-[#FFDF00]"
                  >
                    편집 모드
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className="text-xs text-[#28BE6E] bg-[rgba(40,190,110,0.12)] border-[#28BE6E] shadow-sm"
                >
                  ✨ 통합 시스템 v2.0
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs text-[#5F7AB9] bg-[rgba(141,160,205,0.15)] border-[#8DA0CD]"
                >
                  동적 옵션 활성화
                </Badge>
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
              {/* Partner Company Selection - Available for all users */}
              <div>
                <Label htmlFor="partner_company_id">소속 파트너사</Label>
                <CustomSelect
                  value={formData.partner_company_id}
                  onValueChange={value =>
                    setFormData(prev => ({
                      ...prev,
                      partner_company_id: value === 'none' ? '' : value,
                      site_id: '', // Reset site selection when partner changes
                    }))
                  }
                >
                  <CustomSelectTrigger>
                    <CustomSelectValue placeholder="파트너사를 선택하세요" />
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    <CustomSelectItem value="none">선택 안함</CustomSelectItem>
                    {partnerCompanies.map(company => (
                      <CustomSelectItem key={company.id} value={company.id}>
                        {company.company_name}
                      </CustomSelectItem>
                    ))}
                  </CustomSelectContent>
                </CustomSelect>
                {loadingPartners && (
                  <p className="text-xs text-gray-500 mt-1">파트너사 목록을 불러오는 중...</p>
                )}
              </div>

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
                          value={entry.worker_id}
                          onValueChange={value => {
                            const newEntries = [...workerEntries]
                            newEntries[index] = {
                              ...newEntries[index],
                              worker_id: value,
                              is_direct_input: false,
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
                      {entry.worker_id === 'direct' && (
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
                        <Label>작업 시간</Label>
                        <Input
                          type="number"
                          value={entry.labor_hours}
                          onChange={e => {
                            const newEntries = [...workerEntries]
                            newEntries[index] = {
                              ...newEntries[index],
                              labor_hours: Number(e.target.value),
                            }
                            setWorkerEntries(newEntries)
                          }}
                          placeholder="작업 시간 (시간 단위)"
                        />
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
                        labor_hours: 0,
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

          {/* Section 4: 자재 현황 (고급 기능) */}
          {permissions.canViewAdvancedFeatures && (
            <CollapsibleSection
              title="자재 현황 (NPC1000)"
              icon={Package}
              isExpanded={expandedSections.materials}
              onToggle={() => toggleSection('materials')}
              managerOnly={true}
              permissions={permissions}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>반입량</Label>
                  <Input
                    type="number"
                    value={npc1000Materials.incoming}
                    onChange={e => {
                      const incoming = e.target.value
                      const used = npc1000Materials.used || '0'
                      const remaining =
                        incoming && used ? String(Number(incoming) - Number(used)) : ''
                      setNpc1000Materials({
                        incoming,
                        used,
                        remaining,
                      })
                    }}
                    placeholder="반입량"
                  />
                </div>
                <div>
                  <Label>사용량</Label>
                  <Input
                    type="number"
                    value={npc1000Materials.used}
                    onChange={e => {
                      const used = e.target.value
                      const incoming = npc1000Materials.incoming || '0'
                      const remaining =
                        incoming && used ? String(Number(incoming) - Number(used)) : ''
                      setNpc1000Materials({
                        incoming: npc1000Materials.incoming,
                        used,
                        remaining,
                      })
                    }}
                    placeholder="사용량"
                  />
                </div>
                <div>
                  <Label>잔량 (자동계산)</Label>
                  <Input
                    type="number"
                    value={npc1000Materials.remaining}
                    onChange={e =>
                      setNpc1000Materials(prev => ({ ...prev, remaining: e.target.value }))
                    }
                    placeholder="잔량 (반입량 - 사용량)"
                    className="bg-gray-50"
                    title="반입량과 사용량을 입력하면 자동으로 계산됩니다. 필요시 수동 입력도 가능합니다."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    반입량 - 사용량 = 잔량 (자동계산, 수동입력 가능)
                  </p>
                </div>
              </div>
            </CollapsibleSection>
          )}

          {/* Section 5: 영수증 */}
          <CollapsibleSection
            title="영수증"
            icon={Receipt}
            isExpanded={expandedSections.receipts}
            onToggle={() => toggleSection('receipts')}
            permissions={permissions}
            badge={
              <Badge variant="outline">
                {receiptEntries.filter(r => r.file || r.category).length}개
              </Badge>
            }
          >
            <div className="space-y-4">
              {receiptEntries.map((entry, index) => (
                <div key={entry.id} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">영수증 #{index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReceiptEntries(prev => prev.filter((_, i) => i !== index))
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>구분</Label>
                      <Input
                        value={entry.category}
                        onChange={e => {
                          const newEntries = [...receiptEntries]
                          newEntries[index] = { ...newEntries[index], category: e.target.value }
                          setReceiptEntries(newEntries)
                        }}
                        placeholder="예: 식비, 자재비"
                      />
                    </div>
                    <div>
                      <Label>금액</Label>
                      <Input
                        value={entry.amount}
                        onChange={e => {
                          const newEntries = [...receiptEntries]
                          newEntries[index] = { ...newEntries[index], amount: e.target.value }
                          setReceiptEntries(newEntries)
                        }}
                        placeholder="금액"
                      />
                    </div>
                    <div>
                      <Label>일자</Label>
                      <Input
                        type="date"
                        value={entry.date}
                        onChange={e => {
                          const newEntries = [...receiptEntries]
                          newEntries[index] = { ...newEntries[index], date: e.target.value }
                          setReceiptEntries(newEntries)
                        }}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label>파일 첨부</Label>
                    <Input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const newEntries = [...receiptEntries]
                          newEntries[index] = { ...newEntries[index], file }
                          setReceiptEntries(newEntries)
                        }
                      }}
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setReceiptEntries(prev => [
                    ...prev,
                    {
                      id: `receipt-${Date.now()}`,
                      category: '',
                      amount: '',
                      date: new Date().toISOString().split('T')[0],
                      file: null,
                      preview: null,
                    },
                  ])
                }}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                영수증 추가
              </Button>
            </div>
          </CollapsibleSection>

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

          {/* Section 8: 특이사항 */}
          <CollapsibleSection
            title="특이사항 / 이슈"
            icon={AlertCircle}
            isExpanded={expandedSections.specialNotes}
            onToggle={() => toggleSection('specialNotes')}
            permissions={permissions}
          >
            <div>
              <Label>특이사항</Label>
              <Textarea
                value={formData.issues || ''}
                onChange={e => setFormData(prev => ({ ...prev, issues: e.target.value }))}
                placeholder="특이사항이나 이슈사항을 입력하세요"
                rows={4}
              />
            </div>
          </CollapsibleSection>

          {/* Section 9: 관리자 전용 기능 */}
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
                    <Input
                      value={formData.created_by || ''}
                      onChange={e => setFormData(prev => ({ ...prev, created_by: e.target.value }))}
                      placeholder="작성자 이름"
                      className="border-[#8DA0CD] focus:border-[#5F7AB9]"
                    />
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
                </div>
              </div>
            </CollapsibleSection>
          )}
        </div>

        {/* Submit Buttons - Enhanced with role-based styling */}
        <div className="mt-8 bg-white p-6 rounded-lg border shadow-sm">
          {/* Action Summary */}
          <div className="mb-4 p-3 bg-[#F3F7FA] dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    permissions.isAdmin
                      ? 'bg-[#1B419C]'
                      : permissions.isSiteManager
                        ? 'bg-[#E62C00]'
                        : 'bg-[#5F7AB9]'
                  )}
                />
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {mode === 'create' ? '새 작업일지 작성' : '작업일지 편집'} -{' '}
                  {permissions.roleDisplayName}
                </span>
              </div>
              <Badge variant="outline" className="text-xs">
                통합 시스템
              </Badge>
            </div>
          </div>

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
              <Save className="h-4 w-4 mr-2" />
              {loading && loadingType === 'draft' ? '저장 중...' : '임시저장'}
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
              <Send className="h-4 w-4 mr-2" />
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
