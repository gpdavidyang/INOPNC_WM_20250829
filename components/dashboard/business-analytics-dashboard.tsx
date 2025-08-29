'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/custom-select'
import { Calendar, Download, TrendingUp, TrendingDown, Users, FileText, Package, AlertCircle } from 'lucide-react'
import { BusinessKPICards } from '@/components/dashboard/business-kpi-cards'
import { BusinessTrendChart } from '@/components/dashboard/business-trend-chart'
import { SiteComparisonChart } from '@/components/dashboard/site-comparison-chart'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface User {
  id: string
  email: string
}

interface Profile {
  role: string
  organization_id: string
  site_id?: string
}

interface BusinessAnalyticsDashboardProps {
  user: User
  profile: Profile
}

interface DateRange {
  from: Date
  to: Date
}

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

export function BusinessAnalyticsDashboard({ user, profile }: BusinessAnalyticsDashboardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null)
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  })
  const [sites, setSites] = useState<Array<{id: string, name: string}>>([])

  // Fetch available sites
  useEffect(() => {
    async function fetchSites() {
      try {
        const response = await fetch('/api/analytics/sites')
        if (!response.ok) throw new Error('Failed to fetch sites')
        const data = await response.json()
        setSites(data.sites || [])
      } catch (error) {
        console.error('Error fetching sites:', error)
      }
    }

    fetchSites()
  }, [])

  // Fetch business metrics
  useEffect(() => {
    async function fetchMetrics() {
      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString(),
          site: selectedSite
        })

        const response = await fetch(`/api/analytics/business-metrics?${params}`)
        if (!response.ok) {
          throw new Error('Failed to fetch business metrics')
        }

        const data = await response.json()
        setMetrics(data.metrics)
      } catch (error) {
        console.error('Error fetching business metrics:', error)
        setError(error instanceof Error ? error.message : 'Unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
  }, [dateRange, selectedSite])

  const handleExportReport = async (format: 'pdf' | 'excel') => {
    try {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        site: selectedSite,
        format
      })

      const response = await fetch(`/api/analytics/export?${params}`)
      if (!response.ok) throw new Error('Failed to export report')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `business-analytics-${format}-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      setError('Failed to export report')
    }
  }

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            className="w-full sm:w-auto"
          />
          
          <Select value={selectedSite} onValueChange={setSelectedSite}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="현장 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 현장</SelectItem>
              {sites.map((site) => (
                <SelectItem key={site.id} value={site.id}>
                  {site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleExportReport('excel')}
            disabled={isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExportReport('pdf')}
            disabled={isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <BusinessKPICards metrics={metrics} isLoading={isLoading} />

      {/* Charts and Analysis */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">트렌드 분석</TabsTrigger>
          <TabsTrigger value="comparison">현장 비교</TabsTrigger>
          <TabsTrigger value="productivity">생산성 지표</TabsTrigger>
          <TabsTrigger value="safety">안전 분석</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BusinessTrendChart
              title="일일 보고서 추이"
              type="daily_reports"
              dateRange={dateRange}
              selectedSite={selectedSite}
            />
            <BusinessTrendChart
              title="작업자 현황 추이"
              type="worker_count"
              dateRange={dateRange}
              selectedSite={selectedSite}
            />
            <BusinessTrendChart
              title="자재 사용량 추이"
              type="material_usage"
              dateRange={dateRange}
              selectedSite={selectedSite}
            />
            <BusinessTrendChart
              title="장비 가동률 추이"
              type="equipment_utilization"
              dateRange={dateRange}
              selectedSite={selectedSite}
            />
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <SiteComparisonChart dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="productivity" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>생산성 지표</CardTitle>
                <CardDescription>작업 효율성 및 생산성 분석</CardDescription>
              </CardHeader>
              <CardContent>
                <BusinessTrendChart
                  title="일일 생산성 점수"
                  type="productivity_score"
                  dateRange={dateRange}
                  selectedSite={selectedSite}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>작업 완료율</CardTitle>
                <CardDescription>계획 대비 실제 작업 완료 현황</CardDescription>
              </CardHeader>
              <CardContent>
                <BusinessTrendChart
                  title="작업 완료율"
                  type="task_completion_rate"
                  dateRange={dateRange}
                  selectedSite={selectedSite}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="safety" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>안전 사고 현황</CardTitle>
                <CardDescription>안전 사고 발생 추이 및 분석</CardDescription>
              </CardHeader>
              <CardContent>
                <BusinessTrendChart
                  title="안전 사고 건수"
                  type="safety_incidents"
                  dateRange={dateRange}
                  selectedSite={selectedSite}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>안전 점검 현황</CardTitle>
                <CardDescription>안전 점검 실시 및 완료 현황</CardDescription>
              </CardHeader>
              <CardContent>
                <BusinessTrendChart
                  title="안전 점검 완료율"
                  type="safety_inspection_rate"
                  dateRange={dateRange}
                  selectedSite={selectedSite}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}