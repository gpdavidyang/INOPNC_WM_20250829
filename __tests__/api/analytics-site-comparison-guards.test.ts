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

import { GET } from '@/app/api/analytics/site-comparison/route'

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
}))

describe('analytics site comparison guards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createClientMock.mockReset()
    requireApiAuth.mockReset()
  })

  it('scopes site comparison to restricted organization sites', async () => {
    requireApiAuth.mockResolvedValue(restrictedAuth)

    const siteIds = ['site-1', 'site-2']
    let selectCall = 0

    const siteNameQuery: any = {
      eq: jest.fn(function (column: string, value: any) {
        if (column === 'organization_id') {
          expect(value).toBe('org-1')
        }
        if (column === 'is_active') {
          expect(value).toBe(true)
        }
        return siteNameQuery
      }),
      in: jest.fn(function (_column: string, values: string[]) {
        expect(values).toEqual(siteIds)
        return siteNameQuery
      }),
      order: jest.fn(() => Promise.resolve({
        data: siteIds.map(id => ({ id, name: `Site ${id === 'site-1' ? 'One' : 'Two'}` })),
        error: null,
      })),
    }

    const siteIdQuery: any = {
      eq: jest.fn(() => siteIdQuery),
      order: jest.fn(() => Promise.resolve({
        data: siteIds.map(id => ({ id })),
        error: null,
      })),
      then: (resolve: any) => resolve({ data: siteIds.map(id => ({ id })), error: null }),
    }

    const siteSelectMock = jest.fn((columns: string) => {
      selectCall += 1
      if (columns === 'id' && selectCall === 1) {
        return siteIdQuery
      }
      if (columns === 'id, name') {
        return siteNameQuery
      }
      return siteNameQuery
    })

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
              select: siteSelectMock,
            }
          case 'daily_reports':
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  gte: jest.fn(() => ({
                    lte: jest.fn(() => Promise.resolve({ data: [], error: null })),
                  })),
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
      url: 'https://example.com/api/analytics/site-comparison?from=2024-09-01&to=2024-09-07',
    } as any)

    expect(response instanceof NextResponse).toBe(true)
    expect(response.status).toBe(200)
    expect(siteSelectMock).toHaveBeenCalled()
    const payload = await response.json()
    expect(payload.comparisonData.siteNames).toEqual(['Site One', 'Site Two'])
  })

  it('rejects invalid date ranges', async () => {
    requireApiAuth.mockResolvedValue(restrictedAuth)

    createClientMock.mockReturnValue({
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
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
        }
        throw new Error(`Unexpected table ${table}`)
      }),
    })

    const response = await GET({
      url: 'https://example.com/api/analytics/site-comparison?from=2024-09-07&to=2024-09-01',
    } as any)

    expect(response.status).toBe(400)
    const payload = await response.json()
    expect(payload.error).toBe('Invalid date range')
  })
})
