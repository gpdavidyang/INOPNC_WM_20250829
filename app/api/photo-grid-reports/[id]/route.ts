import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'


export const dynamic = 'force-dynamic'

// GET /api/photo-grid-reports/[id] - 특정 PDF 보고서 조회
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

    const { data, error } = await supabase
      .from('photo_grid_reports')
      .select(`
        *,
        daily_report:daily_reports(
          id,
          work_date,
          member_name,
          process_type,
          site:sites(
            id,
            name
          )
        ),
        generated_by_profile:profiles!generated_by(
          id,
          full_name,
          email
        ),
        last_downloaded_by_profile:profiles!last_downloaded_by(
          id,
          full_name
        )
      `)
      .eq('id', params.id)
      .single()
    
    if (error) {
      console.error('PDF 보고서 조회 오류:', error)
      return NextResponse.json(
        { error: 'PDF 보고서를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// PUT /api/photo-grid-reports/[id] - PDF 보고서 정보 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    const body = await request.json()
    const allowedFields = ['title', 'notes', 'status', 'version']
    const updates = Object.keys(body)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = body[key]
        return obj
      }, {} as unknown)

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: '업데이트할 필드가 없습니다.' },
        { status: 400 }
      )
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('photo_grid_reports')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) {
      console.error('PDF 보고서 업데이트 오류:', error)
      return NextResponse.json(
        { error: 'PDF 보고서 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/photo-grid-reports/[id] - PDF 보고서 삭제 (소프트 삭제)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    const { searchParams } = new URL(request.url)
    const permanent = searchParams.get('permanent') === 'true'

    if (permanent) {
      // 영구 삭제 (시스템 관리자만 가능)
      if (authResult.role !== 'system_admin') {
        return NextResponse.json(
          { error: '권한이 없습니다.' },
          { status: 403 }
        )
      }

      // 1. 파일 정보 조회
      const { data: report, error: fetchError } = await supabase
        .from('photo_grid_reports')
        .select('file_url, file_name')
        .eq('id', params.id)
        .single()

      if (fetchError || !report) {
        return NextResponse.json(
          { error: 'PDF를 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      // 2. Storage에서 파일 삭제
      const filePath = `photo-grid-reports/${report.file_name}`
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath])

      if (storageError) {
        console.warn('Storage 파일 삭제 경고:', storageError)
        // Storage 삭제 실패해도 DB 레코드는 삭제 진행
      }

      // 3. DB에서 레코드 삭제
      const { error: deleteError } = await supabase
        .from('photo_grid_reports')
        .delete()
        .eq('id', params.id)

      if (deleteError) {
        console.error('영구 삭제 오류:', deleteError)
        return NextResponse.json(
          { error: 'PDF 영구 삭제에 실패했습니다.' },
          { status: 500 }
        )
      }

      return NextResponse.json({ message: 'PDF가 영구적으로 삭제되었습니다.' })
    } else {
      // 소프트 삭제
      const { error } = await supabase
        .from('photo_grid_reports')
        .update({
          status: 'deleted',
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)

      if (error) {
        console.error('PDF 삭제 오류:', error)
        return NextResponse.json(
          { error: 'PDF 삭제에 실패했습니다.' },
          { status: 500 }
        )
      }

      return NextResponse.json({ message: 'PDF가 삭제되었습니다.' })
    }
  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
