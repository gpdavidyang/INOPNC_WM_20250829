import { getDailyReports, getDailyReportById } from '@/app/actions/admin/daily-reports'

type SupabaseMock = {
  from: jest.Mock
}

const supabaseRef: { current: SupabaseMock | null } = { current: null }

const restrictedAuth = {
  userId: 'user-123',
  email: 'admin@example.com',
  uiTrack: '/dashboard/admin',
  isRestricted: true,
  restrictedOrgId: 'org-1',
  role: 'admin',
}

jest.mock('@/app/actions/admin/common', () => ({
  withAdminAuth: jest.fn(async (callback: any) => {
    if (!supabaseRef.current) {
      throw new Error('Supabase mock not initialised')
    }

    const profile = {
      id: 'admin-1',
      role: 'admin',
      auth: restrictedAuth,
    }

    try {
      return await callback(supabaseRef.current, profile)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }),
}))

const assertOrgAccess = jest.fn(() => Promise.resolve())

jest.mock('@/lib/auth/ultra-simple', () => ({
  assertOrgAccess: (...args: any[]) => assertOrgAccess(...args),
}))

describe('admin daily-reports guards', () => {
  beforeEach(() => {
    supabaseRef.current = null
    jest.clearAllMocks()
    assertOrgAccess.mockImplementation(() => Promise.resolve())
  })

  it('applies organization and creator filters for restricted admins when listing reports', async () => {
    const queryBuilder: any = {}
    const eqMock = jest.fn().mockImplementation(() => queryBuilder)

    Object.assign(queryBuilder, {
      select: jest.fn().mockReturnValue(queryBuilder),
      order: jest.fn().mockReturnValue(queryBuilder),
      eq: eqMock,
      gte: jest.fn().mockReturnValue(queryBuilder),
      lte: jest.fn().mockReturnValue(queryBuilder),
      ilike: jest.fn().mockReturnValue(queryBuilder),
      or: jest.fn().mockReturnValue(queryBuilder),
      limit: jest.fn().mockReturnValue(queryBuilder),
      range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
    })

    const siteSingle = jest.fn().mockResolvedValue({ data: { organization_id: 'org-1' }, error: null })
    const siteEq = jest.fn().mockReturnValue({ single: siteSingle })
    const siteSelect = jest.fn().mockReturnValue({ eq: siteEq })

    const supabaseMock: SupabaseMock = {
      from: jest.fn((table: string) => {
        if (table === 'sites') {
          return { select: siteSelect }
        }
        if (table === 'daily_reports') {
          return queryBuilder
        }
        throw new Error(`Unexpected table ${table}`)
      }),
    }

    supabaseRef.current = supabaseMock

    await getDailyReports()

    const eqCalls = eqMock.mock.calls.map(([column, value]) => ({ column, value }))

    expect(eqCalls).toEqual(
      expect.arrayContaining([
        { column: 'sites.organization_id', value: 'org-1' },
        { column: 'created_by', value: 'user-123' },
      ])
    )
    expect(assertOrgAccess).not.toHaveBeenCalled()
  })

  it('blocks access to reports from other users during detail fetch', async () => {
    const single = jest.fn().mockResolvedValue({
      data: {
        id: 'report-1',
        site_id: 'site-9',
        created_by: 'another-user',
        site: { organization_id: 'org-1' },
      },
      error: null,
    })

    const builder: any = {}
    Object.assign(builder, {
      select: jest.fn().mockReturnValue(builder),
      eq: jest.fn().mockReturnValue(builder),
      single,
    })

    const supabaseMock: SupabaseMock = {
      from: jest.fn(() => builder),
    }

    supabaseRef.current = supabaseMock

    const result = await getDailyReportById('report-1')

    expect(result.success).toBe(false)
    expect(result.error).toBe('작업일지에 접근할 권한이 없습니다.')
    expect(assertOrgAccess).toHaveBeenCalledWith(restrictedAuth, 'org-1')
    expect(builder.select).toHaveBeenCalled()
  })
})
