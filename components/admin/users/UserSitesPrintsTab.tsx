'use client'

import { useState, useEffect } from 'react'
import { Building2, Printer, Calendar, MapPin, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface UserSitesPrintsTabProps {
  userId: string
  userName: string
}

interface SiteAssignment {
  id: string
  site_id: string
  site_name: string
  site_address: string
  role: string
  assigned_at: string
  is_active: boolean
  site_status: string
  print_count?: number
  last_print_date?: string
}

export default function UserSitesPrintsTab({ userId, userName }: UserSitesPrintsTabProps) {
  const [assignments, setAssignments] = useState<SiteAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchSiteAssignments()
  }, [userId])

  const fetchSiteAssignments = async () => {
    try {
      setLoading(true)
      
      // Fetch site assignments with site details
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('site_assignments')
        .select(`
          id,
          site_id,
          role,
          assigned_at,
          is_active,
          sites (
            name,
            address,
            status
          )
        `)
        .eq('user_id', userId)
        .order('assigned_at', { ascending: false })

      if (assignmentError) {
        console.error('Error fetching assignments:', assignmentError)
        return
      }

      // Format the data
      const formattedAssignments = assignmentData?.map(assignment => ({
        id: assignment.id,
        site_id: assignment.site_id,
        site_name: assignment.sites?.name || '',
        site_address: assignment.sites?.address || '',
        site_status: assignment.sites?.status || 'active',
        role: assignment.role,
        assigned_at: assignment.assigned_at,
        is_active: assignment.is_active,
        print_count: Math.floor(Math.random() * 50), // Mock data for print count
        last_print_date: assignment.is_active ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : null
      })) || []

      setAssignments(formattedAssignments)
    } catch (error) {
      console.error('Error fetching site assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { text: '진행중', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300', icon: CheckCircle },
      planning: { text: '계획중', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300', icon: AlertCircle },
      completed: { text: '완료', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300', icon: CheckCircle },
      suspended: { text: '중단', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300', icon: AlertCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (assignments.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            배정된 현장이 없습니다
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {userName}님은 아직 현장에 배정되지 않았습니다.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">전체 현장</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {assignments.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">활성 현장</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {assignments.filter(a => a.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Printer className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">총 출력</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {assignments.reduce((sum, a) => sum + (a.print_count || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sites List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            현장별 출력 정보
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  현장명
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  주소
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  역할
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  상태
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  배정일
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  출력 수
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  최근 출력
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {assignments.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {assignment.site_name}
                        </p>
                        {getStatusBadge(assignment.site_status)}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <MapPin className="h-4 w-4 mr-1" />
                      {assignment.site_address}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {assignment.role === 'worker' ? '작업자' : 
                       assignment.role === 'manager' ? '관리자' : 
                       assignment.role}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      assignment.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                    }`}>
                      {assignment.is_active ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="h-4 w-4 mr-1" />
                      {format(new Date(assignment.assigned_at), 'yyyy.MM.dd', { locale: ko })}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <Printer className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {assignment.print_count || 0}회
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {assignment.last_print_date 
                        ? format(new Date(assignment.last_print_date), 'MM.dd HH:mm', { locale: ko })
                        : '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}