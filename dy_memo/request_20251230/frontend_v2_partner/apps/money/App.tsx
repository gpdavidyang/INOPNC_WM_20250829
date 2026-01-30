import React, { useState, useMemo, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Share,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { INITIAL_WORK_DATA, SALARY_HISTORY } from './constants'
import { WorkEntry, WorkDataMap, NotificationItem } from './types'
import SearchableComboBox from './components/SearchableComboBox'
import PayStubOverlay from './components/PayStubOverlay'
import { MainLayout } from '@inopnc/shared'

function App() {
  // --- Global State ---
  const [activeTab, setActiveTab] = useState<'output' | 'salary'>('output')

  // --- Calendar State ---
  const [currentYear, setCurrentYear] = useState(2025)
  const [currentMonth, setCurrentMonth] = useState(12)
  const [filterSite, setFilterSite] = useState('')
  const [localSearch, setLocalSearch] = useState('')
  const [workData, setWorkData] = useState<WorkDataMap>(INITIAL_WORK_DATA)

  // --- Salary State ---
  const [isPrivacyOn, setIsPrivacyOn] = useState(true)
  const [salHistoryExpanded, setSalHistoryExpanded] = useState(false)
  const [salDateFilter, setSalDateFilter] = useState('all')
  const [selectedPayStub, setSelectedPayStub] = useState<(typeof SALARY_HISTORY)[0] | null>(null)
  const [isPayStubOpen, setIsPayStubOpen] = useState(false)

  // --- Derived Data: Unique Sites for Combobox ---
  const uniqueSites = useMemo(() => {
    const sites = new Set<string>()
    Object.keys(workData).forEach(key => {
      workData[key].forEach(entry => sites.add(entry.site))
    })
    return Array.from(sites).sort()
  }, [workData])

  // --- Calendar Logic ---
  const handleMonthChange = (delta: number) => {
    let nextMonth = currentMonth + delta
    let nextYear = currentYear
    if (nextMonth > 12) {
      nextMonth = 1
      nextYear++
    }
    if (nextMonth < 1) {
      nextMonth = 12
      nextYear--
    }
    setCurrentMonth(nextMonth)
    setCurrentYear(nextYear)
  }

  const getCalendarCells = () => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay()
    const lastDate = new Date(currentYear, currentMonth, 0).getDate()
    const cells = []

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      cells.push({ type: 'empty', key: `empty-${i}` })
    }

    // Date cells
    let totalSites = 0
    let totalMan = 0
    let workedDaysCount = 0

    for (let d = 1; d <= lastDate; d++) {
      const dateStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`
      const dayEntries = workData[dateStr] || []

      // Filter logic
      const filteredEntries = dayEntries.filter(entry => {
        const matchSite = filterSite === '' || entry.site === filterSite // Exact match for Combobox selection
        const matchSearch =
          localSearch === '' || entry.site.toLowerCase().includes(localSearch.toLowerCase())
        return matchSite && matchSearch
      })

      let dayTotalAmt = 0
      let dayTotalMan = 0
      let displayContent = null

      if (filteredEntries.length > 0) {
        filteredEntries.forEach(e => {
          dayTotalAmt += e.price
          dayTotalMan += e.man
        })

        // Site Name Summary (Shorten)
        const baseName = filteredEntries[0].site.replace(/\s+/g, '')
        const shortName = baseName.slice(0, 4)
        const siteDisplay =
          filteredEntries.length > 1 ? `${shortName}외${filteredEntries.length - 1}` : shortName

        displayContent = (
          <div className="w-full flex flex-col items-center justify-center bg-transparent py-0.5">
            <span className="text-[11px] font-bold text-text-sub leading-tight mb-[1px] dark:text-[#cbd5e1]">
              {dayTotalMan.toFixed(1)}
            </span>
            <span className="text-[12px] font-extrabold text-primary leading-tight">
              {(dayTotalAmt / 10000).toFixed(1)}만
            </span>
            <span className="text-[10px] font-semibold text-text-sub leading-tight mt-[2px] whitespace-nowrap overflow-hidden text-ellipsis max-w-full block text-center dark:text-[#94a3b8]">
              {siteDisplay}
            </span>
          </div>
        )

        totalSites += filteredEntries.length
        totalMan += dayTotalMan
        workedDaysCount++
      }

      const isToday =
        new Date().toDateString() === new Date(currentYear, currentMonth - 1, d).toDateString()

      cells.push({
        type: 'date',
        key: dateStr,
        day: d,
        content: displayContent,
        isToday,
      })
    }

    return { cells, totalSites, totalMan, workedDaysCount }
  }

  const { cells, totalSites, totalMan, workedDaysCount } = getCalendarCells()

  // --- Salary Logic ---
  const currentMonthData = useMemo(() => {
    // Aggregate data for current month (Top Card)
    const prefix = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`
    let mTotalMan = 0
    let mTotalPay = 0

    Object.keys(workData).forEach(dateStr => {
      if (dateStr.startsWith(prefix)) {
        workData[dateStr].forEach(e => {
          mTotalMan += e.man
          mTotalPay += e.price
        })
      }
    })

    const tax = Math.floor(mTotalPay * 0.033)
    const netPay = mTotalPay - tax
    const avgPrice = mTotalMan > 0 ? Math.round(mTotalPay / mTotalMan) : 0

    return { mTotalMan, netPay, avgPrice }
  }, [workData, currentYear, currentMonth])

  const filteredHistory = useMemo(() => {
    return SALARY_HISTORY.filter(item => salDateFilter === 'all' || item.rawDate === salDateFilter)
  }, [salDateFilter])

  const displayHistory = salHistoryExpanded ? filteredHistory : filteredHistory.slice(0, 2)

  // --- Handlers ---
  const handleOpenPayStub = (item: (typeof SALARY_HISTORY)[0]) => {
    setSelectedPayStub(item)
    setIsPayStubOpen(true)
  }

  return (
    <MainLayout title="INOPNC">
      {/* Header & Tabs */}
      <header className="fixed top-[60px] left-0 right-0 bg-bg-surface border-b border-border z-[1000] flex flex-col transition-colors dark:bg-[#1e293b] dark:border-[#334155]">
        <div className="w-full max-w-[600px] mx-auto flex h-[55px]">
          <button
            onClick={() => setActiveTab('output')}
            className={`flex-1 h-full border-b-2 bg-transparent text-xl font-bold cursor-pointer transition-all duration-200 font-main ${activeTab === 'output' ? 'text-primary border-primary font-extrabold' : 'text-text-sub border-transparent hover:text-primary/70 dark:text-[#94a3b8]'}`}
          >
            출력현황
          </button>
          <button
            onClick={() => setActiveTab('salary')}
            className={`flex-1 h-full border-b-2 bg-transparent text-xl font-bold cursor-pointer transition-all duration-200 font-main ${activeTab === 'salary' ? 'text-primary border-primary font-extrabold' : 'text-text-sub border-transparent hover:text-primary/70 dark:text-[#94a3b8]'}`}
          >
            급여현황
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full max-w-[600px] mx-auto px-4 py-3 pb-5" style={{ paddingTop: '120px' }}>
        {/* Tab: Output */}
        {activeTab === 'output' && (
          <div className="animate-fadeIn">
            {/* Local Search */}
            <div className="relative mb-3 mt-1 flex items-center">
              <input
                type="text"
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                className="w-full h-[54px] rounded-2xl bg-white border border-transparent px-[22px] pr-[48px] text-[17px] text-text-main font-medium shadow-[0_4px_20px_rgba(0,0,0,0.05)] focus:shadow-[0_0_0_2px_#31a3fa] focus:bg-white focus:outline-none dark:bg-[#0f172a] dark:border-[#334155] dark:text-white dark:shadow-none"
                placeholder="현장명을 입력하세요."
              />
              <div className="absolute right-[18px] top-1/2 -translate-y-1/2">
                {localSearch ? (
                  <button
                    onClick={() => setLocalSearch('')}
                    className="bg-[#cbd5e1] text-white rounded-full w-[22px] h-[22px] flex items-center justify-center border-none cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                ) : (
                  <Search className="text-text-placeholder w-5 pointer-events-none" />
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-5">
              {/* REPLACED WITH COMBOBOX */}
              <SearchableComboBox
                items={uniqueSites}
                placeholder="전체 현장"
                selectedItem={filterSite}
                onSelect={setFilterSite}
              />

              <div className="relative w-full">
                <select
                  className="appearance-none w-full h-[54px] bg-white border border-[#e2e8f0] rounded-xl px-[18px] pr-[40px] font-main text-[17px] font-semibold text-[#111111] hover:border-[#cbd5e1] focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)] dark:bg-[#0f172a] dark:border-[#334155] dark:text-white"
                  value={`${currentYear}-${currentMonth.toString().padStart(2, '0')}`}
                  onChange={e => {
                    const [y, m] = e.target.value.split('-')
                    setCurrentYear(parseInt(y))
                    setCurrentMonth(parseInt(m))
                  }}
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

            {/* Calendar */}
            <div className="bg-bg-surface shadow-[0_4px_20px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden mb-4 dark:bg-[#1e293b] dark:shadow-none dark:border dark:border-[#334155]">
              <div className="flex justify-between items-center px-5 py-[18px] border-b border-border dark:border-[#334155]">
                <button
                  onClick={() => handleMonthChange(-1)}
                  className="bg-transparent border-none cursor-pointer text-text-sub p-2 hover:bg-gray-100 rounded-full dark:text-[#cbd5e1] dark:hover:bg-gray-700"
                >
                  <ChevronLeft size={28} />
                </button>
                <span className="text-[22px] font-extrabold text-text-main dark:text-white">
                  {currentYear}년 {currentMonth}월
                </span>
                <button
                  onClick={() => handleMonthChange(1)}
                  className="bg-transparent border-none cursor-pointer text-text-sub p-2 hover:bg-gray-100 rounded-full dark:text-[#cbd5e1] dark:hover:bg-gray-700"
                >
                  <ChevronRight size={28} />
                </button>
              </div>

              <div className="grid grid-cols-7 text-center">
                {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                  <div
                    key={d}
                    className={`py-3.5 text-sm font-bold border-b border-border dark:border-[#334155] ${i === 0 ? 'text-danger' : 'text-text-sub dark:text-[#cbd5e1]'}`}
                  >
                    {d}
                  </div>
                ))}

                {cells.map((cell: any, i) => (
                  <div
                    key={cell.key}
                    className={`min-h-[96px] border-r border-b border-border p-[6px_1px] flex flex-col items-center gap-[3px] relative cursor-pointer active:bg-primary-bg dark:border-[#334155] dark:active:bg-blue-900/20 ${i % 7 === 6 ? 'border-r-0' : ''}`}
                    onClick={() => {
                      /* Edit Modal Logic Placeholder */
                    }}
                  >
                    {cell.type === 'date' && (
                      <>
                        <span
                          className={`text-[15px] font-semibold flex items-center justify-center w-[26px] h-[26px] rounded-full mb-1 ${cell.isToday ? 'bg-[#1a254f] text-white font-extrabold dark:bg-primary' : 'text-text-main dark:text-white'}`}
                        >
                          {cell.day}
                        </span>
                        {cell.content}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-2.5 mb-6">
              <div className="p-[16px_4px] rounded-2xl text-center flex flex-col gap-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] bg-[#eaf6ff] text-[#0284c7] border border-[#0284c7] dark:bg-[#0c4a6e] dark:text-[#38bdf8] dark:border-[#38bdf8] dark:shadow-none">
                <span className="text-2xl font-extrabold leading-[1.1] tracking-tighter">
                  {totalSites}
                </span>
                <span className="text-sm font-bold opacity-90">현장수</span>
              </div>
              <div className="p-[16px_4px] rounded-2xl text-center flex flex-col gap-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] bg-[#f0f3f9] text-[#1e3a8a] border border-[#1e3a8a] dark:bg-[#1e1b4b] dark:text-[#a5b4fc] dark:border-[#a5b4fc] dark:shadow-none">
                <span className="text-2xl font-extrabold leading-[1.1] tracking-tighter">
                  {totalMan.toFixed(1)}
                </span>
                <span className="text-sm font-bold opacity-90">공수</span>
              </div>
              <div className="p-[16px_4px] rounded-2xl text-center flex flex-col gap-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] bg-[#f1f5f9] text-[#475569] border border-[#475569] dark:bg-[#1e2540] dark:text-[#94a3b8] dark:border-[#94a3b8] dark:shadow-none">
                <span className="text-2xl font-extrabold leading-[1.1] tracking-tighter">
                  {workedDaysCount}
                </span>
                <span className="text-sm font-bold opacity-90">근무일</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Salary */}
        {activeTab === 'salary' && (
          <div className="animate-fadeIn">
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
              <span className="text-xl font-bold text-header-navy font-main dark:text-white">
                이번 달 지급 대기
              </span>
              <button
                onClick={() => setIsPrivacyOn(!isPrivacyOn)}
                className="bg-transparent border-none flex items-center gap-1 cursor-pointer text-text-sub text-[15px] font-semibold p-0 dark:text-[#94a3b8]"
              >
                <span>금액 보기/숨기기</span>
                {isPrivacyOn ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Current Salary Card */}
            <div className="bg-bg-surface shadow-[0_4px_20px_rgba(0,0,0,0.05)] rounded-2xl p-[24px_20px] mb-6 dark:bg-[#1e293b] dark:shadow-none dark:border dark:border-[#334155]">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-extrabold text-text-main dark:text-white">
                  {currentYear}년 {currentMonth}월
                </span>
                <span className="text-[13px] font-semibold px-2.5 py-1 rounded-full border bg-primary-bg text-primary border-primary">
                  지급대기
                </span>
              </div>

              <div className="flex justify-between items-center mb-3.5 pb-3.5 border-b border-dashed border-border gap-2 flex-nowrap dark:border-[#334155]">
                <span className="font-bold text-text-main shrink-0 dark:text-white">
                  실수령 예정액
                </span>
                <div className="flex items-baseline justify-end gap-0.5 whitespace-nowrap shrink flex-nowrap">
                  <span className="text-[24px] text-text-main font-extrabold tracking-tighter whitespace-nowrap dark:text-white">
                    {isPrivacyOn ? '****' : currentMonthData.netPay.toLocaleString()}
                  </span>
                  <span className="text-base font-semibold text-text-main dark:text-white">원</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-2 text-[15px] text-text-sub flex-nowrap gap-2">
                <span className="font-bold text-text-main shrink-0 dark:text-white">공수</span>
                <span className="font-semibold text-text-main text-[16px] dark:text-[#cbd5e1]">
                  {currentMonthData.mTotalMan.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2 text-[15px] text-text-sub flex-nowrap gap-2">
                <span className="font-bold text-text-main shrink-0 dark:text-white">평균단가</span>
                <span className="font-semibold text-text-main text-[16px] dark:text-[#cbd5e1]">
                  {isPrivacyOn ? '****' : currentMonthData.avgPrice.toLocaleString()}
                </span>
              </div>

              <button className="w-full mt-4 p-3 rounded-[10px] bg-header-navy text-white border-none flex items-center justify-center gap-2 font-bold text-base cursor-pointer hover:bg-primary transition-colors dark:bg-primary">
                <Share size={18} /> 지급 요청하기 (공유)
              </button>
            </div>

            {/* History Section */}
            <div className="flex justify-between items-center mb-3 mt-[30px]">
              <span className="text-xl font-bold text-header-navy font-main dark:text-white">
                지난 급여 내역
              </span>
            </div>

            <div className="flex gap-3 mb-5">
              <div className="relative w-full">
                <select
                  className="appearance-none w-full h-[54px] bg-white border border-[#e2e8f0] rounded-xl px-[18px] pr-[40px] font-main text-[17px] font-semibold text-[#111111] hover:border-[#cbd5e1] focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)] dark:bg-[#0f172a] dark:border-[#334155] dark:text-white"
                  value={salDateFilter}
                  onChange={e => setSalDateFilter(e.target.value)}
                >
                  <option value="all">2025년 전체</option>
                  <option value="2025-11">2025년 11월</option>
                  <option value="2025-10">2025년 10월</option>
                </select>
                <ChevronDown
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#333333] pointer-events-none dark:text-[#94a3b8]"
                  size={20}
                />
              </div>
              <div className="relative w-full">
                <select className="appearance-none w-full h-[54px] bg-white border border-[#e2e8f0] rounded-xl px-[18px] pr-[40px] font-main text-[17px] font-semibold text-[#111111] hover:border-[#cbd5e1] focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)] dark:bg-[#0f172a] dark:border-[#334155] dark:text-white">
                  <option value="latest">최신순</option>
                  <option value="amount">금액순</option>
                </select>
                <ChevronDown
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#333333] pointer-events-none dark:text-[#94a3b8]"
                  size={20}
                />
              </div>
            </div>

            {/* History List */}
            <div className="flex flex-col gap-6">
              {displayHistory.length === 0 ? (
                <div className="text-center py-8 text-text-placeholder">내역이 없습니다.</div>
              ) : (
                displayHistory.map(item => {
                  const tax = Math.floor(item.baseTotal * 0.033)
                  const net = item.baseTotal - tax
                  return (
                    <div
                      key={item.rawDate}
                      className="bg-bg-surface shadow-[0_4px_20px_rgba(0,0,0,0.05)] rounded-2xl p-[24px_20px] dark:bg-[#1e293b] dark:shadow-none dark:border dark:border-[#334155]"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-extrabold text-text-main dark:text-white">
                          {item.month}
                        </span>
                        <span className="text-[13px] font-semibold px-2.5 py-1 rounded-full border bg-bg-body text-text-sub border-border dark:bg-[#0f172a] dark:text-[#cbd5e1] dark:border-[#334155]">
                          지급완료
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-3.5 pb-3.5 border-b border-dashed border-border gap-2 flex-nowrap dark:border-[#334155]">
                        <span className="font-bold text-text-main shrink-0 dark:text-white">
                          실수령액
                        </span>
                        <div className="flex items-baseline justify-end gap-0.5 whitespace-nowrap shrink flex-nowrap">
                          <span className="text-[20px] text-text-main font-extrabold tracking-tighter whitespace-nowrap dark:text-white">
                            {isPrivacyOn ? '****' : net.toLocaleString()}
                          </span>
                          <span className="text-base font-semibold text-text-main dark:text-white">
                            원
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mb-2 text-[15px] text-text-sub flex-nowrap gap-2">
                        <span className="font-bold text-text-main shrink-0 dark:text-white">
                          공수
                        </span>
                        <span className="font-semibold text-text-main text-[16px] dark:text-[#cbd5e1]">
                          {item.man.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-2 text-[15px] text-text-sub flex-nowrap gap-2">
                        <span className="font-bold text-text-main shrink-0 dark:text-white">
                          단가
                        </span>
                        <span className="font-semibold text-text-main text-[16px] dark:text-[#cbd5e1]">
                          {isPrivacyOn ? '****' : Math.round(item.price).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-2 text-[15px] text-text-sub flex-nowrap gap-2">
                        <span className="font-bold text-text-main shrink-0 dark:text-white">
                          공제 (3.3%)
                        </span>
                        <span className="font-semibold text-danger text-[16px]">
                          {isPrivacyOn ? '****' : `-${tax.toLocaleString()}`}
                        </span>
                      </div>

                      <button
                        onClick={() => handleOpenPayStub(item)}
                        className="w-full mt-4 p-3 rounded-[10px] bg-[#f8fafc] text-[#475569] border border-[#cbd5e1] font-bold text-base cursor-pointer hover:bg-gray-100 transition-colors dark:bg-[#0f172a] dark:text-[#cbd5e1] dark:border-[#334155]"
                      >
                        급여명세서 조회
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            <button
              onClick={() => setSalHistoryExpanded(!salHistoryExpanded)}
              className="w-full h-12 rounded-3xl bg-bg-surface border border-border text-text-sub font-semibold cursor-pointer mt-2.5 flex items-center justify-center gap-1 text-[15px] hover:bg-gray-50 dark:bg-[#1e293b] dark:text-white dark:border-[#334155]"
            >
              <span>{salHistoryExpanded ? '접기' : '더 보기'}</span>
              {salHistoryExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        )}
      </div>

      <PayStubOverlay
        isOpen={isPayStubOpen}
        onClose={() => setIsPayStubOpen(false)}
        data={selectedPayStub}
      />
    </MainLayout>
  )
}

export default App
