import { getSalaryRecords, approveSalaryRecords } from '@/app/actions/admin/salary'
import { AppError, ErrorType } from '@/lib/error-handling'

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
  AdminErrors: {
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
  },
  validateRequired: jest.fn(() => null),
}))

const assertOrgAccess = jest.fn(async (_auth: typeof restrictedAuth, organizationId?: string) => {
  if (organizationId && organizationId !== _auth.restrictedOrgId) {
    throw new AppError('권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
  }
})

jest.mock('@/lib/auth/ultra-simple', () => ({
  assertOrgAccess: (...args: any[]) => assertOrgAccess(...args),
}))

describe('admin salary guards', () => {
  beforeEach(() => {
    supabaseRef.current = null
    jest.clearAllMocks()
  })

  it('filters salary records to accessible sites for restricted admins', async () => {
    const accessibleSitesSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: [{ id: 'site-1' }], error: null }),
    })

    const orgLookupIn = jest.fn((column: string, values: string[]) =>
      Promise.resolve({
        data: values.map(id => ({ id, organization_id: id === 'site-1' ? 'org-1' : 'org-2' })),
        error: null,
      })
    )

    const orgLookupSelect = jest.fn().mockReturnValue({ in: orgLookupIn })

    const siteNamesSelect = jest.fn().mockReturnValue({
      in: jest.fn().mockResolvedValue({
        data: [{ id: 'site-1', name: 'Site One' }],
        error: null,
      }),
    })

    const profilesSelect = jest.fn().mockResolvedValue({
      data: [
        { id: 'worker-1', full_name: 'Worker A', email: 'a@example.com', role: 'worker' },
        { id: 'worker-2', full_name: 'Worker B', email: 'b@example.com', role: 'worker' },
      ],
      error: null,
    })

    const dailyReportsBuilder: any = {
      selectedSites: null as string[] | null,
      select: jest.fn(() => dailyReportsBuilder),
      order: jest.fn(() => dailyReportsBuilder),
      eq: jest.fn(() => dailyReportsBuilder),
      gte: jest.fn(() => dailyReportsBuilder),
      lte: jest.fn(() => dailyReportsBuilder),
      in: jest.fn().mockImplementation(function (column: string, values: string[]) {
        if (column === 'site_id') {
          dailyReportsBuilder.selectedSites = values
        }
        return dailyReportsBuilder
      }),
      then: jest.fn((resolve: (value: any) => any) => {
        const data = [
          {
            id: 'report-1',
            site_id: 'site-1',
            work_date: '2025-09-01',
            daily_report_workers: [{ worker_name: 'Worker A', work_hours: '8' }],
          },
          {
            id: 'report-2',
            site_id: 'site-2',
            work_date: '2025-09-01',
            daily_report_workers: [{ worker_name: 'Worker B', work_hours: '8' }],
          },
        ]

        const filtered = dailyReportsBuilder.selectedSites
          ? data.filter(report => dailyReportsBuilder.selectedSites?.includes(report.site_id))
          : data

        return resolve({ data: filtered, error: null })
      }),
    }

    let sitesCall = 0
    supabaseRef.current = {
      from: jest.fn((table: string) => {
        if (table === 'sites') {
          const call = sitesCall++
          if (call === 0) {
            return { select: accessibleSitesSelect }
          }
          if (call === 1) {
            return { select: orgLookupSelect }
          }
          return { select: siteNamesSelect }
        }
        if (table === 'daily_reports') {
          return dailyReportsBuilder
        }
        if (table === 'profiles') {
          return { select: profilesSelect }
        }
        throw new Error(`Unexpected table ${table}`)
      }) as jest.Mock,
    }

    const result = await getSalaryRecords()

    expect(result.success).toBe(true)
    expect(result.data?.records).toHaveLength(1)
    expect(result.data?.records?.[0].site_id).toBe('site-1')
    expect(dailyReportsBuilder.in).toHaveBeenCalledWith('site_id', ['site-1'])
  })

  it('prevents approving salary records outside restricted organization', async () => {
    const salaryRecordsSelect = jest.fn().mockReturnValue({
      in: jest.fn().mockResolvedValue({
        data: [{ id: 'record-1', site_id: 'site-2', site: { organization_id: 'org-2' } }],
        error: null,
      }),
    })

    const updateMock = jest.fn(() => {
      throw new Error('update should not run when access denied')
    })

    let callCount = 0
    supabaseRef.current = {
      from: jest.fn((table: string) => {
        if (table === 'salary_records') {
          callCount += 1
          return callCount === 1
            ? { select: salaryRecordsSelect }
            : { update: updateMock }
        }
        if (table === 'sites') {
          return { select: jest.fn().mockReturnValue({ in: jest.fn().mockResolvedValue({ data: [], error: null }) }) }
        }
        throw new Error(`Unexpected table ${table}`)
      }) as jest.Mock,
    }

    const result = await approveSalaryRecords(['record-1'])

    expect(result.success).toBe(false)
    expect(result.error).toBe('급여 기록에 접근할 권한이 없습니다.')
    expect(assertOrgAccess).toHaveBeenCalledTimes(0)
  })
})
