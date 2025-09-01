'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Info,
  Calculator,
  Warehouse
} from 'lucide-react'
import { toast } from 'sonner'
import { recordInventoryTransaction } from '@/app/actions/npc-materials'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId: string
  siteName?: string
  onSuccess?: () => void
}

export default function InventoryRecordDialog({ 
  open, 
  onOpenChange, 
  siteId, 
  siteName,
  onSuccess 
}: Props) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  
  // State
  const [saving, setSaving] = useState(false)
  const [transactionType, setTransactionType] = useState<'in' | 'out'>('in')
  const [currentStock, setCurrentStock] = useState<number>(0)
  const [loadingStock, setLoadingStock] = useState(false)
  
  // Form state
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])

  // Touch-responsive sizing
  const getButtonSize = () => {
    if (touchMode === 'glove') return 'lg'
    if (touchMode === 'precision') return 'sm'
    return 'default'
  }

  const getIconSize = () => {
    if (touchMode === 'glove') return 'h-6 w-6'
    if (isLargeFont) return 'h-5 w-5'
    return 'h-4 w-4'
  }

  // Fetch current stock for the site
  const fetchCurrentStock = async () => {
    setLoadingStock(true)
    try {
      const supabase = createClient()
      
      // Get NPC-1000 material ID
      const { data: npcMaterial } = await supabase
        .from('materials')
        .select('id')
        .eq('code', 'NPC-1000')
        .single()

      if (!npcMaterial) return

      // Get current inventory for this site
      const { data: inventory } = await supabase
        .from('material_inventory')
        .select('current_stock')
        .eq('material_id', npcMaterial.id)
        .eq('site_id', siteId)
        .single()

      setCurrentStock(inventory?.current_stock || 0)
    } catch (error) {
      console.error('Error fetching current stock:', error)
      setCurrentStock(0)
    } finally {
      setLoadingStock(false)
    }
  }

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setQuantity('')
      setNotes('')
      setTransactionType('in')
      setTransactionDate(new Date().toISOString().split('T')[0])
      fetchCurrentStock()
    }
  }, [open, siteId])

  // Calculate projected stock after transaction
  const calculateProjectedStock = () => {
    const quantityNum = parseFloat(quantity) || 0
    if (transactionType === 'in') {
      return currentStock + quantityNum
    } else {
      return currentStock - quantityNum
    }
  }

  const submitRecord = async () => {
    if (!quantity) {
      toast.error('수량을 입력해주세요.')
      return
    }

    const quantityNum = parseFloat(quantity)
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast.error('올바른 수량을 입력해주세요.')
      return
    }

    // Check for negative stock warning
    const projectedStock = calculateProjectedStock()
    if (projectedStock < 0 && transactionType === 'out') {
      const confirmed = window.confirm(
        `⚠️ 주의\n\n사용 후 재고가 부족합니다.\n예상 재고: ${projectedStock.toLocaleString()}kg\n\n계속 진행하시겠습니까?`
      )
      if (!confirmed) return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다.')

      // Get NPC-1000 material ID from database
      const { data: npcMaterial } = await supabase
        .from('materials')
        .select('id')
        .like('code', 'NPC-1000')
        .single()

      if (!npcMaterial) {
        throw new Error('NPC-1000 자재를 찾을 수 없습니다.')
      }

      const actionText = transactionType === 'in' ? '입고' : '사용'
      
      // Create material transaction using server action
      const transactionResult = await recordInventoryTransaction({
        siteId: siteId,
        materialCode: 'NPC-1000',
        transactionType: transactionType,
        quantity: quantityNum,
        transactionDate: new Date(transactionDate).toISOString(),
        notes: notes || `${actionText} 기록 - ${format(new Date(transactionDate), 'yyyy년 MM월 dd일', { locale: ko })}`
      })

      if (!transactionResult.success) {
        throw new Error(transactionResult.error || '거래 기록에 실패했습니다.')
      }
      
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span>{actionText} 기록이 저장되었습니다.</span>
        </div>
      )
      
      onSuccess?.()
      onOpenChange(false)
      
    } catch (error) {
      console.error('Error saving record:', error)
      toast.error('기록 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={`${getFullTypographyClass('heading', 'xl', isLargeFont)} flex items-center gap-3`}>
            <Package className="h-6 w-6 text-blue-600" />
            NPC-1000 입고/사용량 기록
          </DialogTitle>
          {siteName && (
            <div className="flex items-center gap-2 mt-2">
              <Warehouse className="h-4 w-4 text-gray-500" />
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-muted-foreground`}>
                현장: {siteName}
              </p>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* 거래 유형 선택 - 탭 형식으로 개선 */}
          <div>
            <Label className={`${getFullTypographyClass('body', 'sm', isLargeFont)} mb-3 block`}>
              거래 유형 선택
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTransactionType('in')}
                className={`
                  relative p-6 rounded-xl border-2 transition-all
                  ${transactionType === 'in' 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`
                    p-3 rounded-full
                    ${transactionType === 'in' 
                      ? 'bg-green-100 dark:bg-green-900/50' 
                      : 'bg-gray-100 dark:bg-gray-800'
                    }
                  `}>
                    <TrendingUp className={`
                      h-8 w-8
                      ${transactionType === 'in' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-gray-400'
                      }
                    `} />
                  </div>
                  <div>
                    <h3 className={`
                      ${getFullTypographyClass('heading', 'md', isLargeFont)} font-semibold
                      ${transactionType === 'in' 
                        ? 'text-green-700 dark:text-green-300' 
                        : 'text-gray-700 dark:text-gray-300'
                      }
                    `}>
                      입고 등록
                    </h3>
                    <p className={`
                      ${getFullTypographyClass('body', 'sm', isLargeFont)} mt-1
                      ${transactionType === 'in' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-gray-500 dark:text-gray-400'
                      }
                    `}>
                      자재 입고 시 선택
                    </p>
                  </div>
                </div>
                {transactionType === 'in' && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => setTransactionType('out')}
                className={`
                  relative p-6 rounded-xl border-2 transition-all
                  ${transactionType === 'out' 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`
                    p-3 rounded-full
                    ${transactionType === 'out' 
                      ? 'bg-red-100 dark:bg-red-900/50' 
                      : 'bg-gray-100 dark:bg-gray-800'
                    }
                  `}>
                    <TrendingDown className={`
                      h-8 w-8
                      ${transactionType === 'out' 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-gray-400'
                      }
                    `} />
                  </div>
                  <div>
                    <h3 className={`
                      ${getFullTypographyClass('heading', 'md', isLargeFont)} font-semibold
                      ${transactionType === 'out' 
                        ? 'text-red-700 dark:text-red-300' 
                        : 'text-gray-700 dark:text-gray-300'
                      }
                    `}>
                      사용량 등록
                    </h3>
                    <p className={`
                      ${getFullTypographyClass('body', 'sm', isLargeFont)} mt-1
                      ${transactionType === 'out' 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-gray-500 dark:text-gray-400'
                      }
                    `}>
                      자재 사용 시 선택
                    </p>
                  </div>
                </div>
                {transactionType === 'out' && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="h-6 w-6 text-red-500" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* 현재 재고 상태 표시 */}
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Warehouse className="h-6 w-6 text-blue-600" />
                <div>
                  <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-blue-600 dark:text-blue-400`}>
                    현재 재고량
                  </p>
                  <p className={`${getFullTypographyClass('heading', 'xl', isLargeFont)} font-bold text-blue-800 dark:text-blue-200`}>
                    {loadingStock ? (
                      <span className="text-gray-400">조회중...</span>
                    ) : (
                      <>{currentStock.toLocaleString()} kg</>
                    )}
                  </p>
                </div>
              </div>
              <Info className="h-5 w-5 text-blue-500" />
            </div>
          </Card>

          {/* 입력 폼 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="quantity" className={`${getFullTypographyClass('body', 'sm', isLargeFont)} mb-2 flex items-center gap-2`}>
                <Calculator className="h-4 w-4" />
                {transactionType === 'in' ? '입고량' : '사용량'} (kg) *
              </Label>
              <div className="relative">
                <Input
                  id="quantity"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={`
                    pr-16 text-lg font-semibold
                    ${transactionType === 'in' 
                      ? 'focus:ring-green-500 focus:border-green-500' 
                      : 'focus:ring-red-500 focus:border-red-500'
                    }
                  `}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 font-medium">kg</span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="date" className={`${getFullTypographyClass('body', 'sm', isLargeFont)} mb-2 flex items-center gap-2`}>
                <Calendar className="h-4 w-4" />
                거래 일자 *
              </Label>
              <Input
                id="date"
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="text-lg"
              />
            </div>
          </div>

          {/* 실시간 재고 계산 표시 */}
          {quantity && (
            <Card className={`
              p-6 border-2
              ${calculateProjectedStock() < 0 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700' 
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }
            `}>
              <div className="space-y-4">
                <h3 className={`${getFullTypographyClass('heading', 'md', isLargeFont)} font-semibold flex items-center gap-2`}>
                  <Calculator className="h-5 w-5" />
                  재고 변동 계산
                </h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-1">현재 재고</p>
                    <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                      {currentStock.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">kg</p>
                  </div>
                  
                  <div className="text-center flex items-center justify-center">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        {transactionType === 'in' ? '입고' : '사용'}
                      </p>
                      <p className={`text-2xl font-bold ${
                        transactionType === 'in' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transactionType === 'in' ? '+' : '-'}{parseFloat(quantity || '0').toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">kg</p>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-1">예상 재고</p>
                    <p className={`text-2xl font-bold ${
                      calculateProjectedStock() < 0 ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {calculateProjectedStock().toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">kg</p>
                  </div>
                </div>

                {calculateProjectedStock() < 0 && (
                  <div className="flex items-start gap-2 mt-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-700 dark:text-red-300">
                        재고 부족 경고
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        사용 후 재고가 {Math.abs(calculateProjectedStock()).toLocaleString()}kg 부족합니다.
                        추가 입고가 필요합니다.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* 비고 입력 */}
          <div>
            <Label htmlFor="notes" className={`${getFullTypographyClass('body', 'sm', isLargeFont)} mb-2`}>
              비고 및 특이사항
            </Label>
            <Textarea
              id="notes"
              placeholder={transactionType === 'in' 
                ? "입고 관련 정보 (공급업체, 운송 정보, 품질 상태 등)"
                : "사용 위치, 작업 내용, 담당자 등을 기록하세요"
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={getFullTypographyClass('body', 'sm', isLargeFont)}
            />
          </div>
        </div>

        <DialogFooter className="gap-3 mt-8">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            size={getButtonSize()}
            className="min-w-[100px]"
          >
            취소
          </Button>
          <Button
            onClick={submitRecord}
            disabled={saving || !quantity}
            size={getButtonSize()}
            className={`
              min-w-[140px] font-semibold
              ${transactionType === 'in' 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
              }
            `}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                저장 중...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                {transactionType === 'in' ? '입고 등록' : '사용량 등록'}
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}