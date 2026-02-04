'use client'

import type { AdditionalPhotoData } from '@/types/daily-reports'
import { useState } from 'react'
import { buildAdditionalPhotosFromReport } from '../utils/builders'

export const useAdditionalPhotos = (mode: 'create' | 'edit', reportData: any) => {
  const [additionalPhotos, setAdditionalPhotos] = useState<AdditionalPhotoData[]>(() =>
    buildAdditionalPhotosFromReport(mode, reportData)
  )

  return {
    additionalPhotos,
    setAdditionalPhotos,
  }
}
