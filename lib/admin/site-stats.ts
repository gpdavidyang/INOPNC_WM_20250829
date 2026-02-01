import { createServiceClient } from '@/lib/supabase/service'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export interface SiteStatsResult {
  daily_reports_count: number
  total_labor_hours: number
}

/**
 * Computes daily report counts and 총공수(공수 단위) for each site id by summing the
 * underlying daily_reports rows. This mirrors the logic used in the site detail screen.
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

  const { data: rows, error } = await supabase
    .from('daily_reports')
    .select('site_id, total_labor_hours, total_workers, work_content')
    .in('site_id', siteIds)

  if (error) {
    console.error('[site-stats] daily_reports query error:', error)
    return stats
  }

  for (const row of rows || []) {
    const sid = String((row as any)?.site_id)
    if (!sid) continue
    if (!stats[sid]) {
      stats[sid] = { daily_reports_count: 0, total_labor_hours: 0 }
    }
    stats[sid].daily_reports_count += 1
    stats[sid].total_labor_hours += calculateReportManDays(row)
  }

  Object.keys(stats).forEach(id => {
    stats[id].total_labor_hours = Number(stats[id].total_labor_hours.toFixed(1))
  })

  return stats
}

export const calculateReportManDays = (row: any): number => {
  const hours = Number(row?.total_labor_hours)
  if (Number.isFinite(hours) && hours > 0) {
    return hours / 8
  }
  const workers = Number(row?.total_workers)
  if (Number.isFinite(workers) && workers > 0) {
    return workers
  }
  return extractManpowerFromContent(row?.work_content)
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

  const workersArray =
    (Array.isArray(parsed?.workers) && parsed.workers) ||
    (Array.isArray(parsed?.worker_entries) && parsed.worker_entries) ||
    []
  if (workersArray.length === 0) return 0

  const totalHours = workersArray.reduce((sum: number, worker: any) => {
    const hours = Number(worker?.hours ?? worker?.labor_hours ?? worker?.work_hours)
    if (Number.isFinite(hours) && hours > 0) {
      return sum + hours
    }
    return sum + 8
  }, 0)

  if (totalHours === 0) return workersArray.length
  return totalHours / 8
}
