'use client'


interface NotificationMetrics {
  summary: {
    totalSent: number
    delivered: number
    failed: number
    clicked: number
    deliveryRate: string
    clickRate: string
    engagementRate: string
  }
  byType: Record<string, {
    sent: number
    delivered: number
    failed: number
    clicked: number
    deliveryRate: string
    clickRate: string
  }>
  timeSeries: Array<{
    date: string
    sent: number
    delivered: number
    clicked: number
  }>
  engagement: {
    deepLinks: number
    actions: number
    totalEngagements: number
  }
  period: {
    startDate: string
    endDate: string
  }
}

const NOTIFICATION_TYPE_LABELS = {
  material_approval: '자재 승인',
  daily_report_reminder: '작업일지 리마인더',
  safety_alert: '안전 경고',
  equipment_maintenance: '장비 정비',
  site_announcement: '현장 공지'
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444']

export function NotificationAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<NotificationMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  })
  const [selectedType, setSelectedType] = useState<string>('')
  const supabase = createClient()

  useEffect(() => {
    fetchMetrics()
  }, [dateRange, selectedType])

  const fetchMetrics = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        startDate: startOfDay(new Date(dateRange.startDate)).toISOString(),
        endDate: endOfDay(new Date(dateRange.endDate)).toISOString()
      })
      
      if (selectedType) params.append('type', selectedType)

      const response = await fetch(`/api/notifications/analytics/metrics?${params}`)
      const data = await response.json()

      if (response.ok) {
        setMetrics(data)
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportMetrics = () => {
    if (!metrics) return

    const csv = [
      ['Notification Analytics Report'],
      [`Period: ${dateRange.startDate} to ${dateRange.endDate}`],
      [''],
      ['Summary'],
      ['Total Sent', metrics.summary.totalSent],
      ['Delivered', metrics.summary.delivered],
      ['Failed', metrics.summary.failed],
      ['Clicked', metrics.summary.clicked],
      ['Delivery Rate', `${metrics.summary.deliveryRate}%`],
      ['Click Rate', `${metrics.summary.clickRate}%`],
      ['Engagement Rate', `${metrics.summary.engagementRate}%`],
      [''],
      ['By Type'],
      ['Type', 'Sent', 'Delivered', 'Failed', 'Clicked', 'Delivery Rate', 'Click Rate'],
      ...Object.entries(metrics.byType).map(([type, data]) => [
        NOTIFICATION_TYPE_LABELS[type as keyof typeof NOTIFICATION_TYPE_LABELS] || type,
        data.sent,
        data.delivered,
        data.failed,
        data.clicked,
        `${data.deliveryRate}%`,
        `${data.clickRate}%`
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `notification-analytics-${dateRange.startDate}-${dateRange.endDate}.csv`
    a.click()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">메트릭을 불러올 수 없습니다</p>
      </div>
    )
  }

  const pieData = Object.entries(metrics.byType).map(([type, data]) => ({
    name: NOTIFICATION_TYPE_LABELS[type as keyof typeof NOTIFICATION_TYPE_LABELS] || type,
    value: data.sent
  }))

  const barData = Object.entries(metrics.byType).map(([type, data]) => ({
    type: NOTIFICATION_TYPE_LABELS[type as keyof typeof NOTIFICATION_TYPE_LABELS] || type,
    전송: data.sent,
    전달: data.delivered,
    클릭: data.clicked
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              알림 분석 대시보드
            </h2>
          </div>
          
          <button
            onClick={exportMetrics}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            내보내기
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              시작일
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              종료일
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              알림 유형
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">전체</option>
              {Object.entries(NOTIFICATION_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">전체 발송</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {metrics.summary.totalSent.toLocaleString()}
              </p>
            </div>
            <Bell className="h-8 w-8 text-blue-600 dark:text-blue-400 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">전달률</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {metrics.summary.deliveryRate}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {metrics.summary.delivered.toLocaleString()} 전달
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">클릭률</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {metrics.summary.clickRate}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {metrics.summary.clicked.toLocaleString()} 클릭
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">참여율</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {metrics.summary.engagementRate}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {metrics.engagement.totalEngagements.toLocaleString()} 상호작용
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400 opacity-20" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Series Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            일별 추이
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.timeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => format(new Date(date), 'MM/dd')}
                stroke="#9ca3af"
              />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                labelFormatter={(date) => format(new Date(date), 'yyyy-MM-dd')}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="sent" 
                stroke="#3B82F6" 
                name="발송"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="delivered" 
                stroke="#10B981" 
                name="전달"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="clicked" 
                stroke="#F59E0B" 
                name="클릭"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Type Distribution Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            유형별 분포
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Type Performance Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            유형별 성과
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="type" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="전송" fill="#3B82F6" />
              <Bar dataKey="전달" fill="#10B981" />
              <Bar dataKey="클릭" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Engagement Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          참여 상세
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300">딥 링크 클릭</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
              {metrics.engagement.deepLinks.toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300">액션 수행</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
              {metrics.engagement.actions.toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300">전체 상호작용</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
              {metrics.engagement.totalEngagements.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}