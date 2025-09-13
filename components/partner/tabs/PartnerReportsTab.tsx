'use client'

import { Profile } from '@/types'
import { FileText, Download, Eye, Calendar, Building2, CheckCircle, Clock, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PartnerReportsTabProps {
  profile: Profile
  sites: unknown[]
}

export default function PartnerReportsTab({ profile, sites }: PartnerReportsTabProps) {
  // Mock report data
  const reports = [
    {
      id: 1,
      title: '강남 A현장 일일 작업 보고서',
      site: '강남 A현장',
      date: '2024-03-18',
      status: 'submitted',
      author: '김작업',
      type: 'daily'
    },
    {
      id: 2,
      title: '송파 B현장 주간 진행 보고서',
      site: '송파 B현장',
      date: '2024-03-17',
      status: 'pending',
      author: '이관리',
      type: 'weekly'
    },
    {
      id: 3,
      title: '강남 A현장 안전 점검 보고서',
      site: '강남 A현장',
      date: '2024-03-15',
      status: 'approved',
      author: '박안전',
      type: 'safety'
    },
    {
      id: 4,
      title: '2월 월간 종합 보고서',
      site: '전체',
      date: '2024-03-01',
      status: 'approved',
      author: '김관리',
      type: 'monthly'
    },
    {
      id: 5,
      title: '송파 B현장 자재 사용 보고서',
      site: '송파 B현장',
      date: '2024-03-14',
      status: 'rejected',
      author: '최자재',
      type: 'material'
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'pending': return <Clock className="w-4 h-4 text-orange-500" />
      case 'submitted': return <Clock className="w-4 h-4 text-blue-500" />
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />
      default: return null
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return '승인됨'
      case 'pending': return '대기중'
      case 'submitted': return '제출됨'
      case 'rejected': return '반려됨'
      default: return status
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'daily': return '일일보고'
      case 'weekly': return '주간보고'
      case 'monthly': return '월간보고'
      case 'safety': return '안전점검'
      case 'material': return '자재관리'
      default: return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'daily': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'weekly': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'monthly': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400'
      case 'safety': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'material': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          작업 보고서
        </h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          새 보고서 작성
        </button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
              bg-white dark:bg-gray-800 text-sm">
              <option>모든 현장</option>
              <option>강남 A현장</option>
              <option>송파 B현장</option>
              <option>서초 C현장</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
              bg-white dark:bg-gray-800 text-sm">
              <option>모든 유형</option>
              <option>일일보고</option>
              <option>주간보고</option>
              <option>월간보고</option>
              <option>안전점검</option>
              <option>자재관리</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
              bg-white dark:bg-gray-800 text-sm">
              <option>모든 상태</option>
              <option>승인됨</option>
              <option>대기중</option>
              <option>제출됨</option>
              <option>반려됨</option>
            </select>
            <input 
              type="date" 
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                bg-white dark:bg-gray-800 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>보고서 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    보고서
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    현장
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    유형
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    상태
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    작성자
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    날짜
                  </th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b border-gray-100 dark:border-gray-800 
                    hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {report.title}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {report.site}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(report.type)}`}>
                        {getTypeLabel(report.type)}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(report.status)}
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {getStatusLabel(report.status)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {report.author}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {report.date}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                          <Download className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}