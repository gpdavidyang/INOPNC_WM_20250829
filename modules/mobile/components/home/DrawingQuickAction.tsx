'use client'

import { ScanLine } from 'lucide-react'
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
        <Link
          href={drawingMediaHref}
          className="media-cta-button media-btn-drawing"
          aria-label="도면마킹 열기"
          prefetch
        >
          <ScanLine className="media-cta-button__icon" aria-hidden="true" />
          <span>도면마킹</span>
        </Link>
      </div>
    </section>
  )
}

export default DrawingQuickAction
