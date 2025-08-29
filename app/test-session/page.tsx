'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUserSiteWithAuth } from '@/app/actions/site-info-client'
import { syncSessionAfterAuth } from '@/hooks/use-auto-login'
import { SessionDiagnosticsPanel } from '@/components/debug/session-diagnostics'

export default function TestSessionPage() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [isRunning, setIsRunning] = useState(false)
  
  const addResult = (message: string, success: boolean = true) => {
    setTestResults(prev => [...prev, {
      timestamp: new Date().toISOString(),
      message,
      success
    }])
  }
  
  const runComprehensiveTest = async () => {
    setIsRunning(true)
    setTestResults([])
    
    let supabase = createClient()
    
    try {
      // Step 1: Check initial state
      addResult('Starting comprehensive session test...')
      
      const { data: { session: initialSession } } = await supabase.auth.getSession()
      addResult(`Initial session: ${initialSession ? 'Found' : 'Not found'}`)
      
      // Step 2: If no session, perform login
      if (!initialSession) {
        addResult('Attempting login as manager@inopnc.com...')
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'manager@inopnc.com',
          password: 'password123'
        })
        
        if (error || !data.session) {
          addResult(`Login failed: ${error?.message}`, false)
          setIsRunning(false)
          return
        }
        
        addResult('Login successful!')
        
        // Step 3: Sync session with server
        addResult('Syncing session with server...')
        const syncResult = await syncSessionAfterAuth(data.session)
        
        if (syncResult.success) {
          addResult('Session synced successfully!')
        } else {
          addResult(`Session sync failed: ${syncResult.error}`, false)
        }
        
        // Wait for propagation
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // CRITICAL: Create a fresh client to read the updated cookies
        addResult('Creating fresh client to read updated session...')
        supabase = createClient()
      }
      
      // Step 4: Verify client session
      addResult('Verifying client session...')
      const { data: { user: clientUser } } = await supabase.auth.getUser()
      
      if (clientUser) {
        addResult(`Client session valid: ${clientUser.email}`)
      } else {
        addResult('Client session invalid!', false)
      }
      
      // Step 5: Test server session via API
      addResult('Testing server session...')
      const response = await fetch('/api/debug-session', {
        credentials: 'include'
      })
      const serverData = await response.json()
      
      if (serverData.session?.exists) {
        addResult(`Server session valid: ${serverData.session.user}`)
      } else {
        addResult('Server session invalid!', false)
      }
      
      // Step 6: Test site data fetch
      addResult('Fetching site data...')
      const siteResult = await getCurrentUserSiteWithAuth()
      
      if (siteResult.success && siteResult.data) {
        addResult(`Site data fetched: ${siteResult.data.site_name}`)
      } else {
        addResult(`Site data fetch failed: ${siteResult.error}`, false)
      }
      
      // Step 7: Test direct database query
      addResult('Testing direct database query...')
      const { data: sites, error: sitesError } = await supabase
        .from('sites')
        .select('name')
        .limit(1)
      
      if (sites && !sitesError) {
        addResult('Direct database query successful!')
      } else {
        addResult(`Direct database query failed: ${sitesError?.message}`, false)
      }
      
      addResult('Test complete!')
      
    } catch (error) {
      addResult(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`, false)
    } finally {
      setIsRunning(false)
    }
  }
  
  const clearSession = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setTestResults([])
    addResult('Session cleared')
  }
  
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Session Synchronization Test</h1>
      
      {/* Session Diagnostics Panel */}
      <div className="mb-6">
        <SessionDiagnosticsPanel />
      </div>
      
      {/* Test Controls */}
      <div className="mb-6 space-x-4">
        <button
          onClick={runComprehensiveTest}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isRunning ? 'Running Test...' : 'Run Comprehensive Test'}
        </button>
        
        <button
          onClick={clearSession}
          disabled={isRunning}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          Clear Session
        </button>
      </div>
      
      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Test Results:</h2>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-2 rounded ${
                  result.success 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
              >
                <span className="text-xs text-gray-600 dark:text-gray-400 mr-2">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </span>
                {result.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}