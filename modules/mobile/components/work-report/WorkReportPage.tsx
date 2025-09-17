'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import WorkReportTabs from './WorkReportTabs'
import WorkReportSearch from './WorkReportSearch'
import WorkReportList from './WorkReportList'
import WorkReportDetailModal from './WorkReportDetailModal'
import DraftCountBottomSheet from './DraftCountBottomSheet'
import { WorkReport, WorkReportStatus } from './types'
import './styles/work-report.css'

export default function WorkReportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // 상태 관리
  const [activeTab, setActiveTab] = useState<WorkReportStatus>('draft')
  const [searchQuery, setSearchQuery] = useState('')
  const [workReports, setWorkReports] = useState<WorkReport[]>([])
  const [filteredReports, setFilteredReports] = useState<WorkReport[]>([])
  const [selectedReport, setSelectedReport] = useState<WorkReport | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [draftCount, setDraftCount] = useState(0)
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  // URL 파라미터로 초기 탭 설정
  useEffect(() => {
    const tab = searchParams.get('tab') as WorkReportStatus
    if (tab && ['draft', 'completed'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // 작업일지 데이터 로드
  useEffect(() => {
    fetchWorkReports()
  }, [activeTab])

  // 임시저장 개수 확인 및 바텀시트 표시
  useEffect(() => {
    checkDraftCount()
  }, [workReports])

  const fetchWorkReports = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: activeTab,
        year: new Date().getFullYear().toString(),
        month: (new Date().getMonth() + 1).toString(),
      })

      const response = await fetch(`/api/mobile/work-reports?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch work reports')
      }

      const data = await response.json()
      setWorkReports(data.reports || [])
      setFilteredReports(data.reports || [])
      setDraftCount(data.draftCount || 0)
    } catch (error) {
      console.error('Failed to fetch work reports:', error)
      // Fallback to empty array on error
      setWorkReports([])
      setFilteredReports([])
    } finally {
      setLoading(false)
    }
  }

  const checkDraftCount = () => {
    const drafts = workReports.filter(r => r.status === 'draft')
    setDraftCount(drafts.length)

    // localStorage 체크하여 바텀시트 표시 여부 결정
    const hideUntil = localStorage.getItem('hideDraftSheet')
    const shouldShow = drafts.length > 0 && (!hideUntil || new Date(hideUntil) < new Date())

    setIsBottomSheetVisible(shouldShow)
  }

  const handleTabChange = (status: WorkReportStatus) => {
    setActiveTab(status)
    router.push(`?tab=${status}`)
    setSearchQuery('') // 탭 변경 시 검색 초기화
  }

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)

      if (query.trim() === '') {
        setFilteredReports(workReports)
      } else {
        const filtered = workReports.filter(report =>
          report.siteName.toLowerCase().includes(query.toLowerCase())
        )
        setFilteredReports(filtered)
      }
    },
    [workReports]
  )

  const handleDetailClick = (report: WorkReport) => {
    if (report.status === 'draft') {
      // 임시저장 → 작업일지 작성 화면으로 이동
      localStorage.setItem('draft_report', JSON.stringify(report))
      router.push(`/mobile/worklog/edit/${report.id}`)
    } else {
      // 작성완료 → 상세보기 모달
      setSelectedReport(report)
      setIsDetailModalOpen(true)
    }
  }

  const handleDismissBottomSheet = () => {
    setIsBottomSheetVisible(false)
  }

  const getDraftCountByMonth = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    const monthlyDrafts = workReports.filter(report => {
      if (report.status !== 'draft') return false
      const reportDate = new Date(report.workDate)
      return reportDate.getFullYear() === year && reportDate.getMonth() + 1 === month
    })

    return {
      year,
      month,
      count: monthlyDrafts.length,
    }
  }

  const monthlyDraftInfo = getDraftCountByMonth()

  return (
    <div className="work-report-container">
      {/* 헤더 */}
      <div className="work-report-header">
        <h1 className="page-title">작업일지</h1>
      </div>

      {/* 탭 메뉴 */}
      <WorkReportTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        draftCount={workReports.filter(r => r.status === 'draft').length}
        completedCount={workReports.filter(r => r.status === 'completed').length}
      />

      {/* 검색바 */}
      <WorkReportSearch value={searchQuery} onSearch={handleSearch} placeholder="현장명으로 검색" />

      {/* 작업일지 리스트 */}
      <WorkReportList
        reports={filteredReports}
        loading={loading}
        onDetailClick={handleDetailClick}
      />

      {/* 상세보기 모달 */}
      {selectedReport && (
        <WorkReportDetailModal
          report={selectedReport}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false)
            setSelectedReport(null)
          }}
        />
      )}

      {/* 임시저장 바텀시트 */}
      {isBottomSheetVisible && (
        <DraftCountBottomSheet
          draftCount={monthlyDraftInfo.count}
          year={monthlyDraftInfo.year}
          month={monthlyDraftInfo.month}
          onDismiss={handleDismissBottomSheet}
        />
      )}
    </div>
  )
}
