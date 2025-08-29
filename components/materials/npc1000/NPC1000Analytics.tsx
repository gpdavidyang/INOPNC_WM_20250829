'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  Activity,
  PieChart,
  Building2,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from 'date-fns'
import { ko } from 'date-fns/locale'

interface UsageData {
  date: string
  usage: number
  cumulative: number
}

interface SiteUsageData {
  site_id: string
  site_name: string
  total_usage: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
  trend_percentage: number
}

interface ForecastData {
  date: string
  projected_usage: number
  confidence_low: number
  confidence_high: number
}

interface NPC1000AnalyticsProps {
  siteId: string
}

export function NPC1000Analytics({ siteId }: NPC1000AnalyticsProps) {
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('month')
  const [usageData, setUsageData] = useState<UsageData[]>([])
  const [siteUsageData, setSiteUsageData] = useState<SiteUsageData[]>([])
  const [forecastData, setForecastData] = useState<ForecastData[]>([])
  const [stats, setStats] = useState({
    totalUsage: 0,
    averageDailyUsage: 0,
    peakUsage: 0,
    peakDate: '',
    trend: 'stable' as 'up' | 'down' | 'stable',
    trendPercentage: 0
  })

  useEffect(() => {
    if (siteId) {
      loadAnalytics()
    }
  }, [siteId, period])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      // Mock data generation
      const endDate = new Date()
      const startDate = period === 'month' ? startOfMonth(endDate) : subMonths(endDate, 3)
      const days = eachDayOfInterval({ start: startDate, end: endDate })
      
      // Generate usage data
      let cumulative = 0
      const usage = days.map(date => {
        const daily = Math.floor(Math.random() * 200) + 50
        cumulative += daily
        return {
          date: format(date, 'yyyy-MM-dd'),
          usage: daily,
          cumulative
        }
      })
      setUsageData(usage)

      // Generate site usage data
      const sites: SiteUsageData[] = [
        {
          site_id: '1',
          site_name: '서울 강남 현장',
          total_usage: 3500,
          percentage: 45,
          trend: 'up',
          trend_percentage: 12
        },
        {
          site_id: '2',
          site_name: '부산 해운대 현장',
          total_usage: 2100,
          percentage: 27,
          trend: 'stable',
          trend_percentage: 2
        },
        {
          site_id: '3',
          site_name: '인천 송도 현장',
          total_usage: 1500,
          percentage: 19,
          trend: 'down',
          trend_percentage: -8
        },
        {
          site_id: '4',
          site_name: '대전 유성 현장',
          total_usage: 700,
          percentage: 9,
          trend: 'up',
          trend_percentage: 15
        }
      ]
      setSiteUsageData(sites)

      // Generate forecast data
      const forecast: ForecastData[] = Array.from({ length: 30 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() + i + 1)
        const base = 120 + Math.sin(i / 5) * 30
        return {
          date: format(date, 'yyyy-MM-dd'),
          projected_usage: Math.floor(base + Math.random() * 20),
          confidence_low: Math.floor(base - 30),
          confidence_high: Math.floor(base + 30)
        }
      })
      setForecastData(forecast)

      // Calculate stats
      const totalUsage = usage.reduce((sum: any, day: any) => sum + day.usage, 0)
      const peakDay = usage.reduce((peak, day) => 
        day.usage > peak.usage ? day : peak
      )
      
      setStats({
        totalUsage,
        averageDailyUsage: Math.floor(totalUsage / days.length),
        peakUsage: peakDay.usage,
        peakDate: peakDay.date,
        trend: totalUsage > 3000 ? 'up' : 'stable',
        trendPercentage: 8.5
      })
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (trend: string, size = 'w-4 h-4') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className={cn(size, 'text-red-600')} />
      case 'down':
        return <TrendingDown className={cn(size, 'text-green-600')} />
      default:
        return <Activity className={cn(size, 'text-gray-600')} />
    }
  }

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">분석 데이터를 불러오는 중...</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Period Selector and Actions */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant={period === 'month' ? 'primary' : 'outline'}
            size="compact"
            onClick={() => setPeriod('month')}
          >
            월간
          </Button>
          <Button
            variant={period === 'quarter' ? 'primary' : 'outline'}
            size="compact"
            onClick={() => setPeriod('quarter')}
          >
            분기
          </Button>
        </div>
        <Button variant="outline" size="compact">
          <Download className="w-4 h-4 mr-2" />
          보고서 다운로드
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 사용량</p>
              <p className="text-xl font-bold mt-1">
                {stats.totalUsage.toLocaleString()} kg
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">일평균 사용량</p>
              <p className="text-xl font-bold mt-1">
                {stats.averageDailyUsage} kg
              </p>
            </div>
            <Activity className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">최대 사용일</p>
              <p className="text-xl font-bold mt-1">
                {stats.peakUsage} kg
              </p>
              <p className="text-xs text-gray-500">
                {format(new Date(stats.peakDate), 'MM.dd')}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">사용 추세</p>
              <div className="flex items-center gap-2 mt-1">
                {getTrendIcon(stats.trend, 'w-6 h-6')}
                <span className={cn(
                  'text-xl font-bold',
                  stats.trend === 'up' ? 'text-red-600' : 
                  stats.trend === 'down' ? 'text-green-600' : 
                  'text-gray-600'
                )}>
                  {stats.trendPercentage > 0 ? '+' : ''}{stats.trendPercentage}%
                </span>
              </div>
            </div>
            {getTrendIcon(stats.trend, 'w-8 h-8')}
          </div>
        </Card>
      </div>

      {/* Usage Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">일별 사용량 추이</h3>
        <div className="h-64 flex items-end justify-between gap-1">
          {usageData.map((day, index) => (
            <div
              key={day.date}
              className="flex-1 bg-blue-500 hover:bg-blue-600 transition-colors rounded-t relative group"
              style={{ height: `${(day.usage / stats.peakUsage) * 100}%` }}
            >
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {format(new Date(day.date), 'MM.dd')}: {day.usage}kg
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{format(new Date(usageData[0]?.date || new Date()), 'MM.dd')}</span>
          <span>{format(new Date(usageData[usageData.length - 1]?.date || new Date()), 'MM.dd')}</span>
        </div>
      </Card>

      {/* Site Usage Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">현장별 사용 비율</h3>
          <div className="space-y-4">
            {siteUsageData.map((site: any) => (
              <div key={site.site_id}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium">{site.site_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {site.total_usage.toLocaleString()} kg
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {site.percentage}%
                    </Badge>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${site.percentage}%` }}
                  />
                </div>
                <div className="flex justify-end mt-1">
                  <div className="flex items-center gap-1">
                    {getTrendIcon(site.trend)}
                    <span className={cn(
                      'text-xs',
                      site.trend === 'up' ? 'text-red-600' : 
                      site.trend === 'down' ? 'text-green-600' : 
                      'text-gray-600'
                    )}>
                      {site.trend_percentage > 0 ? '+' : ''}{site.trend_percentage}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Usage Forecast */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">30일 사용량 예측</h3>
          <div className="h-48 relative">
            <div className="absolute inset-0 flex items-end justify-between gap-1">
              {forecastData.slice(0, 30).map((day, index) => (
                <div key={day.date} className="flex-1 relative">
                  <div
                    className="absolute bottom-0 w-full bg-blue-200 rounded-t"
                    style={{
                      height: `${(day.confidence_high / 200) * 100}%`
                    }}
                  />
                  <div
                    className="absolute bottom-0 w-full bg-blue-400 rounded-t"
                    style={{
                      height: `${(day.projected_usage / 200) * 100}%`
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 bg-blue-400 rounded" />
              <span>예상 사용량</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 bg-blue-200 rounded" />
              <span>신뢰 구간</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              * 과거 3개월 데이터 기반 예측
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}