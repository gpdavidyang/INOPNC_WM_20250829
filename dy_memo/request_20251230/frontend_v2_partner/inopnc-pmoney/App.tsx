import React, { useState, useMemo } from 'react'
import {
  ArrowLeft,
  Search,
  X,
  Mic,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ClipboardList,
  FileCheck,
  Map as MapIcon,
  Bell,
  Camera,
  Share,
  Eye,
  EyeOff,
  ChevronUp,
  Download,
} from 'lucide-react'
import { CALENDAR_DATA, SITES, SALARY_HISTORY } from './constants'
import { PartnerCalendarMap } from './types'
import PayStubOverlay from './components/PayStubOverlay'

function App() {
  // --- Global Navigation State ---
  const [activeTab, setActiveTab] = useState<'output' | 'salary'>('output')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isNotiOpen, setIsNotiOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)

  // --- Calendar State (Output Tab) ---
  const [currentYear, setCurrentYear] = useState(2025)
  const [currentMonth, setCurrentMonth] = useState(12)
  const [filterSite, setFilterSite] = useState('')
  const [localSearch, setLocalSearch] = useState('')
  const [selectedDateData, setSelectedDateData] = useState<{ date: string; data: any } | null>(null)

  // --- Salary State ---
  const [isPrivacyOn, setIsPrivacyOn] = useState(true)
  const [salHistoryExpanded, setSalHistoryExpanded] = useState(false)
  const [salDateFilter, setSalDateFilter] = useState('all')
  const [selectedPayStub, setSelectedPayStub] = useState<(typeof SALARY_HISTORY)[0] | null>(null)
  const [isPayStubOpen, setIsPayStubOpen] = useState(false)

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
        const matchesSite = filterSite === '' || data.site.includes(filterSite)
        const matchesSearch =
          localSearch === '' || data.site.toLowerCase().includes(localSearch.toLowerCase())

        if (matchesSite && matchesSearch) {
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
  }, [currentYear, currentMonth, filterSite, localSearch])

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
        const matchesSite = filterSite === '' || data.site.includes(filterSite)
        const matchesSearch =
          localSearch === '' || data.site.toLowerCase().includes(localSearch.toLowerCase())

        if (matchesSite && matchesSearch) {
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

  // --- Handlers ---
  const handleOpenPayStub = (item: (typeof SALARY_HISTORY)[0]) => {
    setSelectedPayStub(item)
    setIsPayStubOpen(true)
  }

  return (
    <>
      <div className="app-wrapper">
        {activeTab === 'output' && (
          <div className="animate-fadeIn">
            <div className="local-search-wrapper">
              <input
                type="text"
                className="search-input-local"
                placeholder="현장명을 입력하세요."
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
              />
              {localSearch ? (
                <button className="btn-local-clear show" onClick={() => setLocalSearch('')}>
                  <X size={14} />
                </button>
              ) : (
                <Search className="local-search-icon" />
              )}
            </div>

            <div className="form-select-group">
              <select
                className="form-select"
                value={filterSite}
                onChange={e => setFilterSite(e.target.value)}
              >
                <option value="">전체 현장</option>
                <option value="자이">자이 아파트</option>
                <option value="삼성">삼성 반도체</option>
              </select>
              <select
                className="form-select"
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
            </div>

            <div className="calendar-box" id="section-calendar">
              <div className="cal-header">
                <button
                  onClick={() => handleMonthChange(-1)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-sub)',
                    padding: '8px',
                  }}
                >
                  <ChevronLeft size={28} />
                </button>
                <span className="cal-title">
                  {currentYear}년 {currentMonth}월
                </span>
                <button
                  onClick={() => handleMonthChange(1)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-sub)',
                    padding: '8px',
                  }}
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
        )}

        {/* Salary Tab (Reusing logic from previous app but styled cleanly) */}
        {activeTab === 'salary' && (
          <div className="animate-fadeIn">
            {/* Current Salary Card */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                boxShadow: 'var(--shadow-soft)',
                borderRadius: '16px',
                padding: '24px 20px',
                marginBottom: '24px',
                border: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                  2025년 12월
                </span>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    padding: '5px 10px',
                    borderRadius: '16px',
                    border: '1px solid var(--primary)',
                    backgroundColor: 'var(--primary-bg)',
                    color: 'var(--primary)',
                  }}
                >
                  지급대기
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '14px',
                  paddingBottom: '14px',
                  borderBottom: '1px dashed var(--border)',
                  gap: '8px',
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>실수령 예정액</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span
                    style={{
                      fontSize: '24px',
                      color: 'var(--text-main)',
                      fontWeight: 800,
                      letterSpacing: '-0.5px',
                    }}
                  >
                    {isPrivacyOn ? '****' : '4,250,000'}
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>
                    원
                  </span>
                  <button
                    onClick={() => setIsPrivacyOn(!isPrivacyOn)}
                    style={{
                      marginLeft: '8px',
                      color: 'var(--text-sub)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {isPrivacyOn ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                style={{
                  width: '100%',
                  marginTop: '16px',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--header-navy)',
                  color: '#fff',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Share size={18} /> 지급 요청하기
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
                marginTop: '24px',
              }}
            >
              <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--header-navy)' }}>
                지난 급여 내역
              </span>
            </div>

            {SALARY_HISTORY.map(item => {
              const tax = Math.floor(item.baseTotal * 0.033)
              const net = item.baseTotal - tax
              return (
                <div
                  key={item.rawDate}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    boxShadow: 'var(--shadow-soft)',
                    borderRadius: '16px',
                    padding: '24px',
                    marginBottom: '16px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                      {item.month}
                    </span>
                    <span
                      style={{
                        fontSize: '14px',
                        backgroundColor: '#f3f4f6',
                        color: '#4b5563',
                        padding: '4px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      지급완료
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '16px',
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>실수령액</span>
                    <span style={{ fontWeight: 800, fontSize: '20px' }}>
                      {net.toLocaleString()}원
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpenPayStub(item)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '12px',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      fontWeight: 700,
                      color: '#4b5563',
                      cursor: 'pointer',
                    }}
                  >
                    급여명세서 조회
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* --- OVERLAYS --- */}

      {/* Detail Modal for Calendar */}
      <div className={`detail-modal-overlay ${selectedDateData ? 'active' : ''}`}>
        {selectedDateData && (
          <div className="detail-modal-content">
            <div className="detail-modal-header">
              <span className="detail-modal-title">{selectedDateData.date} 상세</span>
              <button
                onClick={() => setSelectedDateData(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-sub)',
                  cursor: 'pointer',
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ marginTop: '8px' }}>
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
                <span className="detail-info-value" style={{ textAlign: 'right' }}>
                  {selectedDateData.data.note}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Overlay */}
      <div className={`search-overlay ${isSearchOpen ? 'active' : ''}`}>
        <div className="search-header-global">
          <button
            onClick={() => setIsSearchOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-main)',
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            <ArrowLeft size={26} />
          </button>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              className="unified-search-input"
              placeholder="검색어를 입력하세요."
            />
            <div style={{ position: 'absolute', right: '12px', display: 'flex', gap: '4px' }}>
              <button
                style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer' }}
              >
                <Mic size={24} style={{ color: 'var(--primary)' }} />
              </button>
            </div>
          </div>
          <button
            style={{
              fontWeight: 700,
              color: 'var(--primary)',
              marginLeft: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            검색
          </button>
        </div>
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          <div
            style={{
              textAlign: 'center',
              color: 'var(--text-placeholder)',
              marginTop: '40px',
              fontSize: '16px',
            }}
          >
            검색 기능 준비중입니다.
          </div>
        </div>
      </div>

      {/* Menu Overlay */}
      <div
        className={`overlay-backdrop ${isMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMenuOpen(false)}
      ></div>
      <div className={`menu-panel ${isMenuOpen ? 'active' : ''}`}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <span style={{ fontSize: '26px', fontWeight: 800 }}>(주)대박건설</span>{' '}
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  backgroundColor: 'var(--primary-bg)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  marginLeft: '4px',
                }}
              >
                파트너
              </span>
            </div>
            <button
              onClick={() => setIsMenuOpen(false)}
              style={{
                border: '1px solid var(--border)',
                background: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '15px',
                color: 'var(--text-sub)',
                cursor: 'pointer',
              }}
            >
              닫기
            </button>
          </div>
          <div style={{ color: 'var(--text-sub)', fontSize: '16px' }}>partner@daebak.com</div>
        </div>
        <ul className="menu-nav-list">
          <li>
            <a
              className="menu-link"
              onClick={() => {
                setActiveTab('output')
                setIsMenuOpen(false)
              }}
            >
              출력현황 (파트너용)
            </a>
          </li>
          <li>
            <a
              className="menu-link"
              onClick={() => {
                setActiveTab('salary')
                setIsMenuOpen(false)
              }}
            >
              급여현황
            </a>
          </li>
          <li>
            <span className="menu-link" style={{ opacity: 0.5 }}>
              현장정보
            </span>
          </li>
          <li>
            <span className="menu-link" style={{ opacity: 0.5 }}>
              작업일지
            </span>
          </li>
          <li
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '16px',
            }}
          >
            <span className="menu-link">내정보</span>
            <button
              className="btn-acct-mgmt"
              onClick={() => {
                setIsMenuOpen(false)
                setIsAccountOpen(true)
              }}
            >
              계정관리
            </button>
          </li>
        </ul>
        <div style={{ padding: '24px', borderTop: '1px solid var(--border)' }}>
          <button className="btn-logout">로그아웃</button>
        </div>
      </div>

      {/* Account Overlay */}
      <div className={`account-overlay ${isAccountOpen ? 'active' : ''}`}>
        <div className="account-header">
          <button
            onClick={() => setIsAccountOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-main)',
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            <ArrowLeft size={26} />
          </button>
          <span className="account-title">계정 관리</span>
          <button
            style={{
              fontWeight: 700,
              color: 'var(--primary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            저장
          </button>
        </div>
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: '32px',
            }}
          >
            <div
              style={{
                width: '110px',
                height: '110px',
                borderRadius: '50%',
                backgroundColor: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                fontSize: '36px',
                fontWeight: 700,
                color: '#9ca3af',
                border: '4px solid white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              박
              <button
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: '36px',
                  height: '36px',
                  backgroundColor: 'var(--header-navy)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  border: '3px solid white',
                  cursor: 'pointer',
                }}
              >
                <Camera size={16} />
              </button>
            </div>
          </div>
          <div style={{ marginBottom: '32px' }}>
            <span
              style={{
                display: 'block',
                fontWeight: 700,
                color: 'var(--text-sub)',
                marginBottom: '8px',
              }}
            >
              기본 정보
            </span>
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  color: 'var(--text-sub)',
                  marginBottom: '4px',
                }}
              >
                업체명
              </label>
              <input
                type="text"
                style={{
                  width: '100%',
                  height: '52px',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '0 16px',
                }}
                value="(주)대박건설"
                readOnly
              />
            </div>
          </div>
        </div>
      </div>

      <PayStubOverlay
        isOpen={isPayStubOpen}
        onClose={() => setIsPayStubOpen(false)}
        data={selectedPayStub}
      />
    </>
  )
}

export default App
