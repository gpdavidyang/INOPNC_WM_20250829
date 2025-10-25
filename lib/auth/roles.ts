/**
 * Role normalization helper
 * - Treats legacy/alias roles as their canonical equivalents
 */
export function normalizeUserRole(role?: string | null): string {
  const r = String(role || '').trim()
  if (!r) return ''
  // partner is an alias of customer_manager (소속사)
  if (r === 'partner') return 'customer_manager'
  return r
}
