'use client'

import Link from 'next/link'
import React, { useMemo } from 'react'

interface DrawingQuickActionProps {
  className?: string
  selectedSite?: string
  workDate?: string
}

export const DrawingQuickAction: React.FC<DrawingQuickActionProps> = ({
  className = '',
  selectedSite,
  workDate,
}) => {
  const drawingMediaHref = useMemo(() => {
    const params = new URLSearchParams()
    params.set('tab', 'drawing')
    params.set('sheet', 'upload')
    if (selectedSite) params.set('siteId', selectedSite)
    if (workDate) params.set('workDate', workDate)
    return `/mobile/documents?${params.toString()}`
  }, [selectedSite, workDate])

  return (
    <section className={`drawing-quick-section ${className}`}>
      <div className="drawing-quick-container">
        <div className="section-header">
          <h3 className="section-title">도면마킹</h3>
        </div>
        <div className="media-cta-banner" role="note">
          <p className="media-cta-text">도면함 이동</p>
          <Link
            href={drawingMediaHref}
            className="media-cta-button"
            aria-label="도면 업로드 열기"
            prefetch
          >
            도면 업로드
          </Link>
        </div>
      </div>
    </section>
  )
}

export default DrawingQuickAction
