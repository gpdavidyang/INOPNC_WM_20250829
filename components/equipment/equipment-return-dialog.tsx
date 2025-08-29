'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
import { returnEquipment } from '@/app/actions/equipment'
import { useToast } from '@/components/ui/use-toast'
import { EquipmentCheckout } from '@/types/equipment'
import { Package, Calendar, MapPin, FileText, AlertTriangle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface EquipmentReturnDialogProps {
  checkout: EquipmentCheckout | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EquipmentReturnDialog({
  checkout,
  open,
  onOpenChange,
  onSuccess
}: EquipmentReturnDialogProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    condition_in: 'good' as 'excellent' | 'good' | 'fair' | 'poor' | 'damaged',
    damage_notes: ''
  })

  const handleSubmit = async () => {
    if (!checkout) return

    setIsSubmitting(true)
    try {
      const result = await returnEquipment(checkout.id, formData)

      if (result.success) {
        toast({
          title: '반납 완료',
          description: '장비가 성공적으로 반납되었습니다.'
        })
        onSuccess()
        onOpenChange(false)
        // Reset form
        setFormData({
          condition_in: 'good',
          damage_notes: ''
        })
      } else {
        toast({
          title: '반납 실패',
          description: result.error || '장비 반납에 실패했습니다.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: '오류 발생',
        description: '장비 반납 중 오류가 발생했습니다.',
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

  // Calculate overdue status
  const isOverdue = checkout?.expected_return_date && 
    new Date(checkout.expected_return_date) < new Date()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className={getFullTypographyClass('heading', 'lg', isLargeFont)}>
            장비 반납
          </DialogTitle>
          <DialogDescription className={getFullTypographyClass('body', 'base', isLargeFont)}>
            반납할 장비의 상태를 확인하고 입력해주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Checkout Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-600" />
              <span className={`font-medium ${getFullTypographyClass('body', 'base', isLargeFont)}`}>
                {checkout?.equipment?.name} ({checkout?.equipment?.code})
              </span>
            </div>
            
            <div className={`space-y-1 ${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                <span>반출 현장: {checkout?.site?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>반출일: {checkout?.checked_out_at && formatDate(checkout.checked_out_at)}</span>
              </div>
              {checkout?.expected_return_date && (
                <div className={`flex items-center gap-2 ${isOverdue ? 'text-red-600' : ''}`}>
                  <Calendar className="h-3.5 w-3.5" />
                  <span>반납 예정일: {formatDate(checkout.expected_return_date)}</span>
                  {isOverdue && <AlertTriangle className="h-3.5 w-3.5" />}
                </div>
              )}
              {checkout?.purpose && (
                <div className="flex items-start gap-2 mt-2">
                  <FileText className="h-3.5 w-3.5 mt-0.5" />
                  <span>사용 목적: {checkout.purpose}</span>
                </div>
              )}
            </div>
          </div>

          {/* Return Condition */}
          <div>
            <Label htmlFor="condition" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
              반납 시 상태 *
            </Label>
            <select
              id="condition"
              value={formData.condition_in}
              onChange={(e) => setFormData({ ...formData, condition_in: e.target.value as any })}
              className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 mt-1.5"
            >
              <option value="excellent">우수</option>
              <option value="good">양호</option>
              <option value="fair">보통</option>
              <option value="poor">불량</option>
              <option value="damaged">파손</option>
            </select>
          </div>

          {/* Damage Notes */}
          {(formData.condition_in === 'poor' || formData.condition_in === 'damaged') && (
            <div>
              <Label htmlFor="damage_notes" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                손상 내역 *
              </Label>
              <textarea
                id="damage_notes"
                value={formData.damage_notes}
                onChange={(e) => setFormData({ ...formData, damage_notes: e.target.value })}
                placeholder="손상 부위 및 정도를 상세히 기록해주세요"
                rows={4}
                className={`w-full mt-1.5 px-3 py-2 rounded-md border border-gray-300 ${getFullTypographyClass('body', 'base', isLargeFont)}`}
                required={formData.condition_in === 'poor' || formData.condition_in === 'damaged'}
              />
            </div>
          )}

          {/* Warning for overdue */}
          {isOverdue && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <div className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-red-800`}>
                <p className="font-medium">반납 기한 초과</p>
                <p>반납 예정일을 초과했습니다. 사유를 확인해주세요.</p>
              </div>
            </div>
          )}
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
            disabled={isSubmitting || (
              (formData.condition_in === 'poor' || formData.condition_in === 'damaged') && 
              !formData.damage_notes
            )}
          >
            {isSubmitting ? '처리중...' : '반납하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}