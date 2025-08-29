'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type InteractionMode = 'precision' | 'glove' | 'auto'
export type EnvironmentalCondition = 'normal' | 'rain' | 'bright-sun' | 'dust' | 'cold'

interface EnvironmentalContextType {
  // Interaction modes
  interactionMode: InteractionMode
  setInteractionMode: (mode: InteractionMode) => void
  
  // Environmental conditions
  environmentalCondition: EnvironmentalCondition
  setEnvironmentalCondition: (condition: EnvironmentalCondition) => void
  
  // Auto-detection settings
  isAutoDetection: boolean
  setAutoDetection: (enabled: boolean) => void
  
  // Computed properties
  isGloveMode: boolean
  isPrecisionMode: boolean
  touchTargetSize: number
  fontSizeMultiplier: number
}

const EnvironmentalContext = createContext<EnvironmentalContextType | undefined>(undefined)

interface EnvironmentalProviderProps {
  children: ReactNode
}

export function EnvironmentalProvider({ children }: EnvironmentalProviderProps) {
  const [interactionMode, setInteractionModeState] = useState<InteractionMode>('auto')
  const [environmentalCondition, setEnvironmentalCondition] = useState<EnvironmentalCondition>('normal')
  const [isAutoDetection, setIsAutoDetection] = useState(true)

  // Auto-detect interaction mode based on environmental conditions
  useEffect(() => {
    if (!isAutoDetection || interactionMode !== 'auto') return

    const detectInteractionMode = (): InteractionMode => {
      // Detect based on touch patterns, screen size, and time
      const isMobile = window.innerWidth < 768
      const hour = new Date().getHours()
      
      // Construction work hours typically require gloves
      const isWorkingHours = hour >= 6 && hour <= 18
      
      // Cold weather conditions (winter months)
      const month = new Date().getMonth()
      const isColdSeason = month >= 10 || month <= 2
      
      // Environmental conditions that suggest glove use
      const needsGloves = environmentalCondition === 'cold' || 
                         environmentalCondition === 'rain' ||
                         (isWorkingHours && isColdSeason)
      
      if (needsGloves) {
        return 'glove'
      }
      
      // Mobile devices or precise tasks suggest precision mode
      if (isMobile || environmentalCondition === 'normal') {
        return 'precision'
      }
      
      return 'glove' // Default to glove for construction safety
    }

    const detectedMode = detectInteractionMode()
    if (detectedMode !== interactionMode) {
      setInteractionModeState(detectedMode)
    }
  }, [environmentalCondition, isAutoDetection, interactionMode])

  // Auto-detect environmental conditions
  useEffect(() => {
    if (!isAutoDetection) return

    const detectEnvironmentalConditions = () => {
      const hour = new Date().getHours()
      const month = new Date().getMonth()
      
      // Bright sun detection (peak hours)
      if (hour >= 10 && hour <= 16) {
        return 'bright-sun'
      }
      
      // Cold season detection
      if (month >= 11 || month <= 1) {
        return 'cold'
      }
      
      // Check for ambient light sensor if available
      if ('AmbientLightSensor' in window) {
        try {
          const sensor = new (window as any).AmbientLightSensor()
          sensor.addEventListener('reading', () => {
            if (sensor.illuminance > 1000) {
              setEnvironmentalCondition('bright-sun')
            } else if (sensor.illuminance < 50) {
              setEnvironmentalCondition('dust')
            }
          })
          sensor.start()
        } catch (error) {
          console.log('Ambient light sensor not available')
        }
      }
      
      return 'normal'
    }

    const condition = detectEnvironmentalConditions()
    if (condition !== environmentalCondition) {
      setEnvironmentalCondition(condition)
    }
  }, [isAutoDetection, environmentalCondition])

  // Load saved preferences
  useEffect(() => {
    const savedInteractionMode = localStorage.getItem('inopnc-interaction-mode') as InteractionMode
    const savedEnvironmentalCondition = localStorage.getItem('inopnc-environmental-condition') as EnvironmentalCondition
    const savedAutoDetection = localStorage.getItem('inopnc-environmental-auto')

    if (savedInteractionMode) {
      setInteractionModeState(savedInteractionMode)
    }
    
    if (savedEnvironmentalCondition) {
      setEnvironmentalCondition(savedEnvironmentalCondition)
    }
    
    if (savedAutoDetection !== null) {
      setIsAutoDetection(savedAutoDetection === 'true')
    }
  }, [])

  // Save preferences when changed
  useEffect(() => {
    localStorage.setItem('inopnc-interaction-mode', interactionMode)
  }, [interactionMode])

  useEffect(() => {
    localStorage.setItem('inopnc-environmental-condition', environmentalCondition)
  }, [environmentalCondition])

  useEffect(() => {
    localStorage.setItem('inopnc-environmental-auto', isAutoDetection.toString())
  }, [isAutoDetection])

  const setInteractionMode = (mode: InteractionMode) => {
    setInteractionModeState(mode)
    if (isAutoDetection && mode !== 'auto') {
      setIsAutoDetection(false)
    }
  }

  const setAutoDetection = (enabled: boolean) => {
    setIsAutoDetection(enabled)
    if (enabled) {
      setInteractionModeState('auto')
    }
  }

  // Computed properties
  const resolvedMode = interactionMode === 'auto' ? 'glove' : interactionMode
  const isGloveMode = resolvedMode === 'glove'
  const isPrecisionMode = resolvedMode === 'precision'
  
  // Calculate touch target sizes based on mode and conditions
  const touchTargetSize = (() => {
    let baseSize = 44 // WCAG minimum
    
    if (isGloveMode) {
      baseSize = 56 // Larger for gloves
    }
    
    // Environmental adjustments
    switch (environmentalCondition) {
      case 'rain':
      case 'cold':
        return baseSize + 8 // Extra size for difficult conditions
      case 'bright-sun':
        return baseSize + 4 // Slightly larger for sun glare
      case 'dust':
        return baseSize + 4 // Compensate for reduced visibility
      default:
        return baseSize
    }
  })()

  // Font size multiplier based on conditions
  const fontSizeMultiplier = (() => {
    let multiplier = 1.0
    
    if (isGloveMode) {
      multiplier = 1.1
    }
    
    switch (environmentalCondition) {
      case 'bright-sun':
      case 'dust':
        return multiplier * 1.15 // Larger text for visibility
      case 'rain':
        return multiplier * 1.1 // Slightly larger for rain
      default:
        return multiplier
    }
  })()

  // Apply CSS custom properties for dynamic sizing
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--touch-target-size', `${touchTargetSize}px`)
    root.style.setProperty('--font-size-multiplier', fontSizeMultiplier.toString())
    
    // Add mode classes
    root.classList.remove('precision-mode', 'glove-mode')
    root.classList.add(`${resolvedMode}-mode`)
    
    // Add environmental condition classes
    root.classList.remove('env-normal', 'env-rain', 'env-bright-sun', 'env-dust', 'env-cold')
    root.classList.add(`env-${environmentalCondition}`)
  }, [touchTargetSize, fontSizeMultiplier, resolvedMode, environmentalCondition])

  return (
    <EnvironmentalContext.Provider
      value={{
        interactionMode,
        setInteractionMode,
        environmentalCondition,
        setEnvironmentalCondition,
        isAutoDetection,
        setAutoDetection,
        isGloveMode,
        isPrecisionMode,
        touchTargetSize,
        fontSizeMultiplier,
      }}
    >
      {children}
    </EnvironmentalContext.Provider>
  )
}

export function useEnvironmental() {
  const context = useContext(EnvironmentalContext)
  if (context === undefined) {
    throw new Error('useEnvironmental must be used within an EnvironmentalProvider')
  }
  return context
}

// Utility function to get environment-optimized classes
export function getEnvironmentalClass(
  baseClass: string,
  gloveClass: string,
  precisionClass?: string
): string {
  return `${baseClass} glove-mode:${gloveClass} ${precisionClass ? `precision-mode:${precisionClass}` : ''}`
}

// Helper to get optimal touch target size
export function getOptimalTouchTarget(baseSize: number = 44): string {
  return `max(${baseSize}px, var(--touch-target-size, ${baseSize}px))`
}