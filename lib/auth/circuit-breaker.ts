/**
 * Circuit Breaker Pattern for Authentication Redirect Loop Prevention
 *
 * This class prevents infinite redirect loops by tracking redirect attempts
 * and breaking the circuit when too many redirects occur in a short time.
 */
export class AuthCircuitBreaker {
  private static readonly MAX_REDIRECTS = 3
  private static readonly RESET_TIME = 5000 // 5 seconds
  private static readonly STORAGE_KEY = 'auth_redirects'

  /**
   * Check if a redirect should be allowed
   * @param path The path being redirected to
   * @returns true if redirect is allowed, false if circuit should break
   */
  static checkRedirect(path: string): boolean {
    if (typeof window === 'undefined') return true

    const now = Date.now()
    const redirects = this.getRedirects()

    // Clean old redirects
    const recent = redirects.filter((r: any) => now - r.time < this.RESET_TIME)

    // Check if we've hit the limit
    if (recent.length >= this.MAX_REDIRECTS) {
      console.error('[AuthCircuitBreaker] Redirect loop detected!', {
        path,
        recentRedirects: recent.length,
        maxAllowed: this.MAX_REDIRECTS,
      })

      // Clear the redirects to allow retry after manual intervention
      this.reset()
      return false // Break the circuit
    }

    // Add new redirect
    recent.push({ path, time: now })
    this.saveRedirects(recent)

    return true
  }

  /**
   * Reset the circuit breaker (clear all redirect history)
   */
  static reset(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.STORAGE_KEY)
      console.log('[AuthCircuitBreaker] Circuit breaker reset')
    }
  }

  /**
   * Get the current redirect count
   */
  static getRedirectCount(): number {
    const redirects = this.getRedirects()
    const now = Date.now()
    return redirects.filter((r: any) => now - r.time < this.RESET_TIME).length
  }

  /**
   * Check if circuit is currently broken
   */
  static isCircuitBroken(): boolean {
    return this.getRedirectCount() >= this.MAX_REDIRECTS
  }

  private static getRedirects(): any[] {
    if (typeof window === 'undefined') return []

    try {
      const data = sessionStorage.getItem(this.STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('[AuthCircuitBreaker] Failed to parse redirects:', error)
      return []
    }
  }

  private static saveRedirects(redirects: any[]): void {
    if (typeof window === 'undefined') return

    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(redirects))
    } catch (error) {
      console.error('[AuthCircuitBreaker] Failed to save redirects:', error)
    }
  }
}

/**
 * Hook for using circuit breaker in React components
 */
export function useCircuitBreaker() {
  const checkRedirect = (path: string) => AuthCircuitBreaker.checkRedirect(path)
  const reset = () => AuthCircuitBreaker.reset()
  const isCircuitBroken = () => AuthCircuitBreaker.isCircuitBroken()
  const redirectCount = () => AuthCircuitBreaker.getRedirectCount()

  return {
    checkRedirect,
    reset,
    isCircuitBroken,
    redirectCount,
  }
}
