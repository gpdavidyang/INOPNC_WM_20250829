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
      .from('salary_calculation_rules')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) {
      // 테이블 없으면 빈 목록
      return NextResponse.json({ success: true, data: { rules: [] } })
    }
    return NextResponse.json({ success: true, data: { rules: data || [] } })
  } catch (e: any) {
    console.error('GET /admin/payroll/rules error:', e)
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
    if (action === 'upsert') {
      const d = body?.data || {}
      const payload = {
        id: d.id,
        rule_name: d.rule_name,
        rule_type: d.rule_type,
        base_amount: d.base_amount,
        multiplier: d.multiplier ?? null,
        is_active: d.is_active ?? true,
        updated_at: new Date().toISOString(),
      }
      const { error } = await service.from('salary_calculation_rules').upsert(payload)
      if (error)
        return NextResponse.json({ success: false, error: 'Upsert failed' }, { status: 500 })
      return NextResponse.json({ success: true })
    }
    if (action === 'delete') {
      const id = body?.id
      if (!id) {
        return NextResponse.json({ success: false, error: 'Rule id required' }, { status: 400 })
      }
      const { error } = await service.from('salary_calculation_rules').delete().eq('id', id)
      if (error)
        return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 })
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    console.error('POST /admin/payroll/rules error:', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
