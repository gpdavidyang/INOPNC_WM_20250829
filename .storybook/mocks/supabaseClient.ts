// Storybook mock for Supabase browser client to avoid real env/requests
// Minimal surface used by UnifiedAuthProvider

type SelectQuery = {
  eq: (field: string, value: unknown) => SelectQuery
  single: () => Promise<{ data: any; error: any }>
}

function makeSelectQuery(): SelectQuery {
  return {
    eq: () => makeSelectQuery(),
    single: async () => ({ data: null, error: { message: 'Mocked: no data' } }),
  }
}

export function createClient() {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: (_table: string) => ({
      select: (_cols?: string) => makeSelectQuery(),
      insert: async (_vals: any) => ({ data: null, error: null }),
      update: async (_vals: any) => ({ data: null, error: null }),
      delete: async () => ({ data: null, error: null }),
      upsert: async (_vals: any) => ({ data: null, error: null }),
    }),
  }
}

// Optional: named exports parity if used elsewhere
export const createEnhancedClient = createClient
export const resetClient = () => {}
export const forceSessionRefresh = async () => ({ success: false, error: 'mock' })
export const createRawClient = createClient
