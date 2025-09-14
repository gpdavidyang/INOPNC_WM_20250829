/**
 * Auth Hooks Export
 *
 * Central export point for all authentication hooks.
 */

export { usePermissions, PERMISSIONS } from './use-permissions'
export { useSession } from './use-session'

// Re-export useAuth from context for convenience
export { useAuth } from '../context/auth-context'
