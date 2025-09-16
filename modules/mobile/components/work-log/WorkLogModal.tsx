'use client'

import React, { useState, useEffect } from 'react'
import {
  WorkLog,
  MemberType,
  WorkProcess,
  WorkType,
  WorkerHours,
  NPCUsage,
} from '../../types/work-log.types'
import { formatDate } from '../../utils/work-log-utils'
import { FileUploadSection } from './FileUploadSection'

interface WorkLogModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (workLog: Partial<WorkLog>) => Promise<void>
  workLog?: WorkLog
  mode: 'create' | 'edit' | 'view'
}

export const WorkLogModal: React.FC<WorkLogModalProps> = ({
  isOpen,
  onClose,
  onSave,
  workLog,
  mode,
}) => {
  const [formData, setFormData] = useState<Partial<WorkLog>>({
    date: workLog?.date || new Date().toISOString().split('T')[0],
    siteId: workLog?.siteId || '',
    siteName: workLog?.siteName || '',
    status: workLog?.status || 'draft',
    memberTypes: workLog?.memberTypes || [],
    workProcesses: workLog?.workProcesses || [],
    workTypes: workLog?.workTypes || [],
    location: workLog?.location || { block: '', dong: '', unit: '' },
    workers: workLog?.workers || [],
    totalHours: workLog?.totalHours || 0,
    npcUsage: workLog?.npcUsage,
    attachments: workLog?.attachments || { photos: [], drawings: [], confirmations: [] },
    progress: workLog?.progress || 0,
    notes: workLog?.notes || '',
  })

  const [newWorker, setNewWorker] = useState<WorkerHours>({ id: '', name: '', hours: 0 })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  // 부재명 옵션
  const memberTypeOptions: MemberType[] = ['슬라브', '거더', '기둥', '기타']

  // 작업공정 옵션
  const workProcessOptions: WorkProcess[] = ['균열', '면', '마감', '기타']

  // 작업유형 옵션
  const workTypeOptions: WorkType[] = ['지하', '지상', '옥상', '기타']

  // 전체 작업시간 자동 계산
  useEffect(() => {
    const total = formData.workers?.reduce((sum, worker) => sum + worker.hours, 0) || 0
    setFormData(prev => ({ ...prev, totalHours: total }))
  }, [formData.workers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 유효성 검사
    const newErrors: Record<string, string> = {}
    if (!formData.date) newErrors.date = '날짜를 선택해주세요'
    if (!formData.siteId) newErrors.site = '현장을 선택해주세요'
    if (formData.memberTypes?.length === 0) newErrors.memberType = '부재명을 선택해주세요'
    if (formData.workProcesses?.length === 0) newErrors.workProcess = '작업공정을 선택해주세요'
    if (!formData.location?.block) newErrors.block = '블럭을 입력해주세요'
    if (!formData.location?.dong) newErrors.dong = '동을 입력해주세요'
    if (!formData.location?.unit) newErrors.unit = '호수를 입력해주세요'
    if (formData.workers?.length === 0) newErrors.workers = '작업자를 추가해주세요'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      setLoading(true)
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Failed to save work log:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddWorker = () => {
    if (newWorker.name && newWorker.hours > 0) {
      const workerId = `w${Date.now()}`
      setFormData(prev => ({
        ...prev,
        workers: [...(prev.workers || []), { ...newWorker, id: workerId }],
      }))
      setNewWorker({ id: '', name: '', hours: 0 })
    }
  }

  const handleRemoveWorker = (workerId: string) => {
    setFormData(prev => ({
      ...prev,
      workers: prev.workers?.filter(w => w.id !== workerId) || [],
    }))
  }

  const toggleArrayField = (field: 'memberTypes' | 'workProcesses' | 'workTypes', value: any) => {
    setFormData(prev => {
      const currentValues = prev[field] || []
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v: any) => v !== value)
        : [...currentValues, value]
      return { ...prev, [field]: newValues }
    })
  }

  if (!isOpen) return null

  return (
    <>
      {/* 오버레이 */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />

      {/* 모달 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-[#1A254F]">
              {mode === 'create'
                ? '작업일지 작성'
                : mode === 'edit'
                  ? '작업일지 수정'
                  : '작업일지 상세'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* 폼 내용 */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* 날짜 및 현장 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  작업일자 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className={`w-full p-3 border rounded-lg bg-white text-gray-900 ${errors.date ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`}
                />
                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  현장 <span className="text-red-500">*</span>
                </label>
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
                  className={`w-full p-3 border rounded-lg bg-white text-gray-900 ${errors.site ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`}
                >
                  <option value="">현장 선택</option>
                  <option value="site-1">삼성전자 평택캠퍼스 P3</option>
                  <option value="site-2">LG디스플레이 파주공장</option>
                  <option value="site-3">현대자동차 울산공장</option>
                </select>
                {errors.site && <p className="text-red-500 text-xs mt-1">{errors.site}</p>}
              </div>
            </div>

            {/* 부재명 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                부재명 <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {memberTypeOptions.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleArrayField('memberTypes', type)}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      formData.memberTypes?.includes(type)
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              {errors.memberType && (
                <p className="text-red-500 text-xs mt-1">{errors.memberType}</p>
              )}
            </div>

            {/* 작업공정 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                작업공정 <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {workProcessOptions.map(process => (
                  <button
                    key={process}
                    type="button"
                    onClick={() => toggleArrayField('workProcesses', process)}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      formData.workProcesses?.includes(process)
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {process}
                  </button>
                ))}
              </div>
              {errors.workProcess && (
                <p className="text-red-500 text-xs mt-1">{errors.workProcess}</p>
              )}
            </div>

            {/* 작업유형 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">작업유형</label>
              <div className="flex flex-wrap gap-2">
                {workTypeOptions.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleArrayField('workTypes', type)}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      formData.workTypes?.includes(type)
                        ? 'bg-purple-500 text-white border-purple-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* 위치 정보 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                위치 정보 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="블럭"
                    value={formData.location?.block || ''}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        location: { ...prev.location!, block: e.target.value },
                      }))
                    }
                    className={`w-full p-3 border rounded-lg bg-white text-gray-900 placeholder-gray-400 ${errors.block ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`}
                    disabled={mode === 'view'}
                  />
                  {errors.block && <p className="text-red-500 text-xs mt-1">{errors.block}</p>}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="동"
                    value={formData.location?.dong || ''}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        location: { ...prev.location!, dong: e.target.value },
                      }))
                    }
                    className={`w-full p-3 border rounded-lg bg-white text-gray-900 placeholder-gray-400 ${errors.dong ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`}
                    disabled={mode === 'view'}
                  />
                  {errors.dong && <p className="text-red-500 text-xs mt-1">{errors.dong}</p>}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="호수"
                    value={formData.location?.unit || ''}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        location: { ...prev.location!, unit: e.target.value },
                      }))
                    }
                    className={`w-full p-3 border rounded-lg bg-white text-gray-900 placeholder-gray-400 ${errors.unit ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`}
                    disabled={mode === 'view'}
                  />
                  {errors.unit && <p className="text-red-500 text-xs mt-1">{errors.unit}</p>}
                </div>
              </div>
            </div>

            {/* 작업자 관리 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                작업자 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="이름"
                  value={newWorker.name}
                  onChange={e => setNewWorker(prev => ({ ...prev, name: e.target.value }))}
                  className="flex-1 p-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="시간"
                  min="0.5"
                  step="0.5"
                  value={newWorker.hours || ''}
                  onChange={e =>
                    setNewWorker(prev => ({ ...prev, hours: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-24 p-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddWorker}
                  className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  추가
                </button>
              </div>
              {formData.workers && formData.workers.length > 0 && (
                <div className="space-y-2">
                  {formData.workers.map(worker => (
                    <div
                      key={worker.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span>
                        {worker.name} ({worker.hours}시간)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveWorker(worker.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-200">
                    <span className="font-medium">총 작업시간: {formData.totalHours}시간</span>
                  </div>
                </div>
              )}
              {errors.workers && <p className="text-red-500 text-xs mt-1">{errors.workers}</p>}
            </div>

            {/* NPC-1000 사용량 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NPC-1000 사용량
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="수량"
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
                  className="flex-1 p-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <select
                  value={formData.npcUsage?.unit || 'kg'}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      npcUsage: {
                        amount: prev.npcUsage?.amount || 0,
                        unit: e.target.value as 'kg' | 'L' | 'ea',
                      },
                    }))
                  }
                  className="w-24 p-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="kg">kg</option>
                  <option value="L">L</option>
                  <option value="ea">ea</option>
                </select>
              </div>
            </div>

            {/* 진행률 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                진행률: {formData.progress}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.progress}
                onChange={e =>
                  setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) }))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* 메모 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">메모</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="추가 메모를 입력하세요"
                className="w-full p-3 border border-gray-300 rounded-lg resize-none bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 첨부파일 섹션 */}
            <FileUploadSection
              attachments={formData.attachments!}
              onChange={attachments => setFormData(prev => ({ ...prev, attachments }))}
            />
          </form>

          {/* 푸터 */}
          <div className="flex gap-3 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200"
              disabled={loading}
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 h-12 bg-[#0068FE] text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300"
              disabled={loading}
            >
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
