/**
 * External App Integration Utilities
 * Handles deep linking for Korean map applications with fallback mechanisms
 */

interface MapLocation {
  name: string
  address: string
  latitude?: number
  longitude?: number
}

interface AppLinkResult {
  success: boolean
  fallbackUrl?: string
  error?: string
}

// Platform detection utilities
export const Platform = {
  isIOS: () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream,
  isAndroid: () => /Android/.test(navigator.userAgent),
  isMobile: () => Platform.isIOS() || Platform.isAndroid(),
  isDesktop: () => !Platform.isMobile()
}

// Analytics tracking (can be replaced with actual analytics implementation)
const trackAppLaunch = (appName: string, success: boolean) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'external_app_launch', {
      app_name: appName,
      success: success,
      platform: Platform.isIOS() ? 'ios' : Platform.isAndroid() ? 'android' : 'web'
    })
  }
}

/**
 * T-Map Navigation
 * Korea's most popular navigation app
 */
export const TMap = {
  /**
   * Open T-Map with navigation to specified location
   */
  navigate: async (location: MapLocation): Promise<AppLinkResult> => {
    const encodedName = encodeURIComponent(location.name)
    const encodedAddress = encodeURIComponent(location.address)
    
    let deepLink = ''
    let webFallback = ''
    
    if (location.latitude && location.longitude) {
      // Use coordinates if available (more accurate)
      deepLink = `tmap://route?goalname=${encodedName}&goalx=${location.longitude}&goaly=${location.latitude}`
      webFallback = `https://tmap.co.kr/tmap2/mobile/route.jsp?name=${encodedName}&lon=${location.longitude}&lat=${location.latitude}`
    } else {
      // Use address-based navigation
      deepLink = `tmap://route?goalname=${encodedName}&goaladdress=${encodedAddress}`
      webFallback = `https://tmap.co.kr/tmap2/mobile/route.jsp?name=${encodedName}&address=${encodedAddress}`
    }
    
    if (Platform.isMobile()) {
      return launchAppWithFallback('T-Map', deepLink, webFallback, 500)
    } else {
      // Desktop - open web version directly
      window.open(webFallback, '_blank')
      trackAppLaunch('T-Map', true)
      return { success: true, fallbackUrl: webFallback }
    }
  },
  
  /**
   * Search for a location in T-Map
   */
  search: async (query: string): Promise<AppLinkResult> => {
    const encodedQuery = encodeURIComponent(query)
    const deepLink = `tmap://search?name=${encodedQuery}`
    const webFallback = `https://tmap.co.kr/tmap2/mobile/search.jsp?name=${encodedQuery}`
    
    if (Platform.isMobile()) {
      return launchAppWithFallback('T-Map', deepLink, webFallback, 500)
    } else {
      window.open(webFallback, '_blank')
      trackAppLaunch('T-Map', true)
      return { success: true, fallbackUrl: webFallback }
    }
  }
}

/**
 * Naver Map Navigation
 * Popular alternative to T-Map
 */
export const NaverMap = {
  navigate: async (location: MapLocation): Promise<AppLinkResult> => {
    const encodedName = encodeURIComponent(location.name)
    const encodedAddress = encodeURIComponent(location.address)
    
    let deepLink = ''
    let webFallback = ''
    
    if (location.latitude && location.longitude) {
      // Naver Map app URL scheme
      deepLink = `nmap://route/car?dlat=${location.latitude}&dlng=${location.longitude}&dname=${encodedName}`
      webFallback = `https://map.naver.com/v5/directions/-/-/-/${location.longitude},${location.latitude},${encodedName}`
    } else {
      // Address-based search
      deepLink = `nmap://search?query=${encodedAddress}`
      webFallback = `https://map.naver.com/v5/search/${encodedAddress}`
    }
    
    if (Platform.isMobile()) {
      return launchAppWithFallback('Naver Map', deepLink, webFallback, 500)
    } else {
      window.open(webFallback, '_blank')
      trackAppLaunch('Naver Map', true)
      return { success: true, fallbackUrl: webFallback }
    }
  },
  
  search: async (query: string): Promise<AppLinkResult> => {
    const encodedQuery = encodeURIComponent(query)
    const deepLink = `nmap://search?query=${encodedQuery}`
    const webFallback = `https://map.naver.com/v5/search/${encodedQuery}`
    
    if (Platform.isMobile()) {
      return launchAppWithFallback('Naver Map', deepLink, webFallback, 500)
    } else {
      window.open(webFallback, '_blank')
      trackAppLaunch('Naver Map', true)
      return { success: true, fallbackUrl: webFallback }
    }
  }
}

/**
 * Kakao Map Navigation
 * Another popular Korean map service
 */
export const KakaoMap = {
  navigate: async (location: MapLocation): Promise<AppLinkResult> => {
    const encodedName = encodeURIComponent(location.name)
    
    let deepLink = ''
    let webFallback = ''
    
    if (location.latitude && location.longitude) {
      // Kakao Map URL scheme
      deepLink = `kakaomap://route?ep=${location.latitude},${location.longitude}&by=CAR`
      webFallback = `https://map.kakao.com/link/to/${encodedName},${location.latitude},${location.longitude}`
    } else {
      // Search by name/address
      const encodedAddress = encodeURIComponent(location.address)
      deepLink = `kakaomap://search?q=${encodedAddress}`
      webFallback = `https://map.kakao.com/link/search/${encodedAddress}`
    }
    
    if (Platform.isMobile()) {
      return launchAppWithFallback('Kakao Map', deepLink, webFallback, 500)
    } else {
      window.open(webFallback, '_blank')
      trackAppLaunch('Kakao Map', true)
      return { success: true, fallbackUrl: webFallback }
    }
  },
  
  search: async (query: string): Promise<AppLinkResult> => {
    const encodedQuery = encodeURIComponent(query)
    const deepLink = `kakaomap://search?q=${encodedQuery}`
    const webFallback = `https://map.kakao.com/link/search/${encodedQuery}`
    
    if (Platform.isMobile()) {
      return launchAppWithFallback('Kakao Map', deepLink, webFallback, 500)
    } else {
      window.open(webFallback, '_blank')
      trackAppLaunch('Kakao Map', true)
      return { success: true, fallbackUrl: webFallback }
    }
  }
}

/**
 * Generic app launcher with fallback mechanism
 */
async function launchAppWithFallback(
  appName: string,
  deepLink: string,
  fallbackUrl: string,
  timeout: number = 500
): Promise<AppLinkResult> {
  return new Promise((resolve) => {
    let appOpened = false
    let fallbackTimer: NodeJS.Timeout
    
    // Listen for page visibility change (app switch)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        appOpened = true
        clearTimeout(fallbackTimer)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        trackAppLaunch(appName, true)
        resolve({ success: true })
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Try to open the app
    const startTime = Date.now()
    
    // Create invisible iframe for iOS (prevents page navigation)
    if (Platform.isIOS()) {
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = deepLink
      document.body.appendChild(iframe)
      
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 100)
    } else {
      // Android and other platforms
      window.location.href = deepLink
    }
    
    // Set up fallback timer
    fallbackTimer = setTimeout(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      
      // Check if enough time has passed (app might have opened)
      const elapsed = Date.now() - startTime
      if (!appOpened && elapsed < timeout + 100) {
        // App likely not installed, use fallback
        window.location.href = fallbackUrl
        trackAppLaunch(appName, false)
        resolve({ success: false, fallbackUrl })
      } else {
        // App probably opened
        trackAppLaunch(appName, true)
        resolve({ success: true })
      }
    }, timeout)
  })
}

/**
 * Unified map app selector
 * Provides user choice between available map apps
 */
export interface MapAppOption {
  id: 'tmap' | 'naver' | 'kakao'
  name: string
  icon?: string
  available: boolean
}

export function getAvailableMapApps(): MapAppOption[] {
  // In a real implementation, you might check localStorage for user preferences
  // or use feature detection to see which apps are available
  return [
    {
      id: 'tmap',
      name: 'T-Map',
      available: true
    },
    {
      id: 'naver',
      name: 'Naver Map',
      available: true
    },
    {
      id: 'kakao',
      name: 'Kakao Map',
      available: true
    }
  ]
}

export async function navigateWithMapApp(
  appId: 'tmap' | 'naver' | 'kakao',
  location: MapLocation
): Promise<AppLinkResult> {
  switch (appId) {
    case 'tmap':
      return TMap.navigate(location)
    case 'naver':
      return NaverMap.navigate(location)
    case 'kakao':
      return KakaoMap.navigate(location)
    default:
      return { success: false, error: 'Unknown map app' }
  }
}

// Phone call utilities
export function makePhoneCall(phoneNumber: string): void {
  // Remove all non-numeric characters except +
  const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '')
  window.location.href = `tel:${cleanNumber}`
  trackAppLaunch('Phone', true)
}

// Email utilities
export function sendEmail(email: string, subject?: string, body?: string): void {
  let mailtoUrl = `mailto:${email}`
  const params = []
  
  if (subject) {
    params.push(`subject=${encodeURIComponent(subject)}`)
  }
  
  if (body) {
    params.push(`body=${encodeURIComponent(body)}`)
  }
  
  if (params.length > 0) {
    mailtoUrl += `?${params.join('&')}`
  }
  
  window.location.href = mailtoUrl
  trackAppLaunch('Email', true)
}

// SMS utilities
export function sendSMS(phoneNumber: string, message?: string): void {
  const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '')
  let smsUrl = `sms:${cleanNumber}`
  
  if (message && Platform.isIOS()) {
    // iOS uses & for message separator
    smsUrl += `&body=${encodeURIComponent(message)}`
  } else if (message && Platform.isAndroid()) {
    // Android uses ? for message separator
    smsUrl += `?body=${encodeURIComponent(message)}`
  }
  
  window.location.href = smsUrl
  trackAppLaunch('SMS', true)
}