import Link from 'next/link'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { PageHeader } from '@/components/ui/page-header'
import { buttonVariants } from '@/components/ui/button'
import { createServiceClient } from '@/lib/supabase/service'
import PhotoSheetActions from '@/components/admin/documents/PhotoSheetActions'
import { cn } from '@/lib/utils'

type SearchParams = {
  site_id?: string
  status?: string
}

type PhotoSheetRow = {
  id: string
  title: string | null
  rows: number
  cols: number
  orientation: 'portrait' | 'landscape'
  status?: string | null
  created_at?: string | null
  site_id: string
  site?: {
    id: string
    name?: string | null
  } | null
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

async function fetchPhotoSheets(searchParams: SearchParams) {
  const supabase = createServiceClient()
  let query = supabase
    .from('photo_sheets')
    .select(
      `
        id,
        title,
        rows,
        cols,
        orientation,
        status,
        created_at,
        site_id,
        site:sites!photo_sheets_site_id_fkey ( id, name )
      `
    )
    .order('created_at', { ascending: false })
    .range(0, 199)

  if (searchParams.site_id) {
    query = query.eq('site_id', searchParams.site_id)
  }
  if (searchParams.status && searchParams.status !== 'all') {
    query = query.eq('status', searchParams.status)
  }

  const { data, error } = await query
  if (error) {
    console.error('[photo-sheets] fetch error:', error)
    return []
  }
  return (data || []) as PhotoSheetRow[]
}

export default async function AdminPhotoSheetsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  await requireAdminProfile()
  const sheets = await fetchPhotoSheets(searchParams)

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="사진대지 관리"
        description="현장별 사진대지 생성 내역을 확인하고 작업을 수행합니다."
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '사진대지 관리' }]}
      />
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <form className="grid gap-4 rounded-lg border bg-card p-4 shadow-sm md:grid-cols-[1fr_1fr_auto]">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">현장 ID</span>
            <input
              name="site_id"
              placeholder="현장 ID를 입력하세요"
              defaultValue={searchParams.site_id || ''}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">상태</span>
            <select
              name="status"
              defaultValue={searchParams.status || 'all'}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <option value="all">전체</option>
              <option value="draft">초안</option>
              <option value="final">확정</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className={cn(buttonVariants({ variant: 'primary', size: 'standard' }))}
            >
              검색
            </button>
            <Link
              href="/dashboard/admin/photo-sheets"
              className={cn(buttonVariants({ variant: 'ghost', size: 'standard' }))}
            >
              초기화
            </Link>
            <a
              href="/dashboard/admin/tools/photo-grid"
              className={cn(buttonVariants({ variant: 'outline', size: 'standard' }))}
            >
              사진대지 생성
            </a>
          </div>
        </form>

        <section className="mt-6 rounded-lg border bg-card shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold text-muted-foreground">검색 결과</h2>
          </div>
          <div className="overflow-x-auto">
            {sheets.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                등록된 사진대지가 없습니다.
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">제목</th>
                    <th className="px-4 py-3 font-medium">현장</th>
                    <th className="px-4 py-3 font-medium">행×열</th>
                    <th className="px-4 py-3 font-medium">방향</th>
                    <th className="px-4 py-3 font-medium">상태</th>
                    <th className="px-4 py-3 font-medium">생성일</th>
                    <th className="px-4 py-3 font-medium">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {sheets.map(sheet => (
                    <tr key={sheet.id} className="border-b last:border-none">
                      <td className="px-4 py-3">{sheet.title || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {sheet.site?.name || '-'}
                          </span>
                          <span className="text-xs text-muted-foreground">{sheet.site_id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {sheet.rows}×{sheet.cols}
                      </td>
                      <td className="px-4 py-3">
                        {sheet.orientation === 'landscape' ? '가로' : '세로'}
                      </td>
                      <td className="px-4 py-3">
                        {sheet.status === 'final' ? (
                          <span className="rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-700">
                            확정
                          </span>
                        ) : (
                          <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                            초안
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {sheet.created_at
                          ? new Date(sheet.created_at).toLocaleString('ko-KR')
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <PhotoSheetActions id={sheet.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
