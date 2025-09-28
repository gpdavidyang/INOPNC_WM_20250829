import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

function getLastMonths(n: number): Array<{ y: number; m: number; label: string }> {
  const out: Array<{ y: number; m: number; label: string }> = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const label = `${y}-${String(m).padStart(2, '0')}`
    out.push({ y, m, label })
  }
  return out
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    if (auth.role !== 'admin' && auth.role !== 'system_admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const months = Math.max(1, Math.min(12, Number(searchParams.get('months') || 3)))
    const targets = getLastMonths(months)
    const service = createServiceRoleClient()

    const agg = new Map<string, { gross: number; deductions: number; net: number; count: number }>()
    for (const t of targets) agg.set(t.label, { gross: 0, deductions: 0, net: 0, count: 0 })

    // Try from snapshots table
    try {
      const minYear = Math.min(...targets.map(t => t.y))
      const maxYear = Math.max(...targets.map(t => t.y))
      const { data, error } = await service
        .from('salary_snapshots')
        .select('year, month, data_json')
        .gte('year', minYear)
        .lte('year', maxYear)

      if (!error && Array.isArray(data)) {
        for (const row of data as any[]) {
          const label = `${row.year}-${String(row.month).padStart(2, '0')}`
          if (!agg.has(label)) continue
          const s = row?.data_json?.salary
          if (s) {
            const a = agg.get(label)!
            a.count += 1
            a.gross += Number(s.total_gross_pay || 0)
            a.deductions += Number(s.total_deductions || 0)
            a.net += Number(s.net_pay || 0)
          }
        }
      }
    } catch (e) {
      // ignore
    }

    // If all zero, fallback to on-the-fly calculation (limited)
    const allZero = Array.from(agg.values()).every(
      v => v.count === 0 && v.gross === 0 && v.deductions === 0 && v.net === 0
    )
    if (allZero) {
      try {
        const { salaryCalculationService } = await import(
          '@/lib/services/salary-calculation.service'
        )
        const { data: profiles } = await service
          .from('profiles')
          .select('id, role, status')
          .in('role', ['worker', 'site_manager'])
          .neq('status', 'inactive')
          .limit(200)
        for (const t of targets) {
          for (const p of profiles || []) {
            try {
              const monthly = await salaryCalculationService.calculateMonthlySalary(
                p.id as string,
                t.y,
                t.m,
                undefined,
                true
              )
              const a = agg.get(t.label)!
              a.count += 1
              a.gross += Number(monthly.total_gross_pay || 0)
              a.deductions += Number(monthly.total_deductions || 0)
              a.net += Number(monthly.net_pay || 0)
            } catch (e) {
              // ignore per-user failure
            }
          }
        }
      } catch (e) {
        // ignore
      }
    }

    const rows = targets.map(t => ({
      month: t.label,
      ...(agg.get(t.label) || { gross: 0, deductions: 0, net: 0, count: 0 }),
    }))
    return NextResponse.json({ success: true, data: rows })
  } catch (e: any) {
    console.error('GET /admin/payroll/summary/trend error:', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
