'use client'


interface ShipmentManagementTabProps {
  profile: Profile
}

interface ExtendedShipmentRecord extends ShipmentRecord {
  site_name?: string
  creator_name?: string
}

interface Site {
  id: string
  name: string
}

interface MaterialRequest {
  id: string
  request_number: string
  site?: { name: string }
}

export default function ShipmentManagementTab({ profile }: ShipmentManagementTabProps) {
  const [shipments, setShipments] = useState<ExtendedShipmentRecord[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [requests, setRequests] = useState<MaterialRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedDateRange, setSelectedDateRange] = useState<string>('week')

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState<ExtendedShipmentRecord | null>(null)

  // Sort states
  const [sortField, setSortField] = useState<string>('shipment_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Form states
  const [formData, setFormData] = useState({
    site_id: '',
    material_request_id: '',
    quantity_shipped: '',
    planned_delivery_date: '',
    tracking_number: '',
    carrier: '',
    shipment_method: 'parcel',
    notes: ''
  })

  // Pending requests
  const [pendingRequests, setPendingRequests] = useState({
    urgent: [] as any[],
    high_priority: [] as any[],
    normal: [] as any[],
    total_count: 0
  })

  // Fetch data
  useEffect(() => {
    fetchShipments()
    fetchSites()
    fetchRequests()
    fetchPendingRequests()
  }, [selectedSite, selectedStatus, selectedDateRange])

  const fetchShipments = async () => {
    setLoading(true)
    try {
      const filters: unknown = {}
      
      // Date range filter
      const now = new Date()
      if (selectedDateRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        filters.start_date = weekAgo.toISOString().split('T')[0]
      } else if (selectedDateRange === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        filters.start_date = monthAgo.toISOString().split('T')[0]
      }

      if (selectedStatus !== 'all') {
        filters.status = selectedStatus
      }

      const result = await getShipmentHistory(selectedSite === 'all' ? undefined : selectedSite, filters)
      
      if (result.success) {
        setShipments(result.data || [])
      } else {
        toast.error(result.error || '출고 기록을 불러오는데 실패했습니다.')
      }
    } catch (error) {
      console.error('Error fetching shipments:', error)
      toast.error('출고 기록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/sites')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setSites(result.data)
        } else {
          setSites([])
        }
      }
    } catch (error) {
      console.error('Error fetching sites:', error)
      setSites([])
    }
  }

  const fetchRequests = async () => {
    try {
      // This would fetch approved material requests
      // For now, we'll set empty array
      setRequests([])
    } catch (error) {
      console.error('Error fetching requests:', error)
    }
  }

  const fetchPendingRequests = async () => {
    try {
      const result = await getPendingShipmentRequests()
      if (result.success && result.data) {
        setPendingRequests(result.data)
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error)
    }
  }

  const handleAdd = () => {
    setFormData({
      site_id: '',
      material_request_id: '',
      quantity_shipped: '',
      planned_delivery_date: '',
      tracking_number: '',
      carrier: '',
      shipment_method: 'parcel',
      notes: ''
    })
    setShowAddModal(true)
  }

  const handleEdit = (shipment: ExtendedShipmentRecord) => {
    setSelectedShipment(shipment)
    setFormData({
      site_id: shipment.site_id,
      material_request_id: shipment.material_request_id || '',
      quantity_shipped: shipment.quantity_shipped.toString(),
      planned_delivery_date: shipment.planned_delivery_date || '',
      tracking_number: shipment.tracking_number || '',
      carrier: shipment.carrier || '',
      shipment_method: 'parcel',
      notes: shipment.notes || ''
    })
    setShowEditModal(true)
  }

  const handleDetail = (shipment: ExtendedShipmentRecord) => {
    setSelectedShipment(shipment)
    setShowDetailModal(true)
  }

  const handleDelete = async (shipmentId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('shipments')
        .delete()
        .eq('id', shipmentId)
      
      if (error) throw error
      
      toast.success('출고 기록이 삭제되었습니다.')
      fetchShipments()
    } catch (error) {
      console.error('Error deleting shipment:', error)
      toast.error('출고 기록 삭제에 실패했습니다.')
    }
  }

  const submitShipment = async () => {
    try {
      if (!formData.site_id || !formData.quantity_shipped) {
        toast.error('필수 정보를 모두 입력해주세요.')
        return
      }

      const quantity = parseFloat(formData.quantity_shipped)
      if (isNaN(quantity) || quantity <= 0) {
        toast.error('올바른 수량을 입력해주세요.')
        return
      }

      const shipmentData = {
        site_id: formData.site_id,
        material_request_id: formData.material_request_id || undefined,
        quantity_shipped: quantity,
        planned_delivery_date: formData.planned_delivery_date || undefined,
        tracking_number: formData.tracking_number || undefined,
        carrier: formData.carrier || undefined,
        notes: formData.notes || undefined
      }

      const result = await processShipment(shipmentData)

      if (result.success) {
        toast.success('출고 기록이 추가되었습니다.')
        setShowAddModal(false)
        fetchShipments()
        fetchPendingRequests()
      } else {
        toast.error(result.error || '출고 기록 추가에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error adding shipment:', error)
      toast.error('출고 기록 추가에 실패했습니다.')
    }
  }

  const updateShipment = async () => {
    if (!selectedShipment) return

    try {
      const updates = {
        planned_delivery_date: formData.planned_delivery_date || undefined,
        tracking_number: formData.tracking_number || undefined,
        carrier: formData.carrier || undefined,
        notes: formData.notes || undefined
      }

      const result = await updateShipmentInfo(selectedShipment.id, updates)

      if (result.success) {
        toast.success('출고 정보가 수정되었습니다.')
        setShowEditModal(false)
        setSelectedShipment(null)
        fetchShipments()
      } else {
        toast.error(result.error || '출고 정보 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error updating shipment:', error)
      toast.error('출고 정보 수정에 실패했습니다.')
    }
  }

  const handleStatusUpdate = async (shipmentId: string, newStatus: 'preparing' | 'shipped' | 'in_transit' | 'delivered' | 'cancelled') => {
    try {
      const result = await updateShipmentStatus(shipmentId, newStatus)

      if (result.success) {
        toast.success('출고 상태가 업데이트되었습니다.')
        fetchShipments()
        if (showDetailModal) {
          setShowDetailModal(false)
        }
      } else {
        toast.error(result.error || '상태 업데이트에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('상태 업데이트에 실패했습니다.')
    }
  }

  const filteredShipments = shipments.filter(shipment =>
    searchTerm === '' || 
    shipment.shipment_date.includes(searchTerm) ||
    shipment.site_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.carrier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Sort shipments
  const sortedShipments = [...filteredShipments].sort((a, b) => {
    let aVal: unknown = a[sortField as keyof ExtendedShipmentRecord]
    let bVal: unknown = b[sortField as keyof ExtendedShipmentRecord]
    
    if (aVal === null || aVal === undefined) aVal = ''
    if (bVal === null || bVal === undefined) bVal = ''
    
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }
    
    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return <div className="w-4 h-4" />
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="default" className="bg-green-100 text-green-800">배송완료</Badge>
      case 'in_transit':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">운송중</Badge>
      case 'shipped':
        return <Badge variant="default" className="bg-indigo-100 text-indigo-800">출고완료</Badge>
      case 'cancelled':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">취소됨</Badge>
      case 'preparing':
      default:
        return <Badge variant="secondary">준비중</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in_transit':
        return <Truck className="h-4 w-4 text-blue-600" />
      case 'shipped':
        return <Package className="h-4 w-4 text-indigo-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'preparing':
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const totalShipments = filteredShipments.length
  const deliveredCount = filteredShipments.filter(s => s.status === 'delivered').length
  const inTransitCount = filteredShipments.filter(s => s.status === 'in_transit' || s.status === 'shipped').length
  const totalQuantity = filteredShipments.reduce((sum, s) => sum + s.quantity_shipped, 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">총 출고</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalShipments}</p>
                <p className="text-xs text-gray-500">{totalQuantity.toLocaleString()} 말</p>
              </div>
              <Truck className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">배송완료</p>
                <p className="text-2xl font-bold text-green-600">{deliveredCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">운송중</p>
                <p className="text-2xl font-bold text-blue-600">{inTransitCount}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">대기중</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingRequests.total_count}</p>
                <p className="text-xs text-red-500">긴급: {pendingRequests.urgent.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="출고일, 현장명, 운송업체, 송장번호로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>

          <Select value={selectedSite} onValueChange={setSelectedSite}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="현장 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 현장</SelectItem>
              {sites.map((site) => (
                <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="preparing">준비중</SelectItem>
              <SelectItem value="shipped">출고완료</SelectItem>
              <SelectItem value="in_transit">운송중</SelectItem>
              <SelectItem value="delivered">배송완료</SelectItem>
              <SelectItem value="cancelled">취소됨</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="기간" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">1주일</SelectItem>
              <SelectItem value="month">1개월</SelectItem>
              <SelectItem value="all">전체</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="standard">
            <Download className="h-4 w-4 mr-2" />
            내보내기
          </Button>
          <Button onClick={handleAdd} size="standard">
            <PlusCircle className="h-4 w-4 mr-2" />
            출고 추가
          </Button>
        </div>
      </div>

      {/* Shipments Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('shipment_date')}
                  >
                    <div className="flex items-center justify-between">
                      <span>출고일</span>
                      <SortIcon field="shipment_date" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('site_name')}
                  >
                    <div className="flex items-center justify-between">
                      <span>현장</span>
                      <SortIcon field="site_name" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('quantity_shipped')}
                  >
                    <div className="flex items-center justify-between">
                      <span>출고량</span>
                      <SortIcon field="quantity_shipped" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center justify-between">
                      <span>상태</span>
                      <SortIcon field="status" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('planned_delivery_date')}
                  >
                    <div className="flex items-center justify-between">
                      <span>예정일</span>
                      <SortIcon field="planned_delivery_date" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSort('carrier')}
                  >
                    <div className="flex items-center justify-between">
                      <span>운송업체</span>
                      <SortIcon field="carrier" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">송장번호</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">로딩 중...</td>
                  </tr>
                ) : filteredShipments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">출고 기록이 없습니다.</td>
                  </tr>
                ) : (
                  sortedShipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(shipment.shipment_date)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {shipment.site_name || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {shipment.quantity_shipped.toLocaleString()} 말
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(shipment.status)}
                          <span className="ml-2">{getStatusBadge(shipment.status)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {shipment.planned_delivery_date ? formatDate(shipment.planned_delivery_date) : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {shipment.carrier || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {shipment.tracking_number || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Button
                            variant="ghost"
                            size="compact"
                            onClick={() => handleDetail(shipment)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            보기
                          </Button>
                          <Button
                            variant="ghost"
                            size="compact"
                            onClick={() => handleEdit(shipment)}
                            className="text-green-600 hover:text-green-800 hover:bg-green-50"
                          >
                            수정
                          </Button>
                          <Button
                            variant="ghost"
                            size="compact"
                            onClick={() => handleDelete(shipment.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            삭제
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Shipment Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold">출고 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-2">
            <div>
              <Label>현장 *</Label>
              <Select value={formData.site_id} onValueChange={(value) => setFormData({...formData, site_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="현장 선택" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>출고방식 *</Label>
              <CustomSelect value={formData.shipment_method} onValueChange={(value) => setFormData({...formData, shipment_method: value})}>
                <CustomSelectTrigger>
                  <CustomSelectValue placeholder="출고방식 선택" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  <CustomSelectItem value="parcel">택배</CustomSelectItem>
                  <CustomSelectItem value="freight">화물</CustomSelectItem>
                  <CustomSelectItem value="other">기타</CustomSelectItem>
                </CustomSelectContent>
              </CustomSelect>
            </div>
            <div>
              <Label>출고량 (말) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.quantity_shipped}
                onChange={(e) => setFormData({...formData, quantity_shipped: e.target.value})}
                placeholder="출고량 입력"
              />
            </div>
            <div>
              <Label>예정 배송일</Label>
              <Input
                type="date"
                value={formData.planned_delivery_date}
                onChange={(e) => setFormData({...formData, planned_delivery_date: e.target.value})}
              />
            </div>
            <div>
              <Label>운송업체</Label>
              <Input
                value={formData.carrier}
                onChange={(e) => setFormData({...formData, carrier: e.target.value})}
                placeholder="운송업체명"
              />
            </div>
            <div>
              <Label>송장번호</Label>
              <Input
                value={formData.tracking_number}
                onChange={(e) => setFormData({...formData, tracking_number: e.target.value})}
                placeholder="송장번호"
              />
            </div>
            <div>
              <Label>비고</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="추가 설명이나 비고사항"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>취소</Button>
            <Button onClick={submitShipment}>추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Shipment Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>출고 정보 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>예정 배송일</Label>
              <Input
                type="date"
                value={formData.planned_delivery_date}
                onChange={(e) => setFormData({...formData, planned_delivery_date: e.target.value})}
              />
            </div>
            <div>
              <Label>운송업체</Label>
              <Input
                value={formData.carrier}
                onChange={(e) => setFormData({...formData, carrier: e.target.value})}
                placeholder="운송업체명"
              />
            </div>
            <div>
              <Label>송장번호</Label>
              <Input
                value={formData.tracking_number}
                onChange={(e) => setFormData({...formData, tracking_number: e.target.value})}
                placeholder="송장번호"
              />
            </div>
            <div>
              <Label>비고</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="추가 설명이나 비고사항"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>취소</Button>
            <Button onClick={updateShipment}>수정</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>출고 상세</DialogTitle>
          </DialogHeader>
          {selectedShipment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">출고일</Label>
                    <p className="text-lg font-medium">{formatDate(selectedShipment.shipment_date)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">현장</Label>
                    <p className="text-lg">{selectedShipment.site_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">출고량</Label>
                    <p className="text-lg">{selectedShipment.quantity_shipped.toLocaleString()} 말</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">상태</Label>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedShipment.status)}
                      {getStatusBadge(selectedShipment.status)}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">예정 배송일</Label>
                    <p className="text-lg">{selectedShipment.planned_delivery_date ? formatDate(selectedShipment.planned_delivery_date) : '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">실제 배송일</Label>
                    <p className="text-lg">{selectedShipment.actual_delivery_date ? formatDate(selectedShipment.actual_delivery_date) : '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">운송업체</Label>
                    <p className="text-lg">{selectedShipment.carrier || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">송장번호</Label>
                    <p className="text-lg">{selectedShipment.tracking_number || '-'}</p>
                  </div>
                </div>
              </div>
              
              {selectedShipment.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">비고</Label>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-md mt-1">
                    {selectedShipment.notes}
                  </p>
                </div>
              )}

              {/* Status Actions */}
              {selectedShipment.status !== 'delivered' && selectedShipment.status !== 'cancelled' && (
                <div className="flex gap-2 pt-4 border-t">
                  {selectedShipment.status === 'preparing' && (
                    <Button 
                      onClick={() => handleStatusUpdate(selectedShipment.id, 'shipped')}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      출고 처리
                    </Button>
                  )}
                  {selectedShipment.status === 'shipped' && (
                    <Button 
                      onClick={() => handleStatusUpdate(selectedShipment.id, 'in_transit')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      운송 시작
                    </Button>
                  )}
                  {selectedShipment.status === 'in_transit' && (
                    <Button 
                      onClick={() => handleStatusUpdate(selectedShipment.id, 'delivered')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      배송 완료
                    </Button>
                  )}
                  <Button 
                    variant="danger"
                    onClick={() => handleStatusUpdate(selectedShipment.id, 'cancelled')}
                  >
                    출고 취소
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-sm font-medium text-gray-500">생성일</Label>
                  <p className="text-sm">{formatDate(selectedShipment.created_at)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">수정일</Label>
                  <p className="text-sm">{formatDate(selectedShipment.updated_at)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}