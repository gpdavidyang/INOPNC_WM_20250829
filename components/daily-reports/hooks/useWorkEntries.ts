'use client'

import { useCallback, useState } from 'react'
import type { WorkContentEntry } from '../daily-reports/types'
import { buildWorkEntriesFromReport } from '../daily-reports/utils/builders'

export const useWorkEntries = (mode: 'create' | 'edit', reportData: any) => {
  const [workEntries, setWorkEntries] = useState<WorkContentEntry[]>(() =>
    buildWorkEntriesFromReport(mode, reportData)
  )

  const addWorkEntry = useCallback(() => {
    setWorkEntries(prev => [
      ...prev,
      {
        id: `work-${Date.now()}`,
        memberName: '',
        memberNameOther: '',
        processType: '',
        processTypeOther: '',
        workSection: '',
        workSectionOther: '',
        block: '',
        dong: '',
        floor: '',
        beforePhotos: [],
        afterPhotos: [],
        beforePhotoPreviews: [],
        afterPhotoPreviews: [],
      },
    ])
  }, [])

  const handleRemoveWork = useCallback((id: string) => {
    setWorkEntries(prev => (prev.length > 1 ? prev.filter(e => e.id !== id) : prev))
  }, [])

  return {
    workEntries,
    setWorkEntries,
    addWorkEntry,
    handleRemoveWork,
  }
}
