import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'

export const metadata: Metadata = {
  title: '문서 관리',
}

export default async function AdminDocumentsPage() {
  await requireAdminProfile()
  redirect('/dashboard/admin/documents/shared')
}
