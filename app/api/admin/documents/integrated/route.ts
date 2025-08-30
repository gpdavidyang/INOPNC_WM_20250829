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
    let query = supabase
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

    // Apply filters if provided
    if (siteId) {
      query = query.eq('site_id', siteId)
    }
    
    if (categoryType) {
      query = query.eq('category_type', categoryType)
    }

    const { data: documents, error: documentsError } = await query

    if (documentsError) {
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    // Get document categories and their stats
    const { data: categories } = await supabase
      .from('document_categories')
      .select('*')
      .order('name')

    // Get document statistics by category
    const { data: docStats } = await supabase
      .from('unified_documents')
      .select('category_type')
      .then(({ data }) => {
        const stats = data?.reduce((acc, doc) => {
          const category = doc.category_type || 'shared'
          acc[category] = (acc[category] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}
        
        return { data: stats, error: null }
      })

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
        invoice_documents: documentsByCategory.invoice?.length || 0
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