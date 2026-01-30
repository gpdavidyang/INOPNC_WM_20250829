import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Search, X, ChevronDown } from 'lucide-react'
import { WorkDataMap } from '@inopnc/shared'
import { useCalendar } from '../hooks/useCalendar'
import { useMoneyFilters } from '../hooks/useMoneyFilters'
import SearchableComboBox from '../../components/SearchableComboBox'

interface OutputPageProps {
  workData: WorkDataMap
  setWorkData: React.Dispatch<React.SetStateAction<WorkDataMap>>
}

const OutputPage: React.FC<OutputPageProps> = ({ workData, setWorkData }) => {
  const calendarHook = useCalendar(workData, '', '')
  const {
    currentYear,
    currentMonth,
    setCurrentYear,
    setCurrentMonth,
    handleMonthChange,
    getCalendarCells,
    uniqueSites,
  } = calendarHook

  const {
    search,
    sort,
    monthFilter,
    showSearchOptions,
    filterSite,
    localSearch,
    searchWrapperRef,
    setSearch,
    setSort,
    setMonthFilter,
    setShowSearchOptions,
    setFilterSite,
    setLocalSearch,
    handleSearchChange,
    handleSearchSelect,
    handleSearchInteraction,
    handleSortChange,
    handleMonthFilterChange,
    handleFilterSiteChange,
    handleLocalSearchChange,
    resetFilters,
  } = useMoneyFilters()

  // Get calendar cells and stats
  const { cells, stats } = getCalendarCells()

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xl font-bold text-[var(--header-navy)] font-main">출력현황</span>
        <button
          className="bg-transparent border-none flex items-center gap-1 cursor-pointer text-[var(--text-sub)] text-[15px] font-semibold p-0"
          onClick={() => window.print()}
        >
          <span>출력</span>
          <X size={16} />
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-2.5 mb-4">
        {/* Search Input */}
        <div className="relative w-full" ref={searchWrapperRef}>
          <SearchableComboBox
            items={uniqueSites}
            placeholder="현장명을 입력하세요."
            selectedItem={search}
            onSelect={handleSearchSelect}
          />
        </div>

        {/* Filter Options */}
        <div className="flex gap-2">
          {/* Sort Filter */}
          <div className="relative w-full">
            <select
              className="appearance-none w-full h-[54px] bg-white border border-[#e2e8f0] rounded-xl px-[18px] pr-[40px] font-main text-[17px] font-semibold text-[#111111] hover:border-[#cbd5e1] focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)] dark:bg-[#0f172a] dark:border-[#334155] dark:text-white"
              value={sort}
              onChange={e => handleSortChange(e.target.value as 'latest' | 'name')}
            >
              <option value="latest">최신순</option>
              <option value="name">이름순</option>
            </select>
            <ChevronDown
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#333333] pointer-events-none dark:text-[#94a3b8]"
              size={20}
            />
          </div>

          {/* Month Filter */}
          <div className="relative w-full">
            <select
              className="appearance-none w-full h-[54px] bg-white border border-[#e2e8f0] rounded-xl px-[18px] pr-[40px] font-main text-[17px] font-semibold text-[#111111] hover:border-[#cbd5e1] focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)] dark:bg-[#0f172a] dark:border-[#334155] dark:text-white"
              value={monthFilter}
              onChange={e => handleMonthFilterChange(e.target.value)}
            >
              <option value="2025-12">2025년 12월</option>
              <option value="2025-11">2025년 11월</option>
            </select>
            <ChevronDown
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#333333] pointer-events-none dark:text-[#94a3b8]"
              size={20}
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2.5 mb-6">
        <div className="p-[16px_4px] rounded-2xl text-center flex flex-col gap-1.5 shadow-[var(--shadow-soft)] bg-[var(--tag-affil-bg)] text-[var(--tag-affil-text)] border-2 border-[var(--tag-affil-border)]">
          <span className="text-2xl font-extrabold leading-[1.1] tracking-tighter">
            {stats.totalSites}
          </span>
          <span className="text-sm font-bold opacity-90">현장수</span>
        </div>
        <div className="p-[16px_4px] rounded-2xl text-center flex flex-col gap-1.5 shadow-[var(--shadow-soft)] bg-[var(--act-ptw-bg)] text-[var(--act-ptw-text)] border-2 border-[var(--act-ptw-border)]">
          <span className="text-2xl font-extrabold leading-[1.1] tracking-tighter">
            {stats.totalMan.toFixed(1)}
          </span>
          <span className="text-sm font-bold opacity-90">공수</span>
        </div>
        <div className="p-[16px_4px] rounded-2xl text-center flex flex-col gap-1.5 shadow-[var(--shadow-soft)] bg-[var(--st-wait-bg)] text-white border-2 border-[var(--st-wait-border)]">
          <span className="text-2xl font-extrabold leading-[1.1] tracking-tighter">
            {stats.workedDaysCount}
          </span>
          <span className="text-sm font-bold opacity-90">근무일</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-[var(--bg-surface)] shadow-[var(--shadow-soft)] rounded-2xl overflow-hidden mb-4 border border-[var(--border)]">
        <div className="flex justify-between items-center px-5 py-[18px] border-b border-[var(--border)]">
          <button
            onClick={() => handleMonthChange(-1)}
            className="bg-transparent border-none cursor-pointer text-[var(--text-sub)] p-2 hover:bg-[var(--bg-body)] rounded-full"
          >
            <ChevronLeft size={28} />
          </button>
          <span className="text-[22px] font-extrabold text-[var(--text-main)]">
            {currentYear}년 {currentMonth}월
          </span>
          <button
            onClick={() => handleMonthChange(1)}
            className="bg-transparent border-none cursor-pointer text-[var(--text-sub)] p-2 hover:bg-[var(--bg-body)] rounded-full"
          >
            <ChevronRight size={28} />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center">
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <div
              key={d}
              className={`py-3.5 text-sm font-bold border-b border-[var(--border)] ${i === 0 ? 'text-[var(--danger)]' : 'text-[var(--text-sub)]'}`}
            >
              {d}
            </div>
          ))}
          {cells.map(cell => (
            <div
              key={cell.key}
              className={`min-h-[60px] border-r border-b border-[var(--border)] flex items-center justify-center p-1 ${
                cell.type === 'empty'
                  ? 'bg-[var(--bg-body)]'
                  : 'bg-white hover:bg-[var(--bg-hover)] cursor-pointer'
              } ${cell.isToday ? 'ring-2 ring-[var(--primary)]' : ''}`}
            >
              {cell.type === 'date' && (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <span
                    className={`text-xs font-semibold mb-1 ${cell.isToday ? 'text-[var(--primary)]' : 'text-[var(--text-main)]'}`}
                  >
                    {cell.day}
                  </span>
                  {cell.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default OutputPage
