import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import AnnounceTable from '@/components/admin/AnnounceTable'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/ui/strings'
import { PageHeader } from '@/components/ui/page-header'
import AnnouncementCreateForm from '@/components/admin/communication/AnnouncementCreateForm'

export const metadata: Metadata = { title: '커뮤니케이션 센터' }

export default async function CommunicationManagementPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  await requireAdminProfile()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''

  const search = ((searchParams?.search as string) || '').trim()
  const qs = new URLSearchParams()
  if (search) qs.set('search', search)

  // 공지 목록
  const announcementsRes = await fetch(
    `${baseUrl}/api/announcements${qs.toString() ? `?${qs}` : ''}`,
    { cache: 'no-store' }
  ).catch(() => null)
  const announcementsJson = await announcementsRes?.json().catch(() => null)
  const announcements: any[] = announcementsJson?.announcements || []

  return (
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="커뮤니케이션 센터"
        description="공지 작성 및 알림 연계를 관리합니다"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '커뮤니케이션' }]}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>공지 작성</CardTitle>
            <CardDescription>필수 필드만 입력하여 공지를 생성합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <AnnouncementCreateForm />
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardHeader>
              <CardTitle>활성 공지</CardTitle>
              <CardDescription>현재 게시 중</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">
                {announcements.filter(a => a.is_active).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>총 공지</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{announcements.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>공지사항</CardTitle>
            <CardDescription>역할/현장 조건에 따라 노출되는 관리자 공지</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex items-center gap-2">
              <form method="GET" className="flex items-center gap-2">
                <Input name="search" defaultValue={search} placeholder={t('common.search')} />
                <Button type="submit" variant="outline">
                  {t('common.search')}
                </Button>
              </form>
              <Link
                href="/dashboard/admin/notifications"
                className="inline-flex items-center rounded-md border px-3 py-2 text-sm"
              >
                {t('common.details')}
              </Link>
            </div>
            <AnnounceTable announcements={announcements} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
