import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import TaskList from './task-list'
import { getAuthForClient } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
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

  // TODO: Get all tasks with related data when tasks table is created
  // const { data: tasks } = await supabase
  //   .from('tasks')
  //   .select(`
  //     *,
  //     project:projects(id, name),
  //     assigned_user:profiles!tasks_assigned_to_fkey(id, full_name, email),
  //     created_user:profiles!tasks_created_by_fkey(id, full_name, email)
  //   `)
  //   .order('created_at', { ascending: false })

  // TODO: Get all projects for filter when projects table is created
  // const { data: projects } = await supabase
  //   .from('projects')
  //   .select('id, name')
  //   .eq('status', 'active')
  //   .order('name')

  const tasks: unknown[] = []
  const projects: unknown[] = []

  // Get all users for assignment
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .order('full_name')

  const currentUser = { id: auth.userId, email: auth.email }

  return (
    <div className="min-h-screen bg-gray-100">
      <TaskList 
        currentUser={currentUser} 
        currentProfile={currentProfile}
        tasks={tasks || []}
        projects={projects || []}
        users={users || []}
      />
    </div>
  )
}
