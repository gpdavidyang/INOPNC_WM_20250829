const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface TestUser {
  email: string
  password: string
  role: string
  name: string
}

interface TestResult {
  user: string
  role: string
  operation: string
  target: string
  result: 'PASS' | 'FAIL'
  details?: string
}

// 테스트 사용자 목록
const testUsers: TestUser[] = [
  { email: 'admin@test.com', password: 'password123', role: 'admin', name: '관리자' },
  {
    email: 'manager@inopnc.com',
    password: 'password123',
    role: 'site_manager',
    name: '현장관리자',
  },
  { email: 'worker@test.com', password: 'password123', role: 'worker', name: '작업자' },
  {
    email: 'partner@test.com',
    password: 'password123',
    role: 'customer_manager',
    name: '시공업체 담당',
  },
]

async function testDocumentsRLS() {
  console.log('🧪 문서함 RLS 종합 테스트 시작...\n')
  console.log('='.repeat(80))

  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const results: TestResult[] = []

  // 1. 테스트 데이터 준비 (Service Role로)
  console.log('\n📋 테스트 데이터 준비...')

  // 각 사용자별로 문서 생성
  const testDocuments: any[] = []

  for (const user of testUsers) {
    // 사용자 ID 조회
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, site_id')
      .eq('email', user.email)
      .single()

    if (!profile) {
      console.log(`⚠️  ${user.email} 프로필 없음 - 스킵`)
      continue
    }

    // 개인 문서 생성
    const privateDoc = {
      title: `${user.name}의 개인문서`,
      file_name: `private_${Date.now()}_${user.role}.pdf`,
      file_url: `https://example.com/private_${user.role}.pdf`,
      file_size: 1024,
      mime_type: 'application/pdf',
      document_type: 'personal',
      folder_path: `documents/${profile.id}/test.pdf`,
      owner_id: profile.id,
      site_id: profile.site_id,
      is_public: false,
      description: `${user.role} 역할의 개인 문서`,
    }

    const { data: privateDocData, error: privateError } = await adminClient
      .from('documents')
      .insert(privateDoc)
      .select()
      .single()

    if (privateError) {
      console.error(`❌ ${user.name} 개인문서 생성 실패:`, privateError.message)
    } else {
      testDocuments.push({ ...privateDocData, owner_role: user.role, owner_name: user.name })
      console.log(`✅ ${user.name} 개인문서 생성`)
    }

    // 공개 문서 생성
    const publicDoc = {
      title: `${user.name}의 공개문서`,
      file_name: `public_${Date.now()}_${user.role}.pdf`,
      file_url: `https://example.com/public_${user.role}.pdf`,
      file_size: 2048,
      mime_type: 'application/pdf',
      document_type: 'shared',
      folder_path: `documents/${profile.id}/shared.pdf`,
      owner_id: profile.id,
      site_id: profile.site_id,
      is_public: true,
      description: `${user.role} 역할의 공개 문서`,
    }

    const { data: publicDocData, error: publicError } = await adminClient
      .from('documents')
      .insert(publicDoc)
      .select()
      .single()

    if (publicError) {
      console.error(`❌ ${user.name} 공개문서 생성 실패:`, publicError.message)
    } else {
      testDocuments.push({ ...publicDocData, owner_role: user.role, owner_name: user.name })
      console.log(`✅ ${user.name} 공개문서 생성`)
    }
  }

  console.log(`\n📊 생성된 테스트 문서: ${testDocuments.length}개`)

  // 2. 각 사용자로 테스트
  for (const user of testUsers) {
    console.log('\n' + '='.repeat(80))
    console.log(`\n👤 ${user.name} (${user.role}) 테스트`)
    console.log('-'.repeat(40))

    const userClient = createClient(supabaseUrl, supabaseAnonKey)

    // 로그인
    const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    })

    if (signInError) {
      console.error(`❌ ${user.email} 로그인 실패:`, signInError.message)
      continue
    }

    const userId = signInData.user?.id
    console.log(`✅ 로그인 성공 (ID: ${userId?.substring(0, 8)}...)`)

    // 2-1. SELECT 테스트 - 전체 문서 조회
    console.log('\n📖 SELECT 테스트:')
    const { data: allDocs, error: selectError } = await userClient
      .from('documents')
      .select('id, title, owner_id, is_public, document_type')
      .order('created_at', { ascending: false })

    if (selectError) {
      console.error('  ❌ SELECT 실패:', selectError.message)
      results.push({
        user: user.name,
        role: user.role,
        operation: 'SELECT',
        target: '전체 문서',
        result: 'FAIL',
        details: selectError.message,
      })
    } else {
      const myDocs = allDocs?.filter(doc => doc.owner_id === userId) || []
      const otherPrivateDocs =
        allDocs?.filter(doc => doc.owner_id !== userId && !doc.is_public) || []
      const otherPublicDocs = allDocs?.filter(doc => doc.owner_id !== userId && doc.is_public) || []

      console.log(`  ✅ 조회 가능 문서: ${allDocs?.length || 0}개`)
      console.log(`     - 내 문서: ${myDocs.length}개`)
      console.log(`     - 타인 비공개 문서: ${otherPrivateDocs.length}개`)
      console.log(`     - 타인 공개 문서: ${otherPublicDocs.length}개`)

      // RLS 정책 검증
      if (otherPrivateDocs.length > 0) {
        console.log('  ⚠️  경고: 타인의 비공개 문서가 조회됨!')
        results.push({
          user: user.name,
          role: user.role,
          operation: 'SELECT',
          target: '타인 비공개 문서',
          result: 'FAIL',
          details: `${otherPrivateDocs.length}개 노출`,
        })
      } else {
        results.push({
          user: user.name,
          role: user.role,
          operation: 'SELECT',
          target: '문서 조회',
          result: 'PASS',
          details: `내 문서 ${myDocs.length}개, 공개 문서 ${otherPublicDocs.length}개`,
        })
      }
    }

    // 2-2. INSERT 테스트
    console.log('\n✏️ INSERT 테스트:')
    const newDoc = {
      title: `${user.name} 테스트 문서 ${Date.now()}`,
      file_name: `test_${Date.now()}.pdf`,
      file_url: 'https://example.com/test.pdf',
      file_size: 512,
      mime_type: 'application/pdf',
      document_type: 'personal',
      folder_path: `documents/${userId}/test.pdf`,
      owner_id: userId,
      is_public: false,
      description: 'RLS 테스트용 문서',
    }

    const { data: insertData, error: insertError } = await userClient
      .from('documents')
      .insert(newDoc)
      .select()
      .single()

    if (insertError) {
      console.log('  ❌ INSERT 실패:', insertError.message)
      results.push({
        user: user.name,
        role: user.role,
        operation: 'INSERT',
        target: '새 문서',
        result: 'FAIL',
        details: insertError.message,
      })
    } else {
      console.log('  ✅ INSERT 성공:', insertData.id)
      results.push({
        user: user.name,
        role: user.role,
        operation: 'INSERT',
        target: '새 문서',
        result: 'PASS',
      })

      // 2-3. UPDATE 테스트 - 자신의 문서
      console.log('\n🔄 UPDATE 테스트 (자신의 문서):')
      const { error: updateOwnError } = await userClient
        .from('documents')
        .update({ description: '수정된 설명' })
        .eq('id', insertData.id)

      if (updateOwnError) {
        console.log('  ❌ 자신의 문서 UPDATE 실패:', updateOwnError.message)
        results.push({
          user: user.name,
          role: user.role,
          operation: 'UPDATE',
          target: '자신의 문서',
          result: 'FAIL',
          details: updateOwnError.message,
        })
      } else {
        console.log('  ✅ 자신의 문서 UPDATE 성공')
        results.push({
          user: user.name,
          role: user.role,
          operation: 'UPDATE',
          target: '자신의 문서',
          result: 'PASS',
        })
      }

      // 2-4. UPDATE 테스트 - 타인의 문서
      const otherDoc = testDocuments.find(doc => doc.owner_id !== userId)
      if (otherDoc) {
        console.log('\n🔄 UPDATE 테스트 (타인의 문서):')
        const { error: updateOtherError } = await userClient
          .from('documents')
          .update({ description: '무단 수정 시도' })
          .eq('id', otherDoc.id)

        if (updateOtherError) {
          console.log('  ✅ 타인의 문서 UPDATE 차단됨 (정상)')
          results.push({
            user: user.name,
            role: user.role,
            operation: 'UPDATE',
            target: '타인의 문서',
            result: 'PASS',
            details: '정상적으로 차단됨',
          })
        } else {
          console.log('  ❌ 타인의 문서 UPDATE 성공 (보안 문제!)')
          results.push({
            user: user.name,
            role: user.role,
            operation: 'UPDATE',
            target: '타인의 문서',
            result: 'FAIL',
            details: '타인 문서 수정 가능',
          })
        }
      }

      // 2-5. DELETE 테스트 - 자신의 문서
      console.log('\n🗑️ DELETE 테스트 (자신의 문서):')
      const { error: deleteOwnError } = await userClient
        .from('documents')
        .delete()
        .eq('id', insertData.id)

      if (deleteOwnError) {
        console.log('  ❌ 자신의 문서 DELETE 실패:', deleteOwnError.message)
        results.push({
          user: user.name,
          role: user.role,
          operation: 'DELETE',
          target: '자신의 문서',
          result: 'FAIL',
          details: deleteOwnError.message,
        })
      } else {
        console.log('  ✅ 자신의 문서 DELETE 성공')
        results.push({
          user: user.name,
          role: user.role,
          operation: 'DELETE',
          target: '자신의 문서',
          result: 'PASS',
        })
      }

      // 2-6. DELETE 테스트 - 타인의 문서
      if (otherDoc) {
        console.log('\n🗑️ DELETE 테스트 (타인의 문서):')
        const { error: deleteOtherError } = await userClient
          .from('documents')
          .delete()
          .eq('id', otherDoc.id)

        if (deleteOtherError) {
          console.log('  ✅ 타인의 문서 DELETE 차단됨 (정상)')
          results.push({
            user: user.name,
            role: user.role,
            operation: 'DELETE',
            target: '타인의 문서',
            result: 'PASS',
            details: '정상적으로 차단됨',
          })
        } else {
          console.log('  ❌ 타인의 문서 DELETE 성공 (보안 문제!)')
          results.push({
            user: user.name,
            role: user.role,
            operation: 'DELETE',
            target: '타인의 문서',
            result: 'FAIL',
            details: '타인 문서 삭제 가능',
          })
        }
      }
    }

    // 로그아웃
    await userClient.auth.signOut()
  }

  // 3. 테스트 데이터 정리
  console.log('\n\n🧹 테스트 데이터 정리...')
  for (const doc of testDocuments) {
    await adminClient.from('documents').delete().eq('id', doc.id)
  }
  console.log('✅ 정리 완료')

  // 4. 결과 요약
  console.log('\n' + '='.repeat(80))
  console.log('\n📊 테스트 결과 요약\n')

  // 역할별 결과 집계
  const roleResults = new Map<string, { pass: number; fail: number }>()

  for (const result of results) {
    if (!roleResults.has(result.role)) {
      roleResults.set(result.role, { pass: 0, fail: 0 })
    }
    const stats = roleResults.get(result.role)!
    if (result.result === 'PASS') {
      stats.pass++
    } else {
      stats.fail++
    }
  }

  console.log('역할별 통계:')
  console.log('-'.repeat(40))
  for (const [role, stats] of roleResults) {
    const total = stats.pass + stats.fail
    const passRate = total > 0 ? ((stats.pass / total) * 100).toFixed(1) : '0'
    console.log(`${role.padEnd(20)} : ✅ ${stats.pass} / ❌ ${stats.fail} (성공률: ${passRate}%)`)
  }

  // 작업별 결과 집계
  const operationResults = new Map<string, { pass: number; fail: number }>()

  for (const result of results) {
    if (!operationResults.has(result.operation)) {
      operationResults.set(result.operation, { pass: 0, fail: 0 })
    }
    const stats = operationResults.get(result.operation)!
    if (result.result === 'PASS') {
      stats.pass++
    } else {
      stats.fail++
    }
  }

  console.log('\n작업별 통계:')
  console.log('-'.repeat(40))
  for (const [operation, stats] of operationResults) {
    const total = stats.pass + stats.fail
    const passRate = total > 0 ? ((stats.pass / total) * 100).toFixed(1) : '0'
    console.log(
      `${operation.padEnd(20)} : ✅ ${stats.pass} / ❌ ${stats.fail} (성공률: ${passRate}%)`
    )
  }

  // 실패 항목 상세
  const failures = results.filter(r => r.result === 'FAIL')
  if (failures.length > 0) {
    console.log('\n⚠️  실패 항목 상세:')
    console.log('-'.repeat(40))
    for (const failure of failures) {
      console.log(`• ${failure.user} (${failure.role}) - ${failure.operation} ${failure.target}`)
      if (failure.details) {
        console.log(`  → ${failure.details}`)
      }
    }
  }

  // 최종 평가
  console.log('\n' + '='.repeat(80))
  const totalPass = results.filter(r => r.result === 'PASS').length
  const totalFail = results.filter(r => r.result === 'FAIL').length
  const totalTests = results.length
  const overallPassRate = totalTests > 0 ? ((totalPass / totalTests) * 100).toFixed(1) : '0'

  console.log('\n🎯 최종 평가:')
  console.log(`총 테스트: ${totalTests}개`)
  console.log(`성공: ${totalPass}개`)
  console.log(`실패: ${totalFail}개`)
  console.log(`전체 성공률: ${overallPassRate}%`)

  if (parseFloat(overallPassRate) >= 90) {
    console.log('\n✅ RLS 정책이 전반적으로 잘 작동하고 있습니다.')
  } else if (parseFloat(overallPassRate) >= 70) {
    console.log('\n⚠️  RLS 정책에 일부 개선이 필요합니다.')
  } else {
    console.log('\n❌ RLS 정책에 심각한 문제가 있습니다.')
  }

  return results
}

// 실행
testDocumentsRLS()
  .then(results => {
    console.log('\n✅ 문서함 RLS 테스트 완료')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ 테스트 실패:', error)
    process.exit(1)
  })
