import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'


export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('document_id')
    const categoryType = searchParams.get('category_type')

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get access rules for user role
    const { data: accessRules } = await supabase
      .from('document_access_rules')
      .select('*')
      .eq('role', profile.role)

    // If checking specific document
    if (documentId) {
      const { data: document } = await supabase
        .from('unified_documents')
        .select(`
          *,
          sites(id, name),
          customer_companies(id, name)
        `)
        .eq('id', documentId)
        .single()

      if (!document) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }

      // Check access based on category and user role
      const categoryRule = accessRules?.find((rule: unknown) => rule.category_type === document.category_type)
      
      let hasAccess = false
      
      if (profile.role === 'admin') {
        hasAccess = true
      } else if (categoryRule) {
        if (categoryRule.global_access) {
          hasAccess = true
        } else if (categoryRule.site_access && document.site_id) {
          // Check if user has access to this site
          const { data: siteAccess } = await supabase
            .from('work_records')
            .select('id')
            .eq('profile_id', profile.id)
            .limit(1)
            
          hasAccess = siteAccess && siteAccess.length > 0
        } else if (categoryRule.customer_access && document.customer_company_id) {
          // Check if user belongs to this customer company
          hasAccess = profile.role === 'customer' // Simplified check
        }
      }

      return NextResponse.json({
        document,
        has_access: hasAccess,
        permissions: categoryRule || {},
        user_role: profile.role
      })
    }

    // Return general permissions for user
    return NextResponse.json({
      user_role: profile.role,
      access_rules: accessRules || [],
      permissions_by_category: accessRules?.reduce((acc: unknown, rule: unknown) => {
        acc[rule.category_type] = {
          can_view: rule.can_view,
          can_download: rule.can_download,
          can_share: rule.can_share,
          can_edit: rule.can_edit,
          site_access: rule.site_access,
          customer_access: rule.customer_access,
          global_access: rule.global_access
        }
        return acc
      }, {} as Record<string, any>) || {}
    })

  } catch (error) {
    console.error('Error checking document permissions:', error)
    return NextResponse.json(
      { error: 'Failed to check document permissions' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    
    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      document_id, 
      user_id, 
      site_id, 
      customer_company_id, 
      permission_type, 
      expires_at 
    } = body

    // Create permission record
    const { data, error } = await supabase
      .from('document_permissions')
      .insert([{
        document_id,
        user_id,
        site_id,
        customer_company_id,
        permission_type,
        granted_by: user.id,
        expires_at
      }])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to grant permission' }, { status: 500 })
    }

    return NextResponse.json({ success: true, permission: data })

  } catch (error) {
    console.error('Error granting document permission:', error)
    return NextResponse.json(
      { error: 'Failed to grant document permission' },
      { status: 500 }
    )
  }
}
