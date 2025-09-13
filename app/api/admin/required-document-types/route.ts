import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'system_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const includeInactive = searchParams.get('include_inactive') === 'true'
    const roleType = searchParams.get('role_type')
    const siteId = searchParams.get('site_id')

    let query = supabase
      .from('required_document_types')
      .select(`
        *,
        role_mappings:required_documents_by_role(
          role_type,
          is_required
        ),
        site_customizations:site_required_documents(
          site_id,
          is_required,
          due_days,
          notes,
          sites(name)
        )
      `)
      .order('sort_order', { ascending: true })

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching document types:', error)
      return NextResponse.json({ error: 'Failed to fetch document types' }, { status: 500 })
    }

    let filteredData = data || []

    if (roleType || siteId) {
      filteredData = data?.filter((docType: any) => {
        if (roleType) {
          const hasRoleMapping = docType.role_mappings?.some(
            (mapping: any) => mapping.role_type === roleType && mapping.is_required
          )
          if (!hasRoleMapping) return false
        }

        if (siteId) {
          const hasSiteCustomization = docType.site_customizations?.some(
            (customization: any) => customization.site_id === siteId && customization.is_required
          )
          if (!hasSiteCustomization) return false
        }

        return true
      }) || []
    }

    return NextResponse.json({
      document_types: filteredData,
      total_count: filteredData.length
    })

  } catch (error) {
    console.error('Error in GET /api/admin/required-document-types:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'system_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      code,
      name_ko,
      name_en,
      description,
      file_types,
      max_file_size,
      sort_order,
      role_mappings,
      site_customizations
    } = body

    if (!code || !name_ko) {
      return NextResponse.json(
        { error: 'Code and Korean name are required' },
        { status: 400 }
      )
    }

    const { data: newDocType, error: insertError } = await supabase
      .from('required_document_types')
      .insert({
        code,
        name_ko,
        name_en,
        description,
        file_types: file_types || ['pdf', 'jpg', 'jpeg', 'png'],
        max_file_size: max_file_size || 10485760,
        sort_order: sort_order || 0
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating document type:', insertError)
      return NextResponse.json(
        { error: 'Failed to create document type' },
        { status: 500 }
      )
    }

    if (role_mappings && role_mappings.length > 0) {
      const roleInserts = role_mappings.map((mapping: any) => ({
        document_type_id: newDocType.id,
        role_type: mapping.role_type,
        is_required: mapping.is_required
      }))

      const { error: roleError } = await supabase
        .from('required_documents_by_role')
        .insert(roleInserts)

      if (roleError) {
        console.error('Error creating role mappings:', roleError)
      }
    }

    if (site_customizations && site_customizations.length > 0) {
      const siteInserts = site_customizations.map((customization: any) => ({
        document_type_id: newDocType.id,
        site_id: customization.site_id,
        is_required: customization.is_required,
        due_days: customization.due_days,
        notes: customization.notes
      }))

      const { error: siteError } = await supabase
        .from('site_required_documents')
        .insert(siteInserts)

      if (siteError) {
        console.error('Error creating site customizations:', siteError)
      }
    }

    return NextResponse.json(newDocType, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/admin/required-document-types:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}