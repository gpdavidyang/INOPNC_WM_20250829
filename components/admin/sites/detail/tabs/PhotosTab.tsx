'use client'

import { SitePhotosPanel } from './photos/SitePhotosPanel'

interface PhotosTabProps {
  siteId: string
  siteName?: string
}

export function PhotosTab({ siteId, siteName }: PhotosTabProps) {
  return (
    <div className="mt-4">
      <SitePhotosPanel siteId={siteId} siteName={siteName} />
    </div>
  )
}
