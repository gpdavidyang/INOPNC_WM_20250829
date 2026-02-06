'use client'

import { MobileAuthGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'
import { MobileLayout } from '@/modules/mobile/components/layout/MobileLayout'
import '@/modules/mobile/styles/attendance.css'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import React from 'react'
import { AttendanceCalendarView } from '../components/attendance/AttendanceCalendarView'
import { AttendanceDetailSheet } from '../components/attendance/AttendanceDetailSheet'
import { AttendanceHeader } from '../components/attendance/AttendanceHeader'
import { SalaryTabView } from '../components/attendance/SalaryTabView'
import { BottomSheet } from '../components/ui/BottomSheet'
import { useAttendance } from '../hooks/use-attendance'

export const AttendancePage: React.FC = () => {
  return (
    <MobileAuthGuard>
      <AttendanceContent />
    </MobileAuthGuard>
  )
}

const AttendanceContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentDate,
    selectedYearMonth,
    handleYearMonthChange,
    salarySelectedYearMonth,
    handleSalaryYearMonthChange,
    loading,
    siteOptions,
    selectedSiteId,
    setSelectedSiteId,
    // allSites, // removed usage for dropdown
    // assignmentOptions, // Not used directly, using allSites
    isDetailSheetOpen,
    selectedDayISO,
    selectedDayRecords,
    isReadOnlyMode,

    // New Batch Edit Props
    editedRecords,
    handleLaborChange,
    handleBatchSubmit,
    isInputSubmitting,
    handleAddSiteNavigation,

    dayWorkLogs,
    dayWorkLogsLoading,
    dayWorkLogsError,
    handleWorkLogClick,
    apiMonthly,
    recentSalaryHistory,
    showAllSalaryHistory,
    setShowAllSalaryHistory,
    calendarDays,
    monthlyStats,
    handlePreviousMonth,
    handleNextMonth,
    statusFilter,
    setStatusFilter,
    openDetailSheet,
    closeDetailSheet,
    handleProceedWithEmptyDate,
    showEmptyDateConfirm,
    setShowEmptyDateConfirm,
  } = useAttendance()

  const generatedYearMonthOptions = React.useMemo(() => {
    const options = []
    const start = new Date(currentDate)
    start.setMonth(start.getMonth() - 6)
    for (let i = 0; i < 12; i++) {
      const d = new Date(start)
      d.setMonth(start.getMonth() + i)
      const val = format(d, 'yyyy-MM')
      options.push({ value: val, label: format(d, 'yyyy년 MM월', { locale: ko }) })
    }
    return options
  }, [currentDate])

  if (loading) {
    return (
      <MobileLayout className="bg-white">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout className="bg-[#ffffff] min-h-screen pb-[65px]">
      <div className="px-4 pt-1 pb-6 space-y-6">
        <AttendanceHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedSiteId={selectedSiteId}
          setSelectedSiteId={setSelectedSiteId}
          siteOptions={siteOptions}
          selectedYearMonth={selectedYearMonth}
          handleYearMonthChange={handleYearMonthChange}
          yearMonthOptions={generatedYearMonthOptions}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

        {activeTab === 'work' ? (
          <AttendanceCalendarView
            currentPeriodText={format(currentDate, 'yyyy년 MM월', { locale: ko })}
            handlePrevious={handlePreviousMonth}
            handleNext={handleNextMonth}
            calendarDays={calendarDays}
            onDayClick={openDetailSheet}
            monthlyStats={monthlyStats}
          />
        ) : (
          <SalaryTabView
            salarySelectedYearMonth={salarySelectedYearMonth}
            handleSalaryYearMonthChange={handleSalaryYearMonthChange}
            salaryOptions={generatedYearMonthOptions}
            apiMonthly={apiMonthly}
            recentSalaryHistory={recentSalaryHistory}
            showAllSalaryHistory={showAllSalaryHistory}
            setShowAllSalaryHistory={setShowAllSalaryHistory}
          />
        )}
      </div>

      <AttendanceDetailSheet
        isOpen={isDetailSheetOpen}
        onClose={closeDetailSheet}
        selectedDayISO={selectedDayISO}
        selectedDayRecords={selectedDayRecords}
        // Pass Batch Edit Props
        editedRecords={editedRecords}
        handleLaborChange={handleLaborChange}
        handleBatchSubmit={handleBatchSubmit}
        isInputSubmitting={isInputSubmitting}
        handleAddSiteNavigation={handleAddSiteNavigation}
        dayWorkLogs={dayWorkLogs}
        dayWorkLogsLoading={dayWorkLogsLoading}
        dayWorkLogsError={dayWorkLogsError}
        onWorkLogClick={handleWorkLogClick}
      />

      {/* Empty date confirm sheet */}
      <EmptyDateConfirmSheet
        isOpen={showEmptyDateConfirm}
        onClose={() => setShowEmptyDateConfirm(false)}
        onConfirm={handleProceedWithEmptyDate}
      />
    </MobileLayout>
  )
}

interface EmptyDateConfirmSheetProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

const EmptyDateConfirmSheet: React.FC<EmptyDateConfirmSheetProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="작업일지 작성">
      <div className="p-4 space-y-4">
        <p className="text-center text-slate-600 font-medium">
          해당 날짜에 작성된 작업일지가 없습니다.
          <br />
          새로운 작업일지를 작성하시겠습니까?
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-600 font-bold"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-12 rounded-xl bg-blue-500 text-white font-bold"
          >
            작성하기
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
