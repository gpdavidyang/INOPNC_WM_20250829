import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'

export const metadata: Metadata = {
  title: '자재 관리 설정',
}

export default async function AdminMaterialsSettingsPage() {
  await requireAdminProfile()
  // Redirect to the Settings tab within Materials to avoid duplication
  redirect('/dashboard/admin/materials?tab=settings')
}
