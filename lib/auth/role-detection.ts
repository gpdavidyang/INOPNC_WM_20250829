import { UserRole } from '@/types'

/**
 * Get user role from cookie (server-side)
 * Note: This function must only be called from server components or server actions
 */
export async function getUserRoleFromCookie(): Promise<string | undefined> {
  if (typeof window !== 'undefined') {
    throw new Error('getUserRoleFromCookie can only be called from server-side code')
  }
  
  const { cookies } = await import('next/headers')
  const cookieStore = cookies()
  return cookieStore.get('user-role')?.value
}

/**
 * Get UI class for role
 */
export function getUIClassForRole(role: string | undefined): string {
  if (!role) return ''
  
  const mobileRoles: UserRole[] = ['worker', 'site_manager', 'customer_manager']
  const desktopRoles: UserRole[] = ['admin', 'system_admin']
  
  if (mobileRoles.includes(role as UserRole)) return 'force-mobile-ui'
  if (desktopRoles.includes(role as UserRole)) return 'force-desktop-ui'
  
  return ''
}

/**
 * Check if role should use mobile UI
 */
export function isRoleMobileUI(role: string | undefined): boolean {
  if (!role) return false
  const mobileRoles: UserRole[] = ['worker', 'site_manager', 'customer_manager']
  return mobileRoles.includes(role as UserRole)
}

/**
 * Check if role should use desktop UI
 */
export function isRoleDesktopUI(role: string | undefined): boolean {
  if (!role) return false
  const desktopRoles: UserRole[] = ['admin', 'system_admin']
  return desktopRoles.includes(role as UserRole)
}

/**
 * Get user role from cookie (client-side)
 */
export function getClientUserRole(): string | undefined {
  if (typeof document === 'undefined') return undefined
  
  const match = document.cookie.match(/user-role=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : undefined
}

/**
 * Set user role cookie (client-side)
 * Note: This is for client-side updates only. 
 * Server-side should use cookies() from next/headers
 */
export function setClientUserRole(role: string): void {
  if (typeof document === 'undefined') return
  
  const maxAge = 60 * 60 * 24 * 7 // 7 days
  document.cookie = `user-role=${encodeURIComponent(role)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

/**
 * Remove user role cookie (client-side)
 */
export function removeClientUserRole(): void {
  if (typeof document === 'undefined') return
  
  document.cookie = 'user-role=; path=/; max-age=0; SameSite=Lax'
}