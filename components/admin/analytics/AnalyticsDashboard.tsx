'use client'


interface AnalyticsDashboardProps {
  profile?: Profile
}

// 차트 색상 팔레트
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

export default function AnalyticsDashboard({ profile }: AnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedSite, setSelectedSite] = useState('all')
  const [refreshing, setRefreshing] = useState(false)
  const supabase = createClient()

  // 대시보드 데이터
  const [dashboardData, setDashboardData] = useState({
    overview: {
      totalWorkers: 245,
      activeSites: 12,
      totalDocuments: 1847,
      monthlyExpense: 487500000,
      workersChange: 12,
      sitesChange: 2,
      documentsChange: 156,
      expenseChange: -5.2
    },
    attendanceData: [],
    sitePerformance: [],
    documentStats: [],
    materialUsage: [],
    salaryDistribution: [],
    safetyIncidents: [],
    productivityMetrics: []
  })

  useEffect(() => {
    fetchAnalyticsData()
  }, [selectedPeriod, selectedSite])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      
      // 모의 데이터 생성
      const mockData = {
        overview: {
          totalWorkers: 245,
          activeSites: 12,
          totalDocuments: 1847,
          monthlyExpense: 487500000,
          workersChange: 12,
          sitesChange: 2,
          documentsChange: 156,
          expenseChange: -5.2
        },
        attendanceData: generateAttendanceData(),
        sitePerformance: generateSitePerformance(),
        documentStats: generateDocumentStats(),
        materialUsage: generateMaterialUsage(),
        salaryDistribution: generateSalaryDistribution(),
        safetyIncidents: generateSafetyIncidents(),
        productivityMetrics: generateProductivityMetrics()
      }
      
      setDashboardData(mockData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // 데이터 생성 함수들
  const generateAttendanceData = () => {
    const days = selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 90
    return Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (days - i - 1))
      return {
        date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        출근: Math.floor(Math.random() * 50) + 180,
        결근: Math.floor(Math.random() * 10) + 5,
        지각: Math.floor(Math.random() * 5) + 2
      }
    })
  }

  const generateSitePerformance = () => [
    { name: '강남 A현장', 진행률: 78, 작업자: 45, 안전점수: 92 },
    { name: '송파 C현장', 진행률: 65, 작업자: 38, 안전점수: 88 },
    { name: '서초 B현장', 진행률: 92, 작업자: 52, 안전점수: 95 },
    { name: '강동 D현장', 진행률: 45, 작업자: 32, 안전점수: 90 },
    { name: '구로 E현장', 진행률: 88, 작업자: 41, 안전점수: 87 }
  ]

  const generateDocumentStats = () => [
    { name: '작업지시서', value: 450, percentage: 24.3 },
    { name: '안전서류', value: 380, percentage: 20.6 },
    { name: '도면', value: 320, percentage: 17.3 },
    { name: '계약서', value: 290, percentage: 15.7 },
    { name: '보고서', value: 407, percentage: 22.1 }
  ]

  const generateMaterialUsage = () => {
    const days = selectedPeriod === 'week' ? 7 : 30
    return Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (days - i - 1))
      return {
        date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        'NPC-1000': Math.floor(Math.random() * 500) + 300,
        '기타자재': Math.floor(Math.random() * 300) + 200
      }
    })
  }

  const generateSalaryDistribution = () => [
    { range: '200-250만', count: 45 },
    { range: '250-300만', count: 78 },
    { range: '300-350만', count: 62 },
    { range: '350-400만', count: 38 },
    { range: '400만+', count: 22 }
  ]

  const generateSafetyIncidents = () => [
    { month: '1월', incidents: 2, nearMiss: 5 },
    { month: '2월', incidents: 1, nearMiss: 3 },
    { month: '3월', incidents: 0, nearMiss: 4 },
    { month: '4월', incidents: 1, nearMiss: 2 },
    { month: '5월', incidents: 0, nearMiss: 1 },
    { month: '6월', incidents: 0, nearMiss: 2 }
  ]

  const generateProductivityMetrics = () => [
    { metric: '작업효율', current: 85, target: 90, unit: '%' },
    { metric: '품질점수', current: 92, target: 95, unit: '점' },
    { metric: '안전준수', current: 96, target: 98, unit: '%' },
    { metric: '일정준수', current: 88, target: 85, unit: '%' },
    { metric: '비용효율', current: 82, target: 80, unit: '%' }
  ]

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalyticsData()
    setTimeout(() => setRefreshing(false), 500)
  }

  const StatCard = ({ title, value, change, icon: Icon, color }: unknown) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {typeof value === 'number' && title.includes('비용') 
              ? `₩${value.toLocaleString()}`
              : value.toLocaleString()
            }
          </p>
          {change !== undefined && (
            <div className="flex items-center mt-2">
              {change > 0 ? (
                <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
              ) : change < 0 ? (
                <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
              ) : (
                <Minus className="h-4 w-4 text-gray-500 mr-1" />
              )}
              <span className={`text-sm ${
                change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {Math.abs(change)}% {change > 0 ? '증가' : change < 0 ? '감소' : '변동없음'}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">분석 데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              분석 대시보드
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              실시간 비즈니스 인사이트 및 성과 지표
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="week">최근 1주일</option>
              <option value="month">최근 1개월</option>
              <option value="quarter">최근 3개월</option>
            </select>
            <button
              onClick={handleRefresh}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all ${
                refreshing ? 'animate-spin' : ''
              }`}
            >
              <RefreshCw className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <Download className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* 핵심 지표 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="전체 작업자"
            value={dashboardData.overview.totalWorkers}
            change={dashboardData.overview.workersChange}
            icon={Users}
            color="bg-blue-500"
          />
          <StatCard
            title="활성 현장"
            value={dashboardData.overview.activeSites}
            change={dashboardData.overview.sitesChange}
            icon={Building2}
            color="bg-green-500"
          />
          <StatCard
            title="총 문서"
            value={dashboardData.overview.totalDocuments}
            change={dashboardData.overview.documentsChange}
            icon={FileText}
            color="bg-purple-500"
          />
          <StatCard
            title="월 지출 비용"
            value={dashboardData.overview.monthlyExpense}
            change={dashboardData.overview.expenseChange}
            icon={DollarSign}
            color="bg-orange-500"
          />
        </div>
      </div>

      {/* 차트 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 출근 현황 차트 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            출근 현황 추이
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dashboardData.attendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="출근" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
              <Area type="monotone" dataKey="지각" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
              <Area type="monotone" dataKey="결근" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 현장별 성과 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            현장별 진행률
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.sitePerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="진행률" fill="#3B82F6" />
              <Bar dataKey="안전점수" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 문서 통계 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            문서 유형별 분포
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboardData.documentStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {dashboardData.documentStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 자재 사용량 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            자재 사용량 추이
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData.materialUsage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="NPC-1000" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="기타자재" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 하단 차트들 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 급여 분포 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            급여 구간별 분포
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dashboardData.salaryDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 안전 사고 현황 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            안전 사고 추이
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dashboardData.safetyIncidents}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="incidents" stroke="#EF4444" strokeWidth={2} name="사고" />
              <Line type="monotone" dataKey="nearMiss" stroke="#F59E0B" strokeWidth={2} name="아차사고" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 생산성 지표 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            핵심 성과 지표 (KPI)
          </h3>
          <div className="space-y-3">
            {dashboardData.productivityMetrics.map((metric, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">{metric.metric}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {metric.current}{metric.unit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      metric.current >= metric.target ? 'bg-green-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${Math.min(100, (metric.current / metric.target) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-500">목표: {metric.target}{metric.unit}</span>
                  <span className={`${
                    metric.current >= metric.target ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {metric.current >= metric.target ? '달성' : '미달'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 실시간 활동 피드 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            실시간 활동
          </h3>
          <Activity className="h-5 w-5 text-green-500 animate-pulse" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-sm">
            <span className="text-gray-500">10:45</span>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-700 dark:text-gray-300">강남 A현장에서 45명 출근 완료</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <span className="text-gray-500">10:32</span>
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-700 dark:text-gray-300">작업지시서 15건 업로드</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <span className="text-gray-500">10:15</span>
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-gray-700 dark:text-gray-300">NPC-1000 자재 500개 출고 승인</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <span className="text-gray-500">09:58</span>
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-gray-700 dark:text-gray-300">송파 C현장 안전 점검 완료</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <span className="text-gray-500">09:30</span>
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-gray-700 dark:text-gray-300">긴급 공지사항 발송</span>
          </div>
        </div>
      </div>
    </div>
  )
}