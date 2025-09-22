import {
  getShipmentHistory,
  processShipment,
} from '@/app/actions/admin/shipments'
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
    VALIDATION_ERROR: 'VALIDATION_ERROR',
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
    throw new AppError('현장에 접근할 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
  }
})

jest.mock('@/lib/auth/ultra-simple', () => ({
  assertOrgAccess: (...args: any[]) => assertOrgAccess(...args),
}))

describe('admin shipments guards', () => {
  beforeEach(() => {
    supabaseRef.current = null
    jest.clearAllMocks()
  })

  it('filters shipment history to accessible sites', async () => {
    const sitesQuery = {
      select: jest.fn(() => ({
        eq: jest.fn(() =>
          Promise.resolve({
            data: [
              { id: 'site-1' },
              { id: 'site-2' },
            ],
            error: null,
          })
        ),
      })),
    }

    const historyResult = {
      data: [
        {
          id: 'ship-1',
          site_id: 'site-1',
          sites: { organization_id: 'org-1' },
        },
        {
          id: 'ship-2',
          site_id: 'site-3',
          sites: { organization_id: 'org-2' },
        },
      ],
      error: null,
    }

    const historyQuery: any = {
      select: jest.fn(() => historyQuery),
      order: jest.fn(() => historyQuery),
      eq: jest.fn(() => historyQuery),
      in: jest.fn(() => historyQuery),
      gte: jest.fn(() => historyQuery),
      lte: jest.fn(() => historyQuery),
      limit: jest.fn(() => historyQuery),
      then: (resolve: (value: any) => any) => Promise.resolve(historyResult).then(resolve),
    }

    supabaseRef.current = {
      from: jest.fn((table: string) => {
        if (table === 'sites') {
          return sitesQuery
        }
        if (table === 'shipment_records') {
          return historyQuery
        }
        throw new Error(`Unexpected table ${table}`)
      }),
    }

    const result = await getShipmentHistory()

    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(1)
    expect(result.data?.[0].id).toBe('ship-1')
    expect(historyQuery.in).toHaveBeenCalledWith('site_id', ['site-1', 'site-2'])
  })

  it('prevents shipments from other organizations during creation', async () => {
    const siteAccess = {
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { organization_id: 'org-2' },
            error: null,
          }),
        })),
      })),
    }

    supabaseRef.current = {
      from: jest.fn((table: string) => {
        if (table === 'sites') {
          return siteAccess
        }
        if (table === 'v_inventory_status') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: { current_stock: 100 },
                  error: null,
                }),
              })),
            })),
          }
        }
        if (table === 'shipment_records') {
          return {
            insert: jest.fn(() => ({ select: jest.fn(() => ({ single: jest.fn() })) })),
          }
        }
        if (table === 'material_requests') {
          return { select: jest.fn() }
        }
        throw new Error(`Unexpected table ${table}`)
      }),
    }

    const result = await processShipment({ site_id: 'site-9', quantity_shipped: 10 })

    expect(result.success).toBe(false)
    expect(result.error).toBe('현장에 접근할 권한이 없습니다.')
  })
})
