import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testLogoutFlow() {
  console.log('🧪 로그아웃 전체 플로우 테스트...\n')

  try {
    // 1. 먼저 로그인 테스트
    console.log('1️⃣ 테스트 사용자로 로그인')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'manager@inopnc.com',
      password: 'password123',
    })

    if (authError) {
      console.error('❌ 로그인 실패:', authError.message)
      return
    }

    console.log('✅ 로그인 성공:', authData.user?.email)
    console.log('   세션 토큰:', authData.session?.access_token?.substring(0, 20) + '...')

    // 2. 세션 확인
    console.log('\n2️⃣ 현재 세션 확인')
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession()

    if (currentSession) {
      console.log('✅ 세션 활성 상태:', currentSession.user.email)
    } else {
      console.log('❌ 세션을 찾을 수 없음')
    }

    // 3. 로그아웃 API 호출
    console.log('\n3️⃣ 로그아웃 API 호출')
    const response = await fetch('http://localhost:3002/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Include auth cookie for the request
        Cookie: `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token=${authData.session?.access_token}`,
      },
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ 로그아웃 API 응답:', result)
    } else {
      console.log('❌ 로그아웃 API 실패:', response.status)
      const error = await response.text()
      console.log('   에러 내용:', error)
    }

    // 4. 클라이언트 측 로그아웃
    console.log('\n4️⃣ 클라이언트 측 로그아웃')
    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      console.log('⚠️  클라이언트 로그아웃 에러:', signOutError.message)
    } else {
      console.log('✅ 클라이언트 로그아웃 성공')
    }

    // 5. 세션 재확인
    console.log('\n5️⃣ 로그아웃 후 세션 확인')
    const {
      data: { session: afterSession },
    } = await supabase.auth.getSession()

    if (afterSession) {
      console.log('⚠️  여전히 세션이 존재:', afterSession.user.email)
    } else {
      console.log('✅ 세션이 완전히 정리됨')
    }

    console.log('\n🎯 로그아웃 플로우 테스트 완료')
    console.log('📱 모바일 앱에서 로그아웃 버튼 클릭 시:')
    console.log('   1. Drawer 컴포넌트의 handleLogout 함수 실행')
    console.log('   2. 확인 다이얼로그 표시')
    console.log('   3. /api/auth/logout POST 요청')
    console.log('   4. 서버 측 세션 및 쿠키 정리')
    console.log('   5. 클라이언트 측 supabase.auth.signOut()')
    console.log('   6. window.location.replace("/auth/login")로 강제 리다이렉트')
    console.log('   7. 모든 상태 초기화 및 로그인 페이지로 이동')
  } catch (error) {
    console.error('❌ 테스트 실패:', error)
  }
}

testLogoutFlow().catch(console.error)
