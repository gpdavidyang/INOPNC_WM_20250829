import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { listSites } from '@/lib/api/adapters/site'
import type { ListSitesRequest } from '@/lib/api/contracts/site'
import { createSite } from '@/app/actions/admin/sites'
import { sanitizeSitePayload } from './helpers'

export const dynamic = 'force-dynamic'

// GET /api/admin/sites
// Query: page, limit, search, status, sort, direction
export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const supabase = createClient()

    // Admin/system_admin only
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', auth.userId)
      .maybeSingle()

    if (!profile || !['admin', 'system_admin'].includes((profile as any).role || '')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const req: ListSitesRequest = {
      page: Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1),
      pageSize: Math.max(1, Number.parseInt(searchParams.get('limit') || '20', 10) || 20),
      q: (searchParams.get('search') || '').trim() || undefined,
      status: (searchParams.get('status') || '').trim() || undefined,
      sort: (searchParams.get('sort') || 'created_at').trim(),
      direction: (searchParams.get('direction') || 'desc').trim() as 'asc' | 'desc',
      includeDeleted: ['1', 'true', 'yes'].includes(
        (searchParams.get('include_deleted') || '').toLowerCase()
      ),
      onlyDeleted: ['1', 'true', 'yes'].includes(
        (searchParams.get('only_deleted') || '').toLowerCase()
      ),
    }

    const result = await listSites(req)
    const pages = Math.max(1, Math.ceil(result.total / req.pageSize))

    return NextResponse.json({
      success: true,
      data: {
        sites: result.items,
        total: result.total,
        pages,
      },
    })
  } catch (e) {
    console.error('[admin/sites] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/sites
// Body: CreateSiteData
export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const supabase = createClient()

    // Admin/system_admin only
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', auth.userId)
      .maybeSingle()

    if (!profile || !['admin', 'system_admin'].includes((profile as any).role || '')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const rawPayload = await request.json().catch(() => null)
    if (!rawPayload || typeof rawPayload !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
    }

    const payload = sanitizeSitePayload(rawPayload)
    const result = await createSite(payload)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error ?? 'Failed to create site' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: result.message ?? 'Created',
    })
  } catch (e) {
    console.error('[admin/sites][POST] error:', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
