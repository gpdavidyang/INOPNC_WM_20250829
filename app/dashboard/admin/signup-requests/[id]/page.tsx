import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import SignupRequestDetailClient from '@/components/admin/signup-requests/SignupRequestDetailClient'

export const metadata: Metadata = { title: '가입요청 상세' }

const STATUS_KO: Record<string, string> = {
  pending: '대기',
  approved: '승인',
  rejected: '거절',
}

export default async function AdminSignupRequestDetailPage({ params }: { params: { id: string } }) {
  await requireAdminProfile()
  const supabase = createClient()

  const { data: req } = await supabase
    .from('signup_requests')
    .select('*')
    .eq('id', params.id)
    .maybeSingle()

  return (
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="가입요청 상세"
        description={`ID: ${params.id}`}
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '가입 요청', href: '/dashboard/admin/signup-requests' },
          { label: '상세' },
        ]}
        showBackButton
        backButtonHref="/dashboard/admin/signup-requests"
      />

      <div className="px-4 sm:px-6 lg:px-8">
        <SignupRequestDetailClient request={req as any} />
      </div>
    </div>
  )
}
