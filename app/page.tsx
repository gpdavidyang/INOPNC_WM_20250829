import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect'
import { createClient } from '@/lib/supabase/server'
import { getAuthForClient } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = createClient()
  try {
    const auth = await getAuthForClient(supabase)
    if (!auth) {
      redirect('/auth/login')
    }
    const destination = auth.uiTrack || '/dashboard'
    redirect(destination)
  } catch (error) {
    if (isRedirectError(error)) throw error
    console.error('Home page error:', error)
    redirect('/auth/login')
  }
}
