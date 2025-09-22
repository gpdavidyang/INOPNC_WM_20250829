
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function testCreateMaterialTransaction() {
  console.log('🧪 자재 거래 생성 테스트...\n')
  
  try {
    // 1. 테스트용 사이트 찾기
    const { data: site } = await supabase
      .from('sites')
      .select('id, name')
      .eq('status', 'active')
      .limit(1)
      .single()
    
    if (!site) {
      console.error('❌ 활성 사이트를 찾을 수 없습니다.')
      return
    }
    
    console.log('✅ 테스트 사이트:', site.name)
    
    // 2. NPC-1000 자재 찾기
    const { data: material } = await supabase
      .from('materials')
      .select('id, code, name')
      .eq('code', 'NPC-1000')
      .single()
    
    if (!material) {
      console.error('❌ NPC-1000 자재를 찾을 수 없습니다.')
      return
    }
    
    console.log('✅ NPC-1000 자재:', material.name)
    
    // 3. 테스트 사용자 찾기 (현장관리자)
    const { data: user } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('role', 'site_manager')
      .limit(1)
      .single()
    
    if (!user) {
      console.error('❌ 현장관리자를 찾을 수 없습니다.')
      return
    }
    
    console.log('✅ 테스트 사용자:', user.full_name, `(${user.role})`)
    
    // 4. 입고 거래 생성 테스트
    console.log('\n📥 입고 거래 생성 테스트...')
    
    const inTransaction = {
      transaction_type: 'in',
      site_id: site.id,
      material_id: material.id,
      quantity: 100,
      transaction_date: new Date().toISOString().split('T')[0],
      notes: '테스트 입고 - 자동 생성',
      created_by: user.id
    }
    
    const { data: inData, error: inError } = await supabase
      .from('material_transactions')
      .insert(inTransaction)
      .select()
      .single()
    
    if (inError) {
      console.error('❌ 입고 거래 생성 실패:', inError)
    } else {
      console.log('✅ 입고 거래 생성 성공:', inData.id)
      console.log('   - 수량:', inData.quantity, '말')
      console.log('   - 날짜:', inData.transaction_date)
    }
    
    // 5. 사용 거래 생성 테스트
    console.log('\n📤 사용 거래 생성 테스트...')
    
    const outTransaction = {
      transaction_type: 'out',
      site_id: site.id,
      material_id: material.id,
      quantity: 50,
      transaction_date: new Date().toISOString().split('T')[0],
      notes: '테스트 사용 - 자동 생성',
      created_by: user.id
    }
    
    const { data: outData, error: outError } = await supabase
      .from('material_transactions')
      .insert(outTransaction)
      .select()
      .single()
    
    if (outError) {
      console.error('❌ 사용 거래 생성 실패:', outError)
    } else {
      console.log('✅ 사용 거래 생성 성공:', outData.id)
      console.log('   - 수량:', outData.quantity, '말')
      console.log('   - 날짜:', outData.transaction_date)
    }
    
    // 6. 재고 확인
    console.log('\n📊 재고 현황 확인...')
    
    const { data: inventory } = await supabase
      .from('material_inventory')
      .select('*')
      .eq('site_id', site.id)
      .eq('material_id', material.id)
      .single()
    
    if (inventory) {
      console.log('✅ 현재 재고:', inventory.current_stock, '말')
      console.log('   - 예약 재고:', inventory.reserved_stock, '말')
      console.log('   - 가용 재고:', inventory.available_stock || (inventory.current_stock - inventory.reserved_stock), '말')
      console.log('   - 최종 업데이트:', inventory.last_updated)
    } else {
      console.log('⚠️  재고 레코드가 없습니다.')
    }
    
    // 7. 생성된 거래 목록 확인
    console.log('\n📋 최근 거래 목록...')
    
    const { data: recentTransactions } = await supabase
      .from('material_transactions')
      .select(`
        id,
        transaction_type,
        quantity,
        transaction_date,
        notes,
        materials!material_transactions_material_id_fkey(code, name),
        sites!material_transactions_site_id_fkey(name)
      `)
      .eq('site_id', site.id)
      .eq('material_id', material.id)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (recentTransactions && recentTransactions.length > 0) {
      console.log('✅ 거래 내역:', recentTransactions.length, '건')
      recentTransactions.forEach((trans, index) => {
        console.log(`   ${index + 1}. [${trans.transaction_type === 'in' ? '입고' : '사용'}]`,
          trans.quantity, '말',
          `(${trans.transaction_date})`,
          trans.notes || ''
        )
      })
    }
    
    console.log('\n✅ 테스트 완료!')
    console.log('   이제 시스템관리자 화면에서 자재 데이터를 확인해보세요.')
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error)
  }
}

testCreateMaterialTransaction().catch(console.error)