import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    if (auth.role !== 'admin' && auth.role !== 'system_admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const year = Number(searchParams.get('year'))
    const month = Number(searchParams.get('month'))
    const status = searchParams.get('status') as 'issued' | 'approved' | 'paid' | null
    if (!year || !month) {
      return NextResponse.json({ success: false, error: 'year, month required' }, { status: 400 })
    }

    const service = createServiceRoleClient()
    let count = 0
    let gross = 0
    let deductions = 0
    let net = 0

    try {
      let query = service
        .from('salary_snapshots')
        .select('data_json, status')
        .eq('year', year)
        .eq('month', month)
      if (status) query = query.eq('status', status)
      const { data, error } = await query
      if (!error && Array.isArray(data)) {
        for (const row of data as any[]) {
          const s = row?.data_json?.salary
          if (s) {
            count += 1
            gross += Number(s.total_gross_pay || 0)
            deductions += Number(s.total_deductions || 0)
            net += Number(s.net_pay || 0)
          }
        }
      }
    } catch (e) {
      // ignore when table not present
      void e
    }

    // Fallback: if no DB snapshots found, aggregate by on-the-fly monthly calculation for active workers
    if (count === 0 && gross === 0 && deductions === 0 && net === 0) {
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
        const ymMonth = month
        for (const p of profiles || []) {
          try {
            const monthly = await salaryCalculationService.calculateMonthlySalary(
              p.id as string,
              year,
              ymMonth,
              undefined,
              true
            )
            count += 1
            gross += Number(monthly.total_gross_pay || 0)
            deductions += Number(monthly.total_deductions || 0)
            net += Number(monthly.net_pay || 0)
          } catch (e) {
            void e
          }
        }
      } catch (e) {
        void e
      }
    }

    return NextResponse.json({ success: true, data: { count, gross, deductions, net } })
  } catch (e: any) {
    console.error('GET /admin/payroll/summary error:', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
