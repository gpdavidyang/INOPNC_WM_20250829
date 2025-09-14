
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
    const isAdmin = ['admin', 'system_admin'].includes(profile.role)
    const isRegularUser = ['user', 'admin', 'system_admin', 'site_manager', 'worker', 'customer_manager'].includes(profile.role)

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
    // Admin users can see all documents - no additional filtering needed
    
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
    // Admin users can see all documents for count

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
    // Admin users can see all document statistics

    const { data: categoryStats } = await categoryStatsQuery

    const statisticsByCategory = categoryStats?.reduce((acc: Record<string, number>, doc: unknown) => {
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
    // Admin users can see all status statistics

    const { data: statusStats } = await statusStatsQuery

    const statisticsByStatus = statusStats?.reduce((acc: Record<string, number>, doc: unknown) => {
      const docStatus = doc.status
      acc[docStatus] = (acc[docStatus] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Group documents by category
    const documentsByCategory = documents?.reduce((acc: Record<string, any[]>, doc: unknown) => {
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
    const isRegularUser = ['user', 'admin', 'system_admin', 'site_manager', 'worker', 'customer_manager'].includes(profile.role)
    
    if (!isRegularUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const contentType = request.headers.get('content-type')
    let body: unknown

    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData uploads
      const formData = await request.formData()
      const file = formData.get('file') as File
      
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }

      // Upload file to Supabase Storage
      const fileName = `${Date.now()}-${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return NextResponse.json({ error: 'File upload failed' }, { status: 500 })
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName)

      body = {
        title: formData.get('title') || file.name,
        description: formData.get('description') || '',
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        category_type: formData.get('category_type') || 'shared',
        site_id: formData.get('site_id') || null,
        is_public: formData.get('is_public') === 'true'
      }
    } else {
      // Handle JSON uploads
      body = await request.json()
    }
    
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