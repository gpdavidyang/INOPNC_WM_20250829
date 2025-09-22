import {
  getSystemConfigurations,
  performSystemMaintenance,
} from '@/app/actions/admin/system'

const supabaseRef: { current: any } = { current: null }

const restrictedAuth = {
  userId: 'admin-1',
  email: 'admin@example.com',
  uiTrack: '/dashboard/admin',
  isRestricted: true,
  restrictedOrgId: 'org-1',
  role: 'admin',
}

jest.mock('@/app/actions/admin/common', () => ({
  withAdminAuth: jest.fn(async (callback: any) => {
    if (!supabaseRef.current) {
      throw new Error('Supabase mock not initialised')
    }

    const profile = {
      id: 'admin-1',
      role: 'admin',
      auth: restrictedAuth,
    }

    try {
      return await callback(supabaseRef.current, profile)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }),
  AdminErrors: {
    DATABASE_ERROR: 'DATABASE_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  },
}))

jest.mock('@/lib/auth/ultra-simple', () => ({
  assertOrgAccess: jest.fn(),
}))

describe('admin system guards', () => {
  beforeEach(() => {
    supabaseRef.current = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({ eq: jest.fn(() => ({ data: [], error: null })) })),
        order: jest.fn(() => ({ select: jest.fn() })),
        delete: jest.fn(() => ({ lt: jest.fn(() => ({ error: null })) })),
        upsert: jest.fn(() => ({ error: null })),
      })),
    }
  })

  it('blocks restricted admins from reading system configurations', async () => {
    const result = await getSystemConfigurations()

    expect(result.success).toBe(false)
    expect(result.error).toBe('시스템 설정에 접근할 권한이 없습니다.')
    expect(supabaseRef.current.from).not.toHaveBeenCalled()
  })

  it('blocks restricted admins from performing maintenance tasks', async () => {
    const result = await performSystemMaintenance(['cleanup_old_logs'])

    expect(result.success).toBe(false)
    expect(result.error).toBe('시스템 설정에 접근할 권한이 없습니다.')
  })
})
