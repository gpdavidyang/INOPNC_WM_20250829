'use client'

import React from 'react'
import { Calendar, Clock, Building2, Users } from 'lucide-react'

interface WorkLog {
  date: string
  siteId: string
  siteName: string
  workHours: number
  isPublicService: boolean
  status: 'completed' | 'pending' | 'approved'
}

interface MonthlyStatsProps {
  workLogs: WorkLog[]
}

export default function MonthlyStats({ workLogs }: MonthlyStatsProps) {
  const totalDays = workLogs.length
  const totalHours = workLogs.reduce((sum, log) => sum + log.workHours, 0)
  const publicServiceDays = workLogs.filter(log => log.isPublicService).length
  const regularWorkDays = totalDays - publicServiceDays

  const uniqueSites = new Set(workLogs.map(log => log.siteName)).size

  const stats = [
    {
      label: '총 근무일',
      value: `${totalDays}일`,
      icon: Calendar,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    },
    {
      label: '총 근무시간',
      value: `${totalHours}시간`,
      icon: Clock,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/30',
    },
    {
      label: '근무 현장',
      value: `${uniqueSites}곳`,
      icon: Building2,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/30',
    },
    {
      label: '공무 일수',
      value: `${publicServiceDays}일`,
      icon: Briefcase,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/30',
    },
  ]

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">월간 통계</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Additional breakdown */}
      {totalDays > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">일반 근무</span>
            <span className="font-medium text-gray-900 dark:text-white">{regularWorkDays}일</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-600 dark:text-gray-400">공무</span>
            <span className="font-medium text-gray-900 dark:text-white">{publicServiceDays}일</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-600 dark:text-gray-400">평균 일일 근무시간</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {totalDays > 0 ? (totalHours / totalDays).toFixed(1) : 0}시간
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
