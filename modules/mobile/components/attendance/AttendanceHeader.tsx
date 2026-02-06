'use client'

import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import clsx from 'clsx'
import React from 'react'
import { SiteOption } from '../../types/attendance'

interface AttendanceHeaderProps {
  activeTab: 'work' | 'salary'
  setActiveTab: (tab: 'work' | 'salary') => void
  selectedSiteId: string
  setSelectedSiteId: (id: string) => void
  siteOptions: SiteOption[]
  selectedYearMonth: string
  handleYearMonthChange: (val: string) => void
  yearMonthOptions: { value: string; label: string }[]
  statusFilter: 'all' | 'submitted' | 'approved' | 'rejected'
  setStatusFilter: (val: 'all' | 'submitted' | 'approved' | 'rejected') => void
}

export const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedSiteId,
  setSelectedSiteId,
  siteOptions,
  selectedYearMonth,
  handleYearMonthChange,
  yearMonthOptions,
  statusFilter,
  setStatusFilter,
}) => {
  return (
    <div className="space-y-4">
      <nav
        className="line-tabs"
        style={{ width: 'calc(100% + 32px)', marginLeft: '-16px', marginRight: '-16px' }}
      >
        <button
          type="button"
          className={clsx('line-tab', activeTab === 'work' && 'active')}
          onClick={() => setActiveTab('work')}
        >
          출력현황
        </button>
        <button
          type="button"
          className={clsx('line-tab', activeTab === 'salary' && 'active')}
          onClick={() => setActiveTab('salary')}
        >
          급여현황
        </button>
      </nav>

      {activeTab === 'work' && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="w-full">
              <CustomSelect value={selectedSiteId} onValueChange={setSelectedSiteId}>
                <CustomSelectTrigger className="calendar-filter-trigger text-[15px] font-semibold w-full">
                  <CustomSelectValue placeholder="현장 선택" />
                </CustomSelectTrigger>
                <CustomSelectContent className="max-h-[350px]">
                  {siteOptions.map(opt => (
                    <CustomSelectItem
                      key={opt.value}
                      value={opt.value}
                      className="py-3 text-[15px]"
                    >
                      {opt.label}
                    </CustomSelectItem>
                  ))}
                </CustomSelectContent>
              </CustomSelect>
            </div>

            <div className="w-full">
              <CustomSelect value={selectedYearMonth} onValueChange={handleYearMonthChange}>
                <CustomSelectTrigger className="calendar-filter-trigger text-[15px] font-semibold w-full">
                  <CustomSelectValue placeholder="날짜 선택" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  {yearMonthOptions.map(opt => (
                    <CustomSelectItem
                      key={opt.value}
                      value={opt.value}
                      className="py-3 text-[15px]"
                    >
                      {opt.label}
                    </CustomSelectItem>
                  ))}
                </CustomSelectContent>
              </CustomSelect>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
