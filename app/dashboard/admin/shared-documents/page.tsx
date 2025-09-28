import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'

export const metadata: Metadata = { title: '공유 문서함 관리' }

export default async function SharedDocumentsManagementPage() {
  await requireAdminProfile()
  redirect('/dashboard/admin/documents/shared')
}
