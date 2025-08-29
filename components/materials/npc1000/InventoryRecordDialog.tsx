'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { Package, ArrowDown, ArrowUp, FileText, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { recordInventoryTransaction } from '@/app/actions/npc-materials'


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
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming')
  const [currentStock, setCurrentStock] = useState<number>(0)
  const [loadingStock, setLoadingStock] = useState(false)
  
  // Form state
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')

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
      setActiveTab('incoming')
      fetchCurrentStock()
    }
  }, [open, siteId])

  // Calculate projected stock after transaction
  const calculateProjectedStock = () => {
    const quantityNum = parseFloat(quantity) || 0
    if (activeTab === 'incoming') {
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
    if (projectedStock < 0 && activeTab === 'outgoing') {
      const confirmed = window.confirm(
        `사용 후 재고가 음수가 됩니다 (${projectedStock}kg).\n계속 진행하시겠습니까?`
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

      const actionText = activeTab === 'incoming' ? '입고' : '사용량'
      
      // Create material transaction using server action
      const transactionResult = await recordInventoryTransaction({
        siteId: siteId,
        materialCode: 'NPC-1000',
        transactionType: activeTab === 'incoming' ? 'in' : 'out',
        quantity: quantityNum,
        transactionDate: new Date().toISOString(),
        notes: `${actionText} 기록 - NPC-1000 | 계산 후 재고: ${projectedStock}kg${notes ? ' | ' + notes : ''}`
      })

      if (!transactionResult.success) {
        throw new Error(transactionResult.error || '거래 기록에 실패했습니다.')
      }
      toast.success(`${actionText} 기록이 성공적으로 저장되었습니다.`)
      
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={getFullTypographyClass('heading', 'lg', isLargeFont)}>
            입고사용량 기록
          </DialogTitle>
          {siteName && (
            <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-muted-foreground`}>
              현장: {siteName}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-6">

          {/* NPC-1000 Fixed Material Section */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Package className={`${getIconSize()} text-blue-600`} />
              <h3 className={`${getFullTypographyClass('heading', 'sm', isLargeFont)} font-medium`}>
                NPC-1000
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                  구분 *
                </Label>
                <Select value={activeTab} onValueChange={(value) => setActiveTab(value as 'incoming' | 'outgoing')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
                    <SelectItem value="incoming">
                      <div className="flex items-center gap-2">
                        <ArrowDown className="h-4 w-4 text-green-600" />
                        <span>입고</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="outgoing">
                      <div className="flex items-center gap-2">
                        <ArrowUp className="h-4 w-4 text-red-600" />
                        <span>사용량</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                  수량 *
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="quantity"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-md">
                    <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-muted-foreground`}>
                      kg
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <Label className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                  현재 재고
                </Label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-md">
                    {loadingStock ? (
                      <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-muted-foreground`}>
                        조회중...
                      </span>
                    ) : (
                      <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium`}>
                        {currentStock.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-md">
                    <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-muted-foreground`}>
                      kg
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div>
            <Label htmlFor="notes" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
              비고 및 특이사항
            </Label>
            <Textarea
              id="notes"
              placeholder="관련 특이사항이나 품질 상태, 사용 위치, 담당자 등을 기록하세요"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={getFullTypographyClass('body', 'sm', isLargeFont)}
            />
          </div>

          {/* Stock Calculation Card */}
          {quantity && (
            <Card className="p-4 bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-green-600" />
                <h3 className={`${getFullTypographyClass('heading', 'sm', isLargeFont)} font-medium text-green-800 dark:text-green-400`}>
                  재고 계산
                </h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">현재 재고:</span>
                  <span className="font-medium text-lg">
                    {currentStock.toLocaleString()} kg
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-t">
                  <span className="text-muted-foreground">
                    {activeTab === 'incoming' ? '입고량 (+)' : '사용량 (-)'}:
                  </span>
                  <span className={`font-medium text-lg ${
                    activeTab === 'incoming' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {activeTab === 'incoming' ? '+' : '-'}{parseFloat(quantity || '0').toLocaleString()} kg
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-t bg-gray-50 dark:bg-gray-800 -mx-4 px-4 rounded">
                  <span className="font-semibold">계산 후 재고:</span>
                  <span className={`font-bold text-xl ${
                    calculateProjectedStock() < 0 ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {calculateProjectedStock().toLocaleString()} kg
                  </span>
                </div>
                
                {calculateProjectedStock() < 0 && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600">
                      재고가 부족합니다. 음수 재고가 발생할 예정입니다.
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Transaction Summary */}
          {quantity && (
            <Card className="p-4 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className={`${getFullTypographyClass('heading', 'sm', isLargeFont)} font-medium text-blue-800 dark:text-blue-400`}>
                  거래 요약
                </h3>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">자재:</span>
                  <span className="font-medium">NPC-1000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">구분:</span>
                  <Badge className={activeTab === 'incoming' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }>
                    {activeTab === 'incoming' ? '입고' : '사용량'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">수량:</span>
                  <span className="font-medium">
                    {parseFloat(quantity).toLocaleString()}kg
                  </span>
                </div>
                {remainingQuantity && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">잔여:</span>
                    <span className="font-medium text-blue-600">
                      {parseFloat(remainingQuantity).toLocaleString()}kg
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">일자:</span>
                  <span className="font-medium">
                    {new Date().toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            size={getButtonSize()}
          >
            취소
          </Button>
          <Button
            onClick={submitRecord}
            disabled={saving || !quantity}
            size={getButtonSize()}
            className={activeTab === 'incoming' 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-red-600 hover:bg-red-700'
            }
          >
            {saving ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}