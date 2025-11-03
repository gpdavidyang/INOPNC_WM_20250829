import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'

export const metadata: Metadata = {
  title: '포토 그리드 문서',
}

export default async function AdminPhotoGridDocumentsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  await requireAdminProfile()
  const siteId = typeof searchParams?.site_id === 'string' && searchParams.site_id.trim().length > 0
    ? searchParams.site_id.trim()
    : null
  if (siteId) {
    redirect(`/dashboard/admin/sites/${siteId}?tab=photos`)
  }
  redirect('/dashboard/admin/sites')
}
