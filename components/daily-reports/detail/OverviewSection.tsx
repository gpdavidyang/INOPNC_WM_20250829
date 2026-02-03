'use client'

import { Card } from '@/components/ui/card'
import { AlertCircle, User, Users, Wrench } from 'lucide-react'

interface OverviewSectionProps {
  report: any
  formData: any
}

export const OverviewSection = ({ report, formData }: OverviewSectionProps) => {
  const workers = report?.workers || formData?.workers || []
  const totalHours = workers.reduce(
    (sum: number, worker: any) => sum + Number(worker.hours ?? worker.labor_hours ?? 0),
    0
  )

  const memberName = report?.memberName || report?.member_name || report?.memberTypes?.[0] || '-'
  const processType =
    report?.processType || report?.process_type || report?.workProcesses?.[0] || '-'
  const workSection = report?.workSection || formData?.work_section || report?.workTypes?.[0] || '-'

  return (
    <div className="space-y-6">
      {/* Work Content */}
      <Card className="p-5 border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-blue-500" />
          작업 내용
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-1">
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">부재명</dt>
            <dd className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {memberName}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">공정</dt>
            <dd className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {processType}
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">작업구간</dt>
            <dd className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {workSection}
            </dd>
          </div>
        </div>
      </Card>

      {/* Workforce Summary */}
      <Card className="p-5 border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-green-500" />
          작업 인력 요약
        </h3>
        {workers.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {workers.map((worker: any, index: number) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3.5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-gray-100">
                        {worker.workerName || worker.name || worker.worker_name}
                      </p>
                      <p className="text-xs text-gray-500">{worker.position || '작업자'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-blue-600 dark:text-blue-400">
                      {worker.hours || worker.labor_hours || 0} 공수
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">
                총 작업인원:{' '}
                <span className="text-gray-900 dark:text-gray-100 font-bold">
                  {workers.length}명
                </span>
              </span>
              <span className="text-sm font-medium text-gray-600">
                총 작업공수:{' '}
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  {totalHours} 공수
                </span>
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-sm font-medium text-gray-600">총 작업인원</span>
            <span className="text-lg font-black text-gray-900 dark:text-gray-100">
              {report.total_workers || 0}명
            </span>
          </div>
        )}
      </Card>

      {/* Issues */}
      {report.issues && (
        <Card className="p-5 border-gray-200 dark:border-gray-700 shadow-sm bg-orange-50/30 dark:bg-orange-950/10">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            특이사항
          </h3>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {report.issues}
          </p>
        </Card>
      )}
    </div>
  )
}
