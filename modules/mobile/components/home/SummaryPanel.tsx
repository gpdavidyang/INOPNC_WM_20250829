'use client'

import React from 'react'
import { WorkLogLocation, WorkSection, AdditionalManpower } from '@/types/worklog'

interface SummaryPanelProps {
  selectedSite: string
  workDate: string
  department: string
  location: WorkLogLocation
  memberTypes: string[]
  workTypes: string[]
  mainManpower: number
  workSections: WorkSection[]
  additionalManpower: AdditionalManpower[]
  workContents: string[]
  beforePhotosCount: number
  afterPhotosCount: number
  receiptsCount: number
  drawingsCount: number
  className?: string
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({
  selectedSite,
  workDate,
  department,
  location,
  memberTypes,
  workTypes,
  mainManpower,
  workSections,
  additionalManpower,
  workContents,
  beforePhotosCount,
  afterPhotosCount,
  receiptsCount,
  drawingsCount,
  className = '',
}) => {
  // 총 공수 계산
  const totalManpower =
    mainManpower + additionalManpower.reduce((sum, item) => sum + item.manpower, 0)

  // 작업자 목록
  const workers = [
    { name: '작성자', manpower: mainManpower },
    ...additionalManpower.map(item => ({
      name: item.workerName || '미지정',
      manpower: item.manpower,
    })),
  ].filter(w => w.manpower > 0)

  return (
    <div className={`summary-panel card p-5 ${className}`}>
      <div className="section-header mb-4">
        <h3 className="section-title">작업 요약</h3>
        <span className="important-tag">제출 전 확인</span>
      </div>

      <div className="summary-grid">
        {/* 기본 정보 */}
        <div className="summary-section">
          <h4 className="summary-subtitle">기본 정보</h4>
          <div className="summary-row">
            <span className="summary-label">작업일자</span>
            <span className="summary-value">{workDate || '미입력'}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">부서</span>
            <span className="summary-value">{department || '미선택'}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">현장</span>
            <span className="summary-value">{selectedSite || '미선택'}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">위치</span>
            <span className="summary-value">
              {location.block || location.dong || location.unit
                ? `${location.block}블럭 ${location.dong}동 ${location.unit}호`
                : '미입력'}
            </span>
          </div>
        </div>

        {/* 작업 내용 */}
        <div className="summary-section">
          <h4 className="summary-subtitle">작업 내용</h4>
          <div className="summary-row">
            <span className="summary-label">부재명</span>
            <span className="summary-value">
              {memberTypes.length > 0 ? memberTypes.join(', ') : '미선택'}
            </span>
          </div>
          <div className="summary-row">
            <span className="summary-label">작업 내용</span>
            <span className="summary-value">
              {workContents.length > 0 ? workContents.join(', ') : '미입력'}
            </span>
          </div>
          <div className="summary-row">
            <span className="summary-label">작업유형</span>
            <span className="summary-value">
              {workTypes.length > 0 ? workTypes.join(', ') : '미선택'}
            </span>
          </div>
          {workSections.length > 0 && (
            <div className="summary-row">
              <span className="summary-label">작업구간</span>
              <div className="summary-list">
                {workSections.map((section, idx) => (
                  <div key={section.id} className="summary-item">
                    {idx + 1}. {section.type} - {section.name || '미입력'}
                    {section.location.block && (
                      <span className="summary-location">
                        ({section.location.block}블럭 {section.location.dong}동{' '}
                        {section.location.unit}호)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 공수 정보 */}
        <div className="summary-section">
          <h4 className="summary-subtitle">공수 정보</h4>
          <div className="summary-row">
            <span className="summary-label">총 공수</span>
            <span className="summary-value highlight">{totalManpower}일</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">작업자별</span>
            <div className="summary-list">
              {workers.map((worker, idx) => (
                <div key={idx} className="summary-item">
                  {worker.name}: {worker.manpower}일
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 첨부 파일 */}
        <div className="summary-section">
          <h4 className="summary-subtitle">첨부 파일</h4>
          <div className="summary-row">
            <span className="summary-label">사진(전)</span>
            <span className="summary-value">{beforePhotosCount}개</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">사진(후)</span>
            <span className="summary-value">{afterPhotosCount}개</span>
          </div>
          {receiptsCount > 0 && (
            <div className="summary-row">
              <span className="summary-label">영수증</span>
              <span className="summary-value">{receiptsCount}개</span>
            </div>
          )}
          {drawingsCount > 0 && (
            <div className="summary-row">
              <span className="summary-label">도면</span>
              <span className="summary-value">{drawingsCount}개</span>
            </div>
          )}
        </div>
      </div>

      {/* 제출 확인 메시지 */}
      <div className="summary-footer">
        <div className="summary-message">
          <span className="check-icon">✓</span>위 내용이 정확한지 확인하고 제출해주세요.
        </div>
      </div>
    </div>
  )
}

export default SummaryPanel
