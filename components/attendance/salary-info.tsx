'use client'

import type { AsyncState, ApiResponse } from '@/types/utils'

interface SalaryInfoProps {
  profile: unknown
  isPartnerView?: boolean
}

interface SalaryData {
  month: string
  site_id: string
  site_name: string
  base_salary: number
  overtime_pay: number
  allowances: number
  deductions: number
  net_salary: number
  total_days: number
  total_hours: number
  overtime_hours: number
  status: 'pending' | 'approved' | 'paid'
}

export function SalaryInfo({ profile, isPartnerView }: SalaryInfoProps) {
  // All hooks must be called before any conditional returns
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [selectedPeriod, setSelectedPeriod] = useState('site') // 'site' or 'month'
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [sites, setSites] = useState<any[]>([])
  const [salaryData, setSalaryData] = useState<SalaryData[]>([])
  const [payslips, setPayslips] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [companySummary, setCompanySummary] = useState({
    totalWorkers: 0,
    totalAmount: 0,
    pendingAmount: 0,
    paidAmount: 0
  })
  
  // All useEffect hooks must be before early return
  useEffect(() => {
    if (profile?.id) {
      loadSites()
    }
  }, [profile?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (profile?.id && (selectedSite || selectedMonth)) {
      loadSalaryData()
    }
  }, [selectedPeriod, selectedSite, selectedMonth, profile?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  
  // Early return if no profile
  if (!profile?.id) {
    console.error('❌ SalaryInfo: No profile ID provided')
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">프로필 정보를 불러올 수 없습니다.</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">페이지를 새로고침해 주세요.</p>
        </div>
      </div>
    )
  }

  const loadSites = async () => {
    const result = await getSites()
    if (result.success && result.data) {
      setSites(result.data)
      if (result.data.length > 0) {
        setSelectedSite(result.data[0].id)
      }
    }
  }

  const loadSalaryData = async () => {
    setLoading(true)
    try {
      if (isPartnerView) {
        // Load company-wide salary summary
        const result = await getCompanySalarySummary({
          organization_id: profile.organization_id,
          site_id: selectedPeriod === 'site' ? selectedSite : undefined,
          month: selectedPeriod === 'month' ? selectedMonth : undefined
        })
        
        if (result.success && result.data) {
          setSalaryData((result.data.details || []) as unknown)
          setCompanySummary({
            totalWorkers: result.data.totalWorkers || 0,
            totalAmount: result.data.totalAmount || 0,
            pendingAmount: result.data.pendingAmount || 0,
            paidAmount: result.data.paidAmount || 0
          })
        }
      } else {
        // Load individual salary info
        const [salaryResult, payslipResult] = await Promise.all([
          getSalaryInfo({
            worker_id: profile.id,
            site_id: selectedPeriod === 'site' ? selectedSite : undefined,
            month: selectedPeriod === 'month' ? selectedMonth : undefined
          }),
          getPayslips({
            worker_id: profile.id,
            limit: 6
          })
        ])
        
        if (salaryResult.success && salaryResult.data) {
          setSalaryData(salaryResult.data as unknown)
        }
        
        if (payslipResult.success && payslipResult.data) {
          setPayslips(payslipResult.data)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPayslip = async (payslipId: string) => {
    // TODO: Implement payslip download
    console.log('Download payslip:', payslipId)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">승인 대기</Badge>
      case 'approved':
        return <Badge variant="secondary">승인됨</Badge>
      case 'paid':
        return <Badge variant="success">지급완료</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Calculate totals for individual view
  const totalSalary = salaryData.reduce((sum: unknown, item: unknown) => sum + item.net_salary, 0)
  const totalDays = salaryData.reduce((sum: unknown, item: unknown) => sum + item.total_days, 0)
  const totalHours = salaryData.reduce((sum: unknown, item: unknown) => sum + item.total_hours, 0)

  return (
    <div className="space-y-6">
      {/* View Selection */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          <Button
            variant={selectedPeriod === 'site' ? 'secondary' : 'outline'}
            onClick={() => setSelectedPeriod('site')}
            size={touchMode === 'glove' ? 'field' : touchMode === 'precision' ? 'compact' : 'standard'}
            className="flex-1 sm:flex-initial"
          >
            <Building2 className="h-4 w-4 mr-2" />
            현장별
          </Button>
          <Button
            variant={selectedPeriod === 'month' ? 'secondary' : 'outline'}
            onClick={() => setSelectedPeriod('month')}
            size={touchMode === 'glove' ? 'field' : touchMode === 'precision' ? 'compact' : 'standard'}
            className="flex-1 sm:flex-initial"
          >
            <Calendar className="h-4 w-4 mr-2" />
            월별
          </Button>
        </div>

        {selectedPeriod === 'site' ? (
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className={`w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
              touchMode === 'glove' ? 'h-14 px-4 text-base' : 
              touchMode === 'precision' ? 'h-9 px-2 text-sm' : 
              'h-10 px-3 text-base'
            }`}
          >
            {sites.map(site => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className={`flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
              touchMode === 'glove' ? 'h-14 px-4 text-base' : 
              touchMode === 'precision' ? 'h-9 px-2 text-sm' : 
              'h-10 px-3 text-base'
            }`}
          />
        )}
      </div>

      {/* Summary Cards */}
      {isPartnerView ? (
        // Partner Company Summary
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className={touchMode === 'glove' ? 'p-6' : touchMode === 'precision' ? 'p-3' : 'p-4'}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 dark:text-gray-400`}>총 작업자</p>
                <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold`}>{companySummary.totalWorkers}명</p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </Card>

          <Card className={touchMode === 'glove' ? 'p-6' : touchMode === 'precision' ? 'p-3' : 'p-4'}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 dark:text-gray-400`}>총 지급액</p>
                <p className={`${getFullTypographyClass('heading', 'xl', isLargeFont)} font-bold`}>{formatCurrency(companySummary.totalAmount)}</p>
              </div>
              <Wallet className="h-8 w-8 text-blue-400" />
            </div>
          </Card>

          <Card className={touchMode === 'glove' ? 'p-6' : touchMode === 'precision' ? 'p-3' : 'p-4'}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 dark:text-gray-400`}>미지급액</p>
                <p className={`${getFullTypographyClass('heading', 'xl', isLargeFont)} font-bold text-amber-600`}>
                  {formatCurrency(companySummary.pendingAmount)}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-amber-400" />
            </div>
          </Card>

          <Card className={touchMode === 'glove' ? 'p-6' : touchMode === 'precision' ? 'p-3' : 'p-4'}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 dark:text-gray-400`}>지급완료</p>
                <p className={`${getFullTypographyClass('heading', 'xl', isLargeFont)} font-bold text-green-600`}>
                  {formatCurrency(companySummary.paidAmount)}
                </p>
              </div>
              <Receipt className="h-8 w-8 text-green-400" />
            </div>
          </Card>
        </div>
      ) : (
        // Individual Worker Summary
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={touchMode === 'glove' ? 'p-6' : touchMode === 'precision' ? 'p-3' : 'p-4'}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 dark:text-gray-400`}>총 급여</p>
                <p className={`${getFullTypographyClass('heading', 'xl', isLargeFont)} font-bold`}>{formatCurrency(totalSalary)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </Card>

          <Card className={touchMode === 'glove' ? 'p-6' : touchMode === 'precision' ? 'p-3' : 'p-4'}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 dark:text-gray-400`}>총 근무일</p>
                <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold`}>{totalDays}일</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-400" />
            </div>
          </Card>

          <Card className={touchMode === 'glove' ? 'p-6' : touchMode === 'precision' ? 'p-3' : 'p-4'}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 dark:text-gray-400`}>총 근무시간</p>
                <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold`}>{totalHours}시간</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-400" />
            </div>
          </Card>
        </div>
      )}

      {/* Salary Details */}
      <Card className={touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'}>
        <h3 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold mb-4`}>
          {isPartnerView ? '작업자별 급여 상세' : '급여 상세 내역'}
        </h3>

        {loading ? (
          <div className={`text-center py-8 ${getFullTypographyClass('body', 'base', isLargeFont)} text-gray-500`}>
            급여 정보를 불러오는 중...
          </div>
        ) : salaryData.length === 0 ? (
          <div className={`text-center py-8 ${getFullTypographyClass('body', 'base', isLargeFont)} text-gray-500`}>
            급여 정보가 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-4">
                    {isPartnerView ? '작업자' : selectedPeriod === 'site' ? '월' : '현장'}
                  </th>
                  <th className="text-right py-2 px-4">근무일</th>
                  <th className="text-right py-2 px-4">기본급</th>
                  <th className="text-right py-2 px-4">초과수당</th>
                  <th className="text-right py-2 px-4">수당</th>
                  <th className="text-right py-2 px-4">공제</th>
                  <th className="text-right py-2 px-4">실수령액</th>
                  <th className="text-center py-2 px-4">상태</th>
                </tr>
              </thead>
              <tbody>
                {salaryData.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="py-3 px-4">
                      {isPartnerView ? (
                        <div>
                          <p className="font-medium">{(item as unknown).worker_name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{item.site_name}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium">
                            {selectedPeriod === 'site' 
                              ? format(new Date(item.month), 'yyyy년 MM월')
                              : item.site_name
                            }
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="text-right py-3 px-4">{item.total_days}일</td>
                    <td className="text-right py-3 px-4">{formatCurrency(item.base_salary)}</td>
                    <td className="text-right py-3 px-4">{formatCurrency(item.overtime_pay)}</td>
                    <td className="text-right py-3 px-4">{formatCurrency(item.allowances)}</td>
                    <td className="text-right py-3 px-4 text-red-600 dark:text-red-400">
                      -{formatCurrency(item.deductions)}
                    </td>
                    <td className="text-right py-3 px-4 font-semibold">
                      {formatCurrency(item.net_salary)}
                    </td>
                    <td className="text-center py-3 px-4">
                      {getStatusBadge(item.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold border-t border-gray-200 dark:border-gray-700">
                  <td className="py-3 px-4">합계</td>
                  <td className="text-right py-3 px-4">{totalDays}일</td>
                  <td className="text-right py-3 px-4" colSpan={4}>-</td>
                  <td className="text-right py-3 px-4">
                    {formatCurrency(isPartnerView ? companySummary.totalAmount : totalSalary)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* Payslips (Individual View Only) */}
      {!isPartnerView && payslips.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            급여명세서
          </h3>
          
          <div className="space-y-3">
            {payslips.map((payslip: unknown) => (
              <div
                key={payslip.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div>
                  <p className="font-medium">
                    {format(new Date(payslip.month), 'yyyy년 MM월')} 급여명세서
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {payslip.site_name} | 실수령액: {formatCurrency(payslip.net_amount)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(payslip.status)}
                  <Button
                    size="compact"
                    variant="outline"
                    onClick={() => handleDownloadPayslip(payslip.id)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}