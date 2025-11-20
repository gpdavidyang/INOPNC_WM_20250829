import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { normalizeRequiredDocStatus } from '@/lib/documents/status'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { role, restrictedOrgId } = authResult

    if (!role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (role === 'customer_manager') {
      return NextResponse.json({ error: '필수서류함에 접근할 권한이 없습니다' }, { status: 403 })
    }

    const supabase = createClient()
    const clientToUse = ['admin', 'system_admin'].includes(role) ? createServiceClient() : supabase

    let query = clientToUse
      .from('unified_document_system')
      .select(
        `
        *,
        uploader:profiles!unified_document_system_uploaded_by_fkey(
          id,
          full_name,
          email,
          role
        ),
        site:sites(
          id,
          name,
          address
        ),
        approver:profiles!unified_document_system_approved_by_fkey(
          id,
          full_name,
          role
        )
      `
      )
      .in('category_type', ['required', 'required_user_docs'])
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    if (!['admin', 'system_admin'].includes(role) && restrictedOrgId) {
      query = query.eq('organization_id', restrictedOrgId)
    }

    const { data: documents, error } = await query

    const documentsWithProfiles = documents || []

    if (error) {
      console.error('Error fetching required documents:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    console.log('Required documents API - Documents found:', documentsWithProfiles?.length || 0)
    console.log('Required documents API - Sample document:', documentsWithProfiles?.[0])
    console.log(
      'Required documents API - All document titles:',
      documentsWithProfiles?.map((d: unknown) => d.title)
    )

    // Transform data to match the expected format
    const transformedDocuments =
      documentsWithProfiles?.map((doc: unknown) => ({
        id: doc.id,
        title: doc.title,
        description: doc.description,
        document_type:
          doc.tags && doc.tags.length > 0 ? doc.tags[0] : doc.sub_category || 'unknown',
        file_name: doc.file_name,
        file_size: doc.file_size,
        status: normalizeRequiredDocStatus(doc.status === 'uploaded' ? 'pending' : doc.status),
        submission_date: doc.created_at,
        submitted_by: {
          id: doc.uploaded_by,
          full_name: doc.uploader?.full_name || 'Unknown',
          email: doc.uploader?.email || '',
          role: doc.uploader?.role || 'worker',
        },
        organization_name: doc.uploader?.organization_name || '', // Organization data can be added later if needed
      })) || []

    console.log('Required documents API - Transformed documents:', transformedDocuments.length)
    console.log('Required documents API - Sample transformed:', transformedDocuments[0])

    return NextResponse.json({
      success: true,
      documents: transformedDocuments,
      total: transformedDocuments.length,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
