import {
  getMarkupDocuments,
  deleteMarkupDocuments,
} from '@/app/actions/admin/markup'
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
  },
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
    throw new AppError('마킹 문서에 접근할 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
  }
})

jest.mock('@/lib/auth/ultra-simple', () => ({
  assertOrgAccess: (...args: any[]) => assertOrgAccess(...args),
}))

describe('admin markup guards', () => {
  beforeEach(() => {
    supabaseRef.current = null
    jest.clearAllMocks()
  })

  it('filters markup documents to restricted organization', async () => {
    const queryBuilder: any = {
      select: jest.fn(),
      order: jest.fn(),
      eq: jest.fn(),
      or: jest.fn(),
      range: jest.fn(),
    }

    queryBuilder.select.mockReturnValue(queryBuilder)
    queryBuilder.order.mockReturnValue(queryBuilder)
    queryBuilder.eq.mockImplementation(() => queryBuilder)
    queryBuilder.or.mockReturnValue(queryBuilder)
    queryBuilder.range.mockReturnValue(
      Promise.resolve({
        data: [
          {
            id: 'markup-1',
            site_id: 'site-1',
            site: { organization_id: 'org-1' },
          },
        ],
        error: null,
        count: 1,
      })
    )

    const siteSelect = jest.fn().mockReturnValue({
      in: jest.fn().mockResolvedValue({
        data: [{ id: 'site-1', organization_id: 'org-1' }],
        error: null,
      }),
    })

    supabaseRef.current = {
      from: jest.fn((table: string) => {
        if (table === 'markup_documents') {
          return queryBuilder
        }
        if (table === 'sites') {
          return { select: siteSelect }
        }
        throw new Error(`Unexpected table ${table}`)
      }),
    }

    const result = await getMarkupDocuments()

    expect(result.success).toBe(true)
    expect(queryBuilder.eq).toHaveBeenCalledWith('site.organization_id', 'org-1')
    expect(siteSelect).toHaveBeenCalledWith('id, organization_id')
  })

  it('blocks deleting markup documents outside organization', async () => {
    const documentsSelect = jest.fn().mockReturnValue({
      in: jest.fn().mockResolvedValue({
        data: [{ id: 'markup-1', site: { organization_id: 'org-2' } }],
        error: null,
      }),
    })

    const updateMock = jest.fn()

    let callCount = 0
    supabaseRef.current = {
      from: jest.fn((table: string) => {
        if (table === 'markup_documents') {
          return callCount++ === 0
            ? { select: documentsSelect }
            : { update: jest.fn(() => ({ in: updateMock })) }
        }
        if (table === 'sites') {
          return { select: jest.fn().mockReturnValue({ in: jest.fn().mockResolvedValue({ data: [], error: null }) }) }
        }
        throw new Error(`Unexpected table ${table}`)
      }),
    }

    const result = await deleteMarkupDocuments(['markup-1'])

    expect(result.success).toBe(false)
    expect(result.error).toBe('마킹 문서에 접근할 권한이 없습니다.')
    expect(updateMock).not.toHaveBeenCalled()
  })
})
