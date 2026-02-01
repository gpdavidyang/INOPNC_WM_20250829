import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const supabase = createClient()
    const searchParams = request.nextUrl.searchParams
    const siteId = searchParams.get('site_id')
    const worklogId = searchParams.get('worklog_id')
    const limit = Math.min(Number(searchParams.get('limit') || 100), 200)
    const photoType = searchParams.get('photo_type')?.toLowerCase() || null

    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const status = searchParams.get('status')

    let query = supabase
      .from('daily_report_additional_photos')
      .select(
        `
        id,
        daily_report_id,
        photo_type,
        file_url,
        file_path,
        file_name,
        file_size,
        upload_order,
        created_at,
        daily_reports!inner (
          id,
          site_id,
          work_date,
          status,
          sites (
            id,
            name
          )
        )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })

    if (siteId && siteId !== 'all') {
      query = query.eq('daily_reports.site_id', siteId)
    }
    if (worklogId) {
      query = query.eq('daily_report_id', worklogId)
    }
    if (photoType && ['before', 'after'].includes(photoType)) {
      query = query.eq('photo_type', photoType)
    }
    if (startDate) {
      query = query.gte('daily_reports.work_date', startDate)
    }
    if (endDate) {
      query = query.lte('daily_reports.work_date', endDate)
    }
    if (status && status !== 'all') {
      if (status === 'approved') {
        query = query.in('daily_reports.status', ['approved', 'submitted', 'completed', 'rejected'])
      } else if (status === 'draft') {
        query = query.in('daily_reports.status', ['draft', 'pending'])
      } else {
        query = query.eq('daily_reports.status', status)
      }
    }

    const { data, error, count } = await query.limit(limit)

    if (error) {
      console.error('[media/photos] query error:', error)
      return NextResponse.json(
        { success: true, data: { photos: [], total: 0 }, warning: 'query_failed' },
        { status: 200 }
      )
    }

    let signedMap = new Map<string, string>()
    const paths = (data || []).map((row: any) => row.file_path).filter(Boolean)
    if (paths.length) {
      try {
        const svc = createServiceClient()
        const { data: signedList, error: signedErr } = await (svc as any).storage
          .from('daily-reports')
          .createSignedUrls(paths, 60 * 60)
        if (!signedErr && Array.isArray(signedList)) {
          signedList.forEach((item: any) => {
            if (item?.path && item?.signedUrl) signedMap.set(item.path, item.signedUrl)
          })
        }
      } catch (signErr) {
        console.warn('[media/photos] signed url generation skipped:', signErr)
      }
    }

    try {
      const photos =
        data?.map(row => {
          const dr: any = (row as any).daily_reports
          const site = dr?.sites
          const filePath = (row as any).file_path
          const signed = filePath ? signedMap.get(filePath) : null
          return {
            id: row.id,
            url: signed || row.file_url,
            filePath: filePath || null,
            name: row.file_name || '사진',
            size: row.file_size || null,
            type: row.photo_type,
            worklogId: dr?.id || row.daily_report_id || null,
            workDate: dr?.work_date || null,
            workDescription: dr?.work_description || dr?.title || null,
            siteId: dr?.site_id || site?.id || null,
            siteName: site?.name || '미지정',
            status: dr?.status || null,
            uploadedAt: row.created_at,
            order: row.upload_order,
          }
        }) || []

      return NextResponse.json({
        success: true,
        data: {
          photos,
          total: count ?? photos.length,
        },
      })
    } catch (mapError) {
      console.error('[media/photos] map error:', mapError)
      return NextResponse.json(
        { success: true, data: { photos: [], total: 0 }, warning: 'map_failed' },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error('[media/photos] unexpected error:', error)
    return NextResponse.json(
      { success: true, data: { photos: [], total: 0 }, warning: 'unexpected_error' },
      { status: 200 }
    )
  }
}
