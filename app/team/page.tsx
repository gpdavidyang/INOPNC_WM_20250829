import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import TeamList from './team-list'
import { getAuthForClient } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export default async function TeamPage() {
  const supabase = createClient()
  
  const auth = await getAuthForClient(supabase)
  
  if (!auth) {
    redirect('/auth/login')
  }

  // Get current user profile
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', auth.userId)
    .single()

  // Get all team members
  const { data: teamMembers } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const currentUser = { id: auth.userId, email: auth.email }

  return (
    <div className="min-h-screen bg-gray-100">
      <TeamList 
        currentUser={currentUser} 
        currentProfile={currentProfile} 
        teamMembers={teamMembers || []} 
      />
    </div>
  )
}
