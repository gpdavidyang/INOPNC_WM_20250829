import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth
  if (!['admin', 'system_admin'].includes(auth.role || '')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }
  const supabase = createClient()
  const { data, error } = await supabase.from('employment_tax_rates').select('*')
  if (error) return NextResponse.json({ success: false, error: 'Query failed' }, { status: 500 })
  // normalize shape for UI consumption
  const rates = (data || []).reduce((acc: any, r: any) => {
    acc[r.employment_type] = {
      income_tax: r.income_tax_rate,
      national_pension: r.pension_rate,
      health_insurance: r.health_insurance_rate,
      employment_insurance: r.employment_insurance_rate,
    }
    return acc
  }, {})
  return NextResponse.json({ success: true, data: { rates } })
}

export async function PUT(request: Request) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth
  if (!['admin', 'system_admin'].includes(auth.role || '')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }
  try {
    const body = await request.json().catch(() => ({}))
    const {
      employment_type,
      income_tax,
      national_pension,
      health_insurance,
      employment_insurance,
    } = body || {}
    if (!employment_type) {
      return NextResponse.json(
        { success: false, error: 'employment_type required' },
        { status: 400 }
      )
    }
    const supabase = createClient()
    const { error } = await supabase.from('employment_tax_rates').upsert(
      {
        employment_type,
        income_tax_rate: income_tax ?? null,
        pension_rate: national_pension ?? null,
        health_insurance_rate: health_insurance ?? null,
        employment_insurance_rate: employment_insurance ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'employment_type' } as any
    )
    if (error) return NextResponse.json({ success: false, error: 'Upsert failed' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
