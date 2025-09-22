import {
  getProductionHistory,
  updateProductionRecord,
} from '@/app/actions/admin/production'
import { AppError, ErrorType } from '@/lib/error-handling'

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

jest.mock('@/lib/utils/logging', () => ({
  logAuditTrail: jest.fn(async () => true),
  recordMetric: jest.fn(async () => true),
  PerformanceTimer: jest.fn().mockImplementation(() => ({
    stop: jest.fn().mockResolvedValue(0),
  })),
  MetricNames: {
    PRODUCTION_RECORD: 'production_record',
  },
}))

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
    throw new AppError('생산 기록에 접근할 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
  }
})

jest.mock('@/lib/auth/ultra-simple', () => ({
  assertOrgAccess: (...args: any[]) => assertOrgAccess(...args),
}))

describe('admin production guards', () => {
  beforeEach(() => {
    supabaseRef.current = null
    jest.clearAllMocks()
  })

  it('filters production history to restricted organization records', async () => {
    const historyResult = {
      data: [
        {
          id: 'prod-1',
          production_date: '2024-09-01',
          quantity_produced: '10',
          unit_cost: '2.5',
          total_cost: '25',
          notes: null,
          created_by: 'admin-1',
          created_at: '2024-09-01T00:00:00Z',
          updated_at: '2024-09-01T00:00:00Z',
          creator: {
            organization_id: 'org-1',
            full_name: '홍길동',
          },
        },
      ],
      error: null,
    }

    const eqMock = jest.fn(() => queryBuilder)
    const queryBuilder: any = {
      select: jest.fn(() => queryBuilder),
      order: jest.fn(() => queryBuilder),
      gte: jest.fn(() => queryBuilder),
      lte: jest.fn(() => queryBuilder),
      limit: jest.fn(() => queryBuilder),
      eq: eqMock,
      then: (resolve: (value: any) => any) => Promise.resolve(historyResult).then(resolve),
    }

    eqMock.mockReturnValue(queryBuilder)

    supabaseRef.current = {
      from: jest.fn((table: string) => {
        if (table === 'production_records') {
          return queryBuilder
        }
        throw new Error(`Unexpected table ${table}`)
      }),
    }

    const result = await getProductionHistory()

    expect(result.success).toBe(true)
    expect(eqMock).toHaveBeenCalledWith('creator.organization_id', 'org-1')
    expect(result.data).toHaveLength(1)
    expect(result.data?.[0]?.creator_name).toBe('홍길동')
    expect(result.data?.[0]?.quantity_produced).toBe(10)
    expect(result.data?.[0]?.total_cost).toBe(25)
  })

  it('blocks updating production records outside the restricted organization', async () => {
    const singleMock = jest.fn().mockResolvedValue({
      data: {
        id: 'prod-2',
        production_date: '2024-09-02',
        quantity_produced: '12',
        unit_cost: '3.5',
        total_cost: '42',
        notes: null,
        created_by: 'external-admin',
        created_at: '2024-09-02T00:00:00Z',
        updated_at: '2024-09-02T00:00:00Z',
        creator: {
          organization_id: 'org-2',
          full_name: '다른 관리자',
        },
      },
      error: null,
    })

    const eqMock = jest.fn(() => ({ single: singleMock }))
    const selectMock = jest.fn(() => ({ eq: eqMock }))

    let callCount = 0
    supabaseRef.current = {
      from: jest.fn((table: string) => {
        if (table !== 'production_records') {
          throw new Error(`Unexpected table ${table}`)
        }
        callCount += 1
        if (callCount > 1) {
          return {
            update: jest.fn(() => ({
              eq: jest.fn(),
            })),
          }
        }
        return {
          select: selectMock,
        }
      }),
    }

    const result = await updateProductionRecord('prod-2', { quantity_produced: 20 })

    expect(assertOrgAccess).toHaveBeenCalledWith(restrictedAuth, 'org-2')
    expect(result.success).toBe(false)
    expect(result.error).toBe('생산 기록에 접근할 권한이 없습니다.')
    expect(callCount).toBe(1)
    expect(singleMock).toHaveBeenCalled()
  })
})
