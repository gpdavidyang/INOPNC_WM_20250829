'use client'

import type { Profile } from '@/types'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { WorkerEntry } from '../types'
import { buildWorkerEntriesFromReport } from '../utils/builders'

export const useWorkerEntries = (
  mode: 'create' | 'edit',
  reportData: any,
  workers: Profile[],
  canManageWorkers: boolean,
  coerceLaborHourValue: (val: unknown) => number,
  isAllowedLaborHourValue: (val: number) => boolean,
  defaultLaborHour: number
) => {
  const [workerEntries, setWorkerEntries] = useState<WorkerEntry[]>(() =>
    buildWorkerEntriesFromReport(
      mode,
      reportData,
      canManageWorkers,
      coerceLaborHourValue,
      defaultLaborHour
    )
  )

  // Ensure laborer entries have valid labor hours when defaultLaborHour changes
  useEffect(() => {
    setWorkerEntries(prev =>
      prev.map(entry =>
        isAllowedLaborHourValue(entry.labor_hours)
          ? entry
          : { ...entry, labor_hours: defaultLaborHour }
      )
    )
  }, [isAllowedLaborHourValue, defaultLaborHour])

  // Resolve worker IDs by name matching when workers list loads
  useEffect(() => {
    if (!workers.length || !workerEntries.length) return
    setWorkerEntries(prev => {
      let changed = false
      const next = prev.map(entry => {
        if (entry.worker_id || entry.is_direct_input) return entry
        const match = workers.find(
          w =>
            w.full_name?.trim() === entry.worker_name?.trim() ||
            w.name?.trim() === entry.worker_name?.trim()
        )
        if (match) {
          changed = true
          return { ...entry, worker_id: match.id }
        }
        return entry
      })
      return changed ? next : prev
    })
  }, [workers, workerEntries.length])

  const totalLaborHours = useMemo(
    () =>
      workerEntries.reduce((sum, entry) => {
        const value = Number(entry.labor_hours || 0)
        return Number.isFinite(value) ? sum + value : sum
      }, 0),
    [workerEntries]
  )

  const addWorkerEntry = useCallback(() => {
    setWorkerEntries(prev => [
      ...prev,
      {
        id: `worker-${Date.now()}`,
        worker_id: '',
        labor_hours: defaultLaborHour,
        worker_name: '',
        is_direct_input: false,
      },
    ])
  }, [defaultLaborHour])

  const handleRemoveWorker = useCallback((id: string) => {
    setWorkerEntries(prev => (prev.length > 1 ? prev.filter(e => e.id !== id) : prev))
  }, [])

  return {
    workerEntries,
    setWorkerEntries,
    totalLaborHours,
    addWorkerEntry,
    handleRemoveWorker,
  }
}
