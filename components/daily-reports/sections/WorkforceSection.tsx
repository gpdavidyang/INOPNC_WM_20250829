'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Profile } from '@/types'
import { Plus, RotateCcw, Trash2, Users } from 'lucide-react'
import React from 'react'
import { CollapsibleSection, useRolePermissions } from '../CollapsibleSection'
import type { WorkerEntry } from '../types'

interface WorkforceSectionProps {
  workerEntries: WorkerEntry[]
  setWorkerEntries: React.Dispatch<React.SetStateAction<WorkerEntry[]>>
  workers: Profile[]
  isExpanded: boolean
  onToggle: () => void
  permissions: ReturnType<typeof useRolePermissions>
  defaultLaborHour: number
  allowedLaborHours: number[]
  isAllowedLaborHourValue: (value: number) => boolean
  formatLaborHourLabel: (value: number) => string
  coerceLaborHourValue: (value: unknown) => number
}

export const WorkforceSection = ({
  workerEntries,
  setWorkerEntries,
  workers,
  isExpanded,
  onToggle,
  permissions,
  defaultLaborHour,
  allowedLaborHours,
  isAllowedLaborHourValue,
  formatLaborHourLabel,
  coerceLaborHourValue,
}: WorkforceSectionProps) => {
  const totalLaborHoursFromEntries = workerEntries.reduce(
    (sum, entry) => sum + (Number(entry.labor_hours) || 0),
    0
  )

  const addWorkerEntry = () => {
    setWorkerEntries(prev => [
      ...prev,
      {
        id: `worker-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        worker_id: '',
        labor_hours: defaultLaborHour,
        worker_name: '',
        is_direct_input: false,
      },
    ])
  }

  const removeWorkerEntry = (index: number) => {
    setWorkerEntries(prev => prev.filter((_, i) => i !== index))
  }

  const updateWorkerEntry = (index: number, updates: Partial<WorkerEntry>) => {
    setWorkerEntries(prev => {
      const next = [...prev]
      next[index] = { ...next[index], ...updates }
      return next
    })
  }

  if (!permissions.canManageWorkers) return null

  return (
    <CollapsibleSection
      title="인력 관리"
      icon={Users}
      isExpanded={isExpanded}
      onToggle={onToggle}
      managerOnly={true}
      permissions={permissions}
      badge={<Badge variant="outline">{workerEntries.length}명</Badge>}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2 text-sm text-gray-600">
            작업인원: <span className="font-semibold text-gray-900">{workerEntries.length}</span>명
          </div>
          <div className="rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2 text-sm text-gray-600">
            공수 합계:{' '}
            <span className="font-semibold text-gray-900">
              {totalLaborHoursFromEntries.toFixed(1)}
            </span>{' '}
            공수
          </div>
        </div>

        {workerEntries.map((entry, index) => (
          <div key={entry.id} className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 flex items-center">
                <span className="bg-slate-100 text-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">
                  {index + 1}
                </span>
                작업자 #{index + 1}
              </h4>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addWorkerEntry}
                  className="h-8 border-dashed border-gray-300 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  작업자 추가
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeWorkerEntry(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  title="작업자 삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 font-medium">작업자 선택</Label>
                {entry.is_direct_input ? (
                  <div className="flex gap-2">
                    <Input
                      className="h-9 flex-1"
                      value={entry.worker_name || ''}
                      onChange={e => updateWorkerEntry(index, { worker_name: e.target.value })}
                      placeholder="이름 직접 입력"
                      autoFocus
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 px-2 text-gray-400 hover:text-gray-600"
                      onClick={() =>
                        updateWorkerEntry(index, { is_direct_input: false, worker_id: '' })
                      }
                      title="목록에서 선택"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <CustomSelect
                    value={entry.worker_id || ''}
                    onValueChange={value => {
                      if (value === 'direct') {
                        updateWorkerEntry(index, {
                          is_direct_input: true,
                          worker_id: '',
                          worker_name: '',
                        })
                      } else {
                        const selectedWorker = workers.find(w => w.id === value)
                        updateWorkerEntry(index, {
                          worker_id: value,
                          worker_name: selectedWorker?.full_name || '',
                          is_direct_input: false,
                        })
                      }
                    }}
                  >
                    <CustomSelectTrigger className="h-9">
                      <CustomSelectValue placeholder="작업자 선택" />
                    </CustomSelectTrigger>
                    <CustomSelectContent>
                      <CustomSelectItem
                        value="direct"
                        className="text-blue-600 font-medium border-b border-gray-100"
                      >
                        <Plus className="h-3 w-3 mr-1 inline" /> 직접 입력 (명단에 없음)
                      </CustomSelectItem>
                      {workers.map(worker => (
                        <CustomSelectItem key={worker.id} value={worker.id}>
                          <div className="flex items-center justify-between w-full gap-2">
                            <span>{worker.full_name}</span>
                            <span className="text-[10px] text-gray-400 bg-gray-100 px-1 rounded">
                              {worker.role === 'site_manager' ? '현장관리자' : '작업자'}
                            </span>
                          </div>
                        </CustomSelectItem>
                      ))}
                    </CustomSelectContent>
                  </CustomSelect>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 font-medium">공수 (Man-day)</Label>
                <CustomSelect
                  value={
                    isAllowedLaborHourValue(entry.labor_hours)
                      ? formatLaborHourLabel(entry.labor_hours)
                      : ''
                  }
                  onValueChange={value => {
                    updateWorkerEntry(index, {
                      labor_hours: coerceLaborHourValue(parseFloat(value)),
                    })
                  }}
                >
                  <CustomSelectTrigger className="h-9">
                    <CustomSelectValue placeholder="선택" />
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    {allowedLaborHours.map(option => {
                      const optionValue = formatLaborHourLabel(option)
                      return (
                        <CustomSelectItem key={optionValue} value={optionValue}>
                          {optionValue} 공수
                        </CustomSelectItem>
                      )
                    })}
                  </CustomSelectContent>
                </CustomSelect>
              </div>
            </div>
          </div>
        ))}
        {workerEntries.length === 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={addWorkerEntry}
            className="w-full h-12 border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            작업자 추가
          </Button>
        )}
      </div>
    </CollapsibleSection>
  )
}
