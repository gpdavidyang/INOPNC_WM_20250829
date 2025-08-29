import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SiteSearchResult } from '@/types/site-info'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/sites/search
 * Search sites with Korean language support
 * Query parameters:
 * - siteName: string (optional) - Site name to search
 * - workerName: string (optional) - Worker name to search
 * - startDate: string (optional) - Construction start date filter
 * - endDate: string (optional) - Construction end date filter
 * - limit: number (optional) - Max results (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const siteName = searchParams.get('siteName') || ''
    const workerName = searchParams.get('workerName') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Start building query
    let query = supabase
      .from('sites')
      .select(`
        id,
        name,
        address,
        start_date,
        end_date,
        status
      `)
      .eq('status', 'active')

    // Apply site name filter (case-insensitive)
    if (siteName) {
      query = query.ilike('name', `%${siteName}%`)
    }

    // Apply date range filter if both dates provided
    if (startDate && endDate) {
      query = query
        .gte('start_date', startDate)
        .lte('end_date', endDate)
    }

    // Limit results
    query = query.limit(Math.min(limit, 100)) // Cap at 100

    const { data: sites, error: searchError } = await query

    if (searchError) {
      throw searchError
    }

    // Calculate construction progress
    const calculateProgress = (startDate: string, endDate: string): number => {
      const start = new Date(startDate).getTime()
      const end = new Date(endDate).getTime()
      const now = new Date().getTime()

      if (now < start) return 0
      if (now > end) return 100

      const total = end - start
      const elapsed = now - start
      return Math.round((elapsed / total) * 100)
    }

    // Format results
    const results: SiteSearchResult[] = (sites || []).map((site: any) => ({
      id: site.id,
      name: site.name,
      address: site.address || '주소 정보 없음',
      construction_period: {
        start_date: new Date(site.start_date),
        end_date: site.end_date ? new Date(site.end_date) : new Date()
      },
      progress_percentage: calculateProgress(
        site.start_date,
        site.end_date || new Date().toISOString()
      ),
      participant_count: 0, // TODO: Get actual count from site_assignments
      is_active: site.status === 'active'
    }))

    // Sort by name for Korean language support
    results.sort((a, b) => a.name.localeCompare(b.name, 'ko'))

    return NextResponse.json({ 
      data: results,
      total: results.length
    })
  } catch (error) {
    console.error('Error searching sites:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}