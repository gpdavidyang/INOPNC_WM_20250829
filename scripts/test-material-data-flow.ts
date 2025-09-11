import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function testMaterialDataFlow() {
  console.log('🧪 자재관리 데이터 연동 테스트 시작...\n')
  
  try {
    // 1. NPC-1000 자재 확인
    console.log('1️⃣ NPC-1000 자재 확인')
    const { data: npcMaterial, error: materialError } = await supabase
      .from('materials')
      .select('*')
      .or('code.ilike.%NPC-1000%,code.eq.NPC-1000')
    
    if (materialError) {
      console.error('❌ 자재 조회 오류:', materialError)
    } else {
      console.log('✅ NPC-1000 자재:', npcMaterial?.length || 0, '개')
      if (npcMaterial && npcMaterial.length > 0) {
        console.log('   자재 정보:', {
          id: npcMaterial[0].id,
          code: npcMaterial[0].code,
          name: npcMaterial[0].name
        })
      }
    }
    
    // 2. 자재 요청 (material_requests) 확인
    console.log('\n2️⃣ 자재 요청 (material_requests) 확인')
    const { data: requests, error: requestError } = await supabase
      .from('material_requests')
      .select(`
        *,
        material_request_items(
          *,
          materials(code, name)
        ),
        sites(name),
        profiles:requested_by(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (requestError) {
      console.error('❌ 자재 요청 조회 오류:', requestError)
    } else {
      console.log('✅ 최근 자재 요청:', requests?.length || 0, '개')
      
      // NPC-1000 요청만 필터링
      const npcRequests = requests?.filter(req => 
        req.material_request_items?.some((item: any) => 
          item.materials?.code?.includes('NPC')
        )
      )
      
      console.log('   NPC-1000 관련 요청:', npcRequests?.length || 0, '개')
      
      if (npcRequests && npcRequests.length > 0) {
        const latestRequest = npcRequests[0]
        console.log('   최신 NPC-1000 요청:')
        console.log('     - ID:', latestRequest.id)
        console.log('     - 요청번호:', latestRequest.request_number)
        console.log('     - 현장:', (latestRequest as any).sites?.name)
        console.log('     - 요청자:', (latestRequest as any).profiles?.full_name)
        console.log('     - 상태:', latestRequest.status)
        console.log('     - 생성일:', latestRequest.created_at)
        
        const npcItem = (latestRequest as any).material_request_items?.find((item: any) => 
          item.materials?.code?.includes('NPC')
        )
        if (npcItem) {
          console.log('     - 요청 수량:', npcItem.requested_quantity, '말')
        }
      }
    }
    
    // 3. 자재 거래 내역 (material_transactions) 확인
    console.log('\n3️⃣ 자재 거래 내역 (material_transactions) 확인')
    const { data: transactions, error: transError } = await supabase
      .from('material_transactions')
      .select(`
        *,
        materials(code, name),
        sites(name),
        profiles:created_by(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (transError) {
      console.error('❌ 자재 거래 조회 오류:', transError)
    } else {
      console.log('✅ 최근 자재 거래:', transactions?.length || 0, '개')
      
      // NPC-1000 거래만 필터링
      const npcTransactions = transactions?.filter(trans => 
        (trans as any).materials?.code?.includes('NPC')
      )
      
      console.log('   NPC-1000 관련 거래:', npcTransactions?.length || 0, '개')
      
      if (npcTransactions && npcTransactions.length > 0) {
        const latestTrans = npcTransactions[0]
        console.log('   최신 NPC-1000 거래:')
        console.log('     - ID:', latestTrans.id)
        console.log('     - 유형:', latestTrans.transaction_type)
        console.log('     - 현장:', (latestTrans as any).sites?.name)
        console.log('     - 수량:', latestTrans.quantity, '말')
        console.log('     - 작성자:', (latestTrans as any).profiles?.full_name)
        console.log('     - 날짜:', latestTrans.transaction_date)
        console.log('     - 생성일:', latestTrans.created_at)
      }
    }
    
    // 4. 재고 현황 (material_inventory) 확인
    console.log('\n4️⃣ 재고 현황 (material_inventory) 확인')
    const { data: inventory, error: invError } = await supabase
      .from('material_inventory')
      .select(`
        *,
        materials(code, name),
        sites(name)
      `)
      .order('last_updated', { ascending: false })
      .limit(10)
    
    if (invError) {
      console.error('❌ 재고 조회 오류:', invError)
    } else {
      console.log('✅ 재고 레코드:', inventory?.length || 0, '개')
      
      // NPC-1000 재고만 필터링
      const npcInventory = inventory?.filter(inv => 
        (inv as any).materials?.code?.includes('NPC')
      )
      
      console.log('   NPC-1000 관련 재고:', npcInventory?.length || 0, '개')
      
      if (npcInventory && npcInventory.length > 0) {
        console.log('   NPC-1000 재고 현황:')
        npcInventory.forEach((inv, index) => {
          console.log(`     ${index + 1}. ${(inv as any).sites?.name || '알 수 없음'}:`)
          console.log(`        - 현재 재고: ${inv.current_stock} 말`)
          console.log(`        - 예약 재고: ${inv.reserved_stock} 말`)
          console.log(`        - 가용 재고: ${inv.available_stock || (inv.current_stock - inv.reserved_stock)} 말`)
          console.log(`        - 최종 업데이트: ${inv.last_updated}`)
        })
      }
    }
    
    // 5. 뷰 (v_inventory_status) 확인
    console.log('\n5️⃣ 재고 상태 뷰 (v_inventory_status) 확인')
    const { data: statusView, error: viewError } = await supabase
      .from('v_inventory_status')
      .select('*')
      .limit(10)
    
    if (viewError) {
      console.error('❌ 재고 상태 뷰 조회 오류:', viewError)
      console.log('   (뷰가 없을 수 있습니다)')
    } else {
      console.log('✅ 재고 상태 뷰 레코드:', statusView?.length || 0, '개')
      if (statusView && statusView.length > 0) {
        console.log('   샘플 데이터:', statusView[0])
      }
    }
    
    // 6. 데이터 연동 문제 진단
    console.log('\n6️⃣ 데이터 연동 문제 진단')
    
    // 최근 24시간 내 데이터 확인
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayISO = yesterday.toISOString()
    
    const { data: recentRequests } = await supabase
      .from('material_requests')
      .select('count')
      .gte('created_at', yesterdayISO)
    
    const { data: recentTransactions } = await supabase
      .from('material_transactions')
      .select('count')
      .gte('created_at', yesterdayISO)
    
    console.log('   최근 24시간 내:')
    console.log('     - 자재 요청:', recentRequests?.[0]?.count || 0, '건')
    console.log('     - 자재 거래:', recentTransactions?.[0]?.count || 0, '건')
    
    // 7. 테스트 데이터 생성 (선택적)
    console.log('\n7️⃣ 테스트 데이터 생성 여부 확인')
    
    // 먼저 테스트 사이트 확인
    const { data: testSite } = await supabase
      .from('sites')
      .select('id, name')
      .eq('status', 'active')
      .limit(1)
      .single()
    
    if (testSite) {
      console.log('   테스트 사이트:', testSite.name)
      
      // 테스트 사용자 확인 (현장관리자)
      const { data: testUser } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'site_manager')
        .limit(1)
        .single()
      
      if (testUser) {
        console.log('   테스트 사용자:', testUser.full_name, `(${testUser.email})`)
        console.log('\n   💡 테스트 데이터 생성 준비 완료')
        console.log('      현장관리자로 로그인하여 NPC-1000 자재 요청 및 입고/사용 기록을 생성해보세요.')
      }
    }
    
    console.log('\n🎯 진단 결과 요약:')
    console.log('━'.repeat(50))
    
    if (npcMaterial && npcMaterial.length > 0) {
      console.log('✅ NPC-1000 자재가 등록되어 있습니다.')
    } else {
      console.log('❌ NPC-1000 자재가 등록되지 않았습니다.')
      console.log('   → materials 테이블에 NPC-1000 자재를 추가해야 합니다.')
    }
    
    if ((requests?.length || 0) > 0) {
      console.log('✅ 자재 요청 데이터가 존재합니다.')
    } else {
      console.log('⚠️  자재 요청 데이터가 없습니다.')
      console.log('   → 현장관리자가 자재 요청을 생성하지 않았을 수 있습니다.')
    }
    
    if ((transactions?.length || 0) > 0) {
      console.log('✅ 자재 거래 데이터가 존재합니다.')
    } else {
      console.log('⚠️  자재 거래 데이터가 없습니다.')
      console.log('   → 입고/사용량 기록이 생성되지 않았을 수 있습니다.')
    }
    
    if ((inventory?.length || 0) > 0) {
      console.log('✅ 재고 데이터가 존재합니다.')
    } else {
      console.log('⚠️  재고 데이터가 없습니다.')
      console.log('   → material_inventory 테이블이 업데이트되지 않았을 수 있습니다.')
    }
    
    console.log('━'.repeat(50))
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error)
  }
}

testMaterialDataFlow().catch(console.error)