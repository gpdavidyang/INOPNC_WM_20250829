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

import { GET, POST } from '@/app/api/auth/sync-session/route'

const createClientMock = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: (...args: any[]) => createClientMock(...args),
}))

describe('auth sync session API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createClientMock.mockReset()
  })

  it('rejects POST when tokens missing', async () => {
    createClientMock.mockReturnValue({ auth: {} })

    const response = await POST({
      json: () => Promise.resolve({}),
    } as any)

    expect(response.status).toBe(400)
    const payload = await response.json()
    expect(payload.success).toBe(false)
  })

  it('sets session and verifies user on POST', async () => {
    const supabaseRef = {
      auth: {
        setSession: jest.fn(async () => ({
          data: {
            session: { access_token: 'token' },
            user: { id: 'user-1', email: 'user@example.com' },
          },
          error: null,
        })),
        getUser: jest.fn(async () => ({
          data: { user: { id: 'user-1', email: 'user@example.com' } },
          error: null,
        })),
        getSession: jest.fn(async () => ({ data: { session: { user: { id: 'user-1' } } }, error: null })),
      },
    }

    createClientMock.mockReturnValue(supabaseRef)

    const response = await POST({
      json: () => Promise.resolve({ access_token: 'a', refresh_token: 'b' }),
    } as any)

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.success).toBe(true)
    expect(payload.user.email).toBe('user@example.com')
    expect(supabaseRef.auth.setSession).toHaveBeenCalled()
    expect(supabaseRef.auth.getUser).toHaveBeenCalled()
  })

  it('returns session status on GET', async () => {
    const supabaseRef = {
      auth: {
        getSession: jest.fn(async () => ({
          data: { session: { user: { id: 'user-1', email: 'user@example.com' } }, error: null },
        })),
        getUser: jest.fn(async () => ({
          data: { user: { id: 'user-1', email: 'user@example.com' } },
          error: null,
        })),
      },
    }

    createClientMock.mockReturnValue(supabaseRef)

    const response = await GET()
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.hasSession).toBe(true)
    expect(payload.hasUser).toBe(true)
    expect(payload.userEmail).toBe('user@example.com')
  })
})
