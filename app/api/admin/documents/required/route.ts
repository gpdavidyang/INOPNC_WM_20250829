import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get required documents from unified_documents
    const { data: documents, error } = await supabase
      .from('unified_documents')
      .select(`
        id,
        title,
        description,
        file_name,
        file_size,
        mime_type,
        tags,
        status,
        created_at,
        profile_id,
        profiles!unified_documents_profile_id_fkey(
          id,
          full_name,
          email,
          role,
          organization_id,
          organizations(name)
        )
      `)
      .eq('category_type', 'required_user_docs')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching required documents:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    // Transform data to match the expected format
    const transformedDocuments = documents?.map(doc => ({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      document_type: doc.tags?.[0] || 'unknown', // First tag is the document type
      file_name: doc.file_name,
      file_size: doc.file_size,
      status: doc.status === 'uploaded' ? 'pending' : doc.status,
      submission_date: doc.created_at,
      submitted_by: {
        id: doc.profile_id,
        full_name: (doc.profiles as any)?.full_name || 'Unknown',
        email: (doc.profiles as any)?.email || '',
        role: (doc.profiles as any)?.role || 'worker'
      },
      organization_name: (doc.profiles as any)?.organizations?.name || ''
    })) || []

    return NextResponse.json({
      success: true,
      documents: transformedDocuments,
      total: transformedDocuments.length
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}