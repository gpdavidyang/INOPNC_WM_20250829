import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export async function getCurrentSession(
  client: SupabaseClient<Database>
) {
  const {
    data: { session },
    error,
  } = await client.auth.getSession()

  if (error) {
    throw error
  }

  return session ?? null
}

export async function getSessionUser(
  client: SupabaseClient<Database>
) {
  const session = await getCurrentSession(client)
  return session?.user ?? null
}

export async function getSessionUserId(
  client: SupabaseClient<Database>
) {
  const user = await getSessionUser(client)
  return user?.id ?? null
}
