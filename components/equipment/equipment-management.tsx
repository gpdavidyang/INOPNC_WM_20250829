'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { 
  Package,
  Calendar,
  Wrench,
  Users,
  Plus,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { Equipment, EquipmentCheckout, EquipmentStats } from '@/types/equipment'
import { 
  getEquipment, 
  getEquipmentCategories, 
  getEquipmentStats,
  getEquipmentCheckouts
} from '@/app/actions/equipment'
import { getAllSites } from '@/app/actions/site-info'
import { useToast } from '@/components/ui/use-toast'
import { EquipmentList } from './equipment-list'
import { EquipmentCheckoutDialog } from './equipment-checkout-dialog'
import { EquipmentReturnDialog } from './equipment-return-dialog'
import { ResourceAllocationComponent } from './resource-allocation'
import { EquipmentMaintenanceComponent } from './equipment-maintenance'
import { EquipmentCalendar } from './equipment-calendar'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface EquipmentManagementProps {
  currentUser: any
}

export function EquipmentManagement({ currentUser }: EquipmentManagementProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('equipment')
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Data states
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [stats, setStats] = useState<EquipmentStats>({
    totalEquipment: 0,
    availableEquipment: 0,
    inUseEquipment: 0,
    maintenanceEquipment: 0,
    damagedEquipment: 0,
    activeCheckouts: 0,
    overdueReturns: 0,
    upcomingMaintenance: 0
  })
  const [checkouts, setCheckouts] = useState<EquipmentCheckout[]>([])
  
  // Dialog states
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false)
  const [showReturnDialog, setShowReturnDialog] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [selectedCheckout, setSelectedCheckout] = useState<EquipmentCheckout | null>(null)

  // Load data
  const loadData = async () => {
    try {
      const [equipmentResult, categoriesResult, sitesResult, statsResult, checkoutsResult] = await Promise.all([
        getEquipment(),
        getEquipmentCategories(),
        getAllSites(),
        getEquipmentStats(),
        getEquipmentCheckouts({ active_only: true })
      ])

      if (equipmentResult.success) setEquipment((equipmentResult.data as unknown as Equipment[]) || [])
      if (categoriesResult.success) setCategories((categoriesResult.data as any[]) || [])
      if (sitesResult.success) setSites((sitesResult.data as any[]) || [])
      if (statsResult.success) setStats((statsResult.data as EquipmentStats) || stats)
      if (checkoutsResult.success) setCheckouts((checkoutsResult.data as unknown as EquipmentCheckout[]) || [])
      
    } catch (error) {
      console.error('Error loading equipment data:', error)
      toast({
        title: '데이터 로드 실패',
        description: '장비 정보를 불러오는데 실패했습니다.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const handleCheckout = (equipment: Equipment) => {
    setSelectedEquipment(equipment)
    setShowCheckoutDialog(true)
  }

  const handleReturn = (checkout: EquipmentCheckout) => {
    setSelectedCheckout(checkout)
    setShowReturnDialog(true)
  }

  const handleMaintenance = (equipment: Equipment) => {
    // TODO: Implement maintenance scheduling
    toast({
      title: '개발 중',
      description: '정비 일정 관리 기능은 개발 중입니다.'
    })
  }

  const handleEdit = (equipment: Equipment) => {
    // TODO: Implement equipment edit
    toast({
      title: '개발 중',
      description: '장비 수정 기능은 개발 중입니다.'
    })
  }

  const handleViewHistory = (equipment: Equipment) => {
    // TODO: Implement history view
    toast({
      title: '개발 중',
      description: '사용 이력 조회 기능은 개발 중입니다.'
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`font-semibold ${getFullTypographyClass('heading', '2xl', isLargeFont)}`}>
            장비 & 자원 관리
          </h1>
          <p className={`${getFullTypographyClass('body', 'base', isLargeFont)} text-gray-600 mt-1`}>
            장비 현황, 반출/반납, 정비 관리
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size={getButtonSize()}
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button 
            size={getButtonSize()}
            onClick={() => {
              // TODO: Add new equipment
              toast({
                title: '개발 중',
                description: '장비 추가 기능은 개발 중입니다.'
              })
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            장비 추가
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={getTouchPadding()}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>
                전체 장비
              </p>
              <p className={`font-semibold ${getFullTypographyClass('heading', '2xl', isLargeFont)}`}>
                {stats.totalEquipment}
              </p>
            </div>
            <Package className="h-8 w-8 text-gray-400" />
          </div>
        </Card>

        <Card className={getTouchPadding()}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>
                사용 가능
              </p>
              <p className={`font-semibold ${getFullTypographyClass('heading', '2xl', isLargeFont)} text-green-600`}>
                {stats.availableEquipment}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </Card>

        <Card className={getTouchPadding()}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>
                사용 중
              </p>
              <p className={`font-semibold ${getFullTypographyClass('heading', '2xl', isLargeFont)} text-blue-600`}>
                {stats.inUseEquipment}
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-400" />
          </div>
        </Card>

        <Card className={getTouchPadding()}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>
                정비/파손
              </p>
              <p className={`font-semibold ${getFullTypographyClass('heading', '2xl', isLargeFont)} text-amber-600`}>
                {stats.maintenanceEquipment + stats.damagedEquipment}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-amber-400" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="equipment" className="gap-2">
            <Package className="h-4 w-4" />
            장비 목록
          </TabsTrigger>
          <TabsTrigger value="checkouts" className="gap-2">
            <Clock className="h-4 w-4" />
            반출 현황
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            일정 캘린더
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-2">
            <Wrench className="h-4 w-4" />
            정비 관리
          </TabsTrigger>
          <TabsTrigger value="resources" className="gap-2">
            <Users className="h-4 w-4" />
            자원 배치
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="space-y-4">
          <EquipmentList
            equipment={equipment}
            categories={categories}
            sites={sites}
            onCheckout={handleCheckout}
            onMaintenance={handleMaintenance}
            onEdit={handleEdit}
            onViewHistory={handleViewHistory}
          />
        </TabsContent>

        <TabsContent value="checkouts" className="space-y-4">
          <Card className={getTouchPadding()}>
            <h3 className={`font-medium ${getFullTypographyClass('heading', 'lg', isLargeFont)} mb-4`}>
              활성 반출 현황
            </h3>
            {checkouts.length > 0 ? (
              <div className="space-y-3">
                {checkouts.map(checkout => (
                  <div 
                    key={checkout.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className={`font-medium ${getFullTypographyClass('body', 'base', isLargeFont)}`}>
                        {checkout.equipment?.name} ({checkout.equipment?.code})
                      </p>
                      <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>
                        반출자: {checkout.checked_out_user?.full_name} | 
                        현장: {checkout.site?.name}
                      </p>
                    </div>
                    <Button
                      size="compact"
                      onClick={() => handleReturn(checkout)}
                    >
                      반납
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-center ${getFullTypographyClass('body', 'base', isLargeFont)} text-gray-500`}>
                현재 반출된 장비가 없습니다.
              </p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <EquipmentCalendar />
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <EquipmentMaintenanceComponent currentUser={currentUser} />
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <ResourceAllocationComponent currentUser={currentUser} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <EquipmentCheckoutDialog
        equipment={selectedEquipment}
        sites={sites}
        open={showCheckoutDialog}
        onOpenChange={setShowCheckoutDialog}
        onSuccess={handleRefresh}
      />

      <EquipmentReturnDialog
        checkout={selectedCheckout}
        open={showReturnDialog}
        onOpenChange={setShowReturnDialog}
        onSuccess={handleRefresh}
      />
    </div>
  )
}