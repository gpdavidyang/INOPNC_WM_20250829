'use client'

import React from 'react'

interface SummarySectionProps {
  site: string
  workDate: string
  author: string
  memberTypes: string[]
  workContents: string[]
  workTypes: string[]
  personnelCount: number
  location: {
    block: string
    dong: string
    unit: string
  }
  beforePhotosCount?: number
  afterPhotosCount?: number
  manpower?: number
  drawingCount?: number
}

export const SummarySection: React.FC<SummarySectionProps> = ({
  site,
  workDate,
  author,
  memberTypes,
  workContents,
  workTypes,
  personnelCount,
  location,
  beforePhotosCount = 0,
  afterPhotosCount = 0,
  manpower = 1,
  drawingCount = 0,
}) => {
  const formatLocation = () => {
    const parts = []
    if (location.block) parts.push(`${location.block}`)
    if (location.dong) parts.push(`${location.dong}동`)
    if (location.unit) parts.push(`${location.unit}호`)
    return parts.length > 0 ? parts.join(' / ') : '없음'
  }

  const formatArray = (arr: string[]) => {
    return arr.length > 0 ? arr.join(', ') : '없음'
  }

  return (
    <section className="summary-section">
      <div className="work-form-container">
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">작성 내용 요약</h3>
          </div>
          <div className="summary-grid">
            {/* 현장 (전체 너비) */}
            <div className="summary-item summary-full-width">
              <span className="summary-label">현장:</span>
              <span className="summary-value">{site || '선택 안됨'}</span>
            </div>

            {/* 작업일자, 작성자 (한 행) */}
            <div className="summary-row">
              <div className="summary-item">
                <span className="summary-label">작업일자:</span>
                <span className="summary-value">{workDate}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">작성자:</span>
                <span className="summary-value">{author || '이현수'}</span>
              </div>
            </div>

            {/* 부재명, 작업공정 (한 행) */}
            <div className="summary-row">
              <div className="summary-item">
                <span className="summary-label">부재명:</span>
                <span className="summary-value">{formatArray(memberTypes)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">작업공정:</span>
                <span className="summary-value">{formatArray(workContents)}</span>
              </div>
            </div>

            {/* 작업유형, 출력인원 (한 행) */}
            <div className="summary-row">
              <div className="summary-item">
                <span className="summary-label">작업유형:</span>
                <span className="summary-value">{formatArray(workTypes)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">출력인원:</span>
                <span className="summary-value">{personnelCount}명</span>
              </div>
            </div>

            {/* 블럭/동/호수 (전체 너비) */}
            <div className="summary-item summary-full-width">
              <span className="summary-label">블럭 / 동 / 호수:</span>
              <span className="summary-value">{formatLocation()}</span>
            </div>

            {/* 사진 (전체 너비) */}
            <div className="summary-item summary-full-width">
              <span className="summary-label">사진:</span>
              <span className="summary-value">
                보수 전 {beforePhotosCount}장 / 보수 후 {afterPhotosCount}장
              </span>
            </div>

            {/* 공수, 도면 (한 행) */}
            <div className="summary-row">
              <div className="summary-item">
                <span className="summary-label">공수:</span>
                <span className="summary-value">{manpower}일</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">도면:</span>
                <span className="summary-value">{drawingCount}장</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
