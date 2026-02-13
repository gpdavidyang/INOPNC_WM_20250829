'use client'

import { cn } from '@/lib/utils'
import { HardHat } from 'lucide-react'
import React from 'react'
import './work-form.css'

interface WorkSetData {
  memberTypes: string[]
  workProcesses: string[]
  workTypes: string[]
  location: { block: string; dong: string; unit: string }
}

interface WorkLogContentProps {
  // Options
  memberTypeOptions: string[]
  workProcessOptions: string[]
  workTypeOptions: string[]

  // Data
  baseTask: WorkSetData
  additionalTasks: WorkSetData[]

  // Handlers
  onBaseTaskChange: (updates: Partial<WorkSetData>) => void
  onAdditionalTasksChange: (newTasks: WorkSetData[]) => void

  disabled?: boolean
}

export const WorkLogContent: React.FC<WorkLogContentProps> = ({
  memberTypeOptions,
  workProcessOptions,
  workTypeOptions,
  baseTask,
  additionalTasks,
  onBaseTaskChange,
  onAdditionalTasksChange,
  disabled = false,
}) => {
  const allSets = [baseTask, ...additionalTasks]

  const handleUpdateSet = (index: number, updates: Partial<WorkSetData>) => {
    if (disabled) return

    if (index === 0) {
      onBaseTaskChange(updates)
    } else {
      const taskIndex = index - 1
      const newTasks = [...additionalTasks]
      newTasks[taskIndex] = { ...newTasks[taskIndex], ...updates }
      onAdditionalTasksChange(newTasks)
    }
  }

  const handleRemoveSet = (index: number) => {
    if (disabled) return

    if (index === 0) {
      if (confirm('첫 번째 작업 세트는 삭제할 수 없습니다. 내용을 초기화하시겠습니까?')) {
        onBaseTaskChange({
          memberTypes: [],
          workProcesses: [],
          workTypes: [],
          location: { block: '', dong: '', unit: '' },
        })
      }
    } else {
      const taskIndex = index - 1
      const newTasks = additionalTasks.filter((_, i) => i !== taskIndex)
      onAdditionalTasksChange(newTasks)
    }
  }

  const handleAddSet = () => {
    if (disabled) return
    const newSet: WorkSetData = {
      memberTypes: [],
      workProcesses: [],
      workTypes: [],
      location: { block: '', dong: '', unit: '' },
    }
    onAdditionalTasksChange([...additionalTasks, newSet])
  }

  // Helper to toggle array values
  const toggleValue = (current: string[], value: string): string[] => {
    const exists = current.includes(value)
    if (exists) return current.filter(v => v !== value)
    return [...current, value]
  }

  return (
    <div
      className="rounded-2xl p-6 shadow-sm border border-transparent dark:border-slate-700 mb-4"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div
          className="text-xl font-bold flex items-center gap-2"
          style={{ color: 'var(--header-navy)' }}
        >
          <HardHat className="w-5 h-5" style={{ color: 'var(--header-navy)' }} />
          작업내용 <span style={{ color: 'var(--danger)' }}>*</span>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={handleAddSet}
            className="h-8 px-3.5 rounded-xl text-sm font-bold flex items-center gap-1 transition-colors hover:bg-sky-100"
            style={{
              background: 'var(--primary-bg)',
              color: 'var(--primary)',
            }}
          >
            <span className="text-lg font-black">+</span> 추가
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4" id="workSets">
        {allSets.map((set, index) => (
          <div
            key={`workset-${index}`}
            className="rounded-2xl p-5"
            style={{
              background: 'var(--bg-surface)',
              border: '2px solid var(--primary)',
            }}
          >
            <div className="flex justify-between items-center mb-5">
              <span
                className="text-sm font-bold px-3 py-1.5 rounded-lg"
                style={{
                  color: 'var(--primary)',
                  background: 'var(--primary-bg)',
                }}
              >
                작업 세트 {index + 1}
              </span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveSet(index)}
                  className="bg-red-50 text-red-500 text-sm font-bold px-3 py-1 rounded-xl hover:bg-red-100 transition-colors"
                >
                  삭제
                </button>
              )}
            </div>

            {/* Member Types (Multiple) */}
            <div className="mb-4">
              <label className="block text-[15px] font-bold text-text-sub mb-2">부재명</label>
              <div className="flex flex-wrap gap-2">
                {memberTypeOptions.map(opt => {
                  const isActive = set.memberTypes.includes(opt)
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={disabled}
                      onClick={() =>
                        handleUpdateSet(index, { memberTypes: toggleValue(set.memberTypes, opt) })
                      }
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-sm font-bold transition-all border',
                        isActive
                          ? 'bg-[#0ea5e9] text-white border-[#0ea5e9]'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      )}
                      style={
                        isActive
                          ? { backgroundColor: 'var(--primary)', borderColor: 'var(--primary)' }
                          : {}
                      }
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Work Processes (Multiple) */}
            <div className="mb-4">
              <label className="block text-[15px] font-bold text-text-sub mb-2">작업공정</label>
              <div className="flex flex-wrap gap-2">
                {workProcessOptions.map(opt => {
                  const isActive = set.workProcesses.includes(opt)
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={disabled}
                      onClick={() =>
                        handleUpdateSet(index, {
                          workProcesses: toggleValue(set.workProcesses, opt),
                        })
                      }
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-sm font-bold transition-all border',
                        isActive
                          ? 'bg-[#0ea5e9] text-white border-[#0ea5e9]'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      )}
                      style={
                        isActive
                          ? { backgroundColor: 'var(--primary)', borderColor: 'var(--primary)' }
                          : {}
                      }
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Work Types (Multiple) */}
            <div className="mb-4">
              <label className="block text-[15px] font-bold text-text-sub mb-2">작업유형</label>
              <div className="flex flex-wrap gap-2">
                {workTypeOptions.map(opt => {
                  const isActive = set.workTypes.includes(opt)
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={disabled}
                      onClick={() =>
                        handleUpdateSet(index, { workTypes: toggleValue(set.workTypes, opt) })
                      }
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-sm font-bold transition-all border',
                        isActive
                          ? 'bg-[#0ea5e9] text-white border-[#0ea5e9]'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      )}
                      style={
                        isActive
                          ? { backgroundColor: 'var(--primary)', borderColor: 'var(--primary)' }
                          : {}
                      }
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Location */}
            <div>
              <label
                className="block text-[17px] font-bold text-text-sub mb-2"
                style={{ color: 'var(--text-sub)' }}
              >
                블럭 / 동 / 층
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="블럭"
                  disabled={disabled}
                  value={set.location.block}
                  onChange={e =>
                    handleUpdateSet(index, { location: { ...set.location, block: e.target.value } })
                  }
                  className="h-[54px] border border-gray-200 rounded-xl px-4 text-center outline-none focus:ring-2 focus:ring-[#0ea5e9]/20 transition-all bg-[#f8fafc]"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}
                />
                <input
                  type="text"
                  placeholder="동"
                  disabled={disabled}
                  value={set.location.dong}
                  onChange={e =>
                    handleUpdateSet(index, { location: { ...set.location, dong: e.target.value } })
                  }
                  className="h-[54px] border border-gray-200 rounded-xl px-4 text-center outline-none focus:ring-2 focus:ring-[#0ea5e9]/20 transition-all bg-[#f8fafc]"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}
                />
                <input
                  type="text"
                  placeholder="층"
                  disabled={disabled}
                  value={set.location.unit}
                  onChange={e =>
                    handleUpdateSet(index, { location: { ...set.location, unit: e.target.value } })
                  }
                  className="h-[54px] border border-gray-200 rounded-xl px-4 text-center outline-none focus:ring-2 focus:ring-[#0ea5e9]/20 transition-all bg-[#f8fafc]"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
