'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/navbar'
import Link from 'next/link'

interface TaskListProps {
  currentUser: any
  currentProfile: any
  tasks: any[]
  projects: any[]
  users: any[]
}

export default function TaskList({ currentUser, currentProfile, tasks, projects, users }: TaskListProps) {
  const router = useRouter()
  const supabase = createClient()
  const [filter, setFilter] = useState({
    status: 'all',
    project: 'all',
    assignee: 'all',
  })

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    // TODO: Implement when tasks table is created
    // const { error } = await supabase
    //   .from('tasks')
    //   .update({ 
    //     status: newStatus,
    //     completed_at: newStatus === 'completed' ? new Date().toISOString() : null
    //   })
    //   .eq('id', taskId)

    // if (!error) {
    //   router.refresh()
    // }
    alert('작업 상태 변경 기능은 아직 구현 중입니다.')
  }

  const handleDelete = async (taskId: string) => {
    if (confirm('정말로 이 작업을 삭제하시겠습니까?')) {
      // TODO: Implement when tasks table is created
      // const { error } = await supabase
      //   .from('tasks')
      //   .delete()
      //   .eq('id', taskId)

      // if (!error) {
      //   router.refresh()
      // }
      alert('작업 삭제 기능은 아직 구현 중입니다.')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return badges[status as keyof typeof badges] || badges.pending
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: '대기 중',
      in_progress: '진행 중',
      completed: '완료됨',
      cancelled: '취소됨',
    }
    return labels[status as keyof typeof labels] || '대기 중'
  }

  const getPriorityBadge = (priority: string) => {
    const badges = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    }
    return badges[priority as keyof typeof badges] || badges.medium
  }

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: '낮음',
      medium: '보통',
      high: '높음',
      urgent: '긴급',
    }
    return labels[priority as keyof typeof labels] || '보통'
  }

  // Filter tasks with defensive array handling
  const filteredTasks = Array.isArray(tasks) ? tasks.filter(task => {
    if (filter.status !== 'all' && task.status !== filter.status) return false
    if (filter.project !== 'all' && task.project_id !== filter.project) return false
    if (filter.assignee !== 'all' && task.assigned_to !== filter.assignee) return false
    return true
  }) : []

  return (
    <>
      <Navbar user={currentUser} profile={currentProfile} />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="md:flex md:items-center md:justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                작업 목록
              </h2>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Link
                href="/tasks/new"
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                새 작업 만들기
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white shadow rounded-lg mb-6 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">상태</label>
                <select
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">전체</option>
                  <option value="pending">대기 중</option>
                  <option value="in_progress">진행 중</option>
                  <option value="completed">완료됨</option>
                  <option value="cancelled">취소됨</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">프로젝트</label>
                <select
                  value={filter.project}
                  onChange={(e) => setFilter({ ...filter, project: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">전체</option>
                  {Array.isArray(projects) && projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">담당자</label>
                <select
                  value={filter.assignee}
                  onChange={(e) => setFilter({ ...filter, assignee: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">전체</option>
                  {Array.isArray(users) && users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Task List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredTasks.length === 0 ? (
                <li className="px-4 py-8 text-center text-gray-500">
                  작업이 없습니다.
                </li>
              ) : (
                filteredTasks.map((task: any) => (
                  <li key={task.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Link 
                            href={`/tasks/${task.id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-500"
                          >
                            {task.title}
                          </Link>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                {task.project?.name || '프로젝트 없음'}
                              </p>
                              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                담당: {task.assigned_user?.full_name || task.assigned_user?.email || '미지정'}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              {task.due_date && (
                                <p>마감: {new Date(task.due_date).toLocaleDateString()}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(task.priority)}`}>
                            {getPriorityLabel(task.priority)}
                          </span>
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                            className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${getStatusBadge(task.status)}`}
                          >
                            <option value="pending">대기 중</option>
                            <option value="in_progress">진행 중</option>
                            <option value="completed">완료됨</option>
                            <option value="cancelled">취소됨</option>
                          </select>
                          {(currentProfile?.role === 'admin' || task.created_by === currentUser.id) && (
                            <button
                              onClick={() => handleDelete(task.id)}
                              className="text-red-600 hover:text-red-900 text-sm"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </main>
    </>
  )
}