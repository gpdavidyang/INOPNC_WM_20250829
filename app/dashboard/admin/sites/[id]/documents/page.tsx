import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'

export const metadata: Metadata = { title: '현장 기성청구 문서' }

export default async function AdminSiteDocumentsPage({ params }: { params: { id: string } }) {
  await requireAdminProfile()
  redirect(`/dashboard/admin/sites/${params.id}?tab=invoices`)
}
