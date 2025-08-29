'use client'

/**
 * Real-time Monitoring Dashboard for INOPNC Work Management System
 * Displays comprehensive system health, performance metrics, and construction-specific insights
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Globe, 
  HardDrive, 
  Monitor, 
  Server, 
  TrendingUp, 
  Users, 
  Zap,
  Construction,
  FileText,
  UserCheck,
  FolderOpen,
  MapPin
} from 'lucide-react'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { monitoringManager } from '@/lib/monitoring/monitoring-manager'
import { apiMonitor } from '@/lib/monitoring/api-monitoring'
import { performanceTracker } from '@/lib/monitoring/performance-metrics'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

// Types for dashboard data
interface DashboardMetrics {
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical'
    score: number
    uptime: string
    lastChecked: string
  }
  performance: {
    avgResponseTime: number
    p95ResponseTime: number
    errorRate: number
    requestsPerMinute: number
    dbQueryTime: number
  }
  construction: {
    dailyReports: {
      created: number
      avgTime: number
      errors: number
    }
    attendance: {
      checkins: number
      avgTime: number
      failures: number
    }
    documents: {
      uploads: number
      avgTime: number
      failures: number
    }
    sites: {
      active: number
      avgResponseTime: number
    }
  }
  alerts: Array<{
    id: string
    severity: 'info' | 'warning' | 'error' | 'critical'
    message: string
    timestamp: string
    resolved: boolean
  }>
  realTimeData: {
    timestamps: string[]
    responseTime: number[]
    requestCount: number[]
    errorRate: number[]
    memoryUsage: number[]
  }
}

// Utility functions
const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'healthy': return 'text-green-600'
    case 'warning': return 'text-yellow-600'
    case 'critical': return 'text-red-600'
    default: return 'text-gray-600'
  }
}

const getAlertColor = (severity: string): string => {
  switch (severity) {
    case 'info': return 'bg-blue-100 text-blue-800'
    case 'warning': return 'bg-yellow-100 text-yellow-800'
    case 'error': return 'bg-red-100 text-red-800'
    case 'critical': return 'bg-red-200 text-red-900'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// Dashboard component
export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Fetch monitoring data
  const fetchMetrics = useCallback(async () => {
    try {
      // Get data from monitoring managers
      const [systemHealth, apiMetrics, performanceMetrics] = await Promise.all([
        monitoringManager.getSystemHealth(),
        apiMonitor.getMetrics(),
        performanceTracker.getPerformanceSummary()
      ])

      // Get construction metrics
      const constructionMetrics = apiMonitor.getConstructionMetrics()

      // Get active alerts
      const alerts = await monitoringManager.getActiveAlerts()

      // Mock real-time data (in production, this would come from time-series database)
      const now = new Date()
      const timestamps = Array.from({ length: 20 }, (_, i) => {
        const time = new Date(now.getTime() - (19 - i) * 30000) // 30-second intervals
        return time.toLocaleTimeString()
      })

      const mockRealTimeData = {
        timestamps,
        responseTime: Array.from({ length: 20 }, () => 200 + Math.random() * 300),
        requestCount: Array.from({ length: 20 }, () => 10 + Math.random() * 20),
        errorRate: Array.from({ length: 20 }, () => Math.random() * 2),
        memoryUsage: Array.from({ length: 20 }, () => 40 + Math.random() * 20),
      }

      const dashboardMetrics: DashboardMetrics = {
        systemHealth: {
          status: systemHealth.error_rate > 5 ? 'critical' : 
                 systemHealth.avg_response_time > 1000 ? 'warning' : 'healthy',
          score: Math.max(0, 100 - systemHealth.error_rate * 10 - (systemHealth.avg_response_time / 100)),
          uptime: '99.9%',
          lastChecked: new Date().toISOString()
        },
        performance: {
          avgResponseTime: apiMetrics.avgResponseTime,
          p95ResponseTime: performanceMetrics.apiResponseTime?.p95 || 0,
          errorRate: apiMetrics.errorRate,
          requestsPerMinute: apiMetrics.requestsPerMinute,
          dbQueryTime: performanceMetrics.databaseQueryTime?.avg || 0
        },
        construction: {
          dailyReports: {
            created: constructionMetrics.dailyReports.creates,
            avgTime: constructionMetrics.dailyReports.avgCreateTime,
            errors: 0 // Would calculate from error metrics
          },
          attendance: {
            checkins: constructionMetrics.attendance.checkins,
            avgTime: constructionMetrics.attendance.avgCheckinTime,
            failures: constructionMetrics.attendance.syncFailures
          },
          documents: {
            uploads: constructionMetrics.documents.uploads,
            avgTime: constructionMetrics.documents.avgUploadTime,
            failures: constructionMetrics.documents.uploadFailures
          },
          sites: {
            active: systemHealth.active_users, // Using active users as proxy
            avgResponseTime: constructionMetrics.sites.avgFetchTime
          }
        },
        alerts: alerts.map(alert => ({
          id: alert.id,
          severity: alert.severity.toLowerCase() as any,
          message: alert.message,
          timestamp: alert.timestamp,
          resolved: alert.resolved
        })),
        realTimeData: mockRealTimeData
      }

      setMetrics(dashboardMetrics)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch monitoring metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Auto-refresh effect
  useEffect(() => {
    fetchMetrics()

    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, 30000) // 30 seconds
      return () => clearInterval(interval)
    }
  }, [fetchMetrics, autoRefresh])

  if (isLoading || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading monitoring data...</p>
        </div>
      </div>
    )
  }

  // Chart configurations
  const responseTimeChartData = {
    labels: metrics.realTimeData.timestamps,
    datasets: [
      {
        label: 'Response Time (ms)',
        data: metrics.realTimeData.responseTime,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  }

  const requestVolumeChartData = {
    labels: metrics.realTimeData.timestamps,
    datasets: [
      {
        label: 'Requests/min',
        data: metrics.realTimeData.requestCount,
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
      },
    ],
  }

  const constructionMetricsChartData = {
    labels: ['Daily Reports', 'Attendance', 'Documents', 'Sites'],
    datasets: [
      {
        data: [
          metrics.construction.dailyReports.created,
          metrics.construction.attendance.checkins,
          metrics.construction.documents.uploads,
          metrics.construction.sites.active,
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',   // Red
          'rgba(59, 130, 246, 0.8)',  // Blue
          'rgba(34, 197, 94, 0.8)',   // Green
          'rgba(245, 158, 11, 0.8)',  // Yellow
        ],
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
          <p className="text-gray-600">
            Real-time monitoring for INOPNC Construction Management System
          </p>
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              autoRefresh 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
          <button
            onClick={fetchMetrics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className={`h-6 w-6 ${getStatusColor(metrics.systemHealth.status)}`} />
              <div>
                <div className="text-2xl font-bold">{Math.round(metrics.systemHealth.score)}%</div>
                <Badge className={getStatusColor(metrics.systemHealth.status)}>
                  {metrics.systemHealth.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Clock className="h-6 w-6 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">
                  {formatDuration(metrics.performance.avgResponseTime)}
                </div>
                <div className="text-sm text-gray-500">
                  P95: {formatDuration(metrics.performance.p95ResponseTime)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <AlertTriangle className={`h-6 w-6 ${
                metrics.performance.errorRate > 5 ? 'text-red-600' : 
                metrics.performance.errorRate > 2 ? 'text-yellow-600' : 'text-green-600'
              }`} />
              <div>
                <div className="text-2xl font-bold">
                  {metrics.performance.errorRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">
                  {metrics.performance.requestsPerMinute.toFixed(0)} req/min
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Activity className={`h-6 w-6 ${
                metrics.alerts.filter(a => !a.resolved).length > 0 ? 'text-red-600' : 'text-green-600'
              }`} />
              <div>
                <div className="text-2xl font-bold">
                  {metrics.alerts.filter(a => !a.resolved).length}
                </div>
                <div className="text-sm text-gray-500">
                  {metrics.alerts.length} total
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="construction">Construction</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Response Time Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Response Time Trend</span>
                </CardTitle>
                <CardDescription>API response times over the last 10 minutes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Line data={responseTimeChartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            {/* Request Volume Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Request Volume</span>
                </CardTitle>
                <CardDescription>API requests per minute</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Bar data={requestVolumeChartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Database Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg Query Time</span>
                    <span className="font-medium">
                      {formatDuration(metrics.performance.dbQueryTime)}
                    </span>
                  </div>
                  <Progress value={Math.min(100, metrics.performance.dbQueryTime / 10)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">API Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg Response</span>
                    <span className="font-medium">
                      {formatDuration(metrics.performance.avgResponseTime)}
                    </span>
                  </div>
                  <Progress value={Math.min(100, metrics.performance.avgResponseTime / 20)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">System Load</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Requests/min</span>
                    <span className="font-medium">
                      {metrics.performance.requestsPerMinute.toFixed(0)}
                    </span>
                  </div>
                  <Progress value={Math.min(100, metrics.performance.requestsPerMinute / 2)} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Construction Metrics Tab */}
        <TabsContent value="construction" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Construction Metrics Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Construction className="h-5 w-5" />
                  <span>Construction Metrics Distribution</span>
                </CardTitle>
                <CardDescription>Today's activity across construction features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Doughnut data={constructionMetricsChartData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }} />
                </div>
              </CardContent>
            </Card>

            {/* Construction Feature Performance */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <FileText className="h-4 w-4" />
                    <span>Daily Reports</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Created Today</div>
                      <div className="text-lg font-bold">{metrics.construction.dailyReports.created}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Avg Time</div>
                      <div className="text-lg font-bold">
                        {formatDuration(metrics.construction.dailyReports.avgTime)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <UserCheck className="h-4 w-4" />
                    <span>Attendance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Check-ins</div>
                      <div className="text-lg font-bold">{metrics.construction.attendance.checkins}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Failures</div>
                      <div className="text-lg font-bold text-red-600">
                        {metrics.construction.attendance.failures}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <FolderOpen className="h-4 w-4" />
                    <span>Documents</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Uploads</div>
                      <div className="text-lg font-bold">{metrics.construction.documents.uploads}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Avg Time</div>
                      <div className="text-lg font-bold">
                        {formatDuration(metrics.construction.documents.avgTime)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {metrics.alerts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-gray-600">No active alerts. System is running smoothly!</p>
                </CardContent>
              </Card>
            ) : (
              metrics.alerts
                .sort((a, b) => {
                  // Sort by resolved status (unresolved first), then by severity, then by timestamp
                  if (a.resolved !== b.resolved) return a.resolved ? 1 : -1
                  const severityOrder = { critical: 0, error: 1, warning: 2, info: 3 }
                  return severityOrder[a.severity] - severityOrder[b.severity]
                })
                .map((alert) => (
                  <Card key={alert.id} className={alert.resolved ? 'opacity-60' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                            alert.severity === 'critical' ? 'text-red-600' :
                            alert.severity === 'error' ? 'text-red-500' :
                            alert.severity === 'warning' ? 'text-yellow-600' :
                            'text-blue-600'
                          }`} />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{alert.message}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(alert.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getAlertColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          {alert.resolved && (
                            <Badge className="bg-green-100 text-green-800">
                              RESOLVED
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}