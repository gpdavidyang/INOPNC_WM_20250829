'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  WorkLog,
  MemberType,
  WorkProcess,
  WorkType,
  WorkerHours,
  MaterialUsageEntry,
} from '../../types/work-log.types'
import { FileUploadSection } from './FileUploadSection'
import type {
  MemberType as MType,
  WorkProcess as WProc,
  WorkType as WType,
} from '../../types/work-log.types'
import { cn } from '@/lib/utils'
import { useWorkOptions } from '@/hooks/use-work-options'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { DrawingBrowser } from '@/modules/mobile/components/markup/DrawingBrowser'
import {
  CustomSelect,
  CustomSelectTrigger,
  CustomSelectValue,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectGroup,
  CustomSelectLabel,
  CustomSelectSeparator,
} from '@/components/ui/custom-select'

interface WorkLogModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (workLog: Partial<WorkLog>) => Promise<void>
  workLog?: WorkLog
  mode: 'create' | 'edit' | 'view'
}

// Dynamic options from admin settings; fallback to defaults when unavailable
const DEFAULT_MEMBER_TYPES: string[] = ['슬라브', '거더', '기둥']
const DEFAULT_WORK_PROCESSES: string[] = ['균열', '면', '마감']
const ensureOther = (arr: string[]) => (arr.includes('기타') ? arr : [...arr, '기타'])
const workTypeOptions: WorkType[] = ['지하', '지상', '지붕', '기타']

const ROLE_LABELS: Record<'worker' | 'site_manager', string> = {
  worker: '작업자',
  site_manager: '현장관리자',
}

const createInitialFormData = (source?: WorkLog): Partial<WorkLog> => ({
  date: source?.date || new Date().toISOString().split('T')[0],
  siteId: source?.siteId || '',
  siteName: source?.siteName || '',
  status: source?.status || 'draft',
  memberTypes: source?.memberTypes || [],
  workProcesses: source?.workProcesses || [],
  workTypes: source?.workTypes || [],
  location: source?.location || { block: '', dong: '', unit: '' },
  workers: source?.workers || [],
  totalHours: source?.totalHours || 0,
  materials: source?.materials ? [...source.materials] : [],
  attachments:
    source?.attachments ||
    ({ photos: [], drawings: [], confirmations: [] } as WorkLog['attachments']),
  progress: source?.progress ?? 0,
  notes: source?.notes || '',
})

export const WorkLogModal: React.FC<WorkLogModalProps> = ({
  isOpen,
  onClose,
  onSave,
  workLog,
  mode,
}) => {
  const { componentTypes, processTypes } = useWorkOptions()
  const memberTypeOptions = useMemo(
    () => ensureOther((componentTypes?.map(o => o.option_label) || DEFAULT_MEMBER_TYPES).slice()),
    [componentTypes]
  )
  const workProcessOptions = useMemo(
    () => ensureOther((processTypes?.map(o => o.option_label) || DEFAULT_WORK_PROCESSES).slice()),
    [processTypes]
  )
  const [formData, setFormData] = useState<Partial<WorkLog>>(createInitialFormData(workLog))
  const [newWorker, setNewWorker] = useState<WorkerHours>({ id: '', name: '', hours: 0 })
  const [tasks, setTasks] = useState<
    Array<{
      memberTypes: MType[]
      workProcesses: WProc[]
      workTypes: WType[]
      location: { block: string; dong: string; unit: string }
    }>
  >([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [userOptions, setUserOptions] = useState<
    Array<{ id: string; name: string; role?: string }>
  >([])
  const [linkedDrawings, setLinkedDrawings] = useState<
    Array<{ id: string; title: string; linkedWorklogIds: string[] }>
  >([])
  const [loadingLinks, setLoadingLinks] = useState(false)
  const [showDrawingPicker, setShowDrawingPicker] = useState(false)
  const [linkingDocId, setLinkingDocId] = useState<string | null>(null)
  const [detachingDocId, setDetachingDocId] = useState<string | null>(null)
  const { toast } = useToast()

  const groupedUserOptions = useMemo(() => {
    const workerGroup = userOptions.filter(option => option.role !== 'site_manager')
    const managerGroup = userOptions.filter(option => option.role === 'site_manager')
    const groups: Array<{
      key: 'worker' | 'site_manager'
      label: string
      options: Array<{ id: string; name: string; role?: string }>
    }> = []
    if (workerGroup.length > 0) {
      groups.push({ key: 'worker', label: ROLE_LABELS.worker, options: workerGroup })
    }
    if (managerGroup.length > 0) {
      groups.push({ key: 'site_manager', label: ROLE_LABELS.site_manager, options: managerGroup })
    }
    return groups
  }, [userOptions])

  const isViewMode = mode === 'view'

  useEffect(() => {
    if (isOpen) {
      setFormData(createInitialFormData(workLog))
      setTasks((workLog?.tasks as any) || [])
      setErrors({})
      setNewWorker({ id: '', name: '', hours: 0 })
      setLinkedDrawings([])
      setLoadingLinks(false)
    }
  }, [isOpen, workLog])

  useEffect(() => {
    const total = formData.workers?.reduce((sum, worker) => sum + worker.hours, 0) || 0
    setFormData(prev => ({ ...prev, totalHours: total }))
  }, [formData.workers])

  // Load selectable users (profiles) for 작성자 선택
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .in('role', ['worker', 'site_manager'])
          .order('full_name', { ascending: true })

        if (error) {
          console.warn('[WorkLogModal] Failed to fetch user list:', error.message)
          return
        }

        const options = (data || []).map((p: any) => ({
          id: p.id,
          name: p.full_name || '이름없음',
          role: p.role || undefined,
        }))
        setUserOptions(options)
      } catch (e: any) {
        console.warn('[WorkLogModal] Unexpected error while fetching users:', e?.message)
      }
    }

    if (isOpen) fetchUsers()
  }, [isOpen])

  const fetchLinkedDocs = useCallback(async () => {
    if (!workLog?.id || mode === 'create') return
    setLoadingLinks(true)
    try {
      const res = await fetch(`/api/markup-documents?worklogId=${encodeURIComponent(workLog.id)}`)
      const json = await res.json().catch(() => ({}))
      const arr = Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.documents)
          ? json.documents
          : []
      const mapped = arr.map((doc: any) => ({
        id: doc.id,
        title: doc.title || '도면',
        linkedWorklogIds:
          Array.isArray(doc.linked_worklog_ids) && doc.linked_worklog_ids.length > 0
            ? doc.linked_worklog_ids.filter(
                (value: unknown): value is string => typeof value === 'string' && value.length > 0
              )
            : doc.linked_worklog_id
              ? [doc.linked_worklog_id]
              : [workLog.id],
      }))
      setLinkedDrawings(mapped)
    } catch {
      setLinkedDrawings([])
    } finally {
      setLoadingLinks(false)
    }
  }, [mode, workLog?.id])

  useEffect(() => {
    if (isOpen) {
      void fetchLinkedDocs()
    }
  }, [fetchLinkedDocs, isOpen])

  const hasWorkerError = Boolean(errors.workers)
  const materialEntries = formData.materials || []

  const handleAddTaskSet = () => {
    if (isViewMode) return
    // 클릭 시 새로운 빈 작업 세트 입력 섹션을 추가
    setTasks(prev => [
      ...prev,
      {
        memberTypes: [],
        workProcesses: [],
        workTypes: [],
        location: { block: '', dong: '', unit: '' },
      },
    ])
  }

  const updateTaskAt = (
    index: number,
    updater: (t: {
      memberTypes: MType[]
      workProcesses: WProc[]
      workTypes: WType[]
      location: { block: string; dong: string; unit: string }
    }) => {
      memberTypes: MType[]
      workProcesses: WProc[]
      workTypes: WType[]
      location: { block: string; dong: string; unit: string }
    }
  ) => {
    setTasks(prev => prev.map((t, i) => (i === index ? updater(t) : t)))
  }

  const toggleTaskArrayValue = (
    index: number,
    field: 'memberTypes' | 'workProcesses' | 'workTypes',
    value: MType | WProc | WType
  ) => {
    if (isViewMode) return
    updateTaskAt(index, t => {
      const arr = t[field] as (MType | WProc | WType)[]
      const exists = arr.includes(value)
      const next = exists ? (arr.filter(v => v !== value) as any) : ([...arr, value] as any)
      return { ...t, [field]: next } as any
    })
  }

  const validateForm = (status: 'draft' | 'submitted') => {
    const nextErrors: Record<string, string> = {}

    if (!formData.date) nextErrors.date = '작업일자를 선택해주세요.'
    if (!formData.siteId) nextErrors.site = '현장을 선택해주세요.'

    if (status === 'submitted') {
      if (!formData.memberTypes || formData.memberTypes.length === 0) {
        nextErrors.memberTypes = '부재명을 선택해주세요.'
      }
      if (!formData.workProcesses || formData.workProcesses.length === 0) {
        nextErrors.workProcesses = '작업공정을 선택해주세요.'
      }
      if (!formData.workTypes || formData.workTypes.length === 0) {
        nextErrors.workTypes = '작업공간을 선택해주세요.'
      }
      if (!formData.location?.block) nextErrors.block = '블럭을 입력해주세요.'
      if (!formData.location?.dong) nextErrors.dong = '동을 입력해주세요.'
      if (!formData.location?.unit) nextErrors.unit = '호수를 입력해주세요.'
      if (!formData.workers || formData.workers.length === 0) {
        nextErrors.workers = '작업자를 추가해주세요.'
      }
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleToggleArrayValue = (
    field: 'memberTypes' | 'workProcesses' | 'workTypes',
    value: MemberType | WorkProcess | WorkType
  ) => {
    if (isViewMode) return
    setFormData(prev => {
      const current = prev[field] || []
      const exists = current.includes(value)
      const updated = exists ? current.filter(item => item !== value) : [...current, value]
      return { ...prev, [field]: updated }
    })
  }

  const handleAddWorker = () => {
    if (isViewMode) return
    if (!newWorker.name || newWorker.hours <= 0) return

    const workerId = newWorker.id || `w-${Date.now()}`
    setFormData(prev => ({
      ...prev,
      workers: [...(prev.workers || []), { ...newWorker, id: workerId }],
    }))
    setNewWorker({ id: '', name: '', hours: 0 })
  }

  const handleRemoveWorker = (workerId: string) => {
    if (isViewMode) return
    setFormData(prev => ({
      ...prev,
      workers: prev.workers?.filter(worker => worker.id !== workerId) || [],
    }))
  }

  const handleAddMaterial = () => {
    if (isViewMode) return
    setFormData(prev => ({
      ...prev,
      materials: [
        ...(prev.materials || []),
        { material_name: '', material_code: null, quantity: 0, unit: '', notes: '' },
      ],
    }))
  }

  const handleMaterialChange = (index: number, field: keyof MaterialUsageEntry, value: string) => {
    if (isViewMode) return
    setFormData(prev => {
      const current = [...(prev.materials || [])]
      if (!current[index]) {
        current[index] = {
          material_name: '',
          material_code: null,
          quantity: 0,
          unit: '',
          notes: '',
        }
      }
      const entry = { ...current[index] }

      if (field === 'quantity') {
        const numeric = Number(value)
        entry.quantity = Number.isFinite(numeric) ? numeric : 0
      } else if (field === 'material_code') {
        entry.material_code = value || null
      } else if (field === 'material_name') {
        entry.material_name = value
      } else if (field === 'unit') {
        entry.unit = value
      } else if (field === 'notes') {
        entry.notes = value
      }

      current[index] = entry
      return { ...prev, materials: current }
    })
  }

  const handleRemoveMaterialEntry = (index: number) => {
    if (isViewMode) return
    setFormData(prev => ({
      ...prev,
      materials: (prev.materials || []).filter((_, i) => i !== index),
    }))
  }

  const handleSave = async (targetStatus: 'draft' | 'submitted') => {
    if (isViewMode) {
      onClose()
      return
    }

    if (!validateForm(targetStatus)) {
      return
    }

    try {
      setLoading(true)
      // base 그룹(formData) + 추가 작업 세트(tasks)를 결합하여 전달
      const baseTask = {
        memberTypes: (formData.memberTypes || []) as MType[],
        workProcesses: (formData.workProcesses || []) as WProc[],
        workTypes: (formData.workTypes || []) as WType[],
        location: formData.location || { block: '', dong: '', unit: '' },
      }
      const combinedTasks = [baseTask, ...tasks]
      const sanitizedMaterials = materialEntries
        .filter(entry => entry.material_name && entry.material_name.trim())
        .map(entry => ({
          ...entry,
          quantity: Number(entry.quantity) || 0,
          unit: entry.unit || null,
          notes: entry.notes || undefined,
          material_code: entry.material_code || null,
        }))

      await onSave({
        ...formData,
        status: targetStatus,
        tasks: combinedTasks as any,
        materials: sanitizedMaterials,
      })
      onClose()
    } catch (error) {
      console.error('Failed to save work log:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenMarkupTool = useCallback(
    (docId?: string) => {
      const resolvedSiteId = formData.siteId || workLog?.siteId || ''
      if (!workLog?.id || !resolvedSiteId) {
        toast({
          title: '현장을 먼저 선택해주세요.',
          description: '현장 정보가 있어야 도면 마킹을 연결할 수 있습니다.',
          variant: 'destructive',
        })
        return
      }
      const params = new URLSearchParams()
      params.set('worklogId', workLog.id)
      params.set('siteId', resolvedSiteId)
      params.set('mode', docId ? 'start' : 'browse')
      if (docId) params.set('docId', docId)
      const url = `/mobile/markup-tool?${params.toString()}`
      window.open(url, '_blank', 'noopener,noreferrer')
    },
    [formData.siteId, toast, workLog]
  )

  const handleAttachMarkup = useCallback(
    async (docId: string) => {
      if (!workLog?.id) return
      setLinkingDocId(docId)
      try {
        const detailRes = await fetch(`/api/markup-documents/${docId}`, { cache: 'no-store' })
        const detailJson = await detailRes.json().catch(() => ({}))
        if (!detailRes.ok || !detailJson?.data) {
          throw new Error(detailJson?.error || '도면 정보를 불러오지 못했습니다.')
        }
        const current: string[] = Array.isArray(detailJson.data.linked_worklog_ids)
          ? detailJson.data.linked_worklog_ids
          : detailJson.data.linked_worklog_id
            ? [detailJson.data.linked_worklog_id]
            : []
        const next = Array.from(new Set([...current, workLog.id]))
        const patchRes = await fetch(`/api/markup-documents/${docId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ linked_worklog_ids: next }),
        })
        const patchJson = await patchRes.json().catch(() => ({}))
        if (!patchRes.ok || patchJson?.error) {
          throw new Error(patchJson?.error || '작업일지 연결에 실패했습니다.')
        }
        toast({
          title: '도면이 연결되었습니다.',
          description: '작업일지에 도면 마킹을 추가했습니다.',
        })
        setShowDrawingPicker(false)
        await fetchLinkedDocs()
      } catch (error) {
        toast({
          title: '연결 실패',
          description: error instanceof Error ? error.message : '도면을 연결하지 못했습니다.',
          variant: 'destructive',
        })
      } finally {
        setLinkingDocId(null)
      }
    },
    [fetchLinkedDocs, toast, workLog]
  )

  const handleDetachMarkup = useCallback(
    async (docId: string) => {
      if (!workLog?.id) return
      const target = linkedDrawings.find(doc => doc.id === docId)
      if (!target) return
      setDetachingDocId(docId)
      try {
        const remaining = target.linkedWorklogIds.filter(id => id !== workLog.id)
        const patchRes = await fetch(`/api/markup-documents/${docId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ linked_worklog_ids: remaining }),
        })
        const patchJson = await patchRes.json().catch(() => ({}))
        if (!patchRes.ok || patchJson?.error) {
          throw new Error(patchJson?.error || '연결을 해제하지 못했습니다.')
        }
        toast({
          title: '연결 해제 완료',
          description: '도면 마킹 연결이 해제되었습니다.',
        })
        await fetchLinkedDocs()
      } catch (error) {
        toast({
          title: '해제 실패',
          description: error instanceof Error ? error.message : '연결을 해제하지 못했습니다.',
          variant: 'destructive',
        })
      } finally {
        setDetachingDocId(null)
      }
    },
    [fetchLinkedDocs, linkedDrawings, toast, workLog]
  )

  const handleDrawingSelection = useCallback(
    (drawing: any) => {
      if (!drawing) return
      if (drawing.source === 'markup' && drawing.id) {
        void handleAttachMarkup(drawing.id)
        return
      }
      handleOpenMarkupTool(drawing.id)
    },
    [handleAttachMarkup, handleOpenMarkupTool]
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4 gap-3">
          <h2 className="text-lg font-semibold text-[#1A254F]">
            {mode === 'create' && '작업일지 작성'}
            {mode === 'edit' && '작업일지 수정'}
            {mode === 'view' && '작업일지 상세'}
          </h2>
          {!isViewMode && (
            <a
              href={`/documents/hub${formData.siteId ? `?siteId=${formData.siteId}` : ''}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[#cbd5e1] px-3 py-1.5 text-xs font-semibold text-[#1A254F] hover:bg-gray-50"
            >
              현장공유함 이동
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#667085] transition-colors hover:bg-gray-100"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {/* 상단 섹션 제목 + 추가 버튼 */}
          <div className="flex items-center mb-3">
            <h3 className="text-base font-semibold text-[#1A254F]">작업 내용 기록</h3>
            {!isViewMode && (
              <button
                type="button"
                onClick={handleAddTaskSet}
                className="ml-auto rounded-full border border-[#cbd5e1] px-3 py-1.5 text-sm font-semibold text-[#1A254F] hover:bg-gray-50"
              >
                추가
              </button>
            )}
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#475467]">작업일자 *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  disabled={isViewMode}
                  className={cn(
                    'mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-[#1A254F] focus:outline-none focus:ring-1 focus:ring-[#1A254F]',
                    errors.date ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  )}
                />
                {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#475467]">현장 *</label>
                <select
                  value={formData.siteId}
                  onChange={e => {
                    const option = e.target.options[e.target.selectedIndex]
                    setFormData(prev => ({
                      ...prev,
                      siteId: e.target.value,
                      siteName: option.text,
                    }))
                  }}
                  disabled={isViewMode}
                  className={cn(
                    'mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-[#1A254F] focus:outline-none focus:ring-1 focus:ring-[#1A254F]',
                    errors.site ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  )}
                >
                  <option value="">현장 선택</option>
                  <option value="site-1">삼성전자 평택캠퍼스 P3</option>
                  <option value="site-2">LG디스플레이 파주공장</option>
                  <option value="site-3">현대자동차 울산공장</option>
                </select>
                {errors.site && <p className="mt-1 text-xs text-red-500">{errors.site}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#475467]">부재명 *</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {memberTypeOptions.map(type => {
                    const active = (formData.memberTypes as any)?.includes(type)
                    return (
                      <button
                        key={type}
                        type="button"
                        disabled={isViewMode}
                        onClick={() => handleToggleArrayValue('memberTypes', type as any)}
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                          active
                            ? 'bg-[#1A254F] text-white'
                            : 'border border-gray-300 text-[#475467] hover:border-[#1A254F] hover:text-[#1A254F]'
                        )}
                      >
                        {type}
                      </button>
                    )
                  })}
                </div>
                {errors.memberTypes && (
                  <p className="mt-1 text-xs text-red-500">{errors.memberTypes}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#475467]">작업공정 *</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {workProcessOptions.map(type => {
                    const active = (formData.workProcesses as any)?.includes(type)
                    return (
                      <button
                        key={type}
                        type="button"
                        disabled={isViewMode}
                        onClick={() => handleToggleArrayValue('workProcesses', type as any)}
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                          active
                            ? 'bg-[#1A254F] text-white'
                            : 'border border-gray-300 text-[#475467] hover:border-[#1A254F] hover:text-[#1A254F]'
                        )}
                      >
                        {type}
                      </button>
                    )
                  })}
                </div>
                {errors.workProcesses && (
                  <p className="mt-1 text-xs text-red-500">{errors.workProcesses}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#475467]">작업공간 *</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {workTypeOptions.map(type => {
                    const active = formData.workTypes?.includes(type)
                    return (
                      <button
                        key={type}
                        type="button"
                        disabled={isViewMode}
                        onClick={() => handleToggleArrayValue('workTypes', type)}
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                          active
                            ? 'bg-[#1A254F] text-white'
                            : 'border border-gray-300 text-[#475467] hover:border-[#1A254F] hover:text-[#1A254F]'
                        )}
                      >
                        {type}
                      </button>
                    )
                  })}
                </div>
                {errors.workTypes && (
                  <p className="mt-1 text-xs text-red-500">{errors.workTypes}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['block', 'dong', 'unit'] as const).map(field => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-[#475467]">
                      {field === 'block' ? '블럭' : field === 'dong' ? '동' : '층'}
                    </label>
                    <input
                      type="text"
                      disabled={isViewMode}
                      value={(formData.location as any)?.[field] || ''}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          location: { ...prev.location!, [field]: e.target.value },
                        }))
                      }
                      className={cn(
                        'mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-[#1A254F] focus:outline-none focus:ring-1 focus:ring-[#1A254F]',
                        errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      )}
                    />
                    {errors[field] && <p className="mt-1 text-xs text-red-500">{errors[field]}</p>}
                  </div>
                ))}
              </div>

              {/* 추가된 작업 세트: 개별 입력 섹션 */}
              <div className="mt-2">
                {!isViewMode && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddTaskSet}
                      className="rounded-full border border-[#cbd5e1] px-3 py-1.5 text-sm font-semibold text-[#1A254F] hover:bg-gray-50"
                    >
                      추가
                    </button>
                  </div>
                )}
                {tasks.length > 0 && (
                  <div className="mt-3 space-y-4">
                    {tasks.map((t, i) => (
                      <div key={i} className="rounded-xl border border-[#e5e7eb] p-3">
                        <div className="mb-2 flex items-center">
                          <span className="text-sm font-semibold text-[#1A254F]">
                            작업 세트 #{i + 1}
                          </span>
                          {!isViewMode && (
                            <button
                              type="button"
                              onClick={() => setTasks(prev => prev.filter((_, idx) => idx !== i))}
                              className="ml-auto text-xs text-[#dc2626] hover:underline"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <label className="block text-xs font-medium text-[#475467]">
                              부재명
                            </label>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {memberTypeOptions.map(type => {
                                const active = (t.memberTypes as any)?.includes(type)
                                return (
                                  <button
                                    key={type}
                                    type="button"
                                    disabled={isViewMode}
                                    onClick={() =>
                                      toggleTaskArrayValue(i, 'memberTypes', type as any)
                                    }
                                    className={cn(
                                      'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                                      active
                                        ? 'bg-[#1A254F] text-white'
                                        : 'border border-gray-300 text-[#475467] hover:border-[#1A254F] hover:text-[#1A254F]'
                                    )}
                                  >
                                    {type}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[#475467]">
                              작업공정
                            </label>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {workProcessOptions.map(type => {
                                const active = (t.workProcesses as any)?.includes(type)
                                return (
                                  <button
                                    key={type}
                                    type="button"
                                    disabled={isViewMode}
                                    onClick={() =>
                                      toggleTaskArrayValue(i, 'workProcesses', type as any)
                                    }
                                    className={cn(
                                      'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                                      active
                                        ? 'bg-[#1A254F] text-white'
                                        : 'border border-gray-300 text-[#475467] hover:border-[#1A254F] hover:text-[#1A254F]'
                                    )}
                                  >
                                    {type}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <div>
                            <label className="block text-xs font-medium text-[#475467]">
                              작업유형
                            </label>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {workTypeOptions.map(type => {
                                const active = t.workTypes?.includes(type)
                                return (
                                  <button
                                    key={type}
                                    type="button"
                                    disabled={isViewMode}
                                    onClick={() => toggleTaskArrayValue(i, 'workTypes', type)}
                                    className={cn(
                                      'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                                      active
                                        ? 'bg-[#1A254F] text-white'
                                        : 'border border-gray-300 text-[#475467] hover:border-[#1A254F] hover:text-[#1A254F]'
                                    )}
                                  >
                                    {type}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {(['block', 'dong', 'unit'] as const).map(field => (
                              <div key={field}>
                                <label className="block text-xs font-medium text-[#475467]">
                                  {field === 'block' ? '블럭' : field === 'dong' ? '동' : '층'}
                                </label>
                                <input
                                  type="text"
                                  disabled={isViewMode}
                                  value={(t.location as any)?.[field] || ''}
                                  onChange={e =>
                                    updateTaskAt(i, current => ({
                                      ...current,
                                      location: { ...current.location, [field]: e.target.value },
                                    }))
                                  }
                                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-[#1A254F] focus:outline-none focus:ring-1 focus:ring-[#1A254F] border-gray-300"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#475467]">작업자 *</label>
                <div className="mt-2 flex gap-2">
                  <div className="w-full">
                    <CustomSelect
                      value={newWorker.id}
                      onValueChange={val => {
                        const opt = userOptions.find(u => u.id === val)
                        setNewWorker(prev => ({ ...prev, id: val, name: opt?.name || '' }))
                      }}
                      disabled={isViewMode}
                    >
                      <CustomSelectTrigger className="h-10 rounded-lg bg-white border border-gray-300 px-3 text-sm font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-[#1A254F]">
                        <CustomSelectValue placeholder="작업자 선택" />
                      </CustomSelectTrigger>
                      <CustomSelectContent className="max-h-64 overflow-auto">
                        {groupedUserOptions.length === 0 ? (
                          <CustomSelectItem value="__empty__" disabled>
                            불러올 사용자가 없습니다
                          </CustomSelectItem>
                        ) : (
                          groupedUserOptions.map((group, index) => (
                            <CustomSelectGroup key={group.key}>
                              <CustomSelectLabel className="pl-3 text-xs text-gray-500">
                                {group.label}
                              </CustomSelectLabel>
                              {group.options.map(u => (
                                <CustomSelectItem key={u.id} value={u.id}>
                                  <span className="flex flex-col">
                                    <span className="text-sm font-medium">{u.name}</span>
                                    <span className="text-xs text-gray-500">
                                      {
                                        ROLE_LABELS[
                                          u.role === 'site_manager' ? 'site_manager' : 'worker'
                                        ]
                                      }
                                    </span>
                                  </span>
                                </CustomSelectItem>
                              ))}
                              {index < groupedUserOptions.length - 1 && <CustomSelectSeparator />}
                            </CustomSelectGroup>
                          ))
                        )}
                      </CustomSelectContent>
                    </CustomSelect>
                  </div>
                  <input
                    type="number"
                    placeholder="시간"
                    min={0.5}
                    step={0.5}
                    value={newWorker.hours || ''}
                    disabled={isViewMode}
                    onChange={e =>
                      setNewWorker(prev => ({ ...prev, hours: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-28 h-10 rounded-lg border border-gray-300 px-3 text-sm shadow-sm focus:border-[#1A254F] focus:outline-none focus:ring-1 focus:ring-[#1A254F]"
                  />
                  <button
                    type="button"
                    onClick={handleAddWorker}
                    disabled={isViewMode}
                    className="rounded-lg bg-[#1A254F] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#101a3f] disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    추가
                  </button>
                </div>
                {hasWorkerError && <p className="mt-1 text-xs text-red-500">{errors.workers}</p>}

                <ul className="mt-3 space-y-2 text-sm">
                  {(formData.workers || []).map(worker => (
                    <li
                      key={worker.id}
                      className="flex items-center justify-between rounded-lg bg-[#f8f9fb] px-3 py-2"
                    >
                      <span>
                        {worker.name} ({worker.hours}시간)
                      </span>
                      {!isViewMode && (
                        <button
                          type="button"
                          onClick={() => handleRemoveWorker(worker.id)}
                          className="text-xs text-[#dc2626] hover:underline"
                        >
                          제거
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#475467]">자재 사용량</label>
                {isViewMode ? (
                  <div className="mt-3 space-y-2 text-sm text-[#1A254F]">
                    {materialEntries.length === 0 ? (
                      <p className="text-xs text-[#98a2b3]">자재 사용이 기록되지 않았습니다.</p>
                    ) : (
                      materialEntries.map((material, index) => {
                        const quantity = Number(material.quantity ?? 0)
                        const quantityText = Number.isFinite(quantity)
                          ? quantity.toLocaleString('ko-KR')
                          : String(material.quantity || '')
                        const unitText = material.unit ? ` ${material.unit}` : ''
                        return (
                          <div
                            key={`material-view-${index}`}
                            className="flex items-center justify-between rounded-lg bg-[#f8f9fb] px-3 py-2"
                          >
                            <span>
                              {material.material_name || material.material_code || '자재'}
                            </span>
                            <span className="font-semibold text-[#1A254F]">
                              {quantityText}
                              {unitText}
                            </span>
                          </div>
                        )
                      })
                    )}
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    {materialEntries.map((material, index) => (
                      <div
                        key={`material-edit-${index}`}
                        className="rounded-lg border border-gray-200 p-3"
                      >
                        <div className="flex flex-wrap gap-2">
                          <input
                            type="text"
                            placeholder="자재명"
                            value={material.material_name}
                            onChange={e =>
                              handleMaterialChange(index, 'material_name', e.target.value)
                            }
                            className="flex-1 min-w-[120px] rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#1A254F] focus:outline-none focus:ring-1 focus:ring-[#1A254F]"
                          />
                          <input
                            type="text"
                            placeholder="코드"
                            value={material.material_code || ''}
                            onChange={e =>
                              handleMaterialChange(index, 'material_code', e.target.value)
                            }
                            className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#1A254F] focus:outline-none focus:ring-1 focus:ring-[#1A254F]"
                          />
                          <input
                            type="number"
                            placeholder="수량"
                            value={material.quantity ?? ''}
                            onChange={e => handleMaterialChange(index, 'quantity', e.target.value)}
                            className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#1A254F] focus:outline-none focus:ring-1 focus:ring-[#1A254F]"
                          />
                          <select
                            value={material.unit || ''}
                            onChange={e => handleMaterialChange(index, 'unit', e.target.value)}
                            className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#1A254F] focus:outline-none focus:ring-1 focus:ring-[#1A254F]"
                          >
                            <option value="">단위</option>
                            <option value="ea">ea</option>
                            <option value="kg">kg</option>
                            <option value="L">L</option>
                            <option value="m">m</option>
                            <option value="m²">m²</option>
                            <option value="m³">m³</option>
                            <option value="ton">ton</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRemoveMaterialEntry(index)}
                            className="px-3 py-2 text-xs font-semibold text-[#dc2626] transition-colors hover:underline"
                          >
                            삭제
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="비고 (선택)"
                          value={material.notes || ''}
                          onChange={e => handleMaterialChange(index, 'notes', e.target.value)}
                          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#1A254F] focus:outline-none focus:ring-1 focus:ring-[#1A254F]"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddMaterial}
                      className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-[#1A254F] hover:border-[#1A254F]"
                    >
                      + 자재 추가
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-xs font-medium text-[#475467]">진행률</label>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                value={formData.progress ?? 0}
                disabled={isViewMode}
                onChange={e =>
                  setFormData(prev => ({ ...prev, progress: parseInt(e.target.value, 10) || 0 }))
                }
                className="flex-1 accent-[#1A254F]"
              />
              <span className="w-12 text-right text-sm font-semibold text-[#1A254F]">
                {formData.progress ?? 0}%
              </span>
            </div>
          </div>

          {mode !== 'create' ? (
            <div className="mt-5 rounded-lg border border-dashed border-gray-300 bg-white p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-[#1A254F]">도면 마킹 연결</h4>
                  <p className="text-xs text-[#475467]">
                    작업일지 저장 후 도면 마킹을 생성하거나 기존 문서를 연결하세요.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-[#1A254F] transition-colors hover:border-[#1A254F]"
                    onClick={() => handleOpenMarkupTool()}
                    disabled={!workLog?.id || !(formData.siteId || workLog?.siteId) || isViewMode}
                  >
                    새 도면 마킹
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-[#1A254F] transition-colors hover:border-[#1A254F]"
                    disabled={!workLog?.id || !(formData.siteId || workLog?.siteId) || isViewMode}
                    onClick={() => setShowDrawingPicker(prev => !prev)}
                  >
                    {showDrawingPicker ? '선택 닫기' : '기존 도면 연결'}
                  </button>
                  <a
                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-[#475467]"
                    href={`/documents/hub?siteId=${formData.siteId || ''}&worklogId=${workLog?.id || ''}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    현장공유함 이동
                  </a>
                </div>
              </div>

              {showDrawingPicker && (
                <div className="mt-3 rounded-lg border border-gray-200 bg-[#f8fafc] p-3">
                  <p className="text-xs text-[#475467]">
                    추천 도면을 선택해 바로 연결하거나, 공도면을 선택해 마킹 도구로 이동하세요.
                  </p>
                  <div className="mt-3 max-h-[420px] overflow-hidden rounded-lg border">
                    <DrawingBrowser
                      selectedSite={formData.siteId || workLog?.siteId || ''}
                      siteName={formData.siteName || workLog?.siteName}
                      onDrawingSelect={handleDrawingSelection}
                    />
                  </div>
                </div>
              )}

              <div className="mt-4">
                {loadingLinks ? (
                  <p className="text-xs text-[#94a3b8]">연결 정보를 불러오는 중...</p>
                ) : linkedDrawings.length === 0 ? (
                  <p className="text-xs text-[#94a3b8]">
                    연결된 도면이 없습니다. 새 마킹을 생성하거나 기존 도면을 연결해 주세요.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {linkedDrawings.map(doc => (
                      <li
                        key={doc.id}
                        className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <div className="font-semibold text-[#1A254F]">{doc.title}</div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {doc.linkedWorklogIds.map(id => (
                              <span
                                key={id}
                                className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700"
                              >
                                #{id}
                              </span>
                            ))}
                          </div>
                        </div>
                        {!isViewMode && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-[#475467] hover:border-[#1A254F]"
                              onClick={() => handleOpenMarkupTool(doc.id)}
                            >
                              열기
                            </button>
                            <button
                              type="button"
                              className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-[#dc2626] hover:border-[#dc2626]"
                              onClick={() => handleDetachMarkup(doc.id)}
                              disabled={detachingDocId === doc.id}
                            >
                              {detachingDocId === doc.id ? '해제 중...' : '연결 해제'}
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {linkingDocId && (
                  <p className="mt-2 text-xs text-[#475467]">
                    도면을 작업일지에 연결하는 중입니다. 잠시만 기다려 주세요.
                  </p>
                )}
              </div>
            </div>
          ) : null}

          <div className="mt-5">
            <FileUploadSection
              attachments={formData.attachments!}
              onChange={attachments => setFormData(prev => ({ ...prev, attachments }))}
              readonly={isViewMode}
            />
          </div>
        </div>

        <footer className="border-t border-gray-200 bg-[#f8f9fb] px-6 py-4">
          {isViewMode ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-[#1A254F] py-3 text-sm font-semibold text-white hover:bg-[#101a3f]"
            >
              닫기
            </button>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#d0d5dd] bg-white py-3 text-sm font-semibold text-[#475467] transition-colors hover:bg-gray-100"
                disabled={loading}
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => handleSave('draft')}
                className="rounded-lg border border-[#1A254F] bg-white py-3 text-sm font-semibold text-[#1A254F] transition-colors hover:bg-[#1A254F] hover:text-white disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400"
                disabled={loading}
              >
                {loading ? '저장 중...' : '임시저장'}
              </button>
              <button
                type="button"
                onClick={() => handleSave('submitted')}
                className="rounded-lg bg-[#1A254F] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#101a3f] disabled:cursor-not-allowed disabled:bg-gray-300"
                disabled={loading}
              >
                {loading ? '제출 중...' : '제출'}
              </button>
            </div>
          )}
        </footer>
      </div>
    </div>
  )
}
