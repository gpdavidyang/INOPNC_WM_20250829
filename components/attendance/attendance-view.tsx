'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { getAttendanceRecords } from '@/app/actions/attendance'
import { getUserSiteHistory } from '@/app/actions/site-info'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { Profile, UserSiteHistory } from '@/types'
import type { AttendanceRecord } from '@/types/attendance'

interface AttendanceViewProps {
  profile: Profile
}

interface AttendanceData extends AttendanceRecord {
  work_date: string
  sites?: {
    id: string
    name: string
  }
}

export function AttendanceView({ profile }: AttendanceViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [siteHistory, setSiteHistory] = useState<UserSiteHistory[]>([])
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([])
  const [loading, setLoading] = useState(false)
  const [showSiteDropdown, setShowSiteDropdown] = useState(false)

  // Load site history on mount
  useEffect(() => {
    loadSiteHistory()
  }, [])

  // Load attendance data when date or site changes
  useEffect(() => {
    if (profile?.id) {
      loadAttendanceData()
    }
  }, [currentDate, selectedSite, profile?.id])

  const loadSiteHistory = async () => {
    try {
      const result = await getUserSiteHistory()
      if (result.success && result.data) {
        const uniqueSites = result.data.filter((site, index, self) => 
          index === self.findIndex(s => s.site_id === site.site_id)
        )
        setSiteHistory(uniqueSites)
      }
    } catch (error) {
      console.error('Failed to load site history:', error)
    }
  }

  const loadAttendanceData = useCallback(async () => {
    if (!profile?.id) return
    
    const startDate = startOfMonth(currentDate)
    const endDate = endOfMonth(currentDate)
    
    setLoading(true)
    try {
      const params = {
        user_id: profile.id,
        site_id: selectedSite === 'all' ? undefined : selectedSite,
        date_from: format(startDate, 'yyyy-MM-dd'),
        date_to: format(endDate, 'yyyy-MM-dd')
      }
      
      const result = await getAttendanceRecords(params)
      
      if (result.success && result.data) {
        setAttendanceData(result.data as AttendanceData[])
      } else {
        setAttendanceData([])
      }
    } catch (error) {
      console.error('Failed to load attendance data:', error)
      setAttendanceData([])
    } finally {
      setLoading(false)
    }
  }, [profile?.id, currentDate, selectedSite])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
      return newDate
    })
  }

  const getAttendanceForDate = useCallback((date: Date): AttendanceData | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return attendanceData.find(record => record.work_date === dateStr)
  }, [attendanceData])

  // Calculate monthly statistics
  const monthlyStats = useMemo(() => {
    const presentDays = attendanceData.filter(d => d.labor_hours > 0)
    const totalDays = presentDays.length
    const totalLaborHours = attendanceData.reduce((sum, d) => sum + (d.labor_hours || 0), 0)
    const uniqueSites = [...new Set(attendanceData.filter(d => d.sites).map(d => d.sites!.id))].length
    
    return {
      workDays: totalDays,
      siteCount: uniqueSites,
      totalManDays: totalLaborHours.toFixed(1)
    }
  }, [attendanceData])

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    
    // Add padding for start of week
    const startPadding = getDay(monthStart)
    const paddedDays = [
      ...Array(startPadding).fill(null),
      ...days
    ]
    
    return paddedDays
  }, [currentDate])

  const selectedSiteInfo = siteHistory.find(s => s.site_id === selectedSite)

  return (
    <>
      {/* 현장조회필터 */}
      <div className="mb-3.5 site-filter-section">
        <label className="select-shell" aria-label="현장 선택">
          <div 
            className="box text-gray-900 dark:text-white"
            id="selectDisplay"
            style={{ fontFamily: "'Noto Sans KR', system-ui, sans-serif", fontWeight: 600 }}
            onClick={() => setShowSiteDropdown(!showSiteDropdown)}
          >
            {selectedSite === 'all' ? '전체 현장' : selectedSiteInfo?.site_name || '현장 선택'}
          </div>
          <span className="arrow" aria-hidden="true">
            <ChevronDown className="w-4 h-4" />
          </span>
          <select 
            id="siteSelect"
            value={selectedSite}
            onChange={(e) => {
              setSelectedSite(e.target.value)
              setShowSiteDropdown(false)
            }}
            style={{ opacity: 0, position: 'absolute', pointerEvents: 'none' }}
          >
            <option value="all">전체 현장</option>
            {siteHistory.map(site => (
              <option key={site.site_id} value={site.site_id}>
                {site.site_name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* 캘린더 */}
      <section className="mt-3 cal-wrap" id="calCard">
        <div className="cal-head">
          <button 
            id="btnPrev" 
            className="p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            aria-label="이전 달"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-white" />
          </button>
          <button id="ymBtn" className="cal-title text-[18px] font-bold hover:text-[color:var(--brand)]">
            {format(currentDate, 'yyyy년 M월')}
          </button>
          <button 
            id="btnNext" 
            className="p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            aria-label="다음 달"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-white" />
          </button>
        </div>
        
        {/* 요일 */}
        <div className="cal-grid pt-0 pb-2">
          <div className="dow sun">일</div>
          <div className="dow">월</div>
          <div className="dow">화</div>
          <div className="dow">수</div>
          <div className="dow">목</div>
          <div className="dow">금</div>
          <div className="dow">토</div>
        </div>
        
        {/* 날짜 그리드 */}
        <div className="cal-grid pb-4" id="calGrid" aria-live="polite">
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="day"></div>
            }
            
            const attendance = getAttendanceForDate(day)
            const dayOfWeek = getDay(day)
            const isSunday = dayOfWeek === 0
            const isSaturday = dayOfWeek === 6
            const hasWork = attendance && attendance.labor_hours > 0
            
            return (
              <div 
                key={format(day, 'yyyy-MM-dd')}
                className={cn(
                  "day",
                  isSunday && "sun",
                  isSaturday && "sat",
                  isToday(day) && "today",
                  hasWork && "has-work"
                )}
              >
                <div className="day-num">{format(day, 'd')}</div>
                {hasWork && (
                  <div className="work-info">
                    <div className="work-hours">{attendance.labor_hours}공수</div>
                    {attendance.sites && (
                      <div className="work-site">{attendance.sites.name}</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* 월간 통계 */}
      <section className="mt-3.5 monthly-stats-section">
        <div className="stat-head flex items-center gap-2">
          <img
            id="iconMonthly"
            src="https://postfiles.pstatic.net/MjAyNTA5MDlfNyAg/MDAxNzU3MzczOTIzODU0.BFZq2N-z_TfqaHHXHagPVOzloVF1Pc88XGJNMFUYQ-Eg.J20ua1uJqCne8_2abHUnX6O98ITuEomvcaogesHWIsgg.PNG/%EC%9B%94%EA%B0%84%ED%86%B5%EA%B3%84.png?type=w3840"
            alt="월간 통계"
            width="27"
            height="27"
            className="w-[27px] h-[27px]"
          />
          <span className="stat-title">월간 통계</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          {/* 출근(일) 통계 */}
          <div className="stat stat-workdays">
            <div className="num" id="workDays">{monthlyStats.workDays}</div>
            <div className="label">출근(일)</div>
          </div>
          {/* 현장수 통계 */}
          <div className="stat stat-sites">
            <div className="num" id="siteCount">{monthlyStats.siteCount}</div>
            <div className="label">현장수</div>
          </div>
          {/* 총공수 통계 */}
          <div className="stat stat-hours">
            <div className="num" id="totalManDays">{monthlyStats.totalManDays}</div>
            <div className="label">총공수</div>
          </div>
        </div>
      </section>

      <style jsx>{`
        /* 현장 필터 스타일 */
        .site-filter-section {
          width: 100%;
        }
        
        .select-shell {
          position: relative;
          display: block;
          width: 100%;
        }
        
        .select-shell .box {
          width: 100%;
          height: 48px;
          padding: 0 48px 0 16px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .select-shell .box:hover {
          border-color: #9ca3af;
        }
        
        .select-shell .arrow {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }
        
        :global([data-theme="dark"]) .select-shell .box {
          background: #1f2937;
          border-color: #374151;
        }
        
        /* 캘린더 스타일 */
        .cal-wrap {
          background: #ffffff;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        :global([data-theme="dark"]) .cal-wrap {
          background: #1f2937;
        }
        
        .cal-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        
        .cal-title {
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.2s ease;
        }
        
        .cal-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }
        
        .dow {
          text-align: center;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          padding: 4px;
        }
        
        .dow.sun {
          color: #ef4444;
        }
        
        :global([data-theme="dark"]) .dow {
          color: #9ca3af;
        }
        
        :global([data-theme="dark"]) .dow.sun {
          color: #f87171;
        }
        
        .day {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          position: relative;
          transition: all 0.2s ease;
        }
        
        .day-num {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }
        
        .day.sun .day-num {
          color: #ef4444;
        }
        
        .day.sat .day-num {
          color: #3b82f6;
        }
        
        .day.today {
          background: #dbeafe;
          font-weight: 700;
        }
        
        .day.has-work {
          background: #fef3c7;
          border: 1px solid #fbbf24;
        }
        
        :global([data-theme="dark"]) .day-num {
          color: #e5e7eb;
        }
        
        :global([data-theme="dark"]) .day.sun .day-num {
          color: #f87171;
        }
        
        :global([data-theme="dark"]) .day.sat .day-num {
          color: #60a5fa;
        }
        
        :global([data-theme="dark"]) .day.today {
          background: #1e3a8a;
        }
        
        :global([data-theme="dark"]) .day.has-work {
          background: #78350f;
          border-color: #fbbf24;
        }
        
        .work-info {
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          text-align: center;
          width: 100%;
        }
        
        .work-hours {
          color: #92400e;
          font-weight: 600;
        }
        
        .work-site {
          color: #78350f;
          font-size: 9px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding: 0 2px;
        }
        
        :global([data-theme="dark"]) .work-hours {
          color: #fbbf24;
        }
        
        :global([data-theme="dark"]) .work-site {
          color: #fde047;
        }
        
        /* 월간 통계 스타일 */
        .monthly-stats-section {
          background: #ffffff;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        :global([data-theme="dark"]) .monthly-stats-section {
          background: #1f2937;
        }
        
        .stat-head {
          margin-bottom: 12px;
        }
        
        .stat-title {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
        }
        
        :global([data-theme="dark"]) .stat-title {
          color: #f3f4f6;
        }
        
        .stat {
          background: #f9fafb;
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          transition: all 0.2s ease;
        }
        
        .stat:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        :global([data-theme="dark"]) .stat {
          background: #111827;
        }
        
        .stat .num {
          font-size: 24px;
          font-weight: 700;
          color: #1A254F;
          margin-bottom: 4px;
        }
        
        :global([data-theme="dark"]) .stat .num {
          color: #2F6BFF;
        }
        
        .stat .label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }
        
        :global([data-theme="dark"]) .stat .label {
          color: #9ca3af;
        }
        
        .stat-workdays {
          background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
        }
        
        .stat-sites {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        }
        
        .stat-hours {
          background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
        }
        
        :global([data-theme="dark"]) .stat-workdays {
          background: linear-gradient(135deg, #78350f 0%, #92400e 100%);
        }
        
        :global([data-theme="dark"]) .stat-sites {
          background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
        }
        
        :global([data-theme="dark"]) .stat-hours {
          background: linear-gradient(135deg, #14532d 0%, #166534 100%);
        }
      `}</style>
    </>
  )
}