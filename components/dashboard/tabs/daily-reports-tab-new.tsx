'use client'


export default function DailyReportsTabNew() {
  const [selectedTab, setSelectedTab] = useState<'calendar' | 'list'>('calendar')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedSite, setSelectedSite] = useState('all')
  
  // 달력 데이터 (예시)
  const workDays = [
    { date: '2025-01-03', site: '강남 현장', hours: 8 },
    { date: '2025-01-06', site: '판교 현장', hours: 9 },
    { date: '2025-01-07', site: '강남 현장', hours: 8 },
    { date: '2025-01-10', site: '송도 현장', hours: 10 },
    { date: '2025-01-13', site: '강남 현장', hours: 8 },
  ]

  // 월 이동
  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  // 달력 렌더링
  const renderCalendar = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const days = []
    const weekDays = ['일', '월', '화', '수', '목', '금', '토']
    
    // 요일 헤더
    const headers = weekDays.map(day => (
      <div key={day} className="cell head">
        <span className={day === '일' ? 'sun' : day === '토' ? 'sat' : ''}>
          {day}
        </span>
      </div>
    ))

    // 빈 셀
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="cell"></div>)
    }

    // 날짜 셀
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const workData = workDays.find(w => w.date === dateStr)
      const dayOfWeek = new Date(year, month, day).getDay()
      
      days.push(
        <div key={day} className="cell">
          <div className={`date ${dayOfWeek === 0 ? 'sun' : dayOfWeek === 6 ? 'sat' : ''} ${workData ? 'workday' : ''}`}>
            {day}
          </div>
          {workData && (
            <div className="work-info">
              <div className="site-name">{workData.site}</div>
              <div className="site-day">{workData.hours}H</div>
            </div>
          )}
        </div>
      )
    }

    return { headers, days }
  }

  const { headers, days } = renderCalendar()

  // 월간 통계
  const monthlyStats = {
    totalDays: workDays.filter(w => {
      const date = new Date(w.date)
      return date.getMonth() === currentDate.getMonth() && 
             date.getFullYear() === currentDate.getFullYear()
    }).length,
    totalHours: workDays.filter(w => {
      const date = new Date(w.date)
      return date.getMonth() === currentDate.getMonth() && 
             date.getFullYear() === currentDate.getFullYear()
    }).reduce((sum, w) => sum + w.hours, 0)
  }

  return (
    <div className="container" style={{ padding: '20px', paddingTop: '20px' }}>
      {/* 상단 탭 */}
      <div className="line-tabs">
        <button 
          className={`line-tab ${selectedTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setSelectedTab('calendar')}
        >
          달력
        </button>
        <button 
          className={`line-tab ${selectedTab === 'list' ? 'active' : ''}`}
          onClick={() => setSelectedTab('list')}
        >
          목록
        </button>
      </div>

      {/* 현장 선택 */}
      <div style={{ marginTop: '16px', marginBottom: '16px' }}>
        <div className="select-shell">
          <select 
            className="input"
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="all">전체 현장</option>
            <option value="gangnam">강남 현장</option>
            <option value="pangyo">판교 현장</option>
            <option value="songdo">송도 현장</option>
          </select>
        </div>
      </div>

      {selectedTab === 'calendar' ? (
        <>
          {/* 달력 네비게이션 */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '16px',
            padding: '12px'
          }}>
            <button 
              onClick={() => changeMonth('prev')}
              className="btn btn--ghost"
              style={{ padding: '8px' }}
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="section-title" style={{ margin: 0 }}>
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </h3>
            <button 
              onClick={() => changeMonth('next')}
              className="btn btn--ghost"
              style={{ padding: '8px' }}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* 달력 */}
          <div className="cal-wrap">
            <div className="cal-grid">
              {headers}
              {days}
            </div>
          </div>

          {/* 월간 통계 */}
          <div className="card" style={{ marginTop: '16px' }}>
            <h3 className="section-title" style={{ marginBottom: '12px' }}>월간 통계</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="stat" style={{ borderColor: '#3B82F6' }}>
                <div className="num" style={{ color: '#3B82F6' }}>{monthlyStats.totalDays}</div>
                <div className="t-cap">출근일수</div>
              </div>
              <div className="stat" style={{ borderColor: '#10B981' }}>
                <div className="num" style={{ color: '#10B981' }}>{monthlyStats.totalHours}</div>
                <div className="t-cap">총 근무시간</div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* 목록 뷰 */
        <div className="card">
          <h3 className="section-title" style={{ marginBottom: '16px' }}>작업 기록</h3>
          <div className="stack" style={{ gap: '12px' }}>
            {workDays.map((work, index) => (
              <div 
                key={index}
                style={{
                  padding: '12px',
                  borderBottom: '1px solid var(--line)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{work.date}</div>
                  <div className="t-cap">{work.site}</div>
                </div>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: 700, 
                  color: 'var(--brand)' 
                }}>
                  {work.hours}H
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}