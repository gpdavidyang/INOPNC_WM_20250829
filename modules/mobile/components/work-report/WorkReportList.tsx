'use client'

import React from 'react'
import WorkReportCard from './WorkReportCard'
import { WorkReport } from './types'

interface WorkReportListProps {
  reports: WorkReport[]
  loading?: boolean
  onDetailClick: (report: WorkReport) => void
}

export default function WorkReportList({
  reports,
  loading = false,
  onDetailClick,
}: WorkReportListProps) {
  if (loading) {
    return (
      <div className="work-report-list loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>작업일지를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="work-report-list empty">
        <div className="empty-state">
          <p className="empty-message">작업일지가 없습니다.</p>
          <p className="empty-sub-message">새로운 작업일지를 작성해보세요.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="work-report-list">
      {reports.map(report => (
        <WorkReportCard key={report.id} report={report} onDetailClick={onDetailClick} />
      ))}
    </div>
  )
}
