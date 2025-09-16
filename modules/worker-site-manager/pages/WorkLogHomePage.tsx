'use client'

import React, { useState, useEffect } from 'react'
import { MobileLayout } from '@/modules/mobile/components/layout/mobile-layout'
import { useMobileUser } from '@/modules/mobile/hooks/use-mobile-auth'
import { WorkLogCard } from '@/modules/mobile/components/work-log/WorkLogCard'
import { WorkLogModal } from '@/modules/mobile/components/work-log/WorkLogModal'
import { WorkLogSearch } from '@/modules/mobile/components/work-log/WorkLogSearch'
import { StickyTabNavigation } from '@/modules/mobile/components/navigation/StickyTabNavigation'
import { useWorkLogs } from '@/modules/mobile/hooks/use-work-logs'
import { WorkLogStatus } from '@/modules/mobile/types/work-log.types'
import { Plus } from 'lucide-react'

export const WorkLogHomePage: React.FC = () => {
  const { profile } = useMobileUser()
  const [activeTab, setActiveTab] = useState<WorkLogStatus>('output')
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWorkLog, setEditingWorkLog] = useState<any>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // 월별 통계 상태
  const [monthlyStats, setMonthlyStats] = useState({
    totalWorkDays: 0,
    totalHours: 0,
    averageProgress: 0,
    completedTasks: 0
  })
  
  // 급여 통계 상태
  const [salaryStats, setSalaryStats] = useState({
    totalSalary: 0,
    baseSalary: 0,
    allowance: 0,
    workDays: 0,
    totalHours: 0,
    overtimeHours: 0
  })
  
  // 급여 내역 상태
  const [salaryHistory, setSalaryHistory] = useState<any[]>([])

  // 작업일지 데이터 가져오기
  const { workLogs, loading, error, createWorkLog, updateWorkLog, deleteWorkLog } = useWorkLogs({
    status: activeTab,
    searchQuery: searchQuery || undefined,
  })

  // 월별 통계 계산 useEffect
  useEffect(() => {
    if (workLogs && activeTab === 'output') {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      
      const monthlyWorkLogs = workLogs.filter(log => {
        const logDate = new Date(log.date)
        return logDate.getFullYear() === year && logDate.getMonth() === month
      })

      const totalWorkDays = monthlyWorkLogs.length
      const totalHours = monthlyWorkLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0)
      const averageProgress = monthlyWorkLogs.length > 0 
        ? monthlyWorkLogs.reduce((sum, log) => sum + (log.progress || 0), 0) / monthlyWorkLogs.length 
        : 0
      const completedTasks = monthlyWorkLogs.filter(log => log.progress >= 100).length

      setMonthlyStats({
        totalWorkDays,
        totalHours,
        averageProgress,
        completedTasks
      })
    }
  }, [workLogs, currentDate, activeTab])

  // 급여 통계 계산 useEffect
  useEffect(() => {
    if (workLogs && activeTab === 'salary') {
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth()
      
      // 현재 월 급여 계산
      const currentMonthLogs = workLogs.filter(log => {
        const logDate = new Date(log.date)
        return logDate.getFullYear() === currentYear && logDate.getMonth() === currentMonth
      })

      const workDays = currentMonthLogs.length
      const totalHours = currentMonthLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0)
      const overtimeHours = Math.max(0, totalHours - (workDays * 8))
      
      // 급여 계산 (예시 로직)
      const dailyWage = 150000 // 일당 15만원
      const hourlyWage = dailyWage / 8
      const baseSalary = workDays * dailyWage
      const overtimePay = overtimeHours * hourlyWage * 1.5
      const allowance = workDays * 10000 // 수당 1만원
      const totalSalary = baseSalary + overtimePay + allowance

      setSalaryStats({
        totalSalary,
        baseSalary,
        allowance,
        workDays,
        totalHours,
        overtimeHours
      })

      // 급여 내역 생성 (최근 3개월)
      const recentMonths = []
      for (let i = 0; i < 3; i++) {
        const targetDate = new Date(currentYear, currentMonth - i)
        const monthLogs = workLogs.filter(log => {
          const logDate = new Date(log.date)
          return logDate.getFullYear() === targetDate.getFullYear() && logDate.getMonth() === targetDate.getMonth()
        })

        if (monthLogs.length > 0) {
          const monthWorkDays = monthLogs.length
          const monthTotalHours = monthLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0)
          const monthOvertimeHours = Math.max(0, monthTotalHours - (monthWorkDays * 8))
          const monthBaseSalary = monthWorkDays * dailyWage
          const monthOvertimePay = monthOvertimeHours * hourlyWage * 1.5
          const monthAllowance = monthWorkDays * 10000
          const monthTotalSalary = monthBaseSalary + monthOvertimePay + monthAllowance

          recentMonths.push({
            id: `${targetDate.getFullYear()}-${targetDate.getMonth() + 1}`,
            month: `${targetDate.getFullYear()}년 ${targetDate.getMonth() + 1}월`,
            totalSalary: monthTotalSalary,
            workDays: monthWorkDays,
            totalHours: monthTotalHours,
            date: targetDate
          })
        }
      }

      setSalaryHistory(recentMonths)
    }
  }, [workLogs, activeTab])

  // 작업일지 관련 이벤트 핸들러
  const handleCreateWorkLog = () => {
    setEditingWorkLog(null)
    setIsModalOpen(true)
  }

  const handleEditWorkLog = (workLog: any) => {
    setEditingWorkLog(workLog)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingWorkLog(null)
  }

  const handleSaveWorkLog = async (formData: any) => {
    try {
      if (editingWorkLog) {
        await updateWorkLog(editingWorkLog.id, formData)
      } else {
        await createWorkLog(formData)
      }
      handleCloseModal()
    } catch (error) {
      console.error('작업일지 저장 실패:', error)
    }
  }

  // 작업일지 액션 핸들러들
  const handleSubmitWorkLog = async (workLogId: string) => {
    try {
      await updateWorkLog(workLogId, { status: 'approved' })
    } catch (error) {
      console.error('작업일지 제출 실패:', error)
    }
  }

  const handleViewWorkLog = (workLog: any) => {
    setEditingWorkLog(workLog)
    setIsModalOpen(true)
  }

  const handlePrintWorkLog = (workLog: any) => {
    // 인쇄 기능 구현
    console.log('인쇄:', workLog)
  }

  // 캘린더 네비게이션 함수
  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  // 캘린더 날짜 생성 함수
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // 이전 달의 빈 칸들
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({
        date: null,
        isCurrentMonth: false,
        hasWorkLog: false,
        workLogCount: 0
      })
    }

    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const workLogsForDay = workLogs?.filter(log => {
        const logDate = new Date(log.date)
        return logDate.toDateString() === date.toDateString()
      }) || []

      days.push({
        date: day,
        isCurrentMonth: true,
        hasWorkLog: workLogsForDay.length > 0,
        workLogCount: workLogsForDay.length,
        dateObj: date
      })
    }

    return days
  }

  // 날짜 클릭 핸들러
  const handleDateClick = (day: any) => {
    if (day.date && day.isCurrentMonth) {
      const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day.date)
      console.log('날짜 선택:', selectedDate)
      
      // 해당 날짜의 작업일지가 있으면 편집 모달 열기
      if (day.hasWorkLog) {
        const workLogForDay = workLogs?.find(log => {
          const logDate = new Date(log.date)
          return logDate.toDateString() === selectedDate.toDateString()
        })
        if (workLogForDay) {
          handleEditWorkLog(workLogForDay)
        }
      } else {
        // 해당 날짜로 새 작업일지 생성
        setEditingWorkLog({
          date: selectedDate.toISOString().split('T')[0]
        })
        setIsModalOpen(true)
      }
    }
  }

  // 급여명세서 다운로드 핸들러
  const handleDownloadPayslip = () => {
    console.log('급여명세서 다운로드')
    // 실제 구현에서는 PDF 생성 및 다운로드 로직 추가
  }

  return (
    <MobileLayout
      title=""
      userRole={profile?.role === 'site_manager' ? 'site_manager' : 'worker'}
      showNotification={false}
    >
      <div className="main-container worklog-body fs-100">
        {/* Line Tabs Navigation */}
        <div className="line-tabs">
          <button
            onClick={() => setActiveTab('output')}
            className={`line-tab ${activeTab === 'output' ? 'active' : ''}`}
            data-tab="output"
          >
            출력현황
          </button>
          <button
            onClick={() => setActiveTab('salary')}
            className={`line-tab ${activeTab === 'salary' ? 'active' : ''}`}
            data-tab="salary"
          >
            급여현황
          </button>
        </div>

        {/* Search Section */}
        <div className="search-section">
          <div className="search-input-wrapper">
            <WorkLogSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="현장명으로 검색"
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="content-wrapper">
          {/* 출력현황 탭 콘텐츠 */}
          {activeTab === 'output' && (
            <div className="space-y-6">
              {/* 캘린더 섹션 */}
              <div className="summary-section">
                <div className="calendar-header flex items-center justify-between mb-4">
                  <h3 className="fs-h2 font-semibold text-[var(--text)]">작업 캘린더</h3>
                  <div className="calendar-nav flex items-center gap-3">
                    <button 
                      className="nav-btn text-[var(--muted)] hover:text-[var(--text)]"
                      onClick={() => navigateMonth(-1)}
                    >
                      &#8249;
                    </button>
                    <span className="current-month font-medium text-[var(--text)]">
                      {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
                    </span>
                    <button 
                      className="nav-btn text-[var(--muted)] hover:text-[var(--text)]"
                      onClick={() => navigateMonth(1)}
                    >
                      &#8250;
                    </button>
                  </div>
                </div>
                
                {/* 캘린더 그리드 */}
                <div className="calendar-grid grid grid-cols-7 gap-1">
                  {/* 요일 헤더 */}
                  {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                    <div key={day} className="calendar-day-header text-center py-2 text-sm font-medium text-[var(--muted)]">
                      {day}
                    </div>
                  ))}
                  
                  {/* 날짜 셀들 */}
                  {generateCalendarDays().map((day) => (
                    <div 
                      key={day.date}
                      className={`calendar-day cursor-pointer rounded-lg p-2 text-center min-h-[44px] flex flex-col items-center justify-center transition-colors ${
                        day.isCurrentMonth 
                          ? 'text-[var(--text)] hover:bg-gray-50' 
                          : 'text-[var(--muted)]'
                      } ${
                        day.hasWorkLog 
                          ? 'bg-[var(--tag1-20)] border border-[var(--tag1)]' 
                          : ''
                      } ${
                        day.isToday 
                          ? 'ring-2 ring-[var(--accent)] bg-[var(--accent)]/10' 
                          : ''
                      }`}
                      onClick={() => handleDateClick(day)}
                    >
                      <span className="text-sm font-medium">{day.day}</span>
                      {day.hasWorkLog && (
                        <div className="w-1 h-1 bg-[var(--accent)] rounded-full mt-1"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 월별 통계 카드 */}
              <div className="summary-section">
                <div className="stats-grid grid grid-cols-2 gap-4">
                  <div className="stat-card">
                    <div className="stat-header flex items-center justify-between mb-2">
                      <span className="stat-label text-[var(--muted)] text-sm">총 작업일</span>
                      <div className="stat-icon w-8 h-8 bg-[var(--accent)]/20 rounded-lg flex items-center justify-center">
                        <span className="text-[var(--accent)] text-xs">📅</span>
                      </div>
                    </div>
                    <div className="stat-value text-2xl font-bold text-[var(--text)]">
                      {monthlyStats.totalWorkDays || 0}
                      <span className="text-sm font-normal text-[var(--muted)] ml-1">일</span>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-header flex items-center justify-between mb-2">
                      <span className="stat-label text-[var(--muted)] text-sm">총 공수</span>
                      <div className="stat-icon w-8 h-8 bg-[var(--tag1)]/20 rounded-lg flex items-center justify-center">
                        <span className="text-[var(--tag1)] text-xs">⏰</span>
                      </div>
                    </div>
                    <div className="stat-value text-2xl font-bold text-[var(--text)]">
                      {monthlyStats.totalHours || 0}
                      <span className="text-sm font-normal text-[var(--muted)] ml-1">H</span>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-header flex items-center justify-between mb-2">
                      <span className="stat-label text-[var(--muted)] text-sm">진행률</span>
                      <div className="stat-icon w-8 h-8 bg-[var(--tag4)]/20 rounded-lg flex items-center justify-center">
                        <span className="text-[var(--tag4-ink)] text-xs">📊</span>
                      </div>
                    </div>
                    <div className="stat-value text-2xl font-bold text-[var(--text)]">
                      {monthlyStats.averageProgress || 0}
                      <span className="text-sm font-normal text-[var(--muted)] ml-1">%</span>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-header flex items-center justify-between mb-2">
                      <span className="stat-label text-[var(--muted)] text-sm">완료</span>
                      <div className="stat-icon w-8 h-8 bg-[var(--tag3)]/20 rounded-lg flex items-center justify-center">
                        <span className="text-[var(--tag3)] text-xs">✓</span>
                      </div>
                    </div>
                    <div className="stat-value text-2xl font-bold text-[var(--text)]">
                      {monthlyStats.completedTasks || 0}
                      <span className="text-sm font-normal text-[var(--muted)] ml-1">건</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Work Log Cards List */}
              {loading && (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0068FE]"></div>
                  <span className="ml-2 text-gray-600">로딩 중...</span>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-600 text-sm">오류가 발생했습니다: {error}</p>
                </div>
              )}

              {!loading && !error && workLogs && workLogs.length > 0 && (
                <div className="space-y-3">
                  {workLogs.map(workLog => (
                    <WorkLogCard
                      key={workLog.id}
                      workLog={workLog}
                      onEdit={handleEditWorkLog}
                      onSubmit={handleSubmitWorkLog}
                      onView={handleViewWorkLog}
                      onPrint={handlePrintWorkLog}
                    />
                  ))}
                </div>
              )}

              {!loading && !error && (!workLogs || workLogs.length === 0) && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-gray-400"
                    >
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg mb-2">출력현황 데이터가 없습니다</p>
                  <p className="text-gray-400 text-sm">
                    {searchQuery ? '검색 조건을 변경해보세요' : '새 작업일지를 작성해보세요'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 급여현황 탭 콘텐츠 */}
          {activeTab === 'salary' && (
            <div className="space-y-6">
              {/* 급여 요약 카드 */}
              <div className="summary-section salary-summary">
                <div className="summary-header flex items-center justify-between mb-4">
                  <h3 className="fs-h2 font-semibold text-[var(--text)]">이번 달 급여</h3>
                  <div className="month-selector text-sm text-[var(--muted)]">
                    {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
                  </div>
                </div>
                
                <div className="salary-amount text-center py-6">
                  <div className="amount text-3xl font-bold text-[var(--accent)] mb-2">
                    {salaryStats.totalSalary.toLocaleString()}원
                  </div>
                  <div className="breakdown text-sm text-[var(--muted)]">
                    기본급 {salaryStats.baseSalary.toLocaleString()}원 + 
                    수당 {salaryStats.allowance.toLocaleString()}원
                  </div>
                </div>

                <div className="salary-details grid grid-cols-3 gap-4 pt-4 border-t border-[var(--line)]">
                  <div className="detail-item text-center">
                    <div className="detail-value text-lg font-semibold text-[var(--text)]">
                      {salaryStats.workDays}
                    </div>
                    <div className="detail-label text-xs text-[var(--muted)]">근무일</div>
                  </div>
                  <div className="detail-item text-center">
                    <div className="detail-value text-lg font-semibold text-[var(--text)]">
                      {salaryStats.totalHours}
                    </div>
                    <div className="detail-label text-xs text-[var(--muted)]">총 시간</div>
                  </div>
                  <div className="detail-item text-center">
                    <div className="detail-value text-lg font-semibold text-[var(--text)]">
                      {salaryStats.overtimeHours}
                    </div>
                    <div className="detail-label text-xs text-[var(--muted)]">연장근무</div>
                  </div>
                </div>
              </div>

              {/* 급여명세서 미리보기 */}
              <div className="summary-section payslip-preview">
                <div className="preview-header flex items-center justify-between mb-4">
                  <h3 className="fs-h2 font-semibold text-[var(--text)]">급여명세서</h3>
                  <button 
                    className="download-btn flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--accent)]/90 transition-colors"
                    onClick={handleDownloadPayslip}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="7,10 12,15 17,10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    다운로드
                  </button>
                </div>

                <div className="preview-content border border-[var(--line)] rounded-lg p-4">
                  <div className="mock-payslip text-center text-[var(--muted)]">
                    <div className="payslip-icon mx-auto mb-3">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--muted)]">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10,9 9,9 8,9"/>
                      </svg>
                    </div>
                    <div className="payslip-text text-sm">
                      급여명세서를 미리보려면<br />
                      위의 다운로드 버튼을 클릭하세요
                    </div>
                  </div>
                </div>
              </div>

              {/* 급여 내역 목록 */}
              <div className="summary-section salary-history">
                <h3 className="fs-h2 font-semibold text-[var(--text)] mb-4">최근 급여 내역</h3>
                
                <div className="history-list space-y-3">
                  {salaryHistory.map((record) => (
                    <div key={record.month} className="history-item flex items-center justify-between p-3 border border-[var(--line)] rounded-lg">
                      <div className="item-info">
                        <div className="item-month text-sm font-medium text-[var(--text)]">
                          {record.month}
                        </div>
                        <div className="item-details text-xs text-[var(--muted)]">
                          근무 {record.workDays}일 · {record.totalHours}시간
                        </div>
                      </div>
                      <div className="item-amount text-lg font-semibold text-[var(--accent)]">
                        {record.amount.toLocaleString()}원
                      </div>
                    </div>
                  ))}
                </div>

                {salaryHistory.length === 0 && (
                  <div className="text-center py-8 text-[var(--muted)]">
                    급여 내역이 없습니다
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        <button
          onClick={handleCreateWorkLog}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#0068FE] hover:bg-blue-600 active:scale-95 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 z-50"
          aria-label="작업일지 작성"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>

        {/* Work Log Modal */}
        {isModalOpen && (
          <WorkLogModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            workLog={editingWorkLog}
            onSave={handleSaveWorkLog}
          />
        )}
      </div>
    </MobileLayout>
  )
}
