'use client'

import React from 'react'
import { ChevronRight } from 'lucide-react'
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
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">작업일자</span>
            <span className="info-value">{report.workDate}</span>
          </div>

          <div className="info-item">
            <span className="info-label">작성자</span>
            <span className="info-value">{report.author}</span>
          </div>

          <div className="info-item">
            <span className="info-label">건물명</span>
            <span className="info-value">{report.buildingName}</span>
          </div>

          <div className="info-item">
            <span className="info-label">동-호수</span>
            <span className="info-value">
              {report.block}-{report.dong}-{report.ho}
            </span>
          </div>

          <div className="info-item">
            <span className="info-label">부재명</span>
            <span className="info-value">{report.memberType || '-'}</span>
          </div>

          <div className="info-item">
            <span className="info-label">작업공정</span>
            <span className="info-value">{report.workProcess}</span>
          </div>

          <div className="info-item">
            <span className="info-label">작업유형</span>
            <span className="info-value">{report.workType || '-'}</span>
          </div>

          <div className="info-item">
            <span className="info-label">공수</span>
            <span className="info-value">{report.manHours}시간</span>
          </div>

          <div className="info-item">
            <span className="info-label">NPC-1000</span>
            <span className="info-value">
              입고: {report.npcData.inbound} | 사용: {report.npcData.used} | 재고:{' '}
              {report.npcData.stock}
            </span>
          </div>
        </div>
      </div>

      <button className="detail-button" onClick={() => onDetailClick(report)}>
        <span>상세</span>
        <ChevronRight size={20} />
      </button>
    </div>
  )
}
