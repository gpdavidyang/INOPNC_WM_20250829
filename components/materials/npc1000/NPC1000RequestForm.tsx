'use client'


interface NPC1000RequestFormProps {
  siteId: string
  currentUser: unknown
  onClose: () => void
  onSuccess: () => void
}

export function NPC1000RequestForm({ siteId, currentUser, onClose, onSuccess }: NPC1000RequestFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    site_id: siteId,
    requested_quantity: '',
    required_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    priority: 'normal',
    notes: '',
    purpose: '',
    estimated_usage_days: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.requested_quantity || parseFloat(formData.requested_quantity) <= 0) {
      newErrors.requested_quantity = '요청 수량을 입력해주세요'
    }
    
    if (!formData.required_date) {
      newErrors.required_date = '필요일자를 선택해주세요'
    }
    
    if (!formData.purpose) {
      newErrors.purpose = '사용 목적을 입력해주세요'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Show success message
      onSuccess()
    } catch (error) {
      console.error('Failed to submit request:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'normal': return 'text-blue-600 bg-blue-50'
      case 'low': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">NPC-1000 자재 요청</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Request Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>요청자: {currentUser.full_name}</span>
              <span className="mx-2">•</span>
              <Calendar className="w-4 h-4" />
              <span>요청일: {format(new Date(), 'yyyy년 MM월 dd일')}</span>
            </div>
          </div>

          {/* Quantity and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="requested_quantity" className="required">
                요청 수량 (말)
              </Label>
              <Input
                id="requested_quantity"
                type="number"
                placeholder="0"
                value={formData.requested_quantity}
                onChange={(e) => handleChange('requested_quantity', e.target.value)}
                className={cn(errors.requested_quantity && 'border-red-500')}
              />
              {errors.requested_quantity && (
                <p className="text-sm text-red-600 mt-1">{errors.requested_quantity}</p>
              )}
            </div>

            <div>
              <Label htmlFor="priority">우선순위</Label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="low">낮음</option>
                <option value="normal">보통</option>
                <option value="high">높음</option>
                <option value="urgent">긴급</option>
              </select>
              <div className="mt-2">
                <span className={cn(
                  'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                  getPriorityColor(formData.priority)
                )}>
                  {formData.priority === 'urgent' && '긴급'}
                  {formData.priority === 'high' && '높음'}
                  {formData.priority === 'normal' && '보통'}
                  {formData.priority === 'low' && '낮음'}
                </span>
              </div>
            </div>
          </div>

          {/* Required Date and Usage Days */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="required_date" className="required">
                필요일자
              </Label>
              <Input
                id="required_date"
                type="date"
                value={formData.required_date}
                onChange={(e) => handleChange('required_date', e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className={cn(errors.required_date && 'border-red-500')}
              />
              {errors.required_date && (
                <p className="text-sm text-red-600 mt-1">{errors.required_date}</p>
              )}
            </div>

            <div>
              <Label htmlFor="estimated_usage_days">
                예상 사용 기간 (일)
              </Label>
              <Input
                id="estimated_usage_days"
                type="number"
                placeholder="30"
                value={formData.estimated_usage_days}
                onChange={(e) => handleChange('estimated_usage_days', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                일평균 사용량 계산에 활용됩니다
              </p>
            </div>
          </div>

          {/* Purpose */}
          <div>
            <Label htmlFor="purpose" className="required">
              사용 목적
            </Label>
            <Input
              id="purpose"
              placeholder="예: 3층 슬라브 균열 보수 작업"
              value={formData.purpose}
              onChange={(e) => handleChange('purpose', e.target.value)}
              className={cn(errors.purpose && 'border-red-500')}
            />
            {errors.purpose && (
              <p className="text-sm text-red-600 mt-1">{errors.purpose}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">추가 요청사항</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="특별한 요청사항이 있으면 입력해주세요"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-3">요청 요약</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">요청 수량:</span>
                <span className="font-medium">
                  {formData.requested_quantity || '0'} 말
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">필요일자:</span>
                <span className="font-medium">
                  {format(new Date(formData.required_date), 'yyyy년 MM월 dd일')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">우선순위:</span>
                <span className={cn(
                  'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                  getPriorityColor(formData.priority)
                )}>
                  {formData.priority === 'urgent' && '긴급'}
                  {formData.priority === 'high' && '높음'}
                  {formData.priority === 'normal' && '보통'}
                  {formData.priority === 'low' && '낮음'}
                </span>
              </div>
            </div>
          </div>

          {/* Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">요청 전 확인사항</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>현재 재고량을 확인하셨나요?</li>
                  <li>긴급 요청은 추가 비용이 발생할 수 있습니다</li>
                  <li>승인 후 취소가 어려울 수 있습니다</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  요청 중...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  요청하기
                </span>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}