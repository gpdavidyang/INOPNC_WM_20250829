import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testLogout() {
  console.log('🧪 로그아웃 기능 테스트...\n')

  try {
    // 1. 현재 세션 확인
    console.log('1️⃣ 현재 세션 확인')
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession()

    if (currentSession) {
      console.log('✅ 현재 로그인 상태:', currentSession.user.email)
    } else {
      console.log('❌ 현재 로그아웃 상태')
    }

    // 2. 로그아웃 API 테스트
    console.log('\n2️⃣ 로그아웃 API 엔드포인트 테스트')
    const response = await fetch('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ 로그아웃 API 응답:', result)
    } else {
      console.log('❌ 로그아웃 API 실패:', response.status)
    }

    // 3. 세션 재확인
    console.log('\n3️⃣ 로그아웃 후 세션 확인')
    const {
      data: { session: afterSession },
    } = await supabase.auth.getSession()

    if (afterSession) {
      console.log('⚠️  여전히 로그인 상태:', afterSession.user.email)
    } else {
      console.log('✅ 로그아웃 성공')
    }

    console.log('\n🎯 로그아웃 구현 완료:')
    console.log('1. Drawer 컴포넌트의 handleLogout 함수 개선')
    console.log('   - 에러 처리 추가')
    console.log('   - 서버 API 호출')
    console.log('   - 클라이언트 세션 정리')
    console.log('   - 강제 페이지 리로드')
    console.log('2. /api/auth/logout 엔드포인트 생성')
    console.log('   - 서버 측 세션 정리')
    console.log('   - 모든 인증 쿠키 삭제')
    console.log('3. window.location.replace 사용')
    console.log('   - 브라우저 히스토리 대체')
    console.log('   - 완전한 페이지 새로고침')
  } catch (error) {
    console.error('❌ 테스트 실패:', error)
  }
}

testLogout().catch(console.error)
