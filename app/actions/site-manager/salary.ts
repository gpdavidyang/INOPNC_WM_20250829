'use server'

import { createClient } from '@/lib/supabase/server'
import { salaryCalculationService } from '@/lib/services/salary-calculation.service'

// 현장관리자는 본인 급여만 조회 가능 - 작업자와 동일한 급여 조회 API 사용
// getTeamSalaryData 함수는 제거됨

interface TeamSalaryParams {
  siteId: string
  month: string
  year: string
}

export async function exportTeamSalaryReport(params: TeamSalaryParams & { format: 'pdf' | 'excel' }) {
  try {
    const supabase = createClient()
    
    // 권한 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: '인증되지 않은 사용자입니다' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, site_id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'site_manager' || profile.site_id !== params.siteId) {
      return { success: false, error: '권한이 없습니다' }
    }

    // TODO: 실제 보고서 생성 로직 구현
    // 현재는 mock URL 반환
    return {
      success: true,
      data: {
        url: `/api/reports/salary/${params.siteId}/${params.year}/${params.month}.${params.format}`,
        filename: `급여보고서_${params.year}-${params.month}.${params.format}`
      }
    }
  } catch (error: unknown) {
    console.error('급여 보고서 생성 오류:', error)
    return { success: false, error: error.message }
  }
}