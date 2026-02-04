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
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'
import { Plus, RotateCcw, Trash2, Users } from 'lucide-react'
import React from 'react'
import { CollapsibleSection } from '../CollapsibleSection'
import type { WorkerEntry } from '../types'

interface WorkforceSectionProps {
  workerEntries: WorkerEntry[]
  setWorkerEntries: React.Dispatch<React.SetStateAction<WorkerEntry[]>>
  workers: Profile[]
  isExpanded: boolean
  onToggle: () => void
  permissions: any
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
  const totalLaborHours = workerEntries.reduce(
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

  const removeWorkerEntry = (id: string) => {
    setWorkerEntries(prev => prev.filter(e => e.id !== id))
  }

  const updateWorkerEntry = (id: string, updates: Partial<WorkerEntry>) => {
    setWorkerEntries(prev =>
      prev.map(entry => (entry.id === id ? { ...entry, ...updates } : entry))
    )
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
      badge={
        <Badge
          variant="secondary"
          className="bg-slate-50 text-[#1A254F] border-slate-200 font-bold"
        >
          {workerEntries.length}명 / {totalLaborHours.toFixed(1)}공수
        </Badge>
      }
    >
      <div className="space-y-6">
        {/* 통계 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl flex flex-col gap-1 border border-slate-100">
            <div className="text-[11px] font-black uppercase tracking-tighter text-[#1A254F] opacity-30">
              투입 작업자
            </div>
            <div className="text-2xl font-black text-[#1A254F] italic tracking-tight">
              {workerEntries.length} <span className="text-sm font-bold not-italic ml-0.5">명</span>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl flex flex-col gap-1 border border-slate-100">
            <div className="text-[11px] font-black uppercase tracking-tighter text-[#1A254F] opacity-30">
              총 투입공수
            </div>
            <div className="text-2xl font-black text-[#1A254F] italic tracking-tight">
              {totalLaborHours.toFixed(1)}{' '}
              <span className="text-sm font-bold not-italic ml-0.5">공수</span>
            </div>
          </div>
        </div>

        {/* 리스트 */}
        <div className="space-y-3">
          {workerEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/30 px-6 py-10 flex flex-col items-center text-center">
              <div className="bg-white p-3 rounded-full shadow-sm mb-4">
                <Users className="h-6 w-6 text-slate-300" />
              </div>
              <p className="font-black text-slate-800 tracking-tight">
                등록된 인력 투입 내역이 없습니다.
              </p>
              <p className="mt-2 text-xs text-slate-500 max-w-sm leading-relaxed mb-6">
                “항목 추가” 버튼을 눌러 투입 인원과 공수를 등록해 주세요.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={addWorkerEntry}
                className="h-10 rounded-xl border-dashed border-slate-300 hover:border-blue-400 hover:text-blue-600 px-6 font-bold"
              >
                <Plus className="h-4 w-4 mr-2" />
                항목 추가
              </Button>
            </div>
          ) : (
            workerEntries.map((entry, index) => (
              <div
                key={entry.id}
                className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm shadow-slate-100/50"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  {/* 작업자 선택 */}
                  <div className="col-span-1 md:col-span-5 space-y-1.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-[#1A254F] text-white w-6 h-6 rounded flex items-center justify-center text-[10px] font-black italic">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <Label className="text-[11px] font-black text-foreground uppercase tracking-tighter opacity-50">
                        투입 인원 (성명)
                      </Label>
                    </div>

                    {entry.is_direct_input ? (
                      <div className="flex gap-2">
                        <Input
                          autoFocus
                          placeholder="성명 직접 입력"
                          className="h-10 rounded-xl bg-gray-50 border-none px-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all flex-1"
                          value={entry.worker_name}
                          onChange={e =>
                            updateWorkerEntry(entry.id, { worker_name: e.target.value })
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 px-0 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() =>
                            updateWorkerEntry(entry.id, { is_direct_input: false, worker_id: '' })
                          }
                          title="목록에서 선택"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <CustomSelect
                        value={entry.worker_id || '__unset__'}
                        onValueChange={value => {
                          if (value === 'direct') {
                            updateWorkerEntry(entry.id, {
                              is_direct_input: true,
                              worker_id: '',
                              worker_name: '',
                            })
                          } else {
                            const selectedWorker = workers.find(w => w.id === value)
                            updateWorkerEntry(entry.id, {
                              worker_id: value,
                              worker_name: selectedWorker?.full_name || '',
                              is_direct_input: false,
                            })
                          }
                        }}
                      >
                        <CustomSelectTrigger className="h-10 rounded-xl bg-gray-50 border-none px-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all">
                          <CustomSelectValue placeholder="작업자 선택" />
                        </CustomSelectTrigger>
                        <CustomSelectContent>
                          <CustomSelectItem
                            value="direct"
                            className="text-blue-600 font-bold border-b border-gray-100"
                          >
                            <Plus className="h-3.5 w-3.5 mr-1.5 inline" /> 명단에 없는 인원 직접
                            입력
                          </CustomSelectItem>
                          <CustomSelectItem value="__unset__">선택 안 함</CustomSelectItem>
                          {(workers || []).map(profile => (
                            <CustomSelectItem key={profile.id} value={profile.id}>
                              {profile.full_name}
                            </CustomSelectItem>
                          ))}
                        </CustomSelectContent>
                      </CustomSelect>
                    )}
                  </div>

                  {/* 공수 선택 */}
                  <div className="col-span-1 md:col-span-5 space-y-1.5">
                    <Label className="text-[11px] font-black text-foreground uppercase tracking-tighter opacity-50 pl-1 mb-1 block">
                      투입 공수 (단위: 공수)
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {allowedLaborHours
                        .filter(val => val !== 0)
                        .map(val => (
                          <Button
                            key={val}
                            type="button"
                            variant={entry.labor_hours === val ? 'default' : 'outline'}
                            size="sm"
                            className={cn(
                              'h-9 min-w-[3.5rem] rounded-xl text-xs font-bold transition-all whitespace-nowrap',
                              entry.labor_hours === val
                                ? 'bg-[#1A254F] text-white shadow-md'
                                : 'bg-white hover:bg-gray-50 text-gray-500 border-slate-200'
                            )}
                            onClick={() => updateWorkerEntry(entry.id, { labor_hours: val })}
                          >
                            {formatLaborHourLabel(val)}
                          </Button>
                        ))}
                      {!isAllowedLaborHourValue(entry.labor_hours) && (
                        <Badge
                          variant="outline"
                          className="h-9 px-3 rounded-xl border-amber-200 text-amber-700 font-bold"
                        >
                          기타: {formatLaborHourLabel(entry.labor_hours)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* 삭제 버튼 */}
                  <div className="col-span-1 md:col-span-2 md:pt-6 flex justify-end items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addWorkerEntry}
                      className="h-9 rounded-xl border-dashed border-gray-300 hover:border-blue-400 hover:text-blue-600 transition-all whitespace-nowrap px-4"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      항목 추가
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-10 w-full md:w-10 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all flex items-center justify-center gap-2"
                      onClick={() => removeWorkerEntry(entry.id)}
                      title="항목 삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="md:hidden font-bold">삭제</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
          {/* 하단 추가 버튼 제거 (항목별 우측 버튼으로 대체) */}
        </div>
      </div>
    </CollapsibleSection>
  )
}
