import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { OrganizationEditForm } from '@/components/admin/organizations/OrganizationEditForm'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = {
  title: '조직 수정',
}

interface OrganizationEditPageProps {
  params: { id: string }
}

export default async function AdminOrganizationEditPage({ params }: OrganizationEditPageProps) {
  await requireAdminProfile()

  const cookieHeader = cookies()
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/admin/organizations/${params.id}`,
    {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    }
  )

  let organization: Record<string, unknown> | null = null

  if (response.ok) {
    const data = await response.json()
    organization = data.organization ?? data.data?.organization ?? null
  }

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="조직 수정"
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '조직 관리', href: '/dashboard/admin/organizations' },
          { label: '조직 수정' },
        ]}
        showBackButton
        backButtonHref="/dashboard/admin/organizations"
      />
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        {organization ? (
          <OrganizationEditForm organization={organization as any} />
        ) : (
          <p className="rounded-md border border-dashed border-muted-foreground/40 px-4 py-10 text-center text-sm text-muted-foreground">
            조직 정보를 불러오지 못했습니다. 조직이 존재하지 않거나 권한이 없습니다.
          </p>
        )}
      </div>
    </div>
  )
}
