import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'


// GET /api/markup-documents/usage-stats - 도구 사용 통계 조회
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', authResult.userId)
      .single()
    
    const role = profile?.role || authResult.role || ''

    if (!profile || role !== 'admin') {
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
