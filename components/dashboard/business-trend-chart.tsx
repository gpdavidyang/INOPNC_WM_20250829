'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface DateRange {
  from: Date
  to: Date
}

interface BusinessTrendChartProps {
  title: string
  type: 'daily_reports' | 'worker_count' | 'material_usage' | 'equipment_utilization' | 
        'productivity_score' | 'task_completion_rate' | 'safety_incidents' | 'safety_inspection_rate'
  dateRange: DateRange
  selectedSite: string
}

interface TrendData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    borderColor: string
    backgroundColor: string
    tension: number
  }>
}

const chartColors = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  cyan: '#06B6D4'
}

const chartConfigs = {
  daily_reports: {
    color: chartColors.primary,
    label: '일일 보고서 수',
    unit: '건'
  },
  worker_count: {
    color: chartColors.secondary,
    label: '활성 작업자 수',
    unit: '명'
  },
  material_usage: {
    color: chartColors.accent,
    label: '자재 사용률',
    unit: '%'
  },
  equipment_utilization: {
    color: chartColors.purple,
    label: '장비 가동률',
    unit: '%'
  },
  productivity_score: {
    color: chartColors.cyan,
    label: '생산성 점수',
    unit: '점'
  },
  task_completion_rate: {
    color: chartColors.secondary,
    label: '작업 완료율',
    unit: '%'
  },
  safety_incidents: {
    color: chartColors.danger,
    label: '안전 사고 건수',
    unit: '건'
  },
  safety_inspection_rate: {
    color: chartColors.primary,
    label: '안전 점검 완료율',
    unit: '%'
  }
}

export function BusinessTrendChart({ title, type, dateRange, selectedSite }: BusinessTrendChartProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trendData, setTrendData] = useState<TrendData | null>(null)

  useEffect(() => {
    async function fetchTrendData() {
      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          type,
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString(),
          site: selectedSite
        })

        const response = await fetch(`/api/analytics/trends?${params}`)
        if (!response.ok) {
          throw new Error('Failed to fetch trend data')
        }

        const data = await response.json()
        setTrendData(data.trendData)
      } catch (error) {
        console.error('Error fetching trend data:', error)
        setError(error instanceof Error ? error.message : 'Unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrendData()
  }, [type, dateRange, selectedSite])

  const config = chartConfigs[type]

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            return `${config.label}: ${context.parsed.y}${config.unit}`
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false
        }
      },
      y: {
        display: true,
        beginAtZero: true,
        grid: {
          color: '#F3F4F6'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>데이터를 불러오는 중...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 animate-pulse rounded"></div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="text-red-600">오류: {error}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            데이터를 불러올 수 없습니다
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!trendData || trendData.labels.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>선택한 기간에 데이터가 없습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            데이터 없음
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = {
    labels: trendData.labels,
    datasets: [
      {
        label: config.label,
        data: trendData.datasets[0]?.data || [],
        borderColor: config.color,
        backgroundColor: config.color + '20',
        tension: 0.4,
        fill: true
      }
    ]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>시간별 추이 분석</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <Line data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  )
}