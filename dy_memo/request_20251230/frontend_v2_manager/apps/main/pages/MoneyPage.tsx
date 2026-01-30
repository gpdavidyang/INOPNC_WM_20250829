import React, { useState, useMemo, useRef, useEffect } from 'react'
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
  Plus,
  Trash2,
} from 'lucide-react'
import { SALARY_HISTORY } from '../../money/constants'
import PayStubOverlay from '../../money/components/PayStubOverlay'
import html2canvas from 'html2canvas'

// Type definitions
type SalaryHistoryItem = {
  rawDate: string
  month: string
  baseTotal: number
  man: number
  price: number
  year: number
  netPay: number
  grossPay: number
  deductions: number
}

type EditEntry = {
  site: string
  man: number
  price: number
}

// Sample work data since shared package doesn't exist
const INITIAL_WORK_DATA = {
  '2025-12-02': [
    { site: '자이 아파트 101동', man: 1.5, price: 337500 },
    { site: '삼성 반도체 P3', man: 2, price: 450000 },
  ],
  '2025-12-01': [{ site: '힐스테이트 센트럴', man: 1, price: 225000 }],
  '2025-12-03': [{ site: '서울 롯데타워 보수', man: 2.5, price: 562500 }],
  '2025-12-05': [
    { site: '인천 공항 제2터미널', man: 1.5, price: 337500 },
    { site: '광명 무역센터', man: 1, price: 225000 },
  ],
}

const MoneyPage: React.FC = () => {
  // --- Global State ---
  const [activeTab, setActiveTab] = useState<'output' | 'salary'>('output')

  // --- Calendar State ---
  const [currentYear, setCurrentYear] = useState(2025)
  const [currentMonth, setCurrentMonth] = useState(12)
  const [filterSite, setFilterSite] = useState('')
  const [workData, setWorkData] = useState<any>(INITIAL_WORK_DATA)

  // Searchable Combobox State
  const [showSiteOptions, setShowSiteOptions] = useState(false)
  const siteSearchRef = useRef<HTMLDivElement>(null)

  // Sort filter state
  const [sortFilter, setSortFilter] = useState<'default' | 'gongsu' | 'amount'>('default')

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [editEntries, setEditEntries] = useState<
    Array<{ site: string; man: number; price: number }>
  >([])
  const [editSiteDropdownIndex, setEditSiteDropdownIndex] = useState<number | null>(null)
  const editModalRef = useRef<HTMLDivElement>(null)

  // --- Salary State ---
  const [isPrivacyOn, setIsPrivacyOn] = useState(true)
  const [salHistoryExpanded, setSalHistoryExpanded] = useState(false)
  const [salDateFilter, setSalDateFilter] = useState('all')
  const [salSortFilter, setSalSortFilter] = useState<'latest' | 'amount'>('latest')
  const [selectedPayStub, setSelectedPayStub] = useState<(typeof SALARY_HISTORY)[0] | null>(null)
  const [isPayStubOpen, setIsPayStubOpen] = useState(false)

  // --- Derived Data: Unique Sites for Combobox ---
  const uniqueSites = useMemo(() => {
    const sites = new Set<string>()
    Object.keys(workData).forEach((key: string) => {
      workData[key].forEach((entry: any) => sites.add(entry.site))
    })
    return Array.from(sites).sort()
  }, [workData])

  // Click outside handler for site dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (siteSearchRef.current && !siteSearchRef.current.contains(event.target as Node)) {
        setShowSiteOptions(false)
      }
      // Edit modal site dropdown
      if (editModalRef.current && !editModalRef.current.contains(event.target as Node)) {
        setEditSiteDropdownIndex(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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
      const filteredEntries = dayEntries.filter((entry: any) => {
        const matchSite = filterSite === '' || entry.site === filterSite // Exact match for Combobox selection
        return matchSite
      })

      let dayTotalAmt = 0
      let dayTotalMan = 0
      let displayContent = null

      if (filteredEntries.length > 0) {
        filteredEntries.forEach((e: any) => {
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
            <span className="text-[11px] font-bold text-text-sub leading-tight mb-[1px]">
              {dayTotalMan.toFixed(1)}
            </span>
            <span className="text-[12px] font-extrabold text-primary leading-tight">
              {(dayTotalAmt / 10000).toFixed(1)}만
            </span>
            <span className="text-[10px] font-semibold text-text-sub leading-tight mt-[2px] whitespace-nowrap overflow-hidden text-ellipsis max-w-full block text-center">
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

    Object.keys(workData).forEach((dateStr: string) => {
      if (dateStr.startsWith(prefix)) {
        const entries = workData[dateStr]
        entries.forEach((e: any) => {
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
    let filtered = SALARY_HISTORY.filter(
      item => salDateFilter === 'all' || item.rawDate === salDateFilter
    )

    // Apply sorting
    if (salSortFilter === 'amount') {
      filtered = filtered.sort((a, b) => b.baseTotal - a.baseTotal)
    } else {
      filtered = filtered.sort((a, b) => {
        // Sort by date (latest first)
        const dateA = new Date(a.rawDate + '-01')
        const dateB = new Date(b.rawDate + '-01')
        return dateB.getTime() - dateA.getTime()
      })
    }

    return filtered
  }, [salDateFilter, salSortFilter])

  const displayHistory = salHistoryExpanded ? filteredHistory : filteredHistory.slice(0, 2)

  // --- Handlers ---
  const handleOpenPayStub = (item: SalaryHistoryItem) => {
    setSelectedPayStub(item)
    setIsPayStubOpen(true)
  }

  // Edit Modal Handlers
  const openEditModal = (dateStr: string) => {
    setEditingDate(dateStr)
    const entries = workData[dateStr] || []
    if (entries.length === 0) {
      setEditEntries([{ site: '', man: 1.0, price: 225000 }])
    } else {
      setEditEntries([...entries])
    }
    setIsEditModalOpen(true)
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setEditingDate(null)
    setEditEntries([])
  }

  const addEditRow = () => {
    setEditEntries([...editEntries, { site: '', man: 1.0, price: 225000 }])
  }

  const removeEditRow = (index: number) => {
    const newEntries = editEntries.filter((_: any, i: number) => i !== index)
    setEditEntries(newEntries)
  }

  const updateEditEntry = (
    index: number,
    field: 'site' | 'man' | 'price',
    value: string | number
  ) => {
    const newEntries = editEntries.map((entry: any, i: number) => {
      if (i === index) {
        if (field === 'site') {
          return { ...entry, site: value as string }
        } else if (field === 'man') {
          return { ...entry, man: Number(value) }
        } else if (field === 'price') {
          return { ...entry, price: Number(value) }
        }
      }
      return entry
    })
    setEditEntries(newEntries)
  }

  const saveWorkData = () => {
    if (!editingDate) return

    const validEntries = editEntries.filter((entry: any) => entry.site && entry.man > 0)

    if (validEntries.length === 0) {
      delete workData[editingDate]
    } else {
      workData[editingDate] = validEntries
    }

    setWorkData({ ...workData })
    closeEditModal()
    alert('저장되었습니다.')
  }

  // Handle Payment Request (Share)
  const handlePaymentRequest = async () => {
    try {
      // Create a temporary div for capture
      const captureDiv = document.createElement('div')
      captureDiv.style.position = 'fixed'
      captureDiv.style.top = '-9999px'
      captureDiv.style.left = '0'
      captureDiv.style.width = '420px'
      captureDiv.style.backgroundColor = '#ffffff'
      captureDiv.style.padding = '30px'
      captureDiv.style.boxSizing = 'border-box'
      captureDiv.style.fontFamily =
        'Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif'
      captureDiv.style.zIndex = '9999'

      // Build the share card content
      const monthText = `${currentYear}년 ${currentMonth}월`
      const netPay = currentMonthData.netPay
      const totalPay = Math.floor(netPay / 0.967)
      const tax = totalPay - netPay

      captureDiv.innerHTML = `
        <div style="border-bottom: 2px solid #1a254f; padding-bottom: 15px; margin-bottom: 10px;">
          <h1 style="font-size: 24px; font-weight: 800; color: #1a254f; margin: 0;">급여 지급 요청서</h1>
          <div style="font-size: 16px; font-weight: 600; color: #64748b; margin-top: 4px;">${monthText} 지급 요청</div>
        </div>
        <div style="text-align: right; margin-bottom: 10px;">
          <span style="font-size: 14px; font-weight: 700; color: #64748b; margin-bottom: 4px; display: block;">실수령 예정액</span>
          <span style="font-size: 32px; font-weight: 800; color: #31a3fa; letter-spacing: -1px;">${netPay.toLocaleString()}원</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8fafc; padding: 15px; border-radius: 12px;">
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <span style="font-size: 12px; font-weight: 600; color: #64748b;">총 공수</span>
            <span style="font-size: 16px; font-weight: 700; color: #111;">${currentMonthData.mTotalMan.toFixed(1)}</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <span style="font-size: 12px; font-weight: 600; color: #64748b;">총 지급액</span>
            <span style="font-size: 16px; font-weight: 700; color: #111;">${totalPay.toLocaleString()}</span>
          </div>
          <div style="grid-column: span 2; border-top: 1px dashed #cbd5e1; padding-top: 10px; margin-top: 4px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; font-weight: 600; color: #64748b;">공제금액 (3.3%)</span>
            <span style="font-size: 16px; font-weight: 700; color: #ef4444;">-${tax.toLocaleString()}</span>
          </div>
        </div>
        <div style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 10px; font-weight: 500;">Generated by INOPNC App</div>
      `

      document.body.appendChild(captureDiv)

      // Capture the div
      const canvas = await html2canvas(captureDiv, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        windowWidth: 420,
      })

      // Remove the temporary div
      document.body.removeChild(captureDiv)

      // Convert to blob and share
      canvas.toBlob(async (blob: Blob | null) => {
        if (blob) {
          // Try to use Web Share API if available
          if (
            navigator.share &&
            navigator.canShare &&
            navigator.canShare({
              files: [new File([blob], 'pay_request.png', { type: 'image/png' })],
            })
          ) {
            try {
              await navigator.share({
                files: [new File([blob], 'pay_request.png', { type: 'image/png' })],
                title: '급여 지급 요청',
                text: `${monthText} 급여 내역입니다.`,
              })
            } catch (err: any) {
              if (err.name !== 'AbortError') {
                console.error('Share failed:', err)
                // Fallback to download
                downloadImage(canvas)
              }
            }
          } else {
            // Fallback to download
            downloadImage(canvas)
          }
        }
      }, 'image/png')
    } catch (error) {
      console.error('Error creating share image:', error)
      alert('공유 이미지 생성 중 오류가 발생했습니다.')
    }
  }

  // Helper function to download image
  const downloadImage = (canvas: HTMLCanvasElement) => {
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `pay_request_${currentYear}_${currentMonth.toString().padStart(2, '0')}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div
      className="w-full max-w-[600px] mx-auto p-4 box-border"
      style={{
        paddingTop: '0px',
        paddingBottom: '0px',
        backgroundColor: 'var(--bg-body)',
        color: 'var(--text-main)',
      }}
    >
      <div className="fixed top-[60px] left-0 right-0 bg-[var(--bg-surface)] border-b border-[var(--border)] z-30 transition-colors">
        <div className="w-full max-w-[600px] mx-auto flex h-[54px]">
          <button
            onClick={() => {
              setActiveTab('output')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className={`flex-1 h-full border-b-[3px] transition-all font-semibold ${
              activeTab === 'output'
                ? 'text-primary border-primary text-[20px] font-extrabold opacity-100'
                : 'text-text-sub border-transparent text-[18px] opacity-70'
            }`}
          >
            출력현황
          </button>
          <button
            onClick={() => {
              setActiveTab('salary')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className={`flex-1 h-full border-b-[3px] transition-all font-semibold ${
              activeTab === 'salary'
                ? 'text-primary border-primary text-[20px] font-extrabold opacity-100'
                : 'text-text-sub border-transparent text-[18px] opacity-70'
            }`}
          >
            급여현황
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-[600px] mx-auto pt-[54px] pb-[27px] px-0">
        {/* Tab: Output */}
        {activeTab === 'output' && (
          <div className="animate-fadeIn">
            {/* Site Search Combobox - From SitePage */}
            <div className="relative mb-2 flex items-center group" ref={siteSearchRef}>
              <input
                type="text"
                className="
                        w-full h-[54px] rounded-2xl px-[22px] pr-12 text-[17px] font-medium bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-main)]
                        transition-all duration-200 ease-out 
                        focus:outline-none 
                        focus:border-[1.5px] 
                        focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)] 
                        cursor-pointer focus:cursor-text
                        placeholder:text-slate-400 dark:placeholder:text-slate-500
                    "
                placeholder="현장명을 입력하세요."
                value={filterSite}
                onChange={e => {
                  setFilterSite(e.target.value)
                  setShowSiteOptions(e.target.value.trim().length > 0)
                }}
                onClick={() => {
                  if (filterSite.trim().length > 0) setShowSiteOptions(true)
                }}
                onFocus={() => {
                  if (filterSite.trim().length > 0) setShowSiteOptions(true)
                }}
              />
              {filterSite ? (
                <button
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-slate-300 dark:bg-slate-600 text-white rounded-full w-[22px] h-[22px] flex items-center justify-center border-none cursor-pointer"
                  onClick={() => {
                    setFilterSite('')
                    setShowSiteOptions(false)
                  }}
                >
                  <X size={14} />
                </button>
              ) : (
                <Search
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500 pointer-events-none"
                  size={20}
                />
              )}

              {showSiteOptions && filterSite.trim().length > 0 && (
                <div className="absolute top-[60px] left-0 right-0 rounded-xl max-h-[300px] overflow-y-auto z-[100] shadow-xl animate-slideDown bg-[var(--bg-surface)] border border-[var(--border)]">
                  {uniqueSites.filter(s => s.toLowerCase().includes(filterSite.toLowerCase()))
                    .length === 0 ? (
                    <div className="p-4 text-slate-400 text-center">검색 결과가 없습니다</div>
                  ) : (
                    <>
                      {uniqueSites
                        .filter(s => s.toLowerCase().includes(filterSite.toLowerCase()))
                        .map(site => (
                          <div
                            key={site}
                            className="p-3.5 last:border-0 cursor-pointer text-[16px] border-b border-[var(--border)] text-[var(--text-main)] hover:bg-[var(--bg-hover)]"
                            onClick={() => {
                              setFilterSite(site)
                              setShowSiteOptions(false)
                            }}
                          >
                            {site}
                          </div>
                        ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-3">
              <select
                className="flex-1 h-[54px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-3.5 text-[17px] font-semibold text-[var(--text-main)] shadow-soft focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)] appearance-none"
                value={sortFilter}
                onChange={e => setSortFilter(e.target.value as any)}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23333333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 16px center',
                }}
              >
                <option value="default">전체 현황</option>
                <option value="gongsu">공수순</option>
                <option value="amount">금액순</option>
              </select>
              <input
                type="month"
                className="flex-1 h-[54px] rounded-xl px-3.5 text-[17px] font-semibold focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)] bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-main)]"
                value={`${currentYear}-${currentMonth.toString().padStart(2, '0')}`}
                onChange={e => {
                  const [y, m] = e.target.value.split('-')
                  setCurrentYear(parseInt(y))
                  setCurrentMonth(parseInt(m))
                }}
              />
            </div>

            {/* Calendar */}
            <div
              className="rounded-2xl overflow-hidden mb-3 bg-[var(--bg-surface)]"
              style={{ boxShadow: 'var(--shadow-soft)' }}
            >
              <div className="flex justify-between items-center px-5 py-[18px] border-b border-[var(--border)]">
                <button
                  onClick={() => handleMonthChange(-1)}
                  className="bg-transparent border-none cursor-pointer text-text-sub p-2 hover:bg-[var(--bg-hover)] rounded-full"
                >
                  <ChevronLeft size={28} />
                </button>
                <span className="text-[22px] font-extrabold text-text-main">
                  {currentYear}년 {currentMonth}월
                </span>
                <button
                  onClick={() => handleMonthChange(1)}
                  className="bg-transparent border-none cursor-pointer text-text-sub p-2 hover:bg-[var(--bg-hover)] rounded-full"
                >
                  <ChevronRight size={28} />
                </button>
              </div>

              <div className="grid grid-cols-7 text-center">
                {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                  <div
                    key={d}
                    className={`py-3.5 text-sm font-bold border-b border-[var(--border)] ${i === 0 ? 'text-danger' : 'text-text-sub'}`}
                  >
                    {d}
                  </div>
                ))}

                {cells.map((cell: any, i) => (
                  <div
                    key={cell.key}
                    className={`min-h-[96px] p-[6px_1px] flex flex-col items-center gap-[3px] relative cursor-pointer bg-[var(--bg-surface)] border-b border-[var(--border)] ${i % 7 === 6 ? '' : 'border-r border-[var(--border)]'}`}
                    onClick={() => openEditModal(cell.key)}
                  >
                    {cell.type === 'date' && (
                      <React.Fragment>
                        <span
                          className={`text-[15px] font-semibold flex items-center justify-center w-[26px] h-[26px] rounded-full mb-1 ${cell.isToday ? 'bg-header-navy text-white font-extrabold' : 'text-text-main'}`}
                        >
                          {cell.day}
                        </span>
                        {cell.content}
                      </React.Fragment>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-[16px_4px] rounded-2xl text-center flex flex-col gap-1.5 shadow-sm bg-primary-bg text-primary border border-primary ring-1 ring-inset ring-primary/20 dark:ring-primary/30">
                <span className="text-2xl font-extrabold leading-[1.1] tracking-tighter">
                  {totalSites}
                </span>
                <span className="text-sm font-bold opacity-90">현장수</span>
              </div>
              <div className="p-[16px_4px] rounded-2xl text-center flex flex-col gap-1.5 shadow-sm bg-blue-50 text-blue-700 border border-blue-300 dark:bg-indigo-900/30 dark:text-indigo-100 dark:border dark:border-indigo-400 ring-1 ring-inset ring-blue-200/50 dark:ring-indigo-400/30">
                <span className="text-2xl font-extrabold leading-[1.1] tracking-tighter">
                  {totalMan.toFixed(1)}
                </span>
                <span className="text-sm font-bold opacity-90">공수</span>
              </div>
              <div className="p-[16px_4px] rounded-2xl text-center flex flex-col gap-1.5 shadow-sm bg-slate-50 text-slate-600 border border-slate-300 dark:bg-slate-800/50 dark:text-slate-200 dark:border dark:border-slate-500 ring-1 ring-inset ring-slate-200/50 dark:ring-slate-500/30">
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
              <span className="text-xl font-bold text-header-navy font-main">
                이번 달 지급 대기
              </span>
              <button
                onClick={() => setIsPrivacyOn(!isPrivacyOn)}
                className="bg-transparent border-none flex items-center gap-1 cursor-pointer text-text-sub text-[15px] font-semibold p-0"
              >
                <span>금액 보기/숨기기</span>
                {isPrivacyOn ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Current Salary Card */}
            <div className="bg-[var(--bg-surface)] shadow-sm rounded-2xl p-[24px_20px] mb-3 border border-[var(--border)]">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-extrabold text-text-main">
                  {currentYear}년 {currentMonth}월
                </span>
                <span className="text-[13px] font-semibold px-2.5 py-1 rounded-full border bg-primary-bg text-primary border-primary">
                  지급대기
                </span>
              </div>

              <div className="flex justify-between items-center mb-3.5 pb-3.5 border-b border-dashed border-[var(--border)] gap-2 flex-nowrap">
                <span className="font-bold text-text-main shrink-0">실수령 예정액</span>
                <div className="flex items-baseline justify-end gap-0.5 whitespace-nowrap shrink flex-nowrap">
                  <span className="text-[24px] text-text-main font-extrabold tracking-tighter whitespace-nowrap">
                    {isPrivacyOn ? '****' : currentMonthData.netPay.toLocaleString()}
                  </span>
                  <span className="text-base font-semibold text-text-main">원</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-2 text-[15px] text-text-sub flex-nowrap gap-2">
                <span className="font-bold text-text-main shrink-0">공수</span>
                <span className="font-semibold text-text-main text-[16px]">
                  {currentMonthData.mTotalMan.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2 text-[15px] text-text-sub flex-nowrap gap-2">
                <span className="font-bold text-text-main shrink-0">평균단가</span>
                <span className="font-semibold text-text-main text-[16px]">
                  {isPrivacyOn ? '****' : currentMonthData.avgPrice.toLocaleString()}
                </span>
              </div>

              <button
                className="w-full mt-4 p-3 rounded-[10px] bg-header-navy text-white border-none flex items-center justify-center gap-2 font-bold text-base cursor-pointer hover:bg-primary transition-colors"
                onClick={handlePaymentRequest}
              >
                <Share size={18} /> 지급 요청하기 (공유)
              </button>
            </div>

            {/* History Section */}
            <div className="flex justify-between items-center mb-3 mt-[30px]">
              <span className="text-xl font-bold text-header-navy font-main">지난 급여 내역</span>
            </div>

            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <select
                  className="w-full h-[54px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-3.5 text-[17px] font-semibold text-[var(--text-main)] shadow-soft focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)] appearance-none"
                  value={salDateFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setSalDateFilter(e.target.value)
                  }
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23333333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 16px center',
                  }}
                >
                  <option value="all">2025년 전체</option>
                  <option value="2025-11">2025년 11월</option>
                  <option value="2025-10">2025년 10월</option>
                </select>
                <ChevronDown
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-sub pointer-events-none"
                  size={20}
                />
              </div>
              <div className="relative flex-1">
                <select
                  className="w-full h-[54px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-3.5 text-[17px] font-semibold text-[var(--text-main)] shadow-soft focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)] appearance-none"
                  value={salSortFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setSalSortFilter(e.target.value as 'latest' | 'amount')
                  }
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23333333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 16px center',
                  }}
                >
                  <option value="latest">최신순</option>
                  <option value="amount">금액순</option>
                </select>
                <ChevronDown
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-sub pointer-events-none"
                  size={20}
                />
              </div>
            </div>

            {/* History List */}
            <div className="flex flex-col gap-3">
              {displayHistory.length === 0 ? (
                <div className="text-center py-8 text-text-placeholder">내역이 없습니다.</div>
              ) : (
                displayHistory.map((item: SalaryHistoryItem) => {
                  const tax = Math.floor(item.baseTotal * 0.033)
                  const net = item.baseTotal - tax
                  return (
                    <div
                      key={item.rawDate}
                      className="bg-[var(--bg-surface)] shadow-sm rounded-2xl p-[24px_20px] border border-[var(--border)]"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-extrabold text-text-main">{item.month}</span>
                        <span className="text-[13px] font-semibold px-2.5 py-1 rounded-full border bg-[var(--bg-body)] text-text-sub border-[var(--border)]">
                          지급완료
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-3.5 pb-3.5 border-b border-dashed border-[var(--border)] gap-2 flex-nowrap">
                        <span className="font-bold text-text-main shrink-0">실수령액</span>
                        <div className="flex items-baseline justify-end gap-0.5 whitespace-nowrap shrink flex-nowrap">
                          <span className="text-[20px] text-text-main font-extrabold tracking-tighter whitespace-nowrap">
                            {isPrivacyOn ? '****' : net.toLocaleString()}
                          </span>
                          <span className="text-base font-semibold text-text-main">원</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mb-2 text-[15px] text-text-sub flex-nowrap gap-2">
                        <span className="font-bold text-text-main shrink-0">공수</span>
                        <span className="font-semibold text-text-main text-[16px]">
                          {item.man.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-2 text-[15px] text-text-sub flex-nowrap gap-2">
                        <span className="font-bold text-text-main shrink-0">단가</span>
                        <span className="font-semibold text-text-main text-[16px]">
                          {isPrivacyOn ? '****' : Math.round(item.price).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-2 text-[15px] text-text-sub flex-nowrap gap-2">
                        <span className="font-bold text-text-main shrink-0">공제 (3.3%)</span>
                        <span className="font-semibold text-danger text-[16px]">
                          {isPrivacyOn ? '****' : `-${tax.toLocaleString()}`}
                        </span>
                      </div>

                      <button
                        onClick={() => handleOpenPayStub(item)}
                        className="w-full mt-4 p-3 rounded-[10px] bg-[var(--bg-hover)] text-text-sub border border-[var(--border)] font-bold text-base cursor-pointer hover:bg-[var(--bg-input)] transition-colors"
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
              className="w-full h-[48px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-full text-text-sub font-semibold cursor-pointer mt-2 flex items-center justify-center gap-1 text-sm hover:bg-[var(--bg-hover)] transition-colors"
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

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[3000] flex items-center justify-center p-5">
          <div
            ref={editModalRef}
            className="bg-[var(--bg-surface)] border border-[var(--border)] w-full max-w-[450px] rounded-2xl p-6 max-h-[85vh] overflow-y-auto flex flex-col"
          >
            <div className="flex justify-between items-center mb-5">
              <span className="text-xl font-extrabold text-text-main">
                {editingDate &&
                  `${editingDate.split('-')[0]}년 ${editingDate.split('-')[1]}월 ${editingDate.split('-')[2]}일 작업 수정`}
              </span>
              <button onClick={closeEditModal} className="bg-transparent border-none text-text-sub">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              {editEntries.map((entry: EditEntry, index: number) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 min-w-0 relative">
                    <label className="text-xs text-text-sub font-semibold mb-1 block">현장명</label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full h-[42px] px-3 pr-10 border border-[var(--border)] rounded-lg bg-[var(--bg-surface)] text-text-main text-sm focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)] placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        placeholder="현장명을 입력하세요."
                        value={entry.site}
                        onChange={e => updateEditEntry(index, 'site', e.target.value)}
                        onClick={() => {
                          if (entry.site.trim().length > 0) {
                            setEditSiteDropdownIndex(index)
                          }
                        }}
                        onFocus={() => {
                          if (entry.site.trim().length > 0) {
                            setEditSiteDropdownIndex(index)
                          }
                        }}
                      />
                      {entry.site ? (
                        <button
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-slate-300 dark:bg-slate-600 text-white rounded-full w-[20px] h-[20px] flex items-center justify-center border-none cursor-pointer z-10"
                          onClick={() => {
                            updateEditEntry(index, 'site', '')
                            setEditSiteDropdownIndex(null)
                          }}
                        >
                          <X size={12} />
                        </button>
                      ) : (
                        <Search
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500 pointer-events-none"
                          size={16}
                        />
                      )}

                      {editSiteDropdownIndex === index && (
                        <div className="absolute top-[46px] left-0 right-0 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg max-h-[200px] overflow-y-auto z-[200] shadow-xl">
                          {uniqueSites.filter(s =>
                            s.toLowerCase().includes(entry.site.toLowerCase())
                          ).length === 0 ? (
                            <div className="p-3 text-slate-400 text-center text-sm">
                              검색 결과 없음
                            </div>
                          ) : (
                            uniqueSites
                              .filter(s => s.toLowerCase().includes(entry.site.toLowerCase()))
                              .map(site => (
                                <div
                                  key={site}
                                  className="p-3 border-b border-[var(--border)] last:border-0 cursor-pointer hover:bg-[var(--bg-hover)] text-sm text-text-main"
                                  onClick={() => {
                                    updateEditEntry(index, 'site', site)
                                    setEditSiteDropdownIndex(null)
                                  }}
                                >
                                  {site}
                                </div>
                              ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-[70px]">
                    <label className="text-xs text-text-sub font-semibold mb-1 block">공수</label>
                    <select
                      className="w-full h-[42px] px-2 border border-[var(--border)] rounded-lg bg-[var(--bg-surface)] text-text-main text-sm"
                      value={entry.man}
                      onChange={e => updateEditEntry(index, 'man', e.target.value)}
                    >
                      <option value="0">0</option>
                      <option value="0.5">0.5</option>
                      <option value="1">1</option>
                      <option value="1.5">1.5</option>
                      <option value="2">2</option>
                      <option value="2.5">2.5</option>
                      <option value="3">3</option>
                    </select>
                  </div>
                  <div className="w-[90px]">
                    <label className="text-xs text-text-sub font-semibold mb-1 block">금액</label>
                    <input
                      type="text"
                      className="w-full h-[42px] px-2 border border-[var(--border)] rounded-lg bg-[var(--bg-input)] text-text-sub font-semibold text-sm"
                      value={entry.price}
                      readOnly
                    />
                  </div>
                  <button
                    onClick={() => removeEditRow(index)}
                    className="w-[36px] h-[42px] border border-[var(--border)] rounded-lg bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-300 flex items-center justify-center flex-shrink-0 mt-[22px]"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addEditRow}
              className="w-full h-[44px] border-[1.5px] border-dashed border-primary bg-[var(--bg-surface)] text-primary font-bold rounded-lg mb-6 flex items-center justify-center gap-1.5 text-sm active:bg-primary-bg"
            >
              <Plus size={16} />
              항목 추가
            </button>

            <div className="flex gap-2.5">
              <button
                onClick={closeEditModal}
                className="flex-1 h-[50px] rounded-lg text-base font-bold border-2 border-[var(--border)] text-text-sub bg-[var(--bg-hover)] hover:bg-[var(--bg-input)] transition-colors"
              >
                취소
              </button>
              <button
                onClick={saveWorkData}
                className="flex-1 h-[50px] rounded-lg text-base font-bold text-white bg-header-navy hover:opacity-90 transition"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MoneyPage
