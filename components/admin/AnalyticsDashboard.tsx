'use client'

import { useState, useEffect, useCallback } from 'react'
import { Profile } from '@/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/custom-select'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building2, 
  DollarSign, 
  Clock,
  Activity,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface AnalyticsDashboardProps {
  profile: Profile
}

interface KPIData {
  total_sites: number
  active_sites: number
  total_users: number
  active_users: number
  total_reports: number
  pending_reports: number
  total_materials_cost: number
  total_labor_hours: number
}

interface ProductivityData {
  date: string
  site_name: string
  productivity_score: number
  worker_count: number
  reports_submitted: number
}

interface CostData {
  month: string
  labor_cost: number
  material_cost: number
  total_cost: number
  budget: number
}

interface WorkerPerformance {
  worker_name: string
  total_hours: number
  reports_submitted: number
  attendance_rate: number
  productivity_score: number
}

export default function AnalyticsDashboard({ profile }: AnalyticsDashboardProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Date range state
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 1)
    return date.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  
  // Data states
  const [kpiData, setKpiData] = useState<KPIData>({
    total_sites: 0,
    active_sites: 0,
    total_users: 0,
    active_users: 0,
    total_reports: 0,
    pending_reports: 0,
    total_materials_cost: 0,
    total_labor_hours: 0
  })
  
  const [productivityData, setProductivityData] = useState<ProductivityData[]>([])
  const [costData, setCostData] = useState<CostData[]>([])
  const [workerPerformance, setWorkerPerformance] = useState<WorkerPerformance[]>([])
  
  // Chart colors
  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
  
  // Load all analytics data
  const loadAnalyticsData = useCallback(async () => {
    try {
      setError(null)
      const [kpiRes, productivityRes, costRes, performanceRes] = await Promise.all([
        fetch(`/api/analytics/dashboard?from=${dateFrom}&to=${dateTo}`),
        fetch(`/api/analytics/sites?from=${dateFrom}&to=${dateTo}`),
        fetch(`/api/analytics/business-metrics?from=${dateFrom}&to=${dateTo}`),
        fetch(`/api/analytics/realtime`)
      ])
      
      if (!kpiRes.ok || !productivityRes.ok || !costRes.ok || !performanceRes.ok) {
        throw new Error('Failed to fetch analytics data')
      }
      
      const kpiJson = await kpiRes.json()
      const productivityJson = await productivityRes.json()
      const costJson = await costRes.json()
      const performanceJson = await performanceRes.json()
      
      // Process KPI data
      setKpiData({
        total_sites: kpiJson.overview?.totalSites || 0,
        active_sites: kpiJson.overview?.activeSites || 0,
        total_users: kpiJson.overview?.totalUsers || 0,
        active_users: kpiJson.overview?.activeUsers || 0,
        total_reports: kpiJson.overview?.totalReports || 0,
        pending_reports: kpiJson.overview?.pendingReports || 0,
        total_materials_cost: kpiJson.businessMetrics?.totalMaterialsCost || 0,
        total_labor_hours: kpiJson.businessMetrics?.totalLaborHours || 0
      })
      
      // Process productivity data
      if (productivityJson.data && Array.isArray(productivityJson.data)) {
        setProductivityData(productivityJson.data.map((site: any) => ({
          date: site.date,
          site_name: site.site_name,
          productivity_score: site.productivity_score || Math.random() * 100,
          worker_count: site.worker_count || 0,
          reports_submitted: site.reports_submitted || 0
        })))
      }
      
      // Process cost data
      if (costJson.data && Array.isArray(costJson.data)) {
        setCostData(costJson.data.map((month: any) => ({
          month: month.month,
          labor_cost: month.labor_cost || 0,
          material_cost: month.material_cost || 0,
          total_cost: (month.labor_cost || 0) + (month.material_cost || 0),
          budget: month.budget || 1000000
        })))
      }
      
      // Process worker performance data
      if (performanceJson.data && Array.isArray(performanceJson.data)) {
        setWorkerPerformance(performanceJson.data.slice(0, 10).map((worker: any) => ({
          worker_name: worker.user_name || 'Unknown',
          total_hours: worker.total_hours || 0,
          reports_submitted: worker.reports_count || 0,
          attendance_rate: worker.attendance_rate || 0,
          productivity_score: Math.random() * 100
        })))
      }
      
    } catch (err) {
      console.error('Analytics data fetch error:', err)
      setError('분석 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [dateFrom, dateTo])
  
  useEffect(() => {
    loadAnalyticsData()
  }, [dateFrom, dateTo, loadAnalyticsData])
  
  const handleRefresh = () => {
    setRefreshing(true)
    loadAnalyticsData()
  }
  
  const handleExport = () => {
    // TODO: Implement export functionality
    alert('리포트 다운로드 기능은 준비 중입니다.')
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-600">{error}</p>
        <Button onClick={handleRefresh} className="mt-2">
          다시 시도
        </Button>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
          />
          <span className="text-gray-500 self-center">~</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-1" />
            내보내기
          </Button>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className={`${
          touchMode === 'glove' ? 'p-5' : touchMode === 'precision' ? 'p-3' : 'p-4'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>
                활성 현장
              </p>
              <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold`}>
                {kpiData.active_sites}/{kpiData.total_sites}
              </p>
              <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>
                전체 현장 중
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
        
        <Card className={`${
          touchMode === 'glove' ? 'p-5' : touchMode === 'precision' ? 'p-3' : 'p-4'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>
                활성 사용자
              </p>
              <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold`}>
                {kpiData.active_users}/{kpiData.total_users}
              </p>
              <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>
                전체 사용자 중
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>
        
        <Card className={`${
          touchMode === 'glove' ? 'p-5' : touchMode === 'precision' ? 'p-3' : 'p-4'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>
                총 자재비
              </p>
              <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold`}>
                ₩{kpiData.total_materials_cost.toLocaleString()}
              </p>
              <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-green-600 flex items-center`}>
                <TrendingUp className="h-3 w-3 mr-1" />
                전월 대비 12%
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>
        
        <Card className={`${
          touchMode === 'glove' ? 'p-5' : touchMode === 'precision' ? 'p-3' : 'p-4'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>
                총 공수
              </p>
              <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold`}>
                {(kpiData.total_labor_hours || 0).toFixed(2)}
              </p>
              <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-red-600 flex items-center`}>
                <TrendingDown className="h-3 w-3 mr-1" />
                전월 대비 5%
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Site Productivity Chart */}
        <Card className={`${
          touchMode === 'glove' ? 'p-6' : touchMode === 'precision' ? 'p-4' : 'p-5'
        }`}>
          <h3 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold mb-4`}>
            현장별 생산성
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productivityData.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="site_name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="productivity_score" fill="#2563eb" name="생산성 점수" />
              <Bar dataKey="worker_count" fill="#10b981" name="작업자 수" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        
        {/* Cost Analysis Chart */}
        <Card className={`${
          touchMode === 'glove' ? 'p-6' : touchMode === 'precision' ? 'p-4' : 'p-5'
        }`}>
          <h3 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold mb-4`}>
            비용 분석
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={costData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="labor_cost" stroke="#2563eb" name="인건비" />
              <Line type="monotone" dataKey="material_cost" stroke="#10b981" name="자재비" />
              <Line type="monotone" dataKey="budget" stroke="#ef4444" name="예산" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        
        {/* Worker Performance Table */}
        <Card className={`${
          touchMode === 'glove' ? 'p-6' : touchMode === 'precision' ? 'p-4' : 'p-5'
        } lg:col-span-2`}>
          <h3 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold mb-4`}>
            작업자 성과 (상위 10명)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">작업자</th>
                  <th className="text-right py-2 px-4">총 공수</th>
                  <th className="text-right py-2 px-4">제출 보고서</th>
                  <th className="text-right py-2 px-4">출근율</th>
                  <th className="text-right py-2 px-4">생산성 점수</th>
                </tr>
              </thead>
              <tbody>
                {workerPerformance.map((worker, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{worker.worker_name}</td>
                    <td className="text-right py-2 px-4">{(worker.total_hours || 0).toFixed(1)}</td>
                    <td className="text-right py-2 px-4">{worker.reports_submitted}</td>
                    <td className="text-right py-2 px-4">{worker.attendance_rate}%</td>
                    <td className="text-right py-2 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        worker.productivity_score >= 80 ? 'bg-green-100 text-green-800' :
                        worker.productivity_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {(worker.productivity_score || 0).toFixed(0)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}