import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) {
    return auth
  }

  const searchParams = request.nextUrl.searchParams
  const siteId = searchParams.get('site_id') || searchParams.get('siteId')
  if (!siteId) {
    return NextResponse.json({ success: false, error: 'site_id is required' }, { status: 400 })
  }

  let supabaseInstance
  try {
    supabaseInstance = createServiceRoleClient()
  } catch {
    supabaseInstance = createClient()
  }

  try {
    const { data, error } = await supabaseInstance
      .from('markup_documents')
      .select(
        'id, title, site_id, preview_image_url, original_blueprint_url, original_blueprint_filename, created_at, updated_at, markup_count'
      )
      .eq('is_deleted', false)
      .eq('site_id', siteId)
      .is('linked_worklog_id', null)
      .order('updated_at', { ascending: false })
      .limit(50)

    if (error) {
      throw error
    }

    const ids =
      data
        ?.map(row => (typeof row?.id === 'string' ? row.id : null))
        .filter((id): id is string => Boolean(id)) || []

    let linkedIds = new Set<string>()
    if (ids.length > 0) {
      const { data: links } = await supabaseInstance
        .from('markup_document_worklog_links')
        .select('markup_document_id')
        .in('markup_document_id', ids)

      linkedIds = new Set(
        (links || [])
          .map(row => (typeof row?.markup_document_id === 'string' ? row.markup_document_id : null))
          .filter((id): id is string => Boolean(id))
      )
    }

    const payload =
      data
        ?.filter(row => row?.original_blueprint_url && !linkedIds.has(row.id as string))
        .map(row => ({
          id: row.id,
          title: row.title || row.original_blueprint_filename || '도면',
          siteId: row.site_id,
          previewUrl: row.preview_image_url,
          sourceUrl: row.original_blueprint_url,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          markupCount:
            typeof row.markup_count === 'number' ? row.markup_count : row.preview_image_url ? 1 : 0,
        })) || []

    return NextResponse.json({ success: true, data: payload })
  } catch (error) {
    console.error('[mobile/media/drawings/pending] failed', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load pending drawings' },
      { status: 500 }
    )
  }
}
