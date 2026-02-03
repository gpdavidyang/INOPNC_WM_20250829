'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { DailyReport, Profile, Site } from '@/types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Calendar, Edit, FileText, MapPin, MoreHorizontal, Package, Users } from 'lucide-react'
import Link from 'next/link'

interface DailyReportTableProps {
  reports: DailyReport[]
  sites: Site[]
  currentUser: Profile
  onViewDetail: (report: DailyReport) => void
}

export const DailyReportTable = ({
  reports,
  sites,
  currentUser,
  onViewDetail,
}: DailyReportTableProps) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft':
        return { label: '임시', color: 'bg-gray-100 text-gray-700 border-gray-200' }
      case 'submitted':
        return { label: '제출됨', color: 'bg-blue-100 text-blue-700 border-blue-200' }
      case 'approved':
        return { label: '승인됨', color: 'bg-green-100 text-green-700 border-green-200' }
      case 'rejected':
        return { label: '반려됨', color: 'bg-red-100 text-red-700 border-red-200' }
      default:
        return { label: status, color: 'bg-gray-100' }
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400">
            <tr>
              <th className="px-6 py-4 font-bold uppercase tracking-wider">작업일</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider">현장 / 공정</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider">상태</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-center">
                인원 / 자재
              </th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {reports.map(report => {
              const status = getStatusConfig(report.status || 'draft')
              const siteName = sites?.find(s => s.id === report.site_id)?.name || '미지정'
              const canEdit = currentUser.id === report.created_by && report.status === 'draft'

              return (
                <tr
                  key={report.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                        <Calendar className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-gray-100">
                          {format(new Date(report.work_date), 'MM/dd')}
                        </p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-tighter">
                          {format(new Date(report.work_date), 'EEEE', { locale: ko })}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900 dark:text-gray-100">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {siteName}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-4 bg-gray-100 dark:bg-gray-800 text-gray-500 border-none font-bold"
                        >
                          {report.process_type || '-'}
                        </Badge>
                        <span className="truncate max-w-[150px]">{report.member_name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      className={`${status.color} px-2 py-0.5 text-[11px] font-bold border rounded-md shadow-none`}
                    >
                      {status.label}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-4">
                      <div className="flex items-center gap-1.5" title="작업인원">
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        <span className="font-bold text-gray-900 dark:text-gray-100">
                          {report.total_workers || 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5" title="자재사용">
                        <Package className="w-3.5 h-3.5 text-orange-500" />
                        <span className="font-bold text-gray-900 dark:text-gray-100">
                          {Math.round(report.npc1000_used || 0)}kg
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30"
                        onClick={() => onViewDetail(report)}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>

                      {canEdit && (
                        <Link href={`/dashboard/daily-reports/${report.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/30"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}

                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {reports.length === 0 && (
        <div className="px-6 py-12 text-center bg-gray-50/50 dark:bg-gray-900/20">
          <div className="inline-flex items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-full shadow-sm mb-4">
            <FileText className="w-8 h-8 text-gray-200 dark:text-gray-700" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            검색된 작업일지가 없습니다.
          </p>
        </div>
      )}
    </div>
  )
}
