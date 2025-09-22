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

import { GET } from '@/app/api/debug-session/route'

const cookiesMock = jest.fn()
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => cookiesMock()),
}))

const createClientMock = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: (...args: any[]) => createClientMock(...args),
}))

describe('debug session API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    cookiesMock.mockReset()
    createClientMock.mockReset()
  })

  it('returns anonymous session diagnostics', async () => {
    cookiesMock.mockReturnValue({
      getAll: () => [],
    })

    const supabaseRef = {
      auth: {
        getSession: jest.fn(async () => ({ data: { session: null }, error: null })),
        getUser: jest.fn(async () => ({ data: { user: null }, error: null })),
      },
    }

    createClientMock.mockReturnValue(supabaseRef)

    const response = await GET({} as any)

    expect(response instanceof NextResponse).toBe(true)
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.cookies.total).toBe(0)
    expect(payload.session.exists).toBe(false)
    expect(payload.user.exists).toBe(false)
    expect(payload.siteAssignment).toBeNull()
  })

  it('returns session, user, and site assignment details', async () => {
    cookiesMock.mockReturnValue({
      getAll: () => [
        { name: 'sb-access-token', value: '123' },
        { name: 'sb-refresh-token', value: '456' },
      ],
    })

    const supabaseRef = {
      auth: {
        getSession: jest.fn(async () => ({
          data: {
            session: {
              user: { id: 'user-1', email: 'user@example.com' },
              access_token: 'token',
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
            eq: jest.fn(() => ({
              maybeSingle: jest.fn(async () => ({
                data: {
                  role: 'manager',
                  assigned_date: '2024-09-20',
                  sites: { name: 'Test Site' },
                },
                error: null,
              })),
            })),
          })),
        })),
      })),
    }

    createClientMock.mockReturnValue(supabaseRef)

    const response = await GET({} as any)

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.cookies.total).toBe(2)
    expect(payload.session.exists).toBe(true)
    expect(payload.user.exists).toBe(true)
    expect(payload.user.email).toBe('user@example.com')
    expect(payload.siteAssignment).toEqual({
      siteName: 'Test Site',
      role: 'manager',
      assignedDate: '2024-09-20',
    })
  })
})
