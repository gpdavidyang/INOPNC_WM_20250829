import React, { useState, useEffect, useRef } from 'react'
import {
  PlusCircle,
  ChevronDown,
  ClipboardList,
  Package,
  Camera,
  Map as MapIcon,
  FileCheck as FileCheckIcon,
  AlertCircle,
  Users,
  Pin,
  ChevronLeft,
  Check,
  CheckCircle,
  CalendarDays,
  ChevronUp,
  Search,
  X,
} from 'lucide-react'
import { MOCK_LOGS } from '../../worklog/constants'
import { WorkLog, LogStatus } from '@inopnc/shared'
import WorkLogDetail from '../../worklog/components/WorkLogDetail'
import SmartCreateSheet from '../components/SmartCreateSheet'

type ViewMode = 'dashboard' | 'timeline'

const WorklogList: React.FC = () => {
  const [logs, setLogs] = useState<WorkLog[]>(MOCK_LOGS)
  const [search, setSearch] = useState('')
  const [currentFilter, setCurrentFilter] = useState<LogStatus | 'all'>('all')
  const [sortOrder, setSortOrder] = useState<'latest' | 'name'>('latest')

  // List Management: Month Filter (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7))

  // UI State
  const [showSearchOptions, setShowSearchOptions] = useState(false)
  const searchWrapperRef = useRef<HTMLDivElement>(null)

  // Click Outside Handler for Search Dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setShowSearchOptions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSearchSelect = (name: string) => {
    setSearch(name)
    setShowSearchOptions(false)
  }

  // Update Search Handler: Show dropdown only if search is present
  const handleSearchChange = (val: string) => {
    setSearch(val)
    setShowSearchOptions(val.trim().length > 0)
  }

  const handleSearchInteraction = () => {
    if (search.trim().length > 0) setShowSearchOptions(true)
  }

  // View State
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
  const [timelineStatus, setTimelineStatus] = useState<LogStatus | null>(null)

  // Batch Selection State
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // Modal & Sheet State
  const [selectedLog, setSelectedLog] = useState<WorkLog | null>(null)
  const [isSmartCreateOpen, setIsSmartCreateOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(5)

  // Toast State
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' })

  // New Log Notification State
  const [newLogIds, setNewLogIds] = useState<Set<number>>(new Set())

  // Load shared data on mount
  useEffect(() => {
    try {
      const sharedLogs = localStorage.getItem('inopnc_work_log')
      if (sharedLogs) {
        const parsedLogs = JSON.parse(sharedLogs)
        // Convert shared format to WorkLog format
        const convertedLogs = parsedLogs.map((log: any) => ({
          id: parseInt(log.id.replace('LOG-', '')),
          site: log.siteName,
          siteId: log.siteId,
          date: log.workDate,
          status: log.status === '작성중' ? 'draft' : log.status,
          affiliation: log.dept,
          member: log.workSets?.[0]?.member || '',
          process: log.workSets?.[0]?.process || '',
          type: log.workSets?.[0]?.type || '',
          location: log.workSets?.[0]?.location?.floor || '',
          manpower: log.manpower ? [{ role: '작업자', val: log.manpower, worker: '작업자' }] : [],
          materials: [],
          photos: [],
          drawings: [],
          confirmationFiles: [],
          isDirect: true,
          isPinned: false,
        }))
        setLogs(convertedLogs)
      }
    } catch (e) {
      console.error('Failed to load shared worklog data:', e)
    }
  }, [])

  // Check for missing fields when logs are loaded or updated
  useEffect(() => {
    if (logs.length > 0) {
      const updatedLogs = logs.map(log => {
        // const missing = workLogService.checkMissingFields(log);
        return { ...log, missing: [] } // 임시로 빈 배열로 설정
      })
      setLogs(updatedLogs)
    }
  }, []) // Run only once on mount

  // Reset selection when changing views
  useEffect(() => {
    setSelectedIds(new Set())
  }, [viewMode, timelineStatus])

  // --- Helper: Toast ---
  const showToast = (msg: string) => {
    setToast({ show: true, msg })
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2000)
  }

  // --- Sorting & Filtering Logic ---
  const getSortedLogs = (logsToSort: WorkLog[]) => {
    const sorted = [...logsToSort]
    if (sortOrder === 'latest') {
      sorted.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })
    } else if (sortOrder === 'name') {
      sorted.sort((a, b) => {
        return (
          a.site.localeCompare(b.site) || new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      })
    }
    return sorted
  }

  const dashboardLogs = getSortedLogs(logs).filter(log => {
    const matchStatus = currentFilter === 'all' || log.status === currentFilter
    const matchSearch = !search || log.site.toLowerCase().includes(search.toLowerCase())
    const matchMonth = log.date.startsWith(selectedMonth) // Filter by Month
    return matchStatus && matchSearch && matchMonth
  })

  const timelineLogs = getSortedLogs(logs).filter(log => {
    const matchStatus = log.status === timelineStatus
    const matchMonth = log.date.startsWith(selectedMonth) // Filter by Month
    const matchSearch = !search || log.site.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchMonth && matchSearch
  })

  const displayLogs = dashboardLogs.slice(0, visibleCount)

  // --- Handlers ---
  const handleDashboardFilter = (status: LogStatus | 'all') => {
    setCurrentFilter(status)
    setVisibleCount(5)
  }

  const handleSummaryClick = (status: LogStatus) => {
    setTimelineStatus(status)
    setViewMode('timeline')
    window.scrollTo(0, 0)
  }

  const handleBackToDashboard = () => {
    setViewMode('dashboard')
    setTimelineStatus(null)
    window.scrollTo(0, 0)
  }

  // Replaced direct creation with Smart Create Sheet opening
  const handleOpenSmartCreate = () => {
    setIsSmartCreateOpen(true)
  }

  const handleSmartCreateSubmit = (newLog: WorkLog) => {
    setLogs(prev => [newLog, ...prev])
    setIsSmartCreateOpen(false)
    showToast('일지 생성 완료')

    // Add to new log notifications
    setNewLogIds(prev => new Set(prev).add(newLog.id))

    // Remove from new log notifications after 5 seconds
    setTimeout(() => {
      setNewLogIds(prev => {
        const next = new Set(prev)
        next.delete(newLog.id)
        return next
      })
    }, 5000)

    // Optional: Open the details immediately for the user to add photos
    // setSelectedLog(newLog);
  }

  const handleSaveLog = (updatedLog: WorkLog) => {
    setLogs(prev => {
      const exists = prev.find(l => l.id === updatedLog.id)
      if (exists) {
        return prev.map(l => (l.id === updatedLog.id ? updatedLog : l))
      }
      return [updatedLog, ...prev]
    })
    setSelectedLog(null)
    showToast('저장되었습니다.')
  }

  const handleTogglePin = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    setLogs(prev => prev.map(log => (log.id === id ? { ...log, isPinned: !log.isPinned } : log)))
  }

  // --- Batch Selection Handlers ---
  const toggleSelection = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === timelineLogs.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(timelineLogs.map(l => l.id)))
    }
  }

  const handleBatchApprove = () => {
    if (selectedIds.size === 0) return alert('선택된 항목이 없습니다.')
    if (!confirm(`선택한 ${selectedIds.size}건을 통합 승인요청 하시겠습니까?`)) return

    const now = new Date()
    const timestamp = `${now.toISOString().split('T')[0]} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    setLogs(prev =>
      prev.map(log =>
        selectedIds.has(log.id) ? { ...log, status: 'pending', updatedAt: timestamp } : log
      )
    )

    showToast(`${selectedIds.size}건 승인요청`)
    setSelectedIds(new Set())
  }

  // --- Duplication Logic (Efficient Creation) ---
  const handleDuplicateLog = (logToCopy: WorkLog) => {
    const today = new Date().toISOString().split('T')[0]
    const newLog: WorkLog = {
      ...logToCopy, // Copy Site, Affiliation, Manpower, Materials, Drawings
      id: Date.now(), // New ID
      date: today, // Today's Date
      status: 'draft', // Reset to Draft
      photos: [], // Clear Daily Photos
      drawings: logToCopy.drawings, // Keep Drawings (often reused)
      confirmationFiles: [], // Clear Confirmation
      missing: [], // Clear Alerts
      rejectReason: undefined,
      isDirect: true, // Treat as new entry
      isPinned: false,
    }

    setLogs(prev => [newLog, ...prev])
    setSelectedLog(newLog)
    showToast('오늘 일자로 복사')
  }

  const getTimelineTitle = (status: LogStatus | null) => {
    switch (status) {
      case 'draft':
        return '작성중인 일지'
      case 'rejected':
        return '반려된 일지'
      case 'pending':
        return '승인요청 일지'
      case 'approved':
        return '승인완료된 일지'
      default:
        return '일지 목록'
    }
  }

  const isSelectionEnabled = timelineStatus === 'draft' || timelineStatus === 'rejected'

  return (
    <div
      className="w-full max-w-[600px] mx-auto min-h-screen relative"
      style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-main)' }}
    >
      {/* ================= DASHBOARD VIEW ================= */}
      {viewMode === 'dashboard' && (
        <div className="px-4 pt-4 animate-fade-in">
          {/* Search */}
          <div
            className="relative mb-2 flex items-center group"
            id="searchComboWrapper"
            ref={searchWrapperRef}
          >
            <input
              type="text"
              className="
                        w-full h-[54px] rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] px-[22px] pr-12 text-[17px] text-[var(--text-main)] font-medium 
                        transition-all duration-200 ease-out 
                        hover:border-slate-300 
                        focus:outline-none focus:bg-[var(--bg-surface)] 
                        focus:border-primary focus:border-[1.5px] 
                        focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)] 
                        cursor-pointer focus:cursor-text
                        placeholder:text-slate-400
                    "
              placeholder="현장명을 입력하세요."
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              onClick={handleSearchInteraction}
              onFocus={handleSearchInteraction}
            />
            {search ? (
              <button
                className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-slate-300 text-white rounded-full w-[22px] h-[22px] flex items-center justify-center border-none cursor-pointer"
                onClick={() => {
                  setSearch('')
                  setShowSearchOptions(false)
                }}
              >
                <X size={14} />
              </button>
            ) : (
              <Search
                className="absolute right-[18px] top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
                size={20}
              />
            )}

            {showSearchOptions && (
              <div className="absolute top-[60px] left-0 right-0 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl max-h-[300px] overflow-y-auto z-[100] shadow-xl animate-slideDown">
                {logs.filter(l => l.site.toLowerCase().includes(search.toLowerCase())).length ===
                0 ? (
                  <div className="p-4 text-slate-400 text-center">검색 결과 없음</div>
                ) : (
                  <>
                    <div
                      className="p-3.5 border-b border-[var(--border)] cursor-pointer hover:bg-[var(--bg-hover)] text-[16px] text-[var(--text-main)]"
                      onClick={() => handleSearchSelect('')}
                    >
                      전체 현장
                    </div>
                    {logs
                      .filter(l => l.site.toLowerCase().includes(search.toLowerCase()))
                      .map(l => (
                        <div
                          key={l.id}
                          className="p-3.5 border-b border-[var(--border)] cursor-pointer hover:bg-[var(--bg-hover)] text-[16px] text-[var(--text-main)]"
                          onClick={() => handleSearchSelect(l.site)}
                        >
                          {l.site}
                        </div>
                      ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-4 w-full">
            <select
              className="flex-1 h-[54px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-3.5 text-[17px] font-semibold text-[var(--text-main)] shadow-soft focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)] appearance-none"
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as any)}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23333333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 16px center',
              }}
            >
              <option value="latest">최신순</option>
              <option value="name">이름순</option>
            </select>
            <input
              type="month"
              className="flex-1 h-[54px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-3.5 text-[17px] font-semibold text-[var(--text-main)] shadow-soft focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)]"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
            />
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            <SummaryCard
              label="작성중"
              count={logs.filter(l => l.status === 'draft').length}
              type="draft"
              onClick={() => handleSummaryClick('draft')}
            />
            <SummaryCard
              label="반려"
              count={logs.filter(l => l.status === 'rejected').length}
              type="rejected"
              onClick={() => handleSummaryClick('rejected')}
            />
            <SummaryCard
              label="승인요청"
              count={logs.filter(l => l.status === 'pending').length}
              type="pending"
              onClick={() => handleSummaryClick('pending')}
            />
            <SummaryCard
              label="승인완료"
              count={logs.filter(l => l.status === 'approved').length}
              type="approved"
              onClick={() => handleSummaryClick('approved')}
            />
          </div>

          {/* Filter Chips */}
          <div className="flex gap-1 mb-5 overflow-x-auto no-scrollbar justify-between w-full">
            <FilterChip
              label="전체"
              active={currentFilter === 'all'}
              onClick={() => handleDashboardFilter('all')}
            />
            <FilterChip
              label="작성중"
              active={currentFilter === 'draft'}
              onClick={() => handleDashboardFilter('draft')}
            />
            <FilterChip
              label="반려됨"
              active={currentFilter === 'rejected'}
              onClick={() => handleDashboardFilter('rejected')}
            />
            <FilterChip
              label="승인요청"
              active={currentFilter === 'pending'}
              onClick={() => handleDashboardFilter('pending')}
            />
            <FilterChip
              label="승인완료"
              active={currentFilter === 'approved'}
              onClick={() => handleDashboardFilter('approved')}
            />
          </div>

          {/* Add Button - Opens Smart Create Sheet */}
          <button
            onClick={handleOpenSmartCreate}
            className="w-full h-[54px] rounded-[14px] text-[17px] font-bold flex items-center justify-center gap-2 cursor-pointer border border-dashed border-primary text-primary bg-[var(--bg-surface)] mb-5 active:bg-primary-bg transition"
          >
            <PlusCircle className="w-[22px] h-[22px]" /> 새 작업일지 등록
          </button>

          {/* Log List */}
          <div className="flex flex-col gap-3 pb-7">
            {displayLogs.length === 0 ? (
              <div className="text-center py-10 text-[var(--text-sub)] flex flex-col items-center gap-2">
                <CalendarDays className="w-8 h-8 text-slate-300" />
                <span className="text-[15px] font-bold">해당 월에 데이터가 없습니다.</span>
              </div>
            ) : (
              displayLogs.map(log => (
                <LogCard
                  key={log.id}
                  log={log}
                  onClick={() => setSelectedLog(log)}
                  onPinClick={handleTogglePin}
                  isNew={newLogIds.has(log.id)}
                />
              ))
            )}
          </div>

          {/* Load More / Collapse Button */}
          {dashboardLogs.length > 5 && (
            <div className="pb-6">
              {visibleCount < dashboardLogs.length ? (
                <button
                  onClick={() => setVisibleCount(prev => prev + 5)}
                  className="w-full h-[50px] flex items-center justify-center gap-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-full text-[15px] font-bold text-text-sub hover:bg-[var(--bg-hover)] active:scale-[0.98] transition shadow-sm"
                >
                  더 보기 <ChevronDown className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setVisibleCount(5)}
                  className="w-full h-[50px] flex items-center justify-center gap-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-full text-[15px] font-bold text-text-sub hover:bg-[var(--bg-hover)] active:scale-[0.98] transition shadow-sm"
                >
                  접기 <ChevronUp className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= TIMELINE VIEW ================= */}
      {viewMode === 'timeline' && (
        <div
          className="min-h-screen animate-slide-up pb-[calc(90px+env(safe-area-inset-bottom))]"
          style={{ backgroundColor: 'var(--bg-body)' }}
        >
          {/* Sticky Header */}
          <div className="sticky top-0 z-[100] bg-[var(--bg-surface)] border-b border-[var(--border)] px-4 py-3.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToDashboard}
                className="p-1 -ml-2 rounded-full hover:bg-[var(--bg-hover)] transition"
              >
                <ChevronLeft className="w-8 h-8 text-header-navy" />
              </button>
              <span className="text-[22px] font-bold text-header-navy">
                {getTimelineTitle(timelineStatus)}
              </span>
            </div>
            {isSelectionEnabled && timelineLogs.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="text-[14px] font-bold text-primary flex items-center gap-1 px-2 py-1 hover:bg-[var(--bg-hover)] rounded transition"
              >
                {selectedIds.size === timelineLogs.length ? '전체해제' : '전체선택'}
              </button>
            )}
          </div>

          <div className="px-4 pt-5">
            <div className="text-[15px] font-bold text-text-sub mb-3">
              * 날짜를 클릭하여 상세 내용을 확인/수정하세요.
            </div>

            <div className="flex flex-col gap-3">
              {timelineLogs.length === 0 ? (
                <div className="text-center py-10 text-text-sub">데이터가 없습니다.</div>
              ) : (
                timelineLogs.map(log => (
                  <WorklogListItem
                    key={log.id}
                    log={log}
                    selectable={isSelectionEnabled}
                    selected={selectedIds.has(log.id)}
                    onToggle={() => toggleSelection(log.id)}
                    onClick={() => setSelectedLog(log)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Sticky Footer for Bulk Action */}
          {isSelectionEnabled && (
            <div className="fixed bottom-0 left-0 right-0 bg-[var(--bg-surface)] border-t border-[var(--border)] px-3 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] z-[90] flex justify-center shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
              <div className="w-full max-w-[600px] px-2">
                <button
                  onClick={handleBatchApprove}
                  disabled={selectedIds.size === 0}
                  className={`w-full h-[56px] rounded-2xl text-lg font-extrabold transition flex items-center justify-center gap-2
                                ${
                                  selectedIds.size > 0
                                    ? 'bg-header-navy text-white hover:opacity-90'
                                    : 'bg-[var(--bg-hover)] text-[var(--text-sub)] cursor-not-allowed'
                                }`}
                >
                  {selectedIds.size > 0 ? `${selectedIds.size}건 통합 승인요청` : '통합 승인요청'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <WorkLogDetail
          key={selectedLog.id}
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          onSave={handleSaveLog}
          onDuplicate={handleDuplicateLog}
        />
      )}

      {/* Smart Create Sheet (Replaces QuickCreateSheet) */}
      {isSmartCreateOpen && (
        <SmartCreateSheet
          isOpen={isSmartCreateOpen}
          onClose={() => setIsSmartCreateOpen(false)}
          onSubmit={handleSmartCreateSubmit}
        />
      )}

      {/* Toast Message */}
      {toast.show && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-800 text-white px-6 py-3 rounded-full text-[14px] font-bold shadow-2xl flex items-center gap-2.5 z-[9999] animate-[slideDown_0.3s_ease-out] border border-gray-700 dark:border-gray-600">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <span className="tracking-tight">{toast.msg}</span>
        </div>
      )}
    </div>
  )
}

// --- Sub Components ---

const SummaryCard: React.FC<{
  label: string
  count: number
  type: string
  onClick: () => void
}> = ({ label, count, type, onClick }) => {
  let styleClass = 'bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border)]'
  if (type === 'draft')
    styleClass =
      'bg-primary-bg text-primary border border-primary ring-1 ring-inset ring-primary/20'
  else if (type === 'rejected')
    styleClass = 'bg-red-50 text-red-600 border border-red-300 ring-1 ring-inset ring-red-200/50'
  else if (type === 'pending')
    styleClass =
      'bg-blue-50 text-blue-700 border border-blue-300 ring-1 ring-inset ring-blue-200/50'
  else if (type === 'approved')
    styleClass =
      'bg-slate-50 text-slate-600 border border-slate-300 ring-1 ring-inset ring-slate-200/50'

  return (
    <div
      onClick={onClick}
      className={`h-[90px] rounded-2xl flex flex-col items-center justify-center cursor-pointer shadow-sm border ring-1 ring-inset ring-black/5 transition active:scale-95 ${styleClass}`}
    >
      <span className="text-2xl font-extrabold leading-none mb-1">{count}</span>
      <span className="text-[13px] font-bold">{label}</span>
    </div>
  )
}

const FilterChip: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({
  label,
  active,
  onClick,
}) => {
  // Determine color based on label
  const getColorClass = () => {
    const inactive = 'bg-[var(--bg-surface)] border-[var(--border)] text-slate-400'
    if (!active) return inactive
    if (label === '전체') return 'bg-primary text-white border-primary'
    if (label === '작성중') return 'bg-sky-600 text-white border-sky-600'
    if (label === '반려됨') return 'bg-red-500 text-white border-red-500'
    if (label === '승인요청') return 'bg-purple-500 text-white border-purple-500'
    if (label === '승인완료') return 'bg-slate-500 text-white border-slate-500'
    return 'bg-primary text-white border-primary'
  }

  return (
    <button
      onClick={onClick}
      className={`flex-1 min-w-fit h-[40px] px-2 text-[14px] font-bold border transition flex items-center justify-center whitespace-nowrap
                ${active ? 'shadow-[0_2px_8px_rgba(49,163,250,0.15)]' : ''}
                ${getColorClass()}
                rounded-full
            `}
    >
      {label}
    </button>
  )
}

const LogCard: React.FC<{
  log: WorkLog
  onClick: () => void
  onPinClick: (e: React.MouseEvent, id: number) => void
  isNew?: boolean
}> = ({ log, onClick, onPinClick, isNew = false }) => {
  let statusBadge = (
    <div className="bg-blue-500 text-white rounded-tr-xl rounded-bl-xl px-3.5 py-1.5 text-[13px] font-extrabold absolute top-0 right-0">
      작성중
    </div>
  )
  if (log.status === 'rejected')
    statusBadge = (
      <div className="bg-red-500 text-white rounded-tr-xl rounded-bl-xl px-3.5 py-1.5 text-[13px] font-extrabold absolute top-0 right-0">
        반려됨
      </div>
    )
  if (log.status === 'pending')
    statusBadge = (
      <div className="bg-purple-500 text-white rounded-tr-xl rounded-bl-xl px-3.5 py-1.5 text-[13px] font-extrabold absolute top-0 right-0">
        승인요청
      </div>
    )
  if (log.status === 'approved')
    statusBadge = (
      <div className="bg-slate-500 text-white rounded-tr-xl rounded-bl-xl px-3.5 py-1.5 text-[13px] font-extrabold absolute top-0 right-0">
        승인완료
      </div>
    )

  const hasMaterials = log.materials && log.materials.length > 0
  const hasPhotos = log.photos && log.photos.length > 0
  const hasDrawings = log.drawings && log.drawings.length > 0
  const hasConfirmation = log.confirmationFiles && log.confirmationFiles.length > 0

  const baseSurface = 'bg-[var(--bg-surface)] border border-[var(--border)]'
  const pinnedClass = log.isPinned ? 'border-primary ring-1 ring-primary/20' : ''
  const newLogClass = isNew ? 'ring-2 ring-green-400/50 bg-green-50/50' : ''
  const rejectedClass = log.status === 'rejected' ? 'border-red-200 ring-2 ring-red-100' : ''
  const cardClassName = `rounded-[16px] p-[22px] relative cursor-pointer shadow-sm transition active:scale-[0.98] overflow-hidden ${baseSurface} ${pinnedClass} ${rejectedClass} ${newLogClass}`

  // Get formatted worker name string
  const workerNames = log.manpower.map(m => m.worker || m.role).filter(Boolean)
  const workerDisplay =
    workerNames.length > 0
      ? `${workerNames[0]}${workerNames.length > 1 ? ` 외 ${workerNames.length - 1}명` : ''}`
      : `${log.manpower.length}명`

  return (
    <div onClick={onClick} className={cardClassName}>
      {statusBadge}
      <div className="flex justify-between items-center mb-1.5 pr-8">
        <span className="text-[15px] text-text-sub font-bold">{log.date}</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="bg-[var(--tag-affil-bg)] text-[var(--tag-affil-text)] border-[var(--tag-affil-border)] text-[14px] px-3 h-8 rounded-lg flex items-center gap-2 font-semibold whitespace-nowrap shrink-0">
          {log.affiliation}
        </span>
        <span className="text-[19px] font-extrabold text-text-main truncate">{log.site}</span>
        <button
          onClick={e => onPinClick(e, log.id)}
          className={`bg-none border-none cursor-pointer flex items-center justify-center p-1 transition-transform duration-200 shrink-0 ml-auto ${log.isPinned ? 'text-primary -rotate-45' : 'text-slate-300 hover:text-slate-400'}`}
        >
          <Pin className={`w-5 h-5 ${log.isPinned ? 'fill-current' : ''}`} />
        </button>
      </div>
      <div className="text-[16px] text-text-sub font-bold mb-3">
        {[log.member, log.process, log.type, log.location].filter(Boolean).join(' | ')}
      </div>
      <div className="border-t border-dashed border-[var(--border)] pt-2.5 flex justify-between items-center">
        <div className="text-[15px] font-bold text-text-sub flex items-center gap-1">
          <Users className="w-4 h-4" />
          {workerDisplay}
          <span className="text-primary">({log.manpower.reduce((a, b) => a + b.val, 0)}공수)</span>
        </div>
        <div className="flex gap-1.5 items-center pl-2 border-l border-[var(--border)]">
          <ClipboardList
            className={`w-4 h-4 ${log.member ? 'text-header-navy' : 'text-slate-300'}`}
          />
          <Package className={`w-4 h-4 ${hasMaterials ? 'text-header-navy' : 'text-slate-300'}`} />
          <Camera className={`w-4 h-4 ${hasPhotos ? 'text-header-navy' : 'text-slate-300'}`} />
          <MapIcon className={`w-4 h-4 ${hasDrawings ? 'text-header-navy' : 'text-slate-300'}`} />
          <FileCheckIcon
            className={`w-4 h-4 ${hasConfirmation ? 'text-header-navy' : 'text-slate-300'}`}
          />
        </div>
      </div>
      {log.status === 'rejected' && log.rejectReason && (
        <div className="mt-3 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg flex items-center gap-2 text-[13px] font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="truncate">반려됨</span>
        </div>
      )}
      {log.status === 'draft' && log.missing && log.missing.length > 0 && (
        <div className="mt-3 bg-sky-50 border border-sky-200 text-sky-700 px-3 py-2 rounded-lg flex items-center gap-2 text-[13px] font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="truncate">{log.missing.join(', ')} 항목 누락</span>
        </div>
      )}
    </div>
  )
}

const WorklogListItem: React.FC<{
  log: WorkLog
  selectable?: boolean
  selected?: boolean
  onToggle?: (id: number) => void
  onClick?: (log: WorkLog) => void
}> = ({ log, selectable, selected, onToggle, onClick }) => {
  // Determine the save time part string (assuming updatedAt includes time "YYYY-MM-DD HH:MM")
  const timeString = log.updatedAt ? log.updatedAt.split(' ')[1] : '00:00'

  let statusBadge = (
    <div className="bg-blue-500 text-white rounded-bl-xl px-3.5 py-1.5 text-[13px] font-extrabold absolute top-0 right-0 z-10">
      작성중
    </div>
  )
  if (log.status === 'rejected')
    statusBadge = (
      <div className="bg-red-500 text-white rounded-bl-xl px-3.5 py-1.5 text-[13px] font-extrabold absolute top-0 right-0 z-10">
        반려됨
      </div>
    )
  if (log.status === 'pending')
    statusBadge = (
      <div className="bg-purple-500 text-white rounded-bl-xl px-3.5 py-1.5 text-[13px] font-extrabold absolute top-0 right-0 z-10">
        승인요청
      </div>
    )
  if (log.status === 'approved')
    statusBadge = (
      <div className="bg-slate-500 text-white rounded-bl-xl px-3.5 py-1.5 text-[13px] font-extrabold absolute top-0 right-0 z-10">
        승인완료
      </div>
    )

  return (
    <div
      className={`relative p-5 rounded-2xl flex items-center gap-3 transition active:scale-[0.98] overflow-hidden
                ${
                  selected
                    ? 'border-2 border-primary bg-[var(--bg-surface)] shadow-md z-10'
                    : 'border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm'
                }
            `}
    >
      {statusBadge}
      {selectable && (
        <div
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation()
            if (onToggle) onToggle(log.id)
          }}
          className="p-2 -ml-2 cursor-pointer relative z-20"
        >
          <div
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200 shadow-sm
                        ${selected ? 'bg-primary border-primary text-white shadow-primary/30 shadow-md' : 'bg-gray-50 dark:bg-gray-700 border-gray-400 dark:border-gray-500 hover:border-primary hover:shadow-sm'}
                    `}
          >
            {selected && <Check className="w-3.5 h-3.5" />}
          </div>
        </div>
      )}

      <div
        className="flex-1 min-w-0 cursor-pointer pt-1"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation()
          if (onClick) onClick(log)
        }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[14px] font-bold text-text-sub flex items-center gap-2">
            {log.date}
            <span className="w-[1px] h-3 bg-[var(--border)]"></span>
            <span className="text-slate-400 dark:text-slate-500">{timeString}</span>
          </span>
        </div>
        <div className="text-[18px] font-extrabold text-text-main truncate mb-1 pr-16">
          {log.site}
        </div>
        <div className="text-[15px] text-text-sub truncate font-bold flex items-center gap-1.5">
          {log.process} <span className="text-slate-300 dark:text-slate-600">|</span> {log.member}
        </div>
      </div>
    </div>
  )
}

export default WorklogList
