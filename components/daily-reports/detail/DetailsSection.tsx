'use client'

import { Card } from '@/components/ui/card'
import { Building2, FileText } from 'lucide-react'

interface DetailsSectionProps {
  formData: any
}

export const DetailsSection = ({ formData }: DetailsSectionProps) => {
  const workLogs = formData?.work_logs || []
  const subcontractorWorkers = formData?.subcontractor_workers || []

  return (
    <div className="space-y-6">
      {/* Work Logs */}
      <Card className="overflow-hidden border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            작업 내역 상세
          </h3>
        </div>
        <div className="overflow-x-auto">
          {workLogs.length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-medium">
                <tr>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider">작업 유형</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider">위치</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider">상세 내용</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider text-center">
                    인원
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {workLogs.map((log: any, index: number) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                      {log.work_type}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{log.location}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 max-w-xs">
                      {log.description}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-gray-900 dark:text-gray-100">
                      {log.worker_count}명
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-10 text-center text-gray-400 dark:text-gray-600">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p>기록된 작업 내역 상세가 없습니다.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Subcontractor Workers */}
      <Card className="overflow-hidden border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-500" />
            협력업체 투입 정보
          </h3>
        </div>
        <div className="p-4">
          {subcontractorWorkers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subcontractorWorkers.map((sub: any, index: number) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-100 dark:border-gray-700 shadow-sm">
                      <Building2 className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-gray-100">
                        {sub.subcontractor_name}
                      </p>
                      {sub.work_type && (
                        <p className="text-[11px] text-gray-500 font-medium uppercase tracking-tight">
                          {sub.work_type}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                      {sub.worker_count}
                      <span className="text-xs font-normal text-gray-400 ml-0.5">명</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-gray-400 dark:text-gray-600">
              <Building2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p>기록된 협력업체 투입 정보가 없습니다.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
