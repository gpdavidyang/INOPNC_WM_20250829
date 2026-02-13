'use client'

import { Camera } from 'lucide-react'
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
    // if (workDate) params.set('workDate', workDate) -- REMOVED to force manual worklog selection
    return `/mobile/documents?${params.toString()}`
  }, [selectedSite, workDate])

  return (
    <section className={`section ${className}`}>
      <div className="work-form-container home-media-card">
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">사진등록</h3>
          </div>
          <Link
            href={photoMediaHref}
            className="media-cta-button media-btn-photo"
            aria-label="사진 등록"
            prefetch
          >
            <Camera className="media-cta-button__icon" aria-hidden="true" />
            <span>사진 등록</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default PhotoUploadCard
