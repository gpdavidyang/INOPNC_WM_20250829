import {
  getSiteWorkers,
  forceAssignCurrentUserToTestSite,
} from '@/app/actions/mobile/site-info'

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
  email: 'worker@example.com',
  uiTrack: '/mobile',
  isRestricted: true,
  restrictedOrgId: 'org-1',
  role: 'partner',
}

describe('mobile site-info actions - organization guards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    assertOrgAccess.mockResolvedValue(undefined)
    requireServerActionAuth.mockResolvedValue(restrictedAuth)
  })

  it('enforces organization access for restricted users in getSiteWorkers', async () => {
    const siteSingle = jest.fn().mockResolvedValue({
      data: { organization_id: 'org-1' },
      error: null,
    })
    const siteSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({ single: siteSingle }),
    })

    const assignmentsBuilder: any = {}
    assignmentsBuilder.select = jest.fn().mockReturnValue(assignmentsBuilder)
    assignmentsBuilder.eq = jest.fn().mockReturnValue(assignmentsBuilder)
    assignmentsBuilder.order = jest.fn().mockResolvedValue({ data: [], error: null })

    const supabaseMock = {
      from: jest.fn((table: string) => {
        if (table === 'sites') {
          return { select: siteSelect }
        }
        if (table === 'site_assignments') {
          return assignmentsBuilder
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    }

    createClient.mockReturnValue(supabaseMock)

    await getSiteWorkers('site-99')

    expect(assertOrgAccess).toHaveBeenCalledWith(restrictedAuth, 'org-1')
    expect(assignmentsBuilder.order).toHaveBeenCalled()
  })

  it('validates organization access before force assigning test site', async () => {
    const updateFinal = jest.fn().mockResolvedValue({ data: null, error: null })
    const updateFirst = jest.fn().mockReturnValue({ eq: updateFinal })
    const update = jest.fn().mockReturnValue({ eq: updateFirst })

    const insertSingle = jest.fn().mockResolvedValue({
      data: { id: 'assignment-1' },
      error: null,
    })
    const insertSelect = jest.fn().mockReturnValue({ single: insertSingle })
    const insert = jest.fn().mockReturnValue({ select: insertSelect })

    const assignmentsBuilder: any = {
      update,
      insert,
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: null, error: null }) }),
      }),
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }

    const sitesSingle = jest.fn().mockResolvedValue({
      data: { id: 'site-test', organization_id: 'org-1' },
      error: null,
    })
    const sitesSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({ single: sitesSingle }),
    })

    const supabaseMock = {
      from: jest.fn((table: string) => {
        if (table === 'site_assignments') {
          return assignmentsBuilder
        }
        if (table === 'sites') {
          return { select: sitesSelect }
        }
        throw new Error(`Unexpected table: ${table}`)
      }),
    }

    createClient.mockReturnValue(supabaseMock)

    const result = await forceAssignCurrentUserToTestSite()

    expect(assertOrgAccess).toHaveBeenCalledWith(restrictedAuth, 'org-1')
    expect(result.success).toBe(true)
    expect(insert).toHaveBeenCalled()
  })
})
