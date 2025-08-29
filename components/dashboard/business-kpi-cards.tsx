'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Users, FileText, Package, Settings, AlertTriangle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BusinessMetrics {
  totalWorkers: number
  activeWorkers: number
  dailyReportsCount: number
  dailyReportsCompletion: number
  materialRequests: number
  materialUsage: number
  equipmentUtilization: number
  safetyIncidents: number
  previousPeriodComparison: {
    totalWorkers: number
    activeWorkers: number
    dailyReportsCount: number
    materialRequests: number
  }
}

interface BusinessKPICardsProps {
  metrics: BusinessMetrics | null
  isLoading: boolean
}

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  isLoading: boolean
  format?: 'number' | 'percentage'
  description?: string
}

function KPICard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon, 
  isLoading, 
  format = 'number',
  description 
}: KPICardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val
    if (format === 'percentage') return `${val.toFixed(1)}%`
    return val.toLocaleString()
  }

  const getChangeColor = (change?: number) => {
    if (!change) return 'text-gray-500'
    return change > 0 ? 'text-green-600' : 'text-red-600'
  }

  const getChangeIcon = (change?: number) => {
    if (!change) return null
    return change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
          </CardTitle>
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-gray-200 rounded animate-pulse w-16 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">
          {formatValue(value)}
        </div>
        {change !== undefined && (
          <div className={cn(
            "flex items-center text-xs mt-1",
            getChangeColor(change)
          )}>
            {getChangeIcon(change)}
            <span className="ml-1">
              {Math.abs(change).toFixed(1)}% {changeLabel || '전월 대비'}
            </span>
          </div>
        )}
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

export function BusinessKPICards({ metrics, isLoading }: BusinessKPICardsProps) {
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  const kpiData = [
    {
      title: '총 등록 작업자',
      value: metrics?.totalWorkers || 0,
      change: metrics ? calculateChange(metrics.totalWorkers, metrics.previousPeriodComparison.totalWorkers) : undefined,
      icon: <Users className="h-4 w-4 text-blue-600" />,
      description: '현재 등록된 전체 작업자 수'
    },
    {
      title: '활성 작업자',
      value: metrics?.activeWorkers || 0,
      change: metrics ? calculateChange(metrics.activeWorkers, metrics.previousPeriodComparison.activeWorkers) : undefined,
      icon: <Users className="h-4 w-4 text-green-600" />,
      description: '현재 활동 중인 작업자 수'
    },
    {
      title: '일일 보고서',
      value: metrics?.dailyReportsCount || 0,
      change: metrics ? calculateChange(metrics.dailyReportsCount, metrics.previousPeriodComparison.dailyReportsCount) : undefined,
      icon: <FileText className="h-4 w-4 text-orange-600" />,
      description: '이번 달 제출된 일일 보고서 수'
    },
    {
      title: '보고서 완료율',
      value: metrics?.dailyReportsCompletion || 0,
      format: 'percentage' as const,
      icon: <CheckCircle className="h-4 w-4 text-emerald-600" />,
      description: '예상 대비 제출된 보고서 비율'
    },
    {
      title: '자재 요청',
      value: metrics?.materialRequests || 0,
      change: metrics ? calculateChange(metrics.materialRequests, metrics.previousPeriodComparison.materialRequests) : undefined,
      icon: <Package className="h-4 w-4 text-purple-600" />,
      description: '이번 달 자재 요청 건수'
    },
    {
      title: '자재 사용량',
      value: metrics?.materialUsage || 0,
      format: 'percentage' as const,
      icon: <Package className="h-4 w-4 text-indigo-600" />,
      description: '계획 대비 자재 사용 비율'
    },
    {
      title: '장비 가동률',
      value: metrics?.equipmentUtilization || 0,
      format: 'percentage' as const,
      icon: <Settings className="h-4 w-4 text-cyan-600" />,
      description: '전체 장비 대비 사용 중인 비율'
    },
    {
      title: '안전 사고',
      value: metrics?.safetyIncidents || 0,
      icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
      description: '이번 달 발생한 안전 사고 건수'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiData.map((kpi, index) => (
        <KPICard
          key={index}
          title={kpi.title}
          value={kpi.value}
          change={kpi.change}
          icon={kpi.icon}
          isLoading={isLoading}
          format={kpi.format}
          description={kpi.description}
        />
      ))}
    </div>
  )
}