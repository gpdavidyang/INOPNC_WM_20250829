import { NextRequest, NextResponse } from 'next/server';
;

// GET /api/users/[id]/sites - 특정 사용자의 현장 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    
    const activeOnly = searchParams.get('activeOnly') !== 'false';
    const search = searchParams.get('search') || null;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // get_user_sites 함수 호출
    const { data, error } = await supabase.rpc('get_user_sites', {
      p_user_id: params.id,
      p_active_only: activeOnly,
      p_search: search,
      p_limit: limit,
      p_offset: offset
    } as unknown);

    if (error) throw error;

    // 전체 카운트 조회
    const { count } = await supabase
      .from('site_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', params.id)
      .eq('is_active', activeOnly);

    const total = count || 0;

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
    console.error('Error fetching user sites:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/users/[id]/sites - 사용자에게 현장 배정
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const body = await request.json();
    
    const {
      siteId,
      role = 'worker',
      assignmentType = 'permanent',
      notes = null
    } = body;

    if (!siteId) {
      return NextResponse.json(
        { success: false, error: 'Site ID is required' },
        { status: 400 }
      );
    }

    // 현재 사용자 정보 가져오기 (승인자로 기록)
    const { data: { user } } = await supabase.auth.getUser();

    // 이미 활성 배정이 있는지 확인
    const { data: existing } = await supabase
      .from('site_assignments')
      .select('id')
      .eq('site_id', siteId)
      .eq('user_id', params.id)
      .eq('is_active', true)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'User is already assigned to this site' },
        { status: 400 }
      );
    }

    // 새 배정 생성
    const { data, error } = await supabase
      .from('site_assignments')
      .insert({
        site_id: siteId,
        user_id: params.id,
        role: role,
        assignment_type: assignmentType,
        notes: notes,
        approved_by: user?.id || null,
        approved_at: new Date().toISOString(),
        is_active: true,
        assigned_date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: unknown) {
    console.error('Error assigning site to user:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[id]/sites - 사용자의 현장 배정 정보 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const body = await request.json();
    
    const {
      siteId,
      role,
      assignmentType,
      notes,
      isActive
    } = body;

    if (!siteId) {
      return NextResponse.json(
        { success: false, error: 'Site ID is required' },
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
      .eq('user_id', params.id)
      .eq('site_id', siteId)
      .eq('is_active', true)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: unknown) {
    console.error('Error updating user site assignment:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id]/sites - 사용자의 현장 배정 해제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json(
        { success: false, error: 'Site ID is required' },
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
      .eq('user_id', params.id)
      .eq('site_id', siteId)
      .eq('is_active', true)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: unknown) {
    console.error('Error removing site from user:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

