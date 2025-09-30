import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import ClientView from './ClientView'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: '문서함 유지보수' }

export default async function AdminDocumentsMaintenancePage() {
  await requireAdminProfile()
  return <ClientView />
}
