import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'


export const dynamic = 'force-dynamic'

// GET /api/shared-documents/[id]/permissions - 문서 권한 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    const { data: permissions, error } = await supabase
      .from('document_permissions')
      .select(`
        *,
        target_user:profiles!document_permissions_target_user_id_fkey(id, name, email),
        target_site:sites!document_permissions_target_site_id_fkey(id, name),
        target_organization:organizations!document_permissions_target_organization_id_fkey(id, name),
        created_by_user:profiles!document_permissions_created_by_fkey(id, name, email)
      `)
      .eq('document_id', params.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching permissions:', error)
      return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 })
    }

    return NextResponse.json({ permissions: permissions || [] })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/shared-documents/[id]/permissions - 새 권한 추가
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    // Check if user has share permission for this document
    const hasPermission = await supabase.rpc('check_document_permission', {
      p_document_id: params.id,
      p_user_id: authResult.userId,
      p_permission_type: 'share'
    } as unknown)

    if (!hasPermission.data) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const {
      permission_type,
      target_role,
      target_user_id,
      target_site_id,
      target_organization_id,
      can_view = true,
      can_edit = false,
      can_delete = false,
      can_share = false,
      can_download = true,
      expires_at
    } = body

    // Validate permission type and targets
    if (!permission_type) {
      return NextResponse.json({ error: 'Permission type is required' }, { status: 400 })
    }

    if (permission_type === 'role_based' && !target_role) {
      return NextResponse.json({ error: 'Target role is required for role-based permissions' }, { status: 400 })
    }

    if (permission_type === 'user_specific' && !target_user_id) {
      return NextResponse.json({ error: 'Target user is required for user-specific permissions' }, { status: 400 })
    }

    if (permission_type === 'site_specific' && !target_site_id) {
      return NextResponse.json({ error: 'Target site is required for site-specific permissions' }, { status: 400 })
    }

    if (permission_type === 'organization_specific' && !target_organization_id) {
      return NextResponse.json({ error: 'Target organization is required for organization-specific permissions' }, { status: 400 })
    }

    const permissionData = {
      document_id: params.id,
      permission_type,
      target_role: target_role || null,
      target_user_id: target_user_id || null,
      target_site_id: target_site_id || null,
      target_organization_id: target_organization_id || null,
      can_view,
      can_edit,
      can_delete,
      can_share,
      can_download,
      expires_at: expires_at || null,
      created_by: authResult.userId
    }

    const { data: permission, error } = await supabase
      .from('document_permissions')
      .insert(permissionData)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ error: 'Permission already exists' }, { status: 409 })
      }
      console.error('Error creating permission:', error)
      return NextResponse.json({ error: 'Failed to create permission' }, { status: 500 })
    }

    // Log share action
    await supabase.from('document_access_logs').insert({
      document_id: params.id,
      user_id: authResult.userId,
      action: 'share',
      details: {
        permission_type,
        target_role,
        target_user_id,
        target_site_id,
        target_organization_id
      }
    })

    return NextResponse.json({ 
      permission, 
      message: 'Permission created successfully' 
    }, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
