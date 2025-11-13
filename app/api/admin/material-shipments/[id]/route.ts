import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { deleteMaterialShipment } from '@/app/actions/admin/materials'

export const dynamic = 'force-dynamic'

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    if (!['admin', 'system_admin'].includes(auth.role || '')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const id = params.id
    if (!id) {
      return NextResponse.json({ success: false, error: 'Shipment id required' }, { status: 400 })
    }

    const result = await deleteMaterialShipment(id)
    return NextResponse.json(result, { status: result.success ? 200 : 500 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
