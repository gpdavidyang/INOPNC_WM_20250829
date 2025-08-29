'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { 
  Wrench,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  Filter,
  Search
} from 'lucide-react'
import { Equipment, EquipmentMaintenance } from '@/types/equipment'
import { 
  getEquipment,
  getEquipmentMaintenance,
  getEquipmentCategories
} from '@/app/actions/equipment'
import { useToast } from '@/components/ui/use-toast'
import { formatDate } from '@/lib/utils'
import { EquipmentMaintenanceDialog } from './equipment-maintenance-dialog'
import { EquipmentMaintenanceUpdateDialog } from './equipment-maintenance-update-dialog'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface EquipmentMaintenanceProps {
  currentUser: any
}

export function EquipmentMaintenanceComponent({ currentUser }: EquipmentMaintenanceProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  
  // Data states
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [maintenanceRecords, setMaintenanceRecords] = useState<EquipmentMaintenance[]>([])
  const [categories, setCategories] = useState<any[]>([])
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  
  // Dialog states
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [selectedMaintenance, setSelectedMaintenance] = useState<EquipmentMaintenance | null>(null)

  // Load data
  const loadData = async () => {
    try {
      const [equipmentResult, categoriesResult, maintenanceResult] = await Promise.all([
        getEquipment(),
        getEquipmentCategories(),
        getEquipmentMaintenance()
      ])

      if (equipmentResult.success) setEquipment((equipmentResult.data as unknown as Equipment[]) || [])
      if (categoriesResult.success) setCategories((categoriesResult.data as any[]) || [])
      if (maintenanceResult.success) setMaintenanceRecords((maintenanceResult.data as unknown as EquipmentMaintenance[]) || [])
      
    } catch (error) {
      console.error('Error loading maintenance data:', error)
      toast({
        title: '데이터 로드 실패',
        description: '정비 정보를 불러오는데 실패했습니다.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRefresh = () => {
    setIsLoading(true)
    loadData()
  }

  const handleScheduleMaintenance = (equipment: Equipment) => {
    setSelectedEquipment(equipment)
    setShowScheduleDialog(true)
  }

  const handleUpdateMaintenance = (maintenance: EquipmentMaintenance) => {
    setSelectedMaintenance(maintenance)
    setShowUpdateDialog(true)
  }

  // Filter maintenance records
  const filteredMaintenanceRecords = maintenanceRecords.filter(record => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesEquipment = record.equipment?.name?.toLowerCase().includes(searchLower) ||
                              record.equipment?.code?.toLowerCase().includes(searchLower)
      const matchesDescription = record.description?.toLowerCase().includes(searchLower)
      
      if (!matchesEquipment && !matchesDescription) return false
    }

    // Status filter
    if (statusFilter !== 'all' && record.status !== statusFilter) return false

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date()
      const recordDate = new Date(record.scheduled_date)
      
      switch (dateFilter) {
        case 'overdue':
          return record.status === 'scheduled' && recordDate < today
        case 'today':
          return recordDate.toDateString() === today.toDateString()
        case 'week':
          const weekFromNow = new Date(today)
          weekFromNow.setDate(today.getDate() + 7)
          return recordDate >= today && recordDate <= weekFromNow
        case 'month':
          const monthFromNow = new Date(today)
          monthFromNow.setMonth(today.getMonth() + 1)
          return recordDate >= today && recordDate <= monthFromNow
      }
    }

    return true
  })

  // Group by status
  const groupedRecords = {
    overdue: filteredMaintenanceRecords.filter(r => 
      r.status === 'scheduled' && new Date(r.scheduled_date) < new Date()
    ),
    scheduled: filteredMaintenanceRecords.filter(r => 
      r.status === 'scheduled' && new Date(r.scheduled_date) >= new Date()
    ),
    in_progress: filteredMaintenanceRecords.filter(r => r.status === 'in_progress'),
    completed: filteredMaintenanceRecords.filter(r => r.status === 'completed')
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

  const getInputSize = () => {
    if (touchMode === 'glove') return 'h-14'
    if (touchMode === 'precision') return 'h-9'
    return 'h-10'
  }

  const getMaintenanceTypeLabel = (type: string) => {
    switch (type) {
      case 'routine': return '정기 점검'
      case 'repair': return '수리'
      case 'inspection': return '검사'
      case 'calibration': return '교정'
      default: return type
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-blue-600 bg-blue-50'
      case 'in_progress': return 'text-amber-600 bg-amber-50'
      case 'completed': return 'text-green-600 bg-green-50'
      case 'cancelled': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
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
      {/* Header with filters */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className={`font-medium ${getFullTypographyClass('heading', 'lg', isLargeFont)}`}>
            장비 정비 관리
          </h3>
          <Button 
            size={getButtonSize()}
            onClick={() => setShowScheduleDialog(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            정비 일정 추가
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="장비명, 코드, 설명 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full ${getInputSize()} pl-10 pr-3 rounded-md border border-gray-300`}
              />
            </div>
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="all">모든 상태</option>
            <option value="scheduled">예정</option>
            <option value="in_progress">진행중</option>
            <option value="completed">완료</option>
            <option value="cancelled">취소</option>
          </select>

          {/* Date filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="all">모든 날짜</option>
            <option value="overdue">지연</option>
            <option value="today">오늘</option>
            <option value="week">이번 주</option>
            <option value="month">이번 달</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={getTouchPadding()}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>
                지연된 정비
              </p>
              <p className={`font-semibold ${getFullTypographyClass('heading', '2xl', isLargeFont)} text-red-600`}>
                {groupedRecords.overdue.length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
        </Card>

        <Card className={getTouchPadding()}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>
                예정된 정비
              </p>
              <p className={`font-semibold ${getFullTypographyClass('heading', '2xl', isLargeFont)} text-blue-600`}>
                {groupedRecords.scheduled.length}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-blue-400" />
          </div>
        </Card>

        <Card className={getTouchPadding()}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>
                진행 중
              </p>
              <p className={`font-semibold ${getFullTypographyClass('heading', '2xl', isLargeFont)} text-amber-600`}>
                {groupedRecords.in_progress.length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-amber-400" />
          </div>
        </Card>

        <Card className={getTouchPadding()}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>
                완료됨
              </p>
              <p className={`font-semibold ${getFullTypographyClass('heading', '2xl', isLargeFont)} text-green-600`}>
                {groupedRecords.completed.length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </Card>
      </div>

      {/* Maintenance Records by Status */}
      <div className="space-y-6">
        {/* Overdue */}
        {groupedRecords.overdue.length > 0 && (
          <Card className={getTouchPadding()}>
            <h4 className={`font-medium ${getFullTypographyClass('body', 'base', isLargeFont)} text-red-600 mb-4 flex items-center gap-2`}>
              <AlertTriangle className="h-5 w-5" />
              지연된 정비 ({groupedRecords.overdue.length})
            </h4>
            <div className="space-y-3">
              {groupedRecords.overdue.map(record => (
                <MaintenanceRecordCard 
                  key={record.id} 
                  record={record} 
                  onUpdate={handleUpdateMaintenance}
                  isLargeFont={isLargeFont}
                  touchMode={touchMode}
                />
              ))}
            </div>
          </Card>
        )}

        {/* Scheduled */}
        {groupedRecords.scheduled.length > 0 && (
          <Card className={getTouchPadding()}>
            <h4 className={`font-medium ${getFullTypographyClass('body', 'base', isLargeFont)} text-blue-600 mb-4 flex items-center gap-2`}>
              <Calendar className="h-5 w-5" />
              예정된 정비 ({groupedRecords.scheduled.length})
            </h4>
            <div className="space-y-3">
              {groupedRecords.scheduled.map(record => (
                <MaintenanceRecordCard 
                  key={record.id} 
                  record={record} 
                  onUpdate={handleUpdateMaintenance}
                  isLargeFont={isLargeFont}
                  touchMode={touchMode}
                />
              ))}
            </div>
          </Card>
        )}

        {/* In Progress */}
        {groupedRecords.in_progress.length > 0 && (
          <Card className={getTouchPadding()}>
            <h4 className={`font-medium ${getFullTypographyClass('body', 'base', isLargeFont)} text-amber-600 mb-4 flex items-center gap-2`}>
              <Clock className="h-5 w-5" />
              진행 중인 정비 ({groupedRecords.in_progress.length})
            </h4>
            <div className="space-y-3">
              {groupedRecords.in_progress.map(record => (
                <MaintenanceRecordCard 
                  key={record.id} 
                  record={record} 
                  onUpdate={handleUpdateMaintenance}
                  isLargeFont={isLargeFont}
                  touchMode={touchMode}
                />
              ))}
            </div>
          </Card>
        )}

        {/* Empty state */}
        {filteredMaintenanceRecords.length === 0 && (
          <Card className={`${getTouchPadding()} text-center`}>
            <Wrench className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className={`${getFullTypographyClass('body', 'base', isLargeFont)} text-gray-600`}>
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                ? '검색 결과가 없습니다.' 
                : '정비 일정이 없습니다.'}
            </p>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      <EquipmentMaintenanceDialog
        equipment={equipment}
        selectedEquipment={selectedEquipment}
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        onSuccess={handleRefresh}
      />

      <EquipmentMaintenanceUpdateDialog
        maintenance={selectedMaintenance}
        open={showUpdateDialog}
        onOpenChange={setShowUpdateDialog}
        onSuccess={handleRefresh}
      />
    </div>
  )
}

// Maintenance Record Card Component
interface MaintenanceRecordCardProps {
  record: EquipmentMaintenance
  onUpdate: (record: EquipmentMaintenance) => void
  isLargeFont: boolean
  touchMode: string
}

function MaintenanceRecordCard({ record, onUpdate, isLargeFont, touchMode }: MaintenanceRecordCardProps) {
  const isOverdue = record.status === 'scheduled' && new Date(record.scheduled_date) < new Date()
  
  const getMaintenanceTypeLabel = (type: string) => {
    switch (type) {
      case 'routine': return '정기 점검'
      case 'repair': return '수리'
      case 'inspection': return '검사'
      case 'calibration': return '교정'
      default: return type
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return '예정'
      case 'in_progress': return '진행중'
      case 'completed': return '완료'
      case 'cancelled': return '취소'
      default: return status
    }
  }

  const getStatusColor = (status: string, isOverdue: boolean) => {
    if (isOverdue) return 'text-red-600 bg-red-50'
    
    switch (status) {
      case 'scheduled': return 'text-blue-600 bg-blue-50'
      case 'in_progress': return 'text-amber-600 bg-amber-50'
      case 'completed': return 'text-green-600 bg-green-50'
      case 'cancelled': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getButtonSize = () => {
    if (touchMode === 'glove') return 'field'
    if (touchMode === 'precision') return 'compact'
    return isLargeFont ? 'standard' : 'compact'
  }

  return (
    <div className={`p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors ${isOverdue ? 'border border-red-200' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          {/* Equipment info */}
          <div className="flex items-center gap-3">
            <Wrench className="h-4 w-4 text-gray-600" />
            <span className={`font-medium ${getFullTypographyClass('body', 'base', isLargeFont)}`}>
              {record.equipment?.name} ({record.equipment?.code})
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status, isOverdue)}`}>
              {isOverdue ? '지연' : getStatusLabel(record.status)}
            </span>
          </div>

          {/* Details */}
          <div className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 space-y-1`}>
            <div>유형: {getMaintenanceTypeLabel(record.maintenance_type)}</div>
            <div>예정일: {formatDate(record.scheduled_date)}</div>
            {record.description && <div>설명: {record.description}</div>}
            {record.cost && <div>예상 비용: {record.cost.toLocaleString()}원</div>}
            {record.completed_date && (
              <div className="text-green-600">완료일: {formatDate(record.completed_date)}</div>
            )}
          </div>
        </div>

        {/* Action button */}
        {record.status !== 'completed' && record.status !== 'cancelled' && (
          <Button
            size={getButtonSize()}
            variant={isOverdue ? 'danger' : 'outline'}
            onClick={() => onUpdate(record)}
          >
            {record.status === 'scheduled' ? '시작' : '업데이트'}
          </Button>
        )}
      </div>
    </div>
  )
}