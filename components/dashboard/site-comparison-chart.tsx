'use client'

import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface DateRange {
  from: Date
  to: Date
}

interface SiteComparisonChartProps {
  dateRange: DateRange
}

interface SiteComparisonData {
  siteNames: string[]
  metrics: {
    workerCount: number[]
    dailyReports: number[]
    materialUsage: number[]
    productivity: number[]
  }
}

const chartColors = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
]

export function SiteComparisonChart({ dateRange }: SiteComparisonChartProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [comparisonData, setComparisonData] = useState<SiteComparisonData | null>(null)

  useEffect(() => {
    async function fetchComparisonData() {
      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString()
        })

        const response = await fetch(`/api/analytics/site-comparison?${params}`)
        if (!response.ok) {
          throw new Error('Failed to fetch site comparison data')
        }

        const data = await response.json()
        setComparisonData(data.comparisonData)
      } catch (error) {
        console.error('Error fetching site comparison data:', error)
        setError(error instanceof Error ? error.message : 'Unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchComparisonData()
  }, [dateRange])

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-48"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>현장 비교 분석</CardTitle>
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

  if (!comparisonData || comparisonData.siteNames.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>현장 비교 분석</CardTitle>
          <CardDescription>비교할 현장 데이터가 없습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            데이터 없음
          </div>
        </CardContent>
      </Card>
    )
  }

  const workerCountData = {
    labels: comparisonData.siteNames,
    datasets: [
      {
        label: '작업자 수 (명)',
        data: comparisonData.metrics.workerCount,
        backgroundColor: chartColors[0] + '80',
        borderColor: chartColors[0],
        borderWidth: 2
      }
    ]
  }

  const dailyReportsData = {
    labels: comparisonData.siteNames,
    datasets: [
      {
        label: '일일 보고서 수 (건)',
        data: comparisonData.metrics.dailyReports,
        backgroundColor: chartColors[1] + '80',
        borderColor: chartColors[1],
        borderWidth: 2
      }
    ]
  }

  const materialUsageData = {
    labels: comparisonData.siteNames,
    datasets: [
      {
        label: '자재 사용률 (%)',
        data: comparisonData.metrics.materialUsage,
        backgroundColor: chartColors[2] + '80',
        borderColor: chartColors[2],
        borderWidth: 2
      }
    ]
  }

  const productivityData = {
    labels: comparisonData.siteNames,
    datasets: [
      {
        label: '생산성 점수',
        data: comparisonData.metrics.productivity,
        backgroundColor: chartColors[3] + '80',
        borderColor: chartColors[3],
        borderWidth: 2
      }
    ]
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>현장별 작업자 수</CardTitle>
          <CardDescription>현장별 활성 작업자 수 비교</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Bar data={workerCountData} options={options} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>현장별 일일 보고서</CardTitle>
          <CardDescription>현장별 일일 보고서 제출 현황 비교</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Bar data={dailyReportsData} options={options} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>현장별 자재 사용률</CardTitle>
          <CardDescription>현장별 자재 활용 효율성 비교</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Bar data={materialUsageData} options={options} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>현장별 생산성 점수</CardTitle>
          <CardDescription>현장별 전체 생산성 지표 비교</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Bar data={productivityData} options={options} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}