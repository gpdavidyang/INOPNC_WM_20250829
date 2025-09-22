import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import AssignmentDashboard from '@/components/admin/assignment/AssignmentDashboard'

export const metadata: Metadata = {
  title: '통합 배정 관리 - 관리자',
  description: '파트너사-현장 매핑 및 사용자 배정 통합 관리 시스템',
}

export default async function AssignmentPage() {
  await requireAdminProfile()

  return (
    <div className="container mx-auto px-4 py-6">
      <AssignmentDashboard />
    </div>
  )
}
