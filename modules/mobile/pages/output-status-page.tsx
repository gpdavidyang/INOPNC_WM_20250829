'use client'

import React, { useState, useEffect } from 'react'
import { MobileLayout } from '@/modules/mobile/components/layout/mobile-layout'
import { useMobileUser } from '@/modules/mobile/hooks/use-mobile-auth'
import { Card, CardContent, Button, Row, Stack } from '@/modules/shared/ui'

// Brand styles for HTML reference design compatibility
const BRAND_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap');
  
  :root {
    --brand-primary: #1A254F;
    --brand-accent: #0068FE;
    --brand-font: 'Noto Sans KR', sans-serif;
  }
  
  .brand-card {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
    border-radius: 8px !important;
    border: none !important;
  }
  
  .brand-button-primary {
    background-color: var(--brand-accent) !important;
    border-color: var(--brand-accent) !important;
    transition: all 0.2s ease !important;
  }
  
  .brand-button-primary:hover {
    background-color: #0052CC !important;
    border-color: #0052CC !important;
    transform: translateY(-1px);
  }
  
  .brand-stat-blue {
    background-color: #E3F2FD !important;
    color: var(--brand-accent) !important;
  }
  
  .brand-stat-primary {
    background-color: #F3F4F6 !important;
    color: var(--brand-primary) !important;
  }
`

export const OutputStatusPage: React.FC = () => {
  const { profile } = useMobileUser()
  const [activeTab, setActiveTab] = useState<'work' | 'pay'>('work')

  return (
    <MobileLayout
      title="출력현황"
      userRole={profile?.role as 'worker' | 'site_manager'}
      showBack={true}
    >
      <style dangerouslySetInnerHTML={{ __html: BRAND_STYLES }} />
      <div className="max-w-md mx-auto" style={{ fontFamily: 'var(--brand-font)' }}>
        {/* Tab Navigation */}
        <nav className="line-tabs mb-4">
          <div className="flex">
            <button
              className={`flex-1 px-4 py-3 text-center border-b-2 transition-colors ${
                activeTab === 'work' ? 'font-medium' : 'border-gray-200 text-gray-500'
              }`}
              style={{
                borderBottomColor: activeTab === 'work' ? 'var(--brand-accent)' : '#e5e7eb',
                color: activeTab === 'work' ? 'var(--brand-accent)' : '#6b7280',
              }}
              onClick={() => setActiveTab('work')}
            >
              출력현황
            </button>
            <button
              className={`flex-1 px-4 py-3 text-center border-b-2 transition-colors ${
                activeTab === 'pay' ? 'font-medium' : 'border-gray-200 text-gray-500'
              }`}
              style={{
                borderBottomColor: activeTab === 'pay' ? 'var(--brand-accent)' : '#e5e7eb',
                color: activeTab === 'pay' ? 'var(--brand-accent)' : '#6b7280',
              }}
              onClick={() => setActiveTab('pay')}
            >
              급여현황
            </button>
          </div>
        </nav>

        {/* Tab Content */}
        <div className="p-4">{activeTab === 'work' ? <WorkOutputTab /> : <SalaryTab />}</div>
      </div>
    </MobileLayout>
  )
}

// 출력현황 탭 컴포넌트
const WorkOutputTab: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

  // 월간 통계 계산 함수
  const calculateMonthlyStats = () => {
    const currentYear = selectedDate.getFullYear()
    const currentMonth = selectedDate.getMonth() + 1

    // 임시 월간 근무 데이터 (실제로는 API에서 해당 월의 데이터를 가져와야 함)
    const monthlyAttendanceData = [
      { date: '2025-09-01', site: '삼성전자 평택캠퍼스 P3', workHours: 8, laborCount: 1 },
      { date: '2025-09-02', site: '안산시청 신축공사', workHours: 9, laborCount: 2 },
      { date: '2025-09-03', site: '삼성전자 평택캠퍼스 P3', workHours: 8, laborCount: 1 },
      { date: '2025-09-04', site: '포항제철소 설비보수', workHours: 10, laborCount: 3 },
      { date: '2025-09-05', site: '안산시청 신축공사', workHours: 8, laborCount: 1 },
      { date: '2025-09-06', site: '삼성전자 평택캠퍼스 P3', workHours: 8.5, laborCount: 1 },
      { date: '2025-09-09', site: '포항제철소 설비보수', workHours: 9, laborCount: 2 },
      { date: '2025-09-10', site: '안산시청 신축공사', workHours: 8, laborCount: 1 },
      { date: '2025-09-11', site: '삼성전자 평택캠퍼스 P3', workHours: 8, laborCount: 1 },
      { date: '2025-09-12', site: '포항제철소 설비보수', workHours: 10, laborCount: 3 },
      { date: '2025-09-13', site: '삼성전자 평택캠퍼스 P3', workHours: 8, laborCount: 1 },
      { date: '2025-09-14', site: '안산시청 신축공사', workHours: 9, laborCount: 2 },
      { date: '2025-09-15', site: '삼성전자 평택캠퍼스 P3', workHours: 8, laborCount: 1 },
      { date: '2025-09-16', site: '포항제철소 설비보수', workHours: 9.5, laborCount: 2 },
      { date: '2025-09-17', site: '안산시청 신축공사', workHours: 8, laborCount: 1 },
    ]

    // 해당 월의 데이터만 필터링
    const currentMonthData = monthlyAttendanceData.filter(record => {
      const recordDate = new Date(record.date)
      return recordDate.getFullYear() === currentYear && recordDate.getMonth() + 1 === currentMonth
    })

    // 통계 계산
    const totalWorkDays = currentMonthData.length
    const uniqueSites = [...new Set(currentMonthData.map(record => record.site))].length
    const totalHours = currentMonthData.reduce((sum, record) => sum + record.workHours, 0)
    const totalLaborCount = currentMonthData.reduce((sum, record) => sum + record.laborCount, 0)

    return {
      totalWorkDays,
      uniqueSites,
      totalHours: Math.round(totalHours * 10) / 10, // 소수점 1자리로 반올림
      totalLaborCount,
      averageHoursPerDay:
        totalWorkDays > 0 ? Math.round((totalHours / totalWorkDays) * 10) / 10 : 0,
    }
  }

  const monthlyStats = calculateMonthlyStats()

  return (
    <div className="space-y-4">
      {/* 월간 통계 카드 */}
      <Card className="brand-card">
        <CardContent className="p-4">
          <h3 className="t-h3 mb-3 text-gray-800">
            {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 근무 현황
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 brand-stat-blue rounded-lg">
              <div className="t-h2 font-bold">{monthlyStats.totalWorkDays}</div>
              <div className="t-cap text-gray-600">총 근무일</div>
            </div>
            <div className="text-center p-3 brand-stat-primary rounded-lg">
              <div className="t-h2 font-bold">{monthlyStats.uniqueSites}</div>
              <div className="t-cap text-gray-600">현장 수</div>
            </div>
            <div className="text-center p-3 brand-stat-blue rounded-lg">
              <div className="t-h2 font-bold">{monthlyStats.totalHours}</div>
              <div className="t-cap text-gray-600">총 시간</div>
            </div>
          </div>

          {/* 추가 통계 정보 */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">총 공수</span>
              <span className="font-medium text-gray-800">{monthlyStats.totalLaborCount}명</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-gray-600">일평균 근무시간</span>
              <span className="font-medium text-gray-800">
                {monthlyStats.averageHoursPerDay}시간
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 뷰 모드 전환 */}
      <div className="flex justify-center space-x-2">
        <Button
          variant={viewMode === 'calendar' ? 'primary' : 'gray'}
          size="sm"
          className={viewMode === 'calendar' ? 'brand-button-primary' : ''}
          onClick={() => setViewMode('calendar')}
        >
          📅 캘린더
        </Button>
        <Button
          variant={viewMode === 'list' ? 'primary' : 'gray'}
          size="sm"
          className={viewMode === 'list' ? 'brand-button-primary' : ''}
          onClick={() => setViewMode('list')}
        >
          📋 목록
        </Button>
      </div>

      {/* 캘린더 뷰 */}
      {viewMode === 'calendar' ? (
        <CalendarView selectedDate={selectedDate} onDateChange={setSelectedDate} />
      ) : (
        <ListView selectedDate={selectedDate} />
      )}
    </div>
  )
}

// 급여현황 탭 컴포넌트
const SalaryTab: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [hourlyRate, setHourlyRate] = useState('15000') // 시급
  const [overtimeRate, setOvertimeRate] = useState('22500') // 연장근무 시급 (1.5배)
  const [allowances, setAllowances] = useState('150000') // 제수당 (식대, 교통비 등)
  const [autoCalculate, setAutoCalculate] = useState(true) // 자동 계산 여부
  const [showPayslipPreview, setShowPayslipPreview] = useState(false)

  // 출근 데이터에서 실제 근무 정보 가져오기
  const getActualWorkData = () => {
    const attendanceData = [
      { date: '2025-09-01', site: '삼성전자 평택캠퍼스 P3', workHours: 8, laborCount: 1 },
      { date: '2025-09-02', site: '안산시청 신축공사', workHours: 9, laborCount: 2 },
      { date: '2025-09-03', site: '삼성전자 평택캠퍼스 P3', workHours: 8, laborCount: 1 },
      { date: '2025-09-04', site: '포항제철소 설비보수', workHours: 10, laborCount: 3 },
      { date: '2025-09-05', site: '안산시청 신축공사', workHours: 8, laborCount: 1 },
      { date: '2025-09-06', site: '삼성전자 평택캠퍼스 P3', workHours: 8.5, laborCount: 1 },
      { date: '2025-09-09', site: '포항제철소 설비보수', workHours: 9, laborCount: 2 },
      { date: '2025-09-10', site: '안산시청 신축공사', workHours: 8, laborCount: 1 },
      { date: '2025-09-11', site: '삼성전자 평택캠퍼스 P3', workHours: 8, laborCount: 1 },
      { date: '2025-09-12', site: '포항제철소 설비보수', workHours: 10, laborCount: 3 },
      { date: '2025-09-13', site: '삼성전자 평택캠퍼스 P3', workHours: 8, laborCount: 1 },
      { date: '2025-09-14', site: '안산시청 신축공사', workHours: 9, laborCount: 2 },
      { date: '2025-09-15', site: '삼성전자 평택캠퍼스 P3', workHours: 8, laborCount: 1 },
      { date: '2025-09-16', site: '포항제철소 설비보수', workHours: 9.5, laborCount: 2 },
      { date: '2025-09-17', site: '안산시청 신축공사', workHours: 8, laborCount: 1 },
    ]

    // 선택된 년월의 데이터만 필터링
    const monthlyData = attendanceData.filter(record => {
      const recordDate = new Date(record.date)
      return (
        recordDate.getFullYear() === selectedYear && recordDate.getMonth() + 1 === selectedMonth
      )
    })

    // 총 근무일수, 정규시간, 연장시간 계산
    const totalWorkDays = monthlyData.length
    let totalRegularHours = 0
    let totalOvertimeHours = 0

    monthlyData.forEach(record => {
      const regularHours = Math.min(record.workHours, 8)
      const overtimeHours = Math.max(0, record.workHours - 8)

      totalRegularHours += regularHours
      totalOvertimeHours += overtimeHours
    })

    return {
      totalWorkDays,
      totalRegularHours: Math.round(totalRegularHours * 10) / 10,
      totalOvertimeHours: Math.round(totalOvertimeHours * 10) / 10,
      totalHours: Math.round((totalRegularHours + totalOvertimeHours) * 10) / 10,
    }
  }

  const workData = getActualWorkData()

  const calculateSalary = () => {
    const hourlyWage = parseFloat(hourlyRate) || 0
    const overtimeWage = parseFloat(overtimeRate) || hourlyWage * 1.5
    const monthlyAllowances = parseFloat(allowances) || 0

    // 급여 계산
    const regularPay = workData.totalRegularHours * hourlyWage
    const overtimePay = workData.totalOvertimeHours * overtimeWage
    const baseSalary = regularPay + overtimePay + monthlyAllowances

    // 공제 계산 (4대보험 및 소득세)
    const nationalPension = Math.round(baseSalary * 0.045) // 국민연금 4.5%
    const healthInsurance = Math.round(baseSalary * 0.0343) // 건강보험 3.43%
    const employmentInsurance = Math.round(baseSalary * 0.009) // 고용보험 0.9%
    const incomeTax = Math.round(baseSalary * 0.08) // 소득세 8% (간소화)

    const totalDeductions = nationalPension + healthInsurance + employmentInsurance + incomeTax
    const netSalary = baseSalary - totalDeductions

    return {
      regularPay,
      overtimePay,
      allowances: monthlyAllowances,
      baseSalary,
      nationalPension,
      healthInsurance,
      employmentInsurance,
      incomeTax,
      totalDeductions,
      netSalary,
    }
  }

  const salaryBreakdown = calculateSalary()

  return (
    <div className="space-y-4">
      {/* 기간 선택 및 자동 계산 설정 */}
      <Card className="brand-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="t-h3 text-gray-800">급여 계산 설정</h3>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoCalculate}
                onChange={e => setAutoCalculate(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-600">자동 연동</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block t-body font-medium text-gray-700 mb-1">연도</label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {[2023, 2024, 2025].map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block t-body font-medium text-gray-700 mb-1">월</label>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>
                    {month}월
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 근무 현황 요약 */}
      <Card className="brand-card">
        <CardContent className="p-4">
          <h3 className="t-h3 mb-3 text-gray-800">
            {selectedYear}년 {selectedMonth}월 근무 현황
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 brand-stat-blue rounded-lg">
              <div className="t-h2 font-bold">{workData.totalWorkDays}</div>
              <div className="t-cap text-gray-600">총 근무일</div>
            </div>
            <div className="text-center p-3 brand-stat-primary rounded-lg">
              <div className="t-h2 font-bold">{workData.totalHours}</div>
              <div className="t-cap text-gray-600">총 근무시간</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <Row justify="between">
              <span className="text-sm text-gray-600">정규시간</span>
              <span className="text-sm font-medium">{workData.totalRegularHours}시간</span>
            </Row>
            <Row justify="between">
              <span className="text-sm text-gray-600">연장시간</span>
              <span className="text-sm font-medium text-orange-600">
                {workData.totalOvertimeHours}시간
              </span>
            </Row>
          </div>
        </CardContent>
      </Card>

      {/* 급여 입력 섹션 */}
      <Card className="brand-card">
        <CardContent className="p-4">
          <h3 className="t-h3 mb-3 text-gray-800">급여 설정</h3>
          <Stack gap="md">
            <div>
              <label className="block t-body font-medium text-gray-700 mb-1">기본 시급</label>
              <input
                type="number"
                value={hourlyRate}
                onChange={e => setHourlyRate(e.target.value)}
                placeholder="15,000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">원 / 시간</p>
            </div>
            <div>
              <label className="block t-body font-medium text-gray-700 mb-1">연장근무 시급</label>
              <input
                type="number"
                value={overtimeRate}
                onChange={e => setOvertimeRate(e.target.value)}
                placeholder="22,500"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">일반적으로 기본 시급의 1.5배</p>
            </div>
            <div>
              <label className="block t-body font-medium text-gray-700 mb-1">제수당 (월)</label>
              <input
                type="number"
                value={allowances}
                onChange={e => setAllowances(e.target.value)}
                placeholder="150,000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">식대, 교통비, 위험수당 등</p>
            </div>
          </Stack>
        </CardContent>
      </Card>

      {/* 급여 상세 정보 */}
      <Card className="brand-card">
        <CardContent className="p-4">
          <h3 className="t-h3 mb-3 text-gray-800">급여 상세 내역</h3>

          {/* 지급 항목 */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">💰 지급 항목</h4>
            <Stack gap="sm">
              <Row justify="between">
                <span className="t-body text-gray-600">
                  정규근무 ({workData.totalRegularHours}h)
                </span>
                <span className="t-body font-medium">
                  {salaryBreakdown.regularPay.toLocaleString()}원
                </span>
              </Row>
              <Row justify="between">
                <span className="t-body text-gray-600">
                  연장근무 ({workData.totalOvertimeHours}h)
                </span>
                <span className="t-body font-medium text-orange-600">
                  {salaryBreakdown.overtimePay.toLocaleString()}원
                </span>
              </Row>
              <Row justify="between">
                <span className="t-body text-gray-600">제수당</span>
                <span className="t-body font-medium">
                  {salaryBreakdown.allowances.toLocaleString()}원
                </span>
              </Row>
              <Row justify="between" className="pt-2 border-t border-gray-100">
                <span className="t-body font-medium text-gray-800">지급 총액</span>
                <span className="t-body font-bold text-green-600">
                  {salaryBreakdown.baseSalary.toLocaleString()}원
                </span>
              </Row>
            </Stack>
          </div>

          {/* 공제 항목 */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">📉 공제 항목</h4>
            <Stack gap="sm">
              <Row justify="between">
                <span className="t-body text-gray-600">국민연금 (4.5%)</span>
                <span className="t-body font-medium text-red-600">
                  -{salaryBreakdown.nationalPension.toLocaleString()}원
                </span>
              </Row>
              <Row justify="between">
                <span className="t-body text-gray-600">건강보험 (3.43%)</span>
                <span className="t-body font-medium text-red-600">
                  -{salaryBreakdown.healthInsurance.toLocaleString()}원
                </span>
              </Row>
              <Row justify="between">
                <span className="t-body text-gray-600">고용보험 (0.9%)</span>
                <span className="t-body font-medium text-red-600">
                  -{salaryBreakdown.employmentInsurance.toLocaleString()}원
                </span>
              </Row>
              <Row justify="between">
                <span className="t-body text-gray-600">소득세 (8%)</span>
                <span className="t-body font-medium text-red-600">
                  -{salaryBreakdown.incomeTax.toLocaleString()}원
                </span>
              </Row>
              <Row justify="between" className="pt-2 border-t border-gray-100">
                <span className="t-body font-medium text-gray-800">공제 총액</span>
                <span className="t-body font-bold text-red-600">
                  -{salaryBreakdown.totalDeductions.toLocaleString()}원
                </span>
              </Row>
            </Stack>
          </div>

          {/* 실지급액 */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <Row justify="between">
              <span className="t-h3 font-bold text-gray-800">💳 실지급액</span>
              <span className="t-h2 font-bold text-blue-600">
                {salaryBreakdown.netSalary.toLocaleString()}원
              </span>
            </Row>
          </div>
        </CardContent>
      </Card>

      {/* 급여명세서 미리보기 */}
      <Card className="brand-card">
        <CardContent className="p-4">
          <h3 className="t-h3 mb-3 text-gray-800">급여명세서</h3>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowPayslipPreview(true)}
            >
              📄 급여명세서 미리보기
            </Button>
            <Button
              variant="primary"
              className="w-full brand-button-primary"
              onClick={() => {
                const payslipHtml = generatePayslipHTML(
                  selectedYear,
                  selectedMonth,
                  workData,
                  salaryBreakdown
                )
                downloadPayslipPDF(payslipHtml, `급여명세서_${selectedYear}년_${selectedMonth}월`)
              }}
            >
              📥 PDF 다운로드
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 급여명세서 미리보기 모달 */}
      {showPayslipPreview && (
        <PayslipPreviewModal
          year={selectedYear}
          month={selectedMonth}
          workData={workData}
          salaryBreakdown={salaryBreakdown}
          hourlyRate={parseFloat(hourlyRate)}
          overtimeRate={parseFloat(overtimeRate)}
          onClose={() => setShowPayslipPreview(false)}
        />
      )}
    </div>
  )
}

// 캘린더 뷰 컴포넌트
const CalendarView: React.FC<{
  selectedDate: Date
  onDateChange: (date: Date) => void
}> = ({ selectedDate, onDateChange }) => {
  const [currentDate, setCurrentDate] = useState(selectedDate)

  // 이전/다음 달 이동
  const handlePrevMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    setCurrentDate(newDate)
    onDateChange(newDate)
  }

  const handleNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    setCurrentDate(newDate)
    onDateChange(newDate)
  }

  // 근무 데이터 (WorkOutputTab과 동일한 데이터 사용)
  const getWorkDataForDate = (year: number, month: number, day: number) => {
    const monthlyAttendanceData = [
      { date: '2025-09-01', site: '삼성전자 평택캠퍼스 P3', workHours: 8, laborCount: 1 },
      { date: '2025-09-02', site: '안산시청 신축공사', workHours: 9, laborCount: 2 },
      { date: '2025-09-03', site: '삼성전자 평택캠퍼스 P3', workHours: 8, laborCount: 1 },
      { date: '2025-09-04', site: '포항제철소 설비보수', workHours: 10, laborCount: 3 },
      { date: '2025-09-05', site: '안산시청 신축공사', workHours: 8, laborCount: 1 },
      { date: '2025-09-06', site: '삼성전자 평택캠퍼스 P3', workHours: 8.5, laborCount: 1 },
      { date: '2025-09-09', site: '포항제철소 설비보수', workHours: 9, laborCount: 2 },
      { date: '2025-09-10', site: '안산시청 신축공사', workHours: 8, laborCount: 1 },
      { date: '2025-09-11', site: '삼성전자 평택캠퍼스 P3', workHours: 8, laborCount: 1 },
      { date: '2025-09-12', site: '포항제철소 설비보수', workHours: 10, laborCount: 3 },
      { date: '2025-09-13', site: '삼성전자 평택캠퍼스 P3', workHours: 8, laborCount: 1 },
      { date: '2025-09-14', site: '안산시청 신축공사', workHours: 9, laborCount: 2 },
      { date: '2025-09-15', site: '삼성전자 평택캠퍼스 P3', workHours: 8, laborCount: 1 },
      { date: '2025-09-16', site: '포항제철소 설비보수', workHours: 9.5, laborCount: 2 },
      { date: '2025-09-17', site: '안산시청 신축공사', workHours: 8, laborCount: 1 },
    ]

    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return monthlyAttendanceData.find(record => record.date === dateString)
  }

  // 달력 데이터 생성
  const generateCalendarData = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const firstDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const prevMonth = new Date(year, month, 0)
    const prevMonthDays = prevMonth.getDate()

    const calendar = []

    // 이전 달 날짜들
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      calendar.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        isToday: false,
        hasWork: false,
        workHours: 0,
      })
    }

    // 현재 달 날짜들
    const today = new Date()
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday =
        year === today.getFullYear() && month === today.getMonth() && day === today.getDate()

      // 실제 근무 데이터 확인
      const workData = getWorkDataForDate(year, month, day)
      const hasWork = !!workData
      const workHours = workData?.workHours || 0

      calendar.push({
        day,
        isCurrentMonth: true,
        isToday,
        hasWork,
        workHours,
      })
    }

    // 다음 달 날짜들 (35개 또는 42개로 맞추기)
    const remainingCells = 42 - calendar.length
    for (let day = 1; day <= remainingCells; day++) {
      calendar.push({
        day,
        isCurrentMonth: false,
        isToday: false,
        hasWork: false,
        workHours: 0,
      })
    }

    return calendar
  }

  const calendarData = generateCalendarData()
  const weekDays = ['일', '월', '화', '수', '목', '금', '토']

  return (
    <Card className="brand-card">
      <CardContent className="p-0">
        {/* 달력 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-50"
          >
            ←
          </Button>
          <h3 className="cal-title text-lg font-bold text-gray-800">
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-50"
          >
            →
          </Button>
        </div>

        {/* 요일 헤더 */}
        <div className="cal-grid pt-0 pb-2 grid grid-cols-7 gap-2 p-3">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={`dow text-center font-bold text-sm py-2 ${
                index === 0 ? 'text-red-500' : 'text-gray-600'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="cal-grid grid grid-cols-7 gap-2 pb-4 px-3">
          {calendarData.map((dateInfo, index) => (
            <div
              key={index}
              className={`cell min-h-[70px] border rounded-lg p-1 flex flex-col items-start justify-start text-left relative ${
                dateInfo.isCurrentMonth
                  ? 'border-gray-200 bg-white'
                  : 'border-gray-100 bg-gray-50 opacity-45'
              }`}
            >
              <div
                className={`date font-bold text-sm mb-1 ${
                  dateInfo.isToday
                    ? 'text-blue-600'
                    : index % 7 === 0 && dateInfo.isCurrentMonth
                      ? 'text-red-500'
                      : dateInfo.isCurrentMonth
                        ? 'text-gray-800'
                        : 'text-gray-400'
                }`}
              >
                {dateInfo.day}
              </div>

              {/* 근무 표시 */}
              {dateInfo.hasWork && dateInfo.isCurrentMonth && (
                <div className="absolute bottom-1 left-1 right-1">
                  <div className="bg-blue-100 text-blue-800 text-xs px-1 py-0.5 rounded text-center">
                    {dateInfo.workHours}h
                  </div>
                </div>
              )}

              {/* 오늘 표시 */}
              {dateInfo.isToday && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-blue-600 rounded-full"></div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// 리스트 뷰 컴포넌트
const ListView: React.FC<{
  selectedDate: Date
}> = ({ selectedDate }) => {
  // 근무 데이터 (다른 컴포넌트와 동일한 데이터 사용)
  const getMonthlyAttendanceData = () => {
    const currentYear = selectedDate.getFullYear()
    const currentMonth = selectedDate.getMonth() + 1

    const fullAttendanceData = [
      { date: '2025-09-01', site: '삼성전자 평택캠퍼스 P3', workHours: 8, laborCount: 1 },
      { date: '2025-09-02', site: '안산시청 신축공사', workHours: 9, laborCount: 2 },
      { date: '2025-09-03', site: '삼성전자 평택캠퍼스 P3', workHours: 8, laborCount: 1 },
      { date: '2025-09-04', site: '포항제철소 설비보수', workHours: 10, laborCount: 3 },
      { date: '2025-09-05', site: '안산시청 신축공사', workHours: 8, laborCount: 1 },
      { date: '2025-09-06', site: '삼성전자 평택캠퍼스 P3', workHours: 8.5, laborCount: 1 },
      { date: '2025-09-09', site: '포항제철소 설비보수', workHours: 9, laborCount: 2 },
      { date: '2025-09-10', site: '안산시청 신축공사', workHours: 8, laborCount: 1 },
      { date: '2025-09-11', site: '삼성전자 평택캠퍼스 P3', workHours: 8, laborCount: 1 },
      { date: '2025-09-12', site: '포항제철소 설비보수', workHours: 10, laborCount: 3 },
      { date: '2025-09-13', site: '삼성전자 평택캠퍼스 P3', workHours: 8, laborCount: 1 },
      { date: '2025-09-14', site: '안산시청 신축공사', workHours: 9, laborCount: 2 },
      { date: '2025-09-15', site: '삼성전자 평택캠퍼스 P3', workHours: 8, laborCount: 1 },
      { date: '2025-09-16', site: '포항제철소 설비보수', workHours: 9.5, laborCount: 2 },
      { date: '2025-09-17', site: '안산시청 신축공사', workHours: 8, laborCount: 1 },
    ]

    // 해당 월의 데이터만 필터링하고 상태 추가
    return fullAttendanceData
      .filter(record => {
        const recordDate = new Date(record.date)
        return (
          recordDate.getFullYear() === currentYear && recordDate.getMonth() + 1 === currentMonth
        )
      })
      .map(record => ({
        ...record,
        status:
          record.workHours >= 10 ? 'overtime' : record.workHours < 8 ? 'partial' : 'completed',
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // 최신순 정렬
  }

  const mockAttendanceData = getMonthlyAttendanceData()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'overtime':
        return 'bg-orange-100 text-orange-800'
      case 'partial':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '정상'
      case 'overtime':
        return '연장'
      case 'partial':
        return '부분'
      default:
        return '기타'
    }
  }

  return (
    <div className="space-y-3">
      {mockAttendanceData.map((record, index) => (
        <Card key={index} className="brand-card">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="t-body font-medium text-gray-800">
                    {new Date(record.date).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      weekday: 'short',
                    })}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}
                  >
                    {getStatusText(record.status)}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="t-body text-gray-600">📍 {record.site}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>⏰ {record.workHours}시간</span>
                    <span>👷 {record.laborCount}명</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="t-h3 font-bold text-blue-600">{record.workHours}h</div>
                <div className="text-xs text-gray-500">공수: {record.laborCount}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {mockAttendanceData.length === 0 && (
        <Card className="brand-card">
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 mb-2">📋</div>
            <p className="text-gray-500">해당 월의 출근 기록이 없습니다.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// 급여명세서 미리보기 모달 컴포넌트
interface PayslipPreviewModalProps {
  year: number
  month: number
  workData: {
    totalWorkDays: number
    totalRegularHours: number
    totalOvertimeHours: number
    totalHours: number
  }
  salaryBreakdown: {
    regularPay: number
    overtimePay: number
    allowances: number
    baseSalary: number
    nationalPension: number
    healthInsurance: number
    employmentInsurance: number
    incomeTax: number
    totalDeductions: number
    netSalary: number
  }
  hourlyRate: number
  overtimeRate: number
  onClose: () => void
}

const PayslipPreviewModal: React.FC<PayslipPreviewModalProps> = ({
  year,
  month,
  workData,
  salaryBreakdown,
  hourlyRate,
  overtimeRate,
  onClose,
}) => {
  const handlePrint = () => {
    const payslipHtml = generatePayslipHTML(
      year,
      month,
      workData,
      salaryBreakdown,
      hourlyRate,
      overtimeRate
    )
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(payslipHtml)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleDownload = () => {
    const payslipHtml = generatePayslipHTML(
      year,
      month,
      workData,
      salaryBreakdown,
      hourlyRate,
      overtimeRate
    )
    downloadPayslipPDF(payslipHtml, `급여명세서_${year}년_${month}월`)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">급여명세서 미리보기</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Payslip preview content */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
              <div
                className="bg-white text-black text-sm"
                dangerouslySetInnerHTML={{
                  __html: generatePayslipHTML(
                    year,
                    month,
                    workData,
                    salaryBreakdown,
                    hourlyRate,
                    overtimeRate,
                    true
                  ),
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse space-y-2 sm:space-y-0 sm:space-x-2 sm:space-x-reverse">
            <Button variant="primary" className="brand-button-primary" onClick={handlePrint}>
              🖨️ 인쇄하기
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              📥 PDF 저장
            </Button>
            <Button variant="gray" onClick={onClose}>
              닫기
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 급여명세서 HTML 생성 함수
const generatePayslipHTML = (
  year: number,
  month: number,
  workData: any,
  salaryBreakdown: any,
  hourlyRate: number = 15000,
  overtimeRate: number = 22500,
  isPreview: boolean = false
): string => {
  const currentDate = new Date().toLocaleDateString('ko-KR')
  const paymentDate = new Date(year, month, 0).toLocaleDateString('ko-KR') // 해당 월의 마지막 날

  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>급여명세서 - ${year}년 ${month}월</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body {
                font-family: 'Malgun Gothic', '맑은 고딕', Arial, sans-serif;
                line-height: 1.4;
                color: #333;
                background: white;
                ${isPreview ? 'transform: scale(0.8); transform-origin: top left;' : ''}
            }
            
            .payslip-container {
                max-width: 800px;
                margin: 20px auto;
                background: white;
                border: 2px solid #333;
                padding: 30px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            
            .header {
                text-align: center;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
                margin-bottom: 25px;
            }
            
            .company-name {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 5px;
                color: #2563eb;
            }
            
            .document-title {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            
            .period-info {
                font-size: 16px;
                color: #666;
            }
            
            .employee-info {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 25px;
                padding: 15px;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
            }
            
            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
            }
            
            .info-label {
                font-weight: bold;
                color: #374151;
                min-width: 100px;
            }
            
            .info-value {
                color: #111827;
            }
            
            .salary-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 25px;
                border: 2px solid #333;
            }
            
            .salary-table th,
            .salary-table td {
                border: 1px solid #333;
                padding: 12px 8px;
                text-align: left;
            }
            
            .salary-table th {
                background-color: #f1f5f9;
                font-weight: bold;
                text-align: center;
                font-size: 14px;
            }
            
            .salary-table .section-header {
                background-color: #e2e8f0;
                font-weight: bold;
                text-align: center;
                font-size: 15px;
            }
            
            .amount {
                text-align: right;
                font-family: 'Courier New', monospace;
                font-weight: bold;
            }
            
            .amount.positive {
                color: #059669;
            }
            
            .amount.negative {
                color: #dc2626;
            }
            
            .total-row {
                background-color: #fef3c7;
                font-weight: bold;
            }
            
            .net-salary-row {
                background-color: #dbeafe;
                font-size: 16px;
                font-weight: bold;
            }
            
            .summary-section {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 15px;
                margin-bottom: 25px;
            }
            
            .summary-card {
                text-align: center;
                padding: 15px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                background: #f9fafb;
            }
            
            .summary-label {
                font-size: 12px;
                color: #6b7280;
                margin-bottom: 5px;
            }
            
            .summary-value {
                font-size: 18px;
                font-weight: bold;
                color: #111827;
            }
            
            .footer {
                border-top: 1px solid #d1d5db;
                padding-top: 20px;
                text-align: center;
                color: #6b7280;
                font-size: 12px;
            }
            
            .signature-section {
                display: flex;
                justify-content: space-between;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #d1d5db;
            }
            
            .signature-box {
                text-align: center;
                padding: 20px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                min-width: 200px;
            }
            
            .signature-title {
                font-weight: bold;
                margin-bottom: 40px;
                color: #374151;
            }
            
            .signature-line {
                border-top: 1px solid #333;
                margin-top: 20px;
                padding-top: 10px;
                font-size: 12px;
                color: #6b7280;
            }
            
            @media print {
                body { 
                    margin: 0;
                    transform: none !important;
                }
                .payslip-container { 
                    margin: 0; 
                    box-shadow: none; 
                    border: 2px solid #333;
                }
            }
        </style>
    </head>
    <body>
        <div class="payslip-container">
            <!-- Header -->
            <div class="header">
                <div class="company-name">인옵앤씨 (INOPNC)</div>
                <div class="document-title">급 여 명 세 서</div>
                <div class="period-info">${year}년 ${month}월 급여</div>
            </div>
            
            <!-- Employee Info -->
            <div class="employee-info">
                <div>
                    <div class="info-row">
                        <span class="info-label">성명:</span>
                        <span class="info-value">김현장</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">직급:</span>
                        <span class="info-value">현장관리자</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">부서:</span>
                        <span class="info-value">현장관리팀</span>
                    </div>
                </div>
                <div>
                    <div class="info-row">
                        <span class="info-label">급여지급일:</span>
                        <span class="info-value">${paymentDate}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">근무일수:</span>
                        <span class="info-value">${workData.totalWorkDays}일</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">총근무시간:</span>
                        <span class="info-value">${workData.totalHours}시간</span>
                    </div>
                </div>
            </div>
            
            <!-- Work Summary -->
            <div class="summary-section">
                <div class="summary-card">
                    <div class="summary-label">정규시간</div>
                    <div class="summary-value">${workData.totalRegularHours}h</div>
                </div>
                <div class="summary-card">
                    <div class="summary-label">연장시간</div>
                    <div class="summary-value">${workData.totalOvertimeHours}h</div>
                </div>
                <div class="summary-card">
                    <div class="summary-label">총 근무일</div>
                    <div class="summary-value">${workData.totalWorkDays}일</div>
                </div>
            </div>
            
            <!-- Salary Breakdown Table -->
            <table class="salary-table">
                <thead>
                    <tr>
                        <th style="width: 50%">항목</th>
                        <th style="width: 25%">시간/일수</th>
                        <th style="width: 25%">금액</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- 지급 항목 -->
                    <tr class="section-header">
                        <td colspan="3">💰 지급 항목</td>
                    </tr>
                    <tr>
                        <td>기본급 (정규시간)</td>
                        <td class="amount">${workData.totalRegularHours}시간</td>
                        <td class="amount positive">${salaryBreakdown.regularPay.toLocaleString()}원</td>
                    </tr>
                    <tr>
                        <td>연장근무수당 (1.5배)</td>
                        <td class="amount">${workData.totalOvertimeHours}시간</td>
                        <td class="amount positive">${salaryBreakdown.overtimePay.toLocaleString()}원</td>
                    </tr>
                    <tr>
                        <td>제수당 (식대, 교통비, 위험수당)</td>
                        <td class="amount">-</td>
                        <td class="amount positive">${salaryBreakdown.allowances.toLocaleString()}원</td>
                    </tr>
                    <tr class="total-row">
                        <td><strong>지급 총액</strong></td>
                        <td class="amount">-</td>
                        <td class="amount positive"><strong>${salaryBreakdown.baseSalary.toLocaleString()}원</strong></td>
                    </tr>
                    
                    <!-- 공제 항목 -->
                    <tr class="section-header">
                        <td colspan="3">📉 공제 항목</td>
                    </tr>
                    <tr>
                        <td>국민연금 (4.5%)</td>
                        <td class="amount">-</td>
                        <td class="amount negative">-${salaryBreakdown.nationalPension.toLocaleString()}원</td>
                    </tr>
                    <tr>
                        <td>건강보험 (3.43%)</td>
                        <td class="amount">-</td>
                        <td class="amount negative">-${salaryBreakdown.healthInsurance.toLocaleString()}원</td>
                    </tr>
                    <tr>
                        <td>고용보험 (0.9%)</td>
                        <td class="amount">-</td>
                        <td class="amount negative">-${salaryBreakdown.employmentInsurance.toLocaleString()}원</td>
                    </tr>
                    <tr>
                        <td>소득세 (8%)</td>
                        <td class="amount">-</td>
                        <td class="amount negative">-${salaryBreakdown.incomeTax.toLocaleString()}원</td>
                    </tr>
                    <tr class="total-row">
                        <td><strong>공제 총액</strong></td>
                        <td class="amount">-</td>
                        <td class="amount negative"><strong>-${salaryBreakdown.totalDeductions.toLocaleString()}원</strong></td>
                    </tr>
                    
                    <!-- 실지급액 -->
                    <tr class="net-salary-row">
                        <td><strong>💳 실지급액</strong></td>
                        <td class="amount">-</td>
                        <td class="amount"><strong>${salaryBreakdown.netSalary.toLocaleString()}원</strong></td>
                    </tr>
                </tbody>
            </table>
            
            <!-- Signature Section -->
            <div class="signature-section">
                <div class="signature-box">
                    <div class="signature-title">지급자</div>
                    <div class="signature-line">인옵앤씨 대표이사</div>
                </div>
                <div class="signature-box">
                    <div class="signature-title">수령자</div>
                    <div class="signature-line">김현장 (인)</div>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <p>본 급여명세서는 ${currentDate}에 작성되었습니다.</p>
                <p>문의사항이 있으시면 인사팀(02-0000-0000)으로 연락주시기 바랍니다.</p>
            </div>
        </div>
    </body>
    </html>
  `
}

// PDF 다운로드 함수
const downloadPayslipPDF = (htmlContent: string, filename: string) => {
  // 새 창에서 HTML을 열고 인쇄 대화상자 실행
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()

    // 잠시 후 인쇄 대화상자 열기
    setTimeout(() => {
      printWindow.print()

      // 인쇄 후 창 닫기 (사용자가 취소할 수 있도록 약간의 지연)
      setTimeout(() => {
        printWindow.close()
      }, 1000)
    }, 500)
  }
}
