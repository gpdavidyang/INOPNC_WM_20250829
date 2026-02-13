'use client'

import { useToast } from '@/components/ui/use-toast'
import { useWorkOptions } from '@/hooks/use-work-options'
import { createClient } from '@/lib/supabase/client'
import { DrawingBrowser } from '@/modules/mobile/components/markup/DrawingBrowser'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  MemberType as MType,
  WorkProcess as WProc,
  WorkType as WType,
} from '../../types/work-log.types'
import { WorkLog, WorkType, WorkerHours } from '../../types/work-log.types'
import { FileUploadSection } from './FileUploadSection'
import { WorkLogContent } from './WorkLogContent'
import { SiteOption, WorkLogInputs } from './WorkLogInputs'
import { WorkLogManpower } from './WorkLogManpower'
import { WorkLogMaterials } from './WorkLogMaterials'

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
  const [siteOptions, setSiteOptions] = useState<Array<{ id: string; name: string }>>([])
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

  // Load selectable sites
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await fetch('/api/mobile/sites/list')
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          setSiteOptions(json.data)
        }
      } catch (e) {
        console.warn('[WorkLogModal] Failed to fetch sites:', e)
      }
    }

    if (isOpen) fetchSites()
  }, [isOpen])

  const mappedSiteOptions: SiteOption[] = useMemo(
    () =>
      siteOptions.map(s => ({
        value: s.id,
        text: s.name,
        dept: '현장관리', // Default as specific dept info isn't in the list API yet
      })),
    [siteOptions]
  )

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

  const handleReset = () => {
    if (confirm('작성 중인 내용을 초기화하시겠습니까?')) {
      setFormData(createInitialFormData(workLog))
      setTasks((workLog?.tasks as any) || [])
      setErrors({})
      toast({
        title: '초기화 완료',
        description: '입력하신 내용이 초기화되었습니다.',
      })
    }
  }

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
          <div className="space-y-4">
            <WorkLogInputs
              sites={mappedSiteOptions}
              selectedSiteId={formData.siteId || ''}
              onSiteChange={site => {
                setFormData(prev => ({
                  ...prev,
                  siteId: site.value,
                  siteName: site.text,
                }))
                if (errors.site) setErrors(prev => ({ ...prev, site: '' }))
              }}
              workDate={formData.date || ''}
              onDateChange={date => {
                setFormData(prev => ({ ...prev, date }))
                if (errors.date) setErrors(prev => ({ ...prev, date: '' }))
              }}
              disabled={isViewMode}
            />
            {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
            {errors.site && <p className="mt-1 text-xs text-red-500">{errors.site}</p>}

            <WorkLogContent
              memberTypeOptions={memberTypeOptions}
              workProcessOptions={workProcessOptions}
              workTypeOptions={workTypeOptions}
              baseTask={{
                memberTypes: formData.memberTypes || [],
                workProcesses: formData.workProcesses || [],
                workTypes: formData.workTypes || [],
                location: formData.location || { block: '', dong: '', unit: '' },
              }}
              additionalTasks={tasks.map(t => ({
                memberTypes: t.memberTypes || [],
                workProcesses: t.workProcesses || [],
                workTypes: t.workTypes || [],
                location: t.location || { block: '', dong: '', unit: '' },
              }))}
              onBaseTaskChange={updates => setFormData(prev => ({ ...prev, ...updates }))}
              onAdditionalTasksChange={newTasks => setTasks(newTasks as any[])}
              disabled={isViewMode}
            />
          </div>
          <WorkLogMaterials
            materials={formData.materials || []}
            onChange={m => setFormData(prev => ({ ...prev, materials: m }))}
            disabled={isViewMode}
          />

          <WorkLogManpower
            workers={formData.workers || []}
            onChange={newWorkers => {
              setFormData(prev => ({ ...prev, workers: newWorkers }))
              if (errors.workers) setErrors(prev => ({ ...prev, workers: '' }))
            }}
            userOptions={userOptions}
            disabled={isViewMode}
          />
          {hasWorkerError && <p className="mt-1 text-xs text-red-500">{errors.workers}</p>}

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

        <footer className="bg-transparent px-6 pb-6 pt-2">
          {isViewMode ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full h-[50px] rounded-xl bg-[#1A254F] text-[15px] font-bold text-white hover:bg-[#101a3f] transition-colors"
            >
              닫기
            </button>
          ) : (
            <div
              className="flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-white p-2.5 shadow-xl"
              style={{
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
              }}
            >
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="flex-1 h-[50px] rounded-xl border border-gray-300 bg-gray-100 text-[15px] font-bold text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                초기화
              </button>
              <button
                type="button"
                onClick={() => handleSave('draft')}
                disabled={loading}
                className="flex-1 h-[50px] rounded-xl border border-sky-200 bg-sky-50 text-[15px] font-bold text-sky-600 hover:bg-sky-100 disabled:opacity-50 transition-colors"
              >
                {loading ? '저장 중...' : '임시 저장'}
              </button>
              <button
                type="button"
                onClick={() => handleSave('submitted')}
                disabled={loading}
                className="flex-1 h-[50px] rounded-xl bg-[#1A254F] text-[15px] font-bold text-white hover:bg-[#101a3f] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '저장 중...' : '일지저장'}
              </button>
            </div>
          )}
        </footer>
      </div>
    </div>
  )
}
