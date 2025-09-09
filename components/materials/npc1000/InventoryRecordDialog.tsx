'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode, getMinTouchTarget } from '@/contexts/TouchModeContext'
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Info,
  Calculator,
  Warehouse,
  Plus,
  Minus,
  Clock,
  Zap,
  ArrowLeft,
  FileText
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
  const [currentStep, setCurrentStep] = useState<'type' | 'quantity' | 'details'>('type')
  
  // Form state
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // Refs for focus management
  const quantityInputRef = useRef<HTMLInputElement>(null)

  // Quick quantity presets for common construction use
  const quantityPresets = [
    { label: '50말', value: 50 },
    { label: '100말', value: 100 },
    { label: '200말', value: 200 },
    { label: '500말', value: 500 },
  ]

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

  // Navigation helpers
  const nextStep = () => {
    if (currentStep === 'type') {
      setCurrentStep('quantity')
      // Auto-focus quantity input after state update
      setTimeout(() => quantityInputRef.current?.focus(), 100)
    } else if (currentStep === 'quantity') {
      setCurrentStep('details')
    }
  }

  const prevStep = () => {
    if (currentStep === 'details') setCurrentStep('quantity')
    else if (currentStep === 'quantity') setCurrentStep('type')
  }

  const isQuantityValid = () => {
    const num = parseFloat(quantity)
    return !isNaN(num) && num > 0
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
      setCurrentStep('type')
      setShowAdvanced(false)
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
        `⚠️ 주의\n\n사용 후 재고가 부족합니다.\n예상 재고: ${projectedStock.toLocaleString()}말\n\n계속 진행하시겠습니까?`
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
        .eq('code', 'NPC-1000')
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
      <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto p-0">
        {/* Mobile-first header with progress indicator */}
        <div className={`
          sticky top-0 z-10 bg-background border-b px-6 py-4
          ${currentStep === 'type' 
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20' 
            : currentStep === 'quantity'
            ? transactionType === 'in'
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
              : 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20'
            : 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20'
          }
        `}>
          <div className="flex items-center justify-between mb-4">
            {currentStep !== 'type' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={prevStep}
                className={`${getMinTouchTarget(touchMode)} p-2`}
              >
                <ArrowLeft className={getIconSize()} />
              </Button>
            )}
            
            <div className="flex items-center gap-2 flex-1 justify-center">
              <Package className="h-5 w-5 text-blue-600" />
              <h1 className={`${getFullTypographyClass('heading', 'md', isLargeFont)} font-semibold`}>
                NPC-1000 기록
              </h1>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className={`${getMinTouchTarget(touchMode)} p-2`}
            >
              ✕
            </Button>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full transition-all ${
              currentStep === 'type' ? 'bg-blue-500 w-6' : 'bg-gray-300'
            }`} />
            <div className={`w-2 h-2 rounded-full transition-all ${
              currentStep === 'quantity' ? (transactionType === 'in' ? 'bg-green-500 w-6' : 'bg-red-500 w-6') : 'bg-gray-300'
            }`} />
            <div className={`w-2 h-2 rounded-full transition-all ${
              currentStep === 'details' ? 'bg-purple-500 w-6' : 'bg-gray-300'
            }`} />
          </div>

          {siteName && (
            <div className="flex items-center justify-center gap-2 mt-3 text-sm text-gray-600">
              <Warehouse className="h-4 w-4" />
              {siteName}
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1: Transaction Type */}
          {currentStep === 'type' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-bold mb-2`}>
                  거래 유형을 선택하세요
                </h2>
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>
                  입고와 사용량 중 하나를 선택해주세요
                </p>
              </div>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setTransactionType('in')}
                  className={`
                    w-full relative p-8 rounded-2xl border-2 transition-all ${getMinTouchTarget(touchMode)}
                    ${transactionType === 'in' 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 ring-2 ring-green-200 dark:ring-green-800' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50/50'
                    }
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`
                      p-4 rounded-full shrink-0
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
                    <div className="text-left">
                      <h3 className={`
                        ${getFullTypographyClass('heading', 'lg', isLargeFont)} font-bold
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
                        자재가 현장에 도착했을 때
                      </p>
                    </div>
                    {transactionType === 'in' && (
                      <CheckCircle className="h-6 w-6 text-green-500 ml-auto" />
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTransactionType('out')}
                  className={`
                    w-full relative p-8 rounded-2xl border-2 transition-all ${getMinTouchTarget(touchMode)}
                    ${transactionType === 'out' 
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 ring-2 ring-red-200 dark:ring-red-800' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600 hover:bg-red-50/50'
                    }
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`
                      p-4 rounded-full shrink-0
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
                    <div className="text-left">
                      <h3 className={`
                        ${getFullTypographyClass('heading', 'lg', isLargeFont)} font-bold
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
                        자재를 공사에 사용했을 때
                      </p>
                    </div>
                    {transactionType === 'out' && (
                      <CheckCircle className="h-6 w-6 text-red-500 ml-auto" />
                    )}
                  </div>
                </button>
              </div>

              {/* Current stock display */}
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
                          <>{currentStock.toLocaleString()} 말</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Button
                onClick={nextStep}
                size="lg"
                className={`
                  w-full py-4 text-lg font-semibold ${getMinTouchTarget(touchMode)}
                  ${transactionType === 'in' 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                  }
                `}
              >
                다음 단계
                <ArrowLeft className="h-5 w-5 ml-2 rotate-180" />
              </Button>
            </div>
          )}

          {/* Step 2: Quantity Input */}
          {currentStep === 'quantity' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-bold mb-2`}>
                  {transactionType === 'in' ? '입고량을' : '사용량을'} 입력하세요
                </h2>
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>
                  수량을 직접 입력하거나 빠른 선택을 사용하세요
                </p>
              </div>

              {/* Large quantity input */}
              <div className="space-y-4">
                <div className="relative">
                  <input
                    ref={quantityInputRef}
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className={`
                      w-full text-center text-4xl font-bold py-8 px-6 border-2 rounded-2xl
                      bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700
                      focus:outline-none focus:ring-4
                      ${transactionType === 'in' 
                        ? 'focus:ring-green-200 focus:border-green-500 text-green-700 dark:text-green-300' 
                        : 'focus:ring-red-200 focus:border-red-500 text-red-700 dark:text-red-300'
                      }
                      ${getMinTouchTarget(touchMode)}
                    `}
                    inputMode="decimal"
                  />
                  <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none">
                    <span className="text-xl font-semibold text-gray-500">말</span>
                  </div>
                </div>

                {/* Quick preset buttons */}
                <div>
                  <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 mb-3 text-center`}>
                    빠른 선택
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {quantityPresets.map((preset) => (
                      <Button
                        key={preset.value}
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => setQuantity(preset.value.toString())}
                        className={`
                          py-4 text-lg font-semibold ${getMinTouchTarget(touchMode)}
                          ${parseFloat(quantity) === preset.value
                            ? transactionType === 'in'
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-red-500 bg-red-50 text-red-700'
                            : 'hover:bg-gray-50'
                          }
                        `}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Real-time calculation */}
                {quantity && isQuantityValid() && (
                  <Card className={`
                    p-6 border-2
                    ${calculateProjectedStock() < 0 
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700' 
                      : transactionType === 'in'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                    }
                  `}>
                    <div className="text-center space-y-4">
                      <h3 className={`${getFullTypographyClass('heading', 'md', isLargeFont)} font-semibold`}>
                        재고 계산 결과
                      </h3>
                      
                      <div className="flex items-center justify-center gap-4 text-lg">
                        <span className="font-semibold">
                          {currentStock.toLocaleString()}말
                        </span>
                        <span className={`
                          font-bold text-xl
                          ${transactionType === 'in' ? 'text-green-600' : 'text-red-600'}
                        `}>
                          {transactionType === 'in' ? '+' : '-'}{parseFloat(quantity).toLocaleString()}말
                        </span>
                        <span className="font-semibold">=</span>
                        <span className={`
                          font-bold text-xl
                          ${calculateProjectedStock() < 0 ? 'text-red-600' : 'text-blue-600'}
                        `}>
                          {calculateProjectedStock().toLocaleString()}말
                        </span>
                      </div>

                      {calculateProjectedStock() < 0 && (
                        <div className="flex items-start gap-2 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div className="text-left">
                            <p className="font-semibold text-red-700 dark:text-red-300">
                              재고 부족 경고
                            </p>
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                              {Math.abs(calculateProjectedStock()).toLocaleString()}말 부족 예상
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={prevStep}
                  variant="outline"
                  size="lg"
                  className={`flex-1 py-4 ${getMinTouchTarget(touchMode)}`}
                >
                  이전
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={!isQuantityValid()}
                  size="lg"
                  className={`
                    flex-2 py-4 text-lg font-semibold ${getMinTouchTarget(touchMode)}
                    ${transactionType === 'in' 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                    }
                  `}
                >
                  다음 단계
                  <ArrowLeft className="h-5 w-5 ml-2 rotate-180" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Details & Submit */}
          {currentStep === 'details' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-bold mb-2`}>
                  추가 정보 및 완료
                </h2>
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>
                  선택사항을 설정하고 기록을 저장하세요
                </p>
              </div>

              {/* Summary */}
              <Card className={`
                p-6 border-2
                ${transactionType === 'in' 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                  : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                }
              `}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">거래 유형:</span>
                    <Badge variant={transactionType === 'in' ? 'default' : 'destructive'} className="text-sm">
                      {transactionType === 'in' ? '입고' : '사용'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">수량:</span>
                    <span className="text-lg font-bold">
                      {parseFloat(quantity).toLocaleString()} kg
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">예상 재고:</span>
                    <span className={`
                      text-lg font-bold
                      ${calculateProjectedStock() < 0 ? 'text-red-600' : 'text-blue-600'}
                    `}>
                      {calculateProjectedStock().toLocaleString()} kg
                    </span>
                  </div>
                </div>
              </Card>

              {/* Optional details - collapsed by default */}
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={`w-full justify-between ${getMinTouchTarget(touchMode)}`}
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    추가 정보 입력 (선택)
                  </span>
                  <ArrowLeft className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-90' : '-rotate-90'}`} />
                </Button>

                {showAdvanced && (
                  <div className="space-y-4 border rounded-lg p-4">
                    <div>
                      <Label htmlFor="date" className={`${getFullTypographyClass('body', 'sm', isLargeFont)} mb-2 flex items-center gap-2`}>
                        <Calendar className="h-4 w-4" />
                        거래 일자
                      </Label>
                      <Input
                        id="date"
                        type="date"
                        value={transactionDate}
                        onChange={(e) => setTransactionDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className={`text-lg ${getMinTouchTarget(touchMode)}`}
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes" className={`${getFullTypographyClass('body', 'sm', isLargeFont)} mb-2`}>
                        비고 및 특이사항
                      </Label>
                      <Textarea
                        id="notes"
                        placeholder={transactionType === 'in' 
                          ? "공급업체, 품질 상태 등"
                          : "사용 위치, 작업 내용 등"
                        }
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className={`${getFullTypographyClass('body', 'sm', isLargeFont)} ${getMinTouchTarget(touchMode)}`}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={prevStep}
                  variant="outline"
                  size="lg"
                  disabled={saving}
                  className={`flex-1 py-4 ${getMinTouchTarget(touchMode)}`}
                >
                  이전
                </Button>
                <Button
                  onClick={submitRecord}
                  disabled={saving}
                  size="lg"
                  className={`
                    flex-2 py-4 text-lg font-semibold ${getMinTouchTarget(touchMode)}
                    ${transactionType === 'in' 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                    }
                  `}
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      저장 중...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      {transactionType === 'in' ? '입고 완료' : '사용 완료'}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}