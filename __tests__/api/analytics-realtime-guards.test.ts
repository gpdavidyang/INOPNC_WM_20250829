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

import { GET, POST } from '@/app/api/analytics/realtime/route'

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

const existingTables = new Set(['analytics_events', 'analytics_metrics', 'site_members'])

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

describe('analytics realtime guards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createClientMock.mockReset()
    requireApiAuth.mockReset()
  })

  it('returns channel scoped to restricted organization and accessible site', async () => {
    requireApiAuth.mockResolvedValue(restrictedAuth)

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
          default:
            throw new Error(`Unexpected table ${table}`)
        }
      }),
      auth: {
        getSession: jest.fn(async () => ({ data: { session: null }, error: null })),
        getUser: jest.fn(async () => ({ data: { user: null }, error: null })),
      },
    }

    createClientMock.mockReturnValue(supabaseRef)

    const response = await GET({
      url: 'https://example.com/api/analytics/realtime?siteId=site-1',
      nextUrl: new URL('https://example.com/api/analytics/realtime?siteId=site-1'),
    } as any)

    expect(response instanceof NextResponse).toBe(true)
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.channel).toBe('analytics:org-1:site-1')
    expect(payload.filters.organization_id).toBe('org-1')
    expect(payload.filters.site_id).toBe('site-1')
  })

  it('rejects restricted user subscribing to inaccessible site', async () => {
    requireApiAuth.mockResolvedValue(restrictedAuth)

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
          default:
            throw new Error(`Unexpected table ${table}`)
        }
      }),
      auth: {
        getSession: jest.fn(async () => ({ data: { session: null }, error: null })),
        getUser: jest.fn(async () => ({ data: { user: null }, error: null })),
      },
    }

    createClientMock.mockReturnValue(supabaseRef)

    const response = await GET({
      url: 'https://example.com/api/analytics/realtime?siteId=site-2',
      nextUrl: new URL('https://example.com/api/analytics/realtime?siteId=site-2'),
    } as any)

    expect(response.status).toBe(403)
    const payload = await response.json()
    expect(payload.error).toBe('Access denied to this site')
  })

  it('rejects analytics event creation for inaccessible site', async () => {
    requireApiAuth.mockResolvedValue(restrictedAuth)

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
          default:
            throw new Error(`Unexpected table ${table}`)
        }
      }),
      auth: {
        getSession: jest.fn(async () => ({ data: { session: null }, error: null })),
        getUser: jest.fn(async () => ({ data: { user: null }, error: null })),
      },
    }

    createClientMock.mockReturnValue(supabaseRef)

    const response = await POST({
      url: 'https://example.com/api/analytics/realtime',
      headers: {
        get: (key: string) => (key === 'content-length' ? '123' : null),
      },
      json: () => Promise.resolve({
        eventType: 'report_submitted',
        siteId: 'site-2',
        eventData: {},
      }),
    } as any)

    expect(response.status).toBe(403)
    const payload = await response.json()
    expect(payload.error).toBe('Access denied to this site')
  })

  it('stores RUM event without organization when unauthenticated', async () => {
    requireApiAuth.mockResolvedValue(new NextResponse({ error: 'Unauthorized' }, { status: 401 }))

    const insertPayloads: any[] = []

    const supabaseRef = {
      from: jest.fn((table: string) => {
        switch (table) {
          case 'information_schema.tables':
            return createInformationSchemaHandler()
          case 'analytics_events':
            return {
              insert: jest.fn((payload: any) => {
                insertPayloads.push(payload)
                return {
                  select: jest.fn(() => ({
                    single: jest.fn().mockResolvedValue({ data: payload, error: null }),
                  })),
                }
              }),
            }
          case 'information_schema.tables':
            return createInformationSchemaHandler()
          default:
            throw new Error(`Unexpected table ${table}`)
        }
      }),
      auth: {
        getSession: jest.fn(async () => ({ data: { session: null }, error: null })),
        getUser: jest.fn(async () => ({ data: { user: null }, error: null })),
      },
    }

    createClientMock.mockReturnValue(supabaseRef)

    const response = await POST({
      url: 'https://example.com/api/analytics/realtime',
      headers: {
        get: (key: string) => (key === 'content-length' ? '123' : null),
      },
      json: () => Promise.resolve({
        eventType: 'rum_page_view',
        eventData: { url: 'https://example.com/page' },
      }),
    } as any)

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.success).toBe(true)
    expect(insertPayloads).toHaveLength(1)
    expect(insertPayloads[0].organization_id).toBeNull()
  })
})
