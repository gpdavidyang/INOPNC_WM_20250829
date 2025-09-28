import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
              <Input name="search" defaultValue={search} placeholder="제목/내용 검색" />
              <Button type="submit" variant="outline">
                검색
              </Button>
            </form>
            <Link
              href="/dashboard/admin/notifications"
              className="inline-flex items-center rounded-md border px-3 py-2 text-sm"
            >
              알림 이력 보기
            </Link>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>게시일</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead>대상 역할</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-sm text-muted-foreground py-10"
                    >
                      표시할 공지가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  announcements.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        {a.created_at ? new Date(a.created_at).toLocaleString('ko-KR') : '-'}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {a.title || '-'}
                      </TableCell>
                      <TableCell
                        className="truncate max-w-[320px]"
                        title={(a.target_roles || []).join(', ')}
                      >
                        {(a.target_roles || []).join(', ') || '-'}
                      </TableCell>
                      <TableCell>{a.is_active ? '활성' : '비활성'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
