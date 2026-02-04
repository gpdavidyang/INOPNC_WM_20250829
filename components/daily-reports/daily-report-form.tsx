'use client'

import { UploadedDrawingsSection } from '@/components/admin/daily-reports/detail/UploadedDrawingsSection'
import { useRolePermissions } from '@/components/daily-reports/CollapsibleSection'
import { AdditionalPhotosSection } from '@/components/daily-reports/sections/AdditionalPhotosSection'
import { FormFooter } from '@/components/daily-reports/sections/FormFooter'
import { FormHeader } from '@/components/daily-reports/sections/FormHeader'
import { IssuesSection } from '@/components/daily-reports/sections/IssuesSection'
import { MaterialUsageSection } from '@/components/daily-reports/sections/MaterialUsageSection'
import { SiteInfoSection } from '@/components/daily-reports/sections/SiteInfoSection'
import { WorkContentSection } from '@/components/daily-reports/sections/WorkContentSection'
import { WorkforceSection } from '@/components/daily-reports/sections/WorkforceSection'
import { useLaborHourOptions } from '@/hooks/use-labor-hour-options'
import { useWorkOptions } from '@/hooks/use-work-options'
import { dailyReportApi } from '@/lib/api/daily-reports'
import { fetchSignedUrlForRecord } from '@/lib/files/preview'
import {
  FALLBACK_LABOR_HOUR_DEFAULT,
  FALLBACK_LABOR_HOUR_OPTIONS,
  normalizeLaborHourOptions,
} from '@/lib/labor/labor-hour-options'
import type { Profile } from '@/types'
import { AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useAdditionalPhotos } from './hooks/useAdditionalPhotos'
import { useDailyReportSite } from './hooks/useDailyReportSite'
import { useFormSections } from './hooks/useFormSections'
import { useFormUI } from './hooks/useFormUI'
import { useMaterialInventory } from './hooks/useMaterialInventory'
import { useMaterialOptions } from './hooks/useMaterialOptions'
import { useMaterialUsageEntries } from './hooks/useMaterialUsageEntries'
import { useWorkEntries } from './hooks/useWorkEntries'
import { useWorkerEntries } from './hooks/useWorkerEntries'
import { useWorklogDrawings } from './hooks/useWorklogDrawings'
import type { DailyReportFormProps, MaterialOptionItem } from './types'
import { DEFAULT_MATERIAL_UNIT } from './types'
import {
  buildAdditionalPhotosFromReport,
  buildFormDataFromReport,
  buildMaterialUsageEntriesFromReport,
  buildWorkEntriesFromReport,
  buildWorkerEntriesFromReport,
  createReportKey,
  mapMaterialToOption,
  sanitizeUnitLabel,
} from './utils/builders'
import {
  buildMaterialUsagePayload,
  buildWorkerEntriesPayload,
  resolveReportMetadata,
} from './utils/payloads'

const STATUS_LABEL: Record<string, string> = {
  draft: '임시',
  submitted: '제출',
  approved: '승인',
  rejected: '반려',
  completed: '완료',
  revision: '수정 필요',
  archived: '보관됨',
}

const formatLaborHourLabel = (value: number) =>
  Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)

const ORGANIZATION_UNASSIGNED_LABEL = '소속사 미지정'
const ORGANIZATION_UNKNOWN_LABEL = '소속사 정보 없음'

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

  const [formData, setFormData] = useState(() =>
    buildFormDataFromReport(mode, reportData, currentUser)
  )
  const { filteredSites, selectedSiteId, selectedSiteRecord } = useDailyReportSite(
    sites,
    formData,
    reportData,
    initialUnifiedReport,
    setFormData
  )

  const {
    materialInventory,
    loading: materialInventoryLoading,
    error: materialInventoryError,
  } = useMaterialInventory(selectedSiteId)

  const { expandedSections, allExpanded, toggleSection, toggleAllSections } = useFormSections(
    permissions.canManageWorkers,
    permissions.canViewAdvancedFeatures
  )

  const [reportHydrationKey, setReportHydrationKey] = useState<string | null>(() =>
    mode === 'edit' ? createReportKey(reportData) : null
  )

  const reportIdForDeepLink = useMemo(() => {
    if (mode === 'edit' && reportData?.id) return String(reportData.id)
    return null
  }, [mode, reportData])

  const reportSiteIdForDeepLink = useMemo(() => {
    const reportSiteId = (reportData as any)?.site_id
    return initialUnifiedReport?.siteId || reportSiteId || selectedSiteId || ''
  }, [initialUnifiedReport?.siteId, reportData, selectedSiteId])

  const { drawings: worklogDrawings, setDrawings: setWorklogDrawings } = useWorklogDrawings(
    mode,
    permissions.isAdmin,
    reportIdForDeepLink,
    reportSiteIdForDeepLink,
    initialUnifiedReport?.attachments?.drawings
  )

  const drawingManagementHref = useMemo(() => {
    const params = new URLSearchParams()
    if (reportSiteIdForDeepLink) params.set('site_id', String(reportSiteIdForDeepLink))
    if (reportIdForDeepLink) params.set('report_id', String(reportIdForDeepLink))
    params.set('tab', 'list')
    return `/dashboard/admin/documents/markup?${params.toString()}`
  }, [reportIdForDeepLink, reportSiteIdForDeepLink])

  const handleDrawingDownload = useCallback(async (url: string, filename: string) => {
    if (!url) return
    try {
      const signedUrl = await fetchSignedUrlForRecord(
        { file_url: url, file_name: filename },
        { downloadName: filename }
      )
      const anchor = window.document.createElement('a')
      anchor.href = signedUrl
      anchor.rel = 'noopener noreferrer'
      anchor.click()
    } catch (error: any) {
      toast.error(error?.message || '파일 다운로드에 실패했습니다.')
    }
  }, [])

  const handleDrawingPreview = useCallback((url: string) => {
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [])

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
    const siteName = selectedSiteRecord?.name || ''
    const isGangnamA = siteName.includes('강남 A현장')

    if (isGangnamA && allowedLaborHours.includes(1.0)) return 1.0
    const preferred = 1.0
    if (allowedLaborHours.includes(preferred)) return preferred
    const positive = allowedLaborHours.find(value => value > 0)
    return typeof positive === 'number'
      ? positive
      : (allowedLaborHours[0] ?? FALLBACK_LABOR_HOUR_DEFAULT)
  }, [allowedLaborHours, selectedSiteRecord?.name])

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

  const selectedOrganizationLabel = useMemo(() => {
    if (!selectedSiteRecord) return ORGANIZATION_UNASSIGNED_LABEL
    const record: any = selectedSiteRecord
    const organizationName =
      record.organization_name || record.organizations?.name || record.organization?.name || ''
    if (organizationName) return organizationName
    return record.organization_id ? ORGANIZATION_UNKNOWN_LABEL : ORGANIZATION_UNASSIGNED_LABEL
  }, [selectedSiteRecord])

  const { componentTypes, processTypes, loading: optionsLoading } = useWorkOptions()

  const [approvalLoading, setApprovalLoading] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const handleStatusChange = async (action: 'approve' | 'revert' | 'reject', reason?: string) => {
    if (!reportData?.id) return
    setApprovalLoading(true)
    try {
      const data = await dailyReportApi.updateStatus(String(reportData.id), action, reason)
      toast.success(data.message || '작업일지 상태를 변경했습니다.')
      setRejecting(false)
      setRejectionReason('')
      router.refresh()
    } catch (error) {
      toast.error((error as Error)?.message || '상태 변경 중 오류가 발생했습니다.')
    } finally {
      setApprovalLoading(false)
    }
  }

  const { workEntries, setWorkEntries, addWorkEntry, handleRemoveWork } = useWorkEntries(
    mode,
    reportData
  )

  const {
    workerEntries,
    setWorkerEntries,
    totalLaborHours: totalLaborHoursFromEntries,
    addWorkerEntry,
    handleRemoveWorker,
  } = useWorkerEntries(
    mode,
    reportData,
    workers,
    permissions.canManageWorkers,
    coerceLaborHourValue,
    isAllowedLaborHourValue,
    defaultLaborHour
  )

  const { materialOptions, getDefaultOption } = useMaterialOptions(materials, mapMaterialToOption)

  const { materialUsageEntries, setMaterialUsageEntries, addMaterialEntry, handleRemoveMaterial } =
    useMaterialUsageEntries(
      mode,
      reportData,
      materialOptions,
      getDefaultOption,
      DEFAULT_MATERIAL_UNIT
    )

  const materialOptionMap = useMemo(() => {
    const map = new Map<string, MaterialOptionItem>()
    materialOptions.forEach(option => {
      map.set(option.id, option)
    })
    return map
  }, [materialOptions])

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

  const { additionalPhotos, setAdditionalPhotos } = useAdditionalPhotos(mode, reportData)

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
  }, [mode, reportData, currentUser, permissions.canManageWorkers, reportHydrationKey])

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

  const [createdByUserId, setCreatedByUserId] = useState<string>(() => {
    const raw = (reportData as any)?.created_by || formData.created_by || ''
    const byId = userOptions.find(u => u.id === raw)?.id
    if (byId) return byId
    const byName = userOptions.find(u => u.name === raw)?.id
    return byName || String((currentUser as any).id || '')
  })

  const { getPageTitle, getBreadcrumb, getRoleIcon } = useFormUI(mode, permissions)

  const handleSubmit = async (isDraft = false) => {
    try {
      setLoading(true)
      setLoadingType(isDraft ? 'draft' : 'submit')
      setError(null)

      const materialUsagePayload = buildMaterialUsagePayload(materialUsageEntries)

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

      const { memberName, processType, workSection } = resolveReportMetadata(
        workEntries[0],
        formData,
        reportData
      )

      const workerEntriesPayload = buildWorkerEntriesPayload(
        workerEntries,
        workers,
        isAllowedLaborHourValue,
        permissions.canManageWorkers
      )

      const effectiveSiteId = selectedSiteId
      if (!effectiveSiteId) {
        throw new Error('현장 정보가 비어 있어 저장할 수 없습니다.')
      }

      const additionalPhotosPayload = additionalPhotos
        .map(photo => ({
          id: photo.id,
          file_url: photo.url,
          description: photo.description || null,
        }))
        .filter(p => Boolean(p.file_url))

      const submitData: Record<string, any> = {
        id: reportData?.id,
        site_id: effectiveSiteId,
        partner_company_id: formData.partner_company_id || null,
        work_date: formData.work_date,
        created_by: createdByUserId || undefined,
        member_name: memberName,
        process_type: processType,
        component_name: memberName,
        work_process: processType,
        work_section: workSection,
        total_workers: Number(formData.total_workers ?? 0) || 0,
        total_labor_hours: totalLaborHoursFromEntries,
        npc1000_incoming: Number(formData.npc1000_incoming ?? 0) || 0,
        npc1000_used: Number(formData.npc1000_used ?? 0) || 0,
        npc1000_remaining: Number(formData.npc1000_remaining ?? 0) || 0,
        issues: (formData.issues || '').trim() || null,
        hq_request: (formData.hq_request || '').trim() || null,
        status: isDraft ? 'draft' : 'submitted',
        work_entries: workEntries,
        worker_entries: workerEntriesPayload,
        material_usage: materialUsagePayload,
        additional_photos: additionalPhotosPayload,
      }

      if (mode === 'edit' && reportData) {
        try {
          await dailyReportApi.updateReport(String(reportData.id), submitData)
          toast.success(`작업일지가 ${isDraft ? '임시 상태로 저장' : '제출'}되었습니다.`)
          router.push(getBreadcrumb())
        } catch (err: any) {
          if (err.status === 409) {
            const existingId = err.existingId
            setError(err.message || '중복된 작업일지가 있습니다.')
            toast.error(err.message || '중복된 작업일지가 있습니다.', {
              action: existingId
                ? {
                    label: '해당 일지로 이동',
                    onClick: () => router.push(`/dashboard/admin/daily-reports/${existingId}`),
                  }
                : undefined,
            })
          } else {
            setError(err.message || '작업일지 저장에 실패했습니다.')
            toast.error(err.message || '작업일지 저장에 실패했습니다.')
          }
        }
      } else {
        try {
          await dailyReportApi.createReport(submitData)
          toast.success(`작업일지가 ${isDraft ? '임시 상태로 저장' : '제출'}되었습니다.`)
          router.push(getBreadcrumb())
        } catch (err: any) {
          if (err.status === 409) {
            const existingId = err.existingId
            setError(err.message || '중복된 작업일지가 있습니다.')
            toast.error(err.message || '중복된 작업일지가 있습니다.', {
              action: existingId
                ? {
                    label: '해당 일지로 이동',
                    onClick: () => router.push(`/dashboard/admin/daily-reports/${existingId}`),
                  }
                : undefined,
            })
          } else {
            setError(err.message || '작업일지 저장에 실패했습니다.')
            toast.error(err.message || '작업일지 저장에 실패했습니다.')
          }
        }
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

  React.useEffect(() => {
    const handler = () => toggleAllSections()
    window.addEventListener('toggle-all-sections', handler)
    return () => window.removeEventListener('toggle-all-sections', handler)
  }, [])

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <FormHeader
        mode={mode}
        reportData={reportData}
        getBreadcrumb={getBreadcrumb}
        getPageTitle={getPageTitle}
        getRoleIcon={getRoleIcon}
        STATUS_LABEL={STATUS_LABEL}
        allExpanded={allExpanded}
        toggleAllSections={toggleAllSections}
        hideHeader={hideHeader}
      />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="bg-rose-100 p-2 rounded-xl">
              <AlertCircle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <h4 className="text-sm font-black text-rose-900 tracking-tight">
                저장 중 오류가 발생했습니다
              </h4>
              <p className="text-rose-600 text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <SiteInfoSection
            formData={formData}
            setFormData={setFormData}
            filteredSites={filteredSites}
            selectedOrganizationLabel={selectedOrganizationLabel}
            isExpanded={expandedSections.siteInfo}
            onToggle={() => toggleSection('siteInfo')}
            permissions={permissions}
          />

          <WorkContentSection
            workEntries={workEntries}
            setWorkEntries={setWorkEntries}
            componentTypes={componentTypes}
            processTypes={processTypes}
            isExpanded={expandedSections.workContent}
            onToggle={() => toggleSection('workContent')}
            permissions={permissions}
          />

          <WorkforceSection
            workerEntries={workerEntries}
            setWorkerEntries={setWorkerEntries}
            workers={workers}
            isExpanded={expandedSections.workers}
            onToggle={() => toggleSection('workers')}
            permissions={permissions}
            defaultLaborHour={defaultLaborHour}
            allowedLaborHours={allowedLaborHours}
            isAllowedLaborHourValue={isAllowedLaborHourValue}
            formatLaborHourLabel={formatLaborHourLabel}
            coerceLaborHourValue={coerceLaborHourValue}
          />

          <MaterialUsageSection
            materialUsageEntries={materialUsageEntries}
            setMaterialUsageEntries={setMaterialUsageEntries}
            materialOptions={materialOptions}
            materialOptionMap={materialOptionMap}
            materialInventory={materialInventory}
            materialInventoryLoading={materialInventoryLoading}
            materialInventoryError={materialInventoryError}
            isExpanded={expandedSections.materials}
            onToggle={() => toggleSection('materials')}
            permissions={permissions}
            addMaterialEntry={addMaterialEntry}
            handleRemoveMaterial={handleRemoveMaterial}
            handleMaterialSelect={handleMaterialSelect}
            handleMaterialQuantityChange={handleMaterialQuantityChange}
            handleMaterialUnitChange={handleMaterialUnitChange}
            handleMaterialNoteChange={handleMaterialNoteChange}
          />

          <AdditionalPhotosSection
            photos={additionalPhotos}
            setPhotos={setAdditionalPhotos}
            isExpanded={expandedSections.additionalPhotos}
            onToggle={() => toggleSection('additionalPhotos')}
            permissions={permissions}
          />

          <IssuesSection
            formData={formData}
            setFormData={setFormData}
            isExpanded={expandedSections.specialNotes}
            onToggle={() => toggleSection('specialNotes')}
            permissions={permissions}
          />

          {mode === 'edit' && permissions.isAdmin && (
            <UploadedDrawingsSection
              className="mt-6"
              drawings={worklogDrawings}
              managementHref={drawingManagementHref}
              onPreview={handleDrawingPreview}
              onDownload={handleDrawingDownload}
              isExpanded={expandedSections.drawings}
              onToggle={() => toggleSection('drawings')}
            />
          )}
        </div>

        <FormFooter
          mode={mode}
          reportData={reportData}
          error={error}
          loading={loading}
          loadingType={loadingType}
          approvalLoading={approvalLoading}
          rejecting={rejecting}
          setRejecting={setRejecting}
          rejectionReason={rejectionReason}
          setRejectionReason={setRejectionReason}
          handleStatusChange={handleStatusChange}
          handleSubmit={handleSubmit}
          getBreadcrumb={getBreadcrumb}
          permissions={permissions}
        />
      </div>
    </div>
  )
}
