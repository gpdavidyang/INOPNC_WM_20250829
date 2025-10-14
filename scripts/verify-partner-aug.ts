#!/usr/bin/env tsx
import { createServiceRoleClient } from '@/lib/supabase/service-role'

type DateKey = string

async function main() {
  const year = 2025
  const month = 8
  const fmt = (d: Date) => {
    const yy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yy}-${mm}-${dd}`
  }
  const startDate = fmt(new Date(year, month - 1, 1))
  const endDate = fmt(new Date(year, month, 0))

  const siteIds = (
    process.env.SITES || '7160ea44-b7f6-43d1-a4a2-a3905d5da9d2,11111111-1111-1111-1111-111111111111'
  )
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  const supabase = createServiceRoleClient()

  const { data: wr } = await supabase
    .from('work_records')
    .select('site_id, work_date, labor_hours, work_hours, user_id')
    .in('site_id', siteIds)
    .gte('work_date', startDate)
    .lte('work_date', endDate)

  const wrCounts = new Map<DateKey, Map<string, number>>()
  const wrManDays = new Map<DateKey, Map<string, number>>()
  for (const r of wr || []) {
    const d = (r as any).work_date as string
    const sid = (r as any).site_id as string
    if (!d || !sid) continue
    if (!wrCounts.has(d)) wrCounts.set(d, new Map())
    if (!wrManDays.has(d)) wrManDays.set(d, new Map())
    wrCounts.get(d)!.set(sid, (wrCounts.get(d)!.get(sid) || 0) + 1)
    const wh = Number((r as any).work_hours) || 0
    const lh = Number((r as any).labor_hours) || 0
    const md = lh > 0 ? lh : wh > 0 ? wh / 8 : 0
    wrManDays.get(d)!.set(sid, (wrManDays.get(d)!.get(sid) || 0) + md)
  }

  const { data: dr } = await supabase
    .from('daily_reports')
    .select('site_id, work_date, worker_assignments(id, labor_hours)')
    .in('site_id', siteIds)
    .gte('work_date', startDate)
    .lte('work_date', endDate)

  const drCounts = new Map<DateKey, Map<string, number>>()
  const drManDays = new Map<DateKey, Map<string, number>>()
  for (const rep of dr || []) {
    const d = (rep as any).work_date as string
    const sid = (rep as any).site_id as string
    if (!d || !sid) continue
    const wa = Array.isArray((rep as any).worker_assignments) ? (rep as any).worker_assignments : []
    if (!drCounts.has(d)) drCounts.set(d, new Map())
    if (!drManDays.has(d)) drManDays.set(d, new Map())
    drCounts.get(d)!.set(sid, (drCounts.get(d)!.get(sid) || 0) + wa.length)
    let md = 0
    for (const a of wa) {
      const v = Number((a as any).labor_hours || 0)
      md += v > 0 ? v : 1
    }
    drManDays.get(d)!.set(sid, (drManDays.get(d)!.get(sid) || 0) + md)
  }

  const allDates = new Set<DateKey>([
    ...Array.from(wrCounts.keys()),
    ...Array.from(drCounts.keys()),
  ])

  const outPerDate: any[] = []
  let totalWrCount = 0,
    totalWrMD = 0,
    totalDrCount = 0,
    totalDrMD = 0,
    totalCombCount = 0,
    totalCombMD = 0

  for (const d of Array.from(allDates).sort()) {
    const sites: any[] = []
    for (const sid of siteIds) {
      const wrC = wrCounts.get(d)?.get(sid) || 0
      const drC = drCounts.get(d)?.get(sid) || 0
      const wrMD = Number((wrManDays.get(d)?.get(sid) || 0).toFixed(2))
      const drMD = Number((drManDays.get(d)?.get(sid) || 0).toFixed(2))
      const cC = Math.max(wrC, drC)
      const cMD = Number(Math.max(wrMD, drMD).toFixed(2))
      if (wrC || drC || wrMD || drMD || cC || cMD) {
        sites.push({ date: d, site_id: sid, wrC, drC, cC, wrMD, drMD, cMD })
      }
      totalWrCount += wrC
      totalWrMD += wrMD
      totalDrCount += drC
      totalDrMD += drMD
      totalCombCount += cC
      totalCombMD += cMD
    }
    if (sites.length) outPerDate.push({ date: d, sites })
  }

  const perSite: Record<
    string,
    { wrC: number; drC: number; cC: number; wrMD: number; drMD: number; cMD: number }
  > = {}
  for (const sid of siteIds) perSite[sid] = { wrC: 0, drC: 0, cC: 0, wrMD: 0, drMD: 0, cMD: 0 }
  for (const row of outPerDate) {
    for (const s of row.sites) {
      const acc = perSite[s.site_id]
      acc.wrC += s.wrC
      acc.drC += s.drC
      acc.cC += s.cC
      acc.wrMD += s.wrMD
      acc.drMD += s.drMD
      acc.cMD += s.cMD
    }
  }

  const result = {
    year,
    month,
    startDate,
    endDate,
    perDate: outPerDate,
    perSite,
    totals: {
      work_records: { workers: totalWrCount, manDays: Number(totalWrMD.toFixed(2)) },
      daily_reports: { workers: totalDrCount, manDays: Number(totalDrMD.toFixed(2)) },
      combined: { workers: totalCombCount, manDays: Number(totalCombMD.toFixed(2)) },
    },
  }

  console.log(JSON.stringify(result, null, 2))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
