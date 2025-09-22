import { getMonthlyAttendance, getAttendanceSummary } from '@/app/actions/mobile/attendance'

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

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
const { requireServerActionAuth } = jest.requireMock('@/lib/auth/ultra-simple') as {
  requireServerActionAuth: jest.Mock
}

interface MockAuth {
  userId: string
  email: string
  uiTrack: string
  isRestricted: boolean
  restrictedOrgId?: string
  role?: string
}

function createAuth(overrides: Partial<MockAuth> = {}): MockAuth {
  return {
    userId: 'user-123',
    email: 'worker@example.com',
    uiTrack: '/mobile',
    isRestricted: false,
    ...overrides,
  }
}

function setupSupabaseQuery(returnValue = { data: [], error: null }) {
  const queryBuilder: any = {}
  queryBuilder.select = jest.fn().mockReturnValue(queryBuilder)
  queryBuilder.or = jest.fn().mockReturnValue(queryBuilder)
  queryBuilder.gte = jest.fn().mockReturnValue(queryBuilder)
  queryBuilder.lte = jest.fn().mockReturnValue(queryBuilder)
  queryBuilder.order = jest.fn().mockReturnValue(queryBuilder)
  queryBuilder.eq = jest.fn().mockReturnValue(queryBuilder)
  queryBuilder.then = jest.fn((resolve: (value: any) => any) => resolve(returnValue))

  const mockSupabase = {
    from: jest.fn(() => queryBuilder),
  }

  createClient.mockReturnValue(mockSupabase)

  return { queryBuilder, eqMock: queryBuilder.eq, fromMock: mockSupabase.from }
}

describe('mobile attendance actions - organization guards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('enforces organization filter for restricted users in getMonthlyAttendance', async () => {
    const { eqMock } = setupSupabaseQuery()
    requireServerActionAuth.mockResolvedValue(
      createAuth({ isRestricted: true, restrictedOrgId: 'org-1' })
    )

    await getMonthlyAttendance(2024, 5)

    expect(eqMock).toHaveBeenCalledWith('site.organization_id', 'org-1')
  })

  it('skips organization filter for unrestricted users in getMonthlyAttendance', async () => {
    const { eqMock } = setupSupabaseQuery()
    requireServerActionAuth.mockResolvedValue(createAuth({ isRestricted: false }))

    await getMonthlyAttendance(2024, 5)

    expect(eqMock).not.toHaveBeenCalled()
  })

  it('enforces organization filter for restricted users in getAttendanceSummary when no site filter is provided', async () => {
    const { eqMock } = setupSupabaseQuery()
    requireServerActionAuth.mockResolvedValue(
      createAuth({ isRestricted: true, restrictedOrgId: 'org-2' })
    )

    await getAttendanceSummary({ start_date: '2024-01-01', end_date: '2024-01-31' })

    expect(eqMock).toHaveBeenCalledWith('site.organization_id', 'org-2')
  })
})
