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

import { GET } from '@/app/api/analytics/sites/route'

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

describe('analytics sites guards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createClientMock.mockReset()
    requireApiAuth.mockReset()
  })

  it('returns sites limited to restricted organization', async () => {
    requireApiAuth.mockResolvedValue(restrictedAuth)

    let returnedIds: string[] | null = null

    const siteQuery: any = {
      eq: jest.fn(function (column: string, value: any) {
        if (column === 'organization_id') {
          expect(value).toBe('org-1')
        }
        return siteQuery
      }),
      in: jest.fn(function (_column: string, values: string[]) {
        returnedIds = values
        return siteQuery
      }),
      order: jest.fn(() => {
        const ids = returnedIds || ['site-1', 'site-2']
        return Promise.resolve({
          data: ids.map(id => ({ id, name: `Site ${id}` })),
          error: null,
        })
      }),
    }

    const supabaseRef = {
      from: jest.fn((table: string) => {
        switch (table) {
          case 'profiles':
            return {
              select: jest.fn((columns: string) => {
                expect(columns).toBe('role, organization_id, site_id')
                return {
                  eq: jest.fn(() => ({
                    single: jest.fn().mockResolvedValue({
                      data: { role: 'admin', organization_id: 'org-2', site_id: null },
                      error: null,
                    }),
                  })),
                }
              }),
            }
          case 'sites':
            return {
              select: jest.fn((columns: string) => {
                if (columns === 'id') {
                  return {
                    eq: jest.fn(() => Promise.resolve({
                      data: [
                        { id: 'site-1' },
                        { id: 'site-2' },
                      ],
                      error: null,
                    })),
                  }
                }
                expect(columns).toBe('id, name')
                return siteQuery
              }),
            }
          default:
            throw new Error(`Unexpected table ${table}`)
        }
      }),
    }

    createClientMock.mockReturnValue(supabaseRef)

    const response = await GET({ url: 'https://example.com/api/analytics/sites' } as any)

    expect(response instanceof NextResponse).toBe(true)
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.sites).toEqual([
      { id: 'site-1', name: 'Site site-1' },
      { id: 'site-2', name: 'Site site-2' },
    ])
    expect(siteQuery.in).toHaveBeenCalledWith('id', ['site-1', 'site-2'])
  })

  it('limits site manager to assigned sites', async () => {
    requireApiAuth.mockResolvedValue(siteManagerAuth)

    const assignedSiteIds = ['site-5', 'site-7']
    const capturedInValues: string[][] = []

    const siteQuery: any = {
      eq: jest.fn(function (column: string, value: any) {
        if (column === 'organization_id') {
          expect(value).toBe('org-1')
        }
        return siteQuery
      }),
      in: jest.fn(function (_column: string, values: string[]) {
        capturedInValues.push(values)
        return siteQuery
      }),
      order: jest.fn(() => {
        const ids = capturedInValues[capturedInValues.length - 1] ?? assignedSiteIds
        return Promise.resolve({
          data: ids.map(id => ({ id, name: `Site ${id}` })),
          error: null,
        })
      }),
    }

    const supabaseRef = {
      from: jest.fn((table: string) => {
        switch (table) {
          case 'profiles':
            return {
              select: jest.fn((columns: string) => {
                expect(columns).toBe('role, organization_id, site_id')
                return {
                  eq: jest.fn(() => ({
                    single: jest.fn().mockResolvedValue({
                      data: { role: 'site_manager', organization_id: 'org-1', site_id: null },
                      error: null,
                    }),
                  })),
                }
              }),
            }
          case 'site_members':
            return {
              select: jest.fn((columns: string) => {
                expect(columns).toBe('site_id')
                return {
                  eq: jest.fn(() => ({
                    eq: jest.fn(() => Promise.resolve({
                      data: assignedSiteIds.map(id => ({ site_id: id })),
                      error: null,
                    })),
                  })),
                }
              }),
            }
          case 'sites':
            return {
              select: jest.fn((columns: string) => {
                if (columns === 'id') {
                  return {
                    eq: jest.fn(() => Promise.resolve({
                      data: assignedSiteIds.map(id => ({ id })),
                      error: null,
                    })),
                  }
                }
                expect(columns).toBe('id, name')
                return siteQuery
              }),
            }
          default:
            throw new Error(`Unexpected table ${table}`)
        }
      }),
    }

    createClientMock.mockReturnValue(supabaseRef)

    const response = await GET({ url: 'https://example.com/api/analytics/sites' } as any)

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.sites).toEqual([
      { id: 'site-5', name: 'Site site-5' },
      { id: 'site-7', name: 'Site site-7' },
    ])
    expect(capturedInValues[capturedInValues.length - 1]).toEqual(assignedSiteIds)
  })
})
