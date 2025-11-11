import type { UserRole } from '@/types'

export type DemoAccountRole =
  | Extract<UserRole, 'worker' | 'site_manager' | 'customer_manager' | 'admin'>
  | 'system_admin'

export interface DemoAccountConfig {
  email: string
  password: string
  full_name: string
  role: DemoAccountRole
  organization_id?: string | null
  partner_company_id?: string | null
  site_id?: string | null
}

const RAW_DEMO_ACCOUNTS: DemoAccountConfig[] = [
  {
    email: 'manager@inopnc.com',
    password: 'password123',
    full_name: '현장 매니저',
    role: 'site_manager',
    site_id: '33333333-3333-3333-3333-333333333333',
  },
  {
    email: 'worker@inopnc.com',
    password: 'password123',
    full_name: '현장 작업자',
    role: 'worker',
    site_id: '33333333-3333-3333-3333-333333333333',
  },
  {
    email: 'admin@inopnc.com',
    password: 'password123',
    full_name: '본사 관리자',
    role: 'admin',
    organization_id: '11111111-1111-1111-1111-111111111111',
  },
  {
    email: 'customer@inopnc.com',
    password: 'password123',
    full_name: '고객사 관리자',
    role: 'customer_manager',
  },
  {
    email: 'system@inopnc.com',
    password: 'password123',
    full_name: '시스템 관리자',
    role: 'system_admin',
  },
]

const DEMO_ACCOUNTS_MAP = RAW_DEMO_ACCOUNTS.reduce<Record<string, DemoAccountConfig>>(
  (acc, account) => {
    acc[account.email.toLowerCase()] = account
    return acc
  },
  {}
)

export function getDemoAccountConfig(email?: string | null): DemoAccountConfig | null {
  if (!email) return null
  return DEMO_ACCOUNTS_MAP[email.trim().toLowerCase()] || null
}

export function isDemoAccountEmail(email?: string | null): boolean {
  return !!getDemoAccountConfig(email)
}

export function getDemoAccountPassword(email?: string | null): string | null {
  const config = getDemoAccountConfig(email)
  return config?.password || null
}

export { RAW_DEMO_ACCOUNTS as DEMO_ACCOUNTS }
