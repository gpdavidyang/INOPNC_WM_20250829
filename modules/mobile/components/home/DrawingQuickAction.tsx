'use client'

import Link from 'next/link'
import React, { useMemo } from 'react'

interface DrawingQuickActionProps {
  className?: string
  selectedSite?: string
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

  return (
    <section className={`drawing-quick-section ${className}`}>
      <div className="drawing-quick-container">
        <div className="section-header">
          <h3 className="section-title">도면마킹</h3>
        </div>
        <div className="media-cta-banner" role="note">
          <p className="media-cta-text">도면 업로드·마킹·작업일지 연결을 전용 탭에서 처리하세요.</p>
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
