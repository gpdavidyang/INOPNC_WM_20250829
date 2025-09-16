'use client'

import React, { useState, useEffect } from 'react'
import { MobileLayout } from '@/modules/mobile/components/layout/mobile-layout'
import { useMobileUser } from '@/modules/mobile/hooks/use-mobile-auth'

export const WorkLogHomePage: React.FC = () => {
  const { profile } = useMobileUser()
  const [activeTab, setActiveTab] = useState<'output' | 'salary'>('output')
  const [selectedSite, setSelectedSite] = useState('전체 현장')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [currentDate, setCurrentDate] = useState(new Date())

  // Mock data for work output
  const workData = [
    { date: '2025-01-01', hours: 8.0, site: '현장 1', overtime: 0 },
    { date: '2025-01-02', hours: 8.5, site: '현장 1', overtime: 0.5 },
    { date: '2025-01-03', hours: 9.0, site: '현장 2', overtime: 1.0 },
    { date: '2025-01-06', hours: 8.0, site: '현장 1', overtime: 0 },
    { date: '2025-01-07', hours: 7.5, site: '현장 1', overtime: 0 },
    { date: '2025-01-08', hours: 8.5, site: '현장 2', overtime: 0.5 },
    { date: '2025-01-09', hours: 9.5, site: '현장 1', overtime: 1.5 },
    { date: '2025-01-10', hours: 8.0, site: '현장 2', overtime: 0 },
    { date: '2025-01-13', hours: 8.0, site: '현장 1', overtime: 0 },
    { date: '2025-01-14', hours: 8.5, site: '현장 1', overtime: 0.5 },
  ]

  // Calendar helpers
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const getWorkDataForDate = (dateStr: string) => {
    return workData.find(work => work.date === dateStr)
  }

  // Statistics calculation
  const filteredWorkData =
    selectedSite === '전체 현장' ? workData : workData.filter(work => work.site === selectedSite)

  const totalWorkDays = filteredWorkData.length
  const totalWorkHours = filteredWorkData.reduce((sum, work) => sum + work.hours, 0)
  const totalOvertimeHours = filteredWorkData.reduce((sum, work) => sum + work.overtime, 0)
  const averageDailyWage = totalWorkDays > 0 ? (totalWorkHours * 15000) / totalWorkDays : 0

  // HTML 요구사항에 맞는 통계 계산
  const siteCount = [...new Set(workData.map(work => work.site))].length // 현장수
  const totalManDays = filteredWorkData.reduce((sum, work) => sum + work.hours / 8, 0) // 총공수 (8시간 기준)

  // Salary calculation
  const monthlyBasePay = totalWorkHours * 15000
  const overtimePay = totalOvertimeHours * 15000 * 1.5
  const totalGrossPay = monthlyBasePay + overtimePay
  const tax = Math.floor(totalGrossPay * 0.08)
  const insurance = Math.floor(totalGrossPay * 0.09)
  const totalDeductions = tax + insurance
  const netPay = totalGrossPay - totalDeductions

  // Calendar rendering
  const renderCalendar = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)

    const days = []
    const weekDays = ['일', '월', '화', '수', '목', '금', '토']

    // Week day headers
    weekDays.forEach((day, index) => {
      days.push(
        <div
          key={`header-${index}`}
          className={`text-center text-xs font-semibold p-3 bg-gray-50 border border-gray-200 ${
            index === 0 ? 'text-red-500' : 'text-gray-700'
          }`}
        >
          {day}
        </div>
      )
    })

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-3 min-h-[80px] border border-gray-200"></div>)
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const workInfo = getWorkDataForDate(dateStr)
      const isToday = dateStr === new Date().toISOString().split('T')[0]

      days.push(
        <div
          key={day}
          className={`p-3 min-h-[80px] border border-gray-200 relative ${
            isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
          } hover:bg-gray-50 transition-colors`}
        >
          <div
            className={`text-sm font-medium ${isToday ? 'font-bold text-blue-600' : 'text-gray-800'}`}
          >
            {day}
          </div>
          {workInfo && (
            <div className="mt-1">
              <div className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded mb-1">
                {workInfo.hours}h
              </div>
              {workInfo.overtime > 0 && (
                <div className="text-xs bg-orange-100 text-orange-700 px-1 py-0.5 rounded">
                  +{workInfo.overtime}h
                </div>
              )}
            </div>
          )}
        </div>
      )
    }

    return days
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  return (
    <MobileLayout
      title=""
      userRole={profile?.role === 'site_manager' ? 'site_manager' : 'worker'}
      showNotification={false}
    >
      <div className="min-h-screen bg-[#f5f7fb] font-['Noto_Sans_KR']">
        {/* Tab Navigation - 100% worklog.html 일치 */}
        <div
          className="grid grid-cols-2 border-b-2"
          style={{
            borderBottomColor: '#E5EAF3',
          }}
        >
          <button
            onClick={() => setActiveTab('output')}
            className={`relative flex items-center justify-center transition-all duration-300 ${
              activeTab === 'output' ? 'line-tab-active' : ''
            }`}
            style={{
              padding: '10px 6px',
              fontSize: '17px',
              fontWeight: '600',
              color: '#1A254F',
              fontFamily: '"Noto Sans KR", system-ui, sans-serif',
            }}
          >
            출력현황
            {activeTab === 'output' && (
              <div
                className="absolute left-0 right-0 bottom-0"
                style={{
                  height: '2px',
                  backgroundColor: '#1A254F',
                }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('salary')}
            className={`relative flex items-center justify-center transition-all duration-300 ${
              activeTab === 'salary' ? 'line-tab-active' : ''
            }`}
            style={{
              padding: '10px 6px',
              fontSize: '17px',
              fontWeight: '600',
              color: '#1A254F',
              fontFamily: '"Noto Sans KR", system-ui, sans-serif',
            }}
          >
            급여현황
            {activeTab === 'salary' && (
              <div
                className="absolute left-0 right-0 bottom-0"
                style={{
                  height: '2px',
                  backgroundColor: '#1A254F',
                }}
              />
            )}
          </button>
        </div>

        {/* Site Filter - 100% worklog.html 일치 */}
        <div className="bg-white border-b border-[#e6eaf2]">
          <div className="px-4 py-3">
            <label className="relative w-full min-w-0 block" aria-label="현장 선택">
              <div
                className="flex items-center justify-center w-full border rounded-xl transition-all duration-300"
                style={{
                  height: '48px',
                  padding: '0 14px',
                  borderColor: '#E6ECF4',
                  backgroundColor: '#fff',
                  color: '#1A254F',
                  fontFamily: '"Noto Sans KR", system-ui, sans-serif',
                  fontWeight: '600',
                  fontSize: '15px',
                }}
              >
                {selectedSite}
              </div>
              <span
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                style={{
                  width: '10px',
                  height: '10px',
                  background: `
                    linear-gradient(45deg, #9aa3b6 50%, transparent 50%) center,
                    linear-gradient(-45deg, #9aa3b6 50%, transparent 50%) center
                  `,
                  backgroundSize: '8px 8px, 8px 8px',
                  backgroundRepeat: 'no-repeat',
                  clipPath: 'polygon(50% 70%, 0 20%, 100% 20%)',
                }}
                aria-hidden="true"
              />
              <select
                value={selectedSite}
                onChange={e => setSelectedSite(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{
                  fontSize: '16px',
                  fontFamily: '"Noto Sans KR", system-ui, sans-serif',
                  fontWeight: '600',
                  borderRadius: '12px',
                  outline: 'none',
                }}
              >
                <option>전체 현장</option>
                <option>현장 1</option>
                <option>현장 2</option>
                <option>현장 3</option>
              </select>
            </label>
          </div>
        </div>

        {/* Output Status Tab */}
        {activeTab === 'output' && (
          <div className="px-4 py-4 space-y-4">
            {/* Calendar Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e6eaf2] p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <img
                    src="/icons/20250912/image_backup/출력현황.png"
                    alt="출력현황"
                    className="w-5 h-5"
                  />
                  <h3 className="text-lg font-bold text-[#1A254F]">근무 캘린더</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 active:scale-95 transition-all duration-200"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="15,18 9,12 15,6" />
                    </svg>
                  </button>
                  <h4 className="text-base font-semibold text-[#1A254F] min-w-[100px] text-center">
                    {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
                  </h4>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 active:scale-95 transition-all duration-200"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="9,18 15,12 9,6" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-0 text-sm border border-gray-200 rounded-lg overflow-hidden">
                {renderCalendar()}
              </div>
            </div>

            {/* Monthly Statistics - HTML 요구사항 정확 구현 */}
            <div className="mt-3.5 monthly-stats-section bg-white rounded-2xl shadow-sm border border-[#e6eaf2] p-4">
              <div className="stat-head flex items-center gap-2 mb-3">
                <img
                  src="https://postfiles.pstatic.net/MjAyNTA5MDlfNyAg/MDAxNzU3MzczOTIzODU0.BFZq2N-z_TfqaHHXHagPVOzloVF1Pc88XGJNMFUYQ-Eg.J20ua1uJqCne8_2abHUnX6O98ITuEomvcaogesHWIsgg.PNG/%EC%9B%94%EA%B0%84%ED%86%B5%EA%B3%84.png?type=w3840"
                  alt="월간 통계"
                  width="27"
                  height="27"
                  className="w-[27px] h-[27px]"
                />
                <span
                  className="stat-title text-lg font-bold text-[#1A254F]"
                  style={{
                    fontFamily: "'Noto Sans KR', system-ui, sans-serif",
                    fontWeight: 700,
                    fontSize: '17px',
                  }}
                >
                  월간 통계
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-3">
                {/* 출근(일) 통계 */}
                <div
                  className="stat stat-workdays rounded-xl p-4 text-center border"
                  style={{
                    color: '#0068FE',
                    backgroundColor: 'rgba(0, 104, 254, 0.05)',
                    borderColor: 'rgba(0, 104, 254, 0.2)',
                  }}
                >
                  <div className="num text-2xl font-bold mb-1">{totalWorkDays}</div>
                  <div className="label text-sm font-medium">출근(일)</div>
                </div>

                {/* 현장수 통계 */}
                <div
                  className="stat stat-sites rounded-xl p-4 text-center border"
                  style={{
                    color: '#8B5CF6',
                    backgroundColor: 'rgba(139, 92, 246, 0.05)',
                    borderColor: 'rgba(139, 92, 246, 0.2)',
                  }}
                >
                  <div className="num text-2xl font-bold mb-1">{siteCount}</div>
                  <div className="label text-sm font-medium">현장수</div>
                </div>

                {/* 총공수 통계 */}
                <div
                  className="stat stat-mandays rounded-xl p-4 text-center border"
                  style={{
                    color: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    borderColor: 'rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <div className="num text-2xl font-bold mb-1">{totalManDays.toFixed(1)}</div>
                  <div className="label text-sm font-medium">총공수</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Salary Status Tab */}
        {activeTab === 'salary' && (
          <div className="px-4 py-4 space-y-4">
            {/* Salary Overview */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e6eaf2] p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 bg-[#0068FE] rounded flex items-center justify-center">
                  <span className="text-white text-xs">💰</span>
                </div>
                <h3 className="text-lg font-bold text-[#1A254F]">급여 현황</h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">기본급</span>
                  <span className="text-sm font-semibold text-[#1A254F]">
                    {monthlyBasePay.toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">연장근무수당</span>
                  <span className="text-sm font-semibold text-[#0068FE]">
                    +{overtimePay.toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-base font-semibold text-[#1A254F]">지급총액</span>
                  <span className="text-base font-bold text-[#1A254F]">
                    {totalGrossPay.toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">소득세</span>
                  <span className="text-sm font-semibold text-red-600">
                    -{tax.toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">보험료</span>
                  <span className="text-sm font-semibold text-red-600">
                    -{insurance.toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-3">
                  <span className="text-lg font-bold text-green-800">실지급액</span>
                  <span className="text-lg font-bold text-green-600">
                    {netPay.toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>

            {/* Payslip Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e6eaf2] p-4">
              <h3 className="text-lg font-bold text-[#1A254F] mb-4">급여명세서</h3>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="flex-1 h-10 px-3 border border-[#e6eaf2] rounded-lg bg-white text-sm focus:border-[#0068FE] focus:ring-2 focus:ring-[#0068FE]/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button className="h-12 bg-[#1A254F] text-white rounded-xl font-semibold hover:bg-[#152041] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14,2 14,8 20,8" />
                    </svg>
                    명세서 생성
                  </button>
                  <button className="h-12 bg-[#0068FE] text-white rounded-xl font-semibold hover:bg-blue-600 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7,10 12,15 17,10" />
                      <line x1="12" x2="12" y1="15" y2="3" />
                    </svg>
                    PDF 다운로드
                  </button>
                </div>
              </div>
            </div>

            {/* Salary History */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e6eaf2] p-4">
              <h3 className="text-lg font-bold text-[#1A254F] mb-4">급여 이력</h3>

              <div className="space-y-3">
                {['2024-12', '2024-11', '2024-10'].map(month => (
                  <div
                    key={month}
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#1A254F]">{month}</p>
                      <p className="text-xs text-gray-600">급여명세서</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-green-600">
                        {(Math.random() * 1000000 + 2000000)
                          .toFixed(0)
                          .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        원
                      </span>
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 active:scale-95 transition-all duration-200">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7,10 12,15 17,10" />
                          <line x1="12" x2="12" y1="15" y2="3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  )
}
