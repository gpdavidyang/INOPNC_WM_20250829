'use client'


export default function TestSessionFixPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  
  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : '📝'
    setLogs(prev => [...prev, `[${timestamp}] ${prefix} ${message}`])
  }
  
  const clearLogs = () => {
    setLogs([])
  }
  
  const testSessionFix = async () => {
    setIsRunning(true)
    clearLogs()
    
    try {
      // Step 1: Clear any existing session
      addLog('Clearing any existing session...')
      let supabase = createClient()
      await supabase.auth.signOut()
      addLog('Session cleared', 'success')
      
      // Step 2: Perform login
      addLog('Logging in as manager@inopnc.com...')
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'manager@inopnc.com',
        password: 'password123'
      })
      
      if (loginError || !loginData.session) {
        addLog(`Login failed: ${loginError?.message}`, 'error')
        setIsRunning(false)
        return
      }
      
      addLog(`Login successful! User: ${loginData.user?.email}`, 'success')
      addLog(`Session token present: ${loginData.session.access_token ? 'Yes' : 'No'}`)
      
      // Step 3: Check cookies before sync
      addLog('Checking cookies before sync...')
      const cookiesBeforeSync = document.cookie
      const hasAuthCookiesBefore = cookiesBeforeSync.includes('sb-')
      addLog(`Auth cookies before sync: ${hasAuthCookiesBefore ? 'Present' : 'Missing'}`)
      
      // Step 4: Sync session with server
      addLog('Syncing session with server...')
      const syncResponse = await fetch('/api/auth/sync-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: loginData.session.access_token,
          refresh_token: loginData.session.refresh_token
        }),
        credentials: 'include'
      })
      
      const syncResult = await syncResponse.json()
      
      if (!syncResult.success) {
        addLog(`Session sync failed: ${syncResult.error}`, 'error')
        setIsRunning(false)
        return
      }
      
      addLog('Session synced with server', 'success')
      addLog(`Server confirmed user: ${syncResult.user?.email}`)
      
      // Step 5: Wait for cookie propagation
      addLog('Waiting for cookie propagation (500ms)...')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Step 6: Check cookies after sync
      addLog('Checking cookies after sync...')
      const cookiesAfterSync = document.cookie
      const hasAuthCookiesAfter = cookiesAfterSync.includes('sb-')
      addLog(`Auth cookies after sync: ${hasAuthCookiesAfter ? 'Present' : 'Missing'}`)
      
      // Step 7: Create fresh client to test cookie reading
      addLog('Creating fresh client to read updated cookies...')
      supabase = createClient()
      
      // Step 8: Verify client session with fresh client
      addLog('Verifying client session with fresh client...')
      const { data: { session: clientSession } } = await supabase.auth.getSession()
      
      if (clientSession) {
        addLog(`Client session valid: ${clientSession.user?.email}`, 'success')
      } else {
        addLog('Client session invalid after sync!', 'error')
      }
      
      // Step 9: Verify user with fresh client
      addLog('Verifying user with fresh client...')
      const { data: { user: clientUser } } = await supabase.auth.getUser()
      
      if (clientUser) {
        addLog(`Client user verified: ${clientUser.email}`, 'success')
      } else {
        addLog('Client user verification failed!', 'error')
      }
      
      // Step 10: Test database access
      addLog('Testing database access...')
      const { data: sites, error: dbError } = await supabase
        .from('sites')
        .select('name')
        .limit(1)
      
      if (sites && !dbError) {
        addLog(`Database access successful! Found ${sites.length} site(s)`, 'success')
      } else {
        addLog(`Database access failed: ${dbError?.message}`, 'error')
      }
      
      // Step 11: Test server session check
      addLog('Checking server session status...')
      const serverCheckResponse = await fetch('/api/auth/sync-session', {
        method: 'GET',
        credentials: 'include'
      })
      
      const serverStatus = await serverCheckResponse.json()
      
      if (serverStatus.hasSession && serverStatus.hasUser) {
        addLog(`Server session valid: ${serverStatus.userEmail}`, 'success')
      } else {
        addLog(`Server session check failed: ${serverStatus.userError || 'No session'}`, 'error')
      }
      
      // Final summary
      addLog('--- TEST COMPLETE ---')
      if (clientSession && clientUser && sites && serverStatus.hasSession) {
        addLog('🎉 ALL TESTS PASSED! Session sync is working correctly!', 'success')
      } else {
        addLog('⚠️ Some tests failed. Check the logs above for details.', 'error')
      }
      
    } catch (error) {
      addLog(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`, 'error')
    } finally {
      setIsRunning(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          Session Synchronization Fix Test
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Test Controls
          </h2>
          
          <div className="flex gap-4">
            <button
              onClick={testSessionFix}
              disabled={isRunning}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? 'Running Test...' : 'Run Session Fix Test'}
            </button>
            
            <button
              onClick={clearLogs}
              disabled={isRunning}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              Clear Logs
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            This test will:
            <ul className="list-disc list-inside mt-2">
              <li>Login with test credentials</li>
              <li>Sync session with server</li>
              <li>Verify client can read updated cookies</li>
              <li>Test database access with synced session</li>
            </ul>
          </div>
        </div>
        
        {logs.length > 0 && (
          <div className="bg-gray-900 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">
              Test Logs
            </h2>
            
            <div className="bg-black rounded p-4 max-h-96 overflow-y-auto">
              <pre className="text-xs text-green-400 font-mono">
                {logs.map((log, index) => (
                  <div 
                    key={index} 
                    className={
                      log.includes('❌') ? 'text-red-400' :
                      log.includes('✅') ? 'text-green-400' :
                      'text-gray-300'
                    }
                  >
                    {log}
                  </div>
                ))}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}