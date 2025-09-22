import { performance } from 'node:perf_hooks'

const createClientMock = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: (...args: any[]) => createClientMock(...args),
}))

jest.mock('next/server', () => {
  class MockNextResponse {
    readonly status: number
    constructor(_body: any, init?: { status?: number }) {
      this.status = init?.status ?? 200
    }

    static json(body: any, init?: { status?: number }) {
      return new MockNextResponse(body, init)
    }

    static redirect(_url: string | URL, init?: { status?: number }) {
      return new MockNextResponse(null, { status: init?.status ?? 307 })
    }
  }

  return { NextResponse: MockNextResponse }
})

import { getAuth } from '@/lib/auth/ultra-simple'

interface ProfileStub {
  role?: string | null
  organization_id?: string | null
}

function buildSupabaseClient(profile: ProfileStub | null) {
  return {
    auth: {
      getUser: jest.fn(async () => ({
        data: {
          user: {
            id: 'user-1',
            email: 'user@example.com',
          },
        },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(async () => ({
            data: profile,
          })),
        })),
      })),
    })),
  }
}

describe('Ultra Simple Auth performance and compatibility', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns auth payload within performance budget', async () => {
    createClientMock.mockReturnValue(buildSupabaseClient({ role: 'admin', organization_id: 'org-1' }))

    const start = performance.now()
    const auth = await getAuth()
    const duration = performance.now() - start

    expect(auth?.uiTrack).toBe('/dashboard/admin')
    expect(auth?.isRestricted).toBe(false)
    expect(duration).toBeLessThan(25)
  })

  it('marks partner roles as restricted and preserves org id', async () => {
    const restrictedProfile = { role: 'customer_manager', organization_id: 'partner-42' }
    createClientMock.mockReturnValue(buildSupabaseClient(restrictedProfile))

    const auth = await getAuth()

    expect(auth?.isRestricted).toBe(true)
    expect(auth?.restrictedOrgId).toBe('partner-42')
    expect(auth?.uiTrack).toBe('/partner/dashboard')
  })

  it('falls back to mobile track when profile metadata missing', async () => {
    createClientMock.mockReturnValue(buildSupabaseClient(null))

    const auth = await getAuth()

    expect(auth?.uiTrack).toBe('/mobile')
    expect(auth?.isRestricted).toBe(false)
  })
})
