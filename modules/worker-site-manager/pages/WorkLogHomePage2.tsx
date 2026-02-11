'use client'

import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { MobileLayout as MobileLayoutShell } from '@/modules/mobile/components/layout/MobileLayout'
import { PtwPreviewDialog } from '@/modules/mobile/components/work-log/PtwPreviewDialog'
import { useWorkLogs } from '@/modules/mobile/hooks/use-work-logs'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import type { WorkLog, WorkLogStatus } from '@/modules/mobile/types/work-log.types'
import { AlertCircle, Calendar, FileCheck, FileImage, FileText, Pin, Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import styles from './WorkLogHomePage2.module.css'

type UiStatus = 'draft' | 'pending' | 'reject' | 'approved'
type FilterStatus = 'all' | UiStatus
type DetailTab = 'status' | 'attachment'
type SortFilter = 'latest' | 'name'

const toUiStatus = (status: WorkLogStatus): UiStatus => {
  switch (status) {
    case 'draft':
      return 'draft'
    case 'submitted':
      return 'pending'
    case 'rejected':
      return 'reject'
    case 'approved':
      return 'approved'
    default:
      return 'draft'
  }
}

const getStatusLabel = (status: UiStatus): string => {
  switch (status) {
    case 'draft':
      return '임시'
    case 'pending':
      return '제출'
    case 'reject':
      return '반려'
    case 'approved':
      return '승인'
  }
}

const getSiteStatusLabel = (status?: string | null): string => {
  switch (String(status || '').toLowerCase()) {
    case 'active':
      return '진행중'
    case 'planning':
      return '계획'
    case 'completed':
      return '완료'
    case 'inactive':
      return '중단'
    default:
      return status ? String(status) : '-'
  }
}

const formatYmd = (dateStr?: string) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toISOString().slice(0, 10)
}

const getWorkLogPeriodRange = (logs: WorkLog[]) => {
  const dates = logs
    .map(log => formatYmd(log?.date))
    .filter(d => Boolean(d) && d !== '-')
    .sort()

  const from = dates[0] || '-'
  const to = dates[dates.length - 1] || '-'

  return { from, to }
}

const formatPeriodLabel = (from: string, to: string) => {
  if (!from || from === '-') return '-'
  if (!to || to === '-') return from
  return from === to ? from : `${from} ~ ${to}`
}

const getSiteAddressFromLogs = (logs: WorkLog[]) => {
  for (const log of logs) {
    const addr = typeof log?.siteAddress === 'string' ? log.siteAddress.trim() : ''
    if (addr) return addr
  }
  return ''
}

const PINNED_KEY = 'worklog2_pinned_sites'

type SiteGroup = {
  siteId: string
  siteName: string
  latestDate: string
  status: UiStatus
  rejectReason?: string
  latestLog?: WorkLog
  workLogs: WorkLog[]
  counts: {
    worklogs: number
    photos: number
    drawings: number
    confirmations: number
  }
}

function readPinnedSet(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(PINNED_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    if (Array.isArray(parsed)) return new Set(parsed.map(String))
  } catch {
    // ignore
  }
  return new Set()
}

function writePinnedSet(pinned: Set<string>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PINNED_KEY, JSON.stringify(Array.from(pinned)))
  } catch {
    // ignore
  }
}

const formatLocationPart = (raw: unknown, suffix: string) => {
  const value = typeof raw === 'string' ? raw.trim() : ''
  if (!value) return ''

  const compact = value.replace(/\s+/g, '')
  const alreadyHasSuffix =
    /(블록|동|층|호)$/i.test(compact) ||
    /(block|dong|floor|unit)$/i.test(compact) ||
    /f$/i.test(compact)
  if (alreadyHasSuffix) return value

  return `${value}${suffix}`
}

const formatManDaysFixed1 = (totalHours?: number) => {
  const hours = Number(totalHours || 0)
  if (!Number.isFinite(hours) || hours <= 0) return '0.0'
  const manDays = hours / 8
  const rounded = Math.round(manDays * 10) / 10
  return rounded.toFixed(1)
}

const roundToHalf = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return 0
  return Math.round(value * 2) / 2
}

const getPrimaryWorkerInfo = (log?: WorkLog) => {
  const authorName = String(log?.author || '').trim()
  const workers = Array.isArray(log?.workers) ? log!.workers : []
  const primaryWorker = workers.reduce(
    (acc, curr) => ((Number(curr?.hours) || 0) > (Number(acc?.hours) || 0) ? curr : acc),
    workers[0]
  )
  const workerName = String(primaryWorker?.name || '').trim() || authorName || '-'
  const workerHours = Number(primaryWorker?.hours)
  const effectiveHours =
    Number.isFinite(workerHours) && workerHours > 0 ? workerHours : Number(log?.totalHours || 0)
  const manDays = formatManDaysFixed1(effectiveHours)
  const workDays = effectiveHours > 0 && workerName !== '-' ? 1 : 0
  return { workerName, manDays, workDays }
}

type SummaryItem = { label: string; value: string }

const buildCardSummaryItems = (log?: WorkLog): SummaryItem[] => {
  if (!log) return []
  const members = Array.from(new Set(log.memberTypes || [])).filter(Boolean)
  const processes = Array.from(new Set(log.workProcesses || [])).filter(Boolean)
  const types = Array.from(new Set(log.workTypes || [])).filter(Boolean)
  const locationText = [
    formatLocationPart(log.location?.block, '블록'),
    formatLocationPart(log.location?.dong, '동'),
    formatLocationPart(log.location?.unit, '층'),
  ]
    .filter(Boolean)
    .join(' / ')

  const items: SummaryItem[] = []
  if (members.length) items.push({ label: '부재:', value: members.join(', ') })
  if (processes.length) items.push({ label: '공정:', value: processes.join(', ') })
  if (types.length) items.push({ label: '유형:', value: types.join(', ') })
  if (locationText) items.push({ label: '위치:', value: locationText })
  return items
}

const formatManDays = (totalHours?: number) => {
  const hours = Number(totalHours || 0)
  if (!Number.isFinite(hours) || hours <= 0) return '0'
  const manDays = hours / 8
  const rounded = Math.round(manDays * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

const countUnifiedDrawings = (log?: WorkLog) => {
  const drawings = log?.attachments?.drawings || []
  return drawings.filter(file => String(file?.id || '').startsWith('linked-shared-')).length
}

const buildPrefillFromWorkLog = (log: WorkLog) => {
  const location = log.location || { block: '', dong: '', unit: '' }
  const workers = Array.isArray(log.workers) ? log.workers : []
  const workerEntries = workers
    .map(w => ({
      name: String(w?.name || '').trim(),
      manDays: roundToHalf((Number(w?.hours) || 0) / 8),
    }))
    .filter(w => w.name && w.manDays > 0)
    .sort((a, b) => b.manDays - a.manDays)

  const main = workerEntries[0] ?? null
  const additional = workerEntries.slice(1)

  return {
    siteId: String(log.siteId || ''),
    workDate: String(log.date || ''),
    location: {
      block: String(location.block || ''),
      dong: String(location.dong || ''),
      unit: String(location.unit || ''),
    },
    memberTypes: Array.isArray(log.memberTypes) ? log.memberTypes : [],
    workProcesses: Array.isArray(log.workProcesses) ? log.workProcesses : [],
    workTypes: Array.isArray(log.workTypes) ? log.workTypes : [],
    mainManpower: main?.manDays
      ? main.manDays
      : roundToHalf((Number(log.totalHours) || 0) / 8) || 1,
    additionalManpower: additional.map(entry => ({
      id: Math.random().toString(36).slice(2),
      workerId: '',
      workerName: entry.name,
      manpower: entry.manDays,
    })),
    materials: Array.isArray(log.materials)
      ? log.materials.map(m => ({
          material_name: String(m?.material_name || '').trim(),
          material_code: m?.material_code ?? null,
          quantity: Number(m?.quantity_val ?? m?.amount ?? m?.quantity ?? 0) || 0,
          unit: m?.unit ?? null,
          notes: m?.notes ?? null,
        }))
      : [],
    tasks: Array.isArray(log.tasks)
      ? log.tasks.map(t => ({
          memberTypes: Array.isArray(t?.memberTypes) ? t.memberTypes : [],
          processes: Array.isArray((t as any)?.processes)
            ? (t as any).processes
            : Array.isArray((t as any)?.workProcesses)
              ? (t as any).workProcesses
              : [],
          workTypes: Array.isArray(t?.workTypes) ? t.workTypes : [],
          location: {
            block: String(t?.location?.block || ''),
            dong: String(t?.location?.dong || ''),
            unit: String(t?.location?.unit || ''),
          },
        }))
      : [],
  }
}

export const WorkLogHomePage2: React.FC = () => {
  const { workLogs, loading, error, deleteWorkLog } = useWorkLogs()
  const router = useRouter()

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [sortFilter, setSortFilter] = useState<SortFilter>('latest')
  const [siteFilterId, setSiteFilterId] = useState<string>('all')
  const [siteSearchText, setSiteSearchText] = useState('')
  const [siteSelectOpen, setSiteSelectOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(20)
  const [actionBusyId, setActionBusyId] = useState<string | null>(null)

  const [pinnedSites, setPinnedSites] = useState<Set<string>>(() => readPinnedSet())

  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const siteSelectSearchRef = useRef<HTMLInputElement | null>(null)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailTab, setDetailTab] = useState<DetailTab>('status')
  const [activeSiteId, setActiveSiteId] = useState<string | null>(null)
  const [materialsExpanded, setMaterialsExpanded] = useState(false)
  const [ptwDialogOpen, setPtwDialogOpen] = useState(false)

  useEffect(() => {
    writePinnedSet(pinnedSites)
  }, [pinnedSites])

  useEffect(() => {
    setVisibleCount(20)
  }, [filterStatus, sortFilter, siteFilterId])

  const siteGroups = useMemo(() => {
    const bySite = new Map<string, WorkLog[]>()
    for (const log of workLogs || []) {
      const key = log.siteId || 'unknown'
      if (!bySite.has(key)) bySite.set(key, [])
      bySite.get(key)!.push(log)
    }

    const groups: SiteGroup[] = []
    for (const [siteId, logs] of bySite.entries()) {
      const sorted = [...logs].sort((a, b) => (a.date < b.date ? 1 : -1))
      const latestLog = sorted[0]
      const status = toUiStatus(latestLog?.status || 'draft')

      const latestPhotos = latestLog?.attachments?.photos?.length || 0
      const latestDrawings = latestLog?.attachments?.drawings?.length || 0
      const latestConfirmations = latestLog?.attachments?.confirmations?.length || 0

      groups.push({
        siteId,
        siteName: latestLog?.siteName || '현장명 없음',
        latestDate: latestLog?.date || '',
        status,
        rejectReason: latestLog?.rejectionReason || undefined,
        latestLog,
        workLogs: sorted,
        counts: {
          worklogs: sorted.length,
          photos: latestPhotos,
          drawings: latestDrawings,
          confirmations: latestConfirmations ? 1 : 0,
        },
      })
    }

    return groups
  }, [workLogs])

  const siteOptions = useMemo(() => {
    const unique = new Map<string, { id: string; name: string }>()
    siteGroups.forEach(g => {
      if (!unique.has(g.siteId)) unique.set(g.siteId, { id: g.siteId, name: g.siteName })
    })
    return Array.from(unique.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'ko', { sensitivity: 'base' })
    )
  }, [siteGroups])

  const filteredSiteOptions = useMemo(() => {
    const q = siteSearchText.trim().toLowerCase()
    if (!q) return siteOptions
    return siteOptions.filter(opt => opt.name.toLowerCase().includes(q))
  }, [siteOptions, siteSearchText])

  const filteredGroups = useMemo(() => {
    let next = siteGroups

    if (siteFilterId !== 'all') next = next.filter(g => g.siteId === siteFilterId)

    if (filterStatus !== 'all') {
      next = next.filter(g => g.status === filterStatus)
    }

    const pinned = next.filter(g => pinnedSites.has(g.siteId))
    const unpinned = next.filter(g => !pinnedSites.has(g.siteId))

    const sortLatest = (a: SiteGroup, b: SiteGroup) => (a.latestDate < b.latestDate ? 1 : -1)
    const sortName = (a: SiteGroup, b: SiteGroup) =>
      a.siteName.localeCompare(b.siteName, 'ko', { sensitivity: 'base' })

    const sorter = sortFilter === 'name' ? sortName : sortLatest

    pinned.sort(sorter)
    unpinned.sort(sorter)

    return [...pinned, ...unpinned]
  }, [filterStatus, pinnedSites, siteGroups, siteFilterId, sortFilter])

  const selectedSiteGroup = useMemo(() => {
    if (siteFilterId === 'all') return null
    return siteGroups.find(g => g.siteId === siteFilterId) || null
  }, [siteFilterId, siteGroups])

  const selectedSiteWorkLogs = useMemo(() => {
    if (!selectedSiteGroup) return []
    const logs = selectedSiteGroup.workLogs || []
    if (filterStatus === 'all') return logs
    return logs.filter(log => toUiStatus(log.status) === filterStatus)
  }, [filterStatus, selectedSiteGroup])

  const summaryCounts = useMemo(() => {
    const counts = { draft: 0, reject: 0, pending: 0, approved: 0 }
    siteGroups.forEach(g => {
      counts[g.status] += 1
    })
    return counts
  }, [siteGroups])

  const visibleGroups = useMemo(
    () => filteredGroups.slice(0, visibleCount),
    [filteredGroups, visibleCount]
  )

  const activeGroup = useMemo(() => {
    if (!activeSiteId) return null
    return siteGroups.find(g => g.siteId === activeSiteId) || null
  }, [activeSiteId, siteGroups])

  const attachmentSummary = useMemo(() => {
    const summary = {
      photosBefore: 0,
      photosAfter: 0,
      drawingsBlueprint: 0,
      drawingsProgress: 0,
      drawingsCompletion: 0,
      ptwCount: 0,
    }

    if (!activeGroup) return summary

    const normalizePhotoType = (file: any) => {
      const raw = String(file?.metadata?.photo_type || file?.metadata?.photoType || '')
        .trim()
        .toLowerCase()
      if (raw === 'before') return 'before'
      if (raw === 'after') return 'after'
      return 'after'
    }

    const normalizeDrawingType = (file: any) => {
      const meta = file?.metadata || {}
      const source = String(meta?.source || '')
        .trim()
        .toLowerCase()
      const raw = String(
        meta?.sub_category ||
          meta?.subCategory ||
          meta?.document_type ||
          meta?.documentType ||
          file?.documentType ||
          ''
      )
        .trim()
        .toLowerCase()

      if (
        raw.includes('blueprint') ||
        raw.includes('공도면') ||
        raw.includes('공 도면') ||
        raw.includes('공_도면')
      )
        return 'blueprint'
      if (
        raw.includes('completion') ||
        raw.includes('done') ||
        raw.includes('final') ||
        raw.includes('완료')
      )
        return 'completion'
      if (raw.includes('progress')) return 'progress'
      if (source === 'markup_documents') return 'progress'
      return 'progress'
    }

    activeGroup.workLogs.forEach(log => {
      const additionalPhotos = (log.attachments?.photos || []).filter(
        file =>
          String(file?.metadata?.source || '')
            .trim()
            .toLowerCase() === 'daily_report_additional_photos'
      )
      additionalPhotos.forEach(file => {
        const t = normalizePhotoType(file)
        if (t === 'before') summary.photosBefore += 1
        else summary.photosAfter += 1
      })

      const sharedDrawings = (log.attachments?.drawings || []).filter(
        file =>
          String(file?.metadata?.source || '')
            .trim()
            .toLowerCase() === 'unified_document_system'
      )
      sharedDrawings.forEach(file => {
        const t = normalizeDrawingType(file)
        if (t === 'blueprint') summary.drawingsBlueprint += 1
        else if (t === 'completion') summary.drawingsCompletion += 1
        else summary.drawingsProgress += 1
      })

      // PTW Count Logic (Mock based on attachments or separate ptw field if available)
      // Assuming ptw might be in attachments.others or a separate field in future.
      // For now, check if there are any 'ptw' related files in 'others' or specific metadata
      const ptwFiles = (log.attachments?.others || []).filter(
        file =>
          String(file?.name || '')
            .toLowerCase()
            .includes('ptw') || String(file?.name || '').includes('허가서')
      )
      summary.ptwCount += ptwFiles.length
    })

    return summary
  }, [activeGroup])

  const openDetail = (siteId: string) => {
    setActiveSiteId(siteId)
    setDetailTab('status')
    setDetailOpen(true)
  }

  const closeDetail = () => {
    setDetailOpen(false)
    setActiveSiteId(null)
  }

  useEffect(() => {
    if (!detailOpen) {
      setMaterialsExpanded(false)
      return
    }
    if (detailTab !== 'attachment') {
      setMaterialsExpanded(false)
      return
    }
    setMaterialsExpanded(false)
  }, [activeSiteId, detailOpen, detailTab])

  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        setSiteSelectOpen(false)
        if (detailOpen) closeDetail()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [detailOpen])

  const togglePinned = (siteId: string) => {
    setPinnedSites(prev => {
      const next = new Set(prev)
      if (next.has(siteId)) {
        next.delete(siteId)
        toast.success('고정이 해제되었습니다.')
      } else {
        next.add(siteId)
        toast.success('상단에 고정되었습니다.')
      }
      return next
    })
  }

  const renderDetailBody = () => {
    if (!activeGroup) return null

    const renderSiteInfoSection = () => {
      if (!activeGroup) return null

      const affiliation = activeGroup.latestLog?.partnerCompanyName || '-'
      const siteStatusLabel = getSiteStatusLabel(activeGroup.latestLog?.siteStatus)
      const latestDate = formatYmd(activeGroup.latestDate)
      const worklogCount = activeGroup.counts.worklogs
      const approvedLogs = (activeGroup.workLogs || []).filter(
        log => toUiStatus(log.status) === 'approved'
      )
      const approvedTotalHours = approvedLogs.reduce(
        (sum, log) => sum + (Number(log?.totalHours) || 0),
        0
      )
      const approvedTotalDays = new Set(
        approvedLogs.map(log => formatYmd(log?.date)).filter(d => d && d !== '-')
      ).size

      const periodRange = getWorkLogPeriodRange(activeGroup.workLogs || [])
      const periodLabel = formatPeriodLabel(periodRange.from, periodRange.to)
      const worklogLabel = detailTab === 'attachment' ? '일지' : '작업일지'
      const approvedHoursLabel = detailTab === 'attachment' ? '총공수(승인)' : '총 공수(승인)'
      const approvedDaysLabel = detailTab === 'attachment' ? '총작업일(승인)' : '총 작업일(승인)'

      return (
        <section className={styles.detailSection}>
          <div className={styles.siteInfoBlock}>
            <div className={styles.secHeadRow}>
              <div className={styles.secHeadLeft}>
                <AlertCircle size={20} className={styles.secIcon} />
                <span>현장 정보</span>
              </div>
              <div className={styles.siteInfoHeadRight}>
                <div className={styles.siteInfoRecent}>최근 작성일 {latestDate}</div>
                <div className={styles.siteInfoRecent}>기간 {periodLabel}</div>
              </div>
            </div>

            <div className={styles.siteInfoNameRow}>
              <div className={styles.siteInfoName}>{activeGroup.siteName}</div>
              <div className={styles.siteInfoBadges}>
                <span className={`${styles.siteInfoBadge} ${styles.siteInfoBadgeAffil}`}>
                  {affiliation}
                </span>
                <span className={`${styles.siteInfoBadge} ${styles.siteInfoBadgeStatus}`}>
                  {siteStatusLabel}
                </span>
              </div>
            </div>

            <div className={styles.siteInfoSummaryLine}>
              <span className={styles.siteInfoSummaryLabel}>{worklogLabel}:</span>
              <span className={styles.siteInfoSummaryValue}>{worklogCount}건</span>
              <span className={styles.siteInfoSummarySep}>ㅣ</span>
              <span className={styles.siteInfoSummaryLabel}>{approvedHoursLabel}:</span>
              <span className={styles.siteInfoSummaryValue}>
                {formatManDays(approvedTotalHours)} 공수
              </span>
              <span className={styles.siteInfoSummarySep}>ㅣ</span>
              <span className={styles.siteInfoSummaryLabel}>{approvedDaysLabel}:</span>
              <span className={styles.siteInfoSummaryValue}>{approvedTotalDays}일</span>
            </div>
          </div>
        </section>
      )
    }

    const renderAttachmentTab = () => {
      const goDocHub = (tab: 'photos' | 'drawings') => {
        const params = new URLSearchParams()
        params.set('tab', tab)
        params.set('siteName', activeGroup.siteName)
        router.push(`/mobile/documents?${params.toString()}`)
      }

      const getMaterialGroups = () => {
        const map = new Map<string, NonNullable<WorkLog['materials']>>()
        activeGroup.workLogs.forEach(log => {
          const materials = Array.isArray(log.materials) ? log.materials : []
          const dbMaterials = materials.filter(m => Boolean(m?.material_id))
          if (dbMaterials.length === 0) return
          const date = formatYmd(log.date)
          if (!map.has(date)) map.set(date, [])
          map.get(date)!.push(...dbMaterials)
        })
        const dates = Array.from(map.keys()).sort((a, b) => (a < b ? 1 : -1))
        return { map, dates }
      }
      const materialGroups = getMaterialGroups()

      const materialsCount = materialGroups.dates.reduce(
        (sum, date) => sum + (materialGroups.map.get(date)?.length || 0),
        0
      )

      const getMaterialsUniqueNames = () => {
        const names = new Set<string>()
        materialGroups.dates.forEach(date => {
          ;(materialGroups.map.get(date) || []).forEach(m => {
            const name = String(m?.material_name || '').trim()
            if (name) names.add(name)
          })
        })
        return names.size
      }
      const materialsUniqueNames = getMaterialsUniqueNames()

      return (
        <>
          {renderSiteInfoSection()}

          <section className={styles.detailSection}>
            {materialsCount === 0 ? (
              <>
                <div className={styles.secHeadRowTight}>
                  <div className={styles.secHeadLeft}>
                    <FileText size={20} className={styles.secIcon} />
                    <span>자재 사용내역</span>
                  </div>
                </div>
                <div className={styles.summaryLine}>
                  <span className={styles.summaryEmptyText}>기록된 자재 사용내역이 없습니다.</span>
                </div>
              </>
            ) : (
              <>
                <div className={styles.secHeadRowTight}>
                  <div className={styles.secHeadLeft}>
                    <FileText size={20} className={styles.secIcon} />
                    <span>자재 사용내역</span>
                  </div>
                  <button
                    type="button"
                    className={styles.inlineToggleBtn}
                    onClick={() => setMaterialsExpanded(v => !v)}
                  >
                    {materialsExpanded ? '접기' : '펼치기'}
                  </button>
                </div>

                {!materialsExpanded ? (
                  <div className={styles.summaryLine}>
                    <span className={styles.summaryLabel}>품목</span>
                    <span className={styles.summaryValue}>{materialsUniqueNames}종</span>
                    <span className={styles.summarySep}>/</span>
                    <span className={styles.summaryLabel}>기록</span>
                    <span className={styles.summaryValue}>{materialsCount}건</span>
                  </div>
                ) : (
                  <div className={styles.materialGroups}>
                    {materialGroups.dates.map(date => (
                      <div key={date} className={styles.materialGroup}>
                        <div className={styles.materialGroupDate}>{date}</div>
                        <ul className={styles.materialList}>
                          {(materialGroups.map.get(date) || []).map((m, idx) => {
                            const qty = Number(m?.quantity ?? 0)
                            const unit = typeof m?.unit === 'string' ? m.unit.trim() : ''
                            const qtyText = Number.isFinite(qty) ? String(qty) : '0'
                            return (
                              <li
                                key={`${date}-${m.material_name}-${idx}`}
                                className={styles.materialItem}
                              >
                                <div className={styles.materialItemTop}>
                                  <div className={styles.materialItemLeft}>
                                    <div className={styles.materialName}>
                                      {m.material_name || '-'}
                                    </div>
                                  </div>
                                  <div className={styles.materialQty}>
                                    {qtyText}
                                    {unit ? ` ${unit}` : ''}
                                  </div>
                                </div>
                                {m.notes ? (
                                  <div className={styles.materialNotes}>{m.notes}</div>
                                ) : null}
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          <section className={styles.detailSection}>
            <div className={styles.secHeadRowTight}>
              <div className={styles.secHeadLeft}>
                <FileImage size={20} className={styles.secIcon} />
                <span>사진함</span>
              </div>
              <button
                type="button"
                className={styles.inlineDetailBtn}
                onClick={() => goDocHub('photos')}
              >
                상세
              </button>
            </div>
            <div className={styles.summaryLine}>
              <span className={styles.summaryLabel}>시공 전</span>
              <span className={styles.summaryValue}>{attachmentSummary.photosBefore}장</span>
              <span className={styles.summarySep}>/</span>
              <span className={styles.summaryLabel}>시공 후</span>
              <span className={styles.summaryValue}>{attachmentSummary.photosAfter}장</span>
            </div>
          </section>

          <section className={styles.detailSection}>
            <div className={styles.secHeadRowTight}>
              <div className={styles.secHeadLeft}>
                <FileText size={20} className={styles.secIcon} />
                <span>도면함</span>
              </div>
              <button
                type="button"
                className={styles.inlineDetailBtn}
                onClick={() => goDocHub('drawings')}
              >
                상세
              </button>
            </div>
            <div className={styles.summaryLine}>
              <span className={styles.summaryLabel}>공도면</span>
              <span className={styles.summaryValue}>{attachmentSummary.drawingsBlueprint}장</span>
              <span className={styles.summarySep}>/</span>
              <span className={styles.summaryLabel}>진행도면</span>
              <span className={styles.summaryValue}>{attachmentSummary.drawingsProgress}장</span>
              <span className={styles.summarySep}>/</span>
              <span className={styles.summaryLabel}>완료도면</span>
              <span className={styles.summaryValue}>{attachmentSummary.drawingsCompletion}장</span>
            </div>
          </section>

          <section className={styles.detailSection}>
            <div className={styles.secHeadRowTight}>
              <div className={styles.secHeadLeft}>
                <FileCheck size={20} className={styles.secIcon} />
                <span>작업완료 확인서</span>
              </div>
              <button
                type="button"
                className={styles.inlineDetailBtn}
                onClick={() => {
                  const worklogId = activeGroup.latestLog?.id || activeGroup.workLogs?.[0]?.id
                  if (!worklogId) {
                    toast.error('연동할 작업일지를 찾지 못했습니다.')
                    return
                  }
                  const params = new URLSearchParams()
                  params.set('siteId', activeGroup.siteId)
                  params.set('worklogId', worklogId)
                  router.push(`/mobile/certificate?${params.toString()}`)
                }}
              >
                확인서실행
              </button>
            </div>
            <div className={styles.summaryLine}>
              <span className={styles.summaryLabel}>확인서</span>
              <span className={styles.summaryValue}>{attachmentSummary.confirmations || 0}건</span>
            </div>
          </section>

          <section className={styles.detailSection}>
            <div className={styles.secHeadRowTight}>
              <div className={styles.secHeadLeft}>
                <FileCheck size={20} className={styles.secIcon} />
                <span>PTW 작업허가서</span>
              </div>
              <button
                type="button"
                className={styles.inlineDetailBtn}
                onClick={() => setPtwDialogOpen(true)}
              >
                상세
              </button>
            </div>
            <div className={styles.summaryLine}>
              <span className={styles.summaryLabel}>발급된 허가서</span>
              <span className={styles.summaryValue}>{attachmentSummary.ptwCount}건</span>
            </div>
          </section>
        </>
      )
    }

    if (detailTab === 'attachment') return renderAttachmentTab()

    return (
      <>
        {renderSiteInfoSection()}

        <section className={styles.detailSection}>
          <div className={styles.secHead}>
            <Calendar size={20} className={styles.secIcon} />
            <span>해당 현장 작업일지 모음</span>
          </div>
          <div className={styles.worklogList}>
            {activeGroup.workLogs.map(log => (
              <div key={log.id} className={styles.worklogCard}>
                <div className={styles.worklogCardTop}>
                  <div className={styles.worklogDate}>작업일: {formatYmd(log.date)}</div>
                  <span className={styles.statusBadge} data-status={toUiStatus(log.status)}>
                    {getStatusLabel(toUiStatus(log.status))}
                  </span>
                </div>

                <div className={styles.worklogSummary}>
                  <div className={styles.worklogSummaryLine}>
                    <span className={styles.worklogSummaryLabel}>작성:</span>
                    <span className={styles.worklogSummaryValue}>
                      {String(log.author || '').trim() || '-'}
                    </span>
                    <span className={styles.worklogSummarySep}>ㅣ</span>
                    <span className={styles.worklogSummaryLabel}>작업:</span>
                    <span className={styles.worklogSummaryValue}>
                      {(() => {
                        const { workerName, manDays, workDays } = getPrimaryWorkerInfo(log)
                        return `${workerName}(${manDays}공수,${workDays}작업일)`
                      })()}
                    </span>
                  </div>

                  <div className={styles.worklogSummaryLineSecondary}>
                    {(() => {
                      const memberText = Array.from(new Set(log.memberTypes || [])).join(', ')
                      const processText = Array.from(new Set(log.workProcesses || [])).join(', ')
                      const typeText = Array.from(new Set(log.workTypes || [])).join(', ')
                      const loc = [
                        formatLocationPart(log.location?.block, '블록'),
                        formatLocationPart(log.location?.dong, '동'),
                        formatLocationPart(log.location?.unit, '층'),
                      ]
                        .filter(Boolean)
                        .join(' / ')

                      const items: Array<{ label: string; value: string }> = []
                      if (memberText) items.push({ label: '부재:', value: memberText })
                      if (processText) items.push({ label: '공정:', value: processText })
                      if (typeText) items.push({ label: '유형:', value: typeText })
                      if (loc) items.push({ label: '위치:', value: loc })

                      if (items.length === 0) return <span>-</span>

                      return items.flatMap((item, idx) => [
                        <React.Fragment key={`${item.label}-${idx}`}>
                          <span className={styles.worklogSummaryLabel}>{item.label}</span>
                          <span className={styles.worklogSummaryValue}>{item.value}</span>
                          {idx < items.length - 1 ? (
                            <span className={styles.worklogSummarySep}>ㅣ</span>
                          ) : null}
                        </React.Fragment>,
                      ])
                    })()}
                  </div>
                </div>

                {toUiStatus(log.status) !== 'approved' ? (
                  <div className={styles.worklogActions}>
                    <button
                      type="button"
                      className={`${styles.worklogBtn} ${styles.worklogBtnGray}`}
                      disabled={actionBusyId === log.id}
                      onClick={() => {
                        try {
                          const payload = buildPrefillFromWorkLog(log)
                          localStorage.setItem('worklog_prefill', JSON.stringify(payload))
                        } catch {
                          // ignore
                        }
                        closeDetail()
                        router.push('/mobile')
                      }}
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      className={`${styles.worklogBtn} ${styles.worklogBtnDanger}`}
                      disabled={actionBusyId === log.id}
                      onClick={async () => {
                        if (
                          !confirm(
                            `작업일지를 삭제할까요?\n\n${activeGroup.siteName} / ${formatYmd(log.date)}`
                          )
                        ) {
                          return
                        }
                        setActionBusyId(log.id)
                        try {
                          await deleteWorkLog(String(log.id))
                          toast.success('삭제되었습니다.')
                        } catch (e: any) {
                          toast.error(e?.message || '삭제에 실패했습니다.')
                        } finally {
                          setActionBusyId(null)
                        }
                      }}
                    >
                      삭제
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </>
    )
  }

  const renderDetailFooter = () => {
    if (!activeGroup) return null

    const btn = (
      label: string,
      variant: 'white' | 'navy' | 'gray' | 'danger',
      onClick: () => void
    ) => {
      const className =
        variant === 'navy'
          ? `${styles.btnAction} ${styles.btnNavy}`
          : variant === 'gray'
            ? `${styles.btnAction} ${styles.btnGray}`
            : variant === 'danger'
              ? `${styles.btnAction} ${styles.btnDanger}`
              : `${styles.btnAction} ${styles.btnWhite}`
      return (
        <button type="button" className={className} onClick={onClick}>
          {label}
        </button>
      )
    }

    const handleReportView = async () => {
      if (!activeGroup?.latestLog?.id) return
      const reportId = activeGroup.latestLog.id

      try {
        const res = await fetch(`/api/work-reports/${reportId}`)
        const data = await res.json()

        if (data.exists && data.data?.file_url) {
          // Open PDF in new tab
          window.open(data.data.file_url, '_blank')
        } else {
          toast('생성된 작업보고서가 없습니다. 본사 관리자에게 문의하세요.')
        }
      } catch (e) {
        toast.error('보고서 정보를 불러오는데 실패했습니다.')
      }
    }

    switch (activeGroup.status) {
      case 'draft':
        return (
          <>
            {btn('닫기', 'white', closeDetail)}
            {btn('임시저장', 'gray', () => toast('임시저장 기능은 준비중입니다.'))}
            {btn('제출', 'navy', () => toast('제출 기능은 준비중입니다.'))}
          </>
        )
      case 'pending':
        return <>{btn('닫기', 'white', closeDetail)}</>
      case 'reject':
        return (
          <>
            {btn('닫기', 'white', closeDetail)}
            {btn('수정', 'gray', () => toast('수정 기능은 준비중입니다.'))}
            {btn('제출', 'navy', () => toast('제출 기능은 준비중입니다.'))}
          </>
        )
      case 'approved':
        return (
          <>
            {btn('닫기', 'white', closeDetail)}
            {btn('보고서 보기', 'navy', handleReportView)}
          </>
        )
    }
  }

  return (
    <MobileLayoutShell>
      <div className={styles.worklog2} ref={wrapperRef}>
        <PtwPreviewDialog
          open={ptwDialogOpen}
          onClose={() => setPtwDialogOpen(false)}
          siteId={activeGroup?.siteId}
        />
        <div className={styles.appWrapper}>
          {/* Search + Sort */}
          <div className={styles.topRow}>
            <div className={styles.searchWrap}>
              <CustomSelect
                value={siteFilterId}
                onValueChange={value => setSiteFilterId(value)}
                open={siteSelectOpen}
                onOpenChange={open => {
                  setSiteSelectOpen(open)
                  if (open) {
                    setSiteSearchText('')
                    requestAnimationFrame(() => siteSelectSearchRef.current?.focus())
                  }
                }}
              >
                <CustomSelectTrigger className={styles.siteSelectTrigger} aria-label="현장 선택">
                  <CustomSelectValue placeholder="현장 선택 또는 검색" />
                </CustomSelectTrigger>

                <CustomSelectContent className={styles.siteSelectContent} align="start">
                  <div className={styles.siteSelectSearchWrap}>
                    <input
                      ref={siteSelectSearchRef}
                      type="text"
                      value={siteSearchText}
                      onChange={e => setSiteSearchText(e.target.value)}
                      placeholder="현장명 검색"
                      className={styles.siteSelectSearchInput}
                      autoComplete="off"
                      onKeyDown={e => e.stopPropagation()}
                    />
                  </div>

                  <CustomSelectItem value="all">전체 현장</CustomSelectItem>
                  {filteredSiteOptions.map(opt => (
                    <CustomSelectItem key={opt.id} value={opt.id}>
                      {opt.name}
                    </CustomSelectItem>
                  ))}
                </CustomSelectContent>
              </CustomSelect>
            </div>

            <div className={styles.sortWrap}>
              <CustomSelect value={sortFilter} onValueChange={v => setSortFilter(v as SortFilter)}>
                <CustomSelectTrigger className={styles.sortSelectTrigger} aria-label="정렬">
                  <CustomSelectValue />
                </CustomSelectTrigger>
                <CustomSelectContent className={styles.sortSelectContent} align="end">
                  <CustomSelectItem value="latest">최신순</CustomSelectItem>
                  <CustomSelectItem value="name">이름순</CustomSelectItem>
                </CustomSelectContent>
              </CustomSelect>
            </div>
          </div>

          {/* Filter Chips */}
          <div className={styles.filterSection}>
            <div className="grid w-full grid-cols-5 gap-2 px-4 pb-1">
              {(
                [
                  { key: 'all', label: '전체' },
                  { key: 'draft', label: '임시' },
                  { key: 'pending', label: '제출' },
                  { key: 'approved', label: '승인' },
                  { key: 'reject', label: '반려' },
                ] as const
              ).map(item => (
                <button
                  key={item.key}
                  type="button"
                  className={`${styles.filterChip} w-full`}
                  data-status={item.key}
                  data-active={(filterStatus === item.key).toString()}
                  onClick={() => {
                    setFilterStatus(item.key)
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className={styles.summaryGrid}>
            <button
              type="button"
              className={styles.sumCard}
              data-sum="draft"
              onClick={() => setFilterStatus('draft')}
            >
              <span className={styles.sumVal}>{summaryCounts.draft}</span>
              <span className={styles.sumLabel}>임시</span>
            </button>
            <button
              type="button"
              className={styles.sumCard}
              data-sum="reject"
              onClick={() => setFilterStatus('reject')}
            >
              <span className={styles.sumVal}>{summaryCounts.reject}</span>
              <span className={styles.sumLabel}>반려</span>
            </button>
            <button
              type="button"
              className={styles.sumCard}
              data-sum="pending"
              onClick={() => setFilterStatus('pending')}
            >
              <span className={styles.sumVal}>{summaryCounts.pending}</span>
              <span className={styles.sumLabel}>제출</span>
            </button>
            <button
              type="button"
              className={styles.sumCard}
              data-sum="approved"
              onClick={() => setFilterStatus('approved')}
            >
              <span className={styles.sumVal}>{summaryCounts.approved}</span>
              <span className={styles.sumLabel}>승인</span>
            </button>
          </div>

          {/* List */}
          {loading ? (
            <div className={styles.loadingBox}>작업일지를 불러오는 중...</div>
          ) : error ? (
            <div className={styles.errorBox}>
              <div className={styles.errorTitle}>불러오기 실패</div>
              <div className={styles.errorDesc}>{error}</div>
            </div>
          ) : siteFilterId !== 'all' ? (
            !selectedSiteGroup ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <Search size={32} />
                </div>
                <p className={styles.emptyText}>선택한 현장을 찾을 수 없습니다</p>
              </div>
            ) : selectedSiteWorkLogs.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <Search size={32} />
                </div>
                <p className={styles.emptyText}>선택한 조건의 작업일지가 없습니다</p>
              </div>
            ) : (
              <>
                <section className={styles.detailSection}>
                  <div className={styles.secHeadRowTight}>
                    <div className={styles.secHeadLeft}>
                      <Calendar size={20} className={styles.secIcon} />
                      <span>
                        {selectedSiteGroup.siteName} 작업일지 ({selectedSiteWorkLogs.length}건)
                      </span>
                    </div>
                    <button
                      type="button"
                      className={styles.inlineDetailBtn}
                      onClick={() => openDetail(selectedSiteGroup.siteId)}
                    >
                      기록
                    </button>
                  </div>

                  <div className={styles.summaryLine}>
                    <span className={styles.summaryLabel}>기간</span>
                    <span className={styles.summaryValue}>
                      {(() => {
                        const range = getWorkLogPeriodRange(selectedSiteWorkLogs)
                        return formatPeriodLabel(range.from, range.to)
                      })()}
                    </span>
                  </div>

                  <div className={styles.summaryLine}>
                    <span className={styles.summaryLabel}>주소</span>
                    <span className={`${styles.summaryValue} ${styles.summaryTruncate}`}>
                      {(() => {
                        const addr =
                          (typeof selectedSiteGroup.latestLog?.siteAddress === 'string'
                            ? selectedSiteGroup.latestLog.siteAddress.trim()
                            : '') || getSiteAddressFromLogs(selectedSiteWorkLogs)
                        return addr || '-'
                      })()}
                    </span>
                  </div>

                  <div className={styles.worklogList}>
                    {selectedSiteWorkLogs.slice(0, visibleCount).map(log => (
                      <div key={log.id} className={styles.worklogCard}>
                        <div className={styles.worklogCardTop}>
                          <div className={styles.worklogDate}>작업일: {formatYmd(log.date)}</div>
                          <span className={styles.statusBadge} data-status={toUiStatus(log.status)}>
                            {getStatusLabel(toUiStatus(log.status))}
                          </span>
                        </div>

                        <div className={styles.worklogSummary}>
                          <div className={styles.worklogSummaryLine}>
                            <span className={styles.worklogSummaryLabel}>작성:</span>
                            <span className={styles.worklogSummaryValue}>
                              {String(log.author || '').trim() || '-'}
                            </span>
                            <span className={styles.worklogSummarySep}>ㅣ</span>
                            <span className={styles.worklogSummaryLabel}>작업:</span>
                            <span className={styles.worklogSummaryValue}>
                              {(() => {
                                const { workerName, manDays, workDays } = getPrimaryWorkerInfo(log)
                                return `${workerName}(${manDays}공수,${workDays}작업일)`
                              })()}
                            </span>
                          </div>

                          <div className={styles.worklogSummaryLineSecondary}>
                            {(() => {
                              const memberText = Array.from(new Set(log.memberTypes || [])).join(
                                ', '
                              )
                              const processText = Array.from(new Set(log.workProcesses || [])).join(
                                ', '
                              )
                              const typeText = Array.from(new Set(log.workTypes || [])).join(', ')
                              const loc = [
                                formatLocationPart(log.location?.block, '블록'),
                                formatLocationPart(log.location?.dong, '동'),
                                formatLocationPart(log.location?.unit, '층'),
                              ]
                                .filter(Boolean)
                                .join(' / ')

                              const items: Array<{ label: string; value: string }> = []
                              if (memberText) items.push({ label: '부재:', value: memberText })
                              if (processText) items.push({ label: '공정:', value: processText })
                              if (typeText) items.push({ label: '유형:', value: typeText })
                              if (loc) items.push({ label: '위치:', value: loc })

                              if (items.length === 0) return <span>-</span>

                              return items.flatMap((item, idx) => [
                                <React.Fragment key={`${item.label}-${idx}`}>
                                  <span className={styles.worklogSummaryLabel}>{item.label}</span>
                                  <span className={styles.worklogSummaryValue}>{item.value}</span>
                                  {idx < items.length - 1 ? (
                                    <span className={styles.worklogSummarySep}>ㅣ</span>
                                  ) : null}
                                </React.Fragment>,
                              ])
                            })()}
                          </div>
                        </div>

                        {toUiStatus(log.status) !== 'approved' ? (
                          <div className={styles.worklogActions}>
                            <button
                              type="button"
                              className={`${styles.worklogBtn} ${styles.worklogBtnGray}`}
                              disabled={actionBusyId === log.id}
                              onClick={() => {
                                try {
                                  const payload = buildPrefillFromWorkLog(log)
                                  localStorage.setItem('worklog_prefill', JSON.stringify(payload))
                                } catch {
                                  // ignore
                                }
                                router.push('/mobile')
                              }}
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              className={`${styles.worklogBtn} ${styles.worklogBtnDanger}`}
                              disabled={actionBusyId === log.id}
                              onClick={async () => {
                                if (
                                  !confirm(
                                    `작업일지를 삭제할까요?\n\n${selectedSiteGroup.siteName} / ${formatYmd(log.date)}`
                                  )
                                ) {
                                  return
                                }
                                setActionBusyId(log.id)
                                try {
                                  await deleteWorkLog(String(log.id))
                                  toast.success('삭제되었습니다.')
                                } catch (e: any) {
                                  toast.error(e?.message || '삭제에 실패했습니다.')
                                } finally {
                                  setActionBusyId(null)
                                }
                              }}
                            >
                              삭제
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>

                {selectedSiteWorkLogs.length > visibleCount ? (
                  <button
                    type="button"
                    className={styles.loadMore}
                    onClick={() => setVisibleCount(v => v + 20)}
                  >
                    더 보기
                  </button>
                ) : null}
              </>
            )
          ) : visibleGroups.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Search size={32} />
              </div>
              <p className={styles.emptyText}>검색 결과가 없습니다</p>
            </div>
          ) : (
            <>
              <div>
                {visibleGroups.map(group => {
                  const pinned = pinnedSites.has(group.siteId)
                  const summaryItems = buildCardSummaryItems(group.latestLog)
                  const totalWorkers = Number(group.latestLog?.totalWorkers || 0) || 0
                  const workerCount =
                    totalWorkers > 0
                      ? totalWorkers
                      : Array.from(
                          new Set(
                            (group.latestLog?.workers || []).map(w => w?.name).filter(Boolean)
                          )
                        ).length
                  const manDaysText = formatManDays(group.latestLog?.totalHours)
                  const photoCount =
                    group.latestLog?.attachments?.photos?.length ?? group.counts.photos
                  const drawingCount = countUnifiedDrawings(group.latestLog)

                  return (
                    <div
                      key={group.siteId}
                      className={`${styles.siteCard} ${pinned ? styles.pinned : ''} ${
                        group.status === 'reject' ? styles.reject : ''
                      }`}
                      role="button"
                      tabIndex={0}
                      onClick={() => openDetail(group.siteId)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') openDetail(group.siteId)
                      }}
                    >
                      <div className={styles.siteBadge} data-status={group.status}>
                        {getStatusLabel(group.status)}
                      </div>

                      <div className={styles.cardHeaderMain}>
                        <div className={styles.siteSubInfo}>
                          <div className={styles.siteSubLeft}>
                            <div className={styles.badgeRow}>
                              <span className={`${styles.subBadge} ${styles.subDept}`}>
                                {group.latestLog?.partnerCompanyName || '현장관리'}
                              </span>
                            </div>
                            <div className={styles.siteTitleRow}>
                              <div className={styles.siteTitleLeft}>
                                <span className={styles.siteName}>{group.siteName}</span>
                                <span className={styles.siteDate}>
                                  {formatYmd(group.latestDate || group.latestLog?.date)}
                                </span>
                              </div>

                              <div className={styles.cardActions}>
                                <button
                                  type="button"
                                  className={`${styles.iconBtn} ${pinned ? styles.iconBtnActive : ''}`}
                                  aria-label="상단 고정"
                                  onClick={e => {
                                    e.stopPropagation()
                                    togglePinned(group.siteId)
                                  }}
                                >
                                  <Pin size={18} />
                                </button>
                              </div>
                            </div>
                            <div className={styles.authorWorkerRow}>
                              <span className={styles.cardAuthor}>
                                <span className={styles.cardAuthorLabel}>작성:</span>
                                <span className={styles.cardAuthorValue}>
                                  {String(group.latestLog?.author || '').trim() || '-'}
                                </span>
                              </span>
                              <span className={styles.cardWorker}>
                                <span className={styles.cardWorkerLabel}>작업:</span>
                                <span className={styles.cardWorkerValue}>
                                  {(() => {
                                    const info = getPrimaryWorkerInfo(group.latestLog)
                                    const name = info.workerName || '-'
                                    const manDays = formatManDaysFixed1(group.latestLog?.totalHours)
                                    return `${name}(${manDays} 공수)`
                                  })()}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={styles.cardContent}>
                        {group.status === 'reject' && group.rejectReason ? (
                          <div className={styles.rejectReasonBox}>
                            <div className={styles.rejectReasonHeader}>
                              <AlertCircle size={16} />
                              <span>반려 사유</span>
                            </div>
                            <div className={styles.rejectReasonText}>{group.rejectReason}</div>
                          </div>
                        ) : null}

                        {summaryItems.length > 0 ? (
                          <div className={styles.workTextSummary}>
                            {summaryItems.map((item, idx) => (
                              <React.Fragment key={`${item.label}-${idx}`}>
                                <span className={styles.workTextLabel}>{item.label}</span>
                                <span className={styles.workTextValue}>{item.value}</span>
                                {idx < summaryItems.length - 1 ? (
                                  <span className={styles.workTextSep}>ㅣ</span>
                                ) : null}
                              </React.Fragment>
                            ))}
                          </div>
                        ) : null}

                        <div className={styles.statsRow}>
                          <div className={styles.statItem}>
                            <span className={styles.statValue}>{workerCount}</span>
                            <span className={styles.statLabel}>작업자수</span>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statValue}>{manDaysText}</span>
                            <span className={styles.statLabel}>공수</span>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statValue}>{photoCount}</span>
                            <span className={styles.statLabel}>사진수</span>
                          </div>
                          <div className={styles.statItem}>
                            <span className={styles.statValue}>{drawingCount}</span>
                            <span className={styles.statLabel}>도면수</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {filteredGroups.length > visibleCount ? (
                <button
                  type="button"
                  className={styles.loadMore}
                  onClick={() => setVisibleCount(v => v + 20)}
                >
                  더 보기
                </button>
              ) : null}
            </>
          )}
        </div>

        {/* Detail Panel */}
        <div
          className={`${styles.fmPanel} ${detailOpen ? styles.fmPanelActive : ''}`}
          role="dialog"
          aria-modal="true"
          aria-hidden={(!detailOpen).toString()}
        >
          <div className={styles.fmHeader}>
            <div style={{ width: 24 }} />
            <span className={styles.fmTitle}>작업일지기록</span>
            <button
              type="button"
              onClick={closeDetail}
              className={styles.fmCloseBtn}
              aria-label="닫기"
            >
              <X size={24} />
            </button>
          </div>

          <div className={styles.tabRow}>
            <button
              type="button"
              className={styles.detailTab}
              data-active={(detailTab === 'status').toString()}
              onClick={() => setDetailTab('status')}
            >
              작업현황
            </button>
            <button
              type="button"
              className={styles.detailTab}
              data-active={(detailTab === 'attachment').toString()}
              onClick={() => setDetailTab('attachment')}
            >
              첨부자료
            </button>
          </div>

          <div className={styles.fmBody}>{renderDetailBody()}</div>
          <div className={styles.stickyFooter}>{renderDetailFooter()}</div>
        </div>
      </div>
    </MobileLayoutShell>
  )
}

export default WorkLogHomePage2
// Verified at 14:30
