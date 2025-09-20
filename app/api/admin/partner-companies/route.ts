import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { ADMIN_PARTNER_COMPANIES_STUB } from '@/lib/admin/stub-data'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authResult = await requireApiAuth()

  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { role, restrictedOrgId } = authResult

  if (!role || !['admin', 'system_admin', 'site_manager', 'customer_manager'].includes(role)) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let filtered = ADMIN_PARTNER_COMPANIES_STUB

  if (status && status !== 'all') {
    filtered = filtered.filter((company) => company.status === status)
  }

  if (role === 'customer_manager' && restrictedOrgId) {
    filtered = filtered.filter((company) => company.id === restrictedOrgId)
  }

  return NextResponse.json({
    success: true,
    data: {
      partner_companies: filtered,
      total: filtered.length,
    },
  })
}
