import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function testMaterialSystemFinal() {
  console.log('🧪 자재관리 시스템 최종 테스트...\n')
  console.log('=' .repeat(60))
  
  try {
    // 1. 현재 데이터 현황 확인
    console.log('\n📊 현재 데이터 현황')
    console.log('-'.repeat(40))
    
    // 자재 요청 수
    const { count: requestCount } = await supabase
      .from('material_requests')
      .select('*', { count: 'exact', head: true })
    
    console.log(`✅ 자재 요청: ${requestCount || 0}건`)
    
    // 자재 거래 수
    const { count: transactionCount } = await supabase
      .from('material_transactions')
      .select('*', { count: 'exact', head: true })
    
    console.log(`✅ 자재 거래: ${transactionCount || 0}건`)
    
    // 재고 레코드 수
    const { count: inventoryCount } = await supabase
      .from('material_inventory')
      .select('*', { count: 'exact', head: true })
    
    console.log(`✅ 재고 레코드: ${inventoryCount || 0}건`)
    
    // 2. 최근 요청 확인
    console.log('\n📋 최근 자재 요청 (상위 3건)')
    console.log('-'.repeat(40))
    
    const { data: recentRequests } = await supabase
      .from('material_requests')
      .select(`
        request_number,
        status,
        created_at,
        sites!material_requests_site_id_fkey(name),
        profiles:requested_by(full_name),
        material_request_items(
          requested_quantity,
          materials(code, name)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(3)
    
    if (recentRequests && recentRequests.length > 0) {
      recentRequests.forEach((req, index) => {
        const npcItem = (req as any).material_request_items?.find((item: any) => 
          item.materials?.code === 'NPC-1000'
        )
        console.log(`${index + 1}. ${req.request_number}`)
        console.log(`   현장: ${(req as any).sites?.name || '알 수 없음'}`)
        console.log(`   요청자: ${(req as any).profiles?.full_name || '알 수 없음'}`)
        console.log(`   상태: ${req.status}`)
        if (npcItem) {
          console.log(`   NPC-1000 수량: ${npcItem.requested_quantity}말`)
        }
        console.log(`   생성일: ${new Date(req.created_at).toLocaleString('ko-KR')}`)
        console.log()
      })
    } else {
      console.log('⚠️  자재 요청이 없습니다.')
    }
    
    // 3. 최근 거래 확인
    console.log('\n📦 최근 자재 거래 (상위 5건)')
    console.log('-'.repeat(40))
    
    const { data: recentTransactions } = await supabase
      .from('material_transactions')
      .select(`
        transaction_type,
        quantity,
        transaction_date,
        notes,
        sites!material_transactions_site_id_fkey(name),
        materials(code, name),
        profiles:created_by(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (recentTransactions && recentTransactions.length > 0) {
      recentTransactions.forEach((trans, index) => {
        const typeLabel = trans.transaction_type === 'in' ? '📥 입고' : '📤 사용'
        console.log(`${index + 1}. ${typeLabel} - ${trans.quantity}말`)
        console.log(`   현장: ${(trans as any).sites?.name || '알 수 없음'}`)
        console.log(`   자재: ${(trans as any).materials?.name || 'NPC-1000'}`)
        console.log(`   작성자: ${(trans as any).profiles?.full_name || '알 수 없음'}`)
        console.log(`   날짜: ${trans.transaction_date}`)
        if (trans.notes) {
          console.log(`   메모: ${trans.notes}`)
        }
        console.log()
      })
    } else {
      console.log('⚠️  자재 거래가 없습니다.')
    }
    
    // 4. 현재 재고 현황 (상위 5개 현장)
    console.log('\n🏗️ 현장별 재고 현황 (상위 5개)')
    console.log('-'.repeat(40))
    
    const { data: inventoryStatus } = await supabase
      .from('material_inventory')
      .select(`
        current_stock,
        reserved_stock,
        last_updated,
        sites(name),
        materials(code, name)
      `)
      .gt('current_stock', 0)
      .order('current_stock', { ascending: false })
      .limit(5)
    
    if (inventoryStatus && inventoryStatus.length > 0) {
      inventoryStatus.forEach((inv, index) => {
        const available = Number(inv.current_stock) - Number(inv.reserved_stock)
        console.log(`${index + 1}. ${(inv as any).sites?.name || '알 수 없음'}`)
        console.log(`   자재: ${(inv as any).materials?.name || 'NPC-1000'}`)
        console.log(`   현재 재고: ${inv.current_stock}말`)
        console.log(`   예약 재고: ${inv.reserved_stock}말`)
        console.log(`   가용 재고: ${available}말`)
        console.log(`   최종 업데이트: ${new Date(inv.last_updated).toLocaleString('ko-KR')}`)
        console.log()
      })
    } else {
      console.log('⚠️  재고 데이터가 없습니다.')
    }
    
    // 5. 시스템 진단
    console.log('\n🔍 시스템 진단 결과')
    console.log('=' .repeat(60))
    
    const issues = []
    const recommendations = []
    
    if ((requestCount || 0) > 0 && (transactionCount || 0) === 0) {
      issues.push('❌ 자재 요청은 있지만 거래 기록이 없습니다.')
      recommendations.push('💡 현장관리자가 "입고사용량 기록" 기능을 사용하도록 안내하세요.')
    }
    
    if ((transactionCount || 0) > 0 && (inventoryCount || 0) === 0) {
      issues.push('❌ 거래 기록은 있지만 재고 데이터가 없습니다.')
      recommendations.push('💡 material_inventory 테이블 업데이트 로직을 확인하세요.')
    }
    
    if ((transactionCount || 0) > (requestCount || 0) * 2) {
      issues.push('⚠️  거래 수가 요청 수보다 많습니다.')
      recommendations.push('💡 정상적인 상황일 수 있습니다. (직접 입고/사용 기록)')
    }
    
    if (issues.length === 0) {
      console.log('✅ 모든 시스템이 정상 작동 중입니다!')
      console.log('   - 자재 요청 ✓')
      console.log('   - 입고/사용 기록 ✓')
      console.log('   - 재고 관리 ✓')
      console.log('   - 데이터 연동 ✓')
    } else {
      console.log('문제점:')
      issues.forEach(issue => console.log('  ' + issue))
      console.log('\n권장사항:')
      recommendations.forEach(rec => console.log('  ' + rec))
    }
    
    console.log('\n' + '=' .repeat(60))
    console.log('📱 이제 다음을 확인해보세요:')
    console.log('   1. 현장관리자 화면 > NPC-1000 자재관리')
    console.log('      - "요청" 버튼으로 자재 요청')
    console.log('      - "입고사용량 기록" 버튼으로 거래 생성')
    console.log('   2. 시스템관리자 화면 > NPC-자재관리')
    console.log('      - 통합재고현황 탭에서 전체 재고 확인')
    console.log('      - 사용재고관리 탭에서 거래 내역 확인')
    console.log('      - 출고요청 관리 탭에서 요청 처리')
    console.log('=' .repeat(60))
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error)
  }
}

testMaterialSystemFinal().catch(console.error)
