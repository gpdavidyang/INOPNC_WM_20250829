import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = await createClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, site_id')
      .eq('id', authResult.userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const role = profile.role || authResult.role || ''

    console.log('Required document types API - User profile:', profile)

    // First try to get from document_requirements table
    const { data: documents, error } = await supabase
      .from('document_requirements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching document requirements:', error)
      return NextResponse.json({ error: 'Failed to fetch required documents' }, { status: 500 })
    }

    console.log('Required document types API - Found documents:', documents?.length || 0)

    // Transform to expected format for documents-tab.tsx
    const transformedDocuments = (documents || []).map((doc: unknown) => ({
      id: doc.id,
      code: doc.document_type || doc.id,
      name_ko: doc.requirement_name,
      name_en: doc.requirement_name,
      description: doc.description,
      file_types: doc.file_format_allowed || ['pdf', 'jpg', 'jpeg', 'png'],
      max_file_size: (doc.max_file_size_mb || 5) * 1024 * 1024, // Convert MB to bytes
      sort_order: 0,
      isRequired: doc.is_mandatory,
      is_mandatory: doc.is_mandatory,
      submissionStatus: 'not_submitted' // Default status, will be updated by submission API
    }))

    console.log('Required document types API - Transformed documents:', transformedDocuments)

    return NextResponse.json({
      required_documents: transformedDocuments,
      user_role: role,
      site_id: profile.site_id,
      total_count: transformedDocuments.length
    })

  } catch (error) {
    console.error('Error in GET /api/required-document-types:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
