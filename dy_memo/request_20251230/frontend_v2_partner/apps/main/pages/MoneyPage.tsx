import { useState, useMemo } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { CALENDAR_DATA } from '../../money/constants-new'

function MoneyPage() {
  // --- State ---
  const [currentYear, setCurrentYear] = useState(2025)
  const [currentMonth, setCurrentMonth] = useState(12)
  const [localSearch, setLocalSearch] = useState('')
  const [selectedDateData, setSelectedDateData] = useState<{ date: string; data: any } | null>(null)
  const [viewMode, setViewMode] = useState<'all' | 'personnel'>('all')

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

  const calendarStats = useMemo(() => {
    const aggregateSites = new Set()
    let aggregatePersonnel = 0
    let aggregateDays = 0

    // We only have limited data in CALENDAR_DATA, but we filter based on month/year logic conceptually
    // Since CALENDAR_DATA keys are strings 'YYYY-MM-DD', we filter by prefix.
    const prefix = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${prefix}-${d.toString().padStart(2, '0')}`
      const data = CALENDAR_DATA[dateStr]
      if (data) {
        const matchesSearch =
          localSearch === '' || data.site.toLowerCase().includes(localSearch.toLowerCase())

        if (matchesSearch) {
          aggregateSites.add(data.site)
          aggregatePersonnel += parseFloat(data.man)
          aggregateDays++
        }
      }
    }

    return {
      siteCount: aggregateSites.size,
      personnel: aggregatePersonnel,
      days: aggregateDays,
    }
  }, [currentYear, currentMonth, localSearch])

  const renderCalendarCells = () => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay()
    const lastDate = new Date(currentYear, currentMonth, 0).getDate()
    const cells = []

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="cal-cell"></div>)
    }

    // Days
    for (let d = 1; d <= lastDate; d++) {
      const dateStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`
      const data = CALENDAR_DATA[dateStr]
      let content = null

      if (data) {
        const matchesSearch =
          localSearch === '' || data.site.toLowerCase().includes(localSearch.toLowerCase())

        if (matchesSearch) {
          const cleanSite = data.site.replace(/\s+/g, '').substring(0, 4)
          content = (
            <div className="cal-data-badge">
              <span className="cal-gongsu">{data.man}명</span>
              <span className="cal-site">{cleanSite}</span>
            </div>
          )
        }
      }

      const isToday = currentMonth === 12 && d === 5 // Fixed today for demo

      cells.push(
        <div
          key={dateStr}
          className={`cal-cell ${isToday ? 'today' : ''}`}
          onClick={() => data && setSelectedDateData({ date: dateStr, data })}
        >
          <span className="cal-date">{d}</span>
          {content}
        </div>
      )
    }
    return cells
  }

  return (
    <>
      <div className="app-wrapper">
        <div className="animate-fadeIn">
          <div className="local-search-wrapper">
            <input
              type="text"
              className="search-input-local"
              placeholder="현장명을 입력하세요."
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="form-select-group">
            <select
              className="form-select"
              value={viewMode}
              onChange={e => setViewMode(e.target.value as 'all' | 'personnel')}
            >
              <option value="all">전체현황</option>
              <option value="personnel">인원순</option>
            </select>
            <input
              type="month"
              className="form-select"
              value={`${currentYear}-${currentMonth.toString().padStart(2, '0')}`}
              onChange={e => {
                const [y, m] = e.target.value.split('-')
                setCurrentYear(parseInt(y))
                setCurrentMonth(parseInt(m))
              }}
            />
          </div>

          <div className="calendar-box" id="section-calendar">
            <div className="cal-header">
              <button
                onClick={() => handleMonthChange(-1)}
                className="p-2 text-[#334155] dark:text-[#cbd5e1]"
              >
                <ChevronLeft size={28} />
              </button>
              <span className="cal-title">
                {currentYear}년 {currentMonth}월
              </span>
              <button
                onClick={() => handleMonthChange(1)}
                className="p-2 text-[#334155] dark:text-[#cbd5e1]"
              >
                <ChevronRight size={28} />
              </button>
            </div>
            <div className="cal-grid">
              {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                <div key={d} className={`cal-day-name ${i === 0 ? 'sun' : ''}`}>
                  {d}
                </div>
              ))}
              {renderCalendarCells()}
            </div>
          </div>

          <div className="summary-grid" id="section-summary">
            <div className="sum-card sky">
              <span className="sum-val">{calendarStats.siteCount}</span>
              <span className="sum-label">현장수</span>
            </div>
            <div className="sum-card navy">
              <span className="sum-val">
                {Number.isInteger(calendarStats.personnel)
                  ? calendarStats.personnel
                  : calendarStats.personnel.toFixed(1)}
              </span>
              <span className="sum-label">투입인원</span>
            </div>
            <div className="sum-card periwinkle">
              <span className="sum-val">{calendarStats.days}</span>
              <span className="sum-label">투입일</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal for Calendar */}
      <div className={`detail-modal-overlay ${selectedDateData ? 'active' : ''}`}>
        {selectedDateData && (
          <div className="detail-modal-content">
            <div className="detail-modal-header">
              <span className="detail-modal-title">{selectedDateData.date} 상세</span>
              <button onClick={() => setSelectedDateData(null)}>
                <X className="text-[#334155]" />
              </button>
            </div>
            <div className="mt-2">
              <div className="detail-info-row">
                <span className="detail-info-label">현장명</span>
                <span className="detail-info-value">{selectedDateData.data.site}</span>
              </div>
              <div className="detail-info-row">
                <span className="detail-info-label">투입인원</span>
                <span className="detail-info-value">{selectedDateData.data.man}명</span>
              </div>
              <div className="detail-info-row border-none">
                <span className="detail-info-label">특이사항</span>
                <span className="detail-info-value text-right">{selectedDateData.data.note}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default MoneyPage
