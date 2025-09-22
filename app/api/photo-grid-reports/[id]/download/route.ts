import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'


export const dynamic = 'force-dynamic'

// POST /api/photo-grid-reports/[id]/download - PDF 다운로드 추적
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

    // First, get the current download count
    const { data: currentData, error: fetchError } = await supabase
      .from('photo_grid_reports')
      .select('download_count')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      console.error('Failed to fetch current data:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch report data' },
        { status: 500 }
      )
    }

    // 다운로드 카운트 업데이트 및 추적
    const { data, error } = await supabase
      .from('photo_grid_reports')
      .update({
        download_count: (currentData?.download_count || 0) + 1,
        last_downloaded_at: new Date().toISOString(),
        last_downloaded_by: authResult.userId
      })
      .eq('id', params.id)
      .select(`
        id,
        title,
        file_url,
        file_name,
        download_count,
        last_downloaded_at
      `)
      .single()

    if (error) {
      console.error('다운로드 추적 오류:', error)
      return NextResponse.json(
        { error: '다운로드 추적에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: '다운로드가 기록되었습니다.',
      data: {
        download_count: data.download_count,
        last_downloaded_at: data.last_downloaded_at
      }
    })
  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
