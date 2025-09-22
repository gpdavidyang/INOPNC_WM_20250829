'use client'


interface EquipmentMaintenanceDialogProps {
  equipment: Equipment[]
  selectedEquipment?: Equipment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EquipmentMaintenanceDialog({
  equipment,
  selectedEquipment,
  open,
  onOpenChange,
  onSuccess
}: EquipmentMaintenanceDialogProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    equipment_id: selectedEquipment?.id || '',
    maintenance_type: 'routine' as const,
    scheduled_date: '',
    description: '',
    cost: '',
    next_maintenance_date: ''
  })

  // Update form when selectedEquipment changes
  useEffect(() => {
    if (selectedEquipment) {
      setFormData(prev => ({ ...prev, equipment_id: selectedEquipment.id }))
    }
  }, [selectedEquipment])

  const handleSubmit = async () => {
    if (!formData.equipment_id || !formData.scheduled_date) {
      toast({
        title: '입력 오류',
        description: '장비와 예정일을 입력해주세요.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createEquipmentMaintenance({
        equipment_id: formData.equipment_id,
        maintenance_type: formData.maintenance_type,
        scheduled_date: formData.scheduled_date,
        description: formData.description || undefined,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        next_maintenance_date: formData.next_maintenance_date || undefined
      })

      if (result.success) {
        toast({
          title: '일정 등록 완료',
          description: '정비 일정이 성공적으로 등록되었습니다.'
        })
        onSuccess()
        onOpenChange(false)
        // Reset form
        setFormData({
          equipment_id: '',
          maintenance_type: 'routine',
          scheduled_date: '',
          description: '',
          cost: '',
          next_maintenance_date: ''
        })
      } else {
        toast({
          title: '등록 실패',
          description: result.error || '정비 일정 등록에 실패했습니다.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: '오류 발생',
        description: '정비 일정 등록 중 오류가 발생했습니다.',
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

  const getButtonSize = () => {
    if (touchMode === 'glove') return 'field'
    if (touchMode === 'precision') return 'compact'
    return isLargeFont ? 'standard' : 'compact'
  }

  // Filter available equipment (not retired)
  const availableEquipment = equipment.filter(e => e.status !== 'retired')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className={getFullTypographyClass('heading', 'lg', isLargeFont)}>
            정비 일정 등록
          </DialogTitle>
          <DialogDescription className={getFullTypographyClass('body', 'base', isLargeFont)}>
            장비 정비 일정을 등록합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Equipment Selection */}
          <div>
            <Label htmlFor="equipment" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
              장비 선택 *
            </Label>
            <div className="relative mt-1.5">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                id="equipment"
                value={formData.equipment_id}
                onChange={(e) => setFormData({ ...formData, equipment_id: e.target.value })}
                className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pl-10 pr-3"
                required
              >
                <option value="">장비 선택</option>
                {availableEquipment.map(equip => (
                  <option key={equip.id} value={equip.id}>
                    {equip.name} ({equip.code}) - {equip.status === 'available' ? '사용가능' : 
                      equip.status === 'in_use' ? '사용중' : 
                      equip.status === 'maintenance' ? '정비중' : '파손'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Maintenance Type */}
          <div>
            <Label htmlFor="type" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
              정비 유형 *
            </Label>
            <div className="relative mt-1.5">
              <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                id="type"
                value={formData.maintenance_type}
                onChange={(e) => setFormData({ ...formData, maintenance_type: e.target.value as unknown })}
                className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pl-10 pr-3"
              >
                <option value="routine">정기 점검</option>
                <option value="repair">수리</option>
                <option value="inspection">검사</option>
                <option value="calibration">교정</option>
              </select>
            </div>
          </div>

          {/* Scheduled Date */}
          <div>
            <Label htmlFor="scheduled_date" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
              예정일 *
            </Label>
            <div className="relative mt-1.5">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className={`pl-10 ${getInputSize()}`}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
              작업 내용
            </Label>
            <div className="relative mt-1.5">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="정비 작업 내용을 입력하세요"
                rows={3}
                className={`w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 ${getFullTypographyClass('body', 'base', isLargeFont)}`}
              />
            </div>
          </div>

          {/* Cost */}
          <div>
            <Label htmlFor="cost" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
              예상 비용
            </Label>
            <div className="relative mt-1.5">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="cost"
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                placeholder="0"
                className={`pl-10 ${getInputSize()}`}
                min="0"
                step="1000"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">원</span>
            </div>
          </div>

          {/* Next Maintenance Date */}
          <div>
            <Label htmlFor="next_date" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
              다음 정비 예정일
            </Label>
            <div className="relative mt-1.5">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="next_date"
                type="date"
                value={formData.next_maintenance_date}
                onChange={(e) => setFormData({ ...formData, next_maintenance_date: e.target.value })}
                className={`pl-10 ${getInputSize()}`}
                min={formData.scheduled_date || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            size={getButtonSize()}
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button 
            size={getButtonSize()}
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.equipment_id || !formData.scheduled_date}
          >
            {isSubmitting ? '처리중...' : '등록하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}