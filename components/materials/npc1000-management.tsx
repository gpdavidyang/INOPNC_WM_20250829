'use client'


interface NPC1000Record {
  id: string
  date: string
  incoming_qty: number
  used_qty: number
  stock_qty: number
  work_log_id?: string
  created_by?: {
    full_name: string
  }
  created_at: string
}

interface NPC1000ManagementProps {
  currentSite?: unknown
  currentUser?: unknown
}

export function NPC1000Management({ currentSite, currentUser }: NPC1000ManagementProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | '7days' | '30days' | 'all'>('7days')
  const [records, setRecords] = useState<NPC1000DailyRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState({
    today: { incoming: 0, used: 0, stock: 0 },
    cumulative: { totalIncoming: 0, totalUsed: 0, currentStock: 0 }
  })

  useEffect(() => {
    if (currentSite?.site_id) {
      loadNPC1000Data()
    }
  }, [selectedPeriod, currentSite])

  const loadNPC1000Data = async () => {
    if (!currentSite?.site_id) return

    setLoading(true)
    try {
      // Load records
      const recordsResult = await getNPC1000Records(currentSite.site_id, selectedPeriod)
      if (recordsResult.success && recordsResult.data) {
        setRecords(recordsResult.data)
      }

      // Load summary
      const summaryResult = await getNPC1000Summary(currentSite.site_id)
      if (summaryResult.success && summaryResult.data) {
        setSummary(summaryResult.data)
      }
    } catch (error) {
      console.error('Error loading NPC-1000 data:', error)
    } finally {
      setLoading(false)
    }
  }


  const getPadding = () => {
    if (touchMode === 'glove') return 'p-4'
    if (touchMode === 'precision') return 'p-2'
    return 'p-3'
  }

  const getButtonSize = () => {
    if (touchMode === 'glove') return 'h-12'
    if (touchMode === 'precision') return 'h-8'
    return 'h-10'
  }

  return (
    <div className="space-y-4">
      {/* Summary Dashboard */}
      <div className="grid grid-cols-2 gap-3">
        <Card className={`${getPadding()} bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200`}>
          <div className="space-y-1">
            <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} font-medium text-blue-600`}>
              📦 금일 현황
            </p>
            <div className="space-y-0.5">
              <div className="flex justify-between items-center">
                <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-gray-600`}>입고</span>
                <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-semibold text-gray-900`}>
                  {summary.today.incoming}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-gray-600`}>사용</span>
                <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-semibold text-gray-900`}>
                  {summary.today.used}
                </span>
              </div>
              <div className="flex justify-between items-center border-t pt-1">
                <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-gray-600`}>재고</span>
                <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-bold text-blue-900`}>
                  {summary.today.stock}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className={`${getPadding()} bg-gradient-to-br from-green-50 to-green-100 border-green-200`}>
          <div className="space-y-1">
            <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} font-medium text-green-600`}>
              📈 누적 현황
            </p>
            <div className="space-y-0.5">
              <div className="flex justify-between items-center">
                <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-gray-600`}>총입고</span>
                <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-semibold text-gray-900`}>
                  {summary.cumulative.totalIncoming.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-gray-600`}>총사용</span>
                <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-semibold text-gray-900`}>
                  {summary.cumulative.totalUsed.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center border-t pt-1">
                <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-gray-600`}>현재고</span>
                <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-bold text-green-900`}>
                  {summary.cumulative.currentStock.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Period Filter */}
      <div className="flex gap-2 overflow-x-auto">
        <Button
          variant={selectedPeriod === 'today' ? 'default' : 'outline'}
          size="sm"
          className={getButtonSize()}
          onClick={() => setSelectedPeriod('today')}
        >
          오늘
        </Button>
        <Button
          variant={selectedPeriod === '7days' ? 'default' : 'outline'}
          size="sm"
          className={getButtonSize()}
          onClick={() => setSelectedPeriod('7days')}
        >
          7일
        </Button>
        <Button
          variant={selectedPeriod === '30days' ? 'default' : 'outline'}
          size="sm"
          className={getButtonSize()}
          onClick={() => setSelectedPeriod('30days')}
        >
          30일
        </Button>
        <Button
          variant={selectedPeriod === 'all' ? 'default' : 'outline'}
          size="sm"
          className={getButtonSize()}
          onClick={() => setSelectedPeriod('all')}
        >
          전체
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={`${getButtonSize()} gap-1`}
        >
          <Calendar className="h-3 w-3" />
          날짜선택
        </Button>
      </div>

      {/* Records List */}
      {loading ? (
        <Card className={`${getPadding()} text-center py-6`}>
          <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-3" />
          <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>
            NPC-1000 자재 정보를 불러오는 중...
          </p>
        </Card>
      ) : (
      <div className="space-y-2">
        {records.map((record) => (
          <Card key={record.id} className={`${getPadding()} hover:bg-gray-50 transition-colors cursor-pointer`}>
            <div className="space-y-2">
              {/* Date Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium`}>
                    {format(new Date(record.date), 'yyyy.MM.dd (EEE)', { locale: ko })}
                  </span>
                  {record.date === format(new Date(), 'yyyy-MM-dd') && (
                    <Badge variant="default" className="h-5 text-xs">오늘</Badge>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>

              {/* Quantities */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>입고</p>
                  <p className={`${getFullTypographyClass('body', 'base', isLargeFont)} font-semibold text-blue-600`}>
                    {record.incoming_qty}
                  </p>
                </div>
                <div>
                  <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>사용</p>
                  <p className={`${getFullTypographyClass('body', 'base', isLargeFont)} font-semibold text-orange-600`}>
                    {record.used_qty}
                  </p>
                </div>
                <div>
                  <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>재고</p>
                  <p className={`${getFullTypographyClass('body', 'base', isLargeFont)} font-semibold text-green-600`}>
                    {record.stock_qty}
                  </p>
                </div>
              </div>

              {/* Writer Info */}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>
                  📝 작업자: {record.daily_report?.created_by?.full_name || '알 수 없음'}
                </span>
                <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>
                  {format(new Date(record.created_at), 'HH:mm')} 작성
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
      )}

      {/* Empty State */}
      {!loading && records.length === 0 && (
        <Card className={`${getPadding()} text-center py-8`}>
          <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>
            {currentSite 
              ? '선택한 기간에 NPC-1000 자재 기록이 없습니다.' 
              : '현장을 선택하여 NPC-1000 자재 현황을 확인하세요.'}
          </p>
        </Card>
      )}
    </div>
  )
}