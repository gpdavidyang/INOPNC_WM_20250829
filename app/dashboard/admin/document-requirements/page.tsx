import { redirect } from 'next/navigation'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'

export default async function AdminDocumentRequirementsPage() {
  await requireAdminProfile()
  // 통합 화면의 설정 탭으로 리디렉션
  redirect('/dashboard/admin/documents/required?tab=settings')
}
