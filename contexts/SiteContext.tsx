'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { SiteInfo, SiteSearchResult, SiteSearchFilters } from '@/types/site-info'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

interface SiteContextValue {
  // Current site state
  currentSite: SiteInfo | null
  isLoading: boolean
  error: Error | null
  
  // Site management actions
  refreshCurrentSite: () => Promise<void>
  switchSite: (siteId: string) => Promise<void>
  
  // Search functionality
  searchSites: (filters: SiteSearchFilters) => Promise<SiteSearchResult[]>
  
  // Cache management
  clearCache: () => void
}

const SiteContext = createContext<SiteContextValue | undefined>(undefined)

// Cache duration in milliseconds
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const SITE_CACHE_KEY = 'site-info-cache'
const CACHE_TIMESTAMP_KEY = 'site-info-cache-timestamp'

interface CachedSiteData {
  site: SiteInfo
  timestamp: number
}

export function SiteProvider({ children }: { children: ReactNode }) {
  const [currentSite, setCurrentSite] = useState<SiteInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  // Load cached site data
  const loadCachedSite = (): SiteInfo | null => {
    if (typeof window === 'undefined') return null
    
    try {
      const cached = localStorage.getItem(SITE_CACHE_KEY)
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
      
      if (cached && timestamp) {
        const cacheTime = parseInt(timestamp, 10)
        const now = Date.now()
        
        // Check if cache is still valid
        if (now - cacheTime < CACHE_DURATION) {
          const data: CachedSiteData = JSON.parse(cached)
          return data.site
        }
      }
    } catch (err) {
      console.error('Error loading cached site:', err)
    }
    
    return null
  }

  // Save site data to cache
  const saveSiteToCache = (site: SiteInfo) => {
    if (typeof window === 'undefined') return
    
    try {
      const cacheData: CachedSiteData = {
        site,
        timestamp: Date.now()
      }
      localStorage.setItem(SITE_CACHE_KEY, JSON.stringify(cacheData))
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
    } catch (err) {
      console.error('Error saving site to cache:', err)
    }
  }

  // Clear cache
  const clearCache = useCallback(() => {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem(SITE_CACHE_KEY)
    localStorage.removeItem(CACHE_TIMESTAMP_KEY)
  }, [])

  // Fetch current site information
  const fetchCurrentSite = useCallback(async () => {
    if (!user) {
      setCurrentSite(null)
      setIsLoading(false)
      return
    }

    try {
      setError(null)
      
      // Try to use cached data first
      const cachedSite = loadCachedSite()
      if (cachedSite) {
        setCurrentSite(cachedSite)
        setIsLoading(false)
        // Still fetch fresh data in background
      }

      // Fetch user's current site assignment
      const { data: assignment, error: assignmentError } = await supabase
        .from('site_assignments')
        .select(`
          site:sites(
            id,
            name,
            construction_start_date,
            construction_end_date,
            is_active,
            construction_manager_name,
            construction_manager_phone,
            assistant_manager_name,
            assistant_manager_phone,
            safety_manager_name,
            safety_manager_phone
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (assignmentError) {
        if (assignmentError.code === 'PGRST116') {
          // No assignment found
          setCurrentSite(null)
          clearCache()
          return
        }
        throw assignmentError
      }

      if (!assignment?.site) {
        setCurrentSite(null)
        clearCache()
        return
      }

      const site = assignment.site as any

      // Fetch related data in parallel
      const [addressResult, accommodationResult, latestReportResult] = await Promise.all([
        // Site address
        (supabase as any)
          .from('site_addresses')
          .select('*')
          .eq('site_id', site.id)
          .single(),
        
        // Accommodation address
        (supabase as any)
          .from('accommodation_addresses')
          .select('*')
          .eq('site_id', site.id)
          .single(),
        
        // Latest daily report for process info
        supabase
          .from('daily_reports')
          .select('member_name, work_process, work_section')
          .eq('site_id', site.id)
          .order('work_date', { ascending: false })
          .limit(1)
          .single()
      ])

      // Handle errors gracefully
      const address = addressResult.error ? null : addressResult.data
      const accommodation = accommodationResult.error ? null : accommodationResult.data
      const latestReport = latestReportResult.error ? null : latestReportResult.data

      // Create process info
      const processInfo = latestReport ? {
        member_name: (latestReport as any).member_name || '미정',
        work_process: (latestReport as any).work_process || '미정',
        work_section: (latestReport as any).work_section || '미정',
        drawing_id: undefined
      } : {
        member_name: '미정',
        work_process: '미정',
        work_section: '미정',
        drawing_id: undefined
      }

      // Create manager contacts array
      const managers = []
      if (site.construction_manager_name && site.construction_manager_phone) {
        managers.push({
          role: 'construction_manager' as const,
          name: site.construction_manager_name,
          phone: site.construction_manager_phone
        })
      }
      if (site.assistant_manager_name && site.assistant_manager_phone) {
        managers.push({
          role: 'assistant_manager' as const,
          name: site.assistant_manager_name,
          phone: site.assistant_manager_phone
        })
      }
      if (site.safety_manager_name && site.safety_manager_phone) {
        managers.push({
          role: 'safety_manager' as const,
          name: site.safety_manager_name,
          phone: site.safety_manager_phone
        })
      }

      // Construct SiteInfo object
      const siteData: SiteInfo = {
        id: site?.id || '',
        name: site?.name || '현장명 없음',
        address: address || {
          id: '',
          site_id: site?.id || '',
          full_address: '주소 정보 없음',
          latitude: undefined,
          longitude: undefined,
          postal_code: undefined
        },
        accommodation: accommodation || undefined,
        process: processInfo,
        managers,
        construction_period: {
          start_date: site?.construction_start_date,
          end_date: site?.construction_end_date
        },
        is_active: site?.is_active ?? false
      }

      setCurrentSite(siteData)
      saveSiteToCache(siteData)
    } catch (err) {
      console.error('Error fetching site info:', err)
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase, clearCache])

  // Refresh current site
  const refreshCurrentSite = useCallback(async () => {
    setIsLoading(true)
    clearCache()
    await fetchCurrentSite()
  }, [fetchCurrentSite, clearCache])

  // Switch to a different site
  const switchSite = useCallback(async (siteId: string) => {
    if (!user) throw new Error('User not authenticated')
    
    try {
      setIsLoading(true)
      setError(null)
      
      // Optimistically update UI
      clearCache()
      
      // Deactivate current assignments
      const { error: updateError } = await supabase
        .from('site_assignments')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (updateError) throw updateError

      // Create new assignment
      const { error: insertError } = await supabase
        .from('site_assignments')
        .insert({
          user_id: user.id,
          site_id: siteId,
          assigned_date: new Date().toISOString().split('T')[0],
          is_active: true
        })

      if (insertError) throw insertError

      // Fetch the new site data
      await fetchCurrentSite()
    } catch (err) {
      console.error('Error switching site:', err)
      setError(err as Error)
      throw err
    }
  }, [user, supabase, fetchCurrentSite, clearCache])

  // Search sites
  const searchSites = useCallback(async (filters: SiteSearchFilters): Promise<SiteSearchResult[]> => {
    try {
      let query = supabase
        .from('sites')
        .select(`
          id,
          name,
          construction_start_date,
          construction_end_date,
          is_active,
          site_addresses!inner(full_address)
        `)
        .eq('is_active', true)

      // Apply filters
      if (filters.siteName) {
        query = query.ilike('name', `%${filters.siteName}%`)
      }

      if (filters.workerName) {
        // This would require a join with user assignments
        // For now, we'll skip this filter
      }

      if (filters.dateRange) {
        query = query
          .gte('construction_start_date', filters.dateRange.startDate.toISOString())
          .lte('construction_end_date', filters.dateRange.endDate.toISOString())
      }

      const { data, error } = await query.limit(50)

      if (error) throw error

      // Format results with defensive access
      const results: SiteSearchResult[] = (data || []).map((site) => {
        // Defensive check for invalid site objects
        if (!site || typeof site !== 'object') {
          console.warn('[SiteContext] Invalid site object in search results:', site)
          return null
        }
        
        return {
          id: site?.id || '',
          name: site?.name || '이름 없음',
          address: site?.site_addresses?.[0]?.full_address || '주소 정보 없음',
          construction_period: {
            start_date: new Date(site?.construction_start_date || new Date()),
            end_date: new Date(site?.construction_end_date || new Date())
          },
        progress_percentage: calculateProgress(
          site?.construction_start_date || new Date().toISOString(),
          site?.construction_end_date || new Date().toISOString()
        ),
        participant_count: 0, // TODO: Get actual count
        is_active: site?.is_active ?? false
        }
      }).filter((result): result is SiteSearchResult => result !== null)

      return results
    } catch (err) {
      console.error('Error searching sites:', err)
      throw err
    }
  }, [supabase])

  // Calculate construction progress
  const calculateProgress = (startDate: string, endDate: string): number => {
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    const now = new Date().getTime()

    if (now < start) return 0
    if (now > end) return 100

    const total = end - start
    const elapsed = now - start
    return Math.round((elapsed / total) * 100)
  }

  // Initial load
  useEffect(() => {
    if (user) {
      fetchCurrentSite()
    } else {
      setCurrentSite(null)
      setIsLoading(false)
    }
  }, [user, fetchCurrentSite])

  const value: SiteContextValue = {
    currentSite,
    isLoading,
    error,
    refreshCurrentSite,
    switchSite,
    searchSites,
    clearCache
  }

  return (
    <SiteContext.Provider value={value}>
      {children}
    </SiteContext.Provider>
  )
}

// Custom hooks
export function useSiteContext() {
  const context = useContext(SiteContext)
  if (!context) {
    throw new Error('useSiteContext must be used within a SiteProvider')
  }
  return context
}

export function useCurrentSite() {
  const { currentSite, isLoading, error, refreshCurrentSite } = useSiteContext()
  return { currentSite, isLoading, error, refreshCurrentSite }
}

export function useSiteSearch() {
  const { searchSites } = useSiteContext()
  return { searchSites }
}

export function useSiteManagers() {
  const { currentSite } = useSiteContext()
  return { managers: currentSite?.managers || [] }
}