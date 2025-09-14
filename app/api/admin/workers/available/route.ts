import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const siteId = searchParams.get('siteId')
    
    // If siteId is provided, get workers assigned to that site
    if (siteId) {
      const { data: siteWorkers, error: siteError } = await supabase
        .from('site_workers')
        .select(`
          profiles:user_id (
            id,
            full_name,
            role
          )
        `)
        .eq('site_id', siteId)
        .eq('is_active', true)

      if (!siteError && siteWorkers && siteWorkers.length > 0) {
        const profiles = siteWorkers
          ?.map((sw: unknown) => sw.profiles)
          .filter((p: unknown) => p)
        return NextResponse.json({ data: profiles })
      }
    }
    
    // Fallback: Get all workers from profiles
    const { data: allWorkers, error: workersError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .in('role', ['worker', 'site_manager'])
      .order('full_name')
    
    if (workersError) {
      console.error('Error fetching workers:', workersError)
      return NextResponse.json({ error: workersError.message }, { status: 500 })
    }

    return NextResponse.json({ data: allWorkers || [] })
  } catch (error) {
    console.error('Available workers fetch error:', error)
    return NextResponse.json({ 
      error: '작업자 목록을 불러오는데 실패했습니다' 
    }, { status: 500 })
  }
}