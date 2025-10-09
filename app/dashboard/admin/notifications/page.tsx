import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'

export const metadata: Metadata = {
  title: '알림 센터',
}

export default async function NotificationCenterPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  await requireAdminProfile()
  const search = ((searchParams?.search as string) || '').trim()
  const qs = new URLSearchParams()
  qs.set('tab', 'logs')
  if (search) qs.set('search', search)
  redirect(`/dashboard/admin/communication?${qs.toString()}`)
}
