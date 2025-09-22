
let client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createSimpleClient() {
  if (client) {
    return client
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables')
  }

  client = createBrowserClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        // Enable auto refresh
        autoRefreshToken: true,
        persistSession: true,
        // Force session to persist across tabs and refreshes
        storage: {
          getItem: (key: string) => {
            if (typeof window === 'undefined') return null
            return window.localStorage.getItem(key)
          },
          setItem: (key: string, value: string) => {
            if (typeof window === 'undefined') return
            window.localStorage.setItem(key, value)
          },
          removeItem: (key: string) => {
            if (typeof window === 'undefined') return
            window.localStorage.removeItem(key)
          },
        },
      },
      // Configure cookies for better session management
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return undefined
          return document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
            ?.split('=')[1]
        },
        set(name: string, value: string, options: unknown) {
          if (typeof document === 'undefined') return
          const cookieOptions = [
            `${name}=${value}`,
            'path=/',
            options?.maxAge ? `max-age=${options.maxAge}` : 'max-age=31536000', // 1 year default
            options?.sameSite ? `SameSite=${options.sameSite}` : 'SameSite=lax',
            // Remove HttpOnly for client-side access
            options?.secure || (typeof window !== 'undefined' && window.location.protocol === 'https:') ? 'Secure' : ''
          ].filter(Boolean).join('; ')
          
          document.cookie = cookieOptions
          console.log('🍪 Setting cookie:', name, '=', value.substring(0, 20) + '...')
        },
        remove(name: string, options: unknown) {
          if (typeof document === 'undefined') return
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=lax;`
        },
      },
    }
  )

  return client
}