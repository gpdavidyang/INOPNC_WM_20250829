'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { MobileLayout as MobileLayoutShell } from '@/modules/mobile/components/layout/MobileLayout'
import { useWorkLogs } from '@/modules/mobile/hooks/use-work-logs'
import { WorkLog, WorkLogTabStatus } from '@/modules/mobile/types/work-log.types'
import { WorkLogListItem } from '@/modules/mobile/components/work-log/v2/WorkLogListItem'
import { WorkLogModal } from '@/modules/mobile/components/work-log/WorkLogModal'

const TAB_CONFIG: Array<{ id: WorkLogTabStatus; label: string }> = [
  { id: 'draft', label: '임시저장' },
  { id: 'approved', label: '작성완료' },
]

/**
 * Skeleton layout for the 작업일지 V2 experiment.
 * Focuses on structural elements (tabs → 필터 → 검색 → 리스트) without touching legacy logic yet.
 */
export const WorkLogHomePageV2: React.FC = () => {
  const [activeTab, setActiveTab] = useState<WorkLogTabStatus>('draft')
  const {
    draftWorkLogs,
    approvedWorkLogs,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    setFilter,
  } = useWorkLogs()

  const tabCounts = useMemo(
    () => ({ draft: draftWorkLogs.length, approved: approvedWorkLogs.length }),
    [draftWorkLogs.length, approvedWorkLogs.length]
  )

  const currentLogs = activeTab === 'draft' ? draftWorkLogs : approvedWorkLogs

  const [siteFilterLabel, setSiteFilterLabel] = useState('전체 현장')
  const [periodFilterLabel, setPeriodFilterLabel] = useState('전체 기간')
  const [isSiteSheetOpen, setSiteSheetOpen] = useState(false)
  const [isPeriodSheetOpen, setPeriodSheetOpen] = useState(false)
  const [isSearchActive, setSearchActive] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [selectedWorkLog, setSelectedWorkLog] = useState<WorkLog | null>(null)
  const [isModalOpen, setModalOpen] = useState(false)

  const handleOpenSiteFilter = () => {
    // TODO(worklog-v2): 현장 선택 바텀시트 연결 예정
    setSiteSheetOpen(true)
  }

  const handleOpenPeriodFilter = () => {
    // TODO(worklog-v2): 기간 선택 바텀시트/데이트피커 연결 예정
    setPeriodSheetOpen(true)
  }

  const handleSelectWorkLog = (workLog: WorkLog) => {
    setSelectedWorkLog(workLog)
    setModalOpen(true)
  }

  const handleClearFilters = () => {
    setFilter(prev => ({ ...prev, siteId: undefined, dateFrom: undefined, dateTo: undefined }))
    setSiteFilterLabel('전체 현장')
    setPeriodFilterLabel('전체 기간')
  }

  const RECENT_SEARCH_KEY = 'worklog_v2_recent_searches'
  const MAX_RECENT_SEARCHES = 5

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(RECENT_SEARCH_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, MAX_RECENT_SEARCHES))
        }
      }
    } catch (err) {
      console.error('최근 검색어 로드 실패', err)
    }
  }, [])

  const persistRecentSearches = (keywords: string[]) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(keywords))
    } catch (err) {
      console.error('최근 검색어 저장 실패', err)
    }
  }

  const addRecentSearch = (keyword: string) => {
    const trimmed = keyword.trim()
    if (!trimmed) return

    setRecentSearches(prev => {
      const deduped = prev.filter(item => item !== trimmed)
      const updated = [trimmed, ...deduped].slice(0, MAX_RECENT_SEARCHES)
      persistRecentSearches(updated)
      return updated
    })
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    persistRecentSearches([])
  }

  const handleSearchSubmit = () => {
    addRecentSearch(searchQuery)
    setShowSuggestions(false)
    setSearchActive(false)
  }

  const handleSearchCancel = () => {
    setSearchQuery('')
    setSearchActive(false)
    setShowSuggestions(false)
  }

  const handleSuggestionSelect = (keyword: string) => {
    setSearchQuery(keyword)
    addRecentSearch(keyword)
    setShowSuggestions(false)
    setSearchActive(false)
  }

  useEffect(() => {
    setFilter(prev => ({ ...prev, status: activeTab }))
  }, [activeTab, setFilter])

  const siteOptions = useMemo(() => {
    const map = new Map<string, string>()
    ;[...draftWorkLogs, ...approvedWorkLogs].forEach(log => {
      if (!map.has(log.siteId)) {
        map.set(log.siteId, log.siteName)
      }
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [draftWorkLogs, approvedWorkLogs])

  const periodOptions = useMemo(
    () => [
      { id: 'all', label: '전체 기간', months: null as number | null },
      { id: '3m', label: '최근 3개월', months: 3 },
      { id: '6m', label: '최근 6개월', months: 6 },
      { id: '12m', label: '최근 12개월', months: 12 },
    ],
    []
  )

  const applyPeriodFilter = (months: number | null) => {
    if (months === null) {
      setFilter(prev => ({ ...prev, dateFrom: undefined, dateTo: undefined }))
      setPeriodFilterLabel('전체 기간')
      return
    }

    const end = new Date()
    const start = new Date()
    start.setMonth(start.getMonth() - (months - 1))

    const format = (date: Date) => date.toISOString().split('T')[0]

    setFilter(prev => ({ ...prev, dateFrom: format(start), dateTo: format(end) }))
    setPeriodFilterLabel(`최근 ${months}개월`)
  }

  return (
    <MobileLayoutShell>
      <div className="min-h-screen bg-[#F6F9FF]">
        <header className="sticky top-0 z-20 border-b border-[#E6ECF4] bg-white px-4 py-4">
          <div className="flex flex-col gap-1 text-[#1A254F]">
            <h1 className="text-lg font-semibold">작업일지</h1>
            <p className="text-xs text-[#667085]">
              V2 레이아웃 실험 화면입니다. 구조가 확정되면 기존 페이지와 교체됩니다.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm font-medium">
            {TAB_CONFIG.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full border px-4 py-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#31A3FA] bg-[#E7F4FF] text-[#1A254F]'
                    : 'border-transparent bg-transparent text-[#99A4BE] hover:bg-[#F0F4FF]'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-xs text-[#31A3FA]">{tabCounts[tab.id]}</span>
              </button>
            ))}
          </div>
        </header>

        <main className="space-y-5 px-4 py-5">
          <section className="grid gap-3 text-sm md:grid-cols-2">
            <button
              type="button"
              onClick={handleOpenSiteFilter}
              className="flex h-11 items-center justify-between rounded-lg border border-[#D1D5DB] bg-white px-4 text-left text-[#1A254F]"
            >
              <span className="font-medium">{siteFilterLabel}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#99A4BE]"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleOpenPeriodFilter}
              className="flex h-11 items-center justify-between rounded-lg border border-[#D1D5DB] bg-white px-4 text-left text-[#1A254F]"
            >
              <span className="font-medium">{periodFilterLabel}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#99A4BE]"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </section>

          <section className="relative flex items-center gap-2">
            <div className="relative flex flex-1 items-center gap-2 rounded-full border border-[#E6ECF4] bg-white px-4 py-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#99A4BE]"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                value={searchQuery}
                onChange={event => {
                  setSearchQuery(event.target.value)
                  setSearchActive(true)
                  setShowSuggestions(true)
                }}
                onFocus={() => {
                  setSearchActive(true)
                  setShowSuggestions(true)
                  if (suggestionTimeout.current) {
                    clearTimeout(suggestionTimeout.current)
                  }
                }}
                onBlur={() => {
                  if (suggestionTimeout.current) {
                    clearTimeout(suggestionTimeout.current)
                  }
                  suggestionTimeout.current = setTimeout(() => {
                    setShowSuggestions(false)
                    setSearchActive(false)
                  }, 120)
                }}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleSearchSubmit()
                  }
                  if (event.key === 'Escape') {
                    event.preventDefault()
                    handleSearchCancel()
                  }
                }}
                placeholder="작업일지 검색"
                className="h-6 flex-1 border-none bg-transparent text-sm text-[#1A254F] placeholder:text-[#9CA3AF] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="rounded-full bg-[#F3F4F6] p-1 text-[#6B7280] transition-colors hover:bg-[#E5E7EB]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
              {showSuggestions && recentSearches.length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] rounded-2xl border border-[#E6ECF4] bg-white p-3 shadow-[0_16px_40px_rgba(16,24,40,0.12)]">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[#1A254F]">
                    <span>최근 검색어</span>
                    <button
                      type="button"
                      onClick={() => {
                        clearRecentSearches()
                        setShowSuggestions(false)
                      }}
                      className="text-[10px] font-medium text-[#99A4BE] hover:text-[#1A254F]"
                    >
                      전체삭제
                    </button>
                  </div>
                  <div className="space-y-2">
                    {recentSearches.map(keyword => (
                      <button
                        key={keyword}
                        type="button"
                        onMouseDown={event => event.preventDefault()}
                        onClick={() => handleSuggestionSelect(keyword)}
                        className="w-full rounded-xl px-3 py-2 text-left text-xs text-[#1A254F] transition-colors hover:bg-[#F4F6FB]"
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                if (isSearchActive) {
                  handleSearchCancel()
                } else {
                  handleClearFilters()
                }
              }}
              className="h-10 rounded-full px-4 text-sm font-medium text-[#99A4BE] transition-colors hover:bg-[#F3F4F6]"
            >
              {isSearchActive ? '취소' : '초기화'}
            </button>
          </section>

          <section className="space-y-3">
            {loading && (
              <div className="rounded-xl border border-dashed border-[#D1D5DB] bg-white px-4 py-6 text-center text-sm text-[#667085]">
                작업일지를 불러오는 중...
              </div>
            )}

            {error && !loading && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {!loading && !error && currentLogs.length === 0 && (
              <div className="rounded-xl border border-[#E6ECF4] bg-white px-4 py-6 text-center text-sm text-[#667085]">
                {activeTab === 'draft'
                  ? '임시저장된 작업일지가 없습니다.'
                  : '작성완료된 작업일지가 없습니다.'}
              </div>
            )}

            {!loading &&
              !error &&
              currentLogs.map(log => (
                <WorkLogListItem key={log.id} workLog={log} onSelect={handleSelectWorkLog} />
              ))}
          </section>
        </main>

        {isSiteSheetOpen && (
          <div className="fixed inset-0 z-30">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setSiteSheetOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between text-sm font-semibold text-[#1A254F]">
                <span>현장 선택</span>
                <button
                  type="button"
                  onClick={() => {
                    setFilter(prev => ({ ...prev, siteId: undefined }))
                    setSiteFilterLabel('전체 현장')
                    setSiteSheetOpen(false)
                  }}
                  className="text-xs font-medium text-[#0068FE]"
                >
                  전체 선택
                </button>
              </div>
              <div className="max-h-[40vh] space-y-2 overflow-y-auto pb-2">
                {siteOptions.map(site => (
                  <button
                    key={site.id}
                    type="button"
                    onClick={() => {
                      setFilter(prev => ({ ...prev, siteId: site.id }))
                      setSiteFilterLabel(site.name)
                      setSiteSheetOpen(false)
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-[#E6ECF4] px-4 py-3 text-left text-sm text-[#1A254F] transition-colors hover:bg-[#F0F4FF]"
                  >
                    <span className="truncate">{site.name}</span>
                  </button>
                ))}
                {siteOptions.length === 0 && (
                  <p className="rounded-xl border border-dashed border-[#D1D5DB] px-4 py-6 text-center text-xs text-[#99A4BE]">
                    선택 가능한 현장이 없습니다.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {isPeriodSheetOpen && (
          <div className="fixed inset-0 z-30">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setPeriodSheetOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between text-sm font-semibold text-[#1A254F]">
                <span>기간 선택</span>
                <button
                  type="button"
                  onClick={() => {
                    applyPeriodFilter(null)
                    setPeriodSheetOpen(false)
                  }}
                  className="text-xs font-medium text-[#0068FE]"
                >
                  전체 기간
                </button>
              </div>
              <div className="space-y-2">
                {periodOptions.map(option => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      applyPeriodFilter(option.months)
                      setPeriodSheetOpen(false)
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-[#E6ECF4] px-4 py-3 text-left text-sm text-[#1A254F] transition-colors hover:bg-[#F0F4FF]"
                  >
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <WorkLogModal
          isOpen={isModalOpen && Boolean(selectedWorkLog)}
          onClose={() => {
            setModalOpen(false)
            setSelectedWorkLog(null)
          }}
          onSave={async () => {
            // view-only 모드에서는 저장 동작이 발생하지 않음
            return Promise.resolve()
          }}
          workLog={selectedWorkLog ?? undefined}
          mode="view"
        />
      </div>
    </MobileLayoutShell>
  )
}

export default WorkLogHomePageV2
