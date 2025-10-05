import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminPhotoGridReportsRedirect({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const sp = new URLSearchParams()
  const keys: Array<keyof NonNullable<typeof searchParams>> = [
    'page',
    'limit',
    'search',
    'status',
    'site_id',
  ]
  for (const k of keys) {
    const v = (searchParams || {})[k]
    if (typeof v === 'string' && v) sp.set(k, v)
  }
  redirect(`/dashboard/admin/documents/photo-grid${sp.toString() ? `?${sp.toString()}` : ''}`)
}
