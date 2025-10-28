import { createServiceClient } from '@/lib/supabase/service'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export interface SiteStatsResult {
  daily_reports_count: number
  total_labor_hours: number
}

/**
 * Computes daily report counts and total 노동 공수 for the provided sites.
 * Attempts to use aggregated analytics tables first, and falls back to raw
 * daily_reports/work_records when the aggregates are unavailable.
 */
export async function computeSiteStats(
  siteIds: string[]
): Promise<Record<string, SiteStatsResult>> {
  if (!Array.isArray(siteIds) || siteIds.length === 0) {
    return {}
  }

  const svc = createServiceRoleClient()
  const supabase = createServiceClient()

  const reportCountMap = new Map<string, number>()
  const laborMap = new Map<string, number>()

  const aggregatedSources: Array<{
    table: string
    reportField: string
    laborField: string
  }> = [
    {
      table: 'analytics_daily_statistics',
      reportField: 'total_reports',
      laborField: 'total_labor_hours',
    },
    {
      table: 'site_daily_report_stats',
      reportField: 'report_count',
      laborField: 'total_labor_hours',
    },
  ]

  let aggregatedHit = false
  for (const source of aggregatedSources) {
    if (aggregatedHit) break
    const { data: rows, error } = await svc
      .from(source.table as any)
      .select(`site_id, ${source.reportField}, ${source.laborField}`)
      .in('site_id', siteIds)

    if (!error && Array.isArray(rows) && rows.length > 0) {
      for (const row of rows) {
        const sid = String((row as any).site_id)
        const reports = Number((row as any)[source.reportField]) || 0
        const labor = Number((row as any)[source.laborField]) || 0
        reportCountMap.set(sid, (reportCountMap.get(sid) || 0) + reports)
        laborMap.set(sid, Number(((laborMap.get(sid) || 0) + labor).toFixed(1)))
      }
      aggregatedHit = true
    } else if (error && error.code !== '42P01') {
      console.warn(`[site-stats] unable to read ${source.table}:`, error)
    }
  }

  const missingReportSites = siteIds.filter(id => (reportCountMap.get(id) || 0) === 0)
  if (missingReportSites.length > 0) {
    const { data: drRows, error: drErr } = await supabase
      .from('daily_reports')
      .select('id, site_id')
      .in('site_id', missingReportSites)

    if (drErr) {
      console.error('[site-stats] daily_reports fallback error:', drErr)
    } else {
      for (const row of drRows || []) {
        const sid = String((row as any).site_id)
        reportCountMap.set(sid, (reportCountMap.get(sid) || 0) + 1)
      }
    }
  }

  const missingLaborSites = siteIds.filter(id => (laborMap.get(id) || 0) === 0)
  if (missingLaborSites.length > 0) {
    const { data: wrRows, error: wrErr } = await supabase
      .from('work_records')
      .select('site_id, labor_hours, work_hours')
      .in('site_id', missingLaborSites)
      .not('daily_report_id', 'is', null)

    if (wrErr) {
      console.error('[site-stats] work_records fallback error:', wrErr)
    } else {
      for (const row of wrRows || []) {
        const sid = String((row as any).site_id)
        const labor = Number((row as any).labor_hours) || 0
        const hours = Number((row as any).work_hours) || 0
        const add = labor > 0 ? labor : hours > 0 ? hours / 8 : 0
        laborMap.set(sid, Number(((laborMap.get(sid) || 0) + add).toFixed(1)))
      }
    }
  }

  const out: Record<string, SiteStatsResult> = {}
  for (const id of siteIds) {
    out[id] = {
      daily_reports_count: reportCountMap.get(id) || 0,
      total_labor_hours: laborMap.get(id) || 0,
    }
  }

  return out
}
