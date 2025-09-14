'use client'


interface NPC1000SimplifiedProps {
  currentSite?: unknown
  currentUser?: unknown
}

type SortField = 'date' | 'incoming' | 'used' | 'stock'
type SortOrder = 'asc' | 'desc'

// Mock data for development
const mockRecords: NPC1000DailyRecord[] = [
  {
    id: '1',
    site_id: 'site1',
    date: new Date().toISOString().split('T')[0],
    incoming_qty: 500,
    used_qty: 200,
    stock_qty: 2300,
    created_by: 'user1',
    created_at: new Date().toISOString(),
    daily_report: {
      id: 'report1',
      work_content: '1층 슬라브 타설 작업 진행',
      created_by: {
        id: 'user1',
        full_name: '김철수'
      }
    }
  },
  {
    id: '2',
    site_id: 'site1',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    incoming_qty: 0,
    used_qty: 150,
    stock_qty: 2000,
    created_by: 'user2',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    daily_report: {
      id: 'report2',
      work_content: '2층 벽체 타설 준비',
      created_by: {
        id: 'user2',
        full_name: '이영희'
      }
    }
  },
  {
    id: '3',
    site_id: 'site1',
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    incoming_qty: 1000,
    used_qty: 300,
    stock_qty: 2150,
    created_by: 'user3',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    daily_report: {
      id: 'report3',
      work_content: '지하 1층 마감 작업',
      created_by: {
        id: 'user3',
        full_name: '박민수'
      }
    }
  }
]

export function NPC1000Simplified({ currentSite, currentUser }: NPC1000SimplifiedProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [records, setRecords] = useState<NPC1000DailyRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState({
    today: { incoming: 0, used: 0, stock: 0 },
    cumulative: { totalIncoming: 0, totalUsed: 0, currentStock: 0 }
  })
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  
  // Modal states
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showRecordModal, setShowRecordModal] = useState(false)
  
  // Form states
  const [requestForm, setRequestForm] = useState({
    quantity: '',
    reason: '',
    urgency: 'normal'
  })
  
  const [recordForm, setRecordForm] = useState({
    type: 'incoming',
    quantity: '',
    note: ''
  })

  useEffect(() => {
    if (currentSite?.site_id) {
      loadNPC1000Data()
    } else {
      // Show mock data when no site is selected for demonstration
      setRecords(mockRecords)
      setSummary({
        today: { incoming: 500, used: 200, stock: 2300 },
        cumulative: { totalIncoming: 3500, totalUsed: 1200, currentStock: 2300 }
      })
    }
  }, [currentSite])

  const loadNPC1000Data = async () => {
    if (!currentSite?.site_id) return

    setLoading(true)
    try {
      // Load all records
      const recordsResult = await getNPC1000Records(currentSite.site_id, 'all')
      if (recordsResult.success && recordsResult.data) {
        // Use mock data if no real data exists
        setRecords(recordsResult.data.length > 0 ? recordsResult.data : mockRecords)
      }

      // Load summary
      const summaryResult = await getNPC1000Summary(currentSite.site_id)
      if (summaryResult.success && summaryResult.data) {
        setSummary(summaryResult.data)
      } else {
        // Use mock summary
        setSummary({
          today: { incoming: 500, used: 200, stock: 2300 },
          cumulative: { totalIncoming: 3500, totalUsed: 1200, currentStock: 2300 }
        })
      }
    } catch (error) {
      console.error('Error loading NPC-1000 data:', error)
      // Use mock data on error
      setRecords(mockRecords)
      setSummary({
        today: { incoming: 500, used: 200, stock: 2300 },
        cumulative: { totalIncoming: 3500, totalUsed: 1200, currentStock: 2300 }
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const sortedRecords = [...records].sort((a, b) => {
    let aValue: unknown
    let bValue: unknown

    switch (sortField) {
      case 'date':
        aValue = new Date(a.date).getTime()
        bValue = new Date(b.date).getTime()
        break
      case 'incoming':
        aValue = a.incoming_qty
        bValue = b.incoming_qty
        break
      case 'used':
        aValue = a.used_qty
        bValue = b.used_qty
        break
      case 'stock':
        aValue = a.stock_qty
        bValue = b.stock_qty
        break
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const getPadding = () => {
    if (touchMode === 'glove') return 'p-4'
    if (touchMode === 'precision') return 'p-2'
    return 'p-3'
  }

  const getButtonSize = () => {
    if (touchMode === 'glove') return 'h-14'
    if (touchMode === 'precision') return 'h-10'
    return 'h-12'
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-gray-400" />
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="h-3 w-3 text-blue-600" />
      : <ArrowDown className="h-3 w-3 text-blue-600" />
  }

  const handleRequestSubmit = () => {
    // TODO: Implement API call to submit request
    console.log('Request submitted:', requestForm)
    setShowRequestModal(false)
    setRequestForm({ quantity: '', reason: '', urgency: 'normal' })
  }

  const handleRecordSubmit = () => {
    // TODO: Implement API call to submit record
    console.log('Record submitted:', recordForm)
    setShowRecordModal(false)
    setRecordForm({ type: 'incoming', quantity: '', note: '' })
  }

  return (
    <div className="space-y-4">
      {/* Summary Dashboard - Dark mode support */}
      <div className="grid grid-cols-2 gap-3">
        <Card className={`${getPadding()} bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700`}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <p className={`${getFullTypographyClass('caption', 'sm', isLargeFont)} font-medium text-gray-700 dark:text-gray-300`}>
                금일 현황
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-gray-500 dark:text-gray-400`}>입고</span>
                <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-semibold text-gray-900 dark:text-gray-100`}>
                  {summary.today.incoming.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-gray-500 dark:text-gray-400`}>사용</span>
                <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-semibold text-gray-900 dark:text-gray-100`}>
                  {summary.today.used.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-gray-500 dark:text-gray-400`}>재고</span>
                <span className={`${getFullTypographyClass('body', 'base', isLargeFont)} font-bold text-blue-600 dark:text-blue-400`}>
                  {summary.today.stock.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className={`${getPadding()} bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700`}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <p className={`${getFullTypographyClass('caption', 'sm', isLargeFont)} font-medium text-gray-700 dark:text-gray-300`}>
                누적 현황
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-gray-500 dark:text-gray-400`}>총입고</span>
                <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-semibold text-gray-900 dark:text-gray-100`}>
                  {summary.cumulative.totalIncoming.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-gray-500 dark:text-gray-400`}>총사용</span>
                <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-semibold text-gray-900 dark:text-gray-100`}>
                  {summary.cumulative.totalUsed.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-gray-500 dark:text-gray-400`}>현재고</span>
                <span className={`${getFullTypographyClass('body', 'base', isLargeFont)} font-bold text-green-600 dark:text-green-400`}>
                  {summary.cumulative.currentStock.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Table - Dark mode support */}
      <Card className="overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className={`text-left ${getPadding()}`}>
                  <button
                    onClick={() => handleSort('date')}
                    className={`flex items-center gap-1 ${getFullTypographyClass('caption', 'sm', isLargeFont)} font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100`}
                  >
                    날짜
                    {getSortIcon('date')}
                  </button>
                </th>
                <th className={`text-right ${getPadding()}`}>
                  <button
                    onClick={() => handleSort('incoming')}
                    className={`flex items-center gap-1 ${getFullTypographyClass('caption', 'sm', isLargeFont)} font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 ml-auto`}
                  >
                    입고
                    {getSortIcon('incoming')}
                  </button>
                </th>
                <th className={`text-right ${getPadding()}`}>
                  <button
                    onClick={() => handleSort('used')}
                    className={`flex items-center gap-1 ${getFullTypographyClass('caption', 'sm', isLargeFont)} font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 ml-auto`}
                  >
                    사용
                    {getSortIcon('used')}
                  </button>
                </th>
                <th className={`text-right ${getPadding()}`}>
                  <button
                    onClick={() => handleSort('stock')}
                    className={`flex items-center gap-1 ${getFullTypographyClass('caption', 'sm', isLargeFont)} font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 ml-auto`}
                  >
                    재고
                    {getSortIcon('stock')}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className={`${getPadding()} text-center py-8`}>
                    <RefreshCw className="h-6 w-6 text-gray-400 animate-spin mx-auto mb-2" />
                    <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500 dark:text-gray-400`}>
                      데이터를 불러오는 중...
                    </p>
                  </td>
                </tr>
              ) : sortedRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className={`${getPadding()} text-center py-8`}>
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500 dark:text-gray-400`}>
                      {currentSite 
                        ? 'NPC-1000 자재 기록이 없습니다.' 
                        : '현장을 선택하여 NPC-1000 자재 현황을 확인하세요.'}
                    </p>
                  </td>
                </tr>
              ) : (
                sortedRecords.map((record) => (
                  <>
                    <tr 
                      key={record.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                        expandedRows.has(record.id) ? 'bg-gray-50 dark:bg-gray-700/50' : ''
                      }`}
                      onClick={() => toggleRow(record.id)}
                    >
                      <td className={getPadding()}>
                        <div className="flex items-center gap-2">
                          <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-900 dark:text-gray-100`}>
                            {format(new Date(record.date), 'MM.dd (EEE)', { locale: ko })}
                          </span>
                          {record.date === format(new Date(), 'yyyy-MM-dd') && (
                            <Badge variant="default" className="h-5 px-2">
                              <span className={getFullTypographyClass('caption', 'xs', isLargeFont)}>오늘</span>
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className={`${getPadding()} text-right`}>
                        <span className={`${getFullTypographyClass('body', 'base', isLargeFont)} ${
                          record.incoming_qty > 0 ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'
                        }`}>
                          {record.incoming_qty > 0 ? `+${record.incoming_qty.toLocaleString()}` : '-'}
                        </span>
                      </td>
                      <td className={`${getPadding()} text-right`}>
                        <span className={`${getFullTypographyClass('body', 'base', isLargeFont)} ${
                          record.used_qty > 0 ? 'font-semibold text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-600'
                        }`}>
                          {record.used_qty > 0 ? `-${record.used_qty.toLocaleString()}` : '-'}
                        </span>
                      </td>
                      <td className={`${getPadding()} text-right`}>
                        <span className={`${getFullTypographyClass('body', 'base', isLargeFont)} font-semibold text-gray-900 dark:text-gray-100`}>
                          {record.stock_qty.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                    {expandedRows.has(record.id) && (
                      <tr key={`${record.id}-expanded`}>
                        <td colSpan={4} className="bg-gray-50 dark:bg-gray-900/50">
                          <div className={`${getPadding()} space-y-2 border-l-4 border-blue-500`}>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500 dark:text-gray-400`}>
                                  작성자
                                </p>
                                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-900 dark:text-gray-100`}>
                                  {record.daily_report?.created_by?.full_name || '알 수 없음'}
                                </p>
                              </div>
                              <div>
                                <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500 dark:text-gray-400`}>
                                  작성 시간
                                </p>
                                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-900 dark:text-gray-100`}>
                                  {format(new Date(record.created_at), 'HH:mm')}
                                </p>
                              </div>
                            </div>
                            {record.daily_report?.work_content && (
                              <div>
                                <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500 dark:text-gray-400 mb-1`}>
                                  작업 내용
                                </p>
                                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-700 dark:text-gray-300`}>
                                  {record.daily_report.work_content}
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Action Buttons - Consistent with other screens */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className={`${getButtonSize()} flex-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700`}
          onClick={() => setShowRequestModal(true)}
        >
          <FileText className="h-4 w-4 mr-2" />
          요청
        </Button>
        <Button
          variant="default"
          className={`${getButtonSize()} flex-1`}
          onClick={() => setShowRecordModal(true)}
        >
          <Package className="h-4 w-4 mr-2" />
          입출고 기록
        </Button>
      </div>

      {/* Request Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">NPC-1000 자재 요청</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              필요한 자재 수량과 사유를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right text-gray-700 dark:text-gray-300">
                수량
              </Label>
              <Input
                id="quantity"
                type="number"
                placeholder="0"
                className="col-span-3 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                value={requestForm.quantity}
                onChange={(e) => setRequestForm({ ...requestForm, quantity: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="urgency" className="text-right text-gray-700 dark:text-gray-300">
                긴급도
              </Label>
              <RadioGroup
                value={requestForm.urgency}
                onValueChange={(value) => setRequestForm({ ...requestForm, urgency: value })}
                className="col-span-3 flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="normal" className="border-gray-300 dark:border-gray-600 text-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                  <Label htmlFor="normal" className="text-gray-700 dark:text-gray-300 cursor-pointer">일반</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="urgent" id="urgent" className="border-gray-300 dark:border-gray-600 text-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                  <Label htmlFor="urgent" className="text-gray-700 dark:text-gray-300 cursor-pointer">긴급</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right text-gray-700 dark:text-gray-300">
                사유
              </Label>
              <Textarea
                id="reason"
                placeholder="요청 사유를 입력하세요"
                className="col-span-3 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                rows={3}
                value={requestForm.reason}
                onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRequestModal(false)}
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              취소
            </Button>
            <Button onClick={handleRequestSubmit}>요청하기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Input/Output Record Modal */}
      <Dialog open={showRecordModal} onOpenChange={setShowRecordModal}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">NPC-1000 입출고 기록</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              입고 또는 출고 정보를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-gray-700 dark:text-gray-300">
                구분
              </Label>
              <RadioGroup
                value={recordForm.type}
                onValueChange={(value) => setRecordForm({ ...recordForm, type: value })}
                className="col-span-3 flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="incoming" id="incoming" className="border-gray-300 dark:border-gray-600 text-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                  <Label htmlFor="incoming" className="text-gray-700 dark:text-gray-300 flex items-center gap-1 cursor-pointer">
                    <Plus className="h-3 w-3" />
                    입고
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="outgoing" id="outgoing" className="border-gray-300 dark:border-gray-600 text-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                  <Label htmlFor="outgoing" className="text-gray-700 dark:text-gray-300 flex items-center gap-1 cursor-pointer">
                    <Minus className="h-3 w-3" />
                    출고
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="record-quantity" className="text-right text-gray-700 dark:text-gray-300">
                수량
              </Label>
              <Input
                id="record-quantity"
                type="number"
                placeholder="0"
                className="col-span-3 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                value={recordForm.quantity}
                onChange={(e) => setRecordForm({ ...recordForm, quantity: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="note" className="text-right text-gray-700 dark:text-gray-300">
                비고
              </Label>
              <Textarea
                id="note"
                placeholder="추가 정보를 입력하세요 (선택)"
                className="col-span-3 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                rows={3}
                value={recordForm.note}
                onChange={(e) => setRecordForm({ ...recordForm, note: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRecordModal(false)}
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              취소
            </Button>
            <Button onClick={handleRecordSubmit}>
              {recordForm.type === 'incoming' ? '입고 기록' : '출고 기록'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}