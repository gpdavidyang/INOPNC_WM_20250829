'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/custom-select'
import { 
  Package, 
  TrendingUp, 
  Calendar,
  ArrowDown,
  ArrowUp,
  Archive,
  Plus,
  FileText,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { createClient } from '@/lib/supabase/client'
import { getNPCMaterialsData, getSitesForMaterials } from '@/app/actions/npc-materials'
import MaterialRequestDialog from './MaterialRequestDialog'
import InventoryRecordDialog from './InventoryRecordDialog'

interface DailyStatus {
  incoming: number
  used: number
  inventory: number
}

interface CumulativeStatus {
  totalIncoming: number
  totalUsed: number
  totalInventory: number
}

interface InventoryMovement {
  date: string
  incoming: number
  used: number
  inventory: number
}

interface Site {
  id: string
  name: string
}

interface Props {
  currentSiteId?: string
  currentSiteName?: string
}

export default function NPC1000DailyDashboard({ currentSiteId, currentSiteName }: Props) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  
  // State
  const [loading, setLoading] = useState(false)
  const [selectedSiteId, setSelectedSiteId] = useState<string>(currentSiteId || '')
  const [availableSites, setAvailableSites] = useState<Site[]>([])
  const [dailyStatus, setDailyStatus] = useState<DailyStatus>({ incoming: 0, used: 0, inventory: 0 })
  const [cumulativeStatus, setCumulativeStatus] = useState<CumulativeStatus>({ totalIncoming: 0, totalUsed: 0, totalInventory: 0 })
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [sortField, setSortField] = useState<'date' | 'incoming' | 'used' | 'inventory'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  
  // Dialog states
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)
  const [recordDialogOpen, setRecordDialogOpen] = useState(false)
  
  // Touch-responsive sizing
  const getButtonSize = () => {
    if (touchMode === 'glove') return 'field'
    if (touchMode === 'precision') return 'compact'
    return 'standard'
  }

  const getIconSize = () => {
    if (touchMode === 'glove') return 'h-6 w-6'
    if (isLargeFont) return 'h-5 w-5'
    return 'h-4 w-4'
  }

  // Load available sites
  useEffect(() => {
    const loadSites = async () => {
      const result = await getSitesForMaterials()
      
      console.log('Sites result:', result)
      
      if (result.success && result.data.length > 0) {
        setAvailableSites(result.data)
        if (!selectedSiteId && result.data.length > 0) {
          setSelectedSiteId(result.data[0].id)
        }
      } else {
        console.log('No sites available, using hardcoded site ID')
        // Use the user's current site directly
        setSelectedSiteId('fb777dd6-fde2-4fe7-a83b-72605372d0c5')
        setAvailableSites([{ id: 'fb777dd6-fde2-4fe7-a83b-72605372d0c5', name: '송파 C현장' }])
      }
    }
    loadSites()
  }, [])

  // Load NPC-1000 data for selected site
  const loadNPCData = useCallback(async () => {
    if (!selectedSiteId) return
    
    setLoading(true)
    
    try {
      console.log('Loading NPC data for site:', selectedSiteId)
      
      const result = await getNPCMaterialsData(selectedSiteId)
      
      console.log('NPC data result:', result)
      
      if (result.success && result.data) {
        const { inventory, transactions } = result.data
        
        // Get today's date for daily status
        const today = new Date().toISOString().split('T')[0]
        
        // Calculate total current inventory
        const totalInventory = inventory.reduce((sum: number, item: any) => sum + (item.current_stock || 0), 0)
        
        // Calculate today's transactions
        const todayTransactions = transactions.filter((t: any) => 
          t.created_at && t.created_at.split('T')[0] === today
        )
        
        const todayIncoming = todayTransactions
          .filter((t: any) => t.transaction_type === 'in')
          .reduce((sum: number, t: any) => sum + (t.quantity || 0), 0)
        
        const todayUsed = todayTransactions
          .filter((t: any) => t.transaction_type === 'out')
          .reduce((sum: number, t: any) => sum + (t.quantity || 0), 0)
        
        setDailyStatus({
          incoming: todayIncoming,
          used: todayUsed,
          inventory: totalInventory
        })
        
        // Calculate cumulative status from all transactions
        const allIncoming = transactions.filter((t: any) => t.transaction_type === 'in')
          .reduce((sum: number, t: any) => sum + (t.quantity || 0), 0)
        
        const allUsed = transactions.filter((t: any) => t.transaction_type === 'out')
          .reduce((sum: number, t: any) => sum + (t.quantity || 0), 0)
        
        setCumulativeStatus({
          totalIncoming: allIncoming,
          totalUsed: allUsed,
          totalInventory: totalInventory
        })
        
        // Group transactions by date for movements table
        const movementsByDate = new Map<string, { incoming: number, used: number, inventory: number }>()
        
        transactions.forEach((t: any) => {
          if (!t.created_at) return
          const date = t.created_at.split('T')[0]
          const existing = movementsByDate.get(date) || { incoming: 0, used: 0, inventory: 0 }
          
          if (t.transaction_type === 'in') {
            existing.incoming += t.quantity || 0
          } else if (t.transaction_type === 'out') {
            existing.used += t.quantity || 0
          }
          
          movementsByDate.set(date, existing)
        })
        
        // Set inventory as current stock for the most recent date
        const sortedDates = Array.from(movementsByDate.keys()).sort((a, b) => b.localeCompare(a))
        if (sortedDates.length > 0) {
          const latestDate = sortedDates[0]
          const latestMovement = movementsByDate.get(latestDate)
          if (latestMovement) {
            latestMovement.inventory = totalInventory
          }
        }
        
        const movementsData = Array.from(movementsByDate.entries())
          .map(([date, data]) => ({ date, ...data }))
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 10) // Show last 10 days
        
        setMovements(movementsData)
        
        console.log('Processed data:', {
          totalInventory,
          dailyStatus: { incoming: todayIncoming, used: todayUsed },
          movementsCount: movementsData.length
        })
      } else {
        console.error('Failed to load NPC data:', result.error)
      }
      
    } catch (error) {
      console.error('Error loading NPC-1000 data:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedSiteId])

  // Update selected site when currentSiteId changes
  useEffect(() => {
    if (currentSiteId && currentSiteId !== selectedSiteId) {
      setSelectedSiteId(currentSiteId)
    }
  }, [currentSiteId, selectedSiteId])

  // Load NPC-1000 data for selected site
  useEffect(() => {
    if (selectedSiteId) {
      loadNPCData()
    }
  }, [selectedSiteId, loadNPCData])

  // Handle sorting
  const handleSort = (field: 'date' | 'incoming' | 'used' | 'inventory') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedMovements = [...movements].sort((a, b) => {
    let valueA: any, valueB: any
    
    switch (sortField) {
      case 'date':
        valueA = new Date(a.date)
        valueB = new Date(b.date)
        break
      case 'incoming':
        valueA = a.incoming
        valueB = b.incoming
        break
      case 'used':
        valueA = a.used
        valueB = b.used
        break
      case 'inventory':
        valueA = a.inventory
        valueB = b.inventory
        break
      default:
        return 0
    }
    
    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1
    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Handle dialog success callbacks
  const handleDialogSuccess = () => {
    loadNPCData() // Reload data after successful dialog operations
  }

  // Get selected site info
  const selectedSiteName = currentSiteName || 
    availableSites.find(site => site.id === selectedSiteId)?.name || '현장 선택'
  
  return (
    <div className="space-y-2">
      {/* Status Cards - Two-column layout with higher density */}
      <div className="grid grid-cols-2 gap-2">
        {/* Daily Status Card */}
        <Card className="p-2">
          <div className="space-y-2">
            {/* Header with blue dot */}
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <h3 className={`${getFullTypographyClass('heading', 'xs', isLargeFont)} font-medium text-gray-900 dark:text-gray-100`}>
                금일 현황
              </h3>
            </div>
            
            {/* Daily Status Items */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-gray-700 dark:text-gray-300`}>
                  입고
                </span>
                <span className={`${getFullTypographyClass('heading', 'md', isLargeFont)} font-semibold text-gray-900 dark:text-gray-100`}>
                  {dailyStatus.incoming}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-gray-700 dark:text-gray-300`}>
                  사용
                </span>
                <span className={`${getFullTypographyClass('heading', 'md', isLargeFont)} font-semibold text-gray-900 dark:text-gray-100`}>
                  {dailyStatus.used}
                </span>
              </div>
              
              <div className="flex items-center justify-between pt-0.5 border-t border-gray-200 dark:border-gray-700">
                <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-gray-700 dark:text-gray-300`}>
                  재고
                </span>
                <span className={`${getFullTypographyClass('heading', 'md', isLargeFont)} font-semibold text-blue-600 dark:text-blue-400`}>
                  {dailyStatus.inventory}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Cumulative Status Card */}
        <Card className="p-2">
          <div className="space-y-2">
            {/* Header with green dot */}
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <h3 className={`${getFullTypographyClass('heading', 'xs', isLargeFont)} font-medium text-gray-900 dark:text-gray-100`}>
                누적 현황
              </h3>
            </div>
            
            {/* Cumulative Status Items */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-gray-700 dark:text-gray-300`}>
                  총입고
                </span>
                <span className={`${getFullTypographyClass('heading', 'md', isLargeFont)} font-semibold text-gray-900 dark:text-gray-100`}>
                  {cumulativeStatus.totalIncoming}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-gray-700 dark:text-gray-300`}>
                  총사용
                </span>
                <span className={`${getFullTypographyClass('heading', 'md', isLargeFont)} font-semibold text-gray-900 dark:text-gray-100`}>
                  {cumulativeStatus.totalUsed}
                </span>
              </div>
              
              <div className="flex items-center justify-between pt-0.5 border-t border-gray-200 dark:border-gray-700">
                <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-gray-700 dark:text-gray-300`}>
                  현재고
                </span>
                <span className={`${getFullTypographyClass('heading', 'md', isLargeFont)} font-semibold text-green-600 dark:text-green-400`}>
                  {cumulativeStatus.totalInventory}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Inventory Movement Table - Higher density */}
      <Card>
        <div className="p-2">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th 
                    className="text-left py-2 px-1 font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)}`}>날짜</span>
                      {sortField === 'date' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-center py-2 px-1 font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => handleSort('incoming')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)}`}>입고</span>
                      {sortField === 'incoming' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-center py-2 px-1 font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => handleSort('used')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)}`}>사용</span>
                      {sortField === 'used' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-center py-2 px-1 font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => handleSort('inventory')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)}`}>재고</span>
                      {sortField === 'inventory' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {sortedMovements.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center">
                      <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-gray-500`}>
                        NPC-1000 자재 기록이 없습니다.
                      </p>
                    </td>
                  </tr>
                ) : (
                  sortedMovements.map((movement, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-1.5 px-1">
                        <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} font-medium text-gray-900 dark:text-gray-100`}>
                          {new Date(movement.date).toLocaleDateString('ko-KR', {
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </span>
                      </td>
                      <td className="py-1.5 px-1 text-center">
                        <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} font-medium text-gray-900 dark:text-gray-100`}>
                          {movement.incoming}
                        </span>
                      </td>
                      <td className="py-1.5 px-1 text-center">
                        <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} font-medium text-gray-900 dark:text-gray-100`}>
                          {movement.used}
                        </span>
                      </td>
                      <td className="py-1.5 px-1 text-center">
                        <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} font-medium text-blue-600 dark:text-blue-400`}>
                          {movement.inventory}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Action Buttons - Compact */}
      <div className="flex gap-2">
        <Button 
          size={getButtonSize()}
          className="flex-1 gap-1.5"
          variant="outline"
          onClick={() => setRequestDialogOpen(true)}
          disabled={!selectedSiteId}
        >
          <Plus className={getIconSize()} />
          요청
        </Button>
        <Button 
          size={getButtonSize()}
          className="flex-1 gap-1.5"
          variant="outline"
          onClick={() => setRecordDialogOpen(true)}
          disabled={!selectedSiteId}
        >
          <FileText className={getIconSize()} />
          입고사용량 기록
        </Button>
      </div>

      {/* Dialogs */}
      <MaterialRequestDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        siteId={selectedSiteId}
        siteName={selectedSiteName}
        onSuccess={handleDialogSuccess}
      />

      <InventoryRecordDialog
        open={recordDialogOpen}
        onOpenChange={setRecordDialogOpen}
        siteId={selectedSiteId}
        siteName={selectedSiteName}
        onSuccess={handleDialogSuccess}
      />
    </div>
  )
}