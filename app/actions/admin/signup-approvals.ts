'use server'

import { createClient } from '@/lib/supabase/server'

export async function getSignupRequests(search?: string) {
  const supabase = createClient()

  let query = supabase
    .from('signup_requests')
    .select('*')
    .neq('status', 'deleted' as any)
    .order('requested_at', { ascending: false })

  if (search && search.trim()) {
    const s = search.trim()
    // Support legacy company_name and current company column
    query = query.or(
      `full_name.ilike.%${s}%,email.ilike.%${s}%,company.ilike.%${s}%,company_name.ilike.%${s}%`
    )
  }

  const { data: requests, error } = await query

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
    .neq('status', 'deleted' as any)
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
    .neq('status', 'deleted' as any)

  if (error) {
    console.error('Error fetching signup request stats:', error)
    return {
      error: error.message,
      stats: { total: 0, pending: 0, approved: 0, rejected: 0 },
    }
  }

  const counts = {
    total: stats?.length || 0,
    pending: stats?.filter((s: unknown) => s.status === 'pending').length || 0,
    approved: stats?.filter((s: unknown) => s.status === 'approved').length || 0,
    rejected: stats?.filter((s: unknown) => s.status === 'rejected').length || 0,
  }

  return { stats: counts }
}
