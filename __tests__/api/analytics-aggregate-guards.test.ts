jest.mock('next/server', () => {
  class MockNextResponse {
    readonly status: number
    private readonly body: any

    constructor(body: any, init?: { status?: number }) {
      this.body = body
      this.status = init?.status ?? 200
    }

    static json(body: any, init?: { status?: number }) {
      return new MockNextResponse(body, init)
    }

    async json() {
      return this.body
    }
  }

  return { NextResponse: MockNextResponse }
})

const { NextResponse } = require('next/server') as { NextResponse: any }

import { GET, POST } from '@/app/api/analytics/aggregate/route'

const restrictedAuth = {
  userId: 'user-1',
  email: 'user@example.com',
  uiTrack: '/dashboard/admin',
  isRestricted: true,
  restrictedOrgId: 'org-1',
  role: 'admin',
}

const systemAdminAuth = {
  userId: 'user-2',
  email: 'sys@example.com',
  uiTrack: '/dashboard/admin',
  isRestricted: false,
  restrictedOrgId: null,
  role: 'system_admin',
}

const orgAdminAuth = {
  userId: 'user-3',
  email: 'org@example.com',
  uiTrack: '/dashboard/admin',
  isRestricted: false,
  restrictedOrgId: null,
  role: 'admin',
}

const createClientMock = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: (...args: any[]) => createClientMock(...args),
}))

const requireApiAuth = jest.fn()

jest.mock('@/lib/auth/ultra-simple', () => ({
  requireApiAuth: (...args: any[]) => requireApiAuth(...args),
}))

describe('analytics aggregate guards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createClientMock.mockReset()
    requireApiAuth.mockReset()
  })

  it('allows system admin to run global aggregation', async () => {
    requireApiAuth.mockResolvedValue({ ...systemAdminAuth })

    const rpcMock = jest.fn().mockResolvedValue({ error: null })

    const supabaseRef = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { role: 'system_admin', organization_id: null },
              error: null,
            }),
          })),
        })),
      })),
      rpc: rpcMock,
    }

    createClientMock.mockReturnValue(supabaseRef)

    const response = await POST({
      url: 'https://example.com/api/analytics/aggregate',
      json: () => Promise.resolve({ date: '2024-09-20' }),
    } as any)

    expect(response.status).toBe(200)
    expect(rpcMock).toHaveBeenCalledWith('run_daily_analytics_aggregation', {
      p_date: '2024-09-20',
    })
  })

  it('limits non-system admin aggregation to their organization', async () => {
    requireApiAuth.mockResolvedValue({ ...orgAdminAuth })

    const rpcMock = jest.fn().mockResolvedValue({ error: null })

    const supabaseRef = {
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'admin', organization_id: 'org-2' },
                  error: null,
                }),
              })),
            })),
          }
        }
        throw new Error(`Unexpected table ${table}`)
      }),
      rpc: rpcMock,
    }

    createClientMock.mockReturnValue(supabaseRef)

    const response = await POST({
      url: 'https://example.com/api/analytics/aggregate',
      json: () => Promise.resolve({ date: '2024-09-19' }),
    } as any)

    expect(response.status).toBe(200)
    expect(rpcMock).toHaveBeenCalledWith('run_daily_analytics_aggregation_for_org', {
      p_date: '2024-09-19',
      p_organization_id: 'org-2',
      p_user_id: 'user-3',
    })
  })

  it('scopes aggregation status queries to restricted organization', async () => {
    requireApiAuth.mockResolvedValue({ ...restrictedAuth })

    const analyticsQueryState: { organization_id?: string; site_in?: string[] } = {}
    const analyticsResult = [
      { stat_date: '2024-09-20', updated_at: '2024-09-20T12:00:00Z', site_id: 'site-1' },
    ]

    const analyticsQuery: any = {
      select: jest.fn(() => analyticsQuery),
      eq: jest.fn((column: string, value: any) => {
        if (column === 'stat_date') {
          return analyticsQuery
        }
        if (column === 'organization_id') {
          analyticsQueryState.organization_id = value
        }
        return analyticsQuery
      }),
      in: jest.fn((column: string, values: string[]) => {
        if (column === 'site_id') {
          analyticsQueryState.site_in = values
        }
        return analyticsQuery
      }),
      gte: jest.fn(() => analyticsQuery),
      lte: jest.fn(() => analyticsQuery),
      order: jest.fn(() => analyticsQuery),
    }

    analyticsQuery.then = (resolve: any) => resolve({ data: analyticsResult, error: null })

    const allowedSites = [{ id: 'site-1' }, { id: 'site-2' }]
    let countQuery: any
    const countEq = jest.fn((column: string, value: any) => {
      return countQuery
    })

    countQuery = {
      eq: countEq,
    }
    countQuery.then = (resolve: any) => resolve({ count: allowedSites.length })

    const supabaseRef = {
      from: jest.fn((table: string) => {
        switch (table) {
          case 'profiles':
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: { role: 'admin', organization_id: 'org-2' },
                    error: null,
                  }),
                })),
              })),
            }
          case 'analytics_daily_stats':
            return analyticsQuery
          case 'sites':
            return {
              select: jest.fn((columns: string, options?: any) => {
                if (!options) {
                  expect(columns).toBe('id')
                  return {
                    eq: jest.fn((column: string, value: any) => {
                      expect(column).toBe('organization_id')
                      expect(value).toBe('org-1')
                      return {
                        then: (resolve: any) => resolve({ data: allowedSites, error: null }),
                      }
                    }),
                  }
                }

                expect(columns).toBe('id')
                expect(options?.count).toBe('exact')
                return countQuery
              }),
            }
          default:
            throw new Error(`Unexpected table ${table}`)
        }
      }),
    }

    createClientMock.mockReturnValue(supabaseRef)

    const response = await GET({
      url: 'https://example.com/api/analytics/aggregate',
      nextUrl: new URL('https://example.com/api/analytics/aggregate'),
    } as any)

    expect(response.status).toBe(200)
    expect(analyticsQueryState.organization_id).toBe('org-1')
    expect(countEq).toHaveBeenCalledWith('organization_id', 'org-1')
  })
})
