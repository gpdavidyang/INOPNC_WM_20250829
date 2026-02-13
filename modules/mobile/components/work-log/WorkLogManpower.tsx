'use client'

import { Minus, Plus, Trash2, Users } from 'lucide-react'
import React, { useMemo } from 'react'
import { WorkerHours } from '../../types/work-log.types'
import './work-form.css'

interface WorkLogManpowerProps {
  workers: WorkerHours[]
  onChange: (workers: WorkerHours[]) => void
  userOptions: Array<{ id: string; name: string; role?: string }>
  disabled?: boolean
}

const PREDEFINED_Roles = {
  worker: '작업자',
  site_manager: '현장관리자',
}

export const WorkLogManpower: React.FC<WorkLogManpowerProps> = ({
  workers,
  onChange,
  userOptions,
  disabled = false,
}) => {
  const groupedUserOptions = useMemo(() => {
    const workerGroup = userOptions.filter(option => option.role !== 'site_manager')
    const managerGroup = userOptions.filter(option => option.role === 'site_manager')
    const groups: Array<{
      key: 'worker' | 'site_manager'
      label: string
      options: Array<{ id: string; name: string; role?: string }>
    }> = []
    if (workerGroup.length > 0) {
      groups.push({ key: 'worker', label: PREDEFINED_Roles.worker, options: workerGroup })
    }
    if (managerGroup.length > 0) {
      groups.push({
        key: 'site_manager',
        label: PREDEFINED_Roles.site_manager,
        options: managerGroup,
      })
    }
    return groups
  }, [userOptions])

  const handleAddWorker = () => {
    if (disabled) return
    const newWorker: WorkerHours = {
      id: `temp-${Date.now()}`,
      name: '',
      hours: 1.0,
    }
    onChange([...workers, newWorker])
  }

  const handleRemoveWorker = (id: string) => {
    if (disabled) return
    onChange(workers.filter(w => w.id !== id))
  }

  const handleUpdateWorker = (id: string, updates: Partial<WorkerHours>) => {
    if (disabled) return
    onChange(workers.map(w => (w.id === id ? { ...w, ...updates } : w)))
  }

  const adjustHours = (id: string, delta: number) => {
    if (disabled) return
    const target = workers.find(w => w.id === id)
    if (!target) return
    const newHours = Math.max(0.5, (target.hours || 0) + delta)
    handleUpdateWorker(id, { hours: newHours })
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
          <Users className="w-5 h-5" style={{ color: 'var(--header-navy)' }} />
          투입 인원 (공수) <span style={{ color: 'var(--danger)' }}>*</span>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={handleAddWorker}
            className="bg-[#e0f2fe] text-[#0ea5e9] text-[13px] font-bold h-8 px-3.5 rounded-xl flex items-center transition-colors hover:bg-[#bae6fd]"
            style={{
              backgroundColor: 'var(--primary-bg)',
              color: 'var(--primary)',
            }}
          >
            + 인원 추가
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-2.5" id="manpowerList">
        {workers.length === 0 && !disabled && (
          <div className="text-center py-4 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
            투입된 인원을 추가해주세요
          </div>
        )}

        {workers.map(item => {
          const isCustom = item.id.startsWith('temp-') && !userOptions.find(u => u.id === item.id)
          // Actually, if id is in userOptions, it's a known user.
          // If name is manual, we might need a way to detect "Direct Input" mode.
          // For simplicity, we assume if id starts with 'temp-' it might be custom,
          // BUT user selects from dropdown which sets ID.
          // If user selects "Direct Input" (custom), we set id to temp.
          // We need to know if we are in 'select' mode or 'input' mode.
          // A simple heuristic: if name is empty or id is in options -> Select.
          // For now, B's logic uses ID.
          // We'll replicate the UI: Select first.

          return (
            <div
              key={item.id}
              className="grid grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)_auto] sm:grid-cols-[1.2fr_1fr_auto] gap-2 sm:gap-2.5 items-center bg-slate-50 dark:bg-slate-700/50 p-3 sm:p-3.5 rounded-2xl transition-all"
              style={{ background: 'var(--bg-input)' }}
            >
              {/* Worker Name Selection/Input */}
              <div className="relative w-full min-w-0">
                <select
                  value={userOptions.find(u => u.id === item.id) ? item.id : ''}
                  onChange={e => {
                    const val = e.target.value
                    if (val === '') return
                    const user = userOptions.find(u => u.id === val)
                    if (user) {
                      handleUpdateWorker(item.id, { id: user.id, name: user.name })
                    }
                  }}
                  disabled={disabled}
                  className="worker-select"
                >
                  <option value="">작업자</option>
                  {groupedUserOptions.map(group => (
                    <optgroup key={group.key} label={group.label}>
                      {group.options.map(opt => (
                        <option key={opt.id} value={opt.id}>
                          {opt.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {/* 
                  Note: A's design had "Direct Input". 
                  Implementing mixed Select/Input is complex. 
                  For MVP Phase 1, we stick to selecting from `userOptions` which comes from DB.
                  If "Direct Input" is strictly required, we can add <option value="__custom__">Direct Input</option>
                  and switch to input.
                */}
              </div>

              {/* Hours Control */}
              <div
                className="flex h-[48px] border border-border rounded-xl bg-[var(--bg-surface)] overflow-hidden w-full min-w-0"
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                }}
              >
                <button
                  type="button"
                  onClick={() => adjustHours(item.id, -0.5)}
                  disabled={disabled}
                  className="flex-1 flex items-center justify-center text-xl text-text-sub hover:bg-slate-50 w-10 sm:w-auto transition-colors disabled:opacity-50"
                >
                  <Minus size={16} />
                </button>
                <span
                  className="flex-1 flex items-center justify-center text-base font-bold border-x border-slate-100 min-w-[30px] sm:min-w-[50px]"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {(item.hours || 0).toFixed(1)}
                </span>
                <button
                  type="button"
                  onClick={() => adjustHours(item.id, 0.5)}
                  disabled={disabled}
                  className="flex-1 flex items-center justify-center text-xl text-text-sub hover:bg-slate-50 w-10 sm:w-auto transition-colors disabled:opacity-50"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Remove Button */}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveWorker(item.id)}
                  className="bg-red-50 text-red-500 p-2.5 rounded-xl hover:bg-red-100 transition-colors"
                  aria-label="Remove"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
