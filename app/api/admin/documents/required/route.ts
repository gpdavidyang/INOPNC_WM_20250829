import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Required documents API - Auth check:', { user: user?.id, authError })
    
    if (authError || !user) {
      console.log('Required documents API - Auth failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      console.log('Required documents API - Admin check failed:', { profile })
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('Required documents API - Admin check passed:', { userId: user.id, role: profile.role })

    // Use service client to bypass RLS for admin operations
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get required documents from unified_documents
    const { data: documents, error } = await serviceClient
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
        profile_id
      `)
      .eq('category_type', 'required_user_docs')
      .order('created_at', { ascending: false })

    // Get profile data separately to avoid join issues
    let documentsWithProfiles = []
    if (documents && documents.length > 0) {
      const profileIds = [...new Set(documents.map(doc => doc.profile_id))]
      const { data: profiles } = await serviceClient
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          role,
          organization_id,
          organizations(name)
        `)
        .in('id', profileIds)

      documentsWithProfiles = documents.map(doc => ({
        ...doc,
        profiles: profiles?.find(p => p.id === doc.profile_id)
      }))
    } else {
      documentsWithProfiles = documents || []
    }

    if (error) {
      console.error('Error fetching required documents:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    console.log('Required documents API - Documents found:', documentsWithProfiles?.length || 0)
    console.log('Required documents API - Sample document:', documentsWithProfiles?.[0])

    // Transform data to match the expected format
    const transformedDocuments = documentsWithProfiles?.map(doc => ({
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