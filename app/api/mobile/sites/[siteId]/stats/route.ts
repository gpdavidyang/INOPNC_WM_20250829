import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 1000

export async function GET(_request: NextRequest, context: { params: { siteId?: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const siteId = context.params?.siteId

    if (!siteId) {
      return NextResponse.json({ success: false, error: 'siteId is required' }, { status: 400 })
    }

    const serviceClient = createServiceRoleClient()

    let from = 0
    let totalHours = 0
    let iterations = 0

    // Paginate through work records to avoid exceeding PostgREST limits
    while (true) {
      const { data, error } = await serviceClient
        .from('work_records')
        .select('labor_hours, work_hours')
        .eq('site_id', siteId)
        .range(from, from + PAGE_SIZE - 1)

      if (error) {
        console.error('[mobile/sites/stats] query error:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch site statistics' },
          { status: 500 }
        )
      }

      if (!data || data.length === 0) {
        break
      }

      data.forEach(record => {
        const laborHours = Number(record?.labor_hours) || 0
        const workHours = Number(record?.work_hours) || 0
        totalHours += laborHours > 0 ? laborHours : workHours
      })

      if (data.length < PAGE_SIZE) {
        break
      }

      from += PAGE_SIZE
      iterations += 1

      // Safety guard to prevent infinite loops if the API misbehaves
      if (iterations > 50) {
        console.warn('[mobile/sites/stats] pagination exceeded expected iterations')
        break
      }
    }

    const totalManDays = Number((totalHours / 8).toFixed(1))

    return NextResponse.json({
      success: true,
      data: {
        totalHours: Number(totalHours.toFixed(2)),
        totalManDays,
      },
    })
  } catch (error) {
    console.error('[mobile/sites/stats] unexpected error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
