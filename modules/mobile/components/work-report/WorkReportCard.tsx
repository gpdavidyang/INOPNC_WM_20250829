'use client'

import React from 'react'
import { ChevronRight, Calendar, User, Building } from 'lucide-react'
import { WorkReport } from './types'

interface WorkReportCardProps {
  report: WorkReport
  onDetailClick: (report: WorkReport) => void
}

export default function WorkReportCard({ report, onDetailClick }: WorkReportCardProps) {
  const statusColor = report.status === 'draft' ? '#FF2980' : '#14B8A6'
  const statusText = report.status === 'draft' ? '임시저장' : '작성완료'

  return (
    <div className="work-report-card">
      <div className="card-header">
        <h3 className="site-name">{report.siteName}</h3>
        <span
          className={`status-badge status-badge-${report.status}`}
          style={{ backgroundColor: statusColor }}
        >
          {statusText}
        </span>
      </div>

      <div className="card-content">
        <div className="info-row">
          <Calendar size={16} className="info-icon" />
          <span className="info-text">{report.workDate}</span>
        </div>

        <div className="info-row">
          <User size={16} className="info-icon" />
          <span className="info-text">{report.author}</span>
        </div>

        <div className="info-row">
          <Building size={16} className="info-icon" />
          <span className="info-text">
            {report.buildingName} {report.block}-{report.dong}-{report.ho}
          </span>
        </div>

        <div className="work-info">
          <span className="work-process">{report.workProcess}</span>
          <span className="work-type">{report.workType}</span>
          <span className="man-hours">{report.manHours}시간</span>
        </div>
      </div>

      <button className="detail-button" onClick={() => onDetailClick(report)}>
        <span>상세</span>
        <ChevronRight size={20} />
      </button>
    </div>
  )
}
