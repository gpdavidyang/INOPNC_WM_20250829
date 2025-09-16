'use client'

import React, { useState, useEffect } from 'react'
import { MobileLayout } from '@/modules/mobile/components/layout/mobile-layout'
import { useMobileUser } from '@/modules/mobile/hooks/use-mobile-auth'
import { WorkLogCard } from '@/modules/mobile/components/work-log/WorkLogCard'
import { WorkLogModal } from '@/modules/mobile/components/work-log/WorkLogModal'
import { WorkLogSearch } from '@/modules/mobile/components/work-log/WorkLogSearch'
import { useWorkLogs } from '@/modules/mobile/hooks/use-work-logs'
import { WorkLogStatus } from '@/modules/mobile/types/work-log.types'
import { Plus } from 'lucide-react'

export const WorkLogHomePage: React.FC = () => {
  const { profile } = useMobileUser()
  const [activeTab, setActiveTab] = useState<WorkLogStatus>('draft')
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWorkLog, setEditingWorkLog] = useState<any>(null)

  // 작업일지 데이터 가져오기
  const { workLogs, loading, error, createWorkLog, updateWorkLog, deleteWorkLog } = useWorkLogs({
    status: activeTab,
    searchQuery: searchQuery || undefined,
  })

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

  return (
    <MobileLayout
      title=""
      userRole={profile?.role === 'site_manager' ? 'site_manager' : 'worker'}
      showNotification={false}
    >
      <div className="min-h-screen bg-[#f5f7fb] worklog-body fs-100">
        {/* Tab Navigation - HTML Reference line-tabs Style */}
        <div className="line-tabs">
          <button
            onClick={() => setActiveTab('draft')}
            className={`line-tab ${activeTab === 'draft' ? 'active' : ''}`}
          >
            작성중
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`line-tab ${activeTab === 'approved' ? 'active' : ''}`}
          >
            승인완료
          </button>
        </div>

        {/* Search Section */}
        <div className="px-4 py-3">
          <WorkLogSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="현장명으로 검색"
          />
        </div>

        {/* Work Log Cards List */}
        <div className="px-4 pb-20">
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
              <p className="text-gray-500 text-lg mb-2">
                {activeTab === 'draft' ? '작성중인' : '승인완료된'} 작업일지가 없습니다
              </p>
              <p className="text-gray-400 text-sm">
                {searchQuery ? '검색 조건을 변경해보세요' : '새 작업일지를 작성해보세요'}
              </p>
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
