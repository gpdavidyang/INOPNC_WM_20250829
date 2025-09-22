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

import { GET } from '@/app/api/analytics/trends/route'

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

describe('analytics trends guards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createClientMock.mockReset()
    requireApiAuth.mockReset()
  })

  it('filters trend data to restricted organization sites', async () => {
    requireApiAuth.mockResolvedValue(restrictedAuth)

    const supabaseRef = {
      from: jest.fn((table: string) => {
        switch (table) {
          case 'profiles':
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: { role: 'admin', organization_id: 'org-1', site_id: null },
                    error: null,
                  }),
                })),
              })),
            }
          case 'sites':
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ data: [{ id: 'site-1' }, { id: 'site-2' }], error: null })),
              })),
            }
          case 'daily_reports':
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  gte: jest.fn(() => ({
                    lte: jest.fn(() => Promise.resolve({
                      data: [
                        { created_at: '2024-09-18T00:00:00Z', site_id: 'site-1' },
                        { created_at: '2024-09-19T00:00:00Z', site_id: 'site-3' },
                        { created_at: '2024-09-20T00:00:00Z', site_id: null },
                      ],
                      error: null,
                    })),
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
      url: 'https://example.com/api/analytics/trends?type=daily_reports&from=2024-09-18&to=2024-09-20',
    } as any)

    expect(response instanceof NextResponse).toBe(true)
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.trendData.datasets[0].data).toEqual([1, 0, 1])
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
                    data: { role: 'admin', organization_id: 'org-1', site_id: null },
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
          default:
            throw new Error(`Unexpected table ${table}`)
        }
      }),
    }

    createClientMock.mockReturnValue(supabaseRef)

    const response = await GET({
      url: 'https://example.com/api/analytics/trends?type=daily_reports&from=2024-09-18&to=2024-09-20&site=site-2',
    } as any)

    expect(response.status).toBe(403)
    const payload = await response.json()
    expect(payload.error).toBe('Access denied to this site')
  })
})
