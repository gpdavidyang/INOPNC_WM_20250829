import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: { siteId: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'shared'
    const limit = parseInt(searchParams.get('limit') || '50')

    const supabase = createClient()

    let query = supabase
      .from('unified_document_system')
      .select(
        `
        *,
        profiles:uploaded_by (
          full_name,
          role
        )
      `
      )
      .eq('site_id', params.siteId)
      .eq('status', 'active')
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (category) {
      query = query.eq('category_type', category)
    }

    const { data: documents, error } = await query

    if (error) {
      console.error('Mobile site documents query error:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: documents || [],
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
