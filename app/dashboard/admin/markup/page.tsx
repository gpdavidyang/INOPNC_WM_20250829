import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'

export const metadata: Metadata = {
  title: '도면 마킹 관리',
}

export default async function MarkupManagementPage() {
  await requireAdminProfile()

  // 기존 문서 관리 화면으로 이동
  redirect('/dashboard/admin/documents/markup')
}
