'use client'

import React from 'react'

interface SummarySectionProps {
  site: string
  organization?: string
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
  materials?: Array<{ material_name: string; quantity: number | string; unit?: string }>
  beforePhotosCount?: number
  afterPhotosCount?: number
  manpower?: number
  drawingCount?: number
}

export const SummarySection: React.FC<SummarySectionProps> = ({
  site,
  organization,
  workDate,
  author,
  memberTypes,
  workContents,
  workTypes,
  personnelCount,
  location,
  materials = [],
  beforePhotosCount = 0,
  afterPhotosCount = 0,
  manpower = 1,
  drawingCount = 0,
}) => {
  const [collapsed, setCollapsed] = React.useState(true)

  const formatLocation = () => {
    const parts = []
    if (location.block) parts.push(`${location.block}블럭`)
    if (location.dong) parts.push(`${location.dong}동`)
    if (location.unit) parts.push(`${location.unit}층`)
    return parts.length > 0 ? parts.join(' / ') : '없음'
  }

  const formatArray = (arr: string[]) => {
    if (!arr || arr.length === 0) return '없음'

    const formatted = arr
      .filter(value => value && value.trim() && value !== 'other')
      .map(value => {
        const trimmed = value.trim()
        if (trimmed.startsWith('기타')) {
          const normalized = trimmed.replace(/^기타[:\s]*/, '').trim()
          return `기타: ${normalized}`
        }
        return trimmed
      })

    const uniqueValues = Array.from(new Set(formatted))
    return uniqueValues.length > 0 ? uniqueValues.join(', ') : '없음'
  }

  const formatMaterials = () => {
    if (!materials || materials.length === 0) return '없음'
    const filtered = materials.filter(m => m.material_name)
    if (filtered.length === 0) return '없음'
    return filtered.map(m => `${m.material_name} (${m.quantity}${m.unit || ''})`).join(', ')
  }

  const totalPhotos =
    Math.max(0, Number(beforePhotosCount) || 0) + Math.max(0, Number(afterPhotosCount) || 0)

  return (
    <section className="summary-section">
      <div className="work-form-container">
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">작성 내용 요약</h3>
            <button
              type="button"
              className="summary-toggle ui-pressable"
              aria-label={collapsed ? '작성 내용 요약 펼치기' : '작성 내용 요약 접기'}
              aria-expanded={!collapsed}
              onClick={() => setCollapsed(prev => !prev)}
            >
              <span className="summary-toggle__icon" aria-hidden="true">
                {collapsed ? '︾' : '︿'}
              </span>
            </button>
          </div>
          {!collapsed ? (
            <div className="summary-grid">
              <div className="summary-item summary-full-width">
                <span className="summary-label">현장</span>
                <span className="summary-value">{site || '선택 안됨'}</span>
              </div>
              <div className="summary-item summary-full-width">
                <span className="summary-label">소속</span>
                <span className="summary-value">{organization || '소속사 미지정'}</span>
              </div>
              <div className="summary-item summary-full-width">
                <span className="summary-label">작업일자</span>
                <span className="summary-value">{workDate || '-'}</span>
              </div>
              <div className="summary-item summary-full-width">
                <span className="summary-label">투입인원</span>
                <span className="summary-value">{personnelCount}명</span>
              </div>
              <div className="summary-item summary-full-width">
                <span className="summary-label">부재명</span>
                <span className="summary-value">{formatArray(memberTypes)}</span>
              </div>
              <div className="summary-item summary-full-width">
                <span className="summary-label">작업공정</span>
                <span className="summary-value">{formatArray(workContents)}</span>
              </div>
              <div className="summary-item summary-full-width">
                <span className="summary-label">작업유형</span>
                <span className="summary-value">{formatArray(workTypes)}</span>
              </div>
              <div className="summary-item summary-full-width">
                <span className="summary-label">블럭/동/층</span>
                <span className="summary-value">{formatLocation()}</span>
              </div>
              <div className="summary-item summary-full-width">
                <span className="summary-label">사진/도면 업로드</span>
                <span className="summary-value">
                  사진 {totalPhotos}장, 도면 {drawingCount}건
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
