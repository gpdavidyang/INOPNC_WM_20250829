import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'


export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 사용자 프로필 조회
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { userId, year, month, siteId } = body

    // 권한 확인: 관리자는 모든 사용자, 일반 사용자는 본인만
    if (profile.role !== 'admin' && profile.role !== 'system_admin') {
      if (userId !== user.id) {
        return NextResponse.json(
          { error: 'Forbidden: Can only view own salary' },
          { status: 403 }
        )
      }
    }

    // 급여 계산
    const result = await salaryCalculationService.calculateMonthlySalary(
      userId || user.id,
      year,
      month,
      siteId
    )

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error: unknown) {
    console.error('Salary calculation error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())
    const siteId = searchParams.get('siteId') || undefined

    // 본인 급여만 조회
    const result = await salaryCalculationService.calculateMonthlySalary(
      user.id,
      year,
      month,
      siteId
    )

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error: unknown) {
    console.error('Salary fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
