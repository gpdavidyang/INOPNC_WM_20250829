import type { UserRole } from '@/types'

// Canonical labels (붙여쓰기)
const BASE_ROLE_LABELS: Record<UserRole, string> = {
  admin: '본사관리자',
  system_admin: '시스템관리자',
  site_manager: '현장관리자',
  customer_manager: '소속사',
  worker: '작업자',
}

// Extra roles used in some views
const EXTRA_ROLE_LABELS: Record<string, string> = {
  partner: '소속사',
  production_manager: '생산관리자',
}

// Korean synonyms to canonical keys
const KO_TO_KEY: Record<string, UserRole> = {
  관리자: 'admin',
  본사관리자: 'admin',
  시스템관리자: 'system_admin',
  '시스템 관리자': 'system_admin',
  현장관리자: 'site_manager',
  '현장 관리자': 'site_manager',
  고객관리자: 'customer_manager',
  '고객 관리자': 'customer_manager',
  소속사: 'customer_manager',
  작업자: 'worker',
}

export function getRoleLabel(role?: string | null): string {
  if (!role) return '-'
  const raw = String(role)
  const compact = raw.replace(/\s+/g, '')
  const key = (BASE_ROLE_LABELS as any)[compact] ? (compact as UserRole) : KO_TO_KEY[compact]
  if (key) return BASE_ROLE_LABELS[key]
  return BASE_ROLE_LABELS[compact as UserRole] || EXTRA_ROLE_LABELS[compact] || compact
}

export const ROLE_LABELS = BASE_ROLE_LABELS
