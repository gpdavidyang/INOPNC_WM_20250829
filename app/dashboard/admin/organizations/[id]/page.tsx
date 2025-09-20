import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { OrganizationDetail } from '@/components/admin/organizations/OrganizationDetail'

export const metadata: Metadata = {
  title: '조직 상세',
}

interface OrganizationDetailPageProps {
  params: { id: string }
}

export default async function AdminOrganizationDetailPage({ params }: OrganizationDetailPageProps) {
  await requireAdminProfile()

  const cookieHeader = cookies()
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ')

  const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/admin/organizations/${params.id}`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
  })

  let organization: Record<string, unknown> | null = null
  let related: { members: unknown[]; sites: unknown[] } = { members: [], sites: [] }

  if (response.ok) {
    const data = await response.json()
    organization = data.organization ?? data.data?.organization ?? null
    related = data.related ?? related
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      {organization ? (
        <OrganizationDetail
          organization={organization as any}
          members={related.members as any}
          sites={related.sites as any}
        />
      ) : (
        <p className="rounded-md border border-dashed border-muted-foreground/40 px-4 py-10 text-center text-sm text-muted-foreground">
          조직 정보를 불러오지 못했습니다. 조직이 존재하지 않거나 권한이 없습니다.
        </p>
      )}
    </div>
  )
}
