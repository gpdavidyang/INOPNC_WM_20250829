export interface SupabaseEnv {
  supabaseUrl: string
  supabaseAnonKey: string
}

export function getSupabaseEnv(): SupabaseEnv {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!supabaseUrl || !supabaseAnonKey) {
    const missing = []
    if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL')
    if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')

    throw new Error(`Missing required Supabase environment variables: ${missing.join(', ')}`)
  }

  try {
    new URL(supabaseUrl)
  } catch {
    throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL format')
  }

  if (supabaseAnonKey.length < 20) {
    throw new Error(`NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (length ${supabaseAnonKey.length})`)
  }

  return { supabaseUrl, supabaseAnonKey }
}
