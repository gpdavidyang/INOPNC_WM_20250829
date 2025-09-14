import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'


export const dynamic = 'force-dynamic'

// PUT /api/shared-documents/[id]/permissions/[permissionId] - 권한 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; permissionId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      can_view,
      can_edit,
      can_delete,
      can_share,
      can_download,
      expires_at
    } = body

    // Check if user can modify this permission (admin or creator)
    const { data: permission } = await supabase
      .from('document_permissions')
      .select('created_by')
      .eq('id', params.permissionId)
      .single()

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!permission || (permission.created_by !== user.id && profile?.role !== 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const updateData: unknown = {}
    if (can_view !== undefined) updateData.can_view = can_view
    if (can_edit !== undefined) updateData.can_edit = can_edit
    if (can_delete !== undefined) updateData.can_delete = can_delete
    if (can_share !== undefined) updateData.can_share = can_share
    if (can_download !== undefined) updateData.can_download = can_download
    if (expires_at !== undefined) updateData.expires_at = expires_at

    const { data: updatedPermission, error } = await supabase
      .from('document_permissions')
      .update(updateData)
      .eq('id', params.permissionId)
      .select()
      .single()

    if (error) {
      console.error('Error updating permission:', error)
      return NextResponse.json({ error: 'Failed to update permission' }, { status: 500 })
    }

    return NextResponse.json({ 
      permission: updatedPermission, 
      message: 'Permission updated successfully' 
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/shared-documents/[id]/permissions/[permissionId] - 권한 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; permissionId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user can delete this permission (admin or creator)
    const { data: permission } = await supabase
      .from('document_permissions')
      .select('created_by')
      .eq('id', params.permissionId)
      .single()

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!permission || (permission.created_by !== user.id && profile?.role !== 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { error } = await supabase
      .from('document_permissions')
      .delete()
      .eq('id', params.permissionId)

    if (error) {
      console.error('Error deleting permission:', error)
      return NextResponse.json({ error: 'Failed to delete permission' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Permission deleted successfully' })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
