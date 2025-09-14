import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'


// TODO: Seed route disabled due to database schema mismatches

export async function GET() {
  return NextResponse.json({ message: 'Seed route disabled' }, { status: 200 })
}

/*

export async function GET_DISABLED() {
  try {
    const supabase = await createClient()
    // Create demo organizations
    const { error: orgError } = await supabase
      .from('organizations')
      .upsert([
        {
          id: 'org-1',
          name: '이노피앤씨',
          business_number: '123-45-67890',
          address: '서울특별시 강남구 테헤란로 123',
          phone: '02-1234-5678',
          status: 'active'
        },
        {
          id: 'org-2',
          name: '건설파트너사',
          business_number: '234-56-78901',
          address: '서울특별시 서초구 서초대로 456',
          phone: '02-2345-6789',
          status: 'active'
        }
      ])
    
    if (orgError) throw orgError

    // Create demo sites
    const { error: siteError } = await supabase
      .from('sites')
      .upsert([
        {
          id: 'site-1',
          organization_id: 'org-1',
          name: '강남 오피스빌딩 신축공사',
          address: '서울특별시 강남구 테헤란로 123',
          start_date: '2025-01-01',
          end_date: '2026-12-31',
          status: 'active'
        },
        {
          id: 'site-2',
          organization_id: 'org-1',
          name: '판교 물류센터 건설',
          address: '경기도 성남시 분당구 판교로 456',
          start_date: '2025-02-01',
          end_date: '2025-12-31',
          status: 'active'
        }
      ])
    
    if (siteError) throw siteError

    return NextResponse.json({ 
      message: '데모 조직 및 사이트가 생성되었습니다. Supabase 대시보드에서 사용자를 생성하세요.',
      organizations: ['이노피앤씨', '건설파트너사'],
      sites: ['강남 오피스빌딩 신축공사', '판교 물류센터 건설'],
      demo_users: [
        { email: 'worker@inopnc.com', password: 'password123', role: '작업자' },
        { email: 'manager@inopnc.com', password: 'password123', role: '현장관리자' },
        { email: 'customer@partner.com', password: 'password123', role: '파트너사' },
        { email: 'admin@inopnc.com', password: 'password123', role: '관리자' },
        { email: 'system@inopnc.com', password: 'password123', role: '시스템관리자' }
      ]
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: '데모 데이터 생성 실패' }, { status: 500 })
  }
}
*/
