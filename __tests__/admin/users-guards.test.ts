import { deleteUsers, updateUserRole } from '@/app/actions/admin/users'
import { AppError, ErrorType } from '@/lib/error-handling'

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
    NOT_FOUND: 'NOT_FOUND',
  },
  validateEmail: jest.fn(() => null),
  validateRequired: jest.fn(() => null),
  requireRestrictedOrgId: (auth: typeof restrictedAuth) => {
    if (!auth.restrictedOrgId) {
      throw new Error('restricted org id missing')
    }
    return auth.restrictedOrgId
  },
  resolveAdminError: (error: unknown) =>
    error instanceof Error ? error.message : 'UNKNOWN_ERROR',
}))

const assertOrgAccess = jest.fn(async (_auth: typeof restrictedAuth, organizationId?: string) => {
  if (!_auth.isRestricted || organizationId === _auth.restrictedOrgId) {
    return
  }
  throw new AppError('조직 정보가 필요합니다.', ErrorType.AUTHORIZATION, 403)
})

jest.mock('@/lib/auth/ultra-simple', () => ({
  assertOrgAccess: (...args: any[]) => assertOrgAccess(...args),
}))

jest.mock('@/app/actions/admin/email-notifications', () => ({
  sendWelcomeEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}))

describe('admin users guards', () => {
  beforeEach(() => {
    supabaseRef.current = null
    jest.clearAllMocks()
  })

  it('restricts role updates to users inside the organization', async () => {
    const guardIn = jest.fn().mockResolvedValue({
      data: [{ id: 'user-1', organization_id: 'org-1' }],
      error: null,
    })

    const selectGuard = jest.fn(() => ({ in: guardIn }))
    const updateIn = jest.fn().mockResolvedValue({ error: null })
    const updateMock = jest.fn(() => ({ in: updateIn }))

    supabaseRef.current = {
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: selectGuard,
            update: updateMock,
            delete: jest.fn(),
          }
        }
        throw new Error(`Unexpected table ${table}`)
      }),
    }

    const result = await updateUserRole(['user-1'], 'worker')

    expect(result.success).toBe(true)
    expect(selectGuard).toHaveBeenCalledWith('id, organization_id')
    expect(guardIn).toHaveBeenCalledWith('id', ['user-1'])
    expect(updateMock).toHaveBeenCalled()
    expect(updateIn).toHaveBeenCalledWith('id', ['user-1'])
  })

  it('denies deletions for users outside the restricted organization', async () => {
    const guardIn = jest.fn().mockResolvedValue({
      data: [{ id: 'user-2', organization_id: 'org-2' }],
      error: null,
    })

    const selectGuard = jest.fn(() => ({ in: guardIn }))
    const deleteMock = jest.fn(() => ({ in: jest.fn().mockResolvedValue({ error: null }) }))

    supabaseRef.current = {
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: selectGuard,
            delete: deleteMock,
            update: jest.fn(),
          }
        }
        throw new Error(`Unexpected table ${table}`)
      }),
      auth: { admin: { deleteUser: jest.fn() } },
    }

    const result = await deleteUsers(['user-2'])

    expect(result.success).toBe(false)
    expect(result.error).toBe('사용자에 접근할 권한이 없습니다.')
    expect(deleteMock).not.toHaveBeenCalled()
  })
})
