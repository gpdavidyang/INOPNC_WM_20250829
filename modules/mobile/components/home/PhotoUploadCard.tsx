'use client'

import Link from 'next/link'
import React, { useMemo } from 'react'

interface PhotoUploadCardProps {
  className?: string
}

export const PhotoUploadCard: React.FC<
  PhotoUploadCardProps & { selectedSite?: string; workDate?: string }
> = ({ className = '', selectedSite }) => {
  const photoMediaHref = useMemo(() => {
    const params = new URLSearchParams()
    params.set('tab', 'photo')
    if (selectedSite) params.set('siteId', selectedSite)
    return `/mobile/media?${params.toString()}`
  }, [selectedSite])

  return (
    <section className={`section ${className}`}>
      <div className="work-form-container">
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">사진업로드</h3>
          </div>
          <div className="media-cta-banner" role="note">
            <p className="media-cta-text">사진 도면 관리 페이지로 이동</p>
            <Link
              href={photoMediaHref}
              className="media-cta-button"
              aria-label="사진 탭으로 이동"
              prefetch
            >
              사진 탭 열기
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PhotoUploadCard
