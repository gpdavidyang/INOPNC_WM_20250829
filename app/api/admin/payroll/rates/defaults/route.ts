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

    const service = createServiceRoleClient()
    const { data, error } = await service
      .from('employment_tax_rates')
      .select(
        'employment_type, income_tax_rate, pension_rate, health_insurance_rate, employment_insurance_rate'
      )
      .order('employment_type', { ascending: true })

    if (error) {
      // 테이블이 없는 환경일 수 있으므로 가드 세율 반환
      const guard = [
        {
          employment_type: 'regular_employee',
          income_tax_rate: 8,
          pension_rate: 4.5,
          health_insurance_rate: 3.43,
          employment_insurance_rate: 0.9,
        },
        {
          employment_type: 'daily_worker/freelancer',
          income_tax_rate: 3.3,
          pension_rate: 0,
          health_insurance_rate: 0,
          employment_insurance_rate: 0,
        },
      ]
      return NextResponse.json({ success: true, data: guard })
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (e: any) {
    console.error('GET /admin/payroll/rates/defaults error:', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
