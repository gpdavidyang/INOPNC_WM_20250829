import { createServerClient } from '@supabase/ssr'
import type { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { getSupabaseEnv } from '@/lib/supabase/env'

export function createEdgeSupabaseClient(
  request: NextRequest,
  response: NextResponse
): SupabaseClient<Database> {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv()

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => {
          response.cookies.set({
            name,
            value,
            ...options,
            sameSite: (options?.sameSite as 'lax' | 'strict' | 'none') ?? 'lax',
            secure: options?.secure ?? process.env.NODE_ENV === 'production',
            httpOnly: options?.httpOnly ?? true,
            path: options?.path ?? '/',
          })
        })
      },
    },
  })
}
