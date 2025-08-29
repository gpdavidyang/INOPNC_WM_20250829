import {
  createMockSupabaseClient,
  triggerAuthStateChange,
  mockUser,
  mockSession,
  authenticatedSupabaseClient,
  unauthenticatedSupabaseClient
} from '../supabase.mock'

describe('Supabase Mock', () => {
  describe('createMockSupabaseClient', () => {
    it('creates authenticated client by default', async () => {
      const client = createMockSupabaseClient()
      
      const { data: userData } = await client.auth.getUser()
      expect(userData.user).toBeTruthy()
      expect(userData.user?.email).toBe('test@example.com')
      
      const { data: sessionData } = await client.auth.getSession()
      expect(sessionData.session).toBeTruthy()
      expect(sessionData.session?.access_token).toBe('mock-access-token')
    })

    it('creates unauthenticated client when specified', async () => {
      const client = createMockSupabaseClient({
        user: null,
        session: null,
        isAuthenticated: false
      })
      
      const { data: userData, error } = await client.auth.getUser()
      expect(userData.user).toBeNull()
      expect(error?.message).toBe('Not authenticated')
      
      const { data: sessionData } = await client.auth.getSession()
      expect(sessionData.session).toBeNull()
    })

    it('allows custom user and session overrides', async () => {
      const customUser = { ...mockUser, email: 'custom@example.com' }
      const client = createMockSupabaseClient({
        user: customUser
      })
      
      const { data } = await client.auth.getUser()
      expect(data.user?.email).toBe('custom@example.com')
    })
  })

  describe('Auth Methods', () => {
    it('signIn returns user and session', async () => {
      const client = createMockSupabaseClient()
      const { data, error } = await client.auth.signIn({
        email: 'test@example.com',
        password: 'password'
      })
      
      expect(error).toBeNull()
      expect(data?.user).toBeTruthy()
      expect(data?.session).toBeTruthy()
    })

    it('signOut clears session', async () => {
      const client = createMockSupabaseClient()
      const { error } = await client.auth.signOut()
      
      expect(error).toBeNull()
      expect(client.auth.signOut).toHaveBeenCalled()
    })

    it('resetPasswordForEmail sends reset email', async () => {
      const client = createMockSupabaseClient()
      const { data, error } = await client.auth.resetPasswordForEmail('test@example.com')
      
      expect(error).toBeNull()
      expect(data).toBeTruthy()
    })

    it('onAuthStateChange registers callbacks', () => {
      const client = createMockSupabaseClient()
      const callback = jest.fn()
      
      const { data } = client.auth.onAuthStateChange(callback)
      expect(data?.subscription?.unsubscribe).toBeDefined()
      
      // Trigger auth state change
      triggerAuthStateChange(client, 'SIGNED_IN', mockSession)
      expect(callback).toHaveBeenCalledWith('SIGNED_IN', mockSession)
    })
  })

  describe('Database Query Builder', () => {
    it('creates chainable query builder', () => {
      const client = createMockSupabaseClient()
      const query = client.from('profiles')
      
      expect(query.select).toBeDefined()
      expect(query.insert).toBeDefined()
      expect(query.update).toBeDefined()
      expect(query.delete).toBeDefined()
    })

    it('supports method chaining', async () => {
      const client = createMockSupabaseClient()
      const query = client
        .from('profiles')
        .select('*')
        .eq('id', 'test-id')
        .order('created_at', { ascending: false })
        .limit(10)
      
      expect(query.select).toHaveBeenCalledWith('*')
      expect(query.eq).toHaveBeenCalledWith('id', 'test-id')
      expect(query.limit).toHaveBeenCalledWith(10)
    })

    it('select returns data array by default', async () => {
      const client = createMockSupabaseClient()
      const { data, error } = await client.from('profiles').select('*')
      
      expect(error).toBeNull()
      expect(Array.isArray(data)).toBeTruthy()
    })

    it('single returns single record', async () => {
      const client = createMockSupabaseClient()
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', 'test-id')
        .single()
      
      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('insert/update/delete return success response', async () => {
      const client = createMockSupabaseClient()
      
      const insertResult = await client.from('profiles').insert({ name: 'Test' })
      expect(insertResult.error).toBeNull()
      
      const updateResult = await client.from('profiles').update({ name: 'Updated' })
      expect(updateResult.error).toBeNull()
      
      const deleteResult = await client.from('profiles').delete()
      expect(deleteResult.error).toBeNull()
    })
  })

  describe('RPC Functions', () => {
    it('rpc calls return success by default', async () => {
      const client = createMockSupabaseClient()
      const { data, error } = await client.rpc('my_function', { param: 'value' })
      
      expect(error).toBeNull()
      expect(client.rpc).toHaveBeenCalledWith('my_function', { param: 'value' })
    })
  })

  describe('Storage', () => {
    it('creates storage bucket with upload/download methods', async () => {
      const client = createMockSupabaseClient()
      const bucket = client.storage.from('avatars')
      
      expect(bucket.upload).toBeDefined()
      expect(bucket.download).toBeDefined()
      expect(bucket.list).toBeDefined()
      expect(bucket.remove).toBeDefined()
    })

    it('upload returns file metadata', async () => {
      const client = createMockSupabaseClient()
      const bucket = client.storage.from('avatars')
      const file = new File(['content'], 'test.png')
      
      const { data, error } = await bucket.upload('test.png', file)
      expect(error).toBeNull()
      expect(data?.path).toBe('mock-path')
    })

    it('getPublicUrl returns public URL', () => {
      const client = createMockSupabaseClient()
      const bucket = client.storage.from('avatars')
      
      const { data } = bucket.getPublicUrl('test.png')
      expect(data.publicUrl).toBe('https://mock-public-url.com')
    })

    it('createSignedUrl returns signed URL', async () => {
      const client = createMockSupabaseClient()
      const bucket = client.storage.from('avatars')
      
      const { data, error } = await bucket.createSignedUrl('test.png', 3600)
      expect(error).toBeNull()
      expect(data?.signedUrl).toBe('https://mock-signed-url.com')
    })
  })

  describe('Pre-configured Clients', () => {
    it('authenticatedSupabaseClient is authenticated', async () => {
      const { data } = await authenticatedSupabaseClient.auth.getUser()
      expect(data.user).toBeTruthy()
    })

    it('unauthenticatedSupabaseClient is not authenticated', async () => {
      const { data, error } = await unauthenticatedSupabaseClient.auth.getUser()
      expect(data.user).toBeNull()
      expect(error?.message).toBe('Not authenticated')
    })
  })
})