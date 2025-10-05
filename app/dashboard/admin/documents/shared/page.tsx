import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import SharedDocumentsTable from '@/components/admin/SharedDocumentsTable'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/ui/strings'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: '공유 문서',
}

export default async function AdminSharedDocumentsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  await requireAdminProfile()
  const supabase = createClient()

  const page = Math.max(1, Number((searchParams?.page as string) || '1') || 1)
  const limitRaw = Number((searchParams?.limit as string) || '20') || 20
  const limit = Math.min(50, Math.max(10, limitRaw))
  const search = ((searchParams?.search as string) || '').trim()
  const site_id = ((searchParams?.site_id as string) || '').trim()
  const status = ((searchParams?.status as string) || '').trim()

  let query = supabase
    .from('unified_document_system')
    .select(
      `
      id,
      title,
      status,
      category_type,
      created_at,
      site:sites(id,name),
      uploader:profiles!unified_document_system_uploaded_by_fkey(full_name,email)
    `,
      { count: 'exact' }
    )
    .eq('category_type', 'shared')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (search) query = query.ilike('title', `%${search}%`)
  if (site_id) query = query.eq('site_id', site_id)
  if (status) query = query.eq('status', status)

  const offset = (page - 1) * limit
  query = query.range(offset, offset + limit - 1)

  const { data, count } = await query
  const docs = Array.isArray(data) ? data : []
  const total = count || 0
  const pages = Math.max(1, Math.ceil(total / limit))

  const buildQuery = (nextPage: number) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (site_id) params.set('site_id', site_id)
    if (status) params.set('status', status)
    params.set('limit', String(limit))
    params.set('page', String(nextPage))
    const qs = params.toString()
    return qs ? `?${qs}` : ''
  }

  const statusBadge = (s?: string) => (
    <Badge variant={s === 'approved' ? 'default' : 'outline'}>{s || '-'}</Badge>
  )

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="공유 문서"
        description="조직 간 공유된 문서 목록"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '문서 관리', href: '/dashboard/admin/documents' }, { label: '공유 문서' }]}
        showBackButton
        backButtonHref="/dashboard/admin/documents"
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8">

      <div className="mb-6 rounded-lg border bg-card p-4 shadow-sm">
        <form
          method="GET"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 items-end"
        >
          <input type="hidden" name="page" value="1" />
          <div className="lg:col-span-2">
            <label className="block text-sm text-muted-foreground mb-1">검색어</label>
            <Input name="search" defaultValue={search} placeholder="문서명" />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">현장 ID</label>
            <Input name="site_id" defaultValue={site_id} placeholder="site_id" />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">상태</label>
            <Input name="status" defaultValue={status} placeholder="uploaded/approved 등" />
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
              href="/dashboard/admin/documents/shared"
              className="inline-flex items-center rounded-md border px-3 py-2 text-sm"
            >
              {t('common.reset')}
            </Link>
          </div>
        </form>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
        <SharedDocumentsTable docs={docs} />

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {total}건 중 {(page - 1) * limit + Math.min(1, total)}-{Math.min(page * limit, total)}{' '}
            표시
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
  )
}
