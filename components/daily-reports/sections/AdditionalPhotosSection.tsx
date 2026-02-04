'use client'

import { Badge } from '@/components/ui/badge'
import type { AdditionalPhotoData } from '@/types/daily-reports'
import { Camera } from 'lucide-react'
import dynamic from 'next/dynamic'
import React from 'react'
import { CollapsibleSection } from '../CollapsibleSection'

// Dynamic import to avoid SSR issues with photo upload
const AdditionalPhotoUploadSection = dynamic(
  () =>
    import('@/components/daily-reports/additional-photo-upload-section').then(
      mod => mod.AdditionalPhotoUploadSection
    ),
  { ssr: false }
)

interface AdditionalPhotosSectionProps {
  photos: AdditionalPhotoData[]
  setPhotos: React.Dispatch<React.SetStateAction<AdditionalPhotoData[]>>
  isExpanded: boolean
  onToggle: () => void
  permissions: any
}

export const AdditionalPhotosSection = ({
  photos,
  setPhotos,
  isExpanded,
  onToggle,
  permissions,
}: AdditionalPhotosSectionProps) => {
  return (
    <CollapsibleSection
      title="추가 사진"
      icon={Camera}
      isExpanded={isExpanded}
      onToggle={onToggle}
      permissions={permissions}
      badge={
        <Badge
          variant="secondary"
          className="bg-slate-50 text-[#1A254F] border-slate-200 font-bold"
        >
          {photos.length}개
        </Badge>
      }
    >
      <AdditionalPhotoUploadSection photos={photos} onPhotosChange={setPhotos} />
    </CollapsibleSection>
  )
}
