import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthForClient } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export default async function Home() {
  // Let middleware handle authentication - no client-side redirects
  // This prevents infinite loops by using server-side redirects only
  try {
    const supabase = createClient()
    const auth = await getAuthForClient(supabase)
    
    if (!auth) {
      redirect('/auth/login')
    }
    
    // Redirect authenticated users to dashboard
    redirect('/dashboard')
    
  } catch (error) {
    console.error('Home page error:', error)
    redirect('/auth/login')
  }
}
