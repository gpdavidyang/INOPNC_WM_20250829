import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { updateShipmentDeliveryMethod } from '@/app/actions/admin/materials'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    if (!['admin', 'system_admin', 'site_manager'].includes(auth.role || '')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const id = params.id
    const body = await request.json().catch(() => ({}))
    const rawMethod = String(body?.method || '')
    if (!id || !rawMethod) {
      return NextResponse.json({ success: false, error: 'id and method required' }, { status: 400 })
    }

    const res = await updateShipmentDeliveryMethod(id, rawMethod)
    return NextResponse.json(res, { status: res.success ? 200 : 500 })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
