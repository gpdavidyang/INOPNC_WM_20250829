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
    const { data: rows, error } = await service
      .from('worker_salary_settings')
      .select(
        'worker_id, employment_type, daily_rate, custom_tax_rates, effective_date, is_active, updated_at'
      )
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[personal rates] list error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 })
    }

    const workerIds = Array.from(new Set((rows || []).map(r => r.worker_id).filter(Boolean)))
    let profileMap = new Map<string, any>()
    if (workerIds.length) {
      const { data: profiles } = await service
        .from('profiles')
        .select('id, full_name, email, role')
        .in('id', workerIds)
      profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
    }

    const data = (rows || []).map(r => ({ ...r, profile: profileMap.get(r.worker_id) }))
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    console.error('GET /admin/payroll/rates/personal error:', e)
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
    const worker_id: string = String(body?.worker_id || '')
    const employment_type: string = String(body?.employment_type || '')
    const daily_rate: number = Number(body?.daily_rate || 0)
    const effective_date: string = String(body?.effective_date || '')
    const is_active: boolean = Boolean(body?.is_active)
    const custom_tax_rates = body?.custom_tax_rates || null
    const replaceActive = Boolean(body?.replaceActive)

    if (!worker_id || !employment_type || !effective_date) {
      return NextResponse.json(
        { success: false, error: 'required fields missing' },
        { status: 400 }
      )
    }

    const service = createServiceRoleClient()

    if (replaceActive) {
      await service
        .from('worker_salary_settings')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('worker_id', worker_id)
        .eq('is_active', true)
    }

    const insertPayload: any = {
      worker_id,
      employment_type,
      daily_rate,
      effective_date,
      is_active,
      custom_tax_rates,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error: insertError } = await service
      .from('worker_salary_settings')
      .insert(insertPayload)
    if (insertError) {
      console.error('[personal rates] insert error:', insertError)
      return NextResponse.json({ success: false, error: 'Insert failed' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('POST /admin/payroll/rates/personal error:', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
