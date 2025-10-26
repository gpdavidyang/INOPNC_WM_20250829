import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (authResult.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = createClient()

    const siteId = params.id
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'invoice' // Default to 기성청구 문서
    const type = searchParams.get('type') // document_type filter
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build query for site documents
    let query = supabase
      .from('unified_document_system')
      .select(
        `
        id,
        category_type,
        sub_category,
        file_name,
        file_url,
        title,
        description,
        created_at,
        metadata,
        updated_at,
        uploaded_by,
        file_size,
        mime_type,
        status,
        profiles!unified_document_system_uploaded_by_fkey(
          full_name,
          role
        )
      `
      )
      .eq('site_id', siteId)
      .eq('category_type', category)
      .eq('status', 'active')
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply document type filter (using sub_category for filtering in unified_document_system)
    if (type && type !== 'all') {
      query = query.eq('sub_category', type)
    }

    const { data: documents, error } = await query

    if (error) {
      console.error('Documents query error:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    // Get document statistics for this site and category
    const { data: statsData } = await supabase
      .from('unified_document_system')
      .select('sub_category, category_type, mime_type, metadata')
      .eq('site_id', siteId)
      .eq('category_type', category)
      .eq('status', 'active')
      .eq('is_archived', false)

    // Create statistics based on mime types for better categorization
    const getDocumentType = (mimeType: string) => {
      if (mimeType?.startsWith('image/')) return 'photo'
      if (mimeType === 'application/pdf') return 'document'
      return 'document'
    }

    const statistics = {
      total_documents: statsData?.length || 0,
      by_type:
        statsData?.reduce(
          (acc: unknown, doc: unknown) => {
            const type = getDocumentType(doc.mime_type || '')
            acc[type] = (acc[type] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        ) || {},
      category: category,
    }

    // Get site information for context
    const { data: siteData } = await supabase
      .from('sites')
      .select('id, name')
      .eq('id', siteId)
      .single()

    return NextResponse.json({
      success: true,
      data: documents || [],
      statistics,
      site: siteData,
      filters: {
        site_id: siteId,
        category: category,
        type: type || 'all',
        limit,
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
