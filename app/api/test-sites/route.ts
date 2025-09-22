import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Get all sites
    const { data: sites, error } = await supabase
      .from('sites')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Get only active sites
    const { data: activeSites, error: activeError } = await supabase
      .from('sites')
      .select('*')
      .eq('status', 'active')
      .order('name')
    
    return NextResponse.json({
      allSites: sites,
      allSitesCount: sites?.length || 0,
      activeSites: activeSites,
      activeSitesCount: activeSites?.length || 0,
      error: activeError?.message
    })
  } catch (error) {
    return NextResponse.json({ error: 'Unexpected error', details: error }, { status: 500 })
  }
}