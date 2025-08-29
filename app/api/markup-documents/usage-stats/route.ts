import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/markup-documents/usage-stats - 도구 사용 통계 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()
    
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    // Mock 데이터 반환 (실제 구현에서는 markup_data를 분석하여 통계 계산)
    const mockStats = {
      box_tool_usage: 245,
      text_tool_usage: 189,
      drawing_tool_usage: 342,
      total_actions: 776,
      average_session_time: 1260 // seconds (21 minutes)
    }
    
    return NextResponse.json(mockStats)

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}