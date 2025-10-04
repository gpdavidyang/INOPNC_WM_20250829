import { NextRequest, NextResponse } from 'next/server'
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
  const { data, error } = await supabase
    .from('worker_salary_settings')
    .select('worker_id, employment_type, daily_rate, custom_tax_rates')
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
  const { worker_id, employment_type, daily_rate, custom_tax_rates, replaceActive } = body || {}
  if (!worker_id)
    return NextResponse.json({ success: false, error: 'worker_id required' }, { status: 400 })
  const supabase = createClient()

  if (replaceActive) {
    await supabase
      .from('worker_salary_settings')
      .update({ is_active: false })
      .eq('worker_id', worker_id)
      .eq('is_active', true)
  }
  const { error } = await supabase.from('worker_salary_settings').insert({
    worker_id,
    employment_type: employment_type || null,
    daily_rate: daily_rate ?? null,
    custom_tax_rates: custom_tax_rates || null,
    is_active: true,
    effective_date: new Date().toISOString().slice(0, 10),
  })
  if (error) return NextResponse.json({ success: false, error: 'Upsert failed' }, { status: 500 })
  return NextResponse.json({ success: true })
}
