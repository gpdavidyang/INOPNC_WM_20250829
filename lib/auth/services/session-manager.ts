/**
 * Session Manager Service
 *
 * Centralized session management with caching and validation.
 * Provides a single source of truth for session state across the application.
 */

import { Session, User, SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { cookies } from 'next/headers'

export interface ISessionManager {
  getSession(): Promise<Session | null>
  refreshSession(): Promise<Session | null>
  clearSession(): Promise<void>
  validateSession(session: Session): boolean
  getUserProfile(userId: string): Promise<any>
}

export class SessionManager implements ISessionManager {
  private static instance: SessionManager
  private sessionCache: Session | null = null
  private cacheExpiry: number = 0
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
  private supabase: SupabaseClient
  private profileCache: Map<string, { data: any; expiry: number }> = new Map()

  private constructor() {
    // Initialize with client-side Supabase for browser context
    if (typeof window !== 'undefined') {
      this.supabase = createClient()
    } else {
      // Server-side initialization will be done per-request
      this.supabase = null as any
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  /**
   * Set Supabase client (for server-side usage)
   */
  setSupabaseClient(client: SupabaseClient): void {
    this.supabase = client
  }

  /**
   * Get current session with caching
   */
  async getSession(): Promise<Session | null> {
    try {
      // Check cache first (client-side only)
      if (typeof window !== 'undefined' && this.sessionCache && Date.now() < this.cacheExpiry) {
        console.log('[SessionManager] Returning cached session')
        return this.sessionCache
      }

      // Ensure we have a Supabase client
      if (!this.supabase) {
        console.error('[SessionManager] No Supabase client available')
        return null
      }

      // Fetch fresh session
      const {
        data: { session },
        error,
      } = await this.supabase.auth.getSession()

      if (error) {
        console.error('[SessionManager] Error fetching session:', error.message)
        return null
      }

      // Validate and cache session (client-side only)
      if (session && this.validateSession(session)) {
        if (typeof window !== 'undefined') {
          this.sessionCache = session
          this.cacheExpiry = Date.now() + this.CACHE_DURATION
          console.log(
            '[SessionManager] Session cached until:',
            new Date(this.cacheExpiry).toISOString()
          )
        }
        return session
      }

      // Invalid or no session
      if (typeof window !== 'undefined') {
        this.sessionCache = null
        this.cacheExpiry = 0
      }

      return null
    } catch (error) {
      console.error('[SessionManager] Unexpected error in getSession:', error)
      return null
    }
  }

  /**
   * Refresh the current session
   */
  async refreshSession(): Promise<Session | null> {
    try {
      if (!this.supabase) {
        console.error('[SessionManager] No Supabase client available')
        return null
      }

      console.log('[SessionManager] Refreshing session...')
      const {
        data: { session },
        error,
      } = await this.supabase.auth.refreshSession()

      if (error) {
        console.error('[SessionManager] Error refreshing session:', error.message)
        await this.clearSession()
        return null
      }

      if (!session) {
        console.log('[SessionManager] No session returned from refresh')
        await this.clearSession()
        return null
      }

      // Update cache (client-side only)
      if (typeof window !== 'undefined') {
        this.sessionCache = session
        this.cacheExpiry = Date.now() + this.CACHE_DURATION
        console.log('[SessionManager] Session refreshed and cached')
      }

      return session
    } catch (error) {
      console.error('[SessionManager] Unexpected error in refreshSession:', error)
      await this.clearSession()
      return null
    }
  }

  /**
   * Clear session and cache
   */
  async clearSession(): Promise<void> {
    try {
      console.log('[SessionManager] Clearing session and cache')

      // Clear cache
      if (typeof window !== 'undefined') {
        this.sessionCache = null
        this.cacheExpiry = 0
        this.profileCache.clear()
      }

      // Sign out from Supabase
      if (this.supabase) {
        await this.supabase.auth.signOut()
      }

      // Clear cookies (server-side)
      if (typeof window === 'undefined') {
        try {
          const cookieStore = cookies()
          cookieStore.delete('sb-access-token')
          cookieStore.delete('sb-refresh-token')
          cookieStore.delete('user-role')
        } catch (error) {
          // Cookies API might not be available in all contexts
          console.log('[SessionManager] Could not clear cookies:', error)
        }
      }

      console.log('[SessionManager] Session cleared successfully')
    } catch (error) {
      console.error('[SessionManager] Error clearing session:', error)
    }
  }

  /**
   * Validate session token expiry and structure
   */
  validateSession(session: Session): boolean {
    if (!session || !session.access_token || !session.user) {
      console.log('[SessionManager] Invalid session structure')
      return false
    }

    // Check token expiry
    const tokenExp = session.expires_at || 0
    const now = Math.floor(Date.now() / 1000)
    const isExpired = tokenExp <= now

    if (isExpired) {
      console.log('[SessionManager] Session token expired:', {
        expires_at: new Date(tokenExp * 1000).toISOString(),
        now: new Date(now * 1000).toISOString(),
      })
      return false
    }

    // Check if token is about to expire (within 1 minute)
    const expiringInMinutes = (tokenExp - now) / 60
    if (expiringInMinutes < 1) {
      console.log(
        '[SessionManager] Session expiring soon:',
        expiringInMinutes.toFixed(2),
        'minutes'
      )
    }

    return true
  }

  /**
   * Get user profile with caching
   */
  async getUserProfile(userId: string): Promise<any> {
    try {
      // Check cache first
      const cached = this.profileCache.get(userId)
      if (cached && Date.now() < cached.expiry) {
        console.log('[SessionManager] Returning cached profile for user:', userId)
        return cached.data
      }

      if (!this.supabase) {
        console.error('[SessionManager] No Supabase client available')
        return null
      }

      // Fetch fresh profile
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('[SessionManager] Error fetching profile:', error.message)
        return null
      }

      // Cache the profile
      if (profile) {
        this.profileCache.set(userId, {
          data: profile,
          expiry: Date.now() + this.CACHE_DURATION,
        })
        console.log('[SessionManager] Profile cached for user:', userId)
      }

      return profile
    } catch (error) {
      console.error('[SessionManager] Unexpected error in getUserProfile:', error)
      return null
    }
  }

  /**
   * Clear cache for a specific user
   */
  clearUserCache(userId: string): void {
    this.profileCache.delete(userId)
    console.log('[SessionManager] Cleared cache for user:', userId)
  }

  /**
   * Get cache statistics (for debugging)
   */
  getCacheStats(): {
    sessionCached: boolean
    sessionExpiry: Date | null
    profilesCached: number
  } {
    return {
      sessionCached: !!this.sessionCache && Date.now() < this.cacheExpiry,
      sessionExpiry: this.cacheExpiry ? new Date(this.cacheExpiry) : null,
      profilesCached: this.profileCache.size,
    }
  }
}

// Export singleton instance for convenience
export const sessionManager = SessionManager.getInstance()
