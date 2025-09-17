// Development-only authentication bypass
// This file provides mock authentication for UI/UX development

export const isDevelopmentAuthBypass = () => {
  return (
    process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'
  )
}

export const mockUser = {
  id: 'dev-user-001',
  email: 'developer@inopnc.com',
  user_metadata: {
    full_name: '개발자 테스트',
    role: 'site_manager',
  },
  app_metadata: {
    provider: 'email',
    providers: ['email'],
  },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
}

export const mockProfile = {
  id: 'dev-user-001',
  full_name: '개발자 테스트',
  email: 'developer@inopnc.com',
  role: 'site_manager' as const,
  phone: '010-0000-0000',
  organization_id: '11111111-1111-1111-1111-111111111111',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  status: 'active',
}

export const mockSession = {
  access_token: 'dev-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  refresh_token: 'dev-refresh-token',
  user: mockUser,
}
