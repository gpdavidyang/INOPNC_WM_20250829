import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all active sites
    const { data: sites, error } = await supabase
      .from('sites')
      .select(`
        id,
        name,
        address,
        status
      `)
      .eq('status', 'active')
      .order('name')

    if (error) {
      console.error('Sites query error:', error)
      return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 })
    }

    // Return sites in the format expected by the frontend
    const formattedSites = [
      { id: 'all', name: '전체 현장' },
      ...(sites || []).map(site => ({
        id: site.id,
        name: site.name
      }))
    ]

    return NextResponse.json({
      success: true,
      data: formattedSites
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}