'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ViewToggle, useViewMode, CardView, ListView } from '@/components/ui/view-toggle'
import { useFontSize, getTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { 
  Plus,
  Search,
  Filter,
  MoreVertical,
  Wrench,
  Calendar,
  MapPin,
  Tag,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Hammer
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Equipment, EquipmentFilter } from '@/types/equipment'
import { formatDate } from '@/lib/utils'

interface EquipmentListProps {
  equipment: Equipment[]
  categories: any[]
  sites: any[]
  onCheckout: (equipment: Equipment) => void
  onMaintenance: (equipment: Equipment) => void
  onEdit: (equipment: Equipment) => void
  onViewHistory: (equipment: Equipment) => void
}

export function EquipmentList({
  equipment,
  categories,
  sites,
  onCheckout,
  onMaintenance,
  onEdit,
  onViewHistory
}: EquipmentListProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<EquipmentFilter>({
    search: '',
    category: '',
    status: 'all',
    site: '',
    sortBy: 'name',
    sortOrder: 'asc'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useViewMode('equipment-list')

  // Filter equipment
  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = !filter.search || 
      item.name.toLowerCase().includes(filter.search.toLowerCase()) ||
      item.code.toLowerCase().includes(filter.search.toLowerCase()) ||
      item.manufacturer?.toLowerCase().includes(filter.search.toLowerCase()) ||
      item.model?.toLowerCase().includes(filter.search.toLowerCase())
    
    const matchesCategory = !filter.category || filter.category === 'all' || item.category_id === filter.category
    const matchesStatus = filter.status === 'all' || item.status === filter.status
    const matchesSite = !filter.site || filter.site === 'all' || item.site_id === filter.site
    
    return matchesSearch && matchesCategory && matchesStatus && matchesSite
  })

  // Sort equipment
  const sortedEquipment = [...filteredEquipment].sort((a, b) => {
    let compareValue = 0
    
    switch (filter.sortBy) {
      case 'name':
        compareValue = a.name.localeCompare(b.name)
        break
      case 'code':
        compareValue = a.code.localeCompare(b.code)
        break
      case 'status':
        compareValue = a.status.localeCompare(b.status)
        break
      case 'category':
        compareValue = (a.category?.name || '').localeCompare(b.category?.name || '')
        break
    }
    
    return filter.sortOrder === 'asc' ? compareValue : -compareValue
  })

  // Get status icon and color
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'available':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: '사용가능' }
      case 'in_use':
        return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', label: '사용중' }
      case 'maintenance':
        return { icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-100', label: '정비중' }
      case 'damaged':
        return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100', label: '파손' }
      case 'retired':
        return { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100', label: '폐기' }
      default:
        return { icon: Package, color: 'text-gray-600', bg: 'bg-gray-100', label: status }
    }
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

  // Render action buttons for equipment
  const renderActionButtons = (item: Equipment) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="compact" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {item.status === 'available' && (
          <>
            <DropdownMenuItem onClick={() => onCheckout(item)}>
              <Package className="h-4 w-4 mr-2" />
              반출하기
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={() => onMaintenance(item)}>
          <Wrench className="h-4 w-4 mr-2" />
          정비 일정
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onViewHistory(item)}>
          <Calendar className="h-4 w-4 mr-2" />
          사용 이력
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onEdit(item)}>
          <Hammer className="h-4 w-4 mr-2" />
          수정
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="장비명, 코드, 제조사로 검색..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="pl-10"
            />
          </div>
          <ViewToggle
            mode={viewMode}
            onModeChange={setViewMode}
            availableModes={['card', 'list']}
            size="md"
          />
          <Button
            variant="outline"
            size={getButtonSize()}
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            필터
          </Button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <Card className={getTouchPadding()}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className={`block ${getTypographyClass('label', isLargeFont)} mb-1.5`}>
                  카테고리
                </label>
                <select
                  value={filter.category}
                  onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">전체 카테고리</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block ${getTypographyClass('label', isLargeFont)} mb-1.5`}>
                  상태
                </label>
                <select
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value as any })}
                  className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">전체 상태</option>
                  <option value="available">사용가능</option>
                  <option value="in_use">사용중</option>
                  <option value="maintenance">정비중</option>
                  <option value="damaged">파손</option>
                  <option value="retired">폐기</option>
                </select>
              </div>

              <div>
                <label className={`block ${getTypographyClass('label', isLargeFont)} mb-1.5`}>
                  현장
                </label>
                <select
                  value={filter.site}
                  onChange={(e) => setFilter({ ...filter, site: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">전체 현장</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block ${getTypographyClass('label', isLargeFont)} mb-1.5`}>
                  정렬
                </label>
                <select
                  value={`${filter.sortBy}-${filter.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-')
                    setFilter({ ...filter, sortBy: sortBy as any, sortOrder: sortOrder as any })
                  }}
                  className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="name-asc">이름 (오름차순)</option>
                  <option value="name-desc">이름 (내림차순)</option>
                  <option value="code-asc">코드 (오름차순)</option>
                  <option value="code-desc">코드 (내림차순)</option>
                  <option value="status-asc">상태 (오름차순)</option>
                  <option value="status-desc">상태 (내림차순)</option>
                </select>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Equipment Display */}
      {sortedEquipment.length > 0 ? (
        <>
          {viewMode === 'card' ? (
            <CardView columns={3}>
              {sortedEquipment.map(item => {
                const status = getStatusDisplay(item.status)
                const StatusIcon = status.icon

                return (
                  <Card key={item.id} className={`${getTouchPadding()} hover:shadow-md transition-shadow`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-medium ${getTypographyClass('base', isLargeFont)}`}>
                            {item.name}
                          </h3>
                        </div>
                        <p className={`${getTypographyClass('small', isLargeFont)} text-gray-500`}>
                          {item.code}
                        </p>
                      </div>
                      {renderActionButtons(item)}
                    </div>

                    <div className={`space-y-2 ${getTypographyClass('small', isLargeFont)}`}>
                      {item.category && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Tag className="h-3.5 w-3.5" />
                          <span>{item.category.name}</span>
                        </div>
                      )}

                      {item.manufacturer && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Package className="h-3.5 w-3.5" />
                          <span>{item.manufacturer} {item.model}</span>
                        </div>
                      )}

                      {item.site && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{item.site.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className={`flex items-center gap-1.5 ${status.color}`}>
                        <StatusIcon className="h-4 w-4" />
                        <span className={`font-medium ${getTypographyClass('small', isLargeFont)}`}>
                          {status.label}
                        </span>
                      </div>

                      {item.purchase_date && (
                        <span className={`${getTypographyClass('small', isLargeFont)} text-gray-500`}>
                          구입: {formatDate(item.purchase_date)}
                        </span>
                      )}
                    </div>
                  </Card>
                )
              })}
            </CardView>
          ) : (
            <ListView
              data={sortedEquipment}
              columns={[
                {
                  key: 'code',
                  label: '장비코드',
                  sortable: true,
                  width: '120px',
                  render: (value) => (
                    <span className={`font-mono ${getTypographyClass('small', isLargeFont)}`}>
                      {value}
                    </span>
                  )
                },
                {
                  key: 'name',
                  label: '장비명',
                  sortable: true,
                  render: (value, item) => (
                    <div>
                      <div className={`font-medium ${getTypographyClass('base', isLargeFont)}`}>
                        {value}
                      </div>
                      {item.manufacturer && (
                        <div className={`${getTypographyClass('small', isLargeFont)} text-gray-500`}>
                          {item.manufacturer} {item.model}
                        </div>
                      )}
                    </div>
                  )
                },
                {
                  key: 'category.name',
                  label: '카테고리',
                  sortable: true,
                  width: '120px',
                  render: (value) => (
                    <span className={getTypographyClass('small', isLargeFont)}>
                      {value || '-'}
                    </span>
                  )
                },
                {
                  key: 'status',
                  label: '상태',
                  sortable: true,
                  width: '120px',
                  align: 'center',
                  render: (value) => {
                    const status = getStatusDisplay(value)
                    const StatusIcon = status.icon
                    return (
                      <div className={`flex items-center justify-center gap-1.5 ${status.color}`}>
                        <StatusIcon className="h-4 w-4" />
                        <span className={`font-medium ${getTypographyClass('small', isLargeFont)}`}>
                          {status.label}
                        </span>
                      </div>
                    )
                  }
                },
                {
                  key: 'current_user',
                  label: '현재 사용자',
                  width: '120px',
                  render: (value) => (
                    <span className={getTypographyClass('small', isLargeFont)}>
                      {value || '-'}
                    </span>
                  )
                },
                {
                  key: 'site.name',
                  label: '위치/현장',
                  sortable: true,
                  width: '150px',
                  render: (value) => (
                    <span className={getTypographyClass('small', isLargeFont)}>
                      {value || '-'}
                    </span>
                  )
                },
                {
                  key: 'last_maintenance_date',
                  label: '최근 정비',
                  width: '120px',
                  render: (value) => (
                    <span className={getTypographyClass('small', isLargeFont)}>
                      {value ? formatDate(value) : '-'}
                    </span>
                  )
                },
                {
                  key: 'actions',
                  label: '작업',
                  width: '80px',
                  align: 'center',
                  render: (_, item) => renderActionButtons(item)
                }
              ]}
              sortConfig={{
                key: filter.sortBy,
                direction: filter.sortOrder
              }}
              onSort={(config) => {
                if (config.direction) {
                  setFilter({
                    ...filter,
                    sortBy: config.key as any,
                    sortOrder: config.direction
                  })
                }
              }}
              hoverable
              compact={!isLargeFont}
              emptyMessage="장비가 없습니다"
            />
          )}
        </>
      ) : (
        <Card className="p-8 text-center">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className={`${getTypographyClass('large', isLargeFont)} font-medium text-gray-900 mb-2`}>
            장비가 없습니다
          </h3>
          <p className={`${getTypographyClass('base', isLargeFont)} text-gray-600`}>
            필터 조건에 맞는 장비가 없습니다.
          </p>
        </Card>
      )}
    </div>
  )
}