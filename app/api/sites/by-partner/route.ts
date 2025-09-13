import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // URL 파라미터에서 partner_company_id 가져오기
    const { searchParams } = new URL(request.url)
    const partnerCompanyId = searchParams.get('partner_company_id')

    if (!partnerCompanyId) {
      return NextResponse.json({ error: 'Partner company ID is required' }, { status: 400 })
    }

    // 해당 파트너사가 참여하는 현장 조회
    const { data: sites, error } = await supabase
      .from('sites')
      .select(`
        id,
        name,
        address,
        status,
        site_partners!inner(
          partner_company_id,
          status
        )
      `)
      .eq('site_partners.partner_company_id', partnerCompanyId)
      .eq('site_partners.status', 'active')
      .eq('status', 'active')
      .order('name')

    if (error) {
      console.error('Error fetching sites by partner:', error)
      return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 })
    }

    // site_partners 관계를 제거하고 깨끗한 sites 데이터만 반환
    const cleanSites = sites?.map((site: any) => ({
      id: site.id,
      name: site.name,
      address: site.address,
      status: site.status
    })) || []

    return NextResponse.json(cleanSites)
  } catch (error) {
    console.error('Error in sites by partner API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}