'use client'


interface EquipmentCheckoutDialogProps {
  equipment: Equipment | null
  sites: unknown[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EquipmentCheckoutDialog({
  equipment,
  sites,
  open,
  onOpenChange,
  onSuccess
}: EquipmentCheckoutDialogProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    site_id: '',
    expected_return_date: '',
    purpose: '',
    condition_out: 'good' as const
  })

  const handleSubmit = async () => {
    if (!equipment || !formData.site_id) {
      toast({
        title: '입력 오류',
        description: '현장을 선택해주세요.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createEquipmentCheckout({
        equipment_id: equipment.id,
        site_id: formData.site_id,
        expected_return_date: formData.expected_return_date || undefined,
        purpose: formData.purpose || undefined,
        condition_out: formData.condition_out
      })

      if (result.success) {
        toast({
          title: '반출 완료',
          description: '장비가 성공적으로 반출되었습니다.'
        })
        onSuccess()
        onOpenChange(false)
        // Reset form
        setFormData({
          site_id: '',
          expected_return_date: '',
          purpose: '',
          condition_out: 'good'
        })
      } else {
        toast({
          title: '반출 실패',
          description: result.error || '장비 반출에 실패했습니다.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: '오류 발생',
        description: '장비 반출 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getInputSize = () => {
    if (touchMode === 'glove') return 'h-14'
    if (touchMode === 'precision') return 'h-9'
    return 'h-10'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className={getFullTypographyClass('heading', 'lg', isLargeFont)}>
            장비 반출
          </DialogTitle>
          <DialogDescription className={getFullTypographyClass('body', 'base', isLargeFont)}>
            {equipment?.name} ({equipment?.code}) 반출 정보를 입력하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Equipment Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-600" />
              <span className={`font-medium ${getFullTypographyClass('body', 'base', isLargeFont)}`}>
                {equipment?.name}
              </span>
            </div>
            <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>
              코드: {equipment?.code} | 제조사: {equipment?.manufacturer} {equipment?.model}
            </p>
          </div>

          {/* Site Selection */}
          <div>
            <Label htmlFor="site" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
              반출 현장 *
            </Label>
            <div className="relative mt-1.5">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                id="site"
                value={formData.site_id}
                onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pl-10 pr-3"
                required
              >
                <option value="">현장 선택</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Expected Return Date */}
          <div>
            <Label htmlFor="return_date" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
              반납 예정일
            </Label>
            <div className="relative mt-1.5">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="return_date"
                type="date"
                value={formData.expected_return_date}
                onChange={(e) => setFormData({ ...formData, expected_return_date: e.target.value })}
                className={`pl-10 ${getInputSize()}`}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Purpose */}
          <div>
            <Label htmlFor="purpose" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
              사용 목적
            </Label>
            <div className="relative mt-1.5">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <textarea
                id="purpose"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="장비 사용 목적을 입력하세요"
                rows={3}
                className={`w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 ${getFullTypographyClass('body', 'base', isLargeFont)}`}
              />
            </div>
          </div>

          {/* Condition */}
          <div>
            <Label htmlFor="condition" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
              반출 시 상태
            </Label>
            <select
              id="condition"
              value={formData.condition_out}
              onChange={(e) => setFormData({ ...formData, condition_out: e.target.value as unknown })}
              className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 mt-1.5"
            >
              <option value="excellent">우수</option>
              <option value="good">양호</option>
              <option value="fair">보통</option>
              <option value="poor">불량</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.site_id}
          >
            {isSubmitting ? '처리중...' : '반출하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}