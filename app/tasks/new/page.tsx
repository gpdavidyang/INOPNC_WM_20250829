import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import TaskForm from './task-form'
import { getAuthForClient } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export default async function NewTaskPage() {
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

  // TODO: Get all projects for selection when projects table is created
  // const { data: projects } = await supabase
  //   .from('projects')
  //   .select('id, name')
  //   .eq('status', 'active')
  //   .order('name')

  const projects: unknown[] = []

  // Get all users for assignment
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .order('full_name')

  const currentUser = { id: auth.userId, email: auth.email }

  return (
    <div className="min-h-screen bg-gray-100">
      <TaskForm 
        currentUser={currentUser} 
        currentProfile={currentProfile}
        projects={projects || []}
        users={users || []}
      />
    </div>
  )
}
