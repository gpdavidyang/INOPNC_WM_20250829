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

import { GET } from '@/app/api/auth/check/route'

const cookiesMock = jest.fn()
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => cookiesMock()),
}))

const createClientMock = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: (...args: any[]) => createClientMock(...args),
}))

describe('auth check API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createClientMock.mockReset()
    cookiesMock.mockReset()
  })

  it('returns anonymous state when no session', async () => {
    cookiesMock.mockReturnValue({ getAll: () => [] })

    const supabaseRef = {
      auth: {
        getSession: jest.fn(async () => ({ data: { session: null }, error: null })),
        getUser: jest.fn(async () => ({ data: { user: null }, error: null })),
      },
    }

    createClientMock.mockReturnValue(supabaseRef)

    const response = await GET()

    expect(response instanceof NextResponse).toBe(true)
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.success).toBe(false)
    expect(payload.hasSession).toBe(false)
    expect(payload.userId).toBeNull()
    expect(payload.profile).toBeNull()
  })

  it('returns session and profile details for authenticated user', async () => {
    cookiesMock.mockReturnValue({ getAll: () => [{ name: 'sb-access-token', value: 'token' }] })

    const supabaseRef = {
      auth: {
        getSession: jest.fn(async () => ({
          data: {
            session: {
              user: {
                id: 'user-1',
                email: 'user@example.com',
              },
            },
          },
          error: null,
        })),
        getUser: jest.fn(async () => ({
          data: {
            user: {
              id: 'user-1',
              email: 'user@example.com',
            },
          },
          error: null,
        })),
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({ maybeSingle: jest.fn(async () => ({
            data: {
              id: 'user-1',
              full_name: 'Alice Admin',
              email: 'user@example.com',
              role: 'admin',
              site_id: 'site-1',
              organization_id: 'org-1',
            },
            error: null,
          })) })),
        })),
      })),
    }

    createClientMock.mockReturnValue(supabaseRef)

    const response = await GET()

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.success).toBe(true)
    expect(payload.userId).toBe('user-1')
    expect(payload.userEmail).toBe('user@example.com')
    expect(payload.profile).toEqual({
      id: 'user-1',
      full_name: 'Alice Admin',
      email: 'user@example.com',
      role: 'admin',
      site_id: 'site-1',
      organization_id: 'org-1',
    })
  })
})
