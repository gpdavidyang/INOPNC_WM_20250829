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

import { GET } from '@/app/api/analytics/dashboard/route'

const restrictedAuth = {
  userId: 'user-1',
  email: 'user@example.com',
  uiTrack: '/dashboard/admin',
  isRestricted: true,
  restrictedOrgId: 'org-1',
  role: 'admin',
}

const siteManagerAuth = {
  userId: 'user-2',
  email: 'manager@example.com',
  uiTrack: '/dashboard/admin',
  isRestricted: false,
  restrictedOrgId: null,
  role: 'site_manager',
}

const createClientMock = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: (...args: any[]) => createClientMock(...args),
}))

const requireApiAuth = jest.fn()

jest.mock('@/lib/auth/ultra-simple', () => ({
  requireApiAuth: (...args: any[]) => requireApiAuth(...args),
}))

function createDailyStatsQuery(returnData: any[]) {
  const queryState: { orgId?: string; siteIn?: string[]; siteEq?: string } = {}

  const query: any = {
    select: jest.fn(() => query),
    eq: jest.fn((column: string, value: any) => {
      if (column === 'organization_id') {
        queryState.orgId = value
      }
      if (column === 'site_id') {
        queryState.siteEq = value
      }
      return query
    }),
    gte: jest.fn(() => query),
    lte: jest.fn(() => query),
    in: jest.fn((column: string, values: string[]) => {
      if (column === 'site_id') {
        queryState.siteIn = values
      }
      return query
    }),
    order: jest.fn(() => Promise.resolve({ data: returnData, error: null })),
    __state: queryState,
  }

  return query
}

describe('analytics dashboard guards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createClientMock.mockReset()
    requireApiAuth.mockReset()
  })

  it('scopes summary to restricted organization sites', async () => {
    requireApiAuth.mockResolvedValue(restrictedAuth)

    const dataset = [
      {
        stat_date: '2024-09-20',
        organization_id: 'org-1',
        site_id: 'site-1',
        total_reports: 5,
        report_completion_rate: 90,
        attendance_rate: 80,
        total_labor_hours: '12.5',
        productivity_score: 85,
        npc1000_used: '3.4',
      },
      {
        stat_date: '2024-09-19',
        organization_id: 'org-1',
        site_id: 'site-2',
        total_reports: 4,
        report_completion_rate: 75,
        attendance_rate: 70,
        total_labor_hours: '10',
        productivity_score: 78,
        npc1000_used: '2.6',
      },
    ]

    const analyticsQuery = createDailyStatsQuery(dataset)

    const supabaseRef = {
      from: jest.fn((table: string) => {
        switch (table) {
          case 'profiles':
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: { role: 'admin', organization_id: 'org-2', site_id: null },
                    error: null,
                  }),
                })),
              })),
            }
          case 'sites':
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({
                  data: [
                    { id: 'site-1' },
                    { id: 'site-2' },
                  ],
                  error: null,
                })),
              })),
            }
          case 'analytics_daily_stats':
            return analyticsQuery
          default:
            throw new Error(`Unexpected table ${table}`)
        }
      }),
    }

    createClientMock.mockReturnValue(supabaseRef)

    const response = await GET({
      url: 'https://example.com/api/analytics/dashboard?startDate=2024-09-19&endDate=2024-09-20',
      nextUrl: new URL('https://example.com/api/analytics/dashboard?startDate=2024-09-19&endDate=2024-09-20'),
    } as any)

    expect(response instanceof NextResponse).toBe(true)
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(analyticsQuery.__state.orgId).toBe('org-1')
    expect(analyticsQuery.__state.siteIn).toEqual(['site-1', 'site-2'])
    expect(payload.summary.totalReports).toBe(9)
    expect(payload.summary.avgCompletionRate).toBe('82.50')
    expect(payload.summary.avgAttendanceRate).toBe('75.00')
    expect(payload.summary.totalLaborHours).toBe('22.50')
    expect(payload.summary.avgProductivityScore).toBe('81.50')
    expect(payload.summary.totalNPC1000Used).toBe('6.00')
  })

  it('rejects restricted user requesting inaccessible site', async () => {
    requireApiAuth.mockResolvedValue(restrictedAuth)

    const supabaseRef = {
      from: jest.fn((table: string) => {
        switch (table) {
          case 'profiles':
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: { role: 'admin', organization_id: 'org-2', site_id: null },
                    error: null,
                  }),
                })),
              })),
            }
          case 'sites':
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({
                  data: [{ id: 'site-1' }],
                  error: null,
                })),
              })),
            }
          default:
            throw new Error(`Unexpected table ${table}`)
        }
      }),
    }

    createClientMock.mockReturnValue(supabaseRef)

    const response = await GET({
      url: 'https://example.com/api/analytics/dashboard?siteId=site-2',
      nextUrl: new URL('https://example.com/api/analytics/dashboard?siteId=site-2'),
    } as any)

    expect(response.status).toBe(403)
    const payload = await response.json()
    expect(payload.error).toBe('Access denied to this site')
  })

  it('limits site manager dashboard to assigned sites', async () => {
    requireApiAuth.mockResolvedValue(siteManagerAuth)

    const assignedSites = ['site-10', 'site-20']
    const analyticsQuery = createDailyStatsQuery([])

    const supabaseRef = {
      from: jest.fn((table: string) => {
        switch (table) {
          case 'profiles':
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: { role: 'site_manager', organization_id: 'org-3', site_id: null },
                    error: null,
                  }),
                })),
              })),
            }
          case 'site_members':
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  eq: jest.fn(() => Promise.resolve({
                    data: assignedSites.map(id => ({ site_id: id })),
                    error: null,
                  })),
                })),
              })),
            }
          case 'analytics_daily_stats':
            return analyticsQuery
          default:
            throw new Error(`Unexpected table ${table}`)
        }
      }),
    }

    createClientMock.mockReturnValue(supabaseRef)

    const response = await GET({
      url: 'https://example.com/api/analytics/dashboard',
      nextUrl: new URL('https://example.com/api/analytics/dashboard'),
    } as any)

    expect(response.status).toBe(200)
    expect(analyticsQuery.__state.siteIn).toEqual(assignedSites)
  })
})
