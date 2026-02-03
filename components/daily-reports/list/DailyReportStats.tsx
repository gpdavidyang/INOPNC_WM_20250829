'use client'

import { Card } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Clock, FileText, Package, TrendingUp, Users } from 'lucide-react'

interface Stats {
  totalReports: number
  draftReports: number
  submittedReports: number
  approvedReports: number
  rejectedReports: number
  totalWorkers: number
  totalNPC1000Used: number
  averageWorkersPerDay: number
}

interface DailyReportStatsProps {
  stats: Stats
}

export const DailyReportStats = ({ stats }: DailyReportStatsProps) => {
  const statCards = [
    {
      label: '전체 보고서',
      value: stats.totalReports,
      icon: <FileText className="w-5 h-5 text-blue-500" />,
      color: 'bg-blue-50 dark:bg-blue-900/20',
      details: [
        { label: '임시', value: stats.draftReports, icon: <Clock className="w-3 h-3" /> },
        { label: '제출', value: stats.submittedReports, icon: <FileText className="w-3 h-3" /> },
        { label: '승인', value: stats.approvedReports, icon: <CheckCircle className="w-3 h-3" /> },
        { label: '반려', value: stats.rejectedReports, icon: <AlertCircle className="w-3 h-3" /> },
      ],
    },
    {
      label: '누적 투입 인원',
      value: `${stats.totalWorkers}명`,
      icon: <Users className="w-5 h-5 text-green-500" />,
      color: 'bg-green-50 dark:bg-green-900/20',
      helper: `평균 ${stats.averageWorkersPerDay}명 / 일`,
    },
    {
      label: '누적 자재 사용',
      value: `${Math.round(stats.totalNPC1000Used).toLocaleString()}kg`,
      icon: <Package className="w-5 h-5 text-orange-500" />,
      color: 'bg-orange-50 dark:bg-orange-900/20',
      helper: 'NPC1000 기준',
    },
    {
      label: '작업 효율',
      value:
        stats.totalReports > 0
          ? `${Math.round((stats.approvedReports / stats.totalReports) * 100)}%`
          : '0%',
      icon: <TrendingUp className="w-5 h-5 text-purple-500" />,
      color: 'bg-purple-50 dark:bg-purple-900/20',
      helper: '승인 완료 비율',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statCards.map((card, idx) => (
        <Card
          key={idx}
          className="p-5 border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden relative group"
        >
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                {card.label}
              </p>
              <h4 className="text-2xl font-black text-gray-900 dark:text-gray-100">{card.value}</h4>
            </div>
            <div
              className={`p-2.5 rounded-xl ${card.color} transition-transform group-hover:scale-110`}
            >
              {card.icon}
            </div>
          </div>

          {card.details ? (
            <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1">
              {card.details.map((detail, dIdx) => (
                <div
                  key={dIdx}
                  className="flex items-center gap-1 text-[10px] font-bold text-gray-500"
                >
                  <span className="opacity-70">{detail.icon}</span>
                  <span>
                    {detail.label}: {detail.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-[11px] font-medium text-gray-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              {card.helper}
            </p>
          )}

          {/* Subtle background decoration */}
          <div
            className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full ${card.color} opacity-20 blur-2xl group-hover:opacity-30 transition-opacity`}
          />
        </Card>
      ))}
    </div>
  )
}
