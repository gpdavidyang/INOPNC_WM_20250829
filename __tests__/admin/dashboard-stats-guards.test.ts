import { getDashboardStats } from '@/app/actions/admin/dashboard-stats'

const restrictedAuth = {
  userId: 'admin-1',
  email: 'admin@example.com',
  uiTrack: '/dashboard/admin',
  isRestricted: true,
  restrictedOrgId: 'org-1',
  role: 'admin',
}

const supabaseRef: { current: any } = { current: null }

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
  AdminErrors: {
    DATABASE_ERROR: 'DATABASE_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  },
  requireRestrictedOrgId: (auth: typeof restrictedAuth) => {
    if (!auth.restrictedOrgId) {
      throw new Error('restricted org id missing')
    }
    return auth.restrictedOrgId
  },
  resolveAdminError: (error: unknown) =>
    error instanceof Error ? error.message : 'UNKNOWN_ERROR',
}))

const assertOrgAccess = jest.fn()

jest.mock('@/lib/auth/ultra-simple', () => ({
  requireServerActionAuth: jest.fn(),
  assertOrgAccess: (...args: any[]) => assertOrgAccess(...args),
}))

function createQuery(result: any) {
  const builder: any = {
    calls: {
      select: [] as unknown[][],
      eq: [] as unknown[][],
      gte: [] as unknown[][],
      in: [] as unknown[][],
      order: [] as unknown[][],
      limit: [] as unknown[][],
    },
    select: jest.fn(function (...args: unknown[]) {
      builder.calls.select.push(args)
      return builder
    }),
    eq: jest.fn(function (...args: unknown[]) {
      builder.calls.eq.push(args)
      return builder
    }),
    gte: jest.fn(function (...args: unknown[]) {
      builder.calls.gte.push(args)
      return builder
    }),
    in: jest.fn(function (...args: unknown[]) {
      builder.calls.in.push(args)
      return builder
    }),
    order: jest.fn(function (...args: unknown[]) {
      builder.calls.order.push(args)
      return builder
    }),
    limit: jest.fn(function (...args: unknown[]) {
      builder.calls.limit.push(args)
      return builder
    }),
    then(onFulfilled: any, onRejected?: any) {
      return Promise.resolve(result).then(onFulfilled, onRejected)
    },
  }

  return builder
}

describe('admin dashboard stats guards', () => {
  beforeEach(() => {
    supabaseRef.current = null
    jest.clearAllMocks()
  })

  it('scopes dashboard stats to the restricted organization', async () => {
    const sitesQuery = createQuery({
      data: [
        { id: 'site-1', is_active: true },
        { id: 'site-2', is_active: false },
      ],
      error: null,
    })

    const profilesCountQuery = createQuery({ count: 4, error: null })
    const profilesRecentQuery = createQuery({
      data: [
        {
          id: 'user-1',
          full_name: 'User One',
          role: 'worker',
          created_at: '2025-09-01T00:00:00Z',
          organization_id: 'org-1',
        },
      ],
      error: null,
    })
    const dailyReportsCountQuery = createQuery({ count: 1, error: null })
    const recentReportsQuery = createQuery({
      data: [
        {
          id: 'report-1',
          created_at: '2025-09-01T02:00:00Z',
          status: 'approved',
          site_id: 'site-1',
          profiles: { full_name: 'User One' },
          site: { name: 'Site One', organization_id: 'org-1' },
        },
      ],
      error: null,
    })
    const photoGridsQuery = createQuery({
      data: [
        {
          id: 'photo-1',
          created_at: '2025-09-01T01:00:00Z',
          component_name: 'Column',
          site_id: 'site-1',
          profiles: { full_name: 'User One', organization_id: 'org-1' },
          site: { name: 'Site One', organization_id: 'org-1' },
        },
      ],
      error: null,
    })

    let profilesCall = 0
    let dailyReportsCall = 0

    supabaseRef.current = {
      from: jest.fn((table: string) => {
        switch (table) {
          case 'sites':
            return sitesQuery
          case 'profiles':
            return profilesCall++ === 0 ? profilesCountQuery : profilesRecentQuery
          case 'daily_reports':
            return dailyReportsCall++ === 0 ? dailyReportsCountQuery : recentReportsQuery
          case 'photo_grids':
            return photoGridsQuery
          default:
            throw new Error(`Unexpected table ${table}`)
        }
      }),
    }

    const result = await getDashboardStats()

    expect(result.success).toBe(true)
    expect(result.data?.totalUsers).toBe(4)
    expect(result.data?.activeSites).toBe(1)
    expect(result.data?.todayReports).toBe(1)
    expect(result.data?.recentActivities).toHaveLength(3)

    expect(sitesQuery.eq).toHaveBeenCalledWith('organization_id', 'org-1')
    expect(profilesCountQuery.eq).toHaveBeenCalledWith('organization_id', 'org-1')
    expect(dailyReportsCountQuery.in).toHaveBeenCalledWith('site_id', ['site-1', 'site-2'])
    expect(recentReportsQuery.in).toHaveBeenCalledWith('site_id', ['site-1', 'site-2'])
    expect(profilesRecentQuery.eq).toHaveBeenCalledWith('organization_id', 'org-1')
  })

  it('returns zero counts when restricted admin has no accessible sites', async () => {
    const emptySitesQuery = createQuery({ data: [], error: null })
    const profilesCountQuery = createQuery({ count: 0, error: null })

    supabaseRef.current = {
      from: jest.fn((table: string) => {
        switch (table) {
          case 'sites':
            return emptySitesQuery
          case 'profiles':
            return profilesCountQuery
          case 'photo_grids':
            return createQuery({ data: [], error: null })
          case 'daily_reports':
            return createQuery({ count: 0, error: null })
          default:
            throw new Error(`Unexpected table ${table}`)
        }
      }),
    }

    const result = await getDashboardStats()

    expect(result.success).toBe(true)
    expect(result.data?.totalUsers).toBe(0)
    expect(result.data?.activeSites).toBe(0)
    expect(result.data?.todayReports).toBe(0)
    expect(result.data?.recentActivities).toHaveLength(0)

    const tablesQueried = supabaseRef.current.from.mock.calls.map((call: any[]) => call[0])
    expect(tablesQueried.filter((name: string) => name === 'daily_reports').length).toBe(0)
  })
})
