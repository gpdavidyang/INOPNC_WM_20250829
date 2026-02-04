import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import PhotoSheetsManager from '@/components/admin/photo-sheets/PhotoSheetsManager'
import { PageHeader } from '@/components/ui/page-header'
import { createServiceClient } from '@/lib/supabase/service'

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
  source_daily_report_id?: string | null
  source_daily_report_summary?: string | null
  photo_count?: number
  site?: {
    id: string
    name?: string | null
    address?: string | null
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
  const baseSelect = `
        id,
        title,
        rows,
        cols,
        orientation,
        status,
        created_at,
        site_id,
        source_daily_report_id,
        source_daily_report_summary,
        site:sites ( id, name, address )
      `

  const fallbackSelect = `
        id,
        title,
        rows,
        cols,
        orientation,
        status,
        created_at,
        site_id,
        source_daily_report_id,
        site:sites ( id, name, address )
      `

  const basicSelect = `
        id,
        title,
        rows,
        cols,
        orientation,
        status,
        created_at,
        site_id,
        site:sites ( id, name, address )
      `

  const buildQuery = (selectFields: string) => {
    let q = supabase
      .from('photo_sheets')
      .select(selectFields)
      .order('created_at', { ascending: false })
      .range(0, 199)
    if (siteId) q = q.eq('site_id', siteId)
    return q
  }

  let data: PhotoSheetRow[] | null = null
  let res = await buildQuery(baseSelect)

  if (res.error) {
    console.warn(
      '[photo-sheets] Primary fetch failed, trying secondary fallback...',
      res.error.message
    )
    res = await buildQuery(fallbackSelect)

    if (res.error) {
      console.warn(
        '[photo-sheets] Secondary fetch failed, trying basic fallback...',
        res.error.message
      )
      res = await buildQuery(basicSelect)
    }
  }

  data = (res.data || []) as PhotoSheetRow[]

  const sheets = (data || []).map(sheet => ({ ...sheet, photo_count: 0 }))
  const sheetIds = sheets.map(sheet => sheet.id).filter(Boolean)
  if (sheetIds.length === 0) return sheets

  const { data: itemRows, error: itemError } = await supabase
    .from('photo_sheet_items')
    .select('photosheet_id')
    .in('photosheet_id', sheetIds)

  if (itemError) {
    console.warn('[photo-sheets] fetch photo count error (fallback to zero):', itemError)
    return sheets
  }

  const countMap = new Map<string, number>()
  ;(itemRows || []).forEach(row => {
    if (!row?.photosheet_id) return
    countMap.set(row.photosheet_id, (countMap.get(row.photosheet_id) || 0) + 1)
  })

  return sheets.map(sheet => ({
    ...sheet,
    photo_count: countMap.get(sheet.id) || 0,
  }))
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
        <PhotoSheetsManager
          searchParams={searchParams}
          siteOptions={siteSelectOptions}
          sheets={sheets}
        />
      </div>
    </div>
  )
}
