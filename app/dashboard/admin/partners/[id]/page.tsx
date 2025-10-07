import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { PartnerDetail } from '@/components/admin/partners/PartnerDetail'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = {
  title: '공급업체 상세',
}

interface PartnerDetailPageProps {
  params: { id: string }
}

export default async function AdminPartnerDetailPage({ params }: PartnerDetailPageProps) {
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
  let related: { sites: unknown[]; contacts: unknown[] } = { sites: [], contacts: [] }

  if (response.ok) {
    const data = await response.json()
    partner = data.partner ?? data.data?.partner ?? null
    related = data.related ?? related
  }

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="공급업체 상세"
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '공급업체 관리', href: '/dashboard/admin/partners' },
          { label: '상세' },
        ]}
        showBackButton
        backButtonHref="/dashboard/admin/partners"
      />
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        {partner ? (
          <PartnerDetail
            partner={partner as any}
            sites={related.sites as any}
            contacts={related.contacts as any}
          />
        ) : (
          <p className="rounded-md border border-dashed border-muted-foreground/40 px-4 py-10 text-center text-sm text-muted-foreground">
            업체 정보를 불러오지 못했습니다. 업체가 존재하지 않거나 권한이 없습니다.
          </p>
        )}
      </div>
    </div>
  )
}
