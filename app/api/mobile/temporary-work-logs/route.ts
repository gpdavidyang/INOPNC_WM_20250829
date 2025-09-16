import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

// POST - 임시저장 생성
export async function POST(request: NextRequest) {
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

    // 최소 검증 (임시저장은 더 관대)
    if (!title) {
      return NextResponse.json({ error: '임시저장 제목이 필요합니다.' }, { status: 400 })
    }

    // 임시저장 데이터 삽입
    const { data: tempWorkLog, error: insertError } = await supabase
      .from('temporary_work_logs')
      .insert({
        user_id: userId,
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
      })
      .select()
      .single()

    if (insertError) {
      console.error('Temporary work log insert error:', insertError)
      return NextResponse.json({ error: '임시저장에 실패했습니다.' }, { status: 500 })
    }

    // 캐시 재검증
    revalidatePath('/mobile')
    revalidatePath('/mobile/worklog')

    return NextResponse.json({
      message: '임시저장이 완료되었습니다.',
      data: tempWorkLog,
    })
  } catch (error) {
    console.error('Temporary work log POST error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// GET - 임시저장 목록 조회
export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 사용자의 임시저장 목록 조회
    const { data: tempWorkLogs, error: selectError } = await supabase
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
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (selectError) {
      console.error('Temporary work logs select error:', selectError)
      return NextResponse.json({ error: '임시저장 목록 조회에 실패했습니다.' }, { status: 500 })
    }

    // 총 개수 조회
    const { count, error: countError } = await supabase
      .from('temporary_work_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (countError) {
      console.error('Temporary work logs count error:', countError)
    }

    return NextResponse.json({
      data: tempWorkLogs || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Temporary work logs GET error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// DELETE - 임시저장 삭제
export async function DELETE(request: NextRequest) {
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
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

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
