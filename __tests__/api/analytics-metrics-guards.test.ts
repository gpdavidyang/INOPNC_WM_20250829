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

import { GET, POST } from '@/app/api/analytics/metrics/route'

const restrictedAuth = {
  userId: 'user-1',
  email: 'user@example.com',
  uiTrack: '/dashboard/admin',
  isRestricted: true,
  restrictedOrgId: 'org-1',
  role: 'admin',
}

const createClientMock = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: (...args: any[]) => createClientMock(...args),
}))

const requireApiAuth = jest.fn()

jest.mock('@/lib/auth/ultra-simple', () => ({
  requireApiAuth: (...args: any[]) => requireApiAuth(...args),
  getAuthForClient: jest.fn(),
}))

const existingTables = new Set(['analytics_metrics'])

function createInformationSchemaHandler() {
  const chain: any = {
    _tableName: undefined as string | undefined,
    select: jest.fn(() => chain),
    eq: jest.fn((column: string, value: string) => {
      if (column === 'table_name') {
        chain._tableName = value
      }
      return chain
    }),
    maybeSingle: jest.fn(async () => {
      if (chain._tableName && existingTables.has(chain._tableName)) {
        return { data: { table_name: chain._tableName }, error: null }
      }
      return { data: null, error: null }
    }),
  }

  return chain
}

function createAnalyticsQuery(metricsData: Array<any>) {
  const filters: {
    organization_id?: string
    metric_type?: string
    site_id?: string | null
    orConditions?: string
  } = {}

  let query: any

  query = {
    select: jest.fn(() => query),
    gte: jest.fn(() => query),
    order: jest.fn(() => query),
    eq: jest.fn((column: string, value: any) => {
      if (column === 'organization_id') {
        filters.organization_id = value
      }
      if (column === 'metric_type') {
        filters.metric_type = value
      }
      if (column === 'site_id') {
        filters.site_id = value
      }
      return query
    }),
    or: jest.fn((condition: string) => {
      filters.orConditions = condition
      return query
    }),
    then: (resolve: (value: any) => any) => {
      let filtered = metricsData.slice()

      if (filters.organization_id) {
        filtered = filtered.filter(item => item.organization_id === filters.organization_id)
      }

      if (filters.metric_type) {
        filtered = filtered.filter(item => item.metric_type === filters.metric_type)
      }

      if (filters.site_id !== undefined) {
        filtered = filtered.filter(item => item.site_id === filters.site_id)
      } else if (filters.orConditions) {
        const allowNull = filters.orConditions.includes('site_id.is.null')
        const match = filters.orConditions.match(/site_id\.in\.\(([^)]+)\)/)
        const allowedSites = match ? match[1].split(',') : []

        filtered = filtered.filter(item => {
          if (item.site_id === null) {
            return allowNull
          }
          if (allowedSites.length === 0) {
            return allowNull ? item.site_id === null : false
          }
          return allowedSites.includes(item.site_id)
        })
      }

      return Promise.resolve(resolve({ data: filtered, error: null }))
    },
  }

  return query
}

describe('analytics metrics API guards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createClientMock.mockReset()
    requireApiAuth.mockReset()
  })

  it('scopes metrics to restricted organization and accessible sites', async () => {
    requireApiAuth.mockResolvedValue(restrictedAuth)

    const metricsData = [
      {
        id: 'm1',
        site_id: 'site-1',
        organization_id: 'org-1',
        metric_type: 'daily_report_completion',
      },
      {
        id: 'm2',
        site_id: 'site-2',
        organization_id: 'org-1',
        metric_type: 'daily_report_completion',
      },
      {
        id: 'm3',
        site_id: null,
        organization_id: 'org-1',
        metric_type: 'daily_report_completion',
      },
      {
        id: 'm4',
        site_id: 'site-3',
        organization_id: 'org-2',
        metric_type: 'daily_report_completion',
      },
    ]

    const supabaseRef = {
      from: jest.fn((table: string) => {
        switch (table) {
          case 'information_schema.tables':
            return createInformationSchemaHandler()
          case 'profiles':
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: { role: 'admin', site_id: null, organization_id: 'org-1' },
                    error: null,
                  }),
                })),
              })),
            }
          case 'sites':
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ data: [{ id: 'site-1' }], error: null })),
              })),
            }
          case 'analytics_metrics':
            return createAnalyticsQuery(metricsData)
          default:
            throw new Error(`Unexpected table ${table}`)
        }
      }),
    }

    createClientMock.mockReturnValue(supabaseRef)

    const response = await GET({
      url: 'https://example.com/api/analytics/metrics?type=daily_report_completion',
      nextUrl: new URL('https://example.com/api/analytics/metrics?type=daily_report_completion'),
    } as any)

    expect(response instanceof NextResponse).toBe(true)
    expect(response.status).toBe(200)

    const payload = await response.json()

    expect(payload.count).toBe(2)
    const ids = payload.data.map((item: any) => item.id)
    expect(ids).toContain('m1')
    expect(ids).toContain('m3')
    expect(ids).not.toContain('m2')
    expect(ids).not.toContain('m4')
    expect(payload.filters.organizationId).toBe('org-1')
  })

  it('returns empty when requesting inaccessible site for restricted user', async () => {
    requireApiAuth.mockResolvedValue(restrictedAuth)

    const metricsData = [
      {
        id: 'm1',
        site_id: 'site-1',
        organization_id: 'org-1',
        metric_type: 'daily_report_completion',
      },
      {
        id: 'm2',
        site_id: 'site-2',
        organization_id: 'org-1',
        metric_type: 'daily_report_completion',
      },
    ]

    const supabaseRef = {
      from: jest.fn((table: string) => {
        switch (table) {
          case 'information_schema.tables':
            return createInformationSchemaHandler()
          case 'profiles':
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: { role: 'admin', site_id: null, organization_id: 'org-1' },
                    error: null,
                  }),
                })),
              })),
            }
          case 'sites':
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ data: [{ id: 'site-1' }], error: null })),
              })),
            }
          case 'analytics_metrics':
            return createAnalyticsQuery(metricsData)
          default:
            throw new Error(`Unexpected table ${table}`)
        }
      }),
    }

    createClientMock.mockReturnValue(supabaseRef)

    const response = await GET({
      url: 'https://example.com/api/analytics/metrics?type=daily_report_completion&siteId=site-2',
      nextUrl: new URL('https://example.com/api/analytics/metrics?type=daily_report_completion&siteId=site-2'),
    } as any)

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.count).toBe(0)
    expect(Array.isArray(payload.data)).toBe(true)
    expect(payload.data).toHaveLength(0)
  })

  it('stores web vitals metrics using restricted organization scope', async () => {
    requireApiAuth.mockResolvedValue(restrictedAuth)

    const insertPayloads: any[] = []

    const supabaseRef = {
      from: jest.fn((table: string) => {
        switch (table) {
          case 'information_schema.tables':
            return createInformationSchemaHandler()
          case 'profiles':
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: { organization_id: 'org-1' },
                    error: null,
                  }),
                })),
              })),
            }
          case 'analytics_metrics':
            return {
              insert: jest.fn(async (payload: any) => {
                insertPayloads.push(payload)
                return { error: null }
              }),
            }
          default:
            throw new Error(`Unexpected table ${table}`)
        }
      }),
    }

    createClientMock.mockReturnValue(supabaseRef)

    const body = {
      type: 'web_vitals',
      metric: 'LCP',
      value: 2400,
      rating: 'good',
      delta: 5,
      id: 'metric-1',
      navigationType: 'navigate',
      url: 'https://example.com/dashboard',
      timestamp: '2024-09-21T00:00:00Z',
    }

    const response = await POST({
      url: 'https://example.com/api/analytics/metrics',
      headers: {
        get: (key: string) => (key === 'content-length' ? '123' : null),
      },
      json: () => Promise.resolve(body),
    } as any)

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.success).toBe(true)
    expect(insertPayloads).toHaveLength(1)
    expect(insertPayloads[0].organization_id).toBe('org-1')
    expect(insertPayloads[0].metric_type).toBe('web_vitals_lcp')
  })
})
