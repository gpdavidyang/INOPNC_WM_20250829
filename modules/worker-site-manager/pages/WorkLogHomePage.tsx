'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { MobileLayout } from '@/modules/mobile/components/layout/mobile-layout'
import { useMobileUser } from '@/modules/mobile/hooks/use-mobile-auth'
import { WorkLogCard } from '@/modules/mobile/components/work-log/WorkLogCard'
import { WorkLogModal } from '@/modules/mobile/components/work-log/WorkLogModal'
import { WorkLogSearch } from '@/modules/mobile/components/work-log/WorkLogSearch'
import { StickyTabNavigation } from '@/modules/mobile/components/navigation/StickyTabNavigation'
import { useWorkLogs } from '@/modules/mobile/hooks/use-work-logs'
import { useTemporaryWorkLogs } from '@/modules/mobile/hooks/use-temporary-work-logs'
import { WorkLogStatus, WorkLogTabStatus } from '@/modules/mobile/types/work-log.types'
import PayslipPreviewModal from '@/modules/mobile/components/work-log/PayslipPreviewModal'
import { SimplifiedBottomSheet } from '@/modules/mobile/components/work-log/UncompletedBottomSheet'
import { Plus } from 'lucide-react'
import { calculateMonthlySalary } from '@/app/actions/salary'

export const WorkLogHomePage: React.FC = () => {
  const { profile } = useMobileUser()
  const [activeTab, setActiveTab] = useState<WorkLogTabStatus>('draft')
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWorkLog, setEditingWorkLog] = useState<any>(null)
  const [currentDate, setCurrentDate] = useState(new Date())

  // Bottom Sheet 상태
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false)
  const [temporaryWorkLogs, setTemporaryWorkLogs] = useState<any[]>([])

  // 월별 통계 상태
  const [monthlyStats, setMonthlyStats] = useState({
    totalWorkDays: 0,
    totalHours: 0,
    averageProgress: 0,
    completedTasks: 0,
  })

  // 급여 통계 상태
  const [salaryStats, setSalaryStats] = useState({
    totalSalary: 0,
    baseSalary: 0,
    allowance: 0,
    workDays: 0,
    totalHours: 0,
    overtimeHours: 0,
  })

  // 급여 내역 상태
  const [salaryHistory, setSalaryHistory] = useState<any[]>([])

  // 급여명세서 모달 상태
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false)
  const [payslipData, setPayslipData] = useState<any>(null)

  // 급여 정보 로딩 상태
  const [isLoadingSalary, setIsLoadingSalary] = useState(false)
  const [salaryError, setSalaryError] = useState<string | null>(null)

  // 서버 API를 사용한 월간 급여 계산 함수
  const fetchMonthlySalary = useCallback(
    async (year: number, month: number) => {
      if (!profile?.id) return

      setIsLoadingSalary(true)
      setSalaryError(null)

      try {
        const result = await calculateMonthlySalary({
          user_id: profile.id,
          year,
          month,
        })

        if (result.success && result.data) {
          setSalaryStats({
            totalSalary: result.data.total_gross_pay || 0,
            baseSalary: result.data.base_pay || 0,
            allowance: result.data.bonus_pay || 0,
            workDays: result.data.work_days || 0,
            totalHours: result.data.total_work_hours || 0,
            overtimeHours: result.data.total_overtime_hours || 0,
          })
        } else {
          setSalaryError(result.error || '급여 정보를 불러올 수 없습니다')
        }
      } catch (error) {
        console.error('급여 계산 오류:', error)
        setSalaryError('급여 계산 중 오류가 발생했습니다')
      } finally {
        setIsLoadingSalary(false)
      }
    },
    [profile?.id]
  )

  // 현재 월의 급여 정보 로드
  useEffect(() => {
    if (profile?.id) {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      fetchMonthlySalary(year, month)
    }
  }, [profile?.id, currentDate, fetchMonthlySalary])

  // 월별 통계는 서버 API에서 처리되므로 클라이언트 계산 제거

  // 작업일지 데이터 가져오기 - 탭에 따른 실제 상태 매핑
  const actualStatus: WorkLogStatus = activeTab === 'draft' ? 'temporary' : 'completed'
  const { workLogs, loading, error, createWorkLog, updateWorkLog, deleteWorkLog } = useWorkLogs({
    status: actualStatus,
    searchQuery: searchQuery || undefined,
  })

  // 임시저장 작업일지 관리
  const {
    temporaryWorkLogs: tempLogs,
    loading: tempLoading,
    error: tempError,
    refreshTemporaryWorkLogs,
    deleteTemporaryWorkLog,
    loadTemporaryWorkLog,
  } = useTemporaryWorkLogs({ searchQuery })

  // 월별 통계 계산 useEffect
  useEffect(() => {
    if (workLogs && activeTab === 'draft') {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()

      const monthlyWorkLogs = workLogs.filter(log => {
        const logDate = new Date(log.date)
        return logDate.getFullYear() === year && logDate.getMonth() === month
      })

      const totalWorkDays = monthlyWorkLogs.length
      const totalHours = monthlyWorkLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0)
      const averageProgress =
        monthlyWorkLogs.length > 0
          ? monthlyWorkLogs.reduce((sum, log) => sum + (log.progress || 0), 0) /
            monthlyWorkLogs.length
          : 0
      const completedTasks = monthlyWorkLogs.filter(log => log.progress >= 100).length

      setMonthlyStats({
        totalWorkDays,
        totalHours,
        averageProgress,
        completedTasks,
      })
    }
  }, [workLogs, currentDate, activeTab])

  // 임시저장 작업일지 감지 및 Bottom Sheet 표시 useEffect
  useEffect(() => {
    if (workLogs && actualStatus === 'temporary') {
      const tempLogs = workLogs.map(log => ({
        id: log.id,
        siteName: log.siteName,
        date: log.date,
        createdAt: log.createdAt,
      }))
      setTemporaryWorkLogs(tempLogs)

      // 임시저장 작업일지가 있으면 Bottom Sheet 표시
      if (tempLogs.length > 0) {
        setIsBottomSheetVisible(true)
      }
    } else {
      setTemporaryWorkLogs([])
      setIsBottomSheetVisible(false)
    }
  }, [workLogs, actualStatus])

  // 급여 통계는 서버 API에서 계산되므로 클라이언트 계산 로직 제거
  // fetchMonthlySalary에서 처리됨

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
  const handleSubmitWorkLog = useCallback(async (workLogId: string) => {
    try {
      await updateWorkLog(workLogId, { status: 'completed' })
    } catch (error) {
      console.error('작업일지 제출 실패:', error)
    }
  }, [])

  const handleViewWorkLog = useCallback((workLog: any) => {
    setEditingWorkLog(workLog)
    setIsModalOpen(true)
  }, [])

  const handlePrintWorkLog = useCallback((workLog: any) => {
    // TODO: 인쇄 기능 구현
    // console.log('인쇄:', workLog)
  }, [])

  // Bottom Sheet 핸들러들
  const handleCloseBottomSheet = useCallback(() => {
    setIsBottomSheetVisible(false)
  }, [])

  const handleCreateWorkLogFromBottomSheet = useCallback(() => {
    handleCreateWorkLog()
  }, [handleCreateWorkLog])

  // 임시저장 관련 핸들러들
  const handleLoadTemporaryWorkLog = useCallback(async (tempLog: any) => {
    try {
      // 임시저장 데이터를 홈페이지로 전달하기 위해 localStorage 사용
      localStorage.setItem('loadTemporaryWorkLog', JSON.stringify(tempLog))
      // 홈페이지로 이동
      window.location.href = '/mobile'
    } catch (error) {
      console.error('임시저장 불러오기 실패:', error)
    }
  }, [])

  const handleDeleteTemporaryWorkLog = useCallback(async (id: string) => {
    if (confirm('이 임시저장을 삭제하시겠습니까?')) {
      try {
        await deleteTemporaryWorkLog(id)
        // 목록 새로고침은 hook에서 자동으로 처리됨
      } catch (error) {
        console.error('임시저장 삭제 실패:', error)
      }
    }
  }, [])

  // 캘린더 네비게이션 함수
  const navigateMonth = useCallback(
    (direction: number) => {
      const newDate = new Date(currentDate)
      newDate.setMonth(newDate.getMonth() + direction)
      setCurrentDate(newDate)
    },
    [currentDate]
  )

  // 캘린더 날짜 생성 함수 - 성능 최적화를 위해 useMemo 사용
  const generateCalendarDays = useMemo(() => {
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
        workLogCount: 0,
      })
    }

    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const workLogsForDay =
        workLogs?.filter(log => {
          const logDate = new Date(log.date)
          return logDate.toDateString() === date.toDateString()
        }) || []

      days.push({
        date: day,
        isCurrentMonth: true,
        hasWorkLog: workLogsForDay.length > 0,
        workLogCount: workLogsForDay.length,
        dateObj: date,
      })
    }

    return days
  }, [currentDate, workLogs])

  // 급여명세서 다운로드 핸들러
  const handleDownloadPayslip = useCallback(() => {
    // 급여 데이터 준비 (실제 구현시 API에서 가져옴)
    const currentMonth = currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })

    const mockPayslipData = {
      employeeName: profile?.full_name || '홍길동',
      employeeId: profile?.id?.substring(0, 8) || 'EMP001',
      department: '건설현장',
      position: profile?.role === 'site_manager' ? '현장관리자' : '작업자',
      workMonth: currentMonth,
      totalWorkDays: salaryStats.workDays || 20,
      actualWorkDays: salaryStats.workDays || 18,
      totalWorkHours: salaryStats.totalHours || 144,
      overtimeHours: salaryStats.overtimeHours || 8,
      baseSalary: salaryStats.baseSalary || 3000000,
      overtimePay: Math.floor((salaryStats.overtimeHours || 8) * 25000),
      allowances: salaryStats.allowance || 200000,
      totalEarnings: salaryStats.totalSalary || 3400000,
      incomeTax: Math.floor((salaryStats.totalSalary || 3400000) * 0.033),
      nationalPension: Math.floor((salaryStats.totalSalary || 3400000) * 0.045),
      healthInsurance: Math.floor((salaryStats.totalSalary || 3400000) * 0.0335),
      employmentInsurance: Math.floor((salaryStats.totalSalary || 3400000) * 0.008),
      totalDeductions: Math.floor(
        (salaryStats.totalSalary || 3400000) * (0.033 + 0.045 + 0.0335 + 0.008)
      ),
      netPay:
        (salaryStats.totalSalary || 3400000) -
        Math.floor((salaryStats.totalSalary || 3400000) * (0.033 + 0.045 + 0.0335 + 0.008)),
    }

    setPayslipData(mockPayslipData)
    setIsPayslipModalOpen(true)
  }, [currentDate, profile, salaryStats])

  return (
    <MobileLayout
      title=""
      userRole={profile?.role === 'site_manager' ? 'site_manager' : 'worker'}
      showNotification={false}
    >
      <div className="main-container worklog-body fs-100 px-4 sm:px-6 lg:px-8">
        {/* Line Tabs Navigation */}
        <div className="line-tabs flex overflow-x-auto scrollbar-hide gap-2 sm:gap-4 pb-2">
          <button
            onClick={() => setActiveTab('draft')}
            className={`line-tab ${activeTab === 'draft' ? 'active' : ''} flex-shrink-0 min-w-[100px] h-12 px-4 active:scale-[0.98] transition-transform`}
            data-tab="draft"
          >
            임시저장
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`line-tab ${activeTab === 'approved' ? 'active' : ''} flex-shrink-0 min-w-[100px] h-12 px-4 active:scale-[0.98] transition-transform`}
            data-tab="approved"
          >
            작성완료
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
          {/* 임시저장 탭 콘텐츠 */}
          {activeTab === 'draft' && (
            <div className="space-y-6">
              {/* 임시저장 목록 헤더 */}
              <div className="summary-section">
                <div className="section-header mb-4">
                  <h3 className="section-title text-lg font-semibold text-[var(--text)] mb-1">
                    임시저장 목록
                  </h3>
                  <p className="section-subtitle text-sm text-[var(--muted)]">
                    작성 중인 작업일지를 관리하세요
                  </p>
                </div>
              </div>

              {/* 임시저장 목록 */}
              {tempLoading && (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0068FE]"></div>
                  <span className="ml-2 text-gray-600">임시저장 불러오는 중...</span>
                </div>
              )}

              {tempError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-600 text-sm">오류가 발생했습니다: {tempError}</p>
                </div>
              )}

              {!tempLoading && !tempError && tempLogs && tempLogs.length > 0 && (
                <div className="space-y-3">
                  {tempLogs.map(tempLog => (
                    <div
                      key={tempLog.id}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-all hover:shadow-md"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-base font-medium text-[var(--text)] mb-1">
                            {tempLog.title}
                          </h4>
                          {tempLog.sites && (
                            <p className="text-sm text-[var(--muted)] mb-1">
                              현장: {tempLog.sites.name}
                            </p>
                          )}
                          {tempLog.work_date && (
                            <p className="text-sm text-[var(--muted)] mb-1">
                              작업일: {new Date(tempLog.work_date).toLocaleDateString('ko-KR')}
                            </p>
                          )}
                          <p className="text-xs text-[var(--muted)]">
                            저장: {new Date(tempLog.updated_at).toLocaleString('ko-KR')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleLoadTemporaryWorkLog(tempLog)}
                            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md transition-colors"
                          >
                            불러오기
                          </button>
                          <button
                            onClick={() => handleDeleteTemporaryWorkLog(tempLog.id)}
                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </div>

                      {/* 작업 내용 미리보기 */}
                      <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          {tempLog.member_types && tempLog.member_types.length > 0 && (
                            <div>
                              <span className="text-[var(--muted)]">부재명: </span>
                              <span className="text-[var(--text)]">
                                {tempLog.member_types.join(', ')}
                              </span>
                            </div>
                          )}
                          {tempLog.work_contents && tempLog.work_contents.length > 0 && (
                            <div>
                              <span className="text-[var(--muted)]">작업공정: </span>
                              <span className="text-[var(--text)]">
                                {tempLog.work_contents.join(', ')}
                              </span>
                            </div>
                          )}
                          {tempLog.work_types && tempLog.work_types.length > 0 && (
                            <div>
                              <span className="text-[var(--muted)]">작업유형: </span>
                              <span className="text-[var(--text)]">
                                {tempLog.work_types.join(', ')}
                              </span>
                            </div>
                          )}
                          {tempLog.department && (
                            <div>
                              <span className="text-[var(--muted)]">소속: </span>
                              <span className="text-[var(--text)]">{tempLog.department}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!tempLoading && !tempError && (!tempLogs || tempLogs.length === 0) && (
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
                  <p className="text-gray-500 text-lg mb-2">임시저장된 작업일지가 없습니다</p>
                  <p className="text-gray-400 text-sm">
                    {searchQuery ? '검색 조건을 변경해보세요' : '새 작업일지를 작성해보세요'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 작성완료 탭 콘텐츠 */}
          {activeTab === 'approved' && (
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
                    기본급 {salaryStats.baseSalary.toLocaleString()}원 + 수당{' '}
                    {salaryStats.allowance.toLocaleString()}원
                  </div>
                </div>

                <div className="salary-details grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-[var(--line)]">
                  <div className="detail-item text-center">
                    <div className="detail-value text-base sm:text-lg font-semibold text-[var(--text)]">
                      {salaryStats.workDays}
                    </div>
                    <div className="detail-label text-xs text-[var(--muted)]">근무일</div>
                  </div>
                  <div className="detail-item text-center">
                    <div className="detail-value text-base sm:text-lg font-semibold text-[var(--text)]">
                      {salaryStats.totalHours}
                    </div>
                    <div className="detail-label text-xs text-[var(--muted)]">총 시간</div>
                  </div>
                  <div className="detail-item text-center">
                    <div className="detail-value text-base sm:text-lg font-semibold text-[var(--text)]">
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
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="7,10 12,15 17,10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    다운로드
                  </button>
                </div>

                <div className="preview-content border border-[var(--line)] rounded-lg p-4">
                  <div className="mock-payslip text-center text-[var(--muted)]">
                    <div className="payslip-icon mx-auto mb-3">
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="text-[var(--muted)]"
                      >
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14,2 14,8 20,8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10,9 9,9 8,9" />
                      </svg>
                    </div>
                    <div className="payslip-text text-sm">
                      급여명세서를 미리보려면
                      <br />
                      위의 다운로드 버튼을 클릭하세요
                    </div>
                  </div>
                </div>
              </div>

              {/* 급여 내역 목록 */}
              <div className="summary-section salary-history">
                <h3 className="fs-h2 font-semibold text-[var(--text)] mb-4">최근 급여 내역</h3>

                <div className="history-list space-y-3">
                  {salaryHistory.map(record => (
                    <div
                      key={record.month}
                      className="history-item flex items-center justify-between p-3 border border-[var(--line)] rounded-lg"
                    >
                      <div className="item-info">
                        <div className="item-month text-sm font-medium text-[var(--text)]">
                          {record.month}
                        </div>
                        <div className="item-details text-xs text-[var(--muted)]">
                          근무 {record.workDays}일 · {record.totalHours}시간
                        </div>
                      </div>
                      <div className="item-amount text-lg font-semibold text-[var(--accent)]">
                        {record.totalSalary.toLocaleString()}원
                      </div>
                    </div>
                  ))}
                </div>

                {salaryHistory.length === 0 && (
                  <div className="text-center py-8 text-[var(--muted)]">급여 내역이 없습니다</div>
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

        {/* Payslip Preview Modal */}
        <PayslipPreviewModal
          isOpen={isPayslipModalOpen}
          onClose={() => setIsPayslipModalOpen(false)}
          data={payslipData}
          month={currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
        />

        {/* Simplified Bottom Sheet for Temporary Work Logs */}
        <SimplifiedBottomSheet
          temporaryWorkLogs={temporaryWorkLogs}
          isVisible={isBottomSheetVisible}
          onClose={handleCloseBottomSheet}
          onCreateWorkLog={handleCreateWorkLogFromBottomSheet}
        />
      </div>
    </MobileLayout>
  )
}
