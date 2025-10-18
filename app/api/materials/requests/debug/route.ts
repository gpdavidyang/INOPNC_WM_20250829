export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function GET() {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('material_requests')
    .select('id, site_id, request_number, status, created_at, notes')
    .order('created_at', { ascending: false })
    .limit(10)
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, rows: data || [] })
}
