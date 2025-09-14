import { createServerSupabaseClient } from "@/lib/supabase/server"
import TeamList from './team-list'

export default async function TeamPage() {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get current user profile
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get all team members
  const { data: teamMembers } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-100">
      <TeamList 
        currentUser={user} 
        currentProfile={currentProfile} 
        teamMembers={teamMembers || []} 
      />
    </div>
  )
}