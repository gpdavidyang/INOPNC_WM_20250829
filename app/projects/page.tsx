import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import ProjectList from './project-list'
import { getAuthForClient } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
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
  const currentUser = { id: auth.userId, email: auth.email }

  return (
    <div className="min-h-screen bg-gray-100">
      <ProjectList 
        currentUser={currentUser} 
        currentProfile={currentProfile}
        projects={projects || []}
      />
    </div>
  )
}
