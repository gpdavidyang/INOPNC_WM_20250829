import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/users/[id]/sites/available - 사용자에게 배정 가능한 현장 목록
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    
    const search = searchParams.get('search') || null;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 사용자가 아직 배정되지 않은 활성 현장 목록 조회
    let query = supabase
      .from('sites')
      .select('*', { count: 'exact' })
      .or('is_deleted.is.null,is_deleted.eq.false')
      .eq('status', 'active');

    // 검색 조건 추가
    if (search) {
      query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`);
    }

    // 이미 배정된 현장 제외
    const { data: assignedSites } = await supabase
      .from('site_assignments')
      .select('site_id')
      .eq('user_id', params.id)
      .eq('is_active', true);

    const assignedSiteIds = assignedSites?.map((a: any) => a.site_id) || [];
    
    if (assignedSiteIds.length > 0) {
      query = query.not('id', 'in', `(${assignedSiteIds.join(',')})`);
    }

    // 페이지네이션 적용
    query = query
      .range(offset, offset + limit - 1)
      .order('name', { ascending: true });

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: offset + limit < (count || 0)
      }
    });
  } catch (error: any) {
    console.error('Error fetching available sites for user:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}