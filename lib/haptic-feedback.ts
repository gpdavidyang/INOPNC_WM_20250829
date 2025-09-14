'use client'

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection'

interface HapticOptions {
  duration?: number
  intensity?: number
  pattern?: 'single' | 'double' | 'triple' | 'long'
}

class HapticFeedbackManager {
  private isSupported: boolean = false
  private vibrationAPI: unknown = null

  constructor() {
    if (typeof window !== 'undefined') {
      // Check for vibration API support
      this.vibrationAPI = navigator.vibrate || 
                         (navigator as unknown).webkitVibrate || 
                         (navigator as unknown).mozVibrate || 
                         (navigator as unknown).msVibrate

      this.isSupported = !!this.vibrationAPI && 'vibrate' in navigator

      // Check for Web Vibration API
      if (!this.isSupported && 'Vibration' in window) {
        this.isSupported = true
      }
    }
  }

  /**
   * Check if haptic feedback is supported on this device
   */
  isHapticSupported(): boolean {
    return this.isSupported
  }

  /**
   * Provide haptic feedback based on interaction type
   */
  async feedback(pattern: HapticPattern, options: HapticOptions = {}): Promise<void> {
    if (!this.isSupported) {
      console.log(`Haptic feedback not supported. Pattern: ${pattern}`)
      return
    }

    try {
      // Get vibration pattern based on feedback type
      const vibrationPattern = this.getVibrationPattern(pattern, options)
      
      if (vibrationPattern) {
        if (navigator.vibrate) {
          navigator.vibrate(vibrationPattern)
        } else if (this.vibrationAPI) {
          this.vibrationAPI.call(navigator, vibrationPattern)
        }
      }

      // For devices with more advanced haptic feedback (iOS Safari, some Android browsers)
      if ('haptic' in navigator) {
        await this.advancedHapticFeedback(pattern, options)
      }

    } catch (error) {
      console.warn('Haptic feedback failed:', error)
    }
  }

  /**
   * Get vibration pattern array based on haptic pattern type
   */
  private getVibrationPattern(pattern: HapticPattern, options: HapticOptions): number[] {
    const { duration = 100, pattern: repeatPattern = 'single' } = options

    const basePatterns: Record<HapticPattern, number[]> = {
      light: [50],
      medium: [100],
      heavy: [200],
      success: [50, 50, 50],
      warning: [100, 100, 100],
      error: [200, 100, 200],
      selection: [25]
    }

    let basePattern = basePatterns[pattern] || [duration]

    // Apply repeat pattern
    switch (repeatPattern) {
      case 'double':
        return [...basePattern, 100, ...basePattern]
      case 'triple':
        return [...basePattern, 100, ...basePattern, 100, ...basePattern]
      case 'long':
        return basePattern.map(d => d * 2)
      default:
        return basePattern
    }
  }

  /**
   * Advanced haptic feedback for supporting devices
   */
  private async advancedHapticFeedback(pattern: HapticPattern, options: HapticOptions): Promise<void> {
    // For iOS Safari and supported browsers
    if ('Taptic' in window) {
      const taptic = (window as unknown).Taptic
      
      switch (pattern) {
        case 'light':
        case 'selection':
          taptic.selection()
          break
        case 'medium':
          taptic.notification('warning')
          break
        case 'heavy':
        case 'error':
          taptic.notification('error')
          break
        case 'success':
          taptic.notification('success')
          break
        case 'warning':
          taptic.impact('medium')
          break
      }
    }

    // For newer Android browsers with advanced vibration
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      try {
        // Some Android devices support intensity control
        const vibrationEffect = {
          pattern: this.getVibrationPattern(pattern, options),
          intensity: options.intensity || this.getDefaultIntensity(pattern)
        }
        
        if ('createEffect' in navigator) {
          const effect = (navigator as unknown).createEffect(vibrationEffect)
          await effect.play()
        }
      } catch (error) {
        // Fallback to standard vibration
        console.log('Advanced haptic fallback to standard vibration')
      }
    }
  }

  /**
   * Get default intensity for different patterns
   */
  private getDefaultIntensity(pattern: HapticPattern): number {
    switch (pattern) {
      case 'light':
      case 'selection':
        return 0.3
      case 'medium':
      case 'warning':
        return 0.6
      case 'heavy':
      case 'error':
      case 'success':
        return 1.0
      default:
        return 0.5
    }
  }

  /**
   * Provide contextual haptic feedback for construction work
   */
  async constructionFeedback(action: 'button-press' | 'form-submit' | 'error' | 'success' | 'navigation' | 'alert'): Promise<void> {
    switch (action) {
      case 'button-press':
        await this.feedback('light', { pattern: 'single' })
        break
      case 'form-submit':
        await this.feedback('medium', { pattern: 'double' })
        break
      case 'error':
        await this.feedback('error', { pattern: 'triple' })
        break
      case 'success':
        await this.feedback('success', { pattern: 'double' })
        break
      case 'navigation':
        await this.feedback('selection')
        break
      case 'alert':
        await this.feedback('warning', { pattern: 'long' })
        break
    }
  }

  /**
   * Test haptic feedback functionality
   */
  async test(): Promise<void> {
    console.log('Testing haptic feedback...')
    console.log('Supported:', this.isSupported)
    
    if (this.isSupported) {
      await this.feedback('light')
      setTimeout(() => this.feedback('medium'), 300)
      setTimeout(() => this.feedback('heavy'), 600)
      setTimeout(() => this.feedback('success'), 900)
    }
  }
}

// Create singleton instance
const hapticManager = new HapticFeedbackManager()

// Export convenient functions
export const haptic = {
  feedback: (pattern: HapticPattern, options?: HapticOptions) => 
    hapticManager.feedback(pattern, options),
  
  construction: (action: 'button-press' | 'form-submit' | 'error' | 'success' | 'navigation' | 'alert') =>
    hapticManager.constructionFeedback(action),
  
  isSupported: () => hapticManager.isHapticSupported(),
  
  test: () => hapticManager.test()
}

// React hook for haptic feedback
export function useHapticFeedback() {
  return {
    haptic,
    isSupported: haptic.isSupported(),
    
    // Convenient methods for common UI interactions
    onButtonPress: () => haptic.construction('button-press'),
    onFormSubmit: () => haptic.construction('form-submit'),
    onError: () => haptic.construction('error'),
    onSuccess: () => haptic.construction('success'),
    onNavigate: () => haptic.construction('navigation'),
    onAlert: () => haptic.construction('alert'),
  }
}

export default hapticManager