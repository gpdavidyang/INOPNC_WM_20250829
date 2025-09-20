'use client'


interface SalaryCalculatorProps {
  siteId?: string
  workerId?: string
  onCalculate?: (result: SalaryCalculationResult) => void
}

export default function SalaryCalculator({ siteId, workerId, onCalculate }: SalaryCalculatorProps) {
  const [calculationMode, setCalculationMode] = useState<'daily' | 'monthly' | 'labor_hours'>('daily')
  const [calculationType, setCalculationType] = useState<'normal' | 'tax_prepaid'>('tax_prepaid')
  const [taxRate, setTaxRate] = useState(3.3)
  
  // Daily calculation inputs
  const [dailyRate, setDailyRate] = useState(150000)
  const [workHours, setWorkHours] = useState(8)
  const [overtimeHours, setOvertimeHours] = useState(0)
  
  // Monthly calculation inputs
  const [workDays, setWorkDays] = useState<number[]>([])
  const [monthWorkDays, setMonthWorkDays] = useState(22)
  
  // Labor hours calculation inputs
  const [laborHours, setLaborHours] = useState(1.0)
  
  // Additional inputs
  const [bonuses, setBonuses] = useState(0)
  const [deductions, setDeductions] = useState(0)
  
  // Calculation result
  const [result, setResult] = useState<SalaryCalculationResult | null>(null)

  const handleCalculate = () => {
    let calculationResult: SalaryCalculationResult
    
    switch (calculationMode) {
      case 'daily':
        calculationResult = calculateSalary({
          baseAmount: dailyRate / 8, // Convert daily rate to hourly
          workHours,
          overtimeHours,
          overtimeMultiplier: 1.5,
          calculationType,
          taxRate,
          bonuses,
          deductions
        })
        break
        
      case 'monthly':
        // Generate work days array (simplified - all 8 hour days for now)
        const days = Array(monthWorkDays).fill(8)
        calculationResult = calculateMonthlySalary(dailyRate, days, calculationType, taxRate)
        calculationResult.bonuses = bonuses
        calculationResult.deductions = deductions
        calculationResult.netPay = calculationResult.netPay + bonuses - deductions
        break
        
      case 'labor_hours':
        calculationResult = calculateSalaryByLaborHours(dailyRate, laborHours, calculationType, taxRate)
        calculationResult.bonuses = bonuses
        calculationResult.deductions = deductions
        calculationResult.netPay = calculationResult.netPay + bonuses - deductions
        break
        
      default:
        return
    }
    
    setResult(calculationResult)
    if (onCalculate) {
      onCalculate(calculationResult)
    }
  }

  return (
    <div className="space-y-6">
      {/* Calculation Mode Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          급여 계산 방식 선택
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setCalculationMode('daily')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              calculationMode === 'daily'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
          >
            <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">일급 계산</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">일일 근무 기준</div>
          </button>
          
          <button
            onClick={() => setCalculationMode('monthly')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              calculationMode === 'monthly'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
          >
            <Calendar className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">월급 계산</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">월 단위 계산</div>
          </button>
          
          <button
            onClick={() => setCalculationMode('labor_hours')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              calculationMode === 'labor_hours'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
          >
            <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">공수 계산</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">공수 기준 계산</div>
          </button>
        </div>
      </div>

      {/* Tax Calculation Type */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          세금 계산 방식
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="tax_prepaid"
                checked={calculationType === 'tax_prepaid'}
                onChange={(e) => setCalculationType(e.target.value as 'tax_prepaid')}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                3.3% 선취 방식
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                value="normal"
                checked={calculationType === 'normal'}
                onChange={(e) => setCalculationType(e.target.value as 'normal')}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                일반 계산 방식
              </span>
            </label>
          </div>
          
          {calculationType === 'tax_prepaid' && (
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                세율 (%)
              </label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                step="0.1"
                min="0"
                max="100"
                className="w-20 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                (기본: 3.3%)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Calculation Inputs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          급여 정보 입력
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              일급 (원)
            </label>
            <input
              type="number"
              value={dailyRate}
              onChange={(e) => setDailyRate(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          
          {calculationMode === 'daily' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  정규 근무시간
                </label>
                <input
                  type="number"
                  value={workHours}
                  onChange={(e) => setWorkHours(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  연장 근무시간
                </label>
                <input
                  type="number"
                  value={overtimeHours}
                  onChange={(e) => setOvertimeHours(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </>
          )}
          
          {calculationMode === 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                월 근무일수
              </label>
              <input
                type="number"
                value={monthWorkDays}
                onChange={(e) => setMonthWorkDays(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          )}
          
          {calculationMode === 'labor_hours' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                공수 (1.0 = 8시간)
              </label>
              <input
                type="number"
                value={laborHours}
                onChange={(e) => setLaborHours(parseFloat(e.target.value) || 0)}
                step="0.25"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              보너스 (원)
            </label>
            <input
              type="number"
              value={bonuses}
              onChange={(e) => setBonuses(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              공제액 (원)
            </label>
            <input
              type="number"
              value={deductions}
              onChange={(e) => setDeductions(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
        
        <div className="mt-6">
          <button
            onClick={handleCalculate}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Calculator className="h-5 w-5" />
            급여 계산
          </button>
        </div>
      </div>

      {/* Calculation Result */}
      {result && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            급여 계산 결과
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">기본급</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatSalary(result.basePay)}
                </span>
              </div>
              
              {result.overtimePay > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">연장수당</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatSalary(result.overtimePay)}
                  </span>
                </div>
              )}
              
              {result.bonuses > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">보너스</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatSalary(result.bonuses)}
                  </span>
                </div>
              )}
              
              {result.deductions > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">공제액</span>
                  <span className="font-medium text-red-600">
                    -{formatSalary(result.deductions)}
                  </span>
                </div>
              )}
              
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">총 급여</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatSalary(result.grossPay)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {result.taxAmount > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      세금 ({result.details.taxRate}% {calculationType === 'tax_prepaid' ? '선취' : ''})
                    </span>
                    <span className="font-medium text-red-600">
                      -{formatSalary(result.taxAmount)}
                    </span>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">실수령액</span>
                      <span className="text-lg font-bold text-green-600">
                        {formatSalary(result.netPay)}
                      </span>
                    </div>
                  </div>
                </>
              )}
              
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  계산 방식: {calculationType === 'tax_prepaid' ? '3.3% 선취' : '일반'}
                </p>
                {result.details.workHours > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    근무시간: 정규 {result.details.workHours}시간
                    {result.details.overtimeHours > 0 && ` + 연장 ${result.details.overtimeHours}시간`}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <FileText className="h-4 w-4" />
              명세서 생성
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <Download className="h-4 w-4" />
              PDF 다운로드
            </button>
          </div>
        </div>
      )}
    </div>
  )
}