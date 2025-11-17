import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth
  if (!['admin', 'system_admin'].includes(auth.role || '')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }
  const supabase = createClient()
  const { data, error } = await supabase
    .from('worker_salary_settings')
    .select('worker_id, employment_type, daily_rate, custom_tax_rates, effective_date, updated_at')
    .eq('is_active', true)
  if (error) return NextResponse.json({ success: false, error: 'Query failed' }, { status: 500 })
  return NextResponse.json({ success: true, data: data || [] })
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth
  if (!['admin', 'system_admin'].includes(auth.role || '')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }
  const body = await request.json().catch(() => ({}))
  const {
    worker_id,
    employment_type,
    daily_rate,
    custom_tax_rates,
    effective_date,
  }: {
    worker_id?: string
    employment_type?: 'freelancer' | 'daily_worker' | 'regular_employee' | null
    daily_rate?: number
    custom_tax_rates?: Record<string, number> | null
    effective_date?: string
  } = body || {}

  if (!worker_id)
    return NextResponse.json({ success: false, error: 'worker_id required' }, { status: 400 })
  if (!employment_type)
    return NextResponse.json({ success: false, error: 'employment_type required' }, { status: 400 })
  if (typeof daily_rate !== 'number' || Number.isNaN(daily_rate)) {
    return NextResponse.json(
      { success: false, error: 'daily_rate must be numeric' },
      { status: 400 }
    )
  }

  const service = createServiceRoleClient()
  const targetDate =
    typeof effective_date === 'string' && effective_date.trim().length > 0
      ? effective_date.trim()
      : new Date().toISOString().split('T')[0]
  const normalizedCustomTax =
    custom_tax_rates && typeof custom_tax_rates === 'object'
      ? Object.entries(custom_tax_rates).reduce<Record<string, number>>((acc, [key, value]) => {
          const trimmedKey = key.trim()
          const num = Number(value)
          if (!trimmedKey || !Number.isFinite(num)) return acc
          acc[trimmedKey] = num
          return acc
        }, {})
      : null

  const { data, error } = await service.rpc('set_worker_salary_setting', {
    p_worker_id: worker_id,
    p_employment_type: employment_type,
    p_daily_rate: daily_rate,
    p_custom_tax_rates: normalizedCustomTax ? JSON.stringify(normalizedCustomTax) : null,
    p_bank_account_info: null,
    p_effective_date: targetDate,
  })

  if (error && error.code !== '23505') {
    console.error('[personal rates] rpc failed:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  if (error && error.code === '23505') {
    const { data: existing } = await service
      .from('worker_salary_settings')
      .select('id')
      .eq('worker_id', worker_id)
      .eq('effective_date', targetDate)
      .maybeSingle()

    if (!existing?.id) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const { error: updateError } = await service
      .from('worker_salary_settings')
      .update({
        employment_type,
        daily_rate,
        custom_tax_rates: normalizedCustomTax,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    if (updateError) {
      console.error('[personal rates] update failed:', updateError)
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: { id: existing.id } })
  }

  return NextResponse.json({ success: true, data })
}
