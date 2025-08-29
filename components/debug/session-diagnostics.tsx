'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SessionDiagnostics {
  timestamp: string
  client: {
    hasSession: boolean
    userEmail?: string
    userId?: string
    error?: string
  }
  server: {
    hasSession: boolean
    userEmail?: string
    error?: string
  }
  cookies: {
    hasSbCookies: boolean
    cookieNames: string[]
  }
  siteAssignment: {
    siteName?: string
    role?: string
    error?: string
  }
}

export function SessionDiagnosticsPanel() {
  const [diagnostics, setDiagnostics] = useState<SessionDiagnostics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const runDiagnostics = async () => {
    setIsLoading(true)
    
    try {
      const supabase = createClient()
      const result: SessionDiagnostics = {
        timestamp: new Date().toISOString(),
        client: {
          hasSession: false
        },
        server: {
          hasSession: false
        },
        cookies: {
          hasSbCookies: false,
          cookieNames: []
        },
        siteAssignment: {}
      }
      
      // Check client-side session
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        result.client.hasSession = !!session
        result.client.userEmail = session?.user?.email
        result.client.userId = session?.user?.id
        if (error) result.client.error = error.message
      } catch (err) {
        result.client.error = err instanceof Error ? err.message : 'Unknown error'
      }
      
      // Check server-side session
      try {
        const response = await fetch('/api/auth/sync-session', {
          method: 'GET',
          credentials: 'include'
        })
        const serverData = await response.json()
        result.server.hasSession = serverData.hasSession
        result.server.userEmail = serverData.userEmail
        if (serverData.error) result.server.error = serverData.error
      } catch (err) {
        result.server.error = err instanceof Error ? err.message : 'Unknown error'
      }
      
      // Check cookies
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';')
        const sbCookies = cookies.filter(c => c.trim().startsWith('sb-'))
        result.cookies.hasSbCookies = sbCookies.length > 0
        result.cookies.cookieNames = sbCookies.map(c => c.trim().split('=')[0])
      }
      
      // Check site assignment if authenticated
      if (result.client.userId) {
        try {
          const { data, error } = await supabase
            .from('site_assignments')
            .select('*, sites(name)')
            .eq('user_id', result.client.userId)
            .eq('is_active', true)
            .single()
          
          if (data && data.sites) {
            result.siteAssignment.siteName = data.sites.name
            result.siteAssignment.role = data.role
          }
          if (error) result.siteAssignment.error = error.message
        } catch (err) {
          result.siteAssignment.error = err instanceof Error ? err.message : 'Unknown error'
        }
      }
      
      setDiagnostics(result)
    } catch (error) {
      console.error('Diagnostics error:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    runDiagnostics()
    
    // Re-run diagnostics every 5 seconds
    const interval = setInterval(runDiagnostics, 5000)
    
    return () => clearInterval(interval)
  }, [])
  
  if (isLoading && !diagnostics) {
    return (
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
        <CardContent className="p-4">
          <div className="animate-pulse">Running session diagnostics...</div>
        </CardContent>
      </Card>
    )
  }
  
  if (!diagnostics) return null
  
  const isHealthy = diagnostics.client.hasSession && 
                    diagnostics.server.hasSession && 
                    diagnostics.cookies.hasSbCookies
  
  return (
    <Card className={isHealthy 
      ? "border-green-200 bg-green-50 dark:bg-green-900/20"
      : "border-red-200 bg-red-50 dark:bg-red-900/20"
    }>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span>Session Diagnostics</span>
          <span className={`text-xs px-2 py-1 rounded-full ${
            isHealthy 
              ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200'
              : 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200'
          }`}>
            {isHealthy ? 'Healthy' : 'Issues Detected'}
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 space-y-3 text-xs">
        <div>
          <div className="font-semibold mb-1">Client Session:</div>
          <div className={diagnostics.client.hasSession ? 'text-green-700' : 'text-red-700'}>
            {diagnostics.client.hasSession ? '✓ Active' : '✗ Missing'}
            {diagnostics.client.userEmail && ` (${diagnostics.client.userEmail})`}
          </div>
          {diagnostics.client.error && (
            <div className="text-red-600 text-xs mt-1">Error: {diagnostics.client.error}</div>
          )}
        </div>
        
        <div>
          <div className="font-semibold mb-1">Server Session:</div>
          <div className={diagnostics.server.hasSession ? 'text-green-700' : 'text-red-700'}>
            {diagnostics.server.hasSession ? '✓ Active' : '✗ Missing'}
            {diagnostics.server.userEmail && ` (${diagnostics.server.userEmail})`}
          </div>
          {diagnostics.server.error && (
            <div className="text-red-600 text-xs mt-1">Error: {diagnostics.server.error}</div>
          )}
        </div>
        
        <div>
          <div className="font-semibold mb-1">Cookies:</div>
          <div className={diagnostics.cookies.hasSbCookies ? 'text-green-700' : 'text-red-700'}>
            {diagnostics.cookies.hasSbCookies ? '✓ Present' : '✗ Missing'}
            {diagnostics.cookies.cookieNames.length > 0 && (
              <span className="text-gray-600"> ({diagnostics.cookies.cookieNames.length} cookies)</span>
            )}
          </div>
        </div>
        
        {diagnostics.siteAssignment.siteName && (
          <div>
            <div className="font-semibold mb-1">Site Assignment:</div>
            <div className="text-green-700">
              ✓ {diagnostics.siteAssignment.siteName} ({diagnostics.siteAssignment.role})
            </div>
          </div>
        )}
        
        <div className="text-gray-500 text-xs pt-2 border-t">
          Last updated: {new Date(diagnostics.timestamp).toLocaleTimeString()}
        </div>
        
        <button
          onClick={runDiagnostics}
          className="w-full mt-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs font-medium"
        >
          Refresh Diagnostics
        </button>
      </CardContent>
    </Card>
  )
}