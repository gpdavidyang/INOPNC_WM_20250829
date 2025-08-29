import { createMockSupabaseClient } from '@/lib/test-utils'

describe('Authentication Example', () => {
  it('demonstrates authenticated user flow', async () => {
    // Create an authenticated mock client
    const supabase = createMockSupabaseClient()

    // Get current user
    const { data: { user }, error } = await supabase.auth.getUser()
    
    expect(error).toBeNull()
    expect(user).toBeDefined()
    expect(user?.email).toBe('test@example.com')
    expect(user?.id).toBe('test-user-id')
  })

  it('demonstrates unauthenticated user flow', async () => {
    // Create an unauthenticated mock client
    const supabase = createMockSupabaseClient({
      user: null,
      session: null,
      isAuthenticated: false
    })

    // Try to get current user
    const { data: { user }, error } = await supabase.auth.getUser()
    
    expect(user).toBeNull()
    expect(error).toBeDefined()
    expect(error?.message).toBe('Not authenticated')
  })

  it('demonstrates database query with auth context', async () => {
    const supabase = createMockSupabaseClient()
    
    // Mock the query response
    const mockProfiles = [
      { id: '1', name: 'John Doe', role: 'worker' },
      { id: '2', name: 'Jane Smith', role: 'site_manager' }
    ]
    
    // Override the select response
    const queryBuilder = supabase.from('profiles')
    queryBuilder.select.mockImplementation(() => {
      (queryBuilder as any).__promise = Promise.resolve({ 
        data: mockProfiles, 
        error: null 
      })
      return queryBuilder
    })
    
    // Perform the query
    const { data, error } = await queryBuilder
      .select('*')
      .eq('organization_id', 'org-123')
    
    expect(error).toBeNull()
    expect(data).toEqual(mockProfiles)
    expect(queryBuilder.select).toHaveBeenCalledWith('*')
    expect(queryBuilder.eq).toHaveBeenCalledWith('organization_id', 'org-123')
  })

  it('demonstrates auth state change handling', async () => {
    const supabase = createMockSupabaseClient()
    const onAuthChange = jest.fn()
    
    // Subscribe to auth state changes
    supabase.auth.onAuthStateChange(onAuthChange)
    
    // Simulate sign out
    await supabase.auth.signOut()
    
    // In a real component, you might trigger auth state change like this
    // For testing, you would use triggerAuthStateChange helper
    expect(supabase.auth.signOut).toHaveBeenCalled()
  })
})