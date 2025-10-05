import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { getSignupRequests, getSignupRequestStats } from '@/app/actions/admin/signup-approvals'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import SignupRequestsTable from '@/components/admin/SignupRequestsTable'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/ui/strings'
import { PageHeader } from '@/components/ui/page-header'
import { buttonVariants } from '@/components/ui/button'

export const metadata: Metadata = {
  title: '가입 요청 관리',
}

export default async function AdminSignupRequestsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  await requireAdminProfile()

  const search = ((searchParams?.search as string) || '').trim()

  const [{ stats }, { requests }] = await Promise.all([
    getSignupRequestStats(),
    getSignupRequests(search),
  ])

  return (
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="가입 요청 관리"
        description="최근 요청을 검토하고 승인/거절합니다"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '가입 요청' }]}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardHeader>
              <CardTitle>총 요청</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{stats?.total ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>대기</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{stats?.pending ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>승인</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{stats?.approved ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>거절</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{stats?.rejected ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>요청 목록</CardTitle>
            <CardDescription>최근 요청부터 표시</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <form method="GET" className="flex items-center gap-2">
                <Input name="search" defaultValue={search} placeholder={t('common.search')} />
                <Button type="submit" variant="outline">
                  {t('common.search')}
                </Button>
                <Link
                  href="/dashboard/admin/signup-requests"
                  className={buttonVariants({ variant: 'outline', size: 'standard' })}
                  role="button"
                >
                  {t('common.reset')}
                </Link>
              </form>
            </div>
            <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
              <SignupRequestsTable requests={Array.isArray(requests) ? requests : []} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
