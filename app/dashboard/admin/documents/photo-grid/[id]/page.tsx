import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { getPhotoGridReportDetail } from '@/lib/api/adapters/documents'

export const metadata: Metadata = {
  title: '사진대지 상세',
}

export default async function AdminPhotoGridDetailPage({
  params,
}: {
  params: { id: string }
}) {
  await requireAdminProfile()
  const detail = await getPhotoGridReportDetail(params.id).catch(() => null)
  const siteId: string | null =
    typeof detail?.site?.id === 'string' && detail.site.id.trim().length > 0
      ? detail.site.id.trim()
      : null
  if (siteId) {
    redirect(`/dashboard/admin/sites/${siteId}?tab=photos`)
  }
  redirect('/dashboard/admin/sites')
}
