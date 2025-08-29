import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/shared-documents/[id] - 특정 문서 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: document, error } = await supabase
      .from('v_shared_documents_with_permissions')
      .select('*')
      .eq('id', params.id)
      .eq('is_deleted', false)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }
      console.error('Error fetching document:', error)
      return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 })
    }

    // Log view action
    await supabase.from('document_access_logs').insert({
      document_id: params.id,
      user_id: user.id,
      action: 'view'
    })

    return NextResponse.json({ document })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/shared-documents/[id] - 문서 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, category, tags, site_id, organization_id } = body

    // Check if user has edit permission
    const hasPermission = await supabase.rpc('check_document_permission', {
      p_document_id: params.id,
      p_user_id: user.id,
      p_permission_type: 'edit'
    })

    if (!hasPermission.data) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (tags !== undefined) updateData.tags = tags
    if (site_id !== undefined) updateData.site_id = site_id
    if (organization_id !== undefined) updateData.organization_id = organization_id

    const { data: document, error } = await supabase
      .from('shared_documents')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating document:', error)
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
    }

    // Log edit action
    await supabase.from('document_access_logs').insert({
      document_id: params.id,
      user_id: user.id,
      action: 'edit',
      details: {
        changes: updateData
      }
    })

    return NextResponse.json({ 
      document, 
      message: 'Document updated successfully' 
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/shared-documents/[id] - 문서 삭제 (Soft Delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has delete permission
    const hasPermission = await supabase.rpc('check_document_permission', {
      p_document_id: params.id,
      p_user_id: user.id,
      p_permission_type: 'delete'
    })

    if (!hasPermission.data) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { error } = await supabase
      .from('shared_documents')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: user.id
      })
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting document:', error)
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Document deleted successfully' })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}