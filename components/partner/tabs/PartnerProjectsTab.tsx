'use client'

import { Profile } from '@/types'
import { Building2, MapPin, Calendar, Users, TrendingUp, MoreVertical } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PartnerProjectsTabProps {
  profile: Profile
  sites: unknown[]
}

export default function PartnerProjectsTab({ profile, sites }: PartnerProjectsTabProps) {
  // Mock project data
  const projects = [
    {
      id: 1,
      name: '강남 A현장',
      address: '서울특별시 강남구 테헤란로 123',
      status: 'active',
      progress: 65,
      startDate: '2024-01-15',
      endDate: '2024-06-30',
      workers: 12,
      manager: '김현장',
      budget: '5.2억',
      spent: '3.4억'
    },
    {
      id: 2,
      name: '송파 B현장',
      address: '서울특별시 송파구 올림픽로 456',
      status: 'active',
      progress: 35,
      startDate: '2024-02-01',
      endDate: '2024-08-31',
      workers: 8,
      manager: '이관리',
      budget: '3.8억',
      spent: '1.3억'
    },
    {
      id: 3,
      name: '서초 C현장',
      address: '서울특별시 서초구 반포대로 789',
      status: 'planning',
      progress: 0,
      startDate: '2024-04-01',
      endDate: '2024-12-31',
      workers: 0,
      manager: '박소장',
      budget: '7.5억',
      spent: '0'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'planning': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '진행중'
      case 'planning': return '준비중'
      case 'completed': return '완료'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          프로젝트 관리
        </h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          새 프로젝트
        </button>
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    {project.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {project.progress}% 완료
                    </span>
                  </div>
                </div>
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <MoreVertical className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Project Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300 truncate">
                    {project.address}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300">
                    작업자 {project.workers}명
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300">
                    {project.startDate}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300">
                    {project.spent} / {project.budget}
                  </span>
                </div>
              </div>

              {/* Manager Info */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {project.manager.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{project.manager}</p>
                      <p className="text-xs text-gray-500">현장 관리자</p>
                    </div>
                  </div>
                  <button className="text-sm text-blue-600 hover:text-blue-700">
                    상세보기
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 mb-1">전체 프로젝트</p>
            <p className="text-2xl font-bold">3개</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 mb-1">총 예산</p>
            <p className="text-2xl font-bold">16.5억</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 mb-1">평균 진행률</p>
            <p className="text-2xl font-bold">33%</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}