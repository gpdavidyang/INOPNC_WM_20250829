import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    
    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to determine access level
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if user is admin or regular user
    const isAdmin = profile.role === 'admin'
    const isRegularUser = ['user', 'admin'].includes(profile.role)

    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('site_id')
    const categoryType = searchParams.get('category_type')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    

    // Build query for unified document system
    let query = supabase
      .from('unified_document_system')
      .select(`
        *,
        uploader:profiles!unified_document_system_uploaded_by_fkey(
          id,
          full_name,
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
      .eq('is_archived', false)

    // Apply role-based filtering
    if (!isAdmin) {
      // Regular users can only see:
      // 1. Documents they uploaded themselves
      // 2. Public documents
      // 3. Documents shared with their sites (if they have site access)
      query = query.or(`uploaded_by.eq.${user.id},is_public.eq.true`)
    }
    
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (siteId && siteId !== 'all') {
      query = query.eq('site_id', siteId)
    }
    
    if (categoryType && categoryType !== 'all') {
      query = query.eq('category_type', categoryType)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,file_name.ilike.%${search}%`)
    }

    const { data: documents, error: documentsError } = await query

    if (documentsError) {
      console.error('Documents query error:', documentsError)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    // Get total count for pagination with same filtering
    let countQuery = supabase
      .from('unified_document_system')
      .select('*', { count: 'exact', head: true })
      .eq('is_archived', false)

    // Apply same role-based filtering for count
    if (!isAdmin) {
      countQuery = countQuery.or(`uploaded_by.eq.${user.id},is_public.eq.true`)
    }

    if (siteId && siteId !== 'all') {
      countQuery = countQuery.eq('site_id', siteId)
    }
    
    if (categoryType && categoryType !== 'all') {
      countQuery = countQuery.eq('category_type', categoryType)
    }

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status)
    }

    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%,file_name.ilike.%${search}%`)
    }

    const { count: totalCount } = await countQuery

    // Get document statistics by category with role filtering
    let categoryStatsQuery = supabase
      .from('unified_document_system')
      .select('category_type')
      .eq('is_archived', false)
    
    if (!isAdmin) {
      categoryStatsQuery = categoryStatsQuery.or(`uploaded_by.eq.${user.id},is_public.eq.true`)
    }

    const { data: categoryStats } = await categoryStatsQuery

    const statisticsByCategory = categoryStats?.reduce((acc, doc) => {
      const category = doc.category_type
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Get status statistics with role filtering
    let statusStatsQuery = supabase
      .from('unified_document_system')
      .select('status')
      .eq('is_archived', false)
      
    if (!isAdmin) {
      statusStatsQuery = statusStatsQuery.or(`uploaded_by.eq.${user.id},is_public.eq.true`)
    }

    const { data: statusStats } = await statusStatsQuery

    const statisticsByStatus = statusStats?.reduce((acc, doc) => {
      const docStatus = doc.status
      acc[docStatus] = (acc[docStatus] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Group documents by category
    const documentsByCategory = documents?.reduce((acc, doc) => {
      const category = doc.category_type
      if (!acc[category]) acc[category] = []
      acc[category].push(doc)
      return acc
    }, {} as Record<string, any[]>) || {}

    const response = {
      success: true,
      data: documents || [],
      documents_by_category: documentsByCategory,
      statistics: {
        total_documents: totalCount || 0,
        by_category: statisticsByCategory,
        by_status: statisticsByStatus,
        shared_documents: statisticsByCategory.shared || 0,
        markup_documents: statisticsByCategory.markup || 0,
        required_documents: statisticsByCategory.required || 0,
        invoice_documents: statisticsByCategory.invoice || 0,
        photo_grid_documents: statisticsByCategory.photo_grid || 0
      },
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        has_more: (totalCount || 0) > (offset + limit)
      },
      permissions: {
        can_view_all: isAdmin,
        can_download_all: isAdmin,
        can_share_all: isAdmin,
        can_edit_all: isAdmin,
        global_access: isAdmin
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching unified documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch unified documents' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to determine access level
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if user is admin or regular user
    const isRegularUser = ['user', 'admin'].includes(profile.role)
    
    if (!isRegularUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    
    // Validate required fields
    const { title, file_name, file_url, category_type } = body
    if (!title || !file_name || !file_url || !category_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, file_name, file_url, category_type' 
      }, { status: 400 })
    }

    // Insert new document
    const { data: document, error: insertError } = await supabase
      .from('unified_document_system')
      .insert({
        ...body,
        uploaded_by: user.id,
        status: 'uploaded',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: document })

  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    )
  }
}