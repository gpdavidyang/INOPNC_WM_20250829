'use client'

import React, { useState, useEffect } from 'react'
import { WorkLog, MemberType, WorkProcess, WorkType, WorkerHours } from '../../types/work-log.types'
import { FileUploadSection } from './FileUploadSection'
import type {
  MemberType as MType,
  WorkProcess as WProc,
  WorkType as WType,
} from '../../types/work-log.types'
import { cn } from '@/lib/utils'

interface WorkLogModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (workLog: Partial<WorkLog>) => Promise<void>
  workLog?: WorkLog
  mode: 'create' | 'edit' | 'view'
}

const memberTypeOptions: MemberType[] = ['슬라브', '거더', '기둥', '기타']
const workProcessOptions: WorkProcess[] = ['균열', '면', '마감', '기타']
const workTypeOptions: WorkType[] = ['지하', '지상', '지붕', '기타']

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
  npcUsage: source?.npcUsage,
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

  const isViewMode = mode === 'view'

  useEffect(() => {
    if (isOpen) {
      setFormData(createInitialFormData(workLog))
      setTasks((workLog?.tasks as any) || [])
      setErrors({})
      setNewWorker({ id: '', name: '', hours: 0 })
    }
  }, [isOpen, workLog])

  useEffect(() => {
    const total = formData.workers?.reduce((sum, worker) => sum + worker.hours, 0) || 0
    setFormData(prev => ({ ...prev, totalHours: total }))
  }, [formData.workers])

  const hasWorkerError = Boolean(errors.workers)

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

  const validateForm = (status: 'draft' | 'approved') => {
    const nextErrors: Record<string, string> = {}

    if (!formData.date) nextErrors.date = '작업일자를 선택해주세요.'
    if (!formData.siteId) nextErrors.site = '현장을 선택해주세요.'

    if (status === 'approved') {
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

  const handleSave = async (targetStatus: 'draft' | 'approved') => {
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
      await onSave({ ...formData, status: targetStatus, tasks: combinedTasks as any })
      onClose()
    } catch (error) {
      console.error('Failed to save work log:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-[#1A254F]">
            {mode === 'create' && '작업일지 작성'}
            {mode === 'edit' && '작업일지 수정'}
            {mode === 'view' && '작업일지 상세'}
          </h2>
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
                    const active = formData.memberTypes?.includes(type)
                    return (
                      <button
                        key={type}
                        type="button"
                        disabled={isViewMode}
                        onClick={() => handleToggleArrayValue('memberTypes', type)}
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
                    const active = formData.workProcesses?.includes(type)
                    return (
                      <button
                        key={type}
                        type="button"
                        disabled={isViewMode}
                        onClick={() => handleToggleArrayValue('workProcesses', type)}
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
                                const active = t.memberTypes?.includes(type)
                                return (
                                  <button
                                    key={type}
                                    type="button"
                                    disabled={isViewMode}
                                    onClick={() => toggleTaskArrayValue(i, 'memberTypes', type)}
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
                                const active = t.workProcesses?.includes(type)
                                return (
                                  <button
                                    key={type}
                                    type="button"
                                    disabled={isViewMode}
                                    onClick={() => toggleTaskArrayValue(i, 'workProcesses', type)}
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
                  <input
                    type="text"
                    placeholder="이름"
                    value={newWorker.name}
                    disabled={isViewMode}
                    onChange={e => setNewWorker(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#1A254F] focus:outline-none focus:ring-1 focus:ring-[#1A254F]"
                  />
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
                    className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#1A254F] focus:outline-none focus:ring-1 focus:ring-[#1A254F]"
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
                <label className="block text-xs font-medium text-[#475467]">NPC-1000 사용량</label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="number"
                    placeholder="수량"
                    disabled={isViewMode}
                    value={formData.npcUsage?.amount || ''}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        npcUsage: {
                          amount: parseFloat(e.target.value) || 0,
                          unit: prev.npcUsage?.unit || 'kg',
                        },
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#1A254F] focus:outline-none focus:ring-1 focus:ring-[#1A254F]"
                  />
                  <select
                    value={formData.npcUsage?.unit || 'kg'}
                    disabled={isViewMode}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        npcUsage: {
                          amount: prev.npcUsage?.amount || 0,
                          unit: e.target.value as 'kg' | 'L' | 'ea',
                        },
                      }))
                    }
                    className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#1A254F] focus:outline-none focus:ring-1 focus:ring-[#1A254F]"
                  >
                    <option value="kg">kg</option>
                    <option value="L">L</option>
                    <option value="ea">ea</option>
                  </select>
                </div>
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
                onClick={() => handleSave('approved')}
                className="rounded-lg bg-[#1A254F] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#101a3f] disabled:cursor-not-allowed disabled:bg-gray-300"
                disabled={loading}
              >
                {loading ? '제출 중...' : '작성완료'}
              </button>
            </div>
          )}
        </footer>
      </div>
    </div>
  )
}
