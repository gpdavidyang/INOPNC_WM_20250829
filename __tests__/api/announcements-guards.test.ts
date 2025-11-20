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

import { GET } from '@/app/api/announcements/route'

const restrictedAuth = {
  userId: 'user-1',
  email: 'user@example.com',
  uiTrack: '/dashboard/admin',
  isRestricted: true,
  restrictedOrgId: 'org-1',
  role: 'partner',
}

const createClientMock = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: (...args: any[]) => createClientMock(...args),
}))

const requireApiAuth = jest.fn()

jest.mock('@/lib/auth/ultra-simple', () => ({
  requireApiAuth: (...args: any[]) => requireApiAuth(...args),
}))

describe('announcements API guards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createClientMock.mockReset()
    requireApiAuth.mockReset()
  })

  it('filters announcements to accessible sites for restricted users', async () => {
    requireApiAuth.mockResolvedValue(restrictedAuth)

    const announcementsResult = {
      data: [
        {
          id: 'a1',
          title: 'Site announcement',
          content: 'Site specific',
          target_sites: ['site-1'],
          target_roles: null,
          priority: 'normal',
          created_at: '2024-09-01T00:00:00Z',
          updated_at: '2024-09-01T00:00:00Z',
          is_active: true,
          created_by: 'admin-1',
        },
        {
          id: 'a2',
          title: 'Other site announcement',
          content: 'Other site',
          target_sites: ['site-2'],
          target_roles: null,
          priority: 'normal',
          created_at: '2024-09-01T00:00:00Z',
          updated_at: '2024-09-01T00:00:00Z',
          is_active: true,
          created_by: 'admin-1',
        },
        {
          id: 'a3',
          title: 'Global partner update',
          content: 'Partner news',
          target_sites: null,
          target_roles: ['partner'],
          priority: 'high',
          created_at: '2024-09-01T00:00:00Z',
          updated_at: '2024-09-01T00:00:00Z',
          is_active: true,
          created_by: 'admin-1',
        },
      ],
      error: null,
    }

    let announcementsQuery: any
    const orMock = jest.fn(() => announcementsQuery)

    announcementsQuery = {
      select: jest.fn(() => announcementsQuery),
      eq: jest.fn(() => announcementsQuery),
      contains: jest.fn(() => announcementsQuery),
      or: orMock,
      order: jest.fn(() => announcementsQuery),
      then: (resolve: (value: typeof announcementsResult) => any) => {
        const siteFilter = orMock.mock.calls[0]?.[0] as string | undefined

        let filteredData = announcementsResult.data

        if (siteFilter) {
          const allowNull = siteFilter.includes('target_sites.is.null')
          const siteIds = siteFilter
            .split(',')
            .filter(segment => segment.startsWith('target_sites.cs'))
            .map(segment => segment.slice('target_sites.cs.{'.length, -1))

          filteredData = announcementsResult.data.filter(item => {
            if (!item.target_sites || item.target_sites.length === 0) {
              return allowNull
            }
            return item.target_sites.some(site => siteIds.includes(site))
          })
        }

        return Promise.resolve({ data: filteredData, error: null }).then(resolve)
      },
    }

    const supabaseRef = {
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'partner', site_id: null, organization_id: 'org-1' },
                  error: null,
                }),
              })),
            })),
          }
        }

        if (table === 'sites') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ data: [{ id: 'site-1' }], error: null })),
            })),
          }
        }

        if (table === 'announcements') {
          return announcementsQuery
        }

        throw new Error(`Unexpected table ${table}`)
      }),
    }

    createClientMock.mockReturnValue(supabaseRef)

    const response = await GET({
      url: 'https://example.com/api/announcements',
    } as any)

    expect(response instanceof NextResponse).toBe(true)
    expect(response.status).toBe(200)

    const payload = await response.json()

    expect(payload.success).toBe(true)
    expect(payload.announcements).toHaveLength(2)
    const announcementIds = payload.announcements.map((item: any) => item.id)
    expect(announcementIds).toContain('a1')
    expect(announcementIds).toContain('a3')
    expect(announcementIds).not.toContain('a2')
  })

  it('returns empty list when restricted user requests inaccessible site', async () => {
    requireApiAuth.mockResolvedValue(restrictedAuth)

    const supabaseRef = {
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: { role: 'partner', site_id: null, organization_id: 'org-1' },
                  error: null,
                }),
              })),
            })),
          }
        }

        if (table === 'sites') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ data: [{ id: 'site-1' }], error: null })),
            })),
          }
        }

        throw new Error(`Unexpected table ${table}`)
      }),
    }

    createClientMock.mockReturnValue(supabaseRef)

    const response = await GET({
      url: 'https://example.com/api/announcements?siteId=site-2',
    } as any)

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.success).toBe(true)
    expect(payload.announcements).toHaveLength(0)
    expect(supabaseRef.from).toHaveBeenCalledTimes(2)
  })
})
