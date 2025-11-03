import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminPhotoGridReportsRedirect({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const siteId =
    typeof searchParams?.site_id === 'string' && searchParams.site_id.trim().length > 0
      ? searchParams.site_id.trim()
      : null
  if (siteId) {
    redirect(`/dashboard/admin/sites/${siteId}?tab=photos`)
  }
  redirect('/dashboard/admin/sites')
}
