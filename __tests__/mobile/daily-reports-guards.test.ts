import { getDailyReports, getDailyReportById } from '@/app/actions/mobile/daily-reports'

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

jest.mock('@/lib/auth/ultra-simple', () => ({
  requireServerActionAuth: jest.fn(),
  assertOrgAccess: jest.fn(),
}))

const { createClient } = jest.requireMock('@/lib/supabase/server') as {
  createClient: jest.Mock
}
const { requireServerActionAuth, assertOrgAccess } = jest.requireMock(
  '@/lib/auth/ultra-simple'
) as {
  requireServerActionAuth: jest.Mock
  assertOrgAccess: jest.Mock
}

const restrictedAuth = {
  userId: 'user-123',
  email: 'user@example.com',
  uiTrack: '/mobile',
  isRestricted: true,
  restrictedOrgId: 'org-1',
  role: 'partner',
}

describe('mobile daily-reports actions - organization guards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    requireServerActionAuth.mockResolvedValue(restrictedAuth)
    assertOrgAccess.mockResolvedValue(undefined)
  })

  it('applies organization and creator filters for restricted users in getDailyReports', async () => {
    const queryBuilder: any = {}
    const eqMock = jest.fn().mockImplementation(() => queryBuilder)
    Object.assign(queryBuilder, {
      select: jest.fn().mockImplementation(() => queryBuilder),
      order: jest.fn().mockImplementation(() => queryBuilder),
      eq: eqMock,
      gte: jest.fn().mockImplementation(() => queryBuilder),
      lte: jest.fn().mockImplementation(() => queryBuilder),
      limit: jest.fn().mockImplementation(() => queryBuilder),
      range: jest.fn().mockImplementation(() => queryBuilder),
      then: jest.fn((resolve: (value: any) => unknown) =>
        resolve({ data: [], error: null, count: 0 })
      ),
    })

    const supabaseMock = {
      from: jest.fn(() => queryBuilder),
    }

    createClient.mockReturnValue(supabaseMock)

    await getDailyReports({})

    const eqCalls = eqMock.mock.calls.map(([column, value]) => ({ column, value }))

    expect(eqCalls).toEqual(
      expect.arrayContaining([
        { column: 'site.organization_id', value: 'org-1' },
        { column: 'created_by', value: 'user-123' },
      ])
    )
  })

  it('blocks access to other users reports in getDailyReportById for restricted users', async () => {
    const dailyReportsBuilder: any = {}
    Object.assign(dailyReportsBuilder, {
      select: jest.fn().mockReturnValue(dailyReportsBuilder),
      eq: jest.fn().mockReturnValue(dailyReportsBuilder),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'report-1',
          site_id: 'site-1',
          created_by: 'other-user',
          site: { organization_id: 'org-1' },
        },
        error: null,
      }),
    })

    const supabaseMock = {
      from: jest.fn(() => dailyReportsBuilder),
    }

    createClient.mockReturnValue(supabaseMock)

    const result = await getDailyReportById('report-1')

    expect(result.success).toBe(false)
    expect(result.error).toBe('해당 작업일지를 조회할 권한이 없습니다.')
    expect(dailyReportsBuilder.single).toHaveBeenCalledTimes(1)
  })
})
