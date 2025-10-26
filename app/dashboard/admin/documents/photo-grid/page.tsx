import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { headers } from 'next/headers'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import PhotoGridReportsTable from '@/components/admin/PhotoGridReportsTable'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/ui/strings'
import { PageHeader } from '@/components/ui/page-header'
import { buttonVariants } from '@/components/ui/button'
const PhotoSheetActions = dynamic(() => import('@/components/admin/documents/PhotoSheetActions'), { ssr: false })
import { formatBytes } from '@/lib/utils'

export const metadata: Metadata = {
  title: '포토 그리드 문서',
}

export default async function AdminPhotoGridDocumentsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  await requireAdminProfile()

  const page = Math.max(1, Number((searchParams?.page as string) || '1') || 1)
  const limitRaw = Number((searchParams?.limit as string) || '20') || 20
  const limit = Math.min(50, Math.max(10, limitRaw))
  const search = ((searchParams?.search as string) || '').trim()
  const status = ((searchParams?.status as string) || '').trim()
  const site_id = ((searchParams?.site_id as string) || '').trim()

  const qs = new URLSearchParams()
  const offset = (page - 1) * limit
  qs.set('limit', String(limit))
  qs.set('offset', String(offset))
  if (status) qs.set('status', status)
  if (site_id) qs.set('siteId', site_id)
  const getOrigin = () => {
    const base = process.env.NEXT_PUBLIC_BASE_URL
    if (base) return base.replace(/\/$/, '')
    const h = headers()
    const proto = h.get('x-forwarded-proto') ?? 'http'
    const host = h.get('x-forwarded-host') ?? h.get('host')
    return `${proto}://${host}`
  }
  let reports: any[] = []
  let total = 0
  // New: directly-uploaded photo sheets (새 사진대지)
  let photoSheets: any[] = []
  let photoSheetsTotal = 0
  try {
    const res = await fetch(`${getOrigin()}/api/photo-grid-reports?${qs.toString()}`, {
      cache: 'no-store',
    })
    if (res.ok) {
      const json = await res.json().catch(() => ({}))
      reports = Array.isArray(json?.data) ? json.data : []
      total = Number(json?.total || 0)
    }
  } catch {
    // silent fallback to empty list
  }
  // Fetch photo sheets created via the new editor (직접업로드)
  try {
    const sheetQs = new URLSearchParams()
    if (site_id) sheetQs.set('site_id', site_id)
    const res2 = await fetch(`${getOrigin()}/api/photo-sheets?${sheetQs.toString()}`, {
      cache: 'no-store',
    })
    if (res2.ok) {
      const json2 = await res2.json().catch(() => ({}))
      const list = Array.isArray(json2?.data) ? json2.data : []
      photoSheets = list
      photoSheetsTotal = list.length
    }
  } catch {
    // ignore
  }
  const pages = Math.max(1, Math.ceil(total / limit))

  const buildQuery = (nextPage: number) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    if (site_id) params.set('site_id', site_id)
    params.set('limit', String(limit))
    params.set('page', String(nextPage))
    const qs = params.toString()
    return qs ? `?${qs}` : ''
  };

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="포토 그리드 문서"
        description="최근 생성된 사진대지 PDF 보고서"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '문서 관리', href: '/dashboard/admin/documents' }, { label: '포토 그리드' }]}
        showBackButton
        backButtonHref="/dashboard/admin/documents"
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">사진대지 생성은 개선된 에디터에서 가능합니다.</div>
        <Link href={`/dashboard/admin/tools/photo-grid${site_id ? `?site_id=${site_id}` : ''}`} className={buttonVariants({ variant: 'default', size: 'standard' })}>
          새 사진대지 만들기(개선)
        </Link>
      </div>

      <div className="mb-6 rounded-lg border bg-card p-4 shadow-sm">
        <form
          method="GET"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 items-end"
        >
          <input type="hidden" name="page" value="1" />
          <div className="lg:col-span-2">
            <label className="block text-sm text-muted-foreground mb-1">검색어</label>
            <Input name="search" defaultValue={search} placeholder={t('common.search')} />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">상태</label>
            <select
              name="status"
              defaultValue={status}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">전체</option>
              <option value="active">활성</option>
              <option value="archived">보관</option>
              <option value="pending">대기</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">현장 ID</label>
            <Input name="site_id" defaultValue={site_id} placeholder="site_id" />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">페이지 크기</label>
            <select
              name="limit"
              defaultValue={String(limit)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
          <div className="lg:col-span-2 flex gap-2">
            <Button type="submit" variant="outline">
              {t('common.apply')}
            </Button>
            <Link
              href="/dashboard/admin/documents/photo-grid"
              className={buttonVariants({ variant: 'outline', size: 'standard' })}
              role="button"
            >
              {t('common.reset')}
            </Link>
          </div>
        </form>
      </div>

      {/* 최근 생성된 사진대지(직접업로드) */}
      <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto mb-6">
        <div className="mb-3">
          <div className="text-base font-semibold">최근 생성된 사진대지 (직접업로드)</div>
          <div className="text-xs text-muted-foreground">새 에디터에서 저장된 사진대지 목록</div>
        </div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted text-left">
              <th className="px-3 py-2">생성일</th>
              <th className="px-3 py-2">현장</th>
              <th className="px-3 py-2">제목/격자</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">동작</th>
            </tr>
          </thead>
          <tbody>
            {photoSheetsTotal === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-muted-foreground" colSpan={5}>
                  생성된 사진대지가 없습니다.
                </td>
              </tr>
            ) : (
              photoSheets.map((s: any) => (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2">{s.created_at ? new Date(s.created_at).toLocaleString('ko-KR') : '-'}</td>
                  <td className="px-3 py-2">{s?.site?.name || '-'}</td>
                  <td className="px-3 py-2">
                    <div className="text-foreground">{s.title || '사진대지'}</div>
                    <div className="text-xs text-muted-foreground">{(s.rows || 0) + '×' + (s.cols || 0)} · {s.orientation === 'landscape' ? '가로' : '세로'}</div>
                  </td>
                  <td className="px-3 py-2">{s.status === 'final' ? '확정' : '초안'}</td>
                  <td className="px-3 py-2">
                    <PhotoSheetActions id={s.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 레거시 PDF 보고서 */}
      <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
        <div className="mb-3">
          <div className="text-base font-semibold">레거시 사진대지 PDF 보고서</div>
          <div className="text-xs text-muted-foreground">기존 방식으로 생성된 PDF 리스트</div>
        </div>
        <PhotoGridReportsTable reports={reports} />
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {total}건 중 {(page - 1) * limit + Math.min(1, total)}-{Math.min(page * limit, total)} 표시
          </div>
          <div className="flex gap-2">
            <Link
              href={buildQuery(Math.max(1, page - 1))}
              className={`inline-flex items-center rounded-md border px-3 py-2 text-sm ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
            >
              {t('common.prev')}
            </Link>
            <Link
              href={buildQuery(Math.min(pages, page + 1))}
              className={`inline-flex items-center rounded-md border px-3 py-2 text-sm ${page >= pages ? 'pointer-events-none opacity-50' : ''}`}
            >
              {t('common.next')}
            </Link>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}
