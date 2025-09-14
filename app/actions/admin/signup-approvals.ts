'use server'


export async function getSignupRequests() {
  const supabase = createClient()
  
  const { data: requests, error } = await supabase
    .from('signup_requests')
    .select('*')
    .order('requested_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching signup requests:', error)
    return { error: error.message, requests: [] }
  }
  
  return { requests: requests || [] }
}

export async function getPendingSignupRequests() {
  const supabase = createClient()
  
  const { data: requests, error } = await supabase
    .from('signup_requests')
    .select('*')
    .eq('status', 'pending')
    .order('requested_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching pending signup requests:', error)
    return { error: error.message, requests: [] }
  }
  
  return { requests: requests || [] }
}

export async function getSignupRequestById(requestId: string) {
  const supabase = createClient()
  
  const { data: request, error } = await supabase
    .from('signup_requests')
    .select('*')
    .eq('id', requestId)
    .single()
  
  if (error) {
    console.error('Error fetching signup request:', error)
    return { error: error.message, request: null }
  }
  
  return { request }
}

export async function getSignupRequestStats() {
  const supabase = createClient()
  
  const { data: stats, error } = await supabase
    .from('signup_requests')
    .select('status')
  
  if (error) {
    console.error('Error fetching signup request stats:', error)
    return { 
      error: error.message, 
      stats: { total: 0, pending: 0, approved: 0, rejected: 0 } 
    }
  }
  
  const counts = {
    total: stats?.length || 0,
    pending: stats?.filter((s: unknown) => s.status === 'pending').length || 0,
    approved: stats?.filter((s: unknown) => s.status === 'approved').length || 0,
    rejected: stats?.filter((s: unknown) => s.status === 'rejected').length || 0
  }
  
  return { stats: counts }
}