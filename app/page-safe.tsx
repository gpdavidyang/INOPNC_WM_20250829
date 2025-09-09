import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export default async function HomePage() {
  // Server-side authentication check
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  // Redirect based on authentication status
  if (session?.user) {
    redirect('/dashboard')
  } else {
    redirect('/auth/login')
  }
}