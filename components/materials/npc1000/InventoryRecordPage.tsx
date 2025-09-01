'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { Package, ArrowDown, ArrowUp, ArrowLeft, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { recordInventoryTransaction } from '@/app/actions/npc-materials'
import { getCurrentUserSite } from '@/app/actions/site-info'

export default function InventoryRecordPage() {
  const router = useRouter()
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  
  // State
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming')
  const [currentStock, setCurrentStock] = useState<number>(0)
  const [loadingStock, setLoadingStock] = useState(false)
  const [siteId, setSiteId] = useState<string>('')
  const [siteName, setSiteName] = useState<string>('')
  
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

  // Load current site info
  useEffect(() => {
    const loadSiteInfo = async () => {
      const result = await getCurrentUserSite()
      if (result.success && result.data) {
        setSiteId(result.data.site_id)
        setSiteName(result.data.site_name)
      }
    }
    loadSiteInfo()
  }, [])

  // Fetch current stock for the site
  const fetchCurrentStock = async () => {
    if (!siteId) return
    
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

  // Load stock when site ID is available
  useEffect(() => {
    if (siteId) {
      fetchCurrentStock()
    }
  }, [siteId])

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

      // Record single NPC-1000 transaction
      const result = await recordInventoryTransaction({
        siteId: siteId,
        materialCode: 'NPC-1000',
        quantity: quantityNum,
        type: activeTab,
        transactionDate: new Date().toISOString(),
        notes: notes || undefined
      })

      if (result.success) {
        toast.success(
          activeTab === 'incoming' 
            ? `입고 ${quantityNum}kg 기록되었습니다.`
            : `사용 ${quantityNum}kg 기록되었습니다.`
        )
        router.back()
      } else {
        throw new Error(result.error || '기록 저장에 실패했습니다.')
      }
      
    } catch (error) {
      console.error('Error submitting record:', error)
      toast.error('기록 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const projectedStock = calculateProjectedStock()
  const isNegativeStock = projectedStock < 0

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className={getIconSize()} />
          </Button>
          <div>
            <h1 className={getFullTypographyClass('heading', 'xl', isLargeFont)}>
              NPC-1000 입고/사용량 기록
            </h1>
            {siteName && (
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-muted-foreground`}>
                현장: {siteName}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Current Stock Display */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-muted-foreground`}>
                현재 재고
              </p>
              {loadingStock ? (
                <p className={`${getFullTypographyClass('heading', 'xl', isLargeFont)} font-bold text-gray-400`}>
                  로딩중...
                </p>
              ) : (
                <p className={`${getFullTypographyClass('heading', 'xl', isLargeFont)} font-bold text-blue-600`}>
                  {currentStock.toLocaleString()} kg
                </p>
              )}
            </div>
            <Package className="h-12 w-12 text-gray-400" />
          </div>
        </Card>

        {/* Transaction Type Tabs */}
        <Card className="p-6">
          <div className="flex gap-2 mb-6">
            <Button
              variant={activeTab === 'incoming' ? 'default' : 'outline'}
              onClick={() => setActiveTab('incoming')}
              className="flex-1"
              size={getButtonSize()}
            >
              <ArrowDown className={`${getIconSize()} mr-2`} />
              입고
            </Button>
            <Button
              variant={activeTab === 'outgoing' ? 'default' : 'outline'}
              onClick={() => setActiveTab('outgoing')}
              className="flex-1"
              size={getButtonSize()}
            >
              <ArrowUp className={`${getIconSize()} mr-2`} />
              사용
            </Button>
          </div>

          {/* Transaction Form */}
          <div className="space-y-4">
            <div>
              <Label className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                수량 *
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  step="0.1"
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
                메모
              </Label>
              <Textarea
                placeholder={activeTab === 'incoming' ? '입고 관련 메모' : '사용 용도 등 메모'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className={`mt-1 ${getFullTypographyClass('body', 'sm', isLargeFont)}`}
              />
            </div>

            {/* Projected Stock Display */}
            {quantity && (
              <div className={`p-4 rounded-lg border ${
                isNegativeStock 
                  ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                  : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
              }`}>
                <div className="flex items-center gap-2">
                  {isNegativeStock && <AlertCircle className="h-4 w-4 text-red-600" />}
                  <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} ${
                    isNegativeStock ? 'text-red-700 dark:text-red-300' : 'text-blue-700 dark:text-blue-300'
                  }`}>
                    {activeTab === 'incoming' ? '입고 후' : '사용 후'} 예상 재고: 
                    <span className="font-bold ml-2">{projectedStock.toLocaleString()} kg</span>
                  </p>
                </div>
                {isNegativeStock && (
                  <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-red-600 dark:text-red-400 mt-1`}>
                    ⚠️ 재고가 부족합니다. 추가 입고가 필요합니다.
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
            size={getButtonSize()}
          >
            취소
          </Button>
          <Button
            onClick={submitRecord}
            disabled={saving || !quantity}
            size={getButtonSize()}
          >
            {saving ? '저장 중...' : activeTab === 'incoming' ? '입고 기록' : '사용 기록'}
          </Button>
        </div>
      </div>
    </div>
  )
}