import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (!authResult.role || !['admin', 'system_admin'].includes(authResult.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('required_document_types')
      .select(`
        *,
        role_mappings:required_documents_by_role(
          id,
          role_type,
          is_required
        ),
        site_customizations:site_required_documents(
          id,
          site_id,
          is_required,
          due_days,
          notes,
          sites(id, name)
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching document type:', error)
      return NextResponse.json({ error: 'Document type not found' }, { status: 404 })
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Error in GET /api/admin/required-document-types/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (!authResult.role || !['admin', 'system_admin'].includes(authResult.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = await createClient()

    const body = await request.json()
    const {
      code,
      name_ko,
      name_en,
      description,
      file_types,
      max_file_size,
      is_active,
      sort_order,
      role_mappings,
      site_customizations
    } = body

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: authResult.userId,
    }

    if (code !== undefined) updateData.code = code
    if (name_ko !== undefined) updateData.name_ko = name_ko
    if (name_en !== undefined) updateData.name_en = name_en
    if (description !== undefined) updateData.description = description
    if (file_types !== undefined) updateData.file_types = file_types
    if (max_file_size !== undefined) updateData.max_file_size = max_file_size
    if (is_active !== undefined) updateData.is_active = is_active
    if (sort_order !== undefined) updateData.sort_order = sort_order

    const { data: updatedDocType, error: updateError } = await supabase
      .from('required_document_types')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating document type:', updateError)
      return NextResponse.json(
        { error: 'Failed to update document type' },
        { status: 500 }
      )
    }

    if (role_mappings !== undefined) {
      await supabase
        .from('required_documents_by_role')
        .delete()
        .eq('document_type_id', params.id)

      if (role_mappings.length > 0) {
        const roleInserts = role_mappings.map((mapping: unknown) => ({
          document_type_id: params.id,
          role_type: mapping.role_type,
          is_required: mapping.is_required
        }))

        const { error: roleError } = await supabase
          .from('required_documents_by_role')
          .insert(roleInserts)

        if (roleError) {
          console.error('Error updating role mappings:', roleError)
        }
      }
    }

    if (site_customizations !== undefined) {
      await supabase
        .from('site_required_documents')
        .delete()
        .eq('document_type_id', params.id)

      if (site_customizations.length > 0) {
        const siteInserts = site_customizations.map((customization: unknown) => ({
          document_type_id: params.id,
          site_id: customization.site_id,
          is_required: customization.is_required,
          due_days: customization.due_days,
          notes: customization.notes
        }))

        const { error: siteError } = await supabase
          .from('site_required_documents')
          .insert(siteInserts)

        if (siteError) {
          console.error('Error updating site customizations:', siteError)
        }
      }
    }

    return NextResponse.json(updatedDocType)

  } catch (error) {
    console.error('Error in PUT /api/admin/required-document-types/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (!authResult.role || !['admin', 'system_admin'].includes(authResult.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('required_document_types')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting document type:', error)
      return NextResponse.json(
        { error: 'Failed to delete document type' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in DELETE /api/admin/required-document-types/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
