import Link from 'next/link'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { PageHeader } from '@/components/ui/page-header'
import { buttonVariants } from '@/components/ui/button'
import { createServiceClient } from '@/lib/supabase/service'
import PhotoSheetActions from '@/components/admin/documents/PhotoSheetActions'
import { cn } from '@/lib/utils'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'

type SearchParams = {
  site_id?: string
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

type SiteOption = {
  value: string
  label: string
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

async function fetchPhotoSheets(searchParams: SearchParams) {
  const supabase = createServiceClient()
  const siteId =
    searchParams.site_id && searchParams.site_id !== 'all' ? searchParams.site_id : undefined
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

  if (siteId) {
    query = query.eq('site_id', siteId)
  }
  const { data, error } = await query
  if (error) {
    console.error('[photo-sheets] fetch error:', error)
    return []
  }
  return (data || []) as PhotoSheetRow[]
}

async function fetchSiteOptions() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('sites')
    .select('id, name')
    .order('name', { ascending: true })

  if (error) {
    console.error('[photo-sheets] fetch site options error:', error)
    return []
  }

  return (data || [])
    .filter((site): site is { id: string; name: string | null } => Boolean(site?.id))
    .map(
      site =>
        ({
          value: site.id,
          label: site.name || site.id,
        }) satisfies SiteOption
    )
}

export default async function AdminPhotoSheetsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  await requireAdminProfile()
  const [sheets, siteOptions] = await Promise.all([
    fetchPhotoSheets(searchParams),
    fetchSiteOptions(),
  ])
  const siteSelectOptions: SiteOption[] = [{ value: 'all', label: '전체 현장' }, ...siteOptions]

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="사진대지 관리"
        description="현장별 사진대지 생성 내역을 확인하고 작업을 수행합니다."
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '사진대지 관리' }]}
      />
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <form className="grid gap-4 rounded-lg border bg-card p-4 shadow-sm md:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">현장명 선택</span>
            <CustomSelect name="site_id" defaultValue={searchParams.site_id || 'all'}>
              <CustomSelectTrigger className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60">
                <CustomSelectValue placeholder="현장명을 선택하세요" />
              </CustomSelectTrigger>
              <CustomSelectContent>
                {siteSelectOptions.map(option => (
                  <CustomSelectItem key={option.value} value={option.value}>
                    {option.label}
                  </CustomSelectItem>
                ))}
              </CustomSelectContent>
            </CustomSelect>
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
              className={cn(buttonVariants({ variant: 'outline', size: 'standard' }))}
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
