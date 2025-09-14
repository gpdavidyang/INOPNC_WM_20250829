import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function Home() {
  // Let middleware handle authentication - no client-side redirects
  // This prevents infinite loops by using server-side redirects only
  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      redirect('/auth/login')
    }
    
    // Redirect authenticated users to dashboard
    redirect('/dashboard')
    
  } catch (error) {
    console.error('Home page error:', error)
    redirect('/auth/login')
  }
}