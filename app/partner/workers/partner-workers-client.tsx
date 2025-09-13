'use client'

import { useState } from 'react'
import { Profile } from '@/types'
import { 
  Users, User, Phone, Mail, Building2, Calendar,
  Search, Filter, ChevronRight, HardHat, Briefcase,
  CheckCircle, AlertCircle, Clock
} from 'lucide-react'
import Link from 'next/link'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'

interface PartnerWorkersClientProps {
  profile: Profile & { partner_companies?: any }
  workers: {
    site_managers: unknown[]
    workers: unknown[]
    all: unknown[]
  }
  attendanceStats: Record<string, { total: number, lastReport: string | null }>
}

export default function PartnerWorkersClient({
  profile,
  workers,
  attendanceStats
}: PartnerWorkersClientProps) {
  const { isLargeFont } = useFontSize()
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'site_manager' | 'worker'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const getTypographyClass = (type: string, size: string = 'base') => {
    return getFullTypographyClass(type, size, isLargeFont)
  }

  // Filter workers
  const getFilteredWorkers = () => {
    let filtered = workers.all

    // Role filter
    if (roleFilter === 'site_manager') {
      filtered = workers.site_managers
    } else if (roleFilter === 'worker') {
      filtered = workers.workers
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(w => 
        w.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.trade?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(w => 
        w.site_assignments?.some((a: any) => a.is_active)
      )
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(w => 
        !w.site_assignments?.some((a: any) => a.is_active)
      )
    }

    return filtered
  }

  const filteredWorkers = getFilteredWorkers()

  // Statistics
  const totalWorkers = workers.all.length
  const activeWorkers = workers.all.filter(w => 
    w.site_assignments?.some((a: any) => a.is_active)
  ).length
  const siteManagers = workers.site_managers.length

  const getRoleBadge = (role: string) => {
    if (role === 'site_manager') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          <Briefcase className="h-3 w-3 mr-1" />
          현장관리자
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
        <HardHat className="h-3 w-3 mr-1" />
        작업자
      </span>
    )
  }

  const getAttendanceStatus = (workerId: string) => {
    const stats = attendanceStats[workerId]
    if (!stats || stats.total === 0) {
      return { icon: AlertCircle, color: 'text-gray-400', text: '출근 기록 없음' }
    }
    
    const lastReportDate = stats.lastReport ? new Date(stats.lastReport) : null
    const daysSinceLastReport = lastReportDate 
      ? Math.floor((Date.now() - lastReportDate.getTime()) / (1000 * 60 * 60 * 24))
      : 999

    if (daysSinceLastReport <= 1) {
      return { icon: CheckCircle, color: 'text-green-500', text: '정상 출근' }
    } else if (daysSinceLastReport <= 3) {
      return { icon: Clock, color: 'text-yellow-500', text: `${daysSinceLastReport}일 전 출근` }
    } else {
      return { icon: AlertCircle, color: 'text-red-500', text: `${daysSinceLastReport}일 이상 미출근` }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`${getTypographyClass('header', 'xl')} font-bold text-gray-900 dark:text-gray-100`}>
          소속 직원 관리
        </h1>
        <p className={`${getTypographyClass('body', 'base')} text-gray-600 dark:text-gray-400 mt-2`}>
          {profile.partner_companies?.company_name} 소속 직원들을 관리합니다
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getTypographyClass('caption', 'sm')} text-gray-500 dark:text-gray-400`}>
                전체 직원
              </p>
              <p className={`${getTypographyClass('header', 'lg')} font-bold text-gray-900 dark:text-gray-100 mt-1`}>
                {totalWorkers}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getTypographyClass('caption', 'sm')} text-gray-500 dark:text-gray-400`}>
                현장 배치
              </p>
              <p className={`${getTypographyClass('header', 'lg')} font-bold text-green-600 dark:text-green-400 mt-1`}>
                {activeWorkers}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getTypographyClass('caption', 'sm')} text-gray-500 dark:text-gray-400`}>
                현장관리자
              </p>
              <p className={`${getTypographyClass('header', 'lg')} font-bold text-purple-600 dark:text-purple-400 mt-1`}>
                {siteManagers}
              </p>
            </div>
            <Briefcase className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getTypographyClass('caption', 'sm')} text-gray-500 dark:text-gray-400`}>
                작업자
              </p>
              <p className={`${getTypographyClass('header', 'lg')} font-bold text-blue-600 dark:text-blue-400 mt-1`}>
                {workers.workers.length}
              </p>
            </div>
            <HardHat className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="이름, 이메일, 전화번호로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg ${
                  getTypographyClass('body', 'sm')
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500`}
              />
            </div>
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg ${
              getTypographyClass('body', 'sm')
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
          >
            <option value="all">전체 역할</option>
            <option value="site_manager">현장관리자</option>
            <option value="worker">작업자</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg ${
              getTypographyClass('body', 'sm')
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
          >
            <option value="all">전체 상태</option>
            <option value="active">현장 배치</option>
            <option value="inactive">대기중</option>
          </select>
        </div>
      </div>

      {/* Workers List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {filteredWorkers.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredWorkers.map((worker) => {
              const attendanceStatus = getAttendanceStatus(worker.id)
              const AttendanceIcon = attendanceStatus.icon
              const activeSite = worker.site_assignments?.find((a: any) => a.is_active)

              return (
                <div key={worker.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                      </div>

                      {/* Worker Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className={`${getTypographyClass('body', 'base')} font-semibold text-gray-900 dark:text-gray-100`}>
                            {worker.full_name}
                          </h3>
                          {getRoleBadge(worker.role)}
                          <div className={`flex items-center gap-1 ${attendanceStatus.color}`}>
                            <AttendanceIcon className="h-4 w-4" />
                            <span className={getTypographyClass('caption', 'xs')}>
                              {attendanceStatus.text}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-2">
                          {worker.email && (
                            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                              <Mail className="h-4 w-4" />
                              <span className={getTypographyClass('caption', 'sm')}>
                                {worker.email}
                              </span>
                            </div>
                          )}
                          
                          {worker.phone && (
                            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                              <Phone className="h-4 w-4" />
                              <span className={getTypographyClass('caption', 'sm')}>
                                {worker.phone}
                              </span>
                            </div>
                          )}

                          {worker.trade && (
                            <span className={`${getTypographyClass('caption', 'sm')} text-gray-500 dark:text-gray-400`}>
                              {worker.trade}
                            </span>
                          )}
                        </div>

                        {/* Current Site Assignment */}
                        {activeSite && activeSite.sites && (
                          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-blue-500" />
                              <span className={`${getTypographyClass('caption', 'sm')} font-medium text-gray-700 dark:text-gray-300`}>
                                현재 배치 현장
                              </span>
                            </div>
                            <p className={`${getTypographyClass('body', 'sm')} text-gray-900 dark:text-gray-100 mt-1`}>
                              {activeSite.sites.name}
                            </p>
                            <p className={`${getTypographyClass('caption', 'xs')} text-gray-500 dark:text-gray-400 mt-1`}>
                              배치일: {new Date(activeSite.assigned_date).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                        )}

                        {/* Attendance Stats */}
                        {attendanceStats[worker.id] && (
                          <div className="flex items-center gap-4 mt-3">
                            <span className={`${getTypographyClass('caption', 'sm')} text-gray-600 dark:text-gray-400`}>
                              최근 30일 출근: {attendanceStats[worker.id].total}일
                            </span>
                            {attendanceStats[worker.id].lastReport && (
                              <span className={`${getTypographyClass('caption', 'sm')} text-gray-600 dark:text-gray-400`}>
                                마지막 출근: {new Date(attendanceStats[worker.id].lastReport!).toLocaleDateString('ko-KR')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className={`${getTypographyClass('body', 'base')} text-gray-500 dark:text-gray-400`}>
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                ? '검색 조건에 맞는 직원이 없습니다'
                : '등록된 직원이 없습니다'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}