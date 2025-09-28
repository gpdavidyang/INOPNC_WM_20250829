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
      // 테이블이 없는 환경일 수 있으므로 가드 세율 반환 (3가지로 분리)
      const guard = [
        {
          employment_type: 'freelancer',
          income_tax_rate: 3.3,
          pension_rate: 0,
          health_insurance_rate: 0,
          employment_insurance_rate: 0,
        },
        {
          employment_type: 'daily_worker',
          income_tax_rate: 3.3,
          pension_rate: 0,
          health_insurance_rate: 0,
          employment_insurance_rate: 0,
        },
        {
          employment_type: 'regular_employee',
          income_tax_rate: 8,
          pension_rate: 4.5,
          health_insurance_rate: 3.43,
          employment_insurance_rate: 0.9,
        },
      ]
      return NextResponse.json({ success: true, data: guard })
    }

    // 스키마에 'daily_worker/freelancer' 같이 합쳐진 행이 있으면 분리하여 반환
    const normalized = (data || []).flatMap((it: any) => {
      if (it.employment_type === 'daily_worker/freelancer') {
        const base = {
          income_tax_rate: it.income_tax_rate,
          pension_rate: 0,
          health_insurance_rate: 0,
          employment_insurance_rate: 0,
        }
        return [
          { employment_type: 'freelancer', ...base },
          { employment_type: 'daily_worker', ...base },
        ]
      }
      return [it]
    })

    return NextResponse.json({ success: true, data: normalized })
  } catch (e: any) {
    console.error('GET /admin/payroll/rates/defaults error:', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    if (auth.role !== 'admin' && auth.role !== 'system_admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }
    const body = await request.json()
    const items: Array<{
      employment_type: string
      income_tax_rate: number
      pension_rate: number
      health_insurance_rate: number
      employment_insurance_rate: number
    }> = Array.isArray(body?.items) ? body.items : []
    if (!items.length) {
      return NextResponse.json({ success: false, error: 'items required' }, { status: 400 })
    }

    const service = createServiceRoleClient()
    for (const it of items) {
      try {
        await service.from('employment_tax_rates').upsert(
          {
            employment_type: it.employment_type,
            income_tax_rate: it.income_tax_rate,
            pension_rate: it.pension_rate,
            health_insurance_rate: it.health_insurance_rate,
            employment_insurance_rate: it.employment_insurance_rate,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'employment_type' as any }
        )
      } catch (e) {
        // table 없으면 무시
      }
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('POST /admin/payroll/rates/defaults error:', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
