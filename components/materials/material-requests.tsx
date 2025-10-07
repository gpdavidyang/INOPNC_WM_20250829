'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface MaterialRequestsProps {
  materials: unknown[]
  currentUser: unknown
  currentSite?: unknown
}

export function MaterialRequests({ materials, currentUser, currentSite }: MaterialRequestsProps) {
  const [requests, setRequests] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set())
  const [selectedSite, setSelectedSite] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Form data for new request
  const [requestForm, setRequestForm] = useState({
    site_id: '',
    required_date: format(new Date(), 'yyyy-MM-dd'),
    priority: 'normal' as 'urgent' | 'high' | 'normal' | 'low',
    notes: '',
    items: [] as Array<{
      material_id: string
      requested_quantity: number
      notes: string
    }>,
  })

  useEffect(() => {
    loadSites()
    loadRequests()
  }, [])

  const loadSites = async () => {
    const result = await getSites()
    if (result.success && result.data) {
      setSites(result.data)
    }
  }

  const loadRequests = async () => {
    setLoading(true)
    try {
      const filters: unknown = {}
      if (selectedSite) filters.site_id = selectedSite
      if (statusFilter !== 'all') filters.status = statusFilter

      const result = await getMaterialRequests(filters)
      if (result.success && result.data) {
        setRequests(result.data)
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleRequestExpanded = (requestId: string) => {
    const newExpanded = new Set(expandedRequests)
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId)
    } else {
      newExpanded.add(requestId)
    }
    setExpandedRequests(newExpanded)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="h-3 w-3" />
            대기중
          </Badge>
        )
      case 'approved':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            승인됨
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="error" className="gap-1">
            <XCircle className="h-3 w-3" />
            반려됨
          </Badge>
        )
      case 'ordered':
        return (
          <Badge variant="secondary" className="gap-1">
            <Package className="h-3 w-3" />
            발주완료
          </Badge>
        )
      case 'delivered':
        return (
          <Badge variant="default" className="gap-1">
            <Truck className="h-3 w-3" />
            입고완료
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="error">긴급</Badge>
      case 'high':
        return <Badge variant="warning">높음</Badge>
      case 'low':
        return <Badge variant="secondary">낮음</Badge>
      default:
        return <Badge variant="outline">보통</Badge>
    }
  }

  const addRequestItem = () => {
    setRequestForm({
      ...requestForm,
      items: [
        ...requestForm.items,
        {
          material_id: '',
          requested_quantity: 0,
          notes: '',
        },
      ],
    })
  }

  const updateRequestItem = (index: number, field: string, value: unknown) => {
    const newItems = [...requestForm.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setRequestForm({ ...requestForm, items: newItems })
  }

  const removeRequestItem = (index: number) => {
    setRequestForm({
      ...requestForm,
      items: requestForm.items.filter((_, i) => i !== index),
    })
  }

  const handleCreateRequest = async () => {
    try {
      const result = await createMaterialRequest({
        site_id: requestForm.site_id,
        priority: requestForm.priority,
        needed_by: requestForm.required_date, // Map required_date to needed_by
        notes: requestForm.notes,
        items: requestForm.items,
      })

      if (result.success) {
        toast({
          title: '자재 요청 생성 완료',
          description: '자재 요청이 성공적으로 생성되었습니다.',
        })
        setShowCreateDialog(false)
        resetForm()
        loadRequests()
      } else {
        toast({
          title: '자재 요청 실패',
          description: result.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '오류 발생',
        description: '자재 요청 생성 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }

  const handleStatusUpdate = async (requestId: string, newStatus: unknown, notes?: string) => {
    try {
      const result = await updateMaterialRequestStatus(requestId, newStatus, notes)
      if (result.success) {
        toast({
          title: '상태 변경 완료',
          description: '요청 상태가 성공적으로 변경되었습니다.',
        })
        loadRequests()
      } else {
        toast({
          title: '상태 변경 실패',
          description: result.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '오류 발생',
        description: '상태 변경 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }

  const resetForm = () => {
    setRequestForm({
      site_id: '',
      required_date: format(new Date(), 'yyyy-MM-dd'),
      priority: 'normal',
      notes: '',
      items: [],
    })
  }

  const filteredRequests = requests.filter(request => {
    if (selectedSite && request.site_id !== selectedSite) return false
    if (statusFilter !== 'all' && request.status !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={selectedSite}
          onChange={e => {
            setSelectedSite(e.target.value)
            loadRequests()
          }}
          className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        >
          <option value="">모든 현장</option>
          {sites.map(site => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={e => {
            setStatusFilter(e.target.value)
            loadRequests()
          }}
          className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        >
          <option value="all">모든 상태</option>
          <option value="pending">대기중</option>
          <option value="approved">승인됨</option>
          <option value="rejected">반려됨</option>
          <option value="ordered">발주완료</option>
          <option value="delivered">입고완료</option>
        </select>

        <Button
          onClick={() => {
            resetForm()
            setShowCreateDialog(true)
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          자재 요청
        </Button>
      </div>

      {/* Request List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">요청 목록을 불러오는 중...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">자재 요청이 없습니다.</div>
        ) : (
          filteredRequests.map(request => (
            <Card key={request.id} className="overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleRequestExpanded(request.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-900">요청 #{request.id.slice(-8)}</h3>
                      {getStatusBadge(request.status)}
                      {getPriorityBadge(request.priority)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {request.site?.name || '알 수 없는 현장'}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {request.requested_by ? (
                          <a
                            href={`/dashboard/admin/users/${request.requested_by}`}
                            className="underline-offset-2 hover:underline"
                          >
                            {request.requester?.full_name || request.requested_by}
                          </a>
                        ) : (
                          <span>{request.requester?.full_name || '알 수 없음'}</span>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        필요일: {format(new Date(request.required_date), 'yyyy-MM-dd')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {request.items?.length || 0}개 품목
                    </span>
                    {expandedRequests.has(request.id) ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {expandedRequests.has(request.id) && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  {/* Request Items */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">요청 품목</h4>
                    <div className="space-y-2">
                      {request.items?.map((item: unknown, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.material?.name}</p>
                            <p className="text-xs text-gray-600">
                              코드: {item.material?.material_code} | 요청수량:{' '}
                              {item.requested_quantity} {item.material?.unit}
                            </p>
                            {item.notes && (
                              <p className="text-xs text-gray-600 mt-1">비고: {item.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Request Notes */}
                  {request.notes && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">요청 사유</h4>
                      <p className="text-sm text-gray-600">{request.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {request.status === 'pending' && (
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="compact"
                        variant="outline"
                        onClick={() => handleStatusUpdate(request.id, 'rejected', '재고 충분')}
                      >
                        반려
                      </Button>
                      <Button
                        size="compact"
                        onClick={() => handleStatusUpdate(request.id, 'approved')}
                      >
                        승인
                      </Button>
                    </div>
                  )}

                  {request.status === 'approved' && (
                    <div className="flex justify-end">
                      <Button
                        size="compact"
                        onClick={() => handleStatusUpdate(request.id, 'ordered')}
                      >
                        발주 완료
                      </Button>
                    </div>
                  )}

                  {request.status === 'ordered' && (
                    <div className="flex justify-end">
                      <Button
                        size="compact"
                        onClick={() => handleStatusUpdate(request.id, 'delivered')}
                      >
                        입고 완료
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Create Request Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>새 자재 요청</DialogTitle>
            <DialogDescription>
              필요한 자재를 요청합니다. 승인 후 발주가 진행됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="site">현장 *</Label>
                <select
                  id="site"
                  value={requestForm.site_id}
                  onChange={e => setRequestForm({ ...requestForm, site_id: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                >
                  <option value="">현장 선택</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="required_date">필요일 *</Label>
                <Input
                  id="required_date"
                  type="date"
                  value={requestForm.required_date}
                  onChange={e => setRequestForm({ ...requestForm, required_date: e.target.value })}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="priority">우선순위 *</Label>
              <select
                id="priority"
                value={requestForm.priority}
                onChange={e =>
                  setRequestForm({ ...requestForm, priority: e.target.value as unknown })
                }
                className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="low">낮음</option>
                <option value="normal">보통</option>
                <option value="high">높음</option>
                <option value="urgent">긴급</option>
              </select>
            </div>

            <div>
              <Label>요청 품목 *</Label>
              <div className="space-y-2 mt-2">
                {requestForm.items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <select
                      value={item.material_id}
                      onChange={e => updateRequestItem(index, 'material_id', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      required
                    >
                      <option value="">자재 선택</option>
                      {materials.map(material => (
                        <option key={material.id} value={material.id}>
                          {material.name} ({material.material_code})
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      value={item.requested_quantity}
                      onChange={e =>
                        updateRequestItem(index, 'requested_quantity', parseFloat(e.target.value))
                      }
                      placeholder="수량"
                      className="w-24"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="compact"
                      onClick={() => removeRequestItem(index)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="compact"
                  onClick={addRequestItem}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  품목 추가
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">요청 사유</Label>
              <textarea
                id="notes"
                value={requestForm.notes}
                onChange={e => setRequestForm({ ...requestForm, notes: e.target.value })}
                placeholder="자재 요청 사유를 입력하세요"
                rows={3}
                className="w-full mt-1.5 px-3 py-2 rounded-md border border-gray-300"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              취소
            </Button>
            <Button
              onClick={handleCreateRequest}
              disabled={!requestForm.site_id || requestForm.items.length === 0}
            >
              요청 생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
