import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import DashboardLayout from '@/components/dashboard/dashboard-layout'

export default async function RequestsPage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardLayout user={user} profile={user.profile!}>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">본사요청</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">본사요청 기능이 준비 중입니다.</p>
          </div>
        </div>
      </DashboardLayout>
    </Suspense>
  )
}