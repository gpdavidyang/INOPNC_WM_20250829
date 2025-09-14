'use client'


// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Types
interface WebVital {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  threshold: { good: number; needs_improvement: number }
}

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  change: number
}

interface SessionData {
  activeUsers: number
  totalSessions: number
  avgSessionDuration: number
  errorRate: number
  topPages: Array<{ page: string; views: number }>
  deviceBreakdown: Array<{ type: string; count: number }>
}

interface ApiPerformance {
  endpoint: string
  avgResponseTime: number
  requestCount: number
  errorRate: number
  p95ResponseTime: number
}

export function PerformanceDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [webVitals, setWebVitals] = useState<WebVital[]>([])
  const [customMetrics, setCustomMetrics] = useState<PerformanceMetric[]>([])
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [apiPerformance, setApiPerformance] = useState<ApiPerformance[]>([])
  const [alerts, setAlerts] = useState<Array<{ type: 'warning' | 'error'; message: string }>>([])

  // Load performance data
  const loadPerformanceData = async () => {
    setIsLoading(true)
    try {
      // Fetch all performance data in parallel
      const [vitalsRes, metricsRes, sessionRes, apiRes] = await Promise.all([
        fetch('/api/analytics/web-vitals'),
        fetch('/api/analytics/custom-metrics'),
        fetch('/api/analytics/session-data'),
        fetch('/api/analytics/api-performance')
      ])

      const [vitalsData, metricsData, sessionDataRes, apiData] = await Promise.all([
        vitalsRes.json(),
        metricsRes.json(),
        sessionRes.json(),
        apiRes.json()
      ])

      setWebVitals(vitalsData)
      setCustomMetrics(metricsData)
      setSessionData(sessionDataRes)
      setApiPerformance(apiData)

      // Generate alerts based on thresholds
      generateAlerts(vitalsData, metricsData, sessionDataRes, apiData)
      
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to load performance data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Generate performance alerts
  const generateAlerts = (
    vitals: WebVital[], 
    metrics: PerformanceMetric[], 
    session: SessionData, 
    api: ApiPerformance[]
  ) => {
    const newAlerts: Array<{ type: 'warning' | 'error'; message: string }> = []

    // Check Web Vitals
    vitals.forEach(vital => {
      if (vital.rating === 'poor') {
        newAlerts.push({
          type: 'error',
          message: `${vital.name} is poor: ${vital.value}${vital.name === 'CLS' ? '' : 'ms'}`
        })
      } else if (vital.rating === 'needs-improvement') {
        newAlerts.push({
          type: 'warning',
          message: `${vital.name} needs improvement: ${vital.value}${vital.name === 'CLS' ? '' : 'ms'}`
        })
      }
    })

    // Check error rate
    if (session && session.errorRate > 5) {
      newAlerts.push({
        type: 'error',
        message: `High error rate: ${session.errorRate.toFixed(1)}%`
      })
    }

    // Check API performance
    api.forEach(endpoint => {
      if (endpoint.avgResponseTime > 1000) {
        newAlerts.push({
          type: 'warning',
          message: `Slow API: ${endpoint.endpoint} (${endpoint.avgResponseTime}ms avg)`
        })
      }
      if (endpoint.errorRate > 5) {
        newAlerts.push({
          type: 'error',
          message: `API errors: ${endpoint.endpoint} (${endpoint.errorRate.toFixed(1)}% error rate)`
        })
      }
    })

    setAlerts(newAlerts)
  }

  // Load data on mount and set up auto-refresh
  useEffect(() => {
    loadPerformanceData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadPerformanceData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Get rating color
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'bg-green-500'
      case 'needs-improvement': return 'bg-yellow-500'
      case 'poor': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  // Get trend icon
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down': return <TrendingUp className="h-4 w-4 text-red-600 transform rotate-180" />
      case 'stable': return <Activity className="h-4 w-4 text-gray-600" />
      default: return null
    }
  }

  // Chart data for Web Vitals timeline
  const webVitalsChartData = {
    labels: ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'],
    datasets: [
      {
        label: 'Current Values',
        data: webVitals.map(vital => vital.value),
        backgroundColor: webVitals.map(vital => {
          switch (vital.rating) {
            case 'good': return 'rgba(34, 197, 94, 0.8)'
            case 'needs-improvement': return 'rgba(234, 179, 8, 0.8)'
            case 'poor': return 'rgba(239, 68, 68, 0.8)'
            default: return 'rgba(156, 163, 175, 0.8)'
          }
        }),
        borderColor: webVitals.map(vital => {
          switch (vital.rating) {
            case 'good': return 'rgb(34, 197, 94)'
            case 'needs-improvement': return 'rgb(234, 179, 8)'
            case 'poor': return 'rgb(239, 68, 68)'
            default: return 'rgb(156, 163, 175)'
          }
        }),
        borderWidth: 2,
      },
    ],
  }

  // Device breakdown chart
  const deviceChartData = sessionData ? {
    labels: sessionData.deviceBreakdown.map(d => d.type),
    datasets: [
      {
        data: sessionData.deviceBreakdown.map(d => d.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
        ],
        borderWidth: 2,
      },
    ],
  } : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Performance Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of application performance and user experience
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {lastUpdated && (
            <span className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadPerformanceData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} variant={alert.type === 'error' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                {alert.type === 'error' ? 'Performance Issue' : 'Performance Warning'}
              </AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="web-vitals">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="custom-metrics">Custom Metrics</TabsTrigger>
          <TabsTrigger value="user-sessions">User Sessions</TabsTrigger>
          <TabsTrigger value="api-performance">API Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {sessionData?.activeUsers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently online
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {apiPerformance.length > 0 
                    ? Math.round(apiPerformance.reduce((acc, api) => acc + api.avgResponseTime, 0) / apiPerformance.length)
                    : 0}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  API endpoints average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {sessionData?.errorRate.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Core Web Vitals</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {webVitals.filter(v => v.rating === 'good').length}/{webVitals.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Metrics passing
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Core Web Vitals Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {webVitals.length > 0 ? (
                  <Bar data={webVitalsChartData} options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { beginAtZero: true }
                    }
                  }} />
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {deviceChartData ? (
                  <Doughnut data={deviceChartData} options={{
                    responsive: true,
                    plugins: { legend: { position: 'bottom' } }
                  }} />
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Core Web Vitals Tab */}
        <TabsContent value="web-vitals" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {webVitals.map((vital) => (
              <Card key={vital.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{vital.name}</CardTitle>
                    <Badge 
                      variant="secondary" 
                      className={`${getRatingColor(vital.rating)} text-white`}
                    >
                      {vital.rating.replace('-', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {vital.value}{vital.name === 'CLS' ? '' : 'ms'}
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Good</span>
                      <span>Poor</span>
                    </div>
                    <Progress 
                      value={Math.min(100, (vital.value / vital.threshold.needs_improvement) * 100)} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0</span>
                      <span>{vital.threshold.good}</span>
                      <span>{vital.threshold.needs_improvement}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Custom Metrics Tab */}
        <TabsContent value="custom-metrics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customMetrics.map((metric) => (
              <Card key={metric.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                    {getTrendIcon(metric.trend)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metric.value}{metric.unit}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {metric.change > 0 ? '+' : ''}{metric.change}% from last period
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* User Sessions Tab */}
        <TabsContent value="user-sessions" className="space-y-4">
          {sessionData && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Session Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Sessions:</span>
                    <span className="font-medium">{sessionData.totalSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Duration:</span>
                    <span className="font-medium">
                      {Math.round(sessionData.avgSessionDuration / 60)}m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Error Rate:</span>
                    <span className="font-medium">{sessionData.errorRate.toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Pages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sessionData.topPages.map((page, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm truncate">{page.page}</span>
                        <Badge variant="secondary">{page.views}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Device Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sessionData.deviceBreakdown.map((device, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm capitalize">{device.type}</span>
                        <Badge variant="secondary">{device.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* API Performance Tab */}
        <TabsContent value="api-performance" className="space-y-4">
          <div className="space-y-4">
            {apiPerformance.map((api) => (
              <Card key={api.endpoint}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{api.endpoint}</CardTitle>
                    <Badge 
                      variant={api.errorRate > 5 ? "destructive" : api.avgResponseTime > 500 ? "secondary" : "default"}
                    >
                      {api.avgResponseTime}ms avg
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Requests</p>
                      <p className="font-medium">{api.requestCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">P95 Response</p>
                      <p className="font-medium">{api.p95ResponseTime}ms</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Error Rate</p>
                      <p className="font-medium">{api.errorRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}