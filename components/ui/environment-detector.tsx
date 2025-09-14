'use client'


interface EnvironmentDetectorProps {
  className?: string
  showDetails?: boolean
}

export function EnvironmentDetector({ className, showDetails = false }: EnvironmentDetectorProps) {
  const { 
    environmentalCondition, 
    setEnvironmentalCondition,
    isAutoDetection,
    touchTargetSize,
    fontSizeMultiplier 
  } = useEnvironmental()
  
  const [detectedConditions, setDetectedConditions] = useState<string[]>([])
  const [confidence, setConfidence] = useState(0)

  useEffect(() => {
    if (!isAutoDetection) return

    const detectEnvironment = async () => {
      const conditions: string[] = []
      let confidenceScore = 0

      // Time-based detection
      const hour = new Date().getHours()
      const month = new Date().getMonth()

      if (hour >= 10 && hour <= 16) {
        conditions.push('밝은 햇빛 시간대')
        confidenceScore += 20
      }

      if (month >= 10 || month <= 2) {
        conditions.push('추운 계절')
        confidenceScore += 15
      }

      // Screen brightness detection (proxy for ambient light)
      if ('screen' in window && 'orientation' in window.screen) {
        conditions.push('모바일 환경 감지')
        confidenceScore += 10
      }

      // Network speed (construction sites often have poor connectivity)
      if ('connection' in navigator) {
        const connection = (navigator as unknown).connection
        if (connection && connection.effectiveType) {
          if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            conditions.push('낮은 네트워크 품질')
            confidenceScore += 25
          }
        }
      }

      // Device orientation changes (movement detection)
      let orientationChanges = 0
      const handleOrientationChange = () => {
        orientationChanges++
        if (orientationChanges > 3) {
          conditions.push('활발한 기기 움직임')
          confidenceScore += 15
        }
      }

      window.addEventListener('orientationchange', handleOrientationChange)

      // Ambient Light Sensor (if available)
      if ('AmbientLightSensor' in window) {
        try {
          const sensor = new (window as unknown).AmbientLightSensor()
          sensor.addEventListener('reading', () => {
            if (sensor.illuminance > 1000) {
              conditions.push('높은 조도 (>1000 lux)')
              confidenceScore += 30
              setEnvironmentalCondition('bright-sun')
            } else if (sensor.illuminance < 50) {
              conditions.push('낮은 조도 (<50 lux)')
              confidenceScore += 25
              setEnvironmentalCondition('dust')
            }
          })
          sensor.start()
        } catch (error) {
          conditions.push('조도 센서 접근 불가')
        }
      }

      // Battery level (outdoor work drains battery faster)
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as unknown).getBattery()
          if (battery.level < 0.3) {
            conditions.push('낮은 배터리 (< 30%)')
            confidenceScore += 20
          }
        } catch (error) {
          // Battery API not available
        }
      }

      // GPS accuracy (construction sites often have poor GPS)
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (position.coords.accuracy > 100) {
              conditions.push('낮은 GPS 정확도')
              confidenceScore += 20
            }
          },
          () => {
            conditions.push('GPS 접근 불가')
            confidenceScore += 10
          }
        )
      }

      setDetectedConditions(conditions)
      setConfidence(Math.min(confidenceScore, 100))

      // Auto-adjust environment based on detected conditions
      if (confidenceScore > 50) {
        if (conditions.some(c => c.includes('햇빛') || c.includes('조도'))) {
          setEnvironmentalCondition('bright-sun')
        } else if (conditions.some(c => c.includes('추운'))) {
          setEnvironmentalCondition('cold')
        } else if (conditions.some(c => c.includes('낮은 조도') || c.includes('먼지'))) {
          setEnvironmentalCondition('dust')
        }
      }

      return () => {
        window.removeEventListener('orientationchange', handleOrientationChange)
      }
    }

    const cleanup = detectEnvironment()
    return () => {
      if (cleanup instanceof Promise) {
        cleanup.then(fn => fn && fn())
      }
    }
  }, [isAutoDetection, setEnvironmentalCondition])

  const getConditionIcon = (condition: EnvironmentalCondition) => {
    switch (condition) {
      case 'bright-sun':
        return <Sun className="h-4 w-4 text-yellow-500" />
      case 'rain':
        return <Cloud className="h-4 w-4 text-blue-500" />
      case 'cold':
        return <Snowflake className="h-4 w-4 text-blue-300" />
      case 'dust':
        return <Wind className="h-4 w-4 text-orange-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getConditionLabel = (condition: EnvironmentalCondition) => {
    switch (condition) {
      case 'bright-sun':
        return '밝은 햇빛'
      case 'rain':
        return '비/습기'
      case 'cold':
        return '추위'
      case 'dust':
        return '먼지/저조도'
      default:
        return '정상'
    }
  }

  const getConditionColor = (condition: EnvironmentalCondition) => {
    switch (condition) {
      case 'bright-sun':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'rain':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'cold':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'dust':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  if (!showDetails && !isAutoDetection) return null

  return (
    <div className={cn('space-y-2', className)}>
      {/* Current Environment Status */}
      <div className="flex items-center gap-2">
        <div className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium',
          getConditionColor(environmentalCondition)
        )}>
          {getConditionIcon(environmentalCondition)}
          <span>{getConditionLabel(environmentalCondition)}</span>
          {isAutoDetection && (
            <span className="text-xs opacity-75">(자동)</span>
          )}
        </div>
        
        {confidence > 0 && (
          <div className="text-xs text-gray-500">
            신뢰도: {confidence}%
          </div>
        )}
      </div>

      {/* Adaptation Status */}
      {showDetails && (
        <div className="text-xs text-gray-600 space-y-1">
          <div>터치 대상 크기: {touchTargetSize}px</div>
          <div>글꼴 배율: {(fontSizeMultiplier * 100).toFixed(0)}%</div>
          
          {detectedConditions.length > 0 && (
            <div className="mt-2">
              <div className="font-medium text-gray-700 mb-1">감지된 조건:</div>
              <ul className="space-y-0.5">
                {detectedConditions.map((condition, index) => (
                  <li key={index} className="text-gray-600">
                    • {condition}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}