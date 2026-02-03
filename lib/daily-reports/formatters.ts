import { UnifiedWorkerEntry } from '@/types/daily-reports'

export interface WorkerStatistics {
  total_workers: number
  total_hours: number
  total_overtime: number
  absent_workers: number
  by_trade: Record<string, number>
  by_skill: Record<string, number>
}

export const initialWorkerStats: WorkerStatistics = {
  total_workers: 0,
  total_hours: 0,
  total_overtime: 0,
  absent_workers: 0,
  by_trade: {},
  by_skill: {},
}

/**
 * Maps unified worker entries to summary statistics
 */
export const mapWorkersToStats = (
  workers: Array<UnifiedWorkerEntry | { work_hours?: number; hours?: number }>
): WorkerStatistics => {
  const stats = workers.reduce(
    (acc, worker) => {
      acc.total_workers += 1
      const hours = Number(
        (worker as UnifiedWorkerEntry).hours ?? (worker as any).work_hours ?? (worker as any).hours
      )
      if (Number.isFinite(hours)) {
        acc.total_hours += hours
      }
      return acc
    },
    { ...initialWorkerStats }
  )

  return {
    ...stats,
    total_hours: stats.total_hours > 0 ? Number(stats.total_hours.toFixed(1)) : 0,
  }
}

/**
 * Formats a date string to Korean locale
 */
export const formatDate = (value?: string) => {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('ko-KR')
  } catch {
    return value
  }
}

/**
 * Formats a number to fixed decimal points
 */
export const formatNumber = (value: unknown, fractionDigits = 1) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return '0'
  return num.toFixed(fractionDigits)
}
