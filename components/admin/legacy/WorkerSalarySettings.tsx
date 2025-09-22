'use client'


interface WorkerSalarySettingsProps {
  profile: Profile
}

interface WorkerWithSettings {
  id: string
  full_name: string
  email: string
  role: string
  has_salary_setting: boolean
  employment_type?: EmploymentType
  daily_rate?: number
}

export default function WorkerSalarySettings({ profile }: WorkerSalarySettingsProps) {
  const [activeTab, setActiveTab] = useState<'workers' | 'tax_rates'>('workers')
  
  // Workers management state
  const [workers, setWorkers] = useState<WorkerWithSettings[]>([])
  const [filteredWorkers, setFilteredWorkers] = useState<WorkerWithSettings[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [employmentFilter, setEmploymentFilter] = useState<EmploymentType | 'all'>('all')
  const [selectedWorker, setSelectedWorker] = useState<WorkerWithSettings | null>(null)
  const [editingWorker, setEditingWorker] = useState<WorkerWithSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Tax rates management state
  const [taxRates, setTaxRates] = useState<TaxRate[]>([])
  const [editingTaxRates, setEditingTaxRates] = useState<Record<string, number>>({})
  const [taxRatesLoading, setTaxRatesLoading] = useState(false)

  // Worker setting form state
  const [salaryForm, setSalaryForm] = useState({
    employment_type: 'daily_worker' as EmploymentType,
    daily_rate: 0,
    custom_tax_rates: {} as Record<string, number>,
    bank_account_info: {
      bank_name: '',
      account_number: '',
      account_holder: ''
    },
    effective_date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  useEffect(() => {
    loadWorkers()
    loadTaxRates()
  }, [])

  useEffect(() => {
    filterWorkers()
  }, [workers, searchTerm, employmentFilter])

  useEffect(() => {
    if (selectedWorker && selectedWorker.has_salary_setting) {
      loadWorkerSettings(selectedWorker.id)
    }
  }, [selectedWorker])

  const loadWorkers = async () => {
    setLoading(true)
    try {
      const result = await getWorkersForSalarySettings()
      if (result.success && result.data) {
        setWorkers(result.data)
      } else {
        setError(result.error || '직원 목록을 불러오는데 실패했습니다.')
      }
    } catch (err) {
      setError('직원 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const loadWorkerSettings = async (worker_id: string) => {
    try {
      const result = await getWorkerSalarySettings(worker_id)
      if (result.success && result.data && result.data.length > 0) {
        const setting = result.data[0]
        setSalaryForm({
          employment_type: setting.employment_type,
          daily_rate: setting.daily_rate,
          custom_tax_rates: setting.custom_tax_rates || {},
          bank_account_info: setting.bank_account_info || {
            bank_name: '',
            account_number: '',
            account_holder: ''
          },
          effective_date: setting.effective_date,
          notes: setting.notes || ''
        })
      }
    } catch (err) {
      console.error('Error loading worker settings:', err)
    }
  }

  const loadTaxRates = async () => {
    setTaxRatesLoading(true)
    try {
      const result = await getTaxRates()
      if (result.success && result.data) {
        setTaxRates(result.data)
      }
    } catch (err) {
      console.error('Error loading tax rates:', err)
    } finally {
      setTaxRatesLoading(false)
    }
  }

  const filterWorkers = () => {
    let filtered = [...workers]

    if (searchTerm.trim()) {
      filtered = filtered.filter(worker => 
        worker.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (employmentFilter !== 'all') {
      filtered = filtered.filter(worker => worker.employment_type === employmentFilter)
    }

    setFilteredWorkers(filtered)
  }

  const handleSaveWorkerSetting = async () => {
    if (!selectedWorker) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await setWorkerSalarySetting(
        selectedWorker.id,
        salaryForm.employment_type,
        salaryForm.daily_rate,
        salaryForm.custom_tax_rates,
        salaryForm.bank_account_info,
        salaryForm.effective_date,
        salaryForm.notes
      )

      if (result.success) {
        setSuccess('급여 설정이 저장되었습니다.')
        setEditingWorker(null)
        await loadWorkers() // Refresh worker list
      } else {
        setError(result.error || '급여 설정 저장에 실패했습니다.')
      }
    } catch (err) {
      setError('급여 설정 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTaxRate = async (tax_rate_id: string, new_rate: number) => {
    try {
      const result = await updateTaxRate(tax_rate_id, new_rate)
      if (result.success) {
        await loadTaxRates()
        setEditingTaxRates(prev => {
          const updated = { ...prev }
          delete updated[tax_rate_id]
          return updated
        })
        setSuccess('세율이 업데이트되었습니다.')
      } else {
        setError(result.error || '세율 업데이트에 실패했습니다.')
      }
    } catch (err) {
      setError('세율 업데이트에 실패했습니다.')
    }
  }

  const getEmploymentTypeColor = (type: EmploymentType | undefined) => {
    switch (type) {
      case 'regular_employee': return 'bg-blue-100 text-blue-800'
      case 'freelancer': return 'bg-green-100 text-green-800'
      case 'daily_worker': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const renderWorkersList = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center space-x-4 bg-white p-4 rounded-lg border">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="직원명 또는 이메일 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <CustomSelect value={employmentFilter} onValueChange={(value) => setEmploymentFilter(value as unknown)}>
          <CustomSelectTrigger className="w-40">
            <CustomSelectValue placeholder="고용형태 선택" />
          </CustomSelectTrigger>
          <CustomSelectContent>
            <CustomSelectItem value="all">전체</CustomSelectItem>
            <CustomSelectItem value="regular_employee">4대보험 직원</CustomSelectItem>
            <CustomSelectItem value="freelancer">프리랜서</CustomSelectItem>
            <CustomSelectItem value="daily_worker">일용직</CustomSelectItem>
          </CustomSelectContent>
        </CustomSelect>
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWorkers.map(worker => (
          <Card 
            key={worker.id} 
            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedWorker?.id === worker.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => setSelectedWorker(worker)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <h3 className="font-medium text-gray-900">{worker.full_name}</h3>
                  <p className="text-sm text-gray-500">{worker.email}</p>
                </div>
              </div>
              {worker.has_salary_setting ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-500" />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">역할:</span>
                <Badge variant="secondary">{worker.role}</Badge>
              </div>
              
              {worker.has_salary_setting && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">고용형태:</span>
                    <Badge className={getEmploymentTypeColor(worker.employment_type)}>
                      {EMPLOYMENT_TYPE_LABELS[worker.employment_type!]}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">일급:</span>
                    <span className="font-medium">
                      {worker.daily_rate?.toLocaleString()}원
                    </span>
                  </div>
                </>
              )}

              {!worker.has_salary_setting && (
                <p className="text-sm text-orange-600 mt-2">급여 설정이 필요합니다</p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filteredWorkers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>조건에 맞는 직원이 없습니다.</p>
        </div>
      )}
    </div>
  )

  const renderWorkerSettingsForm = () => (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">급여 설정</h3>
          <p className="text-sm text-gray-500">
            {selectedWorker?.full_name}님의 급여 정보를 설정합니다
          </p>
        </div>
        <div className="flex space-x-2">
          {editingWorker ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingWorker(null)}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-1" />
                취소
              </Button>
              <Button
                size="sm"
                onClick={handleSaveWorkerSetting}
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-1" />
                저장
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => setEditingWorker(selectedWorker)}
            >
              <Edit2 className="h-4 w-4 mr-1" />
              편집
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 기본 설정 */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">기본 설정</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              고용형태
            </label>
            <CustomSelect 
              value={salaryForm.employment_type} 
              onValueChange={(value) => setSalaryForm(prev => ({
                ...prev, 
                employment_type: value as EmploymentType,
                custom_tax_rates: {} // Reset custom rates when changing employment type
              }))}
              disabled={!editingWorker}
            >
              <CustomSelectTrigger>
                <CustomSelectValue />
              </CustomSelectTrigger>
              <CustomSelectContent>
                <CustomSelectItem value="regular_employee">4대보험 직원</CustomSelectItem>
                <CustomSelectItem value="freelancer">프리랜서</CustomSelectItem>
                <CustomSelectItem value="daily_worker">일용직</CustomSelectItem>
              </CustomSelectContent>
            </CustomSelect>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              일급
            </label>
            <input
              type="number"
              value={salaryForm.daily_rate}
              onChange={(e) => setSalaryForm(prev => ({
                ...prev,
                daily_rate: parseFloat(e.target.value) || 0
              }))}
              disabled={!editingWorker}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              placeholder="예: 150000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              적용일
            </label>
            <input
              type="date"
              value={salaryForm.effective_date}
              onChange={(e) => setSalaryForm(prev => ({
                ...prev,
                effective_date: e.target.value
              }))}
              disabled={!editingWorker}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            />
          </div>
        </div>

        {/* 세율 설정 */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">세율 설정</h4>
          
          {Object.keys(DEFAULT_TAX_RATES[salaryForm.employment_type]).map(tax_name => (
            <div key={tax_name} className="flex items-center space-x-2">
              <label className="flex-1 text-sm text-gray-700">
                {tax_name}
              </label>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  step="0.01"
                  value={salaryForm.custom_tax_rates[tax_name] || DEFAULT_TAX_RATES[salaryForm.employment_type][tax_name]}
                  onChange={(e) => setSalaryForm(prev => ({
                    ...prev,
                    custom_tax_rates: {
                      ...prev.custom_tax_rates,
                      [tax_name]: parseFloat(e.target.value) || 0
                    }
                  }))}
                  disabled={!editingWorker}
                  className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
                />
                <span className="text-xs text-gray-500">%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 계좌 정보 */}
      {editingWorker && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">계좌 정보 (선택사항)</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                은행명
              </label>
              <input
                type="text"
                value={salaryForm.bank_account_info.bank_name}
                onChange={(e) => setSalaryForm(prev => ({
                  ...prev,
                  bank_account_info: {
                    ...prev.bank_account_info,
                    bank_name: e.target.value
                  }
                }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 국민은행"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                계좌번호
              </label>
              <input
                type="text"
                value={salaryForm.bank_account_info.account_number}
                onChange={(e) => setSalaryForm(prev => ({
                  ...prev,
                  bank_account_info: {
                    ...prev.bank_account_info,
                    account_number: e.target.value
                  }
                }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="계좌번호"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                예금주
              </label>
              <input
                type="text"
                value={salaryForm.bank_account_info.account_holder}
                onChange={(e) => setSalaryForm(prev => ({
                  ...prev,
                  bank_account_info: {
                    ...prev.bank_account_info,
                    account_holder: e.target.value
                  }
                }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예금주명"
              />
            </div>
          </div>
        </div>
      )}

      {/* 메모 */}
      {editingWorker && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            메모
          </label>
          <textarea
            value={salaryForm.notes}
            onChange={(e) => setSalaryForm(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="추가 메모사항..."
          />
        </div>
      )}
    </div>
  )

  const renderTaxRatesManagement = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">세율 관리</h3>
        <p className="text-sm text-gray-500">고용형태별 기본 세율을 관리합니다.</p>
      </div>

      {taxRatesLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">세율 정보를 불러오는 중...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['regular_employee', 'freelancer', 'daily_worker'] as EmploymentType[]).map(type => (
            <Card key={type} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">
                  {EMPLOYMENT_TYPE_LABELS[type]}
                </h4>
                <Badge className={getEmploymentTypeColor(type)}>
                  {type}
                </Badge>
              </div>

              <div className="space-y-3">
                {taxRates
                  .filter(rate => rate.employment_type === type)
                  .map(rate => (
                    <div key={rate.id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{rate.tax_name}</span>
                      <div className="flex items-center space-x-2">
                        {editingTaxRates[rate.id] !== undefined ? (
                          <>
                            <input
                              type="number"
                              step="0.01"
                              value={editingTaxRates[rate.id]}
                              onChange={(e) => setEditingTaxRates(prev => ({
                                ...prev,
                                [rate.id]: parseFloat(e.target.value) || 0
                              }))}
                              className="w-16 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => handleUpdateTaxRate(rate.id, editingTaxRates[rate.id])}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Save className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => setEditingTaxRates(prev => {
                                const updated = { ...prev }
                                delete updated[rate.id]
                                return updated
                              })}
                              className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="text-sm font-medium">{rate.rate}%</span>
                            <button
                              onClick={() => setEditingTaxRates(prev => ({
                                ...prev,
                                [rate.id]: rate.rate
                              }))}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">개인별 급여 설정</h1>
            <p className="text-sm text-gray-500">직원별 고용형태 및 급여 정보를 관리합니다</p>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            {success}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('workers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'workers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            직원 급여 설정
          </button>
          <button
            onClick={() => setActiveTab('tax_rates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tax_rates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Percent className="h-4 w-4 inline mr-2" />
            세율 관리
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'workers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            {renderWorkersList()}
          </div>
          <div>
            {selectedWorker ? (
              renderWorkerSettingsForm()
            ) : (
              <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>직원을 선택하여 급여 설정을 관리하세요</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'tax_rates' && renderTaxRatesManagement()}
    </div>
  )
}