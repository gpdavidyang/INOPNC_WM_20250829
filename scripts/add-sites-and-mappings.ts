import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://yjtnpscnnsnvfsyvajku.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzNzU2NCwiZXhwIjoyMDY5NDEzNTY0fQ.nZ3kiVrU4qAnWQG5vso-qL_FKOkYKlbbZF1a04ew0GE',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function addSitesAndMappings() {
  console.log('🚀 새로운 현장 생성 및 파트너사 매핑 시작...\n')

  try {
    // 1. 기본 organization_id 가져오기
    const defaultOrgId = '11111111-1111-1111-1111-111111111111'

    // 2. 새로운 현장 데이터 생성 (필수 필드 포함)
    const newSites = [
      {
        name: 'SK하이닉스 이천캠퍼스 M16',
        organization_id: defaultOrgId,
        address: '경기도 이천시 부발읍 경충대로 2091',
        construction_manager_name: '김현장',
        construction_manager_phone: '010-1234-5001',
        safety_manager_name: '박안전',
        safety_manager_phone: '010-1234-6001',
        start_date: new Date().toISOString().split('T')[0],
      },
      {
        name: '롯데타워 리모델링',
        organization_id: defaultOrgId,
        address: '서울특별시 송파구 올림픽로 300',
        construction_manager_name: '이관리',
        construction_manager_phone: '010-1234-5002',
        safety_manager_name: '김안전',
        safety_manager_phone: '010-1234-6002',
        start_date: new Date().toISOString().split('T')[0],
      },
      {
        name: '인천공항 T3 확장',
        organization_id: defaultOrgId,
        address: '인천광역시 중구 공항로 272',
        construction_manager_name: '박소장',
        construction_manager_phone: '010-1234-5003',
        safety_manager_name: '이안전',
        safety_manager_phone: '010-1234-6003',
        start_date: new Date().toISOString().split('T')[0],
      },
      {
        name: '판교 테크노밸리 신축',
        organization_id: defaultOrgId,
        address: '경기도 성남시 분당구 판교로 255',
        construction_manager_name: '최과장',
        construction_manager_phone: '010-1234-5004',
        safety_manager_name: '정안전',
        safety_manager_phone: '010-1234-6004',
        start_date: new Date().toISOString().split('T')[0],
      },
      {
        name: '부산 해운대 복합단지',
        organization_id: defaultOrgId,
        address: '부산광역시 해운대구 센텀중앙로 97',
        construction_manager_name: '정팀장',
        construction_manager_phone: '010-1234-5005',
        safety_manager_name: '최안전',
        safety_manager_phone: '010-1234-6005',
        start_date: new Date().toISOString().split('T')[0],
      },
      {
        name: '대전 연구단지 건설',
        organization_id: defaultOrgId,
        address: '대전광역시 유성구 과학로 125',
        construction_manager_name: '강부장',
        construction_manager_phone: '010-1234-5006',
        safety_manager_name: '조안전',
        safety_manager_phone: '010-1234-6006',
        start_date: new Date().toISOString().split('T')[0],
      },
    ]

    console.log('📍 새로운 현장 생성...')
    const { data: createdSites, error: siteError } = await supabase
      .from('sites')
      .insert(newSites)
      .select()

    if (siteError) {
      console.error('현장 생성 실패:', siteError)
      return
    }

    console.log(`✅ ${createdSites?.length}개 현장 생성 완료`)
    createdSites?.forEach(site => {
      console.log(`   - ${site.name} (ID: ${site.id})`)
    })

    // 3. 현장이 없는 파트너사 ID 목록
    const partnersWithoutSites = {
      그린환경엔지니어링: 'b56763bf-636d-484e-85cc-01962fd312b5',
      미래건설기계: '124c81cb-7ea3-4539-92f5-b8f4557e9da1',
      안전건설산업: '90b7db1e-cc53-4ffc-868d-67eddbbf57dc',
      태양에너지기술: 'a22d4a26-d158-4f6e-91d4-677ba0b05b79',
      한국배관시스템: '479a93bf-1c6e-44d2-b156-c46a1907b4a9',
      현대건축설계사무소: '1919d054-3dd8-4c72-849c-c677256446ce',
    }

    // 기존 파트너사 ID
    const existingPartners = {
      '인옵앤씨 파트너': '11111111-1111-1111-1111-111111111111',
      서울전기공사: '35fe04c4-49e9-4ebb-854a-530d805b5165',
      '대한건설(주)': '236c7746-56ac-4fbc-8387-40ffebed329d',
    }

    // 4. 파트너사-현장 매핑 생성
    const mappings = []

    if (createdSites && createdSites.length === 6) {
      // 그린환경엔지니어링 - SK하이닉스, 롯데타워
      mappings.push(
        {
          partner_company_id: partnersWithoutSites['그린환경엔지니어링'],
          site_id: createdSites[0].id,
          is_active: true,
        },
        {
          partner_company_id: partnersWithoutSites['그린환경엔지니어링'],
          site_id: createdSites[1].id,
          is_active: true,
        }
      )

      // 미래건설기계 - 인천공항, 판교
      mappings.push(
        {
          partner_company_id: partnersWithoutSites['미래건설기계'],
          site_id: createdSites[2].id,
          is_active: true,
        },
        {
          partner_company_id: partnersWithoutSites['미래건설기계'],
          site_id: createdSites[3].id,
          is_active: true,
        }
      )

      // 안전건설산업 - 부산, 대전
      mappings.push(
        {
          partner_company_id: partnersWithoutSites['안전건설산업'],
          site_id: createdSites[4].id,
          is_active: true,
        },
        {
          partner_company_id: partnersWithoutSites['안전건설산업'],
          site_id: createdSites[5].id,
          is_active: true,
        }
      )

      // 태양에너지기술 - SK하이닉스, 판교
      mappings.push(
        {
          partner_company_id: partnersWithoutSites['태양에너지기술'],
          site_id: createdSites[0].id,
          is_active: true,
        },
        {
          partner_company_id: partnersWithoutSites['태양에너지기술'],
          site_id: createdSites[3].id,
          is_active: true,
        }
      )

      // 한국배관시스템 - 롯데타워, 인천공항, 부산
      mappings.push(
        {
          partner_company_id: partnersWithoutSites['한국배관시스템'],
          site_id: createdSites[1].id,
          is_active: true,
        },
        {
          partner_company_id: partnersWithoutSites['한국배관시스템'],
          site_id: createdSites[2].id,
          is_active: true,
        },
        {
          partner_company_id: partnersWithoutSites['한국배관시스템'],
          site_id: createdSites[4].id,
          is_active: true,
        }
      )

      // 현대건축설계사무소 - 대전, 판교
      mappings.push(
        {
          partner_company_id: partnersWithoutSites['현대건축설계사무소'],
          site_id: createdSites[5].id,
          is_active: true,
        },
        {
          partner_company_id: partnersWithoutSites['현대건축설계사무소'],
          site_id: createdSites[3].id,
          is_active: true,
        }
      )

      // 기존 파트너사도 일부 신규 현장에 추가 배정
      // 인옵앤씨 파트너 - SK하이닉스, 인천공항
      mappings.push(
        {
          partner_company_id: existingPartners['인옵앤씨 파트너'],
          site_id: createdSites[0].id,
          is_active: true,
        },
        {
          partner_company_id: existingPartners['인옵앤씨 파트너'],
          site_id: createdSites[2].id,
          is_active: true,
        }
      )

      // 서울전기공사 - 롯데타워, 판교
      mappings.push(
        {
          partner_company_id: existingPartners['서울전기공사'],
          site_id: createdSites[1].id,
          is_active: true,
        },
        {
          partner_company_id: existingPartners['서울전기공사'],
          site_id: createdSites[3].id,
          is_active: true,
        }
      )

      // 대한건설(주) - 부산, 대전
      mappings.push(
        {
          partner_company_id: existingPartners['대한건설(주)'],
          site_id: createdSites[4].id,
          is_active: true,
        },
        {
          partner_company_id: existingPartners['대한건설(주)'],
          site_id: createdSites[5].id,
          is_active: true,
        }
      )
    }

    console.log('\n🔗 파트너사-현장 매핑 생성...')
    const { data: createdMappings, error: mappingError } = await supabase
      .from('partner_site_mappings')
      .insert(mappings)
      .select()

    if (mappingError) {
      console.error('매핑 생성 실패:', mappingError)
      return
    }

    console.log(`✅ ${createdMappings?.length}개 매핑 생성 완료`)

    // 5. 결과 검증
    console.log('\n📊 최종 결과 검증...')
    const { data: finalCheck } = await supabase
      .from('partner_companies')
      .select(
        `
        id,
        company_name,
        partner_site_mappings!inner(
          site_id,
          sites!inner(name)
        )
      `
      )
      .eq('status', 'active')
      .eq('partner_site_mappings.is_active', true)

    // 파트너사별 현장 수 집계
    const partnerSiteCount = new Map()
    finalCheck?.forEach(partner => {
      const siteCount = partner.partner_site_mappings?.length || 0
      partnerSiteCount.set(partner.company_name, siteCount)
    })

    console.log('\n✨ 모든 파트너사 현장 배정 현황:')
    console.log('='.repeat(50))

    // 전체 파트너사 목록과 비교
    const allPartners = [...Object.keys(partnersWithoutSites), ...Object.keys(existingPartners)]

    allPartners.forEach(partnerName => {
      const count = partnerSiteCount.get(partnerName) || 0
      console.log(`${partnerName}: ${count}개 현장`)
    })

    console.log('='.repeat(50))
    console.log('🎉 모든 파트너사에 최소 1개 이상의 현장이 배정되었습니다!')
  } catch (error) {
    console.error('❌ 실행 중 오류 발생:', error)
  }
}

addSitesAndMappings().catch(console.error)
