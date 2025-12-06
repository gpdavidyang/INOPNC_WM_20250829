'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

type AuthEventOptions = {
  userEmail?: string | null
  success?: boolean
  details?: Record<string, unknown>
}

export async function logAuthEvent(
  action: string,
  { userEmail = null, success = true, details }: AuthEventOptions = {}
) {
  try {
    const client = createServiceRoleClient()
    await client.rpc('log_auth_event', {
      p_action: action,
      p_user_email: userEmail,
      p_success: success,
      p_details: details ? JSON.stringify(details) : undefined,
    })
  } catch (error) {
    console.error('[AUTH AUDIT] Failed to log auth event:', action, error)
  }
}
