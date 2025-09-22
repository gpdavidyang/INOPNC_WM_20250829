import { getSites, deleteSites } from '@/app/actions/admin/sites'
import { AppError, ErrorType } from '@/lib/error-handling'

const restrictedAuth = {
  userId: 'admin-1',
  email: 'admin@example.com',
  uiTrack: '/dashboard/admin',
  isRestricted: true,
  restrictedOrgId: 'org-1',
  role: 'admin',
}

const supabaseRef: { current: any } = { current: null }

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
  if (organizationId && organizationId !== _auth.restrictedOrgId) {
    throw new AppError('현장에 접근할 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
  }
})

jest.mock('@/lib/auth/ultra-simple', () => ({
  assertOrgAccess: (...args: any[]) => assertOrgAccess(...args),
}))

describe('admin sites guards', () => {
  beforeEach(() => {
    supabaseRef.current = null
    jest.clearAllMocks()
  })

  it('filters site list to restricted organization', async () => {
    const queryBuilder: any = {
      eq: jest.fn().mockImplementation(() => queryBuilder),
      or: jest.fn().mockImplementation(() => queryBuilder),
      order: jest.fn().mockImplementation(() => queryBuilder),
      range: jest.fn().mockImplementation(() => queryBuilder),
      select: jest.fn().mockImplementation(() => queryBuilder),
      then: undefined,
    }

    queryBuilder.select.mockReturnValue(queryBuilder)
    queryBuilder.order.mockReturnValue(queryBuilder)
    queryBuilder.range.mockImplementation(() => Promise.resolve({
      data: [
        {
          id: 'site-1',
          name: 'Site One',
          organization_id: 'org-1',
        },
      ],
      error: null,
      count: 1,
    }))

    queryBuilder.range = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'site-1',
          name: 'Site One',
          organization_id: 'org-1',
        },
      ],
      error: null,
      count: 1,
    })

    supabaseRef.current = {
      from: jest.fn((table: string) => {
        if (table === 'sites') {
          return queryBuilder
        }
        throw new Error(`Unexpected table ${table}`)
      }),
    }

    const result = await getSites()

    expect(result.success).toBe(true)
    expect(queryBuilder.eq).toHaveBeenCalledWith('organization_id', 'org-1')
    expect(result.data?.sites[0]).not.toHaveProperty('organization_id')
  })

  it('prevents deleting sites outside restricted organization', async () => {
    const siteSelect = jest.fn().mockReturnValue({
      in: jest.fn().mockResolvedValue({
        data: [{ id: 'site-1', organization_id: 'org-2' }],
        error: null,
      }),
    })

    const deleteIn = jest.fn()

    let callCount = 0
    supabaseRef.current = {
      from: jest.fn((table: string) => {
        if (table === 'sites') {
          return callCount++ === 0
            ? { select: siteSelect }
            : { delete: jest.fn(() => ({ in: deleteIn })) }
        }
        throw new Error(`Unexpected table ${table}`)
      }),
    }

    const result = await deleteSites(['site-1'])

    expect(result.success).toBe(false)
    expect(assertOrgAccess).toHaveBeenCalled()
    expect(deleteIn).not.toHaveBeenCalled()
  })
})
