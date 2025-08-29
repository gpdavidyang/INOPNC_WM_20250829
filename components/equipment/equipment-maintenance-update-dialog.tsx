'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { updateEquipmentMaintenance } from '@/app/actions/equipment'
import { useToast } from '@/components/ui/use-toast'
import { EquipmentMaintenance } from '@/types/equipment'
import { Wrench, Calendar, DollarSign, FileText, User, AlertTriangle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface EquipmentMaintenanceUpdateDialogProps {
  maintenance: EquipmentMaintenance | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EquipmentMaintenanceUpdateDialog({
  maintenance,
  open,
  onOpenChange,
  onSuccess
}: EquipmentMaintenanceUpdateDialogProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    status: maintenance?.status || 'scheduled',
    completed_date: maintenance?.completed_date || '',
    performed_by: maintenance?.performed_by || '',
    cost: maintenance?.cost?.toString() || '',
    description: maintenance?.description || ''
  })

  // Update form when maintenance changes
  useEffect(() => {
    if (maintenance) {
      setFormData({
        status: maintenance.status,
        completed_date: maintenance.completed_date || '',
        performed_by: maintenance.performed_by || '',
        cost: maintenance.cost?.toString() || '',
        description: maintenance.description || ''
      })
    }
  }, [maintenance])

  const handleSubmit = async () => {
    if (!maintenance) return

    setIsSubmitting(true)
    try {
      const updates: any = {
        status: formData.status,
        description: formData.description
      }

      // Add optional fields
      if (formData.completed_date) updates.completed_date = formData.completed_date
      if (formData.performed_by) updates.performed_by = formData.performed_by
      if (formData.cost) updates.cost = parseFloat(formData.cost)

      const result = await updateEquipmentMaintenance(maintenance.id, updates)

      if (result.success) {
        toast({
          title: '업데이트 완료',
          description: '정비 정보가 성공적으로 업데이트되었습니다.'
        })
        onSuccess()
        onOpenChange(false)
      } else {
        toast({
          title: '업데이트 실패',
          description: result.error || '정비 정보 업데이트에 실패했습니다.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: '오류 발생',
        description: '정비 정보 업데이트 중 오류가 발생했습니다.',
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

  const isOverdue = maintenance && 
    maintenance.status === 'scheduled' && 
    new Date(maintenance.scheduled_date) < new Date()

  const getMaintenanceTypeLabel = (type: string) => {
    switch (type) {
      case 'routine': return '정기 점검'
      case 'repair': return '수리'
      case 'inspection': return '검사'
      case 'calibration': return '교정'
      default: return type
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className={getFullTypographyClass('heading', 'lg', isLargeFont)}>
            정비 정보 업데이트
          </DialogTitle>
          <DialogDescription className={getFullTypographyClass('body', 'base', isLargeFont)}>
            {maintenance?.equipment?.name} ({maintenance?.equipment?.code}) 정비 정보를 업데이트합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Maintenance Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-gray-600" />
              <span className={`font-medium ${getFullTypographyClass('body', 'base', isLargeFont)}`}>
                {maintenance && getMaintenanceTypeLabel(maintenance.maintenance_type)}
              </span>
            </div>
            <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>
              예정일: {maintenance && formatDate(maintenance.scheduled_date)}
              {isOverdue && (
                <span className="ml-2 text-red-600 font-medium">
                  <AlertTriangle className="inline h-3.5 w-3.5 mr-1" />
                  지연됨
                </span>
              )}
            </p>
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
              상태 *
            </Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 mt-1.5"
            >
              <option value="scheduled">예정</option>
              <option value="in_progress">진행중</option>
              <option value="completed">완료</option>
              <option value="cancelled">취소</option>
            </select>
          </div>

          {/* Completed Date (show when status is completed) */}
          {formData.status === 'completed' && (
            <div>
              <Label htmlFor="completed_date" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                완료일 *
              </Label>
              <div className="relative mt-1.5">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="completed_date"
                  type="date"
                  value={formData.completed_date}
                  onChange={(e) => setFormData({ ...formData, completed_date: e.target.value })}
                  className={`pl-10 ${getInputSize()}`}
                  max={new Date().toISOString().split('T')[0]}
                  required={formData.status === 'completed'}
                />
              </div>
            </div>
          )}

          {/* Performed By */}
          {(formData.status === 'in_progress' || formData.status === 'completed') && (
            <div>
              <Label htmlFor="performed_by" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                작업자
              </Label>
              <div className="relative mt-1.5">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="performed_by"
                  type="text"
                  value={formData.performed_by}
                  onChange={(e) => setFormData({ ...formData, performed_by: e.target.value })}
                  placeholder="작업자 이름"
                  className={`pl-10 ${getInputSize()}`}
                />
              </div>
            </div>
          )}

          {/* Cost */}
          <div>
            <Label htmlFor="cost" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
              {formData.status === 'completed' ? '실제 비용' : '예상 비용'}
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
                rows={4}
                className={`w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 ${getFullTypographyClass('body', 'base', isLargeFont)}`}
              />
            </div>
          </div>

          {/* Warning for cancelled status */}
          {formData.status === 'cancelled' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-amber-800`}>
                <p className="font-medium">정비 취소</p>
                <p>취소 사유를 작업 내용에 기록해주세요.</p>
              </div>
            </div>
          )}
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
            disabled={isSubmitting || (formData.status === 'completed' && !formData.completed_date)}
          >
            {isSubmitting ? '처리중...' : '업데이트'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}