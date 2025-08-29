'use client'

import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { UserIcon } from 'lucide-react'

interface Worker {
  id: string
  name: string
  role: string
  present?: boolean
}

interface CompactWorkerListProps {
  workers: Worker[]
  onAttendanceChange?: (workerId: string, present: boolean) => void
  className?: string
}

/**
 * 컴팩트 작업자 리스트 - 고밀도 출석 관리
 * 화면에 10-12명 표시 (기존 4-5명)
 */
export function CompactWorkerList({
  workers,
  onAttendanceChange,
  className
}: CompactWorkerListProps) {
  return (
    <div className={cn("bg-white rounded-md shadow-sm", className)}>
      {/* 헤더 - 컴팩트 */}
      <div className="px-3 py-2 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            작업자 출석 ({workers.filter(w => w.present).length}/{workers.length})
          </h3>
          <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            전체선택
          </button>
        </div>
      </div>

      {/* 작업자 리스트 - 고밀도 */}
      <div className="divide-y divide-gray-100">
        {workers.map((worker, index) => (
          <div
            key={worker.id}
            className={cn(
              "flex items-center px-3 py-2 hover:bg-gray-50",
              "transition-colors duration-150",
              // 터치 영역 확보하면서 시각적으로는 컴팩트
              "relative min-h-[44px]",
              index === 0 && "pt-2.5",
              index === workers.length - 1 && "pb-2.5"
            )}
          >
            {/* 아바타 + 정보 */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="text-xs bg-gray-100">
                  {worker.name.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {worker.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {worker.role}
                </p>
              </div>
            </div>

            {/* 출석 스위치 - 터치 영역 확대 */}
            <div className="relative">
              <Switch
                checked={worker.present}
                onCheckedChange={(checked) => 
                  onAttendanceChange?.(worker.id, checked)
                }
                className="data-[state=checked]:bg-green-600"
                aria-label={`${worker.name} 출석`}
              />
              {/* 터치 영역 확대를 위한 투명 오버레이 */}
              <span className="absolute -inset-2" />
            </div>
          </div>
        ))}
      </div>

      {/* 푸터 - 요약 정보 */}
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">
            출석: <span className="font-medium text-gray-900">
              {workers.filter(w => w.present).length}명
            </span>
          </span>
          <span className="text-gray-600">
            결석: <span className="font-medium text-gray-900">
              {workers.filter(w => !w.present).length}명
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}