import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'

// UI 트랙 매핑 (DB 또는 환경 변수에서 로드 가능)
const UI_TRACKS: Record<string, string> = {
  worker: '/mobile',
  site_manager: '/mobile',
  production_manager: '/mobile/production', // 생산관리 UI
  customer_manager: '/partner/dashboard',
  admin: '/dashboard/admin',
  system_admin: '/dashboard/admin',
}

// Simple Auth 타입 정의
export interface SimpleAuth {
  userId: string
  email: string
  isRestricted: boolean // true = 파트너사 (데이터 제한)
  restrictedOrgId?: string // 제한된 조직 ID
  uiTrack: string // UI 라우팅 경로
  role?: string // 원본 역할 (하위 호환성)
}

// 1. 인증 체크 (15줄)
export async function getAuth(): Promise<SimpleAuth | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id, full_name')
    .eq('id', user.id)
    .single()

  return {
    userId: user.id,
    email: user.email!,
    isRestricted: profile?.role === 'customer_manager',
    restrictedOrgId: profile?.organization_id,
    uiTrack: getUITrack(profile?.role),
    role: profile?.role,
  }
}

// 2. UI 트랙 결정 (5줄)
function getUITrack(role?: string): string {
  return UI_TRACKS[role || 'worker'] || '/mobile'
}

// 3. 데이터 접근 체크 (10줄)
export async function canAccessData(auth: SimpleAuth | null, orgId?: string): Promise<boolean> {
  if (!auth) return false
  if (!auth.isRestricted) return true // 파트너사 아니면 모두 허용
  return auth.restrictedOrgId === orgId // 파트너사는 자기 조직만
}

// 4. 페이지 보호 (Server Component용) (15줄)
export async function requireAuth(requiredTrack?: string): Promise<SimpleAuth> {
  const auth = await getAuth()

  if (!auth) {
    redirect('/auth/login')
  }

  // UI 트랙이 맞지 않으면 올바른 경로로 리다이렉트
  if (requiredTrack && !auth.uiTrack.includes(requiredTrack)) {
    redirect(auth.uiTrack)
  }

  return auth
}

// 5. API 보호 (Route Handler용) (15줄)
export async function requireApiAuth(orgId?: string): Promise<SimpleAuth | NextResponse> {
  const auth = await getAuth()

  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 조직 기반 데이터 접근 체크
  if (orgId && !(await canAccessData(auth, orgId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return auth
}

// 6. 로그아웃 (10줄)
export async function signOut(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

// Total: ~75 lines
