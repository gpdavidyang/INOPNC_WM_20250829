'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { MobileLayout } from '@/modules/mobile/components/layout/mobile-layout'
import { useUnifiedAuth as useMobileUser } from '@/hooks/use-unified-auth'
import { WorkLogCard } from '@/modules/mobile/components/work-log/WorkLogCard'
import { WorkLogModal } from '@/modules/mobile/components/work-log/WorkLogModal'
import { WorkLogSearch } from '@/modules/mobile/components/work-log/WorkLogSearch'
import { StickyTabNavigation } from '@/modules/mobile/components/navigation/StickyTabNavigation'
import { useWorkLogs } from '@/modules/mobile/hooks/use-work-logs'
import { useTemporaryWorkLogs } from '@/modules/mobile/hooks/use-temporary-work-logs'
import { WorkLogStatus, WorkLogTabStatus } from '@/modules/mobile/types/work-log.types'
import { SimplifiedBottomSheet } from '@/modules/mobile/components/work-log/UncompletedBottomSheet'
import { TabSystem, TabPanel, type Tab } from '@/modules/mobile/components/ui/TabSystem'
import { Plus, FileText, CheckCircle } from 'lucide-react'

export const WorkLogHomePage: React.FC = () => {
  const { profile } = useMobileUser()
  const [activeTab, setActiveTab] = useState<WorkLogTabStatus>('draft')
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWorkLog, setEditingWorkLog] = useState<any>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
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

  // 급여 관련 상태 제거 - 별도 페이지로 이동

  // 폰트 크기 상태
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal')

  // 급여 계산 관련 함수 제거 - 별도 페이지로 이동

  // 폰트 크기 초기화 및 토글 함수
  useEffect(() => {
    const savedFontSize =
      (localStorage.getItem('inopnc_font_size') as 'normal' | 'large') || 'normal'
    setFontSize(savedFontSize)

    const mainContainer = document.querySelector('main.container')
    if (mainContainer) {
      mainContainer.classList.remove('fs-100', 'fs-150')
      mainContainer.classList.add(savedFontSize === 'normal' ? 'fs-100' : 'fs-150')
    }
  }, []);

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

  // 급여 정보 로드 제거 - 별도 페이지로 이동

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

  // 승인된 작업일지 필터링
  const filteredApprovedWorkLogs = useMemo(() => {
    if (!workLogs || activeTab !== 'approved') return []
    
    return workLogs.filter(workLog => {
      // 상태가 'approved' 또는 'completed'인 작업일지만 필터링
      const isApproved = workLog.status === 'approved' || workLog.status === 'completed'
      
      // 검색 쿼리가 있는 경우 추가 필터링
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = workLog.title?.toLowerCase().includes(query)
        const matchesSite = workLog.siteName?.toLowerCase().includes(query)
        const matchesContent = workLog.workContent?.toLowerCase().includes(query)
        
        return isApproved && (matchesTitle || matchesSite || matchesContent)
      }
      
      return isApproved
    })
  }, [workLogs, activeTab, searchQuery])

  // 작업일지 관련 이벤트 핸들러
  const handleCreateWorkLog = useCallback(() => {
    setEditingWorkLog(null)
    setModalMode('create')
    setIsModalOpen(true)
  }, [])

  const handleEditWorkLog = useCallback((workLog: any) => {
    setEditingWorkLog(workLog)
    setModalMode('edit')
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setEditingWorkLog(null)
  }, [])

  const handleSaveWorkLog = useCallback(async (formData: any) => {
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
  }, [editingWorkLog, updateWorkLog, createWorkLog, handleCloseModal])

  // 작업일지 액션 핸들러들
  const handleSubmitWorkLog = useCallback(async (workLogId: string) => {
    try {
      await updateWorkLog(workLogId, { status: 'completed' })
    } catch (error) {
      console.error('작업일지 제출 실패:', error)
    }
  }, [updateWorkLog]);

  const handleViewWorkLog = useCallback((workLog: any) => {
    setEditingWorkLog(workLog)
    setModalMode('view')
    setIsModalOpen(true)
  }, []);

  const handlePrintWorkLog = useCallback((workLog: any) => {
    // TODO: 인쇄 기능 구현
    // console.log('인쇄:', workLog)
  }, []);

  // Bottom Sheet 핸들러들
  const handleCloseBottomSheet = useCallback(() => {
    setIsBottomSheetVisible(false)
  }, []);

  const handleCreateWorkLogFromBottomSheet = useCallback(() => {
    handleCreateWorkLog()
  }, [handleCreateWorkLog]);

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
  }, []);

  const handleDeleteTemporaryWorkLog = useCallback(async (id: string) => {
    if (confirm('이 임시저장을 삭제하시겠습니까?')) {
      try {
        await deleteTemporaryWorkLog(id)
        // 목록 새로고침은 hook에서 자동으로 처리됨
      } catch (error) {
        console.error('임시저장 삭제 실패:', error)
      }
    }
  }, [deleteTemporaryWorkLog]);

  // 캘린더 네비게이션 함수
  const navigateMonth = useCallback(
    (direction: number) => {
      const newDate = new Date(currentDate)
      newDate.setMonth(newDate.getMonth() + direction)
      setCurrentDate(newDate)
    },
    [currentDate]
  );


  return (
    <div className="worklog-page">
      <style jsx global>{`
        :root {
          --brand: #1A254F;
          --num: #0068FE;
          --bg: #f5f7fb;
          --card: #ffffff;
          --text: #101828;
          --muted: #667085;
          --border: #e0e0e0;
          --shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .dark {
          --bg: #0f172a;
          --card: #1e293b;
          --text: #f1f5f9;
          --muted: #94a3b8;
          --border: #334155;
        }

        .worklog-page {
          font-family: 'Noto Sans KR', system-ui, -apple-system, sans-serif;
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
        {/* Search Section */}
        <div className="search-section mb-4">
          <div className="search-container flex gap-2 items-center">
            <div className="search-input-wrapper flex-1">
              <WorkLogSearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="현장명 검색"
              />
            </div>
            {searchQuery && (
              <button
                className="cancel-btn text-[var(--muted)] px-3 py-2 hover:text-[var(--text)] transition-colors"
                onClick={() => setSearchQuery('')}
              >
                취소
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area with Semantic Tab System */}
        <TabSystem
          tabs={[
            {
              id: 'draft',
              label: '임시저장',
              icon: <FileText size={16} />,
              count: temporaryWorkLogs.length
            },
            {
              id: 'approved',
              label: '작성완료',
              icon: <CheckCircle size={16} />
            }
          ]}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as WorkLogTabStatus)}
          variant="line"
          className="content-wrapper"
        >
          <TabPanel data-panel="draft">
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
                            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md transition-colors button-primary"
                          >
                            불러오기
                          </button>
                          <button
                            onClick={() => handleDeleteTemporaryWorkLog(tempLog.id)}
                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md transition-colors button-primary"
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
          </TabPanel>

          <TabPanel data-panel="approved">
            <div className="space-y-4">
              {/* 작성완료 작업일지 목록 */}
              {filteredApprovedWorkLogs.length > 0 ? (
                filteredApprovedWorkLogs.map(workLog => (
                  <WorkLogCard
                    key={workLog.id}
                    workLog={workLog}
                    onView={() => handleViewWorkLog(workLog)}
                    onPrint={() => handlePrintWorkLog(workLog)}
                  />
                ))
              ) : (
                <div className="empty-state text-center py-16">
                  <div className="empty-icon mb-4">
                    <svg
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="mx-auto text-gray-300"
                    >
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg mb-2">작성완료된 작업일지가 없습니다</p>
                  <p className="text-gray-400 text-sm">
                    {searchQuery
                      ? '검색 조건을 변경해보세요'
                      : '임시저장된 작업일지를 완료해보세요'}
                  </p>
                </div>
              )}
            </div>
          </TabPanel>
        </TabSystem>
        </div>

        {/* Floating Action Button */}
        <button
          onClick={handleCreateWorkLog}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#0068FE] hover:bg-blue-600 active:scale-95 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 z-50 button-ripple"
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
            mode={modalMode}
          />
        )}

        {/* Simplified Bottom Sheet for Temporary Work Logs */}
        <SimplifiedBottomSheet
          temporaryWorkLogs={temporaryWorkLogs}
          isVisible={isBottomSheetVisible}
          onClose={handleCloseBottomSheet}
          onCreateWorkLog={handleCreateWorkLogFromBottomSheet}
        />

    </div>
  )
}
