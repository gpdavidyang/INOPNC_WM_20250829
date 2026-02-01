'use client'

import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectValue,
  PhSelectTrigger,
} from '@/components/ui/custom-select'
import { useUnifiedAuth } from '@/hooks/use-unified-auth'
import { calculateWorkerCount } from '@/lib/labor/labor-hour-options'
import { MobileLayout as MobileLayoutShell } from '@/modules/mobile/components/layout/MobileLayout'
import { PartnerMobileLayout } from '@/modules/mobile/components/layout/PartnerMobileLayout'
import { UncompletedBottomSheet } from '@/modules/mobile/components/work-log/UncompletedBottomSheet'
import { WorkLogModal } from '@/modules/mobile/components/work-log/WorkLogModal'
import { DiaryDetailViewer } from '@/modules/mobile/components/worklogs'
import { useWorkLogs } from '@/modules/mobile/hooks/use-work-logs'
import '@/modules/mobile/styles/attendance.css'
import '@/modules/mobile/styles/partner.css'
import {
  type MaterialUsageEntry,
  type WorkerHours,
  WorkLog,
  WorkLogTabStatus,
} from '@/modules/mobile/types/work-log.types'
import { dismissAlert, formatDate } from '@/modules/mobile/utils/work-log-utils'
import type { WorklogAttachment, WorklogDetail } from '@/types/worklog'
import { Search as SearchIcon } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
const SECTION_PREVIEW_COUNT = 5

const normalizeWorkerNames = (workLog: WorkLog): string[] => {
  const names = new Set<string>()
  const append = (value?: string | null) => {
    if (!value) return
    const trimmed = value.trim()
    if (!trimmed) return
    names.add(trimmed)
  }

  workLog.workers?.forEach(worker => append(worker?.name))
  if (names.size === 0) {
    append(workLog.author && workLog.author !== '알 수 없는 작성자' ? workLog.author : '')
  }

  return Array.from(names)
}

const formatDateWithWeekday = (date: string) => {
  const formatted = formatDate(date)
  const weekday = WEEKDAY_LABELS[new Date(date).getDay()]
  return `${formatted}(${weekday})`
}

export const WorkLogHomePage: React.FC = () => {
  const { profile } = useUnifiedAuth()
  const readOnly = profile?.role === 'partner' || profile?.role === 'customer_manager'
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const getPartnerAbbr = (raw?: string | null): string => {
    if (!raw) return ''
    let s = String(raw)
      .trim()
      .replace(/^\s*(주식회사|\(주\)|㈜|유한회사|\(유\))\s*/g, '') // 법인 접두 제거
      .replace(/[\s\-_.·'"\[\]\(\){}<>]/g, '') // 공백/특수문자 제거

    // 법인/업종 접미 제거 (여러 번 등장해도 안전하게 제거)
    const suffixes = [
      '종합건설',
      '엔지니어링',
      '건설',
      '산업개발',
      '산업',
      '개발',
      '기술',
      '테크',
      '그룹',
      '홀딩스',
      '코퍼레이션',
      '주식회사',
      '유한회사',
      '㈜',
      '(주)',
      '(유)',
    ]

    let removed = true
    while (removed && s.length > 0) {
      removed = false
      for (const suf of suffixes) {
        if (s.endsWith(suf)) {
          s = s.slice(0, s.length - suf.length)
          removed = true
        }
      }
    }

    if (!s) return ''
    const units = Array.from(s)
    let abbr = units.slice(0, 2).join('')

    // 약어 길이 2자 강제 유지
    if (abbr.length === 1) abbr = abbr + abbr
    if (abbr.length === 0) return ''

    // 영문은 대문자로
    if (/^[A-Za-z]+$/.test(abbr)) return abbr.toUpperCase()
    return abbr
  }
  const [activeTab, setActiveTab] = useState<WorkLogTabStatus>(readOnly ? 'approved' : 'draft')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWorkLog, setEditingWorkLog] = useState<WorkLog | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [isDetailOpen, setDetailOpen] = useState(false)
  const [detailData, setDetailData] = useState<WorklogDetail | null>(null)
  const [detailSourceWorkLog, setDetailSourceWorkLog] = useState<WorkLog | null>(null)
  const [pendingDraft, setPendingDraft] = useState<WorkLog | null>(null)
  const [isDraftSheetOpen, setDraftSheetOpen] = useState(false)
  const [partnerSiteOptions, setPartnerSiteOptions] = useState<
    Array<{ value: string; label: string }>
  >([])

  const {
    workLogs,
    draftWorkLogs,
    approvedWorkLogs,
    uncompletedByMonth,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    createWorkLog,
    updateWorkLog,
    deleteWorkLog,
    approveWorkLog,
  } = useWorkLogs()

  // v3 목록/상세(레퍼런스) 관련 구현은 요구 범위 외로 제외

  const draftCount = draftWorkLogs.length
  const approvedCount = approvedWorkLogs.length

  const PERIOD_OPTIONS = useMemo(
    () => [
      { id: 'all', label: '전체 기간', months: null as number | null },
      { id: '3m', label: '최근 3개월', months: 3 },
      { id: '6m', label: '최근 6개월', months: 6 },
      { id: '12m', label: '최근 12개월', months: 12 },
    ],
    []
  )

  // 파트너/고객담당자: 모든 권한 있는 현장 목록을 별도 로드해 드롭다운에 노출
  useEffect(() => {
    if (!readOnly) return

    const controller = new AbortController()
    let alive = true

    const loadPartnerSites = async () => {
      try {
        const res = await fetch('/api/partner/sites?limit=200', {
          cache: 'no-store',
          signal: controller.signal,
        })
        const json = await res.json().catch(() => null)
        const list = Array.isArray(json?.data?.sites) ? json.data.sites : []
        const options = list
          .map((site: any) => ({
            value: String(site?.id || ''),
            label: String(site?.name || '').trim() || '현장',
          }))
          .filter(option => option.value)

        if (alive) {
          setPartnerSiteOptions(options)
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') return
        console.warn('[WorkLogHome] partner sites load failed:', e)
      }
    }

    void loadPartnerSites()

    return () => {
      alive = false
      controller.abort()
    }
  }, [readOnly])

  const logSiteOptions = useMemo(() => {
    const map = new Map<string, string>([['all', '전체 현장']])
    ;[...draftWorkLogs, ...approvedWorkLogs].forEach(log => {
      if (log.siteId && log.siteName && !map.has(log.siteId)) {
        map.set(log.siteId, log.siteName)
      }
    })
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  }, [draftWorkLogs, approvedWorkLogs])

  const siteOptions = useMemo(() => {
    const map = new Map<string, string>([['all', '전체 현장']])
    const addOptions = (options: Array<{ value: string; label: string }>) => {
      options.forEach(option => {
        if (!option.value) return
        const label = option.label?.trim() || '현장'
        if (!map.has(option.value)) map.set(option.value, label)
      })
    }

    addOptions(partnerSiteOptions)
    addOptions(logSiteOptions)

    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  }, [logSiteOptions, partnerSiteOptions])

  const [visibleCounts, setVisibleCounts] = useState<{ draft: number; approved: number }>({
    draft: 10,
    approved: 10,
  })
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  const [visibleUncompleted, setVisibleUncompleted] = useState(uncompletedByMonth)
  useEffect(() => {
    setVisibleUncompleted(uncompletedByMonth)
  }, [uncompletedByMonth])

  const [isUncompletedSheetOpen, setUncompletedSheetOpen] = useState(false)
  useEffect(() => {
    setUncompletedSheetOpen(visibleUncompleted.length > 0)
  }, [visibleUncompleted])

  const handleDismissMonth = useCallback((month: string) => {
    dismissAlert(month)
    setVisibleUncompleted(prev => prev.filter(item => item.month !== month))
  }, [])

  const applyMonthFilter = useCallback(
    (month: string) => {
      const [yearStr, monthStr] = month.split('-')
      const year = Number(yearStr)
      const monthIndex = Number(monthStr) - 1

      if (Number.isNaN(year) || Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
        return
      }

      const format = (y: number, m: number, d: number) =>
        `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`

      const startDay = 1
      const endDay = new Date(year, monthIndex + 1, 0).getDate()

      setFilter(prev => ({
        ...prev,
        status: 'draft',
        dateFrom: format(year, monthIndex + 1, startDay),
        dateTo: format(year, monthIndex + 1, endDay),
      }))
    },
    [setFilter]
  )

  const handleNavigateToMonth = useCallback(
    (_month: string) => {
      applyMonthFilter(_month)
      setActiveTab(readOnly ? 'approved' : 'draft')
      setUncompletedSheetOpen(false)
    },
    [applyMonthFilter, readOnly]
  )

  const filterStatus = filter.status
  const filterSiteId = filter.siteId
  const filterDateFrom = filter.dateFrom
  const filterDateTo = filter.dateTo

  // Partner/customer: force approved tab (hide draft entirely)
  useEffect(() => {
    if (readOnly && activeTab !== 'approved') {
      setActiveTab('approved')
    }
  }, [readOnly, activeTab])

  useEffect(() => {
    if (filterStatus !== activeTab) {
      setFilter(prev => ({ ...prev, status: activeTab }))
    }
  }, [activeTab, filterStatus, setFilter])

  useEffect(() => {
    if (!filterSiteId) return
    if (!siteOptions.some(option => option.value === filterSiteId)) {
      setFilter(prev => ({ ...prev, siteId: undefined }))
    }
  }, [filterSiteId, siteOptions, setFilter])

  const selectedSite = useMemo(() => {
    if (filterSiteId && siteOptions.some(option => option.value === filterSiteId)) {
      return filterSiteId
    }
    return 'all'
  }, [filterSiteId, siteOptions])

  const selectedPeriod = useMemo(() => {
    if (!filterDateFrom || !filterDateTo) return 'all'

    const fromDate = new Date(filterDateFrom)
    const toDate = new Date(filterDateTo)
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return 'all'

    const diffMonths =
      (toDate.getFullYear() - fromDate.getFullYear()) * 12 +
      (toDate.getMonth() - fromDate.getMonth()) +
      1

    const matching = PERIOD_OPTIONS.find(option => option.months === diffMonths)
    return matching ? matching.id : 'custom'
  }, [PERIOD_OPTIONS, filterDateFrom, filterDateTo])

  const selectedSiteLabel = useMemo(
    () => siteOptions.find(o => o.value === selectedSite)?.label || '현장 선택',
    [selectedSite, siteOptions]
  )

  const selectedPeriodLabel = useMemo(() => {
    const labelMap: Record<string, string> = {
      all: '전체 기간',
      '3m': '최근 3개월',
      '6m': '최근 6개월',
      '12m': '최근 12개월',
      custom:
        filterDateFrom && filterDateTo
          ? (() => {
              const y = filterDateFrom.slice(0, 4)
              const m = filterDateFrom.slice(5, 7)
              return `${y}.${m}`
            })()
          : '선택된 기간',
    }

    return labelMap[selectedPeriod] || '기간 선택'
  }, [filterDateFrom, filterDateTo, selectedPeriod])

  const handleCreateWorkLog = useCallback(() => {
    if (readOnly) return
    setEditingWorkLog(null)
    setModalMode('create')
    setIsModalOpen(true)
  }, [readOnly])

  const handleEditWorkLog = useCallback((workLog: WorkLog) => {
    setEditingWorkLog(workLog)
    setModalMode('edit')
    setIsModalOpen(true)
  }, [])

  useEffect(() => {
    if (!searchParams) return
    const editId = searchParams.get('edit')
    if (!editId) return
    const target =
      draftWorkLogs.find(log => String(log.id) === editId) ||
      approvedWorkLogs.find(log => String(log.id) === editId) ||
      workLogs.find(log => String(log.id) === editId)

    if (target) {
      handleEditWorkLog(target)
      router.replace(pathname || '/mobile/worklog', { scroll: false })
    } else if (!loading) {
      router.replace(pathname || '/mobile/worklog', { scroll: false })
    }
  }, [
    searchParams,
    draftWorkLogs,
    approvedWorkLogs,
    workLogs,
    handleEditWorkLog,
    router,
    pathname,
    loading,
  ])

  const handleViewWorkLog = useCallback((workLog: WorkLog) => {
    // Draft → 안내 바텀시트 먼저 표시
    if (workLog.status === 'draft') {
      setPendingDraft(workLog)
      setDraftSheetOpen(true)
      return
    }
    // 새 상세 뷰어로 표시 (시안 일치)
    const mapFile = (
      file: any,
      type: 'photo' | 'drawing' | 'document',
      category: WorklogAttachment['category']
    ): WorklogAttachment => ({
      id: String(file?.id ?? file?.url ?? Math.random()),
      name: String(file?.name ?? '파일'),
      type,
      category,
      previewUrl: file?.url,
      fileUrl: file?.url,
    })

    const photos = (workLog.attachments?.photos || []).map(f => mapFile(f, 'photo', 'other'))
    const drawings = (workLog.attachments?.drawings || []).map(f =>
      mapFile(f, 'document', 'markup')
    )
    const completionDocs = (workLog.attachments?.confirmations || []).map(f =>
      mapFile(f, 'document', 'completion')
    )

    const manpower = Number(workLog.totalHours || 0) / 8
    const workerNames = normalizeWorkerNames(workLog)
    const detail: WorklogDetail = {
      id: workLog.id,
      siteId: workLog.siteId,
      siteName: workLog.siteName,
      workDate: workLog.date,
      memberTypes: workLog.memberTypes as any,
      processes: workLog.workProcesses as any,
      workTypes: workLog.workTypes as any,
      manpower: isNaN(manpower) ? 0 : manpower,
      workers: calculateWorkerCount(manpower) || (workLog as any).totalWorkers || 0,
      status: workLog.status,
      attachmentCounts: {
        photos: photos.length,
        drawings: drawings.length,
        completionDocs: completionDocs.length,
        others: 0,
      },
      createdBy: {
        id: workLog.createdBy || 'unknown',
        name: workLog.author || '작성자',
      },
      updatedAt: workLog.updatedAt || workLog.createdAt || new Date().toISOString(),
      siteAddress: workLog.siteAddress,
      location: {
        block: workLog.location?.block || '',
        dong: workLog.location?.dong || '',
        unit: workLog.location?.unit || '',
      },
      rejectionReason: workLog.rejection_reason || (workLog as any).rejectionReason || '',
      notes: workLog.notes,

      materials: (workLog.materials || []).map(m => ({
        material_name: m.material_name,
        material_code: m.material_code,
        quantity: m.quantity || 0,
        quantity_val: (m as any).quantity_val,
        amount: (m as any).amount,
        unit: m.unit,
        notes: m.notes,
      })),
      // 확장: 작업 세트 묶음을 전달(상세뷰에서 사용)
      tasks: (workLog as any).tasks || undefined,
      safetyNotes: undefined,
      additionalManpower: [],
      workerNames,
      attachments: {
        photos,
        drawings,
        completionDocs,
        others: [],
      },
      createdBy: workLog.createdBy
        ? {
            id: typeof workLog.createdBy === 'object' ? workLog.createdBy.id : workLog.createdBy,
            name:
              typeof workLog.createdBy === 'object'
                ? workLog.createdBy.full_name || workLog.createdBy.name || '작성자'
                : workLog.author || '작성자',
          }
        : { id: 'unknown', name: workLog.author || '작성자' },
    }

    setDetailData(detail)
    setDetailOpen(true)
    setDetailSourceWorkLog(workLog)
  }, [])

  const detailToWorkLog = useCallback((detail: WorklogDetail): WorkLog => {
    const attachmentTimestamp = detail.updatedAt || new Date().toISOString()
    const toAttachment = (attachments: WorklogAttachment[]) =>
      attachments.map(attachment => ({
        id: attachment.id,
        url: attachment.fileUrl || attachment.previewUrl || '',
        name: attachment.name || '파일',
        size: 0,
        uploadedAt: attachmentTimestamp,
        uploadedBy: detail.createdBy?.name,
      }))

    const workerEntries: WorkerHours[] =
      detail.additionalManpower && detail.additionalManpower.length > 0
        ? detail.additionalManpower.map(worker => ({
            id: worker.id || `worker-${worker.name || 'unknown'}`,
            name: worker.name || '작업자',
            hours: Number(worker.manpower || 0) * 8,
          }))
        : (detail.workerNames || []).map((name, index) => ({
            id: `worker-${index}`,
            name,
            hours: 0,
          }))

    const materials: MaterialUsageEntry[] = (detail.materials || []).map((material, index) => ({
      material_id: material.material_code || `${detail.id}-material-${index}`,
      material_name: material.material_name || '자재',
      material_code: material.material_code || null,
      quantity: Number(material.quantity ?? 0),
      unit: material.unit || null,
      notes: material.notes || null,
    }))

    return {
      id: detail.id,
      date: detail.workDate,
      siteId: detail.siteId,
      siteName: detail.siteName,
      siteAddress: detail.siteAddress,
      status: detail.status as WorkLog['status'],
      memberTypes: detail.memberTypes as any,
      workProcesses: detail.processes as any,
      workTypes: detail.workTypes as any,
      location: {
        block: detail.location?.block || '',
        dong: detail.location?.dong || '',
        unit: detail.location?.unit || '',
      },
      workers: workerEntries,
      totalHours: Number(detail.manpower || 0) * 8,
      materials,
      attachments: {
        photos: toAttachment(detail.attachments.photos),
        drawings: toAttachment(detail.attachments.drawings),
        confirmations: toAttachment(detail.attachments.completionDocs),
      },
      progress: 0,
      notes: detail.notes || '',
      description: detail.notes || '',
      summary: detail.workTypes.join(', '),
      title: detail.memberTypes.join(', '),
      author: detail.createdBy?.name || '작성자',
      createdBy: detail.createdBy?.id || 'unknown',
      createdAt: detail.updatedAt || attachmentTimestamp,
      updatedAt: detail.updatedAt || attachmentTimestamp,
      partnerCompanyName: '',
      organizationId: '',
    }
  }, [])

  const buildWorklogPrefill = useCallback((workLog: WorkLog) => {
    const additionalManpower =
      (workLog.workers || []).map((worker, index) => ({
        id: `prefill-${index}-${Date.now()}`,
        workerId: worker.id || '',
        workerName: worker.name,
        manpower: Number(worker.hours || 0) / 8 || 0,
      })) || []
    const additionalTotal = additionalManpower.reduce(
      (sum, worker) => sum + (Number(worker.manpower) || 0),
      0
    )
    const estimatedMain =
      Number(workLog.totalHours || 0) / 8 - (Number.isFinite(additionalTotal) ? additionalTotal : 0)
    const mainManpower = estimatedMain > 0 && Number.isFinite(estimatedMain) ? estimatedMain : 1

    return {
      siteId: workLog.siteId,
      workDate: workLog.date,
      department: workLog.organizationId || '',
      location: workLog.location || { block: '', dong: '', unit: '' },
      memberTypes: workLog.memberTypes || [],
      workProcesses: workLog.workProcesses || [],
      workTypes: workLog.workTypes || [],
      mainManpower,
      materials:
        (workLog.materials || []).map(material => {
          const quantityVal =
            (material as any).quantity_val ??
            (material as any).amount ??
            (material as any).quantity ??
            0
          return {
            material_id: material.material_id || null,
            material_name: material.material_name || '',
            material_code: material.material_code || material.material_id || null,
            quantity: Number.isFinite(Number(quantityVal)) ? Number(quantityVal) : 0,
            quantity_val: Number.isFinite(Number(quantityVal)) ? Number(quantityVal) : 0,
            amount: Number.isFinite(Number(quantityVal)) ? Number(quantityVal) : 0,
            unit: material.unit || '',
            notes: material.notes || '',
          }
        }) || [],
      additionalManpower,
      tasks:
        (workLog.tasks || []).map((task: any) => ({
          memberTypes: task.memberTypes || [],
          processes: task.workProcesses || task.processes || [],
          workTypes: task.workTypes || [],
          location: task.location || { block: '', dong: '', unit: '' },
        })) || [],
    }
  }, [])

  const openPrefillAndNavigate = useCallback(
    (workLog: WorkLog) => {
      const prefill = buildWorklogPrefill(workLog)
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('worklog_prefill', JSON.stringify(prefill))
        }
      } catch {
        /* ignore storage errors */
      }
      router.push('/mobile')
    },
    [buildWorklogPrefill, router]
  )

  const handleDetailEdit = useCallback(
    (detail: WorklogDetail) => {
      if (readOnly) return
      const matchFromSource =
        detailSourceWorkLog && detailSourceWorkLog.id === detail.id ? detailSourceWorkLog : null
      const fallbackMatch =
        draftWorkLogs.find(log => String(log.id) === detail.id) ||
        approvedWorkLogs.find(log => String(log.id) === detail.id)
      const target = matchFromSource || fallbackMatch || detailToWorkLog(detail)
      setDetailOpen(false)
      setDetailSourceWorkLog(null)
      openPrefillAndNavigate(target)
    },
    [
      readOnly,
      detailSourceWorkLog,
      draftWorkLogs,
      approvedWorkLogs,
      detailToWorkLog,
      openPrefillAndNavigate,
    ]
  )

  const proceedOpenDraft = useCallback(() => {
    const workLog = pendingDraft
    if (!workLog) return
    openPrefillAndNavigate(workLog)
    setDraftSheetOpen(false)
  }, [pendingDraft, openPrefillAndNavigate])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setEditingWorkLog(null)
  }, [])

  const handleSaveWorkLog = useCallback(
    async (formData: Partial<WorkLog>) => {
      const attachments =
        formData.attachments ||
        ({ photos: [], drawings: [], confirmations: [] } as WorkLog['attachments'])

      const payload = {
        date: formData.date!,
        siteId: formData.siteId!,
        siteName: formData.siteName || '',
        memberTypes: formData.memberTypes || [],
        workProcesses: formData.workProcesses || [],
        workTypes: formData.workTypes || [],
        location: formData.location!,
        workers: formData.workers || [],
        materials: formData.materials || [],
        progress: formData.progress ?? 0,
        notes: formData.notes,
        tasks: (formData as any).tasks || undefined,
        attachments,
        status: formData.status,
      }

      try {
        if (editingWorkLog) {
          await updateWorkLog(editingWorkLog.id, payload)

          if (payload.status === 'submitted') {
            await approveWorkLog(editingWorkLog.id)
          }
        } else {
          const createdWorkLog = await createWorkLog(payload)

          if (payload.status === 'submitted' && createdWorkLog.status !== 'submitted') {
            await approveWorkLog(createdWorkLog.id)
          }
        }
      } catch (err) {
        console.error('작업일지 저장 실패:', err)
        throw err
      }
    },
    [createWorkLog, updateWorkLog, approveWorkLog, editingWorkLog]
  )

  const handleSubmitWorkLog = useCallback(
    async (workLogId: string) => {
      try {
        await approveWorkLog(workLogId)
      } catch (err) {
        console.error('작업일지 제출 실패:', err)
      }
    },
    [approveWorkLog]
  )

  const handleDeleteWorkLog = useCallback(
    async (workLogId: string) => {
      try {
        await deleteWorkLog(workLogId)
      } catch (err) {
        console.error('작업일지 삭제 실패:', err)
      }
    },
    [deleteWorkLog]
  )

  const handleSiteChange = useCallback(
    (value: string) => {
      setFilter(prev => ({ ...prev, siteId: value === 'all' ? undefined : value }))
    },
    [setFilter]
  )

  const handlePeriodChange = useCallback(
    (value: string) => {
      if (value === 'custom') return

      if (value === 'all') {
        setFilter(prev => ({ ...prev, dateFrom: undefined, dateTo: undefined }))
        return
      }

      const option = PERIOD_OPTIONS.find(item => item.id === value)
      if (!option || option.months === null) return

      const end = new Date()
      const start = new Date()
      start.setMonth(start.getMonth() - (option.months - 1))

      const format = (date: Date) => date.toISOString().split('T')[0]

      const nextDateFrom = format(start)
      const nextDateTo = format(end)

      setFilter(prev => ({
        ...prev,
        dateFrom: nextDateFrom,
        dateTo: nextDateTo,
      }))
    },
    [PERIOD_OPTIONS, setFilter]
  )

  useEffect(() => {
    setVisibleCounts(prev => {
      let nextDraft = prev.draft
      let nextApproved = prev.approved

      if (draftWorkLogs.length > 0 && prev.draft > draftWorkLogs.length) {
        nextDraft = draftWorkLogs.length
      }

      if (approvedWorkLogs.length > 0 && prev.approved > approvedWorkLogs.length) {
        nextApproved = approvedWorkLogs.length
      }

      if (nextDraft === prev.draft && nextApproved === prev.approved) {
        return prev
      }

      return { draft: nextDraft, approved: nextApproved }
    })
  }, [draftWorkLogs.length, approvedWorkLogs.length])

  useEffect(() => {
    setVisibleCounts(prev => ({
      ...prev,
      [activeTab]: 10,
    }))
  }, [activeTab])

  const toggleSectionCollapse = useCallback((key: string, current: boolean) => {
    setCollapsedSections(prev => ({
      ...prev,
      [key]: !current,
    }))
  }, [])

  const renderWorkLogItems = (workLogs: WorkLog[]) => (
    <div className="task-diary-list">
      {workLogs.map(workLog => {
        const normalize = (value?: any) =>
          typeof value === 'string' ? value.trim() : String(value || '').trim()
        const isSameAsSite = (value: string) =>
          normalize(value).replace(/\s+/g, '') === normalize(workLog.siteName).replace(/\s+/g, '')

        const locations = [
          workLog.location?.block ? `${workLog.location.block}블록` : '',
          workLog.location?.dong ? `${workLog.location.dong}동` : '',
          workLog.location?.unit ? `${workLog.location.unit}층` : '',
        ]
          .filter(Boolean)
          .join(' ')

        const contentParts = [
          // 1. 작업 내용 (부재명, 공정, 유형 등)
          (() => {
            const parts: string[] = []
            if (Array.isArray(workLog.memberTypes) && workLog.memberTypes.length > 0)
              parts.push(...workLog.memberTypes)
            if (Array.isArray(workLog.workProcesses) && workLog.workProcesses.length > 0)
              parts.push(...workLog.workProcesses)
            if (Array.isArray(workLog.workTypes) && workLog.workTypes.length > 0)
              parts.push(...workLog.workTypes)
            return parts.join(', ')
          })(),
          // 2. 위치 정보
          locations,
          // 3. (없으면) 작업 개요/비고 등
          !workLog.memberTypes?.length &&
          !workLog.workProcesses?.length &&
          !workLog.workTypes?.length
            ? normalize(workLog.description || workLog.notes || workLog.summary || workLog.title)
            : '',
        ]
          .map(normalize)
          .filter(Boolean)

        let subtitle = contentParts.length > 0 ? contentParts.join(' · ') : '작업내용 미입력'

        const workerNames = normalizeWorkerNames(workLog).map(normalize).filter(Boolean)
        const workerLabel =
          workerNames.length === 0
            ? ''
            : workerNames.length === 1
              ? workerNames[0]
              : `${workerNames[0]} 외 ${workerNames.length - 1}명`

        if (workerLabel) {
          subtitle = `${subtitle} / ${workerLabel}`
        }

        const formattedDate = formatDateWithWeekday(workLog.date)
        const hasLinkedMarkup = (workLog.attachments?.drawings || []).some(file => {
          const meta =
            file && typeof (file as any).metadata === 'object' ? (file as any).metadata : null
          if (
            meta &&
            (typeof meta.markup_document_id === 'string' ||
              typeof meta.linked_worklog_id === 'string')
          ) {
            return true
          }
          return Boolean(
            file?.id &&
              (file.id.startsWith('markup-') ||
                file.id.startsWith('linked-') ||
                file.id.startsWith('drawing-'))
          )
        })

        const handleRowClick = () => {
          if (readOnly) {
            try {
              const seed = encodeURIComponent(btoa(JSON.stringify(workLog)))
              router.push(`/mobile/worklog/${workLog.id}?seed=${seed}`)
            } catch {
              router.push(`/mobile/worklog/${workLog.id}`)
            }
            return
          }
          handleViewWorkLog(workLog)
        }

        return (
          <button
            key={workLog.id}
            type="button"
            className="task-diary-list-item"
            onClick={handleRowClick}
          >
            <div className="task-diary-info">
              <div className="task-diary-site">
                {(() => {
                  const abbr = getPartnerAbbr(workLog.partnerCompanyName)
                  return abbr ? `[${abbr}] ${workLog.siteName}` : workLog.siteName
                })()}
              </div>
              <div className="task-diary-work">{subtitle}</div>
              {workLog.status === 'rejected' && workLog.rejectionReason && (
                <div className="task-diary-rejection mt-1 pt-1 border-t border-red-50 border-dotted text-[13px] text-red-600 font-medium">
                  <span className="opacity-70 mr-1">반려 사유:</span>
                  {workLog.rejectionReason}
                </div>
              )}
            </div>
            <div className="task-diary-right">
              <span className={`status-badge ${workLog.status}`}>
                {workLog.status === 'draft'
                  ? '임시'
                  : workLog.status === 'submitted'
                    ? '제출'
                    : workLog.status === 'approved'
                      ? '승인'
                      : '반려'}
              </span>
              {hasLinkedMarkup && <span className="markup-badge">도면 연결</span>}
              <span className="task-diary-date">{formattedDate}</span>
            </div>
          </button>
        )
      })}
    </div>
  )

  const renderApprovedSections = (logs: WorkLog[]) => {
    const sorted = [...logs].sort((a, b) => {
      const da = new Date(a.date)
      const db = new Date(b.date)
      return db.getTime() - da.getTime()
    })
    const sectionsMap = new Map<
      string,
      {
        key: string
        label: string
        logs: WorkLog[]
      }
    >()

    sorted.forEach(log => {
      const date = new Date(log.date)
      const isValid = !Number.isNaN(date.getTime())
      const month = isValid ? date.getMonth() + 1 : null
      const year = isValid ? date.getFullYear() : null
      const key = isValid ? `${year}-${String(month).padStart(2, '0')}` : 'invalid'
      const label = isValid ? `${year}년 ${month}월` : '기간 미지정'

      if (!sectionsMap.has(key)) {
        sectionsMap.set(key, { key, label, logs: [] })
      }
      sectionsMap.get(key)!.logs.push(log)
    })

    const sections = Array.from(sectionsMap.values()).sort((a, b) => {
      if (a.key === 'invalid') return 1
      if (b.key === 'invalid') return -1
      return a.key < b.key ? 1 : -1
    })

    return (
      <div className="worklog-section-group">
        {sections.map(section => {
          const canToggle = section.logs.length > SECTION_PREVIEW_COUNT
          const collapsed = collapsedSections[section.key] ?? true
          const logsToShow =
            canToggle && collapsed ? section.logs.slice(0, SECTION_PREVIEW_COUNT) : section.logs

          return (
            <div key={section.key} className="worklog-section">
              <div className="worklog-section-header">
                <div className="worklog-section-title">{section.label}</div>
                {canToggle && (
                  <button
                    type="button"
                    className="section-toggle"
                    onClick={() => toggleSectionCollapse(section.key, collapsed)}
                  >
                    {collapsed ? '더보기' : '접기'}
                  </button>
                )}
              </div>
              {renderWorkLogItems(logsToShow)}
              {canToggle && collapsed && (
                <div className="worklog-section-hint">
                  전체 {section.logs.length}건 중{' '}
                  {Math.min(SECTION_PREVIEW_COUNT, section.logs.length)}건 표시
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderWorkLogList = (logs: WorkLog[], tab: WorkLogTabStatus) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12 text-sm text-[#667085]">
          작업일지를 불러오는 중...
        </div>
      )
    }

    if (error) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )
    }

    if (logs.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f0f4ff] text-2xl">
            📄
          </div>
          <p className="text-base font-semibold text-[#1A254F]">
            {readOnly
              ? '표시할 작업일지가 없습니다.'
              : tab === 'draft'
                ? '임시 상태 작업일지가 없습니다.'
                : '제출, 승인 또는 반려된 작업일지가 없습니다.'}
          </p>
          <p className="mt-2 text-sm text-[#667085]">
            {readOnly
              ? '파트너 전용 조회 화면입니다.'
              : tab === 'draft'
                ? '새로운 작업일지를 작성해보세요.'
                : '임시 상태를 제출로 전환해보세요.'}
          </p>
        </div>
      )
    }

    if (tab === 'approved') {
      return renderApprovedSections(logs)
    }

    const visibleCount = visibleCounts[tab]
    const displayedLogs = logs.slice(0, visibleCount)
    const hasMore = logs.length > visibleCount

    return (
      <>
        {renderWorkLogItems(displayedLogs)}
        {hasMore && (
          <div className="more-button-container">
            <button
              type="button"
              className="more-btn"
              onClick={() =>
                setVisibleCounts(prev => ({
                  ...prev,
                  [tab]: prev[tab] + 10,
                }))
              }
            >
              더보기
            </button>
          </div>
        )}
      </>
    )
  }

  // Monthly summary cards (좌측 시안의 하단 요약 블록)
  const monthlyStats = useMemo(() => {
    const uniqueSites = new Set<string>()
    const uniqueDates = new Set<string>()
    let totalHours = 0

    approvedWorkLogs.forEach(log => {
      if (log.siteId) uniqueSites.add(log.siteId)
      if (log.date) uniqueDates.add(log.date)
      totalHours += Number(log.totalHours || 0)
    })

    const totalManDays = Math.ceil(totalHours / 8)

    return {
      siteCount: uniqueSites.size,
      manDays: totalManDays,
      attendanceDays: uniqueDates.size,
    }
  }, [approvedWorkLogs])

  const LayoutShell = readOnly ? PartnerMobileLayout : MobileLayoutShell
  const worklogBodyClassName = readOnly
    ? 'main-container worklog-body'
    : 'main-container worklog-body spacious'
  return (
    <LayoutShell>
      <div className="worklog-page">
        <style jsx global>{`
          :root {
            --brand: #1a254f;
            --num: #0068fe;
            --bg: #f6f9ff;
            --card: #ffffff;
            --text: #101828;
            --muted: #667085;
            --border: #e0e0e0;
            --shadow: 0 6px 20px rgba(16, 24, 40, 0.06);
          }

          [data-theme='dark'] {
            --bg: #0f172a; /* slate-900 */
            --card: #1e293b; /* slate-800 */
            --text: #e2e8f0; /* slate-200 */
            --muted: #94a3b8; /* slate-400 */
            --border: #334155; /* slate-700 */
          }

          .worklog-page {
            font-family:
              'Noto Sans KR',
              system-ui,
              -apple-system,
              sans-serif;
            background: var(--bg);
            min-height: auto; /* avoid overlapping with fixed bottom nav */
          }

          .worklog-body {
            background: var(--bg);
            padding: 12px 14px 18px; /* 상단 여백 확보, 좌우 14 유지 */
            max-width: 100%;
            padding-bottom: calc(var(--page-bottom-gap, 24px) + env(safe-area-inset-bottom, 0px));
          }

          .worklog-body.spacious {
            padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px));
          }

          .worklog-section-group {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .worklog-section {
            background: var(--card);
            border-radius: 16px;
            padding: 12px;
            box-shadow: var(--shadow);
          }

          .worklog-section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
          }

          .worklog-section-title {
            font-size: 15px;
            font-weight: 700;
            color: var(--text);
          }

          .section-toggle {
            border: none;
            background: transparent;
            font-size: 13px;
            font-weight: 600;
            color: #1a254f;
            display: inline-flex;
            align-items: center;
            gap: 4px;
          }

          [data-theme='dark'] .section-toggle {
            color: #cbd5f5;
          }

          .worklog-section-hint {
            margin-top: 6px;
            font-size: 12px;
            color: var(--muted);
          }

          /* 탭을 좌우 풀블리드로 확장 (컨텐츠 좌우 패딩 상쇄) */
          .worklog-body > .line-tabs {
            width: calc(100% + 32px);
            margin-left: -16px;
            margin-right: -16px;
            border-top: 1px solid #e5eaf3; /* 상단 헤더와 탭 사이 구분선 */
          }

          [data-theme='dark'] .worklog-body > .line-tabs {
            border-top-color: #3a4048;
          }

          /* (reverted) Keep worklog summary cards local styling */

          /* Tabs now use global line-tabs/line-tab styles for full-width white bar */

          .worklog-search-section {
            margin-top: 14px;
            margin-bottom: 12px;
          }
          .worklog-search-wrap {
            position: relative;
          }
          /* Hide inline labels to match left (spec) style */
          .filter-label {
            display: none;
          }

          /* CustomSelect content radius (match output page rounded) */
          .custom-select-content {
            border-radius: 14px !important;
          }

          /* Keep trigger border consistent on all interaction states (match output page) */
          .custom-select-trigger,
          .custom-select-trigger:hover,
          .custom-select-trigger:active,
          .custom-select-trigger:focus,
          .custom-select-trigger[data-state='open'] {
            border-color: #e5eaf3 !important;
            box-shadow: none !important;
            outline: none !important;
            background: var(--card);
            width: 100% !important;
            justify-content: space-between !important;
          }
          [data-theme='dark'] .custom-select-trigger,
          [data-theme='dark'] .custom-select-trigger:hover,
          [data-theme='dark'] .custom-select-trigger:active,
          [data-theme='dark'] .custom-select-trigger:focus,
          [data-theme='dark'] .custom-select-trigger[data-state='open'] {
            background: var(--card);
          }

          /* Work list container per spec */
          .work-form-container {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 0 16px;
            box-shadow: 0 2px 10px rgba(2, 6, 23, 0.04);
            margin-top: 0; /* separation handled by selects block */
          }
          .worklog-search-input {
            padding-right: 40px; /* reserve space for clear button */
            height: 44px; /* align with partner select height */
            box-shadow: none !important;
          }
          .worklog-search-input:focus,
          .worklog-search-input:focus-visible {
            outline: none !important;
            box-shadow: none !important;
          }
          .worklog-search-clear {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            width: 28px;
            height: 28px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: none;
            background: transparent;
            color: #94a3b8;
            border-radius: 999px;
            cursor: pointer;
            font-size: 16px;
            line-height: 1;
          }
          .worklog-search-clear:focus {
            outline: none;
          }

          .filter-row {
            display: grid;
            gap: 12px;
            margin-top: 16px;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .filter-row-wrap {
            width: auto; /* remove full-bleed to avoid overlap illusion */
            margin: 0;
            padding: 0;
            margin-bottom: 20px;
          }

          /* Two-column row without extra container */
          .select-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); /* 1:1 ratio */
            gap: 8px;
            width: 100%;
            margin-left: 0;
            margin-right: 0;
            margin-bottom: 12px;
          }

          /* Compact block spacing for selects (no separator) */
          .filter-compact-block {
            margin-bottom: 12px;
          }

          /* Worklog-specific: make site select wider than period select */
          .ph-select-grid.worklog-selects-block {
            grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) !important;
          }

          /* Local spacing under select grid to prevent visual overlap with card below */
          .worklog-selects-block {
            margin-bottom: 14px; /* spacing below selects */
          }

          /* Thin separator to avoid white-on-white overlap illusion */
          .ph-separator {
            height: 1px;
            background: var(--ph-line);
            opacity: 1;
            margin: 8px 0 10px;
          }

          /* Use global .ph-select-trigger from partner.css for standard size/settings */

          .filter-select {
            display: flex;
            flex-direction: column;
            gap: 6px;
            width: 100%;
            min-width: 0;
          }

          .filter-label {
            font-size: 12px;
            font-weight: 600;
            color: var(--muted);
          }

          .select-box {
            position: relative;
            display: flex;
            align-items: center;
            border: 1px solid var(--border);
            border-radius: 10px;
            background: var(--card);
            height: 44px;
            padding: 0 14px;
          }

          .select-box select {
            appearance: none;
            border: none;
            background: transparent;
            width: 100%;
            height: 100%;
            font-size: 16px;
            font-weight: 600;
            color: var(--text);
            outline: none;
            padding-right: 24px;
          }

          .select-box .select-icon {
            position: absolute;
            right: 14px;
            color: var(--muted);
          }

          .worklog-list-section {
            margin-top: 12px;
            margin-bottom: 14px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .task-diary-list {
            display: flex;
            flex-direction: column;
          }

          .task-diary-list-item {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 18px 0;
            border: none;
            border-bottom: 1px solid var(--border);
            background: transparent;
            cursor: pointer;
            transition: background 0.2s ease;
            text-align: left;
          }

          .task-diary-list-item:last-child {
            border-bottom: none;
          }

          .task-diary-list-item:hover {
            background: rgba(2, 6, 23, 0.03);
          }
          [data-theme='dark'] .task-diary-list-item:hover {
            background: rgba(255, 255, 255, 0.04);
          }

          .task-diary-info {
            min-width: 0;
            flex: 1;
            padding-right: 18px;
          }

          .task-diary-site {
            font-size: 16px;
            font-weight: 600;
            color: var(--text);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .task-diary-work {
            font-size: 13px;
            font-weight: 700;
            color: var(--text-strong, var(--text));
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .task-diary-right {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 6px;
          }

          .status-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 4px 12px;
            border-radius: 999px;
            font-size: 13px;
            font-weight: 600;
            border: 1px solid transparent;
          }

          .markup-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 3px 10px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 700;
            background: rgba(59, 130, 246, 0.12);
            color: #1d4ed8;
            border: 1px solid rgba(59, 130, 246, 0.35);
          }

          .status-badge.draft {
            background: rgba(49, 163, 250, 0.08);
            color: #31a3fa;
            border-color: #31a3fa;
          }

          .status-badge.submitted {
            background: rgba(99, 102, 241, 0.12);
            color: #4c1d95;
            border-color: rgba(99, 102, 241, 0.4);
          }

          .status-badge.approved {
            background: rgba(16, 185, 129, 0.12);
            color: #047857;
            border-color: rgba(16, 185, 129, 0.4);
          }
          [data-theme='dark'] .status-badge.approved {
            background: rgba(16, 185, 129, 0.25);
            color: #bbf7d0;
            border-color: #34d399;
          }

          .status-badge.rejected {
            background: rgba(248, 113, 113, 0.12);
            color: #b91c1c;
            border-color: rgba(248, 113, 113, 0.4);
          }

          .task-diary-date {
            font-size: 12px;
            color: var(--muted);
          }

          [data-theme='dark'] .worklog-search-clear {
            color: #cbd5e1;
          }

          .more-button-container {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-top: 12px; /* 리스트 하단 라인과 여백 확보 */
            margin-bottom: 16px; /* 다음 섹션 상단 라인과 간격 확보 */
          }

          .more-collapse {
            position: absolute;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
          }

          .more-btn {
            padding: 10px 28px;
            border-radius: 10px;
            border: 1px solid var(--border);
            background: var(--card);
            font-size: 14px;
            font-weight: 600;
            color: var(--text);
            box-shadow: none; /* 그림자 제거 */
            cursor: pointer;
            transition: background 0.2s ease; /* 단순 배경 변화만 */
          }

          .more-btn:hover {
            background: #f8faff;
          }

          /* Summary cards (월간 요약) */
          .summary-cards {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-top: 16px;
          }

          .summary-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 14px 12px;
            text-align: center;
            box-shadow: 0 6px 16px rgba(16, 24, 40, 0.06);
          }

          .summary-value {
            color: var(--text);
            font-weight: 800;
            font-size: 18px;
            line-height: 24px;
          }

          .summary-label {
            margin-top: 4px;
            color: var(--muted);
            font-size: 12px;
          }

          @media (max-width: 480px) {
            /* 고정 1행 2열 유지 */
            .filter-row {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            /* removed custom tab sizing; uses global .line-tab */

            .task-diary-right {
              min-width: auto;
              align-items: flex-start;
            }

            .task-diary-list-item {
              padding: 16px 0;
              align-items: flex-start;
            }
          }

          @media (min-width: 640px) {
            .worklog-body {
              padding-left: 24px;
              padding-right: 24px;
            }
          }

          @media (min-width: 1024px) {
            .worklog-body {
              max-width: 1200px;
              margin: 0 auto;
              padding-top: 32px;
              padding-left: 32px;
              padding-right: 32px;
            }
          }
        `}</style>

        <div className={worklogBodyClassName}>
          {/* Title removed per spec */}

          {!readOnly && (
            <nav className="line-tabs" role="tablist" aria-label="작업일지 상태 탭">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'draft'}
                className={`line-tab ${activeTab === 'draft' ? 'active' : ''}`}
                onClick={() => setActiveTab('draft')}
              >
                임시
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'approved'}
                className={`line-tab ${activeTab === 'approved' ? 'active' : ''}`}
                onClick={() => setActiveTab('approved')}
              >
                제출/승인/반려
              </button>
            </nav>
          )}

          {/* 작업일지 필터 (컨테이너 최소화: 바로 행 배치) */}
          <section aria-label="작업일지 필터" className="select-row">
            {/* 현장 선택 */}
            <CustomSelect value={selectedSite} onValueChange={handleSiteChange}>
              <PhSelectTrigger>
                <CustomSelectValue className="text-left">{selectedSiteLabel}</CustomSelectValue>
              </PhSelectTrigger>
              <CustomSelectContent align="start" className="custom-select-content">
                <CustomSelectItem value="all">전체 현장</CustomSelectItem>
                {siteOptions
                  .filter(o => o.value !== 'all')
                  .map(option => (
                    <CustomSelectItem key={option.value} value={option.value}>
                      {option.label}
                    </CustomSelectItem>
                  ))}
              </CustomSelectContent>
            </CustomSelect>

            {/* 기간 선택 */}
            <CustomSelect value={selectedPeriod} onValueChange={handlePeriodChange}>
              <PhSelectTrigger>
                <CustomSelectValue className="text-left">{selectedPeriodLabel}</CustomSelectValue>
              </PhSelectTrigger>
              <CustomSelectContent align="start" className="custom-select-content">
                {selectedPeriod === 'custom' && filterDateFrom && filterDateTo && (
                  <CustomSelectItem value="custom" disabled>
                    {selectedPeriodLabel}
                  </CustomSelectItem>
                )}
                <CustomSelectItem value="all">전체 기간</CustomSelectItem>
                <CustomSelectItem value="3m">최근 3개월</CustomSelectItem>
                <CustomSelectItem value="6m">최근 6개월</CustomSelectItem>
                <CustomSelectItem value="12m">최근 12개월</CustomSelectItem>
              </CustomSelectContent>
            </CustomSelect>
          </section>

          <section className="worklog-search-section">
            <div className="ph-search-wrap worklog-search-wrap">
              <SearchIcon className="ph-search-icon" width={18} height={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="작업일지 검색"
                className="ph-search-input worklog-search-input"
                aria-label="작업일지 검색"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="worklog-search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="검색어 지우기"
                >
                  <span
                    style={{
                      position: 'absolute',
                      width: 1,
                      height: 1,
                      padding: 0,
                      margin: -1,
                      overflow: 'hidden',
                      clip: 'rect(0, 0, 0, 0)',
                      whiteSpace: 'nowrap',
                      border: 0,
                    }}
                  >
                    검색어 지우기
                  </span>
                </button>
              )}
            </div>
          </section>

          <section className="worklog-list-section work-form-container">
            {activeTab === 'draft'
              ? renderWorkLogList(draftWorkLogs, 'draft')
              : renderWorkLogList(approvedWorkLogs, 'approved')}
          </section>

          {/* Monthly summary cards - unified with salary/output stat style */}
          <section className="stat-grid" aria-label="월간 요약">
            <div className="stat stat-sites">
              <div className="num">{monthlyStats.siteCount}</div>
              <div className="label">현장수</div>
            </div>
            <div className="stat stat-hours">
              <div className="num">{monthlyStats.manDays}</div>
              <div className="label">공수</div>
            </div>
            <div className="stat stat-workdays">
              <div className="num">{monthlyStats.attendanceDays}</div>
              <div className="label">근무일</div>
            </div>
          </section>
        </div>

        {/* Floating Action Button 제거 (하단바와 겹침 이슈) */}

        {/* Modals */}
        <WorkLogModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveWorkLog}
          workLog={editingWorkLog ?? undefined}
          mode={modalMode}
        />

        {/* New Detail Viewer (시안 기반) */}
        {isDetailOpen && detailData ? (
          <DiaryDetailViewer
            open={isDetailOpen}
            worklog={detailData}
            onClose={() => {
              setDetailOpen(false)
              setDetailSourceWorkLog(null)
            }}
            onDownload={() => {}}
            onOpenDocument={() => {}}
            onOpenMarkup={wl => {
              const params = new URLSearchParams()
              params.set('mode', 'browse')
              params.set('siteId', wl.siteId)
              params.set('worklogId', wl.id)
              window.location.href = `/mobile/markup-tool?${params.toString()}`
            }}
            onOpenMarkupDoc={(docId, wl) => {
              const params = new URLSearchParams()
              params.set('mode', 'start')
              params.set('siteId', wl.siteId)
              params.set('worklogId', wl.id)
              params.set('docId', docId)
              window.location.href = `/mobile/markup-tool?${params.toString()}`
            }}
            onEdit={!readOnly ? handleDetailEdit : undefined}
          />
        ) : null}

        {/* 풀스크린 상세(레퍼런스)는 범위 외로 비표시 */}

        {/* Uncompleted Bottom Sheet */}
        <UncompletedBottomSheet
          isOpen={isUncompletedSheetOpen}
          onClose={() => setUncompletedSheetOpen(false)}
          uncompletedByMonth={visibleUncompleted}
          onDismiss={handleDismissMonth}
          onNavigate={handleNavigateToMonth}
        />

        {/* Draft Open Confirm Bottom Sheet */}
        {isDraftSheetOpen && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-40 z-[9998]"
              onClick={() => setDraftSheetOpen(false)}
            />
            <div className="fixed bottom-0 left-0 right-0 z-[9999]">
              <div className="bg-white rounded-t-3xl shadow-xl p-6 pb-[calc(28px+env(safe-area-inset-bottom))]">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">임시 상태 안내</h3>
                <p className="text-[15px] text-gray-600 mb-8 leading-relaxed">
                  선택한 임시 상태 항목의 내용을 불러옵니다.
                  <br />
                  <span className="text-sm text-gray-500">
                    *사진 및 도면은 자동 복구되지 않으므로 다시 추가해주세요.
                  </span>
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="flex-1 h-14 border border-gray-200 rounded-2xl text-gray-700 font-semibold text-[16px] active:bg-gray-50 transition-colors"
                    onClick={() => setDraftSheetOpen(false)}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className="flex-1 h-14 rounded-2xl text-white font-bold text-[16px] shadow-sm active:opacity-90 transition-opacity"
                    style={{ background: '#1a254f' }}
                    onClick={proceedOpenDraft}
                  >
                    계속 작성
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </LayoutShell>
  )
}

export default WorkLogHomePage
