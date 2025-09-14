'use client'


interface LaborStats {
  totalSites: number
  activeSites: number
  totalLaborHours: number
  averageDailyHours: number
  overtimeHours?: number
  workingDays?: number
}

interface PartnerLaborHoursSummaryProps {
  stats: LaborStats
  period: 'daily' | 'weekly' | 'monthly'
  onPeriodChange: (period: 'daily' | 'weekly' | 'monthly') => void
}

export default function PartnerLaborHoursSummary({ 
  stats, 
  period, 
  onPeriodChange 
}: PartnerLaborHoursSummaryProps) {
  const periodLabels = {
    daily: '오늘',
    weekly: '이번주',
    monthly: '이번달'
  }

  const formatHours = (hours: number) => {
    if (hours >= 1000) {
      return `${(hours / 1000).toFixed(1)}k시간`
    }
    return `${hours.toFixed(0)}시간`
  }

  return (
    <Card className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 border-0 shadow-lg hover:shadow-xl transition-all duration-200">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header with Period Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-semibold text-lg">
                📊 공수 요약
              </h2>
              <p className="text-white/90 text-sm">
                전체 현장: {stats.totalSites}개 | 활성 현장: {stats.activeSites}개
              </p>
            </div>
            
            {/* Period Toggle */}
            <div className="flex bg-white/20 rounded-lg p-1">
              {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => onPeriodChange(p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    period === p
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  {periodLabels[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-white/80" />
                <span className="text-white/80 text-xs">총 공수</span>
              </div>
              <p className="text-white font-bold text-lg">
                {formatHours(stats.totalLaborHours)}
              </p>
            </div>

            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-white/80" />
                <span className="text-white/80 text-xs">평균 일일 공수</span>
              </div>
              <p className="text-white font-bold text-lg">
                {stats.averageDailyHours.toFixed(0)}시간
              </p>
            </div>

            {stats.overtimeHours !== undefined && (
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-white/80" />
                  <span className="text-white/80 text-xs">초과근무</span>
                </div>
                <p className="text-white font-bold text-lg">
                  {formatHours(stats.overtimeHours)}
                </p>
              </div>
            )}

            {stats.workingDays !== undefined && (
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-white/80" />
                  <span className="text-white/80 text-xs">가동일수</span>
                </div>
                <p className="text-white font-bold text-lg">
                  {stats.workingDays}일
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}