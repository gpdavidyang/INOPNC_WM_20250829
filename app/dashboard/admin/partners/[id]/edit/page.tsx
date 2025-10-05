import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { PartnerEditForm } from '@/components/admin/partners/PartnerEditForm'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = {
  title: '파트너 수정',
}

interface PartnerEditPageProps {
  params: { id: string }
}

export default async function AdminPartnerEditPage({ params }: PartnerEditPageProps) {
  await requireAdminProfile()

  const cookieHeader = cookies()
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/admin/partner-companies/${params.id}`,
    {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    }
  )

  let partner: Record<string, unknown> | null = null

  if (response.ok) {
    const data = await response.json()
    partner = data.partner ?? data.data?.partner ?? null
  }

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="파트너 수정"
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '파트너 관리', href: '/dashboard/admin/partners' },
          { label: '파트너 수정' },
        ]}
        showBackButton
        backButtonHref="/dashboard/admin/partners"
      />
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        {partner ? (
          <PartnerEditForm partner={partner as any} />
        ) : (
          <p className="rounded-md border border-dashed border-muted-foreground/40 px-4 py-10 text-center text-sm text-muted-foreground">
            파트너 정보를 불러오지 못했습니다. 파트너가 존재하지 않거나 권한이 없습니다.
          </p>
        )}
      </div>
    </div>
  )
}
