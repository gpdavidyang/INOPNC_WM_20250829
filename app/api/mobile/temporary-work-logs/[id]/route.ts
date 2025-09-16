import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: {
    id: string
  }
}

// GET - 특정 임시저장 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient()
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const userId = session.user.id
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'ID가 필요합니다.' }, { status: 400 })
    }

    // 사용자의 임시저장만 조회 가능
    const { data: tempWorkLog, error: selectError } = await supabase
      .from('temporary_work_logs')
      .select(
        `
        *,
        sites (
          id,
          name
        )
      `
      )
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (selectError) {
      console.error('Temporary work log select error:', selectError)
      if (selectError.code === 'PGRST116') {
        return NextResponse.json({ error: '임시저장을 찾을 수 없습니다.' }, { status: 404 })
      }
      return NextResponse.json({ error: '임시저장 조회에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      data: tempWorkLog,
    })
  } catch (error) {
    console.error('Temporary work log GET by ID error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// PUT - 임시저장 업데이트
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient()
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const userId = session.user.id
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'ID가 필요합니다.' }, { status: 400 })
    }

    // Request body 파싱
    const body = await request.json()
    const {
      site_id,
      work_date,
      department,
      location_info,
      member_types,
      work_contents,
      work_types,
      main_manpower,
      additional_manpower,
      work_sections,
      title,
    } = body

    // 최소 검증
    if (!title) {
      return NextResponse.json({ error: '임시저장 제목이 필요합니다.' }, { status: 400 })
    }

    // 사용자의 임시저장만 업데이트 가능
    const { data: updatedTempWorkLog, error: updateError } = await supabase
      .from('temporary_work_logs')
      .update({
        site_id: site_id || null,
        work_date: work_date || null,
        department: department || null,
        location_info: location_info || null,
        member_types: member_types || [],
        work_contents: work_contents || [],
        work_types: work_types || [],
        main_manpower: main_manpower || null,
        additional_manpower: additional_manpower || [],
        work_sections: work_sections || [],
        title,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Temporary work log update error:', updateError)
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: '임시저장을 찾을 수 없습니다.' }, { status: 404 })
      }
      return NextResponse.json({ error: '임시저장 업데이트에 실패했습니다.' }, { status: 500 })
    }

    // 캐시 재검증
    revalidatePath('/mobile')
    revalidatePath('/mobile/worklog')

    return NextResponse.json({
      message: '임시저장이 업데이트되었습니다.',
      data: updatedTempWorkLog,
    })
  } catch (error) {
    console.error('Temporary work log PUT error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// DELETE - 특정 임시저장 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createClient()
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const userId = session.user.id
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'ID가 필요합니다.' }, { status: 400 })
    }

    // 사용자의 임시저장만 삭제 가능
    const { error: deleteError } = await supabase
      .from('temporary_work_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Temporary work log delete error:', deleteError)
      return NextResponse.json({ error: '임시저장 삭제에 실패했습니다.' }, { status: 500 })
    }

    // 캐시 재검증
    revalidatePath('/mobile')
    revalidatePath('/mobile/worklog')

    return NextResponse.json({
      message: '임시저장이 삭제되었습니다.',
    })
  } catch (error) {
    console.error('Temporary work log DELETE error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
