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
    const workerId = searchParams.get('workerId')
    if (!workerId)
      return NextResponse.json({ success: false, error: 'workerId required' }, { status: 400 })
    const service = createServiceRoleClient()
    const { data, error } = await service
      .from('worker_salary_settings')
      .select(
        'id, worker_id, employment_type, daily_rate, custom_tax_rates, effective_date, is_active, updated_at'
      )
      .eq('worker_id', workerId)
      .order('effective_date', { ascending: false })
    if (error)
      return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 })
    return NextResponse.json({ success: true, data: data || [] })
  } catch (e: any) {
    console.error('GET /admin/payroll/rates/personal/history error:', e)
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
    const action = String(body?.action || '')
    const service = createServiceRoleClient()
    if (action === 'activate') {
      const id = String(body?.id || '')
      const worker_id = String(body?.worker_id || '')
      if (!id || !worker_id)
        return NextResponse.json(
          { success: false, error: 'id, worker_id required' },
          { status: 400 }
        )
      await service
        .from('worker_salary_settings')
        .update({ is_active: false })
        .eq('worker_id', worker_id)
        .eq('is_active', true)
      const { error } = await service
        .from('worker_salary_settings')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error)
        return NextResponse.json({ success: false, error: 'Activate failed' }, { status: 500 })
      return NextResponse.json({ success: true })
    }
    if (action === 'clone') {
      const fromId = String(body?.fromId || '')
      const effective_date = String(body?.effective_date || '')
      if (!fromId || !effective_date)
        return NextResponse.json(
          { success: false, error: 'fromId, effective_date required' },
          { status: 400 }
        )
      const { data: row } = await service
        .from('worker_salary_settings')
        .select('*')
        .eq('id', fromId)
        .maybeSingle()
      if (!row)
        return NextResponse.json({ success: false, error: 'source not found' }, { status: 404 })
      const insertPayload: any = {
        worker_id: row.worker_id,
        employment_type: body?.employment_type || row.employment_type,
        daily_rate: Number(body?.daily_rate ?? row.daily_rate) || 0,
        custom_tax_rates: body?.custom_tax_rates ?? row.custom_tax_rates ?? null,
        effective_date,
        is_active: Boolean(body?.is_active ?? true),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      const { error } = await service.from('worker_salary_settings').insert(insertPayload)
      if (error)
        return NextResponse.json({ success: false, error: 'Clone failed' }, { status: 500 })
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    console.error('POST /admin/payroll/rates/personal/history error:', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
