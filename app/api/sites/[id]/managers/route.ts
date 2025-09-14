import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ManagerContact } from '@/types/site-info'

export const dynamic = 'force-dynamic'


/**
 * GET /api/sites/[id]/managers
 * Get all manager contacts for a site
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const siteId = params.id

    // Fetch site with manager information
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select(`
        id,
        name,
        construction_manager_phone,
        safety_manager_phone
      `)
      .eq('id', siteId)
      .single()

    if (siteError || !site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      )
    }

    // Create manager contacts array
    const managers: ManagerContact[] = []
    
    if (site.construction_manager_phone) {
      managers.push({
        role: 'construction_manager' as const,
        name: '현장 소장',
        phone: site.construction_manager_phone
      })
    }
    
    if (site.safety_manager_phone) {
      managers.push({
        role: 'safety_manager' as const,
        name: '안전 관리자',
        phone: site.safety_manager_phone
      })
    }

    // You could also fetch additional managers from a separate managers table if needed
    // For example:
    // const { data: additionalManagers } = await supabase
    //   .from('site_managers')
    //   .select('*')
    //   .eq('site_id', siteId)
    //   .eq('is_active', true)

    return NextResponse.json({ 
      data: {
        siteId: site.id,
        siteName: site.name,
        managers
      }
    })
  } catch (error) {
    console.error('Error fetching site managers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
