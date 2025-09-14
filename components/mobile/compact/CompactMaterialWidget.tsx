'use client'


interface MaterialData {
  name: string
  code: string
  current: number
  used: number
  unit: string
  status: 'normal' | 'low' | 'critical'
  trend?: 'up' | 'down' | 'stable'
}

interface CompactMaterialWidgetProps {
  materials: MaterialData[]
  className?: string
  onMaterialClick?: (material: MaterialData) => void
}

/**
 * 컴팩트 자재 현황 위젯 - 한눈에 보는 자재 상태
 * 2x2 그리드로 4개 자재 동시 표시
 */
export function CompactMaterialWidget({
  materials,
  className,
  onMaterialClick
}: CompactMaterialWidgetProps) {
  const getStatusColor = (status: MaterialData['status']) => {
    switch (status) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-700'
      case 'low': return 'bg-orange-50 border-orange-200 text-orange-700'
      default: return 'bg-blue-50 border-blue-200 text-blue-700'
    }
  }

  const getStatusIcon = (status: MaterialData['status']) => {
    if (status === 'critical') {
      return <AlertCircleIcon className="w-3 h-3 text-red-500" />
    }
    return <PackageIcon className="w-3 h-3 text-blue-500" />
  }

  const getTrendIcon = (trend?: MaterialData['trend']) => {
    if (trend === 'up') {
      return <TrendingUpIcon className="w-3 h-3 text-green-500" />
    }
    if (trend === 'down') {
      return <TrendingDownIcon className="w-3 h-3 text-red-500" />
    }
    return null
  }

  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      {materials.slice(0, 4).map((material: unknown) => (
        <button
          key={material.code}
          onClick={() => onMaterialClick?.(material)}
          className={cn(
            "rounded-md border p-2.5 text-left",
            "transition-all duration-200",
            "hover:shadow-md active:scale-[0.98]",
            getStatusColor(material.status)
          )}
        >
          {/* 헤더 라인 */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium truncate flex-1">
              {material.name}
            </span>
            <div className="flex items-center gap-1">
              {getTrendIcon(material.trend)}
              {getStatusIcon(material.status)}
            </div>
          </div>

          {/* 현재 수량 - 큰 폰트 */}
          <p className="text-lg font-bold mb-0.5">
            {material.current.toLocaleString()}
            <span className="text-xs font-normal ml-0.5">
              {material.unit}
            </span>
          </p>

          {/* 사용량 정보 - 작은 폰트 */}
          <div className="flex items-center justify-between text-xs opacity-80">
            <span>사용: {material.used.toLocaleString()}</span>
            {material.status === 'low' && (
              <span className="font-medium">재고부족</span>
            )}
            {material.status === 'critical' && (
              <span className="font-medium">긴급</span>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

/**
 * NPC-1000 전용 컴팩트 위젯
 */
export function CompactNPCWidget({
  incoming,
  used,
  remaining,
  date,
  className
}: {
  incoming: number
  used: number
  remaining: number
  date: string
  className?: string
}) {
  const usageRate = (used / (incoming + used)) * 100

  return (
    <div className={cn(
      "bg-gradient-to-br from-blue-50 to-blue-100",
      "rounded-md border border-blue-200 p-3",
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-blue-900">NPC-1000</h4>
        <span className="text-xs text-blue-600">
          {new Date(date).toLocaleDateString('ko-KR', { 
            month: 'numeric', 
            day: 'numeric' 
          })}
        </span>
      </div>

      {/* 수량 정보 - 컴팩트 그리드 */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-blue-600">입고</p>
          <p className="text-sm font-bold text-blue-900">
            {incoming.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-blue-600">사용</p>
          <p className="text-sm font-bold text-blue-900">
            {used.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-blue-600">잔량</p>
          <p className="text-sm font-bold text-blue-900">
            {remaining.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 사용률 바 */}
      <div className="mt-2">
        <div className="h-1.5 bg-blue-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${usageRate}%` }}
          />
        </div>
        <p className="text-xs text-blue-600 mt-1 text-center">
          사용률 {usageRate.toFixed(0)}%
        </p>
      </div>
    </div>
  )
}