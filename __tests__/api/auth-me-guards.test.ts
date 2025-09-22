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

import { GET } from '@/app/api/auth/me/route'

const getAuthMock = jest.fn()

jest.mock('@/lib/auth/ultra-simple', () => ({
  getAuth: (...args: any[]) => getAuthMock(...args),
}))

const createClientMock = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: (...args: any[]) => createClientMock(...args),
}))

describe('auth me API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createClientMock.mockReset()
    getAuthMock.mockReset()
  })

  it('returns 401 when no session user exists', async () => {
    getAuthMock.mockResolvedValue(null)

    const supabaseRef = {
      auth: {
        getSession: jest.fn(async () => ({ data: { session: null }, error: null })),
        getUser: jest.fn(async () => ({ data: { user: null }, error: null })),
      },
    }

    createClientMock.mockReturnValue(supabaseRef)

    const response = await GET({} as any)
    expect(response.status).toBe(401)
    const payload = await response.json()
    expect(payload.user).toBeNull()
    expect(payload.profile).toBeNull()
  })

  it('returns session and profile data for authenticated user', async () => {
    getAuthMock.mockResolvedValue({
      isRestricted: true,
      uiTrack: '/dashboard/admin',
      restrictedOrgId: 'org-1',
    })

    const supabaseRef = {
      auth: {
        getSession: jest.fn(async () => ({
          data: {
            session: {
              user: { id: 'user-1', email: 'user@example.com' },
            },
          },
          error: null,
        })),
        getUser: jest.fn(async () => ({
          data: {
            user: { id: 'user-1', email: 'user@example.com' },
          },
          error: null,
        })),
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn(async () => ({
              data: {
                id: 'user-1',
                full_name: 'Test User',
                email: 'user@example.com',
                role: 'admin',
                site_id: 'site-1',
                notification_preferences: JSON.stringify({ email: true }),
              },
              error: null,
            })),
          })),
        })),
      })),
    }

    createClientMock.mockReturnValue(supabaseRef)

    const response = await GET({} as any)
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.user.id).toBe('user-1')
    expect(payload.profile.notification_preferences).toEqual({ email: true })
    expect(payload.isRestricted).toBe(true)
    expect(payload.uiTrack).toBe('/dashboard/admin')
    expect(payload.restrictedOrgId).toBe('org-1')
  })
})
