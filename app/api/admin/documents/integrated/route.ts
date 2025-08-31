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

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('site_id')
    const categoryType = searchParams.get('category_type')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Admin can access all documents across all categories
    // First get unified_documents
    let unifiedQuery = supabase
      .from('unified_documents')
      .select(`
        *,
        profiles!unified_documents_uploaded_by_fkey(
          id,
          full_name,
          role
        ),
        sites(
          id,
          name,
          address
        ),
        customer_companies(
          id,
          name,
          company_type
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply filters for unified_documents
    if (siteId) {
      unifiedQuery = unifiedQuery.eq('site_id', siteId)
    }
    
    if (categoryType && categoryType !== 'shared') {
      unifiedQuery = unifiedQuery.eq('category_type', categoryType)
    }

    // Get legacy documents for shared category
    let legacyQuery = supabase
      .from('documents')
      .select(`
        *,
        owner:profiles!documents_owner_id_fkey(
          id,
          full_name,
          role
        ),
        site:sites(
          id,
          name,
          address
        )
      `)
      .eq('document_type', 'shared')
      .order('created_at', { ascending: false })

    // Apply filters for legacy documents
    if (siteId) {
      legacyQuery = legacyQuery.eq('site_id', siteId)
    }

    // Execute queries
    const [unifiedResult, legacyResult] = await Promise.all([
      unifiedQuery,
      categoryType === 'shared' || !categoryType ? legacyQuery : Promise.resolve({ data: [], error: null })
    ])

    if (unifiedResult.error) {
      return NextResponse.json({ error: 'Failed to fetch unified documents' }, { status: 500 })
    }

    if (legacyResult.error) {
      return NextResponse.json({ error: 'Failed to fetch legacy documents' }, { status: 500 })
    }

    // Combine and transform documents
    const unifiedDocuments = unifiedResult.data || []
    const legacyDocuments = (legacyResult.data || []).map(doc => ({
      ...doc,
      category_type: 'shared',
      document_type: doc.document_type || 'shared',
      uploaded_by: doc.owner_id,
      profiles: doc.owner ? {
        id: doc.owner.id,
        full_name: doc.owner.full_name,
        role: doc.owner.role
      } : null,
      sites: doc.site,
      customer_companies: null
    }))

    const allDocuments = [...unifiedDocuments, ...legacyDocuments]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)

    const documents = allDocuments
    const documentsError = null

    if (documentsError) {
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    // Get document categories and their stats
    const { data: categories } = await supabase
      .from('document_categories')
      .select('*')
      .order('name')

    // Get document statistics by category from both tables
    const [unifiedStatsResult, legacyStatsResult] = await Promise.all([
      supabase.from('unified_documents').select('category_type'),
      supabase.from('documents').select('document_type').eq('document_type', 'shared')
    ])

    const unifiedStats = unifiedStatsResult.data?.reduce((acc, doc) => {
      const category = doc.category_type || 'shared'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const legacyStats = {
      shared: legacyStatsResult.data?.length || 0
    }

    const docStats = {
      data: {
        ...unifiedStats,
        shared: (unifiedStats.shared || 0) + legacyStats.shared
      },
      error: null
    }

    // Group documents by category
    const documentsByCategory = documents?.reduce((acc, doc) => {
      const category = doc.category_type || 'shared'
      if (!acc[category]) acc[category] = []
      acc[category].push(doc)
      return acc
    }, {} as Record<string, any[]>) || {}

    // Get access rules for admin
    const { data: accessRules } = await supabase
      .from('document_access_rules')
      .select('*')
      .eq('role', 'admin')

    const response = {
      documents: documents || [],
      documents_by_category: documentsByCategory,
      categories: categories || [],
      statistics: {
        total_documents: documents?.length || 0,
        by_category: docStats?.data || {},
        shared_documents: documentsByCategory.shared?.length || 0,
        markup_documents: documentsByCategory.markup?.length || 0,
        required_documents: documentsByCategory.required?.length || 0,
        invoice_documents: documentsByCategory.invoice?.length || 0,
        photo_grid_documents: documentsByCategory.photo_grid?.length || 0
      },
      admin_access_rules: accessRules || [],
      permissions: {
        can_view_all: true,
        can_download_all: true,
        can_share_all: true,
        can_edit_all: true,
        global_access: true
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching integrated documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integrated documents' },
      { status: 500 }
    )
  }
}