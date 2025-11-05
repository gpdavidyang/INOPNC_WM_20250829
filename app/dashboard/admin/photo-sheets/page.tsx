import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { PageHeader } from '@/components/ui/page-header'
import { createServiceClient } from '@/lib/supabase/service'
import PhotoSheetsManager from '@/components/admin/photo-sheets/PhotoSheetsManager'

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
        site:sites!photo_sheets_site_id_fkey ( id, name, address )
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
        <PhotoSheetsManager
          searchParams={searchParams}
          siteOptions={siteSelectOptions}
          sheets={sheets}
        />
      </div>
    </div>
  )
}
