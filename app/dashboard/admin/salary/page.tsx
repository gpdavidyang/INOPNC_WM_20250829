import { redirect } from 'next/navigation'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'

export default async function AdminSalaryPage() {
  await requireAdminProfile()
  redirect('/dashboard/admin/salary/dashboard')
}
