'use client'

import Link from 'next/link'
import React, { useMemo } from 'react'

interface PhotoUploadCardProps {
  className?: string
}

export const PhotoUploadCard: React.FC<
  PhotoUploadCardProps & { selectedSite?: string; workDate?: string }
> = ({ className = '', selectedSite, workDate }) => {
  const photoMediaHref = useMemo(() => {
    const params = new URLSearchParams()
    params.set('tab', 'photos')
    params.set('openUploadSheet', '1')
    if (selectedSite) params.set('siteId', selectedSite)
    if (workDate) params.set('workDate', workDate)
    return `/mobile/documents?${params.toString()}`
  }, [selectedSite, workDate])

  return (
    <section className={`section ${className}`}>
      <div className="work-form-container">
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">사진업로드</h3>
          </div>
          <div className="media-cta-banner" role="note">
            <p className="media-cta-text">사진함 이동</p>
            <Link
              href={photoMediaHref}
              className="media-cta-button"
              aria-label="사진함 열기"
              prefetch
            >
              사진함 열기
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PhotoUploadCard
