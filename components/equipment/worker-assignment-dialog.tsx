'use client'


interface WorkerAssignmentDialogProps {
  worker: unknown
  sites: unknown[]
  skills: WorkerSkill[]
  skillAssignments: WorkerSkillAssignment[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function WorkerAssignmentDialog({
  worker,
  sites,
  skills,
  skillAssignments,
  open,
  onOpenChange,
  onSuccess
}: WorkerAssignmentDialogProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const { toast } = useToast()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState('')
  const [formData, setFormData] = useState({
    site_id: '',
    allocated_date: new Date().toISOString().split('T')[0],
    start_time: '08:00',
    end_time: '17:00',
    task_description: '',
    notes: ''
  })

  const workerSkills = skillAssignments.filter(sa => sa.worker_id === worker?.id)
  const selectedSkillAssignment = workerSkills.find(ws => ws.skill_id === selectedSkill)

  const calculateHours = () => {
    if (!formData.start_time || !formData.end_time) return 0
    
    const start = new Date(`1970-01-01T${formData.start_time}:00`)
    const end = new Date(`1970-01-01T${formData.end_time}:00`)
    const diffMs = end.getTime() - start.getTime()
    return Math.max(0, diffMs / (1000 * 60 * 60))
  }

  const calculateCost = () => {
    const hours = calculateHours()
    const hourlyRate = selectedSkillAssignment?.hourly_rate || 0
    const overtimeRate = selectedSkillAssignment?.overtime_rate || hourlyRate * 1.5
    
    const regularHours = Math.min(hours, 8)
    const overtimeHours = Math.max(0, hours - 8)
    
    return {
      regularHours,
      overtimeHours,
      totalCost: (regularHours * hourlyRate) + (overtimeHours * overtimeRate)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!worker || !selectedSkill || !formData.site_id) {
      toast({
        title: '입력 오류',
        description: '모든 필수 항목을 입력해주세요.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)
    try {
      const hours = calculateHours()
      const cost = calculateCost()
      
      const result = await createResourceAllocation({
        allocation_type: 'worker',
        resource_id: worker.id,
        site_id: formData.site_id,
        allocated_date: formData.allocated_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        hours_worked: hours,
        hourly_rate: selectedSkillAssignment?.hourly_rate || 0,
        overtime_rate: selectedSkillAssignment?.overtime_rate || (selectedSkillAssignment?.hourly_rate || 0) * 1.5,
        task_description: formData.task_description,
        notes: formData.notes
      })

      if (result.success) {
        toast({
          title: '배치 완료',
          description: `${worker.full_name}님이 성공적으로 배치되었습니다.`
        })
        onSuccess()
        onOpenChange(false)
        resetForm()
      } else {
        throw new Error(result.error)
      }
    } catch (error: unknown) {
      toast({
        title: '배치 실패',
        description: error.message || '작업자 배치에 실패했습니다.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedSkill('')
    setFormData({
      site_id: '',
      allocated_date: new Date().toISOString().split('T')[0],
      start_time: '08:00',
      end_time: '17:00',
      task_description: '',
      notes: ''
    })
  }

  const getButtonSize = () => {
    if (touchMode === 'glove') return 'field'
    if (touchMode === 'precision') return 'compact'
    return isLargeFont ? 'standard' : 'compact'
  }

  const getTouchPadding = () => {
    if (touchMode === 'glove') return 'p-6'
    if (touchMode === 'precision') return 'p-3'
    return 'p-4'
  }

  const cost = calculateCost()
  const hours = calculateHours()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={getTypographyClass('xl', isLargeFont)}>
            작업자 배치: {worker?.full_name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Worker Skills */}
          {workerSkills.length > 0 && (
            <div className="space-y-3">
              <Label className={getTypographyClass('base', isLargeFont)}>
                보유 기술 선택 <span className="text-red-500">*</span>
              </Label>
              <div className="grid gap-2">
                {workerSkills.map(skillAssignment => {
                  const skill = skills.find(s => s.id === skillAssignment.skill_id)
                  if (!skill) return null
                  
                  return (
                    <div
                      key={skillAssignment.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedSkill === skill.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedSkill(skill.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-medium ${getTypographyClass('base', isLargeFont)}`}>
                            {skill.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={getTypographyClass('small', isLargeFont)}>
                              {skillAssignment.proficiency_level}
                            </Badge>
                            {skillAssignment.certified && (
                              <Badge variant="secondary" className={getTypographyClass('small', isLargeFont)}>
                                인증
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${getTypographyClass('base', isLargeFont)} text-green-600`}>
                            ₩{skillAssignment.hourly_rate?.toLocaleString()}/시간
                          </p>
                          {skillAssignment.overtime_rate && (
                            <p className={`${getTypographyClass('small', isLargeFont)} text-amber-600`}>
                              연장: ₩{skillAssignment.overtime_rate.toLocaleString()}/시간
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {workerSkills.length === 0 && (
            <div className="text-center py-4">
              <p className={`${getTypographyClass('base', isLargeFont)} text-red-500`}>
                이 작업자에게 할당된 기술이 없습니다. 먼저 기술을 할당해주세요.
              </p>
            </div>
          )}

          {/* Site Selection */}
          <div className="space-y-2">
            <Label htmlFor="site" className={getTypographyClass('base', isLargeFont)}>
              배치 현장 <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.site_id} onValueChange={(value) => setFormData({...formData, site_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="현장을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {sites.map(site => (
                  <SelectItem key={site.id} value={site.id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {site.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className={getTypographyClass('base', isLargeFont)}>
                배치 날짜 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.allocated_date}
                onChange={(e) => setFormData({...formData, allocated_date: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_time" className={getTypographyClass('base', isLargeFont)}>
                시작 시간
              </Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({...formData, start_time: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time" className={getTypographyClass('base', isLargeFont)}>
                종료 시간
              </Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({...formData, end_time: e.target.value})}
              />
            </div>
          </div>

          {/* Cost Calculation Display */}
          {selectedSkill && hours > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className={`font-medium ${getTypographyClass('base', isLargeFont)}`}>
                예상 비용 계산
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className={`${getTypographyClass('small', isLargeFont)} text-gray-600`}>총 시간</p>
                  <p className={`font-semibold ${getTypographyClass('base', isLargeFont)}`}>
                    {hours.toFixed(1)}시간
                  </p>
                </div>
                <div>
                  <p className={`${getTypographyClass('small', isLargeFont)} text-gray-600`}>정규 시간</p>
                  <p className={`font-semibold ${getTypographyClass('base', isLargeFont)}`}>
                    {cost.regularHours.toFixed(1)}시간
                  </p>
                </div>
                <div>
                  <p className={`${getTypographyClass('small', isLargeFont)} text-gray-600`}>연장 시간</p>
                  <p className={`font-semibold ${getTypographyClass('base', isLargeFont)} ${cost.overtimeHours > 0 ? 'text-amber-600' : ''}`}>
                    {cost.overtimeHours.toFixed(1)}시간
                  </p>
                </div>
                <div>
                  <p className={`${getTypographyClass('small', isLargeFont)} text-gray-600`}>예상 비용</p>
                  <p className={`font-bold ${getTypographyClass('large', isLargeFont)} text-green-600`}>
                    ₩{cost.totalCost.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Task Description */}
          <div className="space-y-2">
            <Label htmlFor="task_description" className={getTypographyClass('base', isLargeFont)}>
              작업 내용
            </Label>
            <Textarea
              id="task_description"
              placeholder="수행할 작업 내용을 입력하세요..."
              value={formData.task_description}
              onChange={(e) => setFormData({...formData, task_description: e.target.value})}
              rows={3}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className={getTypographyClass('base', isLargeFont)}>
              비고
            </Label>
            <Textarea
              id="notes"
              placeholder="추가 메모가 있으면 입력하세요..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={2}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              size={getButtonSize()}
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              size={getButtonSize()}
              disabled={isSubmitting || !selectedSkill || !formData.site_id || workerSkills.length === 0}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  배치 중...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  작업자 배치
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}