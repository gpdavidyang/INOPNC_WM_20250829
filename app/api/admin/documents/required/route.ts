import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Required documents API - Auth check:', { user: user?.id, authError })
    
    if (authError || !user) {
      console.log('Required documents API - Auth failed:', authError)
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

    // 필수서류함 접근 권한 체크: 파트너사는 접근 불가
    if (profile.role === 'customer_manager') {
      console.log('Required documents API - Partner access denied:', { profile })
      return NextResponse.json({ error: '필수서류함에 접근할 권한이 없습니다' }, { status: 403 })
    }

    console.log('Required documents API - Access granted:', { userId: user.id, role: profile.role })

    // Admin의 경우 Service Client 사용 (모든 데이터 접근)
    // 작업자/현장관리자의 경우 일반 Client 사용 (RLS 적용되어 본인 데이터만)
    const clientToUse = ['admin', 'system_admin'].includes(profile.role)
      ? createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
      : supabase

    // Get required documents from unified_document_system
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

    const documentsWithProfiles = documents || []

    if (error) {
      console.error('Error fetching required documents:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    console.log('Required documents API - Documents found:', documentsWithProfiles?.length || 0)
    console.log('Required documents API - Sample document:', documentsWithProfiles?.[0])
    console.log('Required documents API - All document titles:', documentsWithProfiles?.map((d: unknown) => d.title))

    // Transform data to match the expected format
    const transformedDocuments = documentsWithProfiles?.map((doc: unknown) => ({
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
      organization_name: doc.uploader?.organization_name || '' // Organization data can be added later if needed
    })) || []

    console.log('Required documents API - Transformed documents:', transformedDocuments.length)
    console.log('Required documents API - Sample transformed:', transformedDocuments[0])

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