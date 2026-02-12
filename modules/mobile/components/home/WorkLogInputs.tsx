'use client'

import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { AdditionalManpower, WorkLogLocation } from '@/types/worklog'
import { Calendar } from 'lucide-react'
import React from 'react'
import { LocationInput } from './LocationInput'
import { MaterialsInput } from './MaterialsInput'
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
  return (
    <>
      {/* Basic Info and Manpower Card */}
      <div className="form-section">
        <div className="work-form-title">
          <h2 className="work-form-main-title">작업 정보</h2>
        </div>
        <div
          className="form-row"
          style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 0, paddingBottom: 12 }}
        >
          <div className="form-group">
            <label className="form-label">소속</label>
            <input
              type="text"
              className="form-input"
              value={organizationLabel}
              readOnly
              style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              작업일자 <span className="required">*</span>
            </label>
            <div
              className="date-input-wrap"
              style={{ position: 'relative' }}
              onClick={onCalendarClick}
            >
              <input
                type="date"
                className="form-input date-input"
                style={{ paddingRight: '40px' }}
                value={workDate}
                onChange={e => setWorkDate(e.target.value)}
                required
              />
              <Calendar
                className="calendar-icon"
                size={16}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#666',
                  width: '16px',
                  height: '16px',
                }}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        <div className="form-row author-manpower-row">
          <div className="form-group">
            <label className="form-label">작업자</label>
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
            <NumberInput
              label="공수"
              value={mainManpower}
              onChange={setMainManpower}
              values={laborHourValues}
            />
          </div>
        </div>
      </div>

      {/* Logically separate section for Additional Manpower */}
      {additionalManpower.map(item => (
        <div key={item.id} className="additional-manpower-section">
          <div className="section-header">
            <h3 className="section-title">공수(일)</h3>
            <div className="header-actions">
              <button
                className="delete-tag-btn"
                onClick={() =>
                  setAdditionalManpower(additionalManpower.filter(m => m.id !== item.id))
                }
              >
                삭제
              </button>
            </div>
          </div>
          <div className="form-row author-manpower-row">
            <div className="form-group">
              <label className="form-label">작업자</label>
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
            <div className="form-group">
              <NumberInput
                label="공수"
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
          </div>
        </div>
      ))}

      {/* Work Content */}
      <div className="form-section work-content-section no-divider">
        <div className="section-header">
          <h3 className="section-title">
            작업 내용 기록 <span className="required">*</span>
          </h3>
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
            + 추가
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
      </div>

      {/* Work Types & Location */}
      <div className="form-section work-section">
        <MultiSelectButtons
          label="작업유형"
          options={WORK_TYPE_OPTIONS}
          selectedValues={workTypes}
          onChange={setWorkTypes}
          customInputPlaceholder="작업유형을 직접 입력하세요"
          className="mb-3"
        />

        <LocationInput location={location} onChange={setLocation} className="mt-3" />
      </div>

      {/* Additional Tasks */}
      {tasks.length > 0 && (
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">추가된 작업 세트</h3>
          </div>
          <div className="space-y-3">
            {tasks.map((t, i) => (
              <div key={i} className="work-section-item">
                <div className="section-header">
                  <h4 className="section-subtitle">작업 세트 #{i + 1}</h4>
                  <button
                    className="delete-tag-btn"
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

      <MaterialsInput materials={materials} onChange={setMaterials} />
    </>
  )
}
