import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const statusParam = (searchParams.get('status') || '').toLowerCase()
    const includeDeleted = ['1', 'true', 'yes'].includes(
      (searchParams.get('include_deleted') || '').toLowerCase()
    )

    let query = supabase
      .from('sites')
      .select(
        `
        id,
        name,
        address,
        status,
        created_at
      `
      )
      .order('created_at', { ascending: false })

    if (!includeDeleted) {
      query = query.eq('is_deleted', false)
    }

    if (!statusParam || statusParam === 'active') {
      query = query.eq('status', 'active')
    } else if (statusParam !== 'all') {
      query = query.eq('status', statusParam)
    }

    const { data: sites, error } = await query

    if (error) {
      console.error('Sites query error:', error)
      return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 })
    }

    // Return sites in the format expected by the frontend
    const formattedSites = (sites || []).map((site: unknown) => ({
      id: site.id,
      name: site.name,
      address: site.address,
      status: site.status,
      created_at: site.created_at,
    }))

    return NextResponse.json({
      success: true,
      data: formattedSites,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
