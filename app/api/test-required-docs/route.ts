import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('TEST API - Starting required documents test...')
    
    // Use service client to bypass auth for testing
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('TEST API - Service client created')

    // Get required documents from unified_document_system
    const { data: documents, error } = await serviceClient
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
        )
      `)
      .in('category_type', ['required', 'required_user_docs'])
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    console.log('TEST API - Query executed')
    console.log('TEST API - Error:', error)
    console.log('TEST API - Documents found:', documents?.length || 0)
    console.log('TEST API - Sample document:', documents?.[0])

    if (error) {
      console.error('TEST API - Database error:', error)
      return NextResponse.json({ 
        error: 'Database error', 
        details: error,
        debug: true
      }, { status: 500 })
    }

    // Transform data to match the expected format
    const transformedDocuments = documents?.map(doc => ({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      document_type: (doc.tags && doc.tags.length > 0) ? doc.tags[0] : (doc.sub_category || 'unknown'),
      file_name: doc.file_name,
      file_size: doc.file_size,
      status: doc.status === 'uploaded' ? 'pending' : doc.status,
      submission_date: doc.created_at,
      submitted_by: {
        id: doc.uploaded_by,
        full_name: doc.uploader?.full_name || 'Unknown',
        email: doc.uploader?.email || '',
        role: doc.uploader?.role || 'worker'
      },
      organization_name: doc.uploader?.organization_name || ''
    })) || []

    console.log('TEST API - Transformed documents:', transformedDocuments.length)
    console.log('TEST API - Sample transformed:', transformedDocuments[0])

    return NextResponse.json({
      success: true,
      debug: true,
      raw_count: documents?.length || 0,
      transformed_count: transformedDocuments.length,
      documents: transformedDocuments,
      total: transformedDocuments.length
    })

  } catch (error) {
    console.error('TEST API - Error:', error)
    return NextResponse.json(
      { 
        error: 'Test API error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        debug: true
      },
      { status: 500 }
    )
  }
}