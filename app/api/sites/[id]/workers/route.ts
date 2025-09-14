import { NextRequest, NextResponse } from 'next/server';
;

// GET /api/sites/[id]/workers - 특정 현장의 작업자 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 사용자 프로필 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, site_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'site_manager', 'worker'].includes(profile.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // 관리자가 아닌 경우 현장 접근 권한 확인
    if (profile.role !== 'admin') {
      // site_assignments 또는 프로필의 site_id로 접근 권한 확인
      const { data: siteAccess } = await supabase
        .from('site_assignments')
        .select('id')
        .eq('site_id', params.id)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      const hasDirectSiteAccess = profile.site_id === params.id
      const hasSiteAssignment = !!siteAccess

      if (!hasDirectSiteAccess && !hasSiteAssignment) {
        return NextResponse.json({ error: 'Site access denied' }, { status: 403 })
      }
    }
    
    const searchParams = request.nextUrl.searchParams;
    
    const activeOnly = searchParams.get('activeOnly') !== 'false';
    const search = searchParams.get('search') || null;
    const roleFilter = searchParams.get('role') || null;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // get_site_workers 함수 호출
    const { data, error } = await supabase.rpc('get_site_workers', {
      p_site_id: params.id,
      p_active_only: activeOnly,
      p_search: search,
      p_role_filter: roleFilter,
      p_limit: limit,
      p_offset: offset
    } as unknown);

    if (error) throw error;

    // 전체 카운트 조회
    const { data: countData, error: countError } = await supabase
      .from('site_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', params.id)
      .eq('is_active', activeOnly);

    const total = countData ? parseInt(countData.toString()) : 0;

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error: unknown) {
    console.error('Error fetching site workers:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/sites/[id]/workers - 현장에 작업자 배정
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const body = await request.json();
    
    const {
      userIds,
      role = 'worker',
      assignmentType = 'permanent',
      notes = null
    } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User IDs are required' },
        { status: 400 }
      );
    }

    // 현재 사용자 정보 가져오기 (승인자로 기록)
    const { data: { user } } = await supabase.auth.getUser();
    
    // bulk_assign_users_to_site 함수 호출
    const { data, error } = await supabase.rpc('bulk_assign_users_to_site', {
      p_site_id: params.id,
      p_user_ids: userIds,
      p_role: role,
      p_assignment_type: assignmentType,
      p_notes: notes,
      p_assigned_by: user?.id || null
    } as unknown);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data?.[0] || { success_count: 0, error_count: 0, error_messages: [] }
    });
  } catch (error: unknown) {
    console.error('Error assigning workers to site:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/sites/[id]/workers - 작업자 배정 정보 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const body = await request.json();
    
    const {
      userId,
      role,
      assignmentType,
      notes,
      isActive
    } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const updateData: unknown = {};
    if (role !== undefined) updateData.role = role;
    if (assignmentType !== undefined) updateData.assignment_type = assignmentType;
    if (notes !== undefined) updateData.notes = notes;
    if (isActive !== undefined) updateData.is_active = isActive;
    
    // 비활성화 시 unassigned_date 설정
    if (isActive === false) {
      updateData.unassigned_date = new Date().toISOString().split('T')[0];
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('site_assignments')
      .update(updateData)
      .eq('site_id', params.id)
      .eq('user_id', userId)
      .eq('is_active', true)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: unknown) {
    console.error('Error updating site worker assignment:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/sites/[id]/workers/[userId] - 작업자 배정 해제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 소프트 삭제: is_active를 false로 설정하고 unassigned_date 기록
    const { data, error } = await supabase
      .from('site_assignments')
      .update({
        is_active: false,
        unassigned_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('site_id', params.id)
      .eq('user_id', userId)
      .eq('is_active', true)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: unknown) {
    console.error('Error removing worker from site:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}