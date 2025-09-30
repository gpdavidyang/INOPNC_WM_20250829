import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Create a Supabase client with service role key for admin operations
export function createServiceClient() {
  // Support multiple env var names to avoid configuration drift
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''

  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    ''

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service configuration')
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
