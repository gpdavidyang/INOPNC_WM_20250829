'use client'

import { SalaryView } from '@/components/attendance/salary-view'
import type { Profile } from '@/types'

interface SiteManagerSalaryDashboardProps {
  profile: Profile
}

export function SiteManagerSalaryDashboard({ 
  profile 
}: SiteManagerSalaryDashboardProps) {

  // 현장관리자도 작업자와 동일한 급여 화면 사용 (본인 급여만 조회)
  return <SalaryView profile={profile} />
}