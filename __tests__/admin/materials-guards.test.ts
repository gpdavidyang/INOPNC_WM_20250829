import { AppError, ErrorType } from '@/lib/error-handling'
import {
  getMaterials,
  processMaterialRequestApprovals,
} from '@/app/actions/admin/materials'

type SupabaseMock = {
  from: jest.Mock
}

const supabaseRef: { current: SupabaseMock | null } = { current: null }

const restrictedAuth = {
  userId: 'user-123',
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
}))

const assertOrgAccess = jest.fn(async (_auth: typeof restrictedAuth, organizationId?: string) => {
  if (_auth.isRestricted && organizationId !== _auth.restrictedOrgId) {
    throw new AppError('자재 요청에 접근할 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
  }
})

jest.mock('@/lib/auth/ultra-simple', () => ({
  assertOrgAccess: (...args: any[]) => assertOrgAccess(...args),
}))

describe('admin materials guards', () => {
  beforeEach(() => {
    supabaseRef.current = null
    jest.clearAllMocks()
  })

  it('applies site scoping when restricted admin lists materials', async () => {
    const sitesSelect = jest.fn((columns: string) => {
      if (columns === 'id') {
        return {
          eq: jest.fn().mockResolvedValue({ data: [{ id: 'site-1' }], error: null }),
        }
      }
      if (columns === 'id, organization_id') {
        return {
          in: jest.fn().mockResolvedValue({
            data: [{ id: 'site-1', organization_id: 'org-1' }],
            error: null,
          }),
        }
      }
      throw new Error(`Unexpected columns ${columns}`)
    })

    const materialQuery: any = {}
    materialQuery.select = jest.fn().mockReturnValue(materialQuery)
    materialQuery.order = jest.fn().mockReturnValue(materialQuery)
    materialQuery.or = jest.fn().mockReturnValue(materialQuery)
    materialQuery.lt = jest.fn().mockReturnValue(materialQuery)
    materialQuery.eq = jest.fn().mockReturnValue(materialQuery)
    materialQuery.gte = jest.fn().mockReturnValue(materialQuery)
    materialQuery.range = jest.fn().mockReturnValue(materialQuery)
    materialQuery.in = jest.fn().mockReturnValue(materialQuery)
    materialQuery.then = jest
      .fn()
      .mockImplementation((resolve: (value: any) => any) =>
        resolve({
          data: [
            {
              id: 'mat-1',
              site_id: 'site-1',
              material_requests: [{ count: 0 }],
              material_transactions: [{ count: 0 }],
              current_stock: 10,
              minimum_stock: 5,
            },
          ],
          error: null,
          count: 1,
        })
      )

    let siteQueryCount = 0
    supabaseRef.current = {
      from: jest.fn((table: string) => {
        if (table === 'sites') {
          siteQueryCount += 1
          return { select: sitesSelect }
        }
        if (table === 'material_inventory') {
          return materialQuery
        }
        throw new Error(`Unexpected table ${table}`)
      }) as jest.Mock,
    }

    const result = await getMaterials()

    expect(result.success).toBe(true)
    expect(result.data?.materials).toHaveLength(1)
    expect(materialQuery.in).toHaveBeenCalledWith('site_id', ['site-1'])
    expect(siteQueryCount).toBeGreaterThanOrEqual(2)
  })

  it('rejects approval of requests outside restricted admin organization', async () => {
    const requestSelect = jest.fn().mockReturnValue({
      in: jest.fn().mockResolvedValue({
        data: [{ id: 'req-1', site_id: 'site-2' }],
        error: null,
      }),
    })

    const sitesSelect = jest.fn().mockReturnValue({
      in: jest.fn().mockResolvedValue({
        data: [{ id: 'site-2', organization_id: 'org-2' }],
        error: null,
      }),
    })

    let requestCall = 0
    supabaseRef.current = {
      from: jest.fn((table: string) => {
        if (table === 'material_requests') {
          requestCall += 1
          if (requestCall === 1) {
            return { select: requestSelect }
          }
          return {
            update: jest.fn(() => {
              throw new Error('update should not be invoked')
            }),
          }
        }
        if (table === 'sites') {
          return { select: sitesSelect }
        }
        throw new Error(`Unexpected table ${table}`)
      }) as jest.Mock,
    }

    const result = await processMaterialRequestApprovals(['req-1'], 'approve')

    expect(result.success).toBe(false)
    expect(result.error).toBe('자재 요청에 접근할 권한이 없습니다.')
    expect(assertOrgAccess).toHaveBeenCalledWith(restrictedAuth, 'org-2')
  })
})
