import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const serviceClient = createServiceRoleClient()

    const { data, error } = await serviceClient
      .from('sites')
      .select('id, name, status, organization_id')
      .order('name', { ascending: true })

    if (error) {
      console.error('[mobile/sites/list] query error:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch sites' }, { status: 500 })
    }

    const sites = (data ?? []).map(site => ({
      id: site.id,
      name: site.name ?? '이름 없음',
      status: site.status,
      organization_id: site.organization_id,
    }))

    return NextResponse.json({ success: true, data: sites })
  } catch (error) {
    console.error('[mobile/sites/list] unexpected error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
