import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface DocumentTypeRouteParams {
  params: { documentType: string }
}

export async function GET(request: NextRequest, { params }: DocumentTypeRouteParams) {
  try {
    const supabase = createClient()
    const documentType = decodeURIComponent(params.documentType)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 403 })
    }

    // Check access permissions
    if (profile.role === 'customer_manager') {
      return NextResponse.json({ error: '필수서류함에 접근할 권한이 없습니다' }, { status: 403 })
    }

    // Use Service Client for admin access
    const clientToUse = ['admin', 'system_admin'].includes(profile.role)
      ? createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
      : supabase

    console.log('Document type filter API - Document type:', documentType)

    // Get documents filtered by document type
    const { data: documents, error } = await clientToUse
      .from('unified_document_system')
      .select(`
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
      `)
      .in('category_type', ['required', 'required_user_docs'])
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching documents:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    console.log('Document type filter API - Total documents before filter:', documents?.length || 0)

    // Filter documents by document type
    // Check both tags and sub_category for document type matching
    const filteredDocuments = documents?.filter(doc => {
      const docType = (doc.tags && doc.tags.length > 0) ? doc.tags[0] : (doc.sub_category || 'unknown')
      return docType === documentType
    }) || []

    console.log('Document type filter API - Filtered documents:', filteredDocuments.length)
    console.log('Document type filter API - Sample filtered document:', filteredDocuments[0])

    // Transform data to match the expected format
    const transformedDocuments = filteredDocuments.map(doc => ({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      document_type: (doc.tags && doc.tags.length > 0) ? doc.tags[0] : (doc.sub_category || 'unknown'),
      file_name: doc.file_name,
      file_size: doc.file_size,
      file_url: doc.file_url,
      status: doc.status === 'uploaded' ? 'pending' : doc.status,
      submission_date: doc.created_at,
      submitted_by: {
        id: doc.uploaded_by,
        full_name: doc.uploader?.full_name || 'Unknown',
        email: doc.uploader?.email || '',
        role: doc.uploader?.role || 'worker'
      },
      organization_name: doc.uploader?.organization_name || '',
      submission_id: doc.id, // Use document id as submission id for now
      requirement_id: doc.requirement_id,
      rejection_reason: doc.review_notes
    }))

    console.log('Document type filter API - Transformed documents:', transformedDocuments.length)

    return NextResponse.json({
      success: true,
      documents: transformedDocuments,
      total: transformedDocuments.length,
      documentType: documentType
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}