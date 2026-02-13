'use client'

import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { WorkLogMaterials } from '@/modules/mobile/components/work-log/WorkLogMaterials'
import { AdditionalManpower, WorkLogLocation } from '@/types/worklog'
import { HardHat, Users } from 'lucide-react'
import React from 'react'
import { LocationInput } from './LocationInput'
import { MultiSelectButtons } from './MultiSelectButtons'
import { NumberInput } from './NumberInput'

interface WorkLogInputsProps {
  // Organization & Date
  organizationLabel: string
  workDate: string
  setWorkDate: (date: string) => void
  onCalendarClick: () => void
  onCalendarKeyDown: (e: React.KeyboardEvent) => void

  // Manpower
  selectedAuthorId: string
  setSelectedAuthorId: (id: string) => void
  userOptions: Array<{ id: string; name: string; role?: string }>
  usersLoading: boolean
  mainManpower: number
  setMainManpower: (val: number) => void
  additionalManpower: AdditionalManpower[]
  setAdditionalManpower: (list: AdditionalManpower[]) => void
  laborHourValues: number[]
  userProfile?: { id: string; full_name?: string }
  defaultLaborHour: number
  allUserOptions: Array<{ id: string; name: string; role?: string }>

  // Work Data
  memberTypes: string[]
  setMemberTypes: (types: string[]) => void
  MEMBER_TYPE_OPTIONS: Array<{ value: string; label: string }>
  workContents: string[]
  setWorkContents: (contents: string[]) => void
  WORK_PROCESS_OPTIONS: Array<{ value: string; label: string }>
  workTypes: string[]
  setWorkTypes: (types: string[]) => void
  WORK_TYPE_OPTIONS: Array<{ value: string; label: string }>
  location: WorkLogLocation
  setLocation: (loc: WorkLogLocation) => void

  // Tasks
  tasks: Array<{
    memberTypes: string[]
    processes: string[]
    workTypes: string[]
    location: WorkLogLocation
  }>
  setTasks: React.Dispatch<
    React.SetStateAction<
      Array<{
        memberTypes: string[]
        processes: string[]
        workTypes: string[]
        location: WorkLogLocation
      }>
    >
  >

  // Materials
  materials: any[]
  setMaterials: (materials: any[]) => void
}

export const WorkLogInputs: React.FC<WorkLogInputsProps> = ({
  organizationLabel,
  workDate,
  setWorkDate,
  onCalendarClick,
  onCalendarKeyDown,
  selectedAuthorId,
  setSelectedAuthorId,
  userOptions,
  usersLoading,
  mainManpower,
  setMainManpower,
  additionalManpower,
  setAdditionalManpower,
  laborHourValues,
  userProfile,
  defaultLaborHour,
  allUserOptions,
  memberTypes,
  setMemberTypes,
  MEMBER_TYPE_OPTIONS,
  workContents,
  setWorkContents,
  WORK_PROCESS_OPTIONS,
  workTypes,
  setWorkTypes,
  WORK_TYPE_OPTIONS,
  location,
  setLocation,
  tasks,
  setTasks,
  materials,
  setMaterials,
}) => {
  /* Helper to add additional manpower */
  const handleAddManpower = () => {
    setAdditionalManpower([
      ...additionalManpower,
      { id: Date.now().toString(), manpower: defaultLaborHour },
    ])
  }

  return (
    <>
      {/* Basic Info moved to HomePage */}

      {/* Manpower Card */}
      <div
        className="rounded-2xl p-6 shadow-sm border border-transparent dark:border-slate-700 mb-4"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex justify-between items-center mb-3">
          <div
            className="text-xl font-bold text-header-navy dark:text-white flex items-center gap-2"
            style={{ color: 'var(--header-navy)' }}
          >
            <Users className="w-5 h-5" style={{ color: 'var(--header-navy)' }} />
            투입 인원(공수) <span className="text-red-500">*</span>
          </div>
          <button className="add-btn" onClick={handleAddManpower}>
            <span>+</span> 추가
          </button>
        </div>

        <div className="form-row author-manpower-row">
          <div className="form-group">
            <CustomSelect
              value={selectedAuthorId || ''}
              onValueChange={val => setSelectedAuthorId(val)}
            >
              <CustomSelectTrigger className="form-select author-select">
                <CustomSelectValue placeholder={'작업자 선택'} />
              </CustomSelectTrigger>
              <CustomSelectContent>
                {usersLoading && userOptions.length === 0 ? (
                  <CustomSelectItem value="__loading__" disabled>
                    사용자 불러오는 중...
                  </CustomSelectItem>
                ) : userOptions.length === 0 ? (
                  <CustomSelectItem value="__empty__" disabled>
                    표시할 사용자가 없습니다
                  </CustomSelectItem>
                ) : (
                  userOptions.map(u => (
                    <CustomSelectItem key={u.id} value={u.id}>
                      {u.name}
                    </CustomSelectItem>
                  ))
                )}
              </CustomSelectContent>
            </CustomSelect>
          </div>
          <div className="form-group">
            <NumberInput value={mainManpower} onChange={setMainManpower} values={laborHourValues} />
          </div>
        </div>

        {additionalManpower.map(item => (
          <div key={item.id} className="additional-manpower-section pt-3 border-t mt-3">
            <div className="grid grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)_auto] gap-2 items-center">
              <div>
                <CustomSelect
                  value={item.workerId || ''}
                  onValueChange={val => {
                    const opt = userOptions.find(u => u.id === val)
                    const updated = additionalManpower.map(m =>
                      m.id === item.id ? { ...m, workerId: val, workerName: opt?.name || '' } : m
                    )
                    setAdditionalManpower(updated)
                  }}
                >
                  <CustomSelectTrigger className="form-select author-select">
                    <CustomSelectValue placeholder={'작업자 선택'} />
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    {usersLoading && userOptions.length === 0 ? (
                      <CustomSelectItem value="__loading__" disabled>
                        사용자 불러오는 중...
                      </CustomSelectItem>
                    ) : userOptions.length === 0 ? (
                      <CustomSelectItem value="__empty__" disabled>
                        표시할 사용자가 없습니다
                      </CustomSelectItem>
                    ) : (
                      userOptions.map(u => (
                        <CustomSelectItem key={u.id} value={u.id}>
                          {u.name}
                        </CustomSelectItem>
                      ))
                    )}
                  </CustomSelectContent>
                </CustomSelect>
              </div>
              <div>
                <NumberInput
                  value={item.manpower}
                  onChange={value => {
                    const updated = additionalManpower.map(m =>
                      m.id === item.id ? { ...m, manpower: value } : m
                    )
                    setAdditionalManpower(updated)
                  }}
                  values={laborHourValues}
                />
              </div>
              <button
                className="bg-red-50 text-red-500 text-sm font-bold px-2.5 py-1 rounded-xl h-[48px] whitespace-nowrap"
                onClick={() =>
                  setAdditionalManpower(additionalManpower.filter(m => m.id !== item.id))
                }
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Work Content */}
      <div
        className="rounded-2xl p-6 shadow-sm border border-transparent dark:border-slate-700 mb-4"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex justify-between items-center mb-3">
          <div
            className="text-xl font-bold text-header-navy dark:text-white flex items-center gap-2"
            style={{ color: 'var(--header-navy)' }}
          >
            <HardHat className="w-5 h-5" style={{ color: 'var(--header-navy)' }} />
            작업내용 <span className="text-red-500">*</span>
          </div>
          <button
            className="add-btn"
            onClick={() => {
              setTasks(prev => [
                ...prev,
                {
                  memberTypes: [],
                  processes: [],
                  workTypes: [],
                  location: { block: '', dong: '', unit: '' },
                },
              ])
            }}
          >
            <span>+</span> 추가
          </button>
        </div>

        <MultiSelectButtons
          label="부재명"
          options={MEMBER_TYPE_OPTIONS}
          selectedValues={memberTypes}
          onChange={setMemberTypes}
          customInputPlaceholder="부재명을 직접 입력하세요"
          className="mb-3"
        />

        <MultiSelectButtons
          label="작업공정"
          options={WORK_PROCESS_OPTIONS}
          selectedValues={workContents}
          onChange={setWorkContents}
          customInputPlaceholder="작업공정을 직접 입력하세요"
          className="mb-3"
        />

        <MultiSelectButtons
          label="작업유형"
          options={WORK_TYPE_OPTIONS}
          selectedValues={workTypes}
          onChange={setWorkTypes}
          customInputPlaceholder="작업유형을 직접 입력하세요"
          className="mb-3"
        />

        <LocationInput location={location} onChange={setLocation} className="mt-3" />

        {/* Additional Tasks */}
        {tasks.length > 0 && (
          <div className="pt-4 mt-4 border-t border-dashed">
            <div className="section-header mb-3">
              <h3 className="section-title text-base font-bold">추가된 작업 세트</h3>
            </div>
            <div className="space-y-3">
              {tasks.map((t, i) => (
                <div
                  key={i}
                  className="work-section-item p-4 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <div className="section-header flex justify-between items-center mb-3">
                    <h4 className="section-subtitle font-bold text-sm">작업 세트 #{i + 1}</h4>
                    <button
                      className="bg-red-50 text-red-500 text-sm font-bold px-3 py-1.5 rounded-xl hover:bg-red-100 transition-colors shrink-0"
                      onClick={() => setTasks(prev => prev.filter((_, idx) => idx !== i))}
                    >
                      삭제
                    </button>
                  </div>

                  <MultiSelectButtons
                    label="부재명"
                    options={MEMBER_TYPE_OPTIONS}
                    selectedValues={t.memberTypes}
                    onChange={vals =>
                      setTasks(prev =>
                        prev.map((row, idx) => (idx === i ? { ...row, memberTypes: vals } : row))
                      )
                    }
                    customInputPlaceholder="부재명을 직접 입력하세요"
                    className="mb-3"
                  />

                  <MultiSelectButtons
                    label="작업공정"
                    options={WORK_PROCESS_OPTIONS}
                    selectedValues={t.processes}
                    onChange={vals =>
                      setTasks(prev =>
                        prev.map((row, idx) => (idx === i ? { ...row, processes: vals } : row))
                      )
                    }
                    customInputPlaceholder="작업공정을 직접 입력하세요"
                    className="mb-3"
                  />

                  <MultiSelectButtons
                    label="작업유형"
                    options={WORK_TYPE_OPTIONS}
                    selectedValues={t.workTypes}
                    onChange={vals =>
                      setTasks(prev =>
                        prev.map((row, idx) => (idx === i ? { ...row, workTypes: vals } : row))
                      )
                    }
                    customInputPlaceholder="작업유형을 직접 입력하세요"
                    className="mb-3"
                  />

                  <LocationInput
                    location={t.location}
                    onChange={loc =>
                      setTasks(prev =>
                        prev.map((row, idx) => (idx === i ? { ...row, location: loc } : row))
                      )
                    }
                    className="mt-3"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <WorkLogMaterials materials={materials} onChange={setMaterials} disabled={false} />
    </>
  )
}
