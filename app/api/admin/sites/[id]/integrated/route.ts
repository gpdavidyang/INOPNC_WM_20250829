import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

// GET /api/admin/sites/:id/integrated
// Minimal integrated overview bundle for the site detail Overview tab
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const siteId = params.id
    if (!siteId)
      return NextResponse.json({ success: false, error: 'Missing site id' }, { status: 400 })

    const svc = createServiceRoleClient()

    const [docsRes, reportsRes, assignsRes, reqsRes] = await Promise.all([
      svc
        .from('unified_document_system')
        .select('id, title, category_type, status, file_url, mime_type, created_at')
        .eq('site_id', siteId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(10),
      svc
        .from('daily_reports')
        .select('id, work_date, status')
        .eq('site_id', siteId)
        .order('work_date', { ascending: false })
        .limit(10),
      svc
        .from('site_assignments')
        .select('id, user_id, role, assigned_date, is_active')
        .eq('site_id', siteId)
        .eq('is_active', true)
        .order('assigned_date', { ascending: false })
        .limit(10),
      svc
        .from('material_requests')
        .select('id, request_number, status, requested_by, request_date, created_at')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    return NextResponse.json({
      success: true,
      data: {
        docs: docsRes.data || [],
        reports: reportsRes.data || [],
        assignments: assignsRes.data || [],
        requests: reqsRes.data || [],
      },
    })
  } catch (e) {
    console.error('[admin/sites/:id/integrated] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
