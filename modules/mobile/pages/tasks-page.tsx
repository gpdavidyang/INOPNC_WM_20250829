'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { MobileLayout } from '@/modules/mobile/components/layout/mobile-layout'
import { useMobileUser } from '@/modules/mobile/hooks/use-mobile-auth'
import { useWorkLogs } from '../hooks/use-work-logs'
import { WorkLog, WorkLogStatus } from '../types/work-log.types'
import { formatMonth, dismissAlert } from '../utils/work-log-utils'
import { WorkLogCard } from '../components/work-log/WorkLogCard'
import { WorkLogSearch } from '../components/work-log/WorkLogSearch'
import { UncompletedBottomSheet } from '../components/work-log/UncompletedBottomSheet'
import { WorkLogModal } from '../components/work-log/WorkLogModal'
import { WorkLogDetailModal } from '../components/work-log/WorkLogDetailModal'

interface TasksPageProps {
  userId?: string
  siteId?: string
  siteName?: string
}

export const TasksPage: React.FC<TasksPageProps> = ({ userId, siteId, siteName }) => {
  const { profile } = useMobileUser()
  const [activeTab, setActiveTab] = useState<'list' | 'uncompleted'>('list')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedWorkLog, setSelectedWorkLog] = useState<WorkLog | null>(null)
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false)

  const {
    workLogs,
    draftWorkLogs,
    approvedWorkLogs,
    uncompletedByMonth,
    loading,
    error,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    createWorkLog,
    updateWorkLog,
    deleteWorkLog,
    approveWorkLog,
  } = useWorkLogs()

  // 미작성 알림 표시 로직
  useEffect(() => {
    if (uncompletedByMonth.length > 0 && !isBottomSheetOpen) {
      setIsBottomSheetOpen(true)
    }
  }, [uncompletedByMonth, isBottomSheetOpen])

  // 탭별 작업일지 목록
  const displayWorkLogs = useMemo(() => {
    if (activeTab === 'uncompleted') {
      return draftWorkLogs
    }
    return workLogs
  }, [activeTab, workLogs, draftWorkLogs])

  // 작업일지 클릭 핸들러
  const handleWorkLogClick = useCallback((workLog: WorkLog) => {
    setSelectedWorkLog(workLog)
    setIsDetailModalOpen(true)
  }, [])

  // 작업일지 편집 핸들러
  const handleEdit = useCallback(() => {
    setIsDetailModalOpen(false)
    setIsEditModalOpen(true)
  }, [])

  // 작업일지 승인 핸들러
  const handleApprove = useCallback(async () => {
    if (selectedWorkLog) {
      await approveWorkLog(selectedWorkLog.id)
      setIsDetailModalOpen(false)
      setSelectedWorkLog(null)
    }
  }, [selectedWorkLog, approveWorkLog])

  // 작업일지 삭제 핸들러
  const handleDelete = useCallback(
    async (id: string) => {
      if (confirm('작업일지를 삭제하시겠습니까?')) {
        await deleteWorkLog(id)
      }
    },
    [deleteWorkLog]
  )

  // 작업일지 저장 핸들러
  const handleSave = useCallback(
    async (workLog: Partial<WorkLog>) => {
      if (selectedWorkLog) {
        // 수정
        await updateWorkLog(selectedWorkLog.id, workLog)
        setIsEditModalOpen(false)
      } else {
        // 생성
        const newWorkLog = await createWorkLog({
          ...workLog,
          siteId: siteId || '',
          siteName: siteName || '',
          status: 'draft',
        } as Omit<WorkLog, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>)
        setIsCreateModalOpen(false)
      }
      setSelectedWorkLog(null)
    },
    [selectedWorkLog, createWorkLog, updateWorkLog, siteId, siteName]
  )

  // 미작성 알림 닫기 핸들러
  const handleDismissAlert = useCallback((month: string) => {
    dismissAlert(month)
    setIsBottomSheetOpen(false)
  }, [])

  // 상태별 카운트
  const draftCount = draftWorkLogs.length
  const approvedCount = approvedWorkLogs.length

  return (
    <MobileLayout
      title="작업일지"
      userRole={profile?.role === 'site_manager' ? 'site_manager' : 'worker'}
    >
      <div className="min-h-screen bg-gray-50">
        {/* 탭 */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 py-3 text-center font-medium transition-colors relative ${
                activeTab === 'list' ? 'text-[#0068FE]' : 'text-gray-500'
              }`}
            >
              작업일지
              {activeTab === 'list' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0068FE]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('uncompleted')}
              className={`flex-1 py-3 text-center font-medium transition-colors relative ${
                activeTab === 'uncompleted' ? 'text-[#0068FE]' : 'text-gray-500'
              }`}
            >
              미작성 ({draftCount})
              {activeTab === 'uncompleted' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0068FE]" />
              )}
              {draftCount > 0 && (
                <span className="absolute top-2 right-1/2 translate-x-12 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* 검색바 및 필터 */}
        <div className="p-4 bg-white border-b border-gray-200">
          <WorkLogSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="현장, 부재명, 작업공정으로 검색..."
          />

          {/* 필터 버튼들 */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setFilter({ ...filter, status: undefined })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !filter.status ? 'bg-[#0068FE] text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setFilter({ ...filter, status: 'draft' })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter.status === 'draft' ? 'bg-[#0068FE] text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              작성중 ({draftCount})
            </button>
            <button
              onClick={() => setFilter({ ...filter, status: 'approved' })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter.status === 'approved'
                  ? 'bg-[#0068FE] text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              승인완료 ({approvedCount})
            </button>
          </div>
        </div>

        {/* 작업일지 목록 */}
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-[#0068FE] border-t-transparent rounded-full" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-500">{error}</p>
            </div>
          ) : displayWorkLogs.length === 0 ? (
            <div className="text-center py-20">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="mx-auto mb-4 text-gray-300"
              >
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                <path d="M13 3v5a2 2 0 002 2h5" />
              </svg>
              <p className="text-gray-500">작업일지가 없습니다</p>
              {activeTab === 'uncompleted' && (
                <p className="text-sm text-gray-400 mt-2">미작성 작업일지가 없습니다</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {displayWorkLogs.map(workLog => (
                <WorkLogCard
                  key={workLog.id}
                  workLog={workLog}
                  onClick={() => handleWorkLogClick(workLog)}
                  onEdit={() => {
                    setSelectedWorkLog(workLog)
                    setIsEditModalOpen(true)
                  }}
                  onDelete={() => handleDelete(workLog.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* 작성 버튼 (FAB) */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#0068FE] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 transition-colors z-20"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {/* 미작성 알림 바텀시트 */}
        <UncompletedBottomSheet
          isOpen={isBottomSheetOpen}
          onClose={() => setIsBottomSheetOpen(false)}
          uncompletedByMonth={uncompletedByMonth}
          onDismiss={handleDismissAlert}
          onNavigate={month => {
            setActiveTab('uncompleted')
            setFilter({
              ...filter,
              dateFrom: `${month}-01`,
              dateTo: `${month}-31`,
            })
            setIsBottomSheetOpen(false)
          }}
        />

        {/* 작업일지 생성/수정 모달 */}
        <WorkLogModal
          isOpen={isCreateModalOpen || isEditModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false)
            setIsEditModalOpen(false)
            setSelectedWorkLog(null)
          }}
          onSave={handleSave}
          workLog={selectedWorkLog}
          siteId={siteId}
          siteName={siteName}
        />

        {/* 작업일지 상세 모달 */}
        <WorkLogDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false)
            setSelectedWorkLog(null)
          }}
          workLog={selectedWorkLog}
          onEdit={handleEdit}
          onApprove={handleApprove}
        />
      </div>
    </MobileLayout>
  )
}
