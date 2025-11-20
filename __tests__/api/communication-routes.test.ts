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

import { GET as AdminOverview } from '@/app/api/admin/communication/overview/route'
import { GET as FieldLogs } from '@/app/api/communication/logs/route'
import { GET as AdminEngagement } from '@/app/api/admin/communication/engagement/route'

const createClientMock = jest.fn()
jest.mock('@/lib/supabase/server', () => ({
  createClient: (...args: any[]) => createClientMock(...args),
}))

const requireApiAuth = jest.fn()
jest.mock('@/lib/auth/ultra-simple', () => ({
  requireApiAuth: (...args: any[]) => requireApiAuth(...args),
}))

const adminAuth = {
  userId: 'admin-1',
  email: 'admin@test.com',
  uiTrack: '/dashboard/admin',
  isRestricted: false,
  role: 'admin',
}

describe('communication routes guard & behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createClientMock.mockReset()
  })

  it('rejects non-admin access for admin overview endpoint', async () => {
    requireApiAuth.mockResolvedValue({ ...adminAuth, role: 'site_manager' })

    const response = await AdminOverview({
      url: 'https://example.com/api/admin/communication/overview?mode=logs',
    } as any)

    expect(response instanceof NextResponse).toBe(true)
    expect(response.status).toBe(403)
  })

  it('applies target role filter when requesting logs mode', async () => {
    requireApiAuth.mockResolvedValue(adminAuth)
    const rangeMock = jest.fn(() =>
      Promise.resolve({
        data: [
          {
            log_id: 'log-1',
            log_notification_type: 'site_announcement',
            log_title: '테스트',
            log_body: '본문',
            log_status: 'delivered',
            log_sent_at: '2025-11-20T00:00:00Z',
            log_user_id: 'user-1',
            log_target_role: 'worker',
            log_target_site_id: null,
            log_target_partner_company_id: null,
            log_target_site_name: null,
            log_target_partner_company_name: null,
            announcement_id: 'ann-1',
            announcement_title: '공지',
            dispatch_id: 'dispatch-1',
            dispatch_batch_id: 'batch-1',
            log_is_starred: true,
            latest_engagement_type: 'admin_starred',
          },
        ],
        error: null,
        count: 1,
      })
    )
    const queryBuilder: any = {}
    queryBuilder.select = jest.fn(() => queryBuilder)
    queryBuilder.not = jest.fn(() => queryBuilder)
    queryBuilder.or = jest.fn(() => queryBuilder)
    queryBuilder.eq = jest.fn(() => queryBuilder)
    queryBuilder.in = jest.fn(() => queryBuilder)
    queryBuilder.order = jest.fn(() => ({ range: rangeMock }))

    createClientMock.mockReturnValue({
      from: jest.fn((table: string) => {
        if (table === 'communication_overview_v') {
          return queryBuilder
        }
        throw new Error(`Unexpected table ${table}`)
      }),
    })

    const response = await AdminOverview({
      url: 'https://example.com/api/admin/communication/overview?mode=logs&targetRole=worker',
    } as any)

    expect(response.status).toBe(200)
    expect(queryBuilder.eq).toHaveBeenCalledWith('log_target_role', 'worker')
    const payload = await response.json()
    expect(payload.logs).toHaveLength(1)
  })

  it('returns empty logs for field roles without assignments', async () => {
    const siteManagerAuth = {
      userId: 'manager-1',
      email: 'manager@test.com',
      uiTrack: '/mobile',
      isRestricted: false,
      role: 'site_manager',
    }
    requireApiAuth.mockResolvedValue(siteManagerAuth)

    const queryBuilder: any = {}
    const rangeMock = jest.fn(() => Promise.resolve({ data: [], error: null, count: 0 }))
    queryBuilder.select = jest.fn(() => queryBuilder)
    queryBuilder.not = jest.fn(() => queryBuilder)
    queryBuilder.or = jest.fn(() => queryBuilder)
    queryBuilder.eq = jest.fn(() => queryBuilder)
    queryBuilder.in = jest.fn(() => queryBuilder)
    queryBuilder.order = jest.fn(() => ({ range: rangeMock }))

    createClientMock.mockReturnValue({
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: { role: 'site_manager', partner_company_id: null, organization_id: null },
                    error: null,
                  }),
              }),
            }),
          }
        }
        if (table === 'site_assignments') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
          }
        }
        if (table === 'communication_overview_v') {
          return queryBuilder
        }
        throw new Error(`Unexpected table ${table}`)
      }),
    })

    const response = await FieldLogs({
      url: 'https://example.com/api/communication/logs',
    } as any)

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.logs).toHaveLength(0)
    expect(payload.total).toBe(0)
  })

  it('rejects non-admin engagement audit access', async () => {
    requireApiAuth.mockResolvedValue({ ...adminAuth, role: 'worker' })
    const response = await AdminEngagement({
      url: 'https://example.com/api/admin/communication/engagement',
    } as any)
    expect(response.status).toBe(403)
  })

  it('returns audit events with user and notification context', async () => {
    requireApiAuth.mockResolvedValue(adminAuth)

    const engagementRows = [
      {
        id: 'evt-1',
        notification_id: 'log-1',
        engagement_type: 'admin_starred',
        engaged_at: '2025-11-20T00:00:00Z',
        user_id: 'admin-1',
        metadata: { action: 'star' },
      },
    ]
    const logRows = [
      {
        id: 'log-1',
        title: '공지',
        notification_type: 'site_announcement',
        status: 'delivered',
        sent_at: '2025-11-19T00:00:00Z',
      },
    ]
    const profiles = [{ id: 'admin-1', full_name: 'Admin', email: 'admin@test.com' }]

    createClientMock.mockReturnValue({
      from: jest.fn((table: string) => {
        if (table === 'notification_engagement') {
          const builder: any = {}
          builder.select = () => builder
          builder.in = () => builder
          builder.order = () => builder
          builder.limit = () => Promise.resolve({ data: engagementRows, error: null })
          return builder
        }
        if (table === 'notification_logs') {
          return {
            select: () => ({
              in: () => Promise.resolve({ data: logRows, error: null }),
            }),
          }
        }
        if (table === 'profiles') {
          return {
            select: () => ({
              in: () => Promise.resolve({ data: profiles, error: null }),
            }),
          }
        }
        throw new Error(`Unexpected table ${table}`)
      }),
    })

    const response = await AdminEngagement({
      url: 'https://example.com/api/admin/communication/engagement?limit=5',
    } as any)

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.events).toHaveLength(1)
    expect(payload.events[0].user.email).toBe('admin@test.com')
    expect(payload.events[0].notification.title).toBe('공지')
  })
})
