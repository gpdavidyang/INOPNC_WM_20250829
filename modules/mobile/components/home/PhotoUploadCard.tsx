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

  const photoCtaHelper = selectedSite
    ? '선택한 현장 필터가 적용된 상태로 사진 탭이 열립니다.'
    : null

  return (
    <section className={`section ${className}`}>
      <div className="work-form-container">
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">사진업로드</h3>
          </div>
          <div className="media-cta-banner" role="note">
            <p className="media-cta-text">
              전용 사진 탭에서 보수 전/후 업로드와 작업일지 연결을 한 번에 처리하세요.
            </p>
            {photoCtaHelper && <p className="media-cta-helper">{photoCtaHelper}</p>}
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
