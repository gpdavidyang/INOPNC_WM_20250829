import { createServiceClient } from '@/lib/supabase/service'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export interface SiteStatsResult {
  daily_reports_count: number
  total_labor_hours: number
}

/**
 * Computes daily report counts and 총공수(공수 단위) for each site id by summing the
 * underlying daily_reports rows.
 *
 * IMPORTANT: total_labor_hours in DB is stored in HOURS unit.
 * To convert to man-days (공수): hours / 8 = man-days
 * Example: 8 hours = 1.0 공수, 16 hours = 2.0 공수
 */
export async function computeSiteStats(
  siteIds: string[]
): Promise<Record<string, SiteStatsResult>> {
  if (!Array.isArray(siteIds) || siteIds.length === 0) {
    return {}
  }

  const supabase = (() => {
    try {
      return createServiceRoleClient()
    } catch {
      return createServiceClient()
    }
  })()

  const stats: Record<string, SiteStatsResult> = {}
  siteIds.forEach(id => {
    stats[id] = {
      daily_reports_count: 0,
      total_labor_hours: 0,
    }
  })

  // Batch query with basic counts and totals
  const { data: rows, error } = await supabase
    .from('daily_reports')
    .select('site_id, total_labor_hours')
    .in('site_id', siteIds)
    .eq('is_deleted', false)

  if (error) {
    console.error('[site-stats] daily_reports query error:', error)
    return stats
  }

  // Aggregate in memory
  for (const row of rows || []) {
    const sid = String((row as any)?.site_id)
    if (!sid || !stats[sid]) continue

    stats[sid].daily_reports_count += 1

    // Complex labor calculation logic remains same for accuracy but input is minimized
    stats[sid].total_labor_hours += calculateReportManDays(row)
  }

  Object.keys(stats).forEach(id => {
    stats[id].total_labor_hours = Number(stats[id].total_labor_hours.toFixed(1))
  })

  return stats
}

export const calculateReportManDays = (row: any): number => {
  // 1. Try extracting from work_content (Most reliable source of truth)
  // This JSON contains the original input values (either man-days or hours)
  const contentManDays = extractManpowerFromContent(row?.work_content)
  if (contentManDays > 0) {
    return contentManDays
  }

  // 2. Fallback to total_labor_hours column (Data may be mixed units)
  const val = Number(row?.total_labor_hours)
  if (Number.isFinite(val) && val > 0) {
    // Heuristic:
    // - Legacy data (hours): migration set values like 8, 16, 24 (min 8 for 1 person)
    // - New data (man-days): values like 0.5, 1.0, 1.5, 2.0
    // If value >= 8, assume it's HOURS (legacy) and divide by 8
    // If value < 8, assume it's MAN-DAYS (new) and use as is
    // Note: If new data has >8 man-days (e.g. big team), work_content would have caught it in step 1.
    return val >= 8 ? val / 8 : val
  }

  // 3. Fallback to worker count
  const workers = Number(row?.total_workers)
  if (Number.isFinite(workers) && workers > 0) {
    return workers
  }

  return 0
}

export const extractManpowerFromContent = (raw: unknown): number => {
  if (!raw) return 0
  let parsed: any = raw
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = null
    }
  }
  if (!parsed || typeof parsed !== 'object') return 0

  const direct = Number(parsed?.totalManpower || parsed?.total_manpower)
  if (Number.isFinite(direct) && direct > 0) return direct

  // Check for 'workers' or 'worker_entries' array
  const workersArray =
    (Array.isArray(parsed?.workers) && parsed.workers) ||
    (Array.isArray(parsed?.worker_entries) && parsed.worker_entries) ||
    []

  if (workersArray.length === 0) return 0

  const totalManDays = workersArray.reduce((sum: number, worker: any) => {
    // 1. New data format: 'labor_hours' (Man-Days unit, e.g. 1.0)
    // Recent daily report forms save 'labor_hours' in the JSON.
    if (worker?.labor_hours !== undefined) {
      const val = Number(worker.labor_hours)
      return Number.isFinite(val) ? sum + val : sum
    }

    // 2. Legacy data format: 'hours' or 'work_hours' (Hours unit, e.g. 8)
    const hours = Number(worker?.hours ?? worker?.work_hours)
    if (Number.isFinite(hours) && hours > 0) {
      return sum + hours / 8
    }

    // 3. Fallback: 1 Man-Day per worker if no time info
    return sum + 1
  }, 0)

  return totalManDays
}
