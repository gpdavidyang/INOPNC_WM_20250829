'use client'

import { useEffect, useState } from 'react'
import { createClient, resetClient, forceSessionRefresh } from '@/lib/supabase/client'
import { bridgeSession, ensureClientSession } from '@/lib/supabase/session-bridge'

export default function DebugSessionPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`[DEBUG-SESSION] ${message}`)
  }

  const checkClientSession = async () => {
    setIsLoading(true)
    addLog('Checking client session...')
    
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      addLog(`❌ Error getting session: ${error.message}`)
    } else if (session) {
      addLog(`✅ Session found: ${session.user?.email}`)
      addLog(`   Access token: ${session.access_token?.substring(0, 20)}...`)
      addLog(`   Expires at: ${new Date(session.expires_at! * 1000).toLocaleString()}`)
    } else {
      addLog('❌ No session found')
    }
    
    setIsLoading(false)
  }

  const checkCookies = () => {
    addLog('Checking cookies...')
    const cookies = document.cookie.split(';')
    const authCookies = cookies.filter(c => c.includes('sb-'))
    
    if (authCookies.length > 0) {
      addLog(`Found ${authCookies.length} Supabase cookies:`)
      authCookies.forEach(cookie => {
        const [name] = cookie.trim().split('=')
        addLog(`   ${name}`)
      })
    } else {
      addLog('❌ No Supabase cookies found')
    }
  }

  const performBridgeSession = async () => {
    setIsLoading(true)
    addLog('Starting session bridge...')
    
    const result = await bridgeSession()
    
    if (result.success) {
      addLog(`✅ Bridge successful: ${result.session?.user?.email}`)
      
      // Wait a bit for cookies to propagate
      addLog('Waiting for cookie propagation...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check if session is now available
      await checkClientSession()
    } else {
      addLog(`❌ Bridge failed: ${result.error}`)
    }
    
    setIsLoading(false)
  }

  const performEnsureSession = async () => {
    setIsLoading(true)
    addLog('Ensuring client session...')
    
    const result = await ensureClientSession()
    
    if (result.success) {
      addLog(`✅ Session ensured: ${result.session?.user?.email}`)
    } else {
      addLog(`❌ Ensure failed: ${result.error}`)
    }
    
    setIsLoading(false)
  }

  const performResetClient = async () => {
    setIsLoading(true)
    addLog('Resetting client singleton...')
    
    resetClient()
    addLog('Client reset complete')
    
    // Check session with fresh client
    await checkClientSession()
    
    setIsLoading(false)
  }

  const performForceRefresh = async () => {
    setIsLoading(true)
    addLog('Forcing session refresh...')
    
    const result = await forceSessionRefresh()
    
    if (result.success) {
      addLog(`✅ Refresh successful: ${result.session?.user?.email}`)
    } else {
      addLog(`❌ Refresh failed: ${result.error}`)
    }
    
    setIsLoading(false)
  }

  const checkServerSession = async () => {
    setIsLoading(true)
    addLog('Checking server session...')
    
    try {
      const response = await fetch('/api/auth/sync-session', {
        method: 'GET',
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.success) {
        addLog(`Server session status:`)
        addLog(`   Has session: ${data.hasSession}`)
        addLog(`   Has user: ${data.hasUser}`)
        addLog(`   User email: ${data.userEmail || 'N/A'}`)
        
        if (data.sessionError) {
          addLog(`   Session error: ${data.sessionError}`)
        }
        if (data.userError) {
          addLog(`   User error: ${data.userError}`)
        }
      } else {
        addLog(`❌ Server check failed: ${data.error}`)
      }
    } catch (error) {
      addLog(`❌ Server check error: ${error}`)
    }
    
    setIsLoading(false)
  }

  const performManualLogin = async () => {
    setIsLoading(true)
    addLog('Performing manual login...')
    
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'manager@inopnc.com',
      password: 'password123'
    })
    
    if (error) {
      addLog(`❌ Login failed: ${error.message}`)
    } else if (data.session) {
      addLog(`✅ Login successful: ${data.user?.email}`)
      addLog(`   Access token: ${data.session.access_token?.substring(0, 20)}...`)
      
      // Wait for auth state change to propagate
      addLog('Waiting for auth state change...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check if session is available
      await checkClientSession()
    }
    
    setIsLoading(false)
  }

  const clearLogs = () => {
    setLogs([])
  }

  useEffect(() => {
    // Initial checks
    checkCookies()
    checkClientSession()
    checkServerSession()
  }, [])

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Session Debug Tool</h1>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={checkClientSession}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Check Client Session
        </button>
        
        <button
          onClick={checkServerSession}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Check Server Session
        </button>
        
        <button
          onClick={checkCookies}
          disabled={isLoading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Check Cookies
        </button>
        
        <button
          onClick={performBridgeSession}
          disabled={isLoading}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
        >
          Bridge Session
        </button>
        
        <button
          onClick={performEnsureSession}
          disabled={isLoading}
          className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
        >
          Ensure Session
        </button>
        
        <button
          onClick={performResetClient}
          disabled={isLoading}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          Reset Client
        </button>
        
        <button
          onClick={performForceRefresh}
          disabled={isLoading}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
        >
          Force Refresh
        </button>
        
        <button
          onClick={performManualLogin}
          disabled={isLoading}
          className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 disabled:opacity-50"
        >
          Manual Login
        </button>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Logs</h2>
        <button
          onClick={clearLogs}
          className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Logs
        </button>
      </div>
      
      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
        {logs.length === 0 ? (
          <div className="text-gray-500">No logs yet...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">
              {log}
            </div>
          ))
        )}
      </div>
      
      {isLoading && (
        <div className="mt-4 text-center text-gray-600">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          <span className="ml-2">Processing...</span>
        </div>
      )}
    </div>
  )
}