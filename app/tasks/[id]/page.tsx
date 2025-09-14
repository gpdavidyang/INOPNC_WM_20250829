
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TaskDetail from './task-detail'

export const dynamic = "force-dynamic"

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
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

  // TODO: Get task details when tasks table is created
  // const { data: task } = await supabase
  //   .from('tasks')
  //   .select(`
  //     *,
  //     project:projects(id, name),
  //     assigned_user:profiles!tasks_assigned_to_fkey(id, full_name, email),
  //     created_user:profiles!tasks_created_by_fkey(id, full_name, email)
  //   `)
  //   .eq('id', params.id)
  //   .single()

  // Mock task data since table doesn't exist
  const task = null

  if (!task) {
    notFound()
  }

  // TODO: Get comments when comments table is created
  // const { data: comments } = await supabase
  //   .from('comments')
  //   .select(`
  //     *,
  //     user:profiles(id, full_name, email)
  //   `)
  //   .eq('task_id', params.id)
  //   .order('created_at', { ascending: false })

  // Get all users for assignment
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .order('full_name')

  // TODO: Get all projects when projects table is created
  // const { data: projects } = await supabase
  //   .from('projects')
  //   .select('id, name')
  //   .eq('status', 'active')
  //   .order('name')

  const comments: unknown[] = []
  const projects: unknown[] = []

  return (
    <div className="min-h-screen bg-gray-100">
      <TaskDetail 
        currentUser={user} 
        currentProfile={currentProfile}
        task={task}
        comments={comments || []}
        users={users || []}
        projects={projects || []}
      />
    </div>
  )
}
