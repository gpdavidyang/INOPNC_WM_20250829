const getAuthForClientMock = jest.fn()
const createEdgeSupabaseClientMock = jest.fn()

const nextServerModule: { NextResponse?: any } = {}

class MockCookies {
  private store = new Map<string, { value: string; options: Record<string, unknown>; deleted?: boolean }>()

  set(nameOrCookie: any, value?: string, options?: Record<string, unknown>) {
    if (typeof nameOrCookie === 'string') {
      this.store.set(nameOrCookie, {
        value: value ?? '',
        options: options ?? {},
      })
      return
    }

    const { name, value: cookieValue, ...rest } = nameOrCookie
    this.store.set(name, {
      value: cookieValue ?? '',
      options: rest,
    })
  }

  delete(name: string) {
    this.store.set(name, {
      value: '',
      options: { deleted: true },
      deleted: true,
    })
  }

  get(name: string) {
    return this.store.get(name)
  }

  getAll() {
    return Array.from(this.store.entries()).map(([name, meta]) => ({ name, ...meta }))
  }
}

class MockNextResponse {
  readonly headers = new Headers()
  readonly cookies = new MockCookies()
  readonly status: number
  readonly body: any
  redirected = false
  redirectURL?: string
  type: 'next' | 'redirect' | 'json' | 'constructor'

  constructor(body: any = null, init?: { status?: number }) {
    this.body = body
    this.status = init?.status ?? 200
    this.type = 'constructor'
  }

  static next(_init?: any) {
    const res = new MockNextResponse(null, { status: 200 })
    res.type = 'next'
    return res
  }

  static redirect(url: string | URL, init?: { status?: number }) {
    const res = new MockNextResponse(null, { status: init?.status ?? 307 })
    res.type = 'redirect'
    res.redirected = true
    res.redirectURL = url.toString()
    return res
  }

  static json(body: any, init?: { status?: number }) {
    const res = new MockNextResponse(body, { status: init?.status ?? 200 })
    res.type = 'json'
    return res
  }

  async json() {
    return this.body
  }
}

jest.mock('next/server', () => nextServerModule)

jest.mock('@/lib/auth/ultra-simple', () => ({
  getAuthForClient: (...args: any[]) => getAuthForClientMock(...args),
}))

jest.mock('@/lib/supabase/edge', () => ({
  createEdgeSupabaseClient: (...args: any[]) => createEdgeSupabaseClientMock(...args),
}))

nextServerModule.NextResponse = MockNextResponse

const { middleware } = require('@/middleware') as { middleware: (req: any) => Promise<any> }
const { UI_TRACK_COOKIE_NAME } = require('@/lib/auth/constants') as {
  UI_TRACK_COOKIE_NAME: string
}

function createRequest(pathname: string) {
  const headers = new Headers()
  return {
    method: 'GET',
    headers,
    ip: '127.0.0.1',
    url: `https://example.com${pathname}`,
    nextUrl: {
      pathname,
    },
    cookies: {
      get: jest.fn(() => undefined),
      getAll: jest.fn(() => []),
    },
  }
}

describe('middleware UI track cookie handling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createEdgeSupabaseClientMock.mockReturnValue({})
  })

  it('sets ui-track cookie for authenticated requests', async () => {
    getAuthForClientMock.mockResolvedValue({
      userId: 'user-1',
      email: 'user@example.com',
      uiTrack: '/dashboard/admin',
      isRestricted: false,
    })

    const request = createRequest('/dashboard')
    const response = await middleware(request as any)

    const uiTrackCookie = response.cookies.get(UI_TRACK_COOKIE_NAME)
    expect(uiTrackCookie?.value).toBe('/dashboard/admin')
    expect(uiTrackCookie?.options).toMatchObject({
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
    expect(uiTrackCookie?.options?.secure).toBe(false)
    expect(response.status).toBe(200)
  })

  it('removes ui-track cookie when redirecting unauthenticated users', async () => {
    getAuthForClientMock.mockResolvedValue(null)

    const request = createRequest('/mobile')
    const response = await middleware(request as any)

    expect(response.redirected).toBe(true)
    expect(response.redirectURL).toContain('/auth/login')

    const deletedCookie = response.cookies.get(UI_TRACK_COOKIE_NAME)
    expect(deletedCookie?.deleted).toBe(true)
  })
})
