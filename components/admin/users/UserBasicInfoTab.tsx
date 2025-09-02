'use client'

import { User, Mail, Phone, Shield, Building, Calendar, ClipboardCheck, FileText, Activity, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface UserBasicInfoTabProps {
  user: any
  statistics: {
    total_sites: number
    total_daily_reports: number
    total_documents: number
    active_sites: number
  }
  onEdit: () => void
}

export default function UserBasicInfoTab({ user, statistics, onEdit }: UserBasicInfoTabProps) {
  const getRoleBadge = (role: string) => {
    const roleConfig = {
      worker: { text: '작업자', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' },
      site_manager: { text: '현장관리자', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
      customer_manager: { text: '파트너사', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' },
      admin: { text: '관리자', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' },
      system_admin: { text: '시스템관리자', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' }
    }
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.worker
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { text: '활성', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
      inactive: { text: '비활성', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' },
      suspended: { text: '정지', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 기본 정보 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">기본 정보</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">이름</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user.full_name}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">이메일</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">전화번호</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user.phone || '-'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">역할</p>
                <div className="mt-1">
                  {getRoleBadge(user.role)}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">상태</p>
                <div className="mt-1">
                  {getStatusBadge(user.status || 'active')}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">소속 조직</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user.organization?.name || user.organizations?.name || '-'}
                </p>
                {(user.organization?.type || user.organizations?.type) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {(() => {
                      const type = user.organization?.type || user.organizations?.type
                      const typeLabels: Record<string, string> = {
                        'head_office': '본사',
                        'branch_office': '지사',
                        'partner': '파트너사',
                        'contractor': '협력업체'
                      }
                      return typeLabels[type] || type
                    })()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">가입일</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user.created_at ? format(new Date(user.created_at), 'yyyy.MM.dd', { locale: ko }) : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 계정 정보 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">활동 정보</h3>
          <div className="space-y-4">
            {user.last_login_at && (
              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">최근 로그인</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {format(new Date(user.last_login_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                  </p>
                </div>
              </div>
            )}

            {user.login_count && (
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">총 로그인 횟수</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user.login_count.toLocaleString()}회
                  </p>
                </div>
              </div>
            )}

            {user.work_log_stats && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">작업일지 통계</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">총 작성</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.work_log_stats.total_reports}건
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">이번 달</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.work_log_stats.this_month}건
                    </span>
                  </div>
                  {user.work_log_stats.last_report_date && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">최근 작성</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {format(new Date(user.work_log_stats.last_report_date), 'yyyy.MM.dd', { locale: ko })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 통계 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Building className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">배정 현장</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {statistics?.total_sites || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">활성 현장</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {statistics?.active_sites || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">작업일지</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {statistics?.total_daily_reports || 0}
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* 현장 배정 현황 */}
      {user.site_assignments && user.site_assignments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 mt-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">현장 배정 현황</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    현장명
                  </th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    역할
                  </th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    배정일
                  </th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    상태
                  </th>
                </tr>
              </thead>
              <tbody>
                {user.site_assignments.map((assignment: any, index: number) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-2 px-4 text-sm text-gray-900 dark:text-gray-100">
                      {assignment.site_name}
                    </td>
                    <td className="py-2 px-4 text-sm text-gray-900 dark:text-gray-100">
                      {assignment.role}
                    </td>
                    <td className="py-2 px-4 text-sm text-gray-900 dark:text-gray-100">
                      {format(new Date(assignment.assigned_at), 'yyyy.MM.dd', { locale: ko })}
                    </td>
                    <td className="py-2 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        assignment.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                      }`}>
                        {assignment.is_active ? '활성' : '비활성'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}