'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { MobileLayout as MobileLayoutShell } from '@/modules/mobile/components/layout/MobileLayout'
import { WorkLogCard } from '@/modules/mobile/components/work-log/WorkLogCard'
import { WorkLogModal } from '@/modules/mobile/components/work-log/WorkLogModal'
import { WorkLogSearch } from '@/modules/mobile/components/work-log/WorkLogSearch'
import { useWorkLogs } from '@/modules/mobile/hooks/use-work-logs'
import { WorkLog, WorkLogTabStatus } from '@/modules/mobile/types/work-log.types'
import { UncompletedBottomSheet } from '@/modules/mobile/components/work-log/UncompletedBottomSheet'
import { TabSystem, TabPanel } from '@/modules/mobile/components/ui/TabSystem'
import { dismissAlert } from '@/modules/mobile/utils/work-log-utils'
import { Plus, FileText, CheckCircle } from 'lucide-react'

interface SummaryItem {
  label: string
  value: string
  status: 'completed' | 'missing'
  description: string
}

export const WorkLogHomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<WorkLogTabStatus>('draft')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWorkLog, setEditingWorkLog] = useState<WorkLog | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal')

  const {
    draftWorkLogs,
    approvedWorkLogs,
    uncompletedByMonth,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    createWorkLog,
    updateWorkLog,
    deleteWorkLog,
    approveWorkLog,
  } = useWorkLogs()

  // 폰트 크기 초기화 및 토글
  useEffect(() => {
    const savedFontSize =
      (localStorage.getItem('inopnc_font_size') as 'normal' | 'large') || 'normal'
    setFontSize(savedFontSize)

    const mainContainer = document.querySelector('main.container')
    if (mainContainer) {
      mainContainer.classList.remove('fs-100', 'fs-150')
      mainContainer.classList.add(savedFontSize === 'normal' ? 'fs-100' : 'fs-150')
    }
  }, [])

  const toggleFontSize = useCallback(() => {
    const newSize = fontSize === 'normal' ? 'large' : 'normal'
    setFontSize(newSize)

    const mainContainer = document.querySelector('main.container')
    if (mainContainer) {
      mainContainer.classList.remove('fs-100', 'fs-150')
      mainContainer.classList.add(newSize === 'normal' ? 'fs-100' : 'fs-150')
    }

    localStorage.setItem('inopnc_font_size', newSize)
  }, [fontSize])

  const draftCount = draftWorkLogs.length
  const approvedCount = approvedWorkLogs.length
  const npcMissingCount = useMemo(
    () => draftWorkLogs.filter(log => !log.npcUsage || !log.npcUsage.amount).length,
    [draftWorkLogs]
  )

  const monthLabel = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1
    return `${year}년 ${month.toString().padStart(2, '0')}월`
  }, [currentDate])

  const [visibleUncompleted, setVisibleUncompleted] = useState(uncompletedByMonth)
  useEffect(() => {
    setVisibleUncompleted(uncompletedByMonth)
  }, [uncompletedByMonth])

  const totalUncompletedCount = useMemo(
    () => visibleUncompleted.reduce((sum, item) => sum + item.count, 0),
    [visibleUncompleted]
  )

  const [isUncompletedSheetOpen, setUncompletedSheetOpen] = useState(false)
  useEffect(() => {
    setUncompletedSheetOpen(visibleUncompleted.length > 0)
  }, [visibleUncompleted])

  const handleChangeMonth = useCallback((direction: number) => {
    setCurrentDate(prev => {
      const next = new Date(prev)
      next.setMonth(prev.getMonth() + direction)
      return next
    })
  }, [])

  const handleDismissMonth = useCallback((month: string) => {
    dismissAlert(month)
    setVisibleUncompleted(prev => prev.filter(item => item.month !== month))
  }, [])

  const handleNavigateToMonth = useCallback((month: string) => {
    setActiveTab('draft')
    const [year, monthStr] = month.split('-')
    setCurrentDate(new Date(Number(year), Number(monthStr) - 1, 1))
    setUncompletedSheetOpen(false)
  }, [])

  const summaryItems: SummaryItem[] = useMemo(
    () => [
      {
        label: '임시저장',
        value: `${draftCount}건`,
        status: draftCount > 0 ? 'completed' : 'missing',
        description:
          draftCount > 0 ? '작성 중인 작업일지를 검토하세요.' : '임시저장된 작업일지가 없습니다.',
      },
      {
        label: '작성완료',
        value: `${approvedCount}건`,
        status: approvedCount > 0 ? 'completed' : 'missing',
        description:
          approvedCount > 0
            ? '최근 완료된 작업일지를 확인하세요.'
            : '아직 제출된 작업일지가 없습니다.',
      },
      {
        label: 'NPC-1000 입력',
        value:
          npcMissingCount > 0 ? `${npcMissingCount}건 미입력` : '모든 임시저장에 입력되었습니다.',
        status: npcMissingCount > 0 ? 'missing' : 'completed',
        description:
          npcMissingCount > 0
            ? '자재 사용량이 입력되지 않은 작업일지가 있습니다.'
            : '자재 사용량이 모두 입력되었습니다.',
      },
      {
        label: '미작성 알림',
        value: totalUncompletedCount > 0 ? `${totalUncompletedCount}건` : '정상',
        status: totalUncompletedCount > 0 ? 'missing' : 'completed',
        description:
          totalUncompletedCount > 0
            ? '월별 미작성 작업일지를 확인해 주세요.'
            : '미작성 작업일지가 없습니다.',
      },
    ],
    [draftCount, approvedCount, npcMissingCount, totalUncompletedCount]
  )

  const [monthlyStats, setMonthlyStats] = useState({
    totalWorkDays: 0,
    totalHours: 0,
    averageProgress: 0,
    completedTasks: 0,
  })

  useEffect(() => {
    if (!draftWorkLogs.length) {
      setMonthlyStats({ totalWorkDays: 0, totalHours: 0, averageProgress: 0, completedTasks: 0 })
      return
    }

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const monthlyWorkLogs = draftWorkLogs.filter(log => {
      const logDate = new Date(log.date)
      return logDate.getFullYear() === year && logDate.getMonth() === month
    })

    const totalWorkDays = monthlyWorkLogs.length
    const totalHours = monthlyWorkLogs.reduce((sum, log) => sum + (log.totalHours || 0), 0)
    const averageProgress = monthlyWorkLogs.length
      ? Math.round(
          monthlyWorkLogs.reduce((sum, log) => sum + (log.progress || 0), 0) /
            monthlyWorkLogs.length
        )
      : 0
    const completedTasks = monthlyWorkLogs.filter(log => log.progress >= 100).length

    setMonthlyStats({ totalWorkDays, totalHours, averageProgress, completedTasks })
  }, [draftWorkLogs, currentDate])

  const handleCreateWorkLog = useCallback(() => {
    setEditingWorkLog(null)
    setModalMode('create')
    setIsModalOpen(true)
  }, [])

  const handleEditWorkLog = useCallback((workLog: WorkLog) => {
    setEditingWorkLog(workLog)
    setModalMode('edit')
    setIsModalOpen(true)
  }, [])

  const handleViewWorkLog = useCallback((workLog: WorkLog) => {
    setEditingWorkLog(workLog)
    setModalMode('view')
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setEditingWorkLog(null)
  }, [])

  const handleSaveWorkLog = useCallback(
    async (formData: Partial<WorkLog>) => {
      const attachments =
        formData.attachments ||
        ({ photos: [], drawings: [], confirmations: [] } as WorkLog['attachments'])

      const payload = {
        date: formData.date!,
        siteId: formData.siteId!,
        siteName: formData.siteName || '',
        memberTypes: formData.memberTypes || [],
        workProcesses: formData.workProcesses || [],
        workTypes: formData.workTypes || [],
        location: formData.location!,
        workers: formData.workers || [],
        npcUsage: formData.npcUsage,
        progress: formData.progress ?? 0,
        notes: formData.notes,
        attachments,
        status: formData.status,
      }

      try {
        if (editingWorkLog) {
          await updateWorkLog(editingWorkLog.id, payload)

          if (payload.status === 'approved') {
            await approveWorkLog(editingWorkLog.id)
          }
        } else {
          const createdWorkLog = await createWorkLog(payload)

          if (payload.status === 'approved' && createdWorkLog.status !== 'approved') {
            await approveWorkLog(createdWorkLog.id)
          }
        }
      } catch (err) {
        console.error('작업일지 저장 실패:', err)
        throw err
      }
    },
    [createWorkLog, updateWorkLog, approveWorkLog, editingWorkLog]
  )

  const handleSubmitWorkLog = useCallback(
    async (workLogId: string) => {
      try {
        await approveWorkLog(workLogId)
      } catch (err) {
        console.error('작업일지 제출 실패:', err)
      }
    },
    [approveWorkLog]
  )

  const handleDeleteWorkLog = useCallback(
    async (workLogId: string) => {
      try {
        await deleteWorkLog(workLogId)
      } catch (err) {
        console.error('작업일지 삭제 실패:', err)
      }
    },
    [deleteWorkLog]
  )

  const renderWorkLogList = (logs: WorkLog[], tab: WorkLogTabStatus) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12 text-sm text-[#667085]">
          작업일지를 불러오는 중...
        </div>
      )
    }

    if (error) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )
    }

    if (logs.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f0f4ff] text-2xl">
            📄
          </div>
          <p className="text-base font-semibold text-[#1A254F]">
            {tab === 'draft'
              ? '임시저장된 작업일지가 없습니다.'
              : '작성완료된 작업일지가 없습니다.'}
          </p>
          <p className="mt-2 text-sm text-[#667085]">
            {tab === 'draft'
              ? '새로운 작업일지를 작성해보세요.'
              : '임시저장을 작성완료로 전환해보세요.'}
          </p>
        </div>
      )
    }

    return logs.map(workLog => (
      <WorkLogCard
        key={workLog.id}
        workLog={workLog}
        onEdit={tab === 'draft' ? () => handleEditWorkLog(workLog) : undefined}
        onSubmit={tab === 'draft' ? () => handleSubmitWorkLog(workLog.id) : undefined}
        onDelete={tab === 'draft' ? () => handleDeleteWorkLog(workLog.id) : undefined}
        onView={() => handleViewWorkLog(workLog)}
      />
    ))
  }

  return (
    <MobileLayoutShell>
      <div className="worklog-page">
        <style jsx global>{`
          :root {
            --brand: #1a254f;
            --num: #0068fe;
            --bg: #f5f7fb;
            --card: #ffffff;
            --text: #101828;
            --muted: #667085;
            --border: #e0e0e0;
            --shadow: 0 6px 20px rgba(16, 24, 40, 0.06);
          }

          .dark {
            --bg: #0f172a;
            --card: #1e293b;
            --text: #f1f5f9;
            --muted: #94a3b8;
            --border: #334155;
          }

          .worklog-page {
            font-family:
              'Noto Sans KR',
              system-ui,
              -apple-system,
              sans-serif;
            background: var(--bg);
            min-height: 100vh;
          }

          .worklog-body {
            background: var(--bg);
            padding: 20px 16px;
            max-width: 100%;
          }

          @media (min-width: 640px) {
            .worklog-body {
              padding: 24px;
            }
          }

          @media (min-width: 1024px) {
            .worklog-body {
              max-width: 1200px;
              margin: 0 auto;
              padding: 32px;
            }
          }
        `}</style>

        <div className="main-container worklog-body">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#1A254F]">작업일지</h1>
              <p className="mt-1 text-sm text-[#667085]">
                현장의 작업일지를 임시저장하고 제출 상태까지 관리할 수 있습니다.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleFontSize}
              className="rounded-full border border-[#d0d5dd] px-3 py-1 text-xs font-semibold text-[#1A254F] transition-colors hover:bg-[#f4f6fb]"
            >
              {fontSize === 'normal' ? '큰글씨' : '작은글씨'}
            </button>
          </header>

          {/* Summary Section */}
          <section className="mt-4 grid gap-3 rounded-2xl border border-[#e6eaf2] bg-white p-4 shadow-[var(--shadow)] md:grid-cols-2 lg:grid-cols-4">
            {summaryItems.map(item => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#1A254F]">{item.label}</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                      item.status === 'completed'
                        ? 'bg-[#f0fdf4] text-[#16a34a]'
                        : 'bg-[#fef2f2] text-[#dc2626]'
                    }`}
                  >
                    {item.value}
                  </span>
                </div>
                <p className="text-xs text-[#667085]">{item.description}</p>
              </div>
            ))}
          </section>

          <section className="mt-4 rounded-2xl border border-[#e6eaf2] bg-white p-4 shadow-[var(--shadow)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-[#1A254F]">월간 통계</h3>
              <div className="flex items-center gap-2 text-xs text-[#667085]">
                <button
                  type="button"
                  onClick={() => handleChangeMonth(-1)}
                  className="rounded-full border border-[#d0d5dd] px-2 py-1 transition-colors hover:bg-[#f4f6fb]"
                >
                  이전
                </button>
                <span className="font-semibold text-[#1A254F]">{monthLabel}</span>
                <button
                  type="button"
                  onClick={() => handleChangeMonth(1)}
                  className="rounded-full border border-[#d0d5dd] px-2 py-1 transition-colors hover:bg-[#f4f6fb]"
                >
                  다음
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-[#f8f9fb] p-3">
                <p className="text-xs text-[#667085]">출근일수</p>
                <p className="mt-1 text-lg font-semibold text-[#1A254F]">
                  {monthlyStats.totalWorkDays}일
                </p>
              </div>
              <div className="rounded-xl bg-[#f8f9fb] p-3">
                <p className="text-xs text-[#667085]">총 공수</p>
                <p className="mt-1 text-lg font-semibold text-[#1A254F]">
                  {monthlyStats.totalHours}시간
                </p>
              </div>
              <div className="rounded-xl bg-[#f8f9fb] p-3">
                <p className="text-xs text-[#667085]">평균 진행률</p>
                <p className="mt-1 text-lg font-semibold text-[#1A254F]">
                  {monthlyStats.averageProgress}%
                </p>
              </div>
              <div className="rounded-xl bg-[#f8f9fb] p-3">
                <p className="text-xs text-[#667085]">완료 작업</p>
                <p className="mt-1 text-lg font-semibold text-[#1A254F]">
                  {monthlyStats.completedTasks}건
                </p>
              </div>
            </div>
          </section>

          {/* Search */}
          <div className="mt-5">
            <WorkLogSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="현장명 검색"
              showCancel
            />
          </div>

          {/* Tabs */}
          <div className="mt-6">
            <TabSystem
              tabs={[
                { id: 'draft', label: '임시저장', icon: <FileText size={16} />, count: draftCount },
                {
                  id: 'approved',
                  label: '작성완료',
                  icon: <CheckCircle size={16} />,
                  count: approvedCount,
                },
              ]}
              activeTab={activeTab}
              onTabChange={tabId => setActiveTab(tabId as WorkLogTabStatus)}
              className="rounded-2xl border border-[#e6eaf2] bg-white p-3 shadow-[var(--shadow)]"
            >
              <TabPanel data-panel="draft" className="space-y-3">
                {renderWorkLogList(draftWorkLogs, 'draft')}
              </TabPanel>
              <TabPanel data-panel="approved" className="space-y-3">
                {renderWorkLogList(approvedWorkLogs, 'approved')}
              </TabPanel>
            </TabSystem>
          </div>
        </div>

        {/* Floating Action Button */}
        <button
          onClick={handleCreateWorkLog}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#0068FE] text-white shadow-lg transition-transform duration-200 hover:bg-blue-600 active:scale-95"
          aria-label="작업일지 작성"
        >
          <Plus className="h-6 w-6" />
        </button>

        {/* Modals */}
        <WorkLogModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveWorkLog}
          workLog={editingWorkLog ?? undefined}
          mode={modalMode}
        />

        {/* Uncompleted Bottom Sheet */}
        <UncompletedBottomSheet
          isOpen={isUncompletedSheetOpen}
          onClose={() => setUncompletedSheetOpen(false)}
          uncompletedByMonth={visibleUncompleted}
          onDismiss={handleDismissMonth}
          onNavigate={handleNavigateToMonth}
        />
      </div>
    </MobileLayoutShell>
  )
}

export default WorkLogHomePage
