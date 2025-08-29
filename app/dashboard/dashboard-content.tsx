'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface DashboardContentProps {
  user: any
  profile: any
  taskStats: {
    total: number
    pending: number
    inProgress: number
    completed: number
  }
}

export default function DashboardContent({ user, profile, taskStats }: DashboardContentProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">작업 관리 시스템</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">안녕하세요, {profile?.full_name || user.email}</span>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome section */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">대시보드</h2>
              
              {/* Task Statistics */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">전체 작업</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">{taskStats.total}</dd>
                  </div>
                </div>

                <div className="bg-blue-50 overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-blue-600 truncate">대기 중</dt>
                    <dd className="mt-1 text-3xl font-semibold text-blue-900">{taskStats.pending}</dd>
                  </div>
                </div>

                <div className="bg-yellow-50 overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-yellow-600 truncate">진행 중</dt>
                    <dd className="mt-1 text-3xl font-semibold text-yellow-900">{taskStats.inProgress}</dd>
                  </div>
                </div>

                <div className="bg-green-50 overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-green-600 truncate">완료됨</dt>
                    <dd className="mt-1 text-3xl font-semibold text-green-900">{taskStats.completed}</dd>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">빠른 작업</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <button
                    onClick={() => router.push('/tasks/new')}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    새 작업 만들기
                  </button>
                  <button
                    onClick={() => router.push('/tasks')}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    작업 목록 보기
                  </button>
                  <button
                    onClick={() => router.push('/projects')}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    프로젝트 관리
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}