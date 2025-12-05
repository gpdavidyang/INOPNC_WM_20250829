'use client'

import Link from 'next/link'
import React, { useMemo } from 'react'

interface DrawingQuickActionProps {
  className?: string
  selectedSite?: string
  siteName?: string
  userId?: string
}

export const DrawingQuickAction: React.FC<DrawingQuickActionProps> = ({
  className = '',
  selectedSite,
}) => {
  const drawingMediaHref = useMemo(() => {
    const params = new URLSearchParams()
    params.set('tab', 'drawing')
    if (selectedSite) params.set('siteId', selectedSite)
    return `/mobile/media?${params.toString()}`
  }, [selectedSite])

  const drawingCtaHelper = selectedSite
    ? '선택한 현장 필터가 적용된 상태로 도면 탭이 열립니다.'
    : null

  return (
    <section className={`drawing-quick-section ${className}`}>
      <div className="drawing-quick-container">
        <div className="section-header">
          <h3 className="section-title">도면마킹</h3>
        </div>
        <div className="media-cta-banner" role="note">
          <p className="media-cta-text">
            전용 도면 탭에서 파일 업로드, 대표 도면 선택, 마킹 이어하기, 작업일지 연결을 이어서
            진행하세요.
          </p>
          {drawingCtaHelper && <p className="media-cta-helper">{drawingCtaHelper}</p>}
          <Link
            href={drawingMediaHref}
            className="media-cta-button"
            aria-label="도면 탭으로 이동"
            prefetch
          >
            도면 탭 열기
          </Link>
        </div>
      </div>
    </section>
  )
}

export default DrawingQuickAction
