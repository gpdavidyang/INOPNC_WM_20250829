import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/photo-grid-reports/bulk - 벌크 작업 (삭제, 상태 변경 등)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { action, reportIds, data: actionData } = body

    if (!action || !Array.isArray(reportIds) || reportIds.length === 0) {
      return NextResponse.json(
        { error: '작업 타입과 보고서 ID 목록이 필요합니다.' },
        { status: 400 }
      )
    }

    let results: unknown[] = []

    switch (action) {
      case 'delete':
        // 벌크 소프트 삭제
        const { error: deleteError } = await supabase
          .from('photo_grid_reports')
          .update({
            status: 'deleted',
            updated_at: new Date().toISOString()
          })
          .in('id', reportIds)

        if (deleteError) {
          console.error('벌크 삭제 오류:', deleteError)
          return NextResponse.json(
            { error: '벌크 삭제에 실패했습니다.' },
            { status: 500 }
          )
        }

        results = reportIds.map((id: any) => ({ id, action: 'deleted', success: true }))
        break

      case 'archive':
        // 벌크 아카이브
        const { error: archiveError } = await supabase
          .from('photo_grid_reports')
          .update({
            status: 'archived',
            updated_at: new Date().toISOString()
          })
          .in('id', reportIds)

        if (archiveError) {
          console.error('벌크 아카이브 오류:', archiveError)
          return NextResponse.json(
            { error: '벌크 아카이브에 실패했습니다.' },
            { status: 500 }
          )
        }

        results = reportIds.map((id: any) => ({ id, action: 'archived', success: true }))
        break

      case 'restore':
        // 벌크 복원 (삭제된 것을 활성으로)
        const { error: restoreError } = await supabase
          .from('photo_grid_reports')
          .update({
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .in('id', reportIds)
          .eq('status', 'deleted')

        if (restoreError) {
          console.error('벌크 복원 오류:', restoreError)
          return NextResponse.json(
            { error: '벌크 복원에 실패했습니다.' },
            { status: 500 }
          )
        }

        results = reportIds.map((id: any) => ({ id, action: 'restored', success: true }))
        break

      case 'permanent_delete':
        // 벌크 영구 삭제 (시스템 관리자만 가능)
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (!profile || profile.role !== 'system_admin') {
          return NextResponse.json(
            { error: '영구 삭제 권한이 없습니다.' },
            { status: 403 }
          )
        }

        // 파일 정보들 조회
        const { data: reports, error: fetchError } = await supabase
          .from('photo_grid_reports')
          .select('id, file_name')
          .in('id', reportIds)

        if (fetchError) {
          return NextResponse.json(
            { error: 'PDF 정보 조회에 실패했습니다.' },
            { status: 500 }
          )
        }

        // Storage에서 파일들 삭제
        const filePaths = reports.map((r: any) => `photo-grid-reports/${r.file_name}`)
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove(filePaths)

        if (storageError) {
          console.warn('Storage 벌크 삭제 경고:', storageError)
          // Storage 삭제 실패해도 DB 레코드는 삭제 진행
        }

        // DB에서 레코드들 삭제
        const { error: permanentDeleteError } = await supabase
          .from('photo_grid_reports')
          .delete()
          .in('id', reportIds)

        if (permanentDeleteError) {
          console.error('벌크 영구 삭제 오류:', permanentDeleteError)
          return NextResponse.json(
            { error: '벌크 영구 삭제에 실패했습니다.' },
            { status: 500 }
          )
        }

        results = reportIds.map((id: any) => ({ id, action: 'permanently_deleted', success: true }))
        break

      case 'update_metadata':
        // 벌크 메타데이터 업데이트
        if (!actionData) {
          return NextResponse.json(
            { error: '업데이트할 데이터가 필요합니다.' },
            { status: 400 }
          )
        }

        const allowedFields = ['title', 'notes', 'status']
        const updates = Object.keys(actionData)
          .filter((key: any) => allowedFields.includes(key))
          .reduce((obj: any, key: any) => {
            obj[key] = actionData[key]
            return obj
          }, {} as any)

        if (Object.keys(updates).length === 0) {
          return NextResponse.json(
            { error: '업데이트할 유효한 필드가 없습니다.' },
            { status: 400 }
          )
        }

        updates.updated_at = new Date().toISOString()

        const { error: updateError } = await supabase
          .from('photo_grid_reports')
          .update(updates)
          .in('id', reportIds)

        if (updateError) {
          console.error('벌크 업데이트 오류:', updateError)
          return NextResponse.json(
            { error: '벌크 업데이트에 실패했습니다.' },
            { status: 500 }
          )
        }

        results = reportIds.map((id: any) => ({ id, action: 'updated', success: true, updates }))
        break

      default:
        return NextResponse.json(
          { error: `지원하지 않는 작업입니다: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      message: `벌크 ${action} 작업이 완료되었습니다.`,
      results,
      total: reportIds.length,
      successful: results.filter((r: any) => r.success).length
    })
  } catch (error) {
    console.error('API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}