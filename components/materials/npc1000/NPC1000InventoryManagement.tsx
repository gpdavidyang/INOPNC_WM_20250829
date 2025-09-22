'use client'


interface InventoryItem {
  id: string
  site_id: string
  site_name: string
  current_stock: number
  minimum_stock: number
  maximum_stock: number
  last_purchase_date: string
  last_purchase_price: number
  storage_location: string
  usage_trend: 'up' | 'down' | 'stable'
  monthly_usage: number
  days_remaining: number
  status: 'normal' | 'low' | 'critical' | 'overstocked'
}

interface NPC1000InventoryManagementProps {
  siteId: string
  currentUser: unknown
}

export function NPC1000InventoryManagement({ siteId, currentUser }: NPC1000InventoryManagementProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

  useEffect(() => {
    if (siteId) {
      loadInventory()
    }
  }, [siteId])

  const loadInventory = async () => {
    setLoading(true)
    try {
      // Mock data - replace with actual API call
      const mockData: InventoryItem[] = [
        {
          id: '1',
          site_id: siteId,
          site_name: '서울 강남 현장',
          current_stock: 5000,
          minimum_stock: 2000,
          maximum_stock: 10000,
          last_purchase_date: '2024-03-15',
          last_purchase_price: 45000,
          storage_location: 'A동 창고',
          usage_trend: 'up',
          monthly_usage: 1200,
          days_remaining: 125,
          status: 'normal'
        },
        {
          id: '2',
          site_id: siteId,
          site_name: '부산 해운대 현장',
          current_stock: 1500,
          minimum_stock: 2000,
          maximum_stock: 8000,
          last_purchase_date: '2024-03-10',
          last_purchase_price: 44500,
          storage_location: 'B동 창고',
          usage_trend: 'down',
          monthly_usage: 800,
          days_remaining: 56,
          status: 'low'
        },
        {
          id: '3',
          site_id: siteId,
          site_name: '인천 송도 현장',
          current_stock: 500,
          minimum_stock: 1500,
          maximum_stock: 6000,
          last_purchase_date: '2024-03-05',
          last_purchase_price: 46000,
          storage_location: 'C동 창고',
          usage_trend: 'stable',
          monthly_usage: 600,
          days_remaining: 25,
          status: 'critical'
        }
      ]
      setInventory(mockData)
    } catch (error) {
      console.error('Failed to load inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.site_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.storage_location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || item.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'normal':
        return <Badge className="bg-green-100 text-green-800">정상</Badge>
      case 'low':
        return <Badge className="bg-yellow-100 text-yellow-800">부족</Badge>
      case 'critical':
        return <Badge className="bg-red-100 text-red-800">긴급</Badge>
      case 'overstocked':
        return <Badge className="bg-blue-100 text-blue-800">과잉</Badge>
      default:
        return null
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-600" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-green-600" />
      default:
        return <RefreshCw className="w-4 h-4 text-gray-600" />
    }
  }

  const handleStockAdjustment = (item: InventoryItem, adjustment: number) => {
    setSelectedItem(item)
    setShowAdjustmentModal(true)
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="현장명, 창고 위치로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="all">전체 상태</option>
              <option value="normal">정상</option>
              <option value="low">부족</option>
              <option value="critical">긴급</option>
              <option value="overstocked">과잉</option>
            </select>
            <Button variant="outline" onClick={loadInventory}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              내보내기
            </Button>
          </div>
        </div>
      </Card>

      {/* Inventory List */}
      <div className="grid gap-4">
        {loading ? (
          <Card className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">재고 정보를 불러오는 중...</p>
          </Card>
        ) : filteredInventory.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">재고 정보가 없습니다.</p>
          </Card>
        ) : (
          filteredInventory.map((item: unknown) => (
            <Card key={item.id} className="p-6">
              <div className="flex flex-col lg:flex-row justify-between gap-4">
                {/* Site Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-gray-600" />
                        {item.site_name}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin className="w-4 h-4" />
                        {item.storage_location}
                      </p>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  {/* Stock Info */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">현재 재고</p>
                      <p className="text-xl font-bold">{item.current_stock.toLocaleString()} 말</p>
                      <div className="mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={cn(
                              "h-2 rounded-full",
                              item.status === 'normal' && "bg-green-600",
                              item.status === 'low' && "bg-yellow-600",
                              item.status === 'critical' && "bg-red-600",
                              item.status === 'overstocked' && "bg-blue-600"
                            )}
                            style={{
                              width: `${Math.min(
                                (item.current_stock / item.maximum_stock) * 100,
                                100
                              )}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">월간 사용량</p>
                      <p className="text-lg font-semibold flex items-center gap-2">
                        {item.monthly_usage.toLocaleString()} 말
                        {getTrendIcon(item.usage_trend)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">예상 소진일</p>
                      <p className="text-lg font-semibold">
                        {item.days_remaining}일 후
                      </p>
                      {item.days_remaining < 30 && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          주문 필요
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">최근 구매일</p>
                      <p className="text-lg font-semibold">
                        {format(new Date(item.last_purchase_date), 'MM.dd')}
                      </p>
                      <p className="text-xs text-gray-500">
                        ₩{item.last_purchase_price.toLocaleString()}/말
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex lg:flex-col gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="compact"
                    onClick={() => handleStockAdjustment(item, 1)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    입고
                  </Button>
                  <Button
                    variant="outline"
                    size="compact"
                    onClick={() => handleStockAdjustment(item, -1)}
                  >
                    <Minus className="w-4 h-4 mr-1" />
                    출고
                  </Button>
                  <Button
                    variant="outline"
                    size="compact"
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    이력
                  </Button>
                </div>
              </div>

              {/* Stock Levels */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    최소 재고: {item.minimum_stock.toLocaleString()} 말
                  </span>
                  <span className="text-gray-600">
                    최대 재고: {item.maximum_stock.toLocaleString()} 말
                  </span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}