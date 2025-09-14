import { createServerSupabaseClient } from "@/lib/supabase/server"
import TaskList from './task-list'

export default async function TasksPage() {
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

  return (
    <div className="min-h-screen bg-gray-100">
      <TaskList 
        currentUser={user} 
        currentProfile={currentProfile}
        tasks={tasks || []}
        projects={projects || []}
        users={users || []}
      />
    </div>
  )
}