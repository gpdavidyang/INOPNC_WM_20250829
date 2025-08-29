'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/custom-select'
import { 
  ChevronLeft,
  ChevronRight,
  Calendar,
  Package,
  Wrench,
  User,
  MapPin,
  Clock,
  AlertCircle
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, getDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Equipment, EquipmentCheckout, EquipmentMaintenance } from '@/types/equipment'
import { getEquipment, getEquipmentCheckouts, getEquipmentMaintenance } from '@/app/actions/equipment'
import { cn } from '@/lib/utils'

interface CalendarEvent {
  id: string
  type: 'checkout' | 'maintenance' | 'available'
  title: string
  equipment: Equipment
  startDate: string
  endDate: string
  data?: EquipmentCheckout | EquipmentMaintenance
}

export function EquipmentCalendar() {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    loadData()
  }, [currentDate, selectedEquipment])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load equipment
      const equipmentResult = await getEquipment()
      if (equipmentResult.success && equipmentResult.data) {
        setEquipment(equipmentResult.data as unknown as Equipment[])
      }

      // Load checkouts and maintenance for the current month
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)

      const [checkoutsResult, maintenanceResult] = await Promise.all([
        getEquipmentCheckouts({
          from: monthStart.toISOString(),
          to: monthEnd.toISOString(),
          equipmentId: selectedEquipment !== 'all' ? selectedEquipment : undefined
        }),
        getEquipmentMaintenance({
          from: monthStart.toISOString(),
          to: monthEnd.toISOString(),
          equipmentId: selectedEquipment !== 'all' ? selectedEquipment : undefined
        })
      ])

      const calendarEvents: CalendarEvent[] = []

      // Process checkouts
      if (checkoutsResult.success && checkoutsResult.data) {
        const checkouts = checkoutsResult.data as unknown as EquipmentCheckout[]
        checkouts.forEach(checkout => {
          if (checkout.equipment) {
            calendarEvents.push({
              id: `checkout-${checkout.id}`,
              type: 'checkout',
              title: `${checkout.equipment.name} - 반출`,
              equipment: checkout.equipment,
              startDate: checkout.checkout_date,
              endDate: checkout.expected_return_date || checkout.checkout_date,
              data: checkout
            })
          }
        })
      }

      // Process maintenance
      if (maintenanceResult.success && maintenanceResult.data) {
        const maintenances = maintenanceResult.data as unknown as EquipmentMaintenance[]
        maintenances.forEach(maintenance => {
          if (maintenance.equipment) {
            const endDate = maintenance.completed_date || maintenance.scheduled_date
            calendarEvents.push({
              id: `maintenance-${maintenance.id}`,
              type: 'maintenance',
              title: `${maintenance.equipment.name} - 정비`,
              equipment: maintenance.equipment,
              startDate: maintenance.scheduled_date,
              endDate: endDate,
              data: maintenance
            })
          }
        })
      }

      setEvents(calendarEvents)
    } catch (error) {
      console.error('Failed to load calendar data:', error)
    } finally {
      setLoading(false)
    }
  }

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  })

  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const goToToday = () => setCurrentDate(new Date())

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return events.filter(event => {
      const start = format(new Date(event.startDate), 'yyyy-MM-dd')
      const end = format(new Date(event.endDate), 'yyyy-MM-dd')
      return dateStr >= start && dateStr <= end
    })
  }

  const getEventColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'checkout':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'maintenance':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getButtonSize = () => {
    if (touchMode === 'glove') return 'field'
    if (touchMode === 'precision') return 'compact'
    return 'standard'
  }

  const weekDays = ['일', '월', '화', '수', '목', '금', '토']
  const firstDayOfMonth = getDay(startOfMonth(currentDate))
  const emptyCells = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size={getButtonSize()}
              onClick={previousMonth}
              className="p-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className={cn(
              "font-semibold text-center min-w-[140px]",
              getFullTypographyClass('heading', 'lg', isLargeFont)
            )}>
              {format(currentDate, 'yyyy년 M월', { locale: ko })}
            </h2>
            <Button
              variant="outline"
              size={getButtonSize()}
              onClick={nextMonth}
              className="p-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="장비 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 장비</SelectItem>
                {equipment.map(eq => (
                  <SelectItem key={eq.id} value={eq.id}>
                    {eq.name} ({eq.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size={getButtonSize()}
              onClick={goToToday}
            >
              오늘
            </Button>
          </div>
        </div>

        {/* Calendar Legend */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-200 border border-blue-300"></div>
            <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>반출</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-200 border border-amber-300"></div>
            <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>정비</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-200 border border-green-300"></div>
            <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>사용가능</span>
          </div>
        </div>
      </Card>

      {/* Calendar Grid */}
      <Card className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className={getFullTypographyClass('body', 'sm', isLargeFont)}>캘린더 로딩 중...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Week Days Header */}
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day, index) => (
                <div
                  key={day}
                  className={cn(
                    "text-center font-medium py-2",
                    getFullTypographyClass('body', 'sm', isLargeFont),
                    index === 0 ? "text-red-600" : index === 6 ? "text-blue-600" : "text-gray-700"
                  )}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before month starts */}
              {emptyCells.map((_, index) => (
                <div key={`empty-${index}`} className="h-32"></div>
              ))}

              {/* Actual days */}
              {days.map((day) => {
                const dayEvents = getEventsForDate(day)
                const dayOfWeek = getDay(day)
                const isSelected = selectedDate && isSameDay(day, selectedDate)

                return (
                  <Card
                    key={day.toISOString()}
                    className={cn(
                      "h-32 p-2 cursor-pointer hover:shadow-md transition-shadow overflow-hidden",
                      !isSameMonth(day, currentDate) && "opacity-50",
                      isToday(day) && "ring-2 ring-primary",
                      isSelected && "bg-gray-50"
                    )}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={cn(
                        "font-medium",
                        getFullTypographyClass('body', 'sm', isLargeFont),
                        dayOfWeek === 0 ? "text-red-600" : dayOfWeek === 6 ? "text-blue-600" : "text-gray-900"
                      )}>
                        {format(day, 'd')}
                      </span>
                      {dayEvents.length > 0 && (
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          {dayEvents.length}
                        </Badge>
                      )}
                    </div>

                    {/* Events */}
                    <ScrollArea className="h-20">
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={cn(
                              "text-xs px-1.5 py-0.5 rounded border truncate",
                              getEventColor(event.type)
                            )}
                            title={event.title}
                          >
                            {event.type === 'checkout' ? (
                              <Package className="w-3 h-3 inline mr-1" />
                            ) : (
                              <Wrench className="w-3 h-3 inline mr-1" />
                            )}
                            {event.equipment.name}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card className="p-4">
          <h3 className={cn(
            "font-semibold mb-3",
            getFullTypographyClass('heading', 'base', isLargeFont)
          )}>
            {format(selectedDate, 'yyyy년 M월 d일', { locale: ko })} 일정
          </h3>

          {getEventsForDate(selectedDate).length === 0 ? (
            <p className={cn(
              "text-gray-500 text-center py-8",
              getFullTypographyClass('body', 'base', isLargeFont)
            )}>
              이 날짜에 예정된 일정이 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {getEventsForDate(selectedDate).map((event) => (
                <Card key={event.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {event.type === 'checkout' ? (
                          <Package className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Wrench className="h-5 w-5 text-amber-600" />
                        )}
                        <h4 className={cn(
                          "font-medium",
                          getFullTypographyClass('body', 'base', isLargeFont)
                        )}>
                          {event.equipment.name}
                        </h4>
                        <Badge variant="outline" className={getEventColor(event.type)}>
                          {event.type === 'checkout' ? '반출' : '정비'}
                        </Badge>
                      </div>

                      <div className={cn(
                        "space-y-1 text-gray-600",
                        getFullTypographyClass('body', 'sm', isLargeFont)
                      )}>
                        <p>코드: {event.equipment.code}</p>
                        {event.type === 'checkout' && event.data && 'borrower' in event.data && (
                          <>
                            <p className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              사용자: {event.data.borrower?.full_name}
                            </p>
                            <p className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              현장: {event.data.site?.name}
                            </p>
                            <p className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              반출일: {format(new Date(event.data.checkout_date), 'M월 d일')}
                            </p>
                            {event.data.expected_return_date && (
                              <p className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                반납예정: {format(new Date(event.data.expected_return_date), 'M월 d일')}
                              </p>
                            )}
                            {event.data.purpose && (
                              <p>용도: {event.data.purpose}</p>
                            )}
                          </>
                        )}
                        {event.type === 'maintenance' && event.data && 'maintenance_type' in event.data && (
                          <>
                            <p>유형: {event.data.maintenance_type === 'regular' ? '정기점검' : 
                                      event.data.maintenance_type === 'repair' ? '수리' : '긴급수리'}</p>
                            <p>상태: {event.data.status === 'scheduled' ? '예정' :
                                      event.data.status === 'in_progress' ? '진행중' : '완료'}</p>
                            {event.data.description && (
                              <p>설명: {event.data.description}</p>
                            )}
                            {event.data.cost && (
                              <p>비용: ₩{event.data.cost.toLocaleString()}</p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}