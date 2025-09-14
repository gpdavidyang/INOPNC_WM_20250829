import { createServerSupabaseClient } from "@/lib/supabase/server"
import ProjectList from './project-list'

export default async function ProjectsPage() {
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

  // TODO: Get projects when projects table is created
  // const { data: projects } = await supabase
  //   .from('projects')
  //   .select(`
  //     *,
  //     created_user:profiles!projects_created_by_fkey(id, full_name, email),
  //     tasks(count)
  //   `)
  //   .order('created_at', { ascending: false })
  
  const projects: unknown[] = []

  return (
    <div className="min-h-screen bg-gray-100">
      <ProjectList 
        currentUser={user} 
        currentProfile={currentProfile}
        projects={projects || []}
      />
    </div>
  )
}