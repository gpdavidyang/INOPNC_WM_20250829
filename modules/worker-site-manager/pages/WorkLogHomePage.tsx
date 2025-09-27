'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { MobileLayout as MobileLayoutShell } from '@/modules/mobile/components/layout/MobileLayout'
import { WorkLogModal } from '@/modules/mobile/components/work-log/WorkLogModal'
import { useWorkLogs } from '@/modules/mobile/hooks/use-work-logs'
import { WorkLog, WorkLogTabStatus } from '@/modules/mobile/types/work-log.types'
import { UncompletedBottomSheet } from '@/modules/mobile/components/work-log/UncompletedBottomSheet'
import { dismissAlert, formatDate } from '@/modules/mobile/utils/work-log-utils'
import { Plus, Search as SearchIcon, ChevronDown } from 'lucide-react'
import {
  CustomSelect,
  CustomSelectTrigger,
  CustomSelectValue,
  CustomSelectContent,
  CustomSelectItem,
} from '@/components/ui/custom-select'

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const formatDateWithWeekday = (date: string) => {
  const formatted = formatDate(date)
  const weekday = WEEKDAY_LABELS[new Date(date).getDay()]
  return `${formatted}(${weekday})`
}

export const WorkLogHomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<WorkLogTabStatus>('draft')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWorkLog, setEditingWorkLog] = useState<WorkLog | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')

  const {
    draftWorkLogs,
    approvedWorkLogs,
    uncompletedByMonth,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    createWorkLog,
    updateWorkLog,
    deleteWorkLog,
    approveWorkLog,
  } = useWorkLogs()

  // v3 목록/상세(레퍼런스) 관련 구현은 요구 범위 외로 제외

  const draftCount = draftWorkLogs.length
  const approvedCount = approvedWorkLogs.length

  const PERIOD_OPTIONS = useMemo(
    () => [
      { id: 'all', label: '전체 기간', months: null as number | null },
      { id: '3m', label: '최근 3개월', months: 3 },
      { id: '6m', label: '최근 6개월', months: 6 },
      { id: '12m', label: '최근 12개월', months: 12 },
    ],
    []
  )

  const siteOptions = useMemo(() => {
    const map = new Map<string, string>([['all', '전체 현장']])
    ;[...draftWorkLogs, ...approvedWorkLogs].forEach(log => {
      if (log.siteId && log.siteName && !map.has(log.siteId)) {
        map.set(log.siteId, log.siteName)
      }
    })
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  }, [draftWorkLogs, approvedWorkLogs])

  const [selectedSite, setSelectedSite] = useState('all')
  const [selectedPeriod, setSelectedPeriod] = useState('3m')
  const [visibleCounts, setVisibleCounts] = useState<{ draft: number; approved: number }>({
    draft: 10,
    approved: 10,
  })

  const [visibleUncompleted, setVisibleUncompleted] = useState(uncompletedByMonth)
  useEffect(() => {
    setVisibleUncompleted(uncompletedByMonth)
  }, [uncompletedByMonth])

  const [isUncompletedSheetOpen, setUncompletedSheetOpen] = useState(false)
  useEffect(() => {
    setUncompletedSheetOpen(visibleUncompleted.length > 0)
  }, [visibleUncompleted])

  const handleDismissMonth = useCallback((month: string) => {
    dismissAlert(month)
    setVisibleUncompleted(prev => prev.filter(item => item.month !== month))
  }, [])

  const handleNavigateToMonth = useCallback((_month: string) => {
    setActiveTab('draft')
    setUncompletedSheetOpen(false)
  }, [])

  const filterStatus = filter.status
  const filterSiteId = filter.siteId
  const filterDateFrom = filter.dateFrom
  const filterDateTo = filter.dateTo

  useEffect(() => {
    if (filterStatus !== activeTab) {
      setFilter(prev => ({ ...prev, status: activeTab }))
    }
  }, [activeTab, filterStatus, setFilter])

  useEffect(() => {
    if (!siteOptions.some(option => option.value === selectedSite)) {
      setSelectedSite('all')
      return
    }

    if (selectedSite === 'all') {
      if (filterSiteId !== undefined) {
        setFilter(prev => ({ ...prev, siteId: undefined }))
      }
    } else {
      if (filterSiteId !== selectedSite) {
        setFilter(prev => ({ ...prev, siteId: selectedSite }))
      }
    }
  }, [selectedSite, siteOptions, filterSiteId, setFilter])

  useEffect(() => {
    const option = PERIOD_OPTIONS.find(item => item.id === selectedPeriod)
    if (!option) return

    if (option.months === null) {
      if (filterDateFrom !== undefined || filterDateTo !== undefined) {
        setFilter(prev => ({ ...prev, dateFrom: undefined, dateTo: undefined }))
      }
      return
    }

    const end = new Date()
    const start = new Date()
    start.setMonth(start.getMonth() - (option.months - 1))

    const format = (date: Date) => date.toISOString().split('T')[0]

    const nextDateFrom = format(start)
    const nextDateTo = format(end)

    if (filterDateFrom !== nextDateFrom || filterDateTo !== nextDateTo) {
      setFilter(prev => ({ ...prev, dateFrom: nextDateFrom, dateTo: nextDateTo }))
    }
  }, [PERIOD_OPTIONS, selectedPeriod, filterDateFrom, filterDateTo, setFilter])

  useEffect(() => {
    if (!siteOptions.length) return

    if (filterSiteId && siteOptions.some(option => option.value === filterSiteId)) {
      if (selectedSite !== filterSiteId) {
        setSelectedSite(filterSiteId)
      }
    } else if (!filterSiteId && selectedSite !== 'all') {
      setSelectedSite('all')
    }
  }, [filterSiteId, selectedSite, siteOptions])

  useEffect(() => {
    // If date range is not set, do not auto-switch the period to 'all'.
    // This avoids a feedback loop with the effect that sets filter dates from selectedPeriod.
    if (!filterDateFrom || !filterDateTo) {
      return
    }

    const fromDate = new Date(filterDateFrom)
    const toDate = new Date(filterDateTo)
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return
    }

    const diffMonths =
      (toDate.getFullYear() - fromDate.getFullYear()) * 12 +
      (toDate.getMonth() - fromDate.getMonth()) +
      1

    const matchingOption = PERIOD_OPTIONS.find(option => option.months === diffMonths)
    const nextPeriod = matchingOption ? matchingOption.id : 'all'

    if (selectedPeriod !== nextPeriod) {
      setSelectedPeriod(nextPeriod)
    }
  }, [PERIOD_OPTIONS, filterDateFrom, filterDateTo, selectedPeriod])

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

  useEffect(() => {
    setVisibleCounts(prev => {
      let nextDraft = prev.draft
      let nextApproved = prev.approved

      if (draftWorkLogs.length > 0 && prev.draft > draftWorkLogs.length) {
        nextDraft = draftWorkLogs.length
      }

      if (approvedWorkLogs.length > 0 && prev.approved > approvedWorkLogs.length) {
        nextApproved = approvedWorkLogs.length
      }

      if (nextDraft === prev.draft && nextApproved === prev.approved) {
        return prev
      }

      return { draft: nextDraft, approved: nextApproved }
    })
  }, [draftWorkLogs.length, approvedWorkLogs.length])

  useEffect(() => {
    setVisibleCounts(prev => ({
      ...prev,
      [activeTab]: 10,
    }))
  }, [activeTab])

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

    const visibleCount = visibleCounts[tab]
    const displayedLogs = logs.slice(0, visibleCount)
    const hasMore = logs.length > visibleCount

    return (
      <>
        <div className="task-diary-list">
          {displayedLogs.map(workLog => {
            const subtitle =
              workLog.workProcesses.length > 0
                ? workLog.workProcesses.join(', ')
                : workLog.notes || '작업 내용 미입력'

            const formattedDate = formatDateWithWeekday(workLog.date)

            const handleRowClick = () => {
              if (workLog.status === 'draft') {
                handleEditWorkLog(workLog)
              } else {
                handleViewWorkLog(workLog)
              }
            }

            return (
              <button
                key={workLog.id}
                type="button"
                className="task-diary-list-item"
                onClick={handleRowClick}
              >
                <div className="task-diary-info">
                  <div className="task-diary-site">{workLog.siteName}</div>
                  <div className="task-diary-work">{subtitle}</div>
                </div>
                <div className="task-diary-right">
                  <span className={`status-badge ${workLog.status}`}>
                    {workLog.status === 'draft' ? '임시저장' : '작성완료'}
                  </span>
                  <span className="task-diary-date">{formattedDate}</span>
                </div>
              </button>
            )
          })}
        </div>
        {hasMore && (
          <div className="more-button-container">
            <button
              type="button"
              className="more-btn"
              onClick={() =>
                setVisibleCounts(prev => ({
                  ...prev,
                  [tab]: prev[tab] + 10,
                }))
              }
            >
              더보기
            </button>
          </div>
        )}
      </>
    )
  }

  // Monthly summary cards (좌측 시안의 하단 요약 블록)
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const sourceLogs = activeTab === 'draft' ? draftWorkLogs : approvedWorkLogs
  const monthlyLogs = useMemo(
    () =>
      sourceLogs.filter(log => {
        const d = new Date(log.date)
        if (Number.isNaN(d.getTime())) return false
        return d >= monthStart && d <= monthEnd
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sourceLogs, activeTab]
  )

  const monthlyStats = useMemo(() => {
    const uniqueSites = new Set<string>()
    const uniqueDates = new Set<string>()
    let totalHours = 0

    monthlyLogs.forEach(log => {
      if (log.siteId) uniqueSites.add(log.siteId)
      if (log.date) uniqueDates.add(log.date)
      totalHours += Number(log.totalHours || 0)
    })

    const totalManDays = Math.round(totalHours / 8)

    return {
      siteCount: uniqueSites.size,
      manDays: totalManDays,
      attendanceDays: uniqueDates.size,
    }
  }, [monthlyLogs])

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

          .worklog-tab-navigation {
            display: flex;
            gap: 0;
            border: 1px solid #e6ecf4;
            border-radius: 12px;
            background: #ffffff;
            overflow: hidden;
            box-shadow: 0 6px 18px rgba(16, 24, 40, 0.06);
            margin-top: 12px;
          }

          .worklog-tab {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px 12px;
            font-size: 18px;
            font-weight: 600;
            color: #99a4be;
            background: transparent;
            border: none;
            position: relative;
            transition:
              color 0.2s ease,
              background 0.2s ease;
            cursor: pointer;
          }

          .worklog-tab.active {
            color: #31a3fa;
            background: rgba(49, 163, 250, 0.08);
          }

          .worklog-tab.active::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 10%;
            right: 10%;
            height: 2px;
            background: #31a3fa;
            border-radius: 999px;
          }

          .worklog-tab .tab-count {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 24px;
            height: 24px;
            padding: 0 8px;
            font-size: 12px;
            font-weight: 700;
            color: #31a3fa;
            background: rgba(49, 163, 250, 0.15);
            border-radius: 999px;
          }

          .worklog-search-section {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-top: 18px;
          }
          /* Hide inline labels to match left (spec) style */
          .filter-label {
            display: none;
          }

          /* CustomSelect trigger style alignment */
          .custom-select-trigger {
            height: 40px;
            border-radius: 10px;
            background: #ffffff;
            border-color: #d1d5db;
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
          }

          /* Work list container per spec */
          .work-form-container {
            background: var(--card);
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 0 16px;
            box-shadow: 0 2px 10px rgba(2, 6, 23, 0.04);
            margin-top: 16px;
          }

          .worklog-search-section .search-input-wrapper {
            position: relative;
            flex: 1;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 0 18px;
            height: 44px;
            border-radius: 999px;
            border: 1px solid #e6ecf4;
            background: #ffffff;
            box-shadow: 0 4px 12px rgba(16, 24, 40, 0.08);
          }

          .worklog-search-section .search-icon {
            color: #99a4be;
          }

          .worklog-search-section .search-input {
            flex: 1;
            border: none;
            background: transparent;
            font-size: 16px;
            font-weight: 600;
            color: #1a254f;
            outline: none;
          }

          .worklog-search-section .search-input::placeholder {
            color: #9ca3af;
            font-weight: 500;
          }

          .worklog-search-section .clear-search {
            width: 24px;
            height: 24px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: none;
            background: rgba(153, 164, 190, 0.15);
            color: #6b7280;
            border-radius: 999px;
            cursor: pointer;
            font-size: 16px;
            line-height: 1;
          }

          .worklog-search-section .search-cancel {
            background: none;
            border: none;
            color: #99a4be;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            padding: 8px 12px;
            transition: background 0.2s ease;
            border-radius: 10px;
          }

          .worklog-search-section .search-cancel:hover {
            background: rgba(153, 164, 190, 0.12);
            color: #1a254f;
          }

          .filter-row {
            display: grid;
            gap: 12px;
            margin-top: 16px;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .filter-select {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .filter-label {
            font-size: 12px;
            font-weight: 600;
            color: #667085;
          }

          .select-box {
            position: relative;
            display: flex;
            align-items: center;
            border: 1px solid #d1d5db;
            border-radius: 10px;
            background: #ffffff;
            height: 44px;
            padding: 0 14px;
          }

          .select-box select {
            appearance: none;
            border: none;
            background: transparent;
            width: 100%;
            height: 100%;
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            outline: none;
            padding-right: 24px;
          }

          .select-box .select-icon {
            position: absolute;
            right: 14px;
            color: #99a4be;
          }

          .worklog-list-section {
            margin-top: 20px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .task-diary-list {
            display: flex;
            flex-direction: column;
          }

          .task-diary-list-item {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 18px 0;
            border: none;
            border-bottom: 1px solid #e6ecf4;
            background: transparent;
            cursor: pointer;
            transition: background 0.2s ease;
            text-align: left;
          }

          .task-diary-list-item:last-child {
            border-bottom: none;
          }

          .task-diary-list-item:hover {
            background: #f8faff;
          }

          .task-diary-info {
            min-width: 0;
            flex: 1;
            padding-right: 18px;
          }

          .task-diary-site {
            font-size: 16px;
            font-weight: 600;
            color: #1a254f;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .task-diary-work {
            font-size: 13px;
            color: #667085;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .task-diary-right {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 6px;
          }

          .status-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 4px 12px;
            border-radius: 999px;
            font-size: 13px;
            font-weight: 600;
            border: 1px solid transparent;
          }

          .status-badge.draft {
            background: rgba(49, 163, 250, 0.05);
            color: #31a3fa;
            border-color: #31a3fa;
          }

          .status-badge.approved {
            background: rgba(153, 164, 190, 0.15);
            color: #99a4be;
            border-color: #99a4be;
          }

          .task-diary-date {
            font-size: 12px;
            color: #99a4be;
          }

          .more-button-container {
            display: flex;
            justify-content: center;
            margin-top: 8px;
          }

          .more-btn {
            padding: 10px 28px;
            border-radius: 10px;
            border: 1px solid #e6ecf4;
            background: #ffffff;
            font-size: 14px;
            font-weight: 600;
            color: #1a254f;
            box-shadow: 0 6px 18px rgba(16, 24, 40, 0.08);
            cursor: pointer;
            transition:
              transform 0.2s ease,
              box-shadow 0.2s ease,
              background 0.2s ease;
          }

          .more-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 12px 24px rgba(16, 24, 40, 0.12);
            background: #f8faff;
          }

          /* Summary cards (월간 요약) */
          .summary-cards {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-top: 16px;
          }

          .summary-card {
            background: var(--card);
            border: 1px solid #e6ecf4;
            border-radius: 12px;
            padding: 14px 12px;
            text-align: center;
            box-shadow: 0 6px 16px rgba(16, 24, 40, 0.06);
          }

          .summary-value {
            color: #1a254f;
            font-weight: 800;
            font-size: 18px;
            line-height: 24px;
          }

          .summary-label {
            margin-top: 4px;
            color: #667085;
            font-size: 12px;
          }

          @media (max-width: 480px) {
            .filter-row {
              grid-template-columns: 1fr;
            }

            .worklog-tab {
              font-size: 16px;
            }

            .task-diary-right {
              min-width: auto;
              align-items: flex-start;
            }

            .task-diary-list-item {
              padding: 16px 0;
              align-items: flex-start;
            }
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
          {/* Title removed per spec */}

          <nav className="worklog-tab-navigation">
            <button
              type="button"
              className={`worklog-tab ${activeTab === 'draft' ? 'active' : ''}`}
              onClick={() => setActiveTab('draft')}
            >
              <span className="tab-label">임시저장</span>
              <span className="tab-count">{draftCount}</span>
            </button>
            <button
              type="button"
              className={`worklog-tab ${activeTab === 'approved' ? 'active' : ''}`}
              onClick={() => setActiveTab('approved')}
            >
              <span className="tab-label">작성완료</span>
              <span className="tab-count">{approvedCount}</span>
            </button>
          </nav>

          <section className="worklog-search-section">
            <div className="search-input-wrapper">
              <SearchIcon className="search-icon" width={18} height={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="작업일지 검색"
                className="search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={() => setSearchQuery('')}
                  aria-label="검색어 지우기"
                >
                  ×
                </button>
              )}
            </div>
            <button type="button" className="search-cancel" onClick={() => setSearchQuery('')}>
              취소
            </button>
          </section>

          <section className="filter-row">
            {/* Site Select - CustomSelect */}
            <div className="filter-select">
              <CustomSelect value={selectedSite} onValueChange={setSelectedSite}>
                <CustomSelectTrigger className="custom-select-trigger">
                  <CustomSelectValue>
                    {siteOptions.find(o => o.value === selectedSite)?.label || '전체 현장'}
                  </CustomSelectValue>
                </CustomSelectTrigger>
                <CustomSelectContent align="start">
                  {siteOptions.map(option => (
                    <CustomSelectItem key={option.value} value={option.value}>
                      {option.label}
                    </CustomSelectItem>
                  ))}
                </CustomSelectContent>
              </CustomSelect>
            </div>

            {/* Period Select - only 3,6,12 months per spec */}
            <div className="filter-select">
              <CustomSelect value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <CustomSelectTrigger className="custom-select-trigger">
                  <CustomSelectValue>
                    {{
                      '3m': '최근 3개월',
                      '6m': '최근 6개월',
                      '12m': '최근 12개월',
                    }[selectedPeriod] || '최근 3개월'}
                  </CustomSelectValue>
                </CustomSelectTrigger>
                <CustomSelectContent align="start">
                  <CustomSelectItem value="3m">최근 3개월</CustomSelectItem>
                  <CustomSelectItem value="6m">최근 6개월</CustomSelectItem>
                  <CustomSelectItem value="12m">최근 12개월</CustomSelectItem>
                </CustomSelectContent>
              </CustomSelect>
            </div>
          </section>

          <section className="worklog-list-section work-form-container">
            {activeTab === 'draft'
              ? renderWorkLogList(draftWorkLogs, 'draft')
              : renderWorkLogList(approvedWorkLogs, 'approved')}
          </section>

          {/* Monthly summary cards */}
          <section className="summary-cards" aria-label="월간 요약">
            <div className="summary-card">
              <div className="summary-value">{monthlyStats.siteCount}</div>
              <div className="summary-label">총 현장(월)</div>
            </div>
            <div className="summary-card">
              <div className="summary-value">{monthlyStats.manDays}</div>
              <div className="summary-label">총 공수(월)</div>
            </div>
            <div className="summary-card">
              <div className="summary-value">{monthlyStats.attendanceDays}</div>
              <div className="summary-label">총 출근(월)</div>
            </div>
          </section>
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

        {/* 풀스크린 상세(레퍼런스)는 범위 외로 비표시 */}

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
