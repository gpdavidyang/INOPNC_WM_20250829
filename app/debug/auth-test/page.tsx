'use client'
import { createClient } from '@/lib/supabase/client'


interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error'
  message?: string
  details?: unknown
}

const TEST_USER = {
  email: 'worker@inopnc.com',
  password: 'password123'
}

export default function AuthTestPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentSession, setCurrentSession] = useState<Session | null>(null)

  const supabase = createClient()

  const updateResult = (name: string, status: 'pending' | 'success' | 'error', message?: string, details?: unknown) => {
    setResults(prev => {
      const existing = prev.find(r => r.name === name)
      if (existing) {
        existing.status = status
        existing.message = message
        existing.details = details
        return [...prev]
      } else {
        return [...prev, { name, status, message, details }]
      }
    })
  }

  const testAuthMethodsExist = () => {
    updateResult('Auth Methods Exist', 'pending')
    
    try {
      const authMethods = [
        'signInWithPassword',
        'signUp', 
        'signOut',
        'getSession',
        'getUser',
        'refreshSession',
        'onAuthStateChange'
      ]
      
      const missingMethods: string[] = []
      authMethods.forEach(method => {
        if (typeof supabase.auth[method as keyof typeof supabase.auth] !== 'function') {
          missingMethods.push(method)
        }
      })
      
      if (missingMethods.length === 0) {
        updateResult('Auth Methods Exist', 'success', 'All auth methods are available', { authMethods })
      } else {
        updateResult('Auth Methods Exist', 'error', `Missing methods: ${missingMethods.join(', ')}`, { missingMethods })
      }
    } catch (error) {
      updateResult('Auth Methods Exist', 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const testInitialSession = async () => {
    updateResult('Initial Session', 'pending')
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        updateResult('Initial Session', 'error', `Error: ${error.message}`)
        return
      }
      
      updateResult('Initial Session', 'success', session ? 'Session found' : 'No session (expected)', { 
        sessionExists: !!session,
        userEmail: session?.user?.email 
      })
      
      if (session) {
        setCurrentSession(session)
        setCurrentUser(session.user)
      }
    } catch (error) {
      updateResult('Initial Session', 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const testAuthStateListener = () => {
    updateResult('Auth State Listener', 'pending')
    
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state change detected:', event, session?.user?.email)
        updateResult('Auth State Listener', 'success', `Listener active - Last event: ${event}`, { 
          lastEvent: event,
          userEmail: session?.user?.email 
        })
        
        // Update local state
        setCurrentSession(session)
        setCurrentUser(session?.user || null)
      })
      
      // Test that we got a subscription
      if (subscription && typeof subscription.unsubscribe === 'function') {
        updateResult('Auth State Listener', 'success', 'Auth state listener registered successfully', { 
          subscriptionActive: true 
        })
      } else {
        updateResult('Auth State Listener', 'error', 'Failed to register auth state listener')
      }
    } catch (error) {
      updateResult('Auth State Listener', 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const testSignInFlow = async () => {
    updateResult('Sign In Flow', 'pending')
    
    try {
      // First, sign out to ensure clean state
      await supabase.auth.signOut()
      
      // Test sign in
      const signInResult = await supabase.auth.signInWithPassword({
        email: TEST_USER.email,
        password: TEST_USER.password
      })
      
      if (signInResult.error) {
        updateResult('Sign In Flow', 'error', `Sign in failed: ${signInResult.error.message}`)
        return
      }
      
      updateResult('Sign In Flow', 'success', `Sign in successful for ${signInResult.data.user?.email}`, {
        userEmail: signInResult.data.user?.email,
        sessionId: signInResult.data.session?.access_token?.substring(0, 10) + '...'
      })
      
      setCurrentUser(signInResult.data.user)
      setCurrentSession(signInResult.data.session)
      
    } catch (error) {
      updateResult('Sign In Flow', 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const testSignOutFlow = async () => {
    updateResult('Sign Out Flow', 'pending')
    
    try {
      const signOutResult = await supabase.auth.signOut()
      
      if (signOutResult.error) {
        updateResult('Sign Out Flow', 'error', `Sign out failed: ${signOutResult.error.message}`)
        return
      }
      
      updateResult('Sign Out Flow', 'success', 'Sign out successful')
      setCurrentUser(null)
      setCurrentSession(null)
      
    } catch (error) {
      updateResult('Sign Out Flow', 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const testRefreshSession = async () => {
    updateResult('Refresh Session', 'pending')
    
    try {
      // Make sure we're signed in first
      if (!currentSession) {
        await testSignInFlow()
        // Wait a moment for state to update
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      const refreshResult = await supabase.auth.refreshSession()
      
      if (refreshResult.error) {
        updateResult('Refresh Session', 'error', `Refresh failed: ${refreshResult.error.message}`)
        return
      }
      
      updateResult('Refresh Session', 'success', 'Session refresh successful', {
        sessionId: refreshResult.data.session?.access_token?.substring(0, 10) + '...'
      })
      
      if (refreshResult.data.session) {
        setCurrentSession(refreshResult.data.session)
        setCurrentUser(refreshResult.data.user)
      }
      
    } catch (error) {
      updateResult('Refresh Session', 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setResults([])
    
    // Test 1: Check auth methods exist
    testAuthMethodsExist()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Test 2: Test initial session
    await testInitialSession()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Test 3: Test auth state listener
    testAuthStateListener()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Test 4: Test sign in flow
    await testSignInFlow()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Test 5: Test refresh session
    await testRefreshSession()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Test 6: Test sign out flow
    await testSignOutFlow()
    
    setIsRunning(false)
  }

  useEffect(() => {
    // Set up auth state listener on component mount
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user?.email)
      setCurrentSession(session)
      setCurrentUser(session?.user || null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'pending': return '🔄'
      default: return '⏳'
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'pending': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔐 Authentication Flow Test Suite
        </h1>
        
        {/* Current Auth State */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Authentication State</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">User:</span> 
              <span className={currentUser ? 'text-green-600' : 'text-gray-500'}>
                {currentUser ? currentUser.email : 'Not signed in'}
              </span>
            </div>
            <div>
              <span className="font-medium">Session:</span> 
              <span className={currentSession ? 'text-green-600' : 'text-gray-500'}>
                {currentSession ? 'Active' : 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex gap-4 mb-4">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-md font-medium"
            >
              {isRunning ? '🔄 Running Tests...' : '🚀 Run All Tests'}
            </button>
            
            <button
              onClick={testSignInFlow}
              disabled={isRunning}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-md"
            >
              Test Sign In
            </button>
            
            <button
              onClick={testSignOutFlow}
              disabled={isRunning}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-4 py-2 rounded-md"
            >
              Test Sign Out
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Test Results</h2>
          </div>
          
          <div className="divide-y">
            {results.length === 0 ? (
              <div className="p-6 text-gray-500 text-center">
                Click "Run All Tests" to start testing the authentication flow
              </div>
            ) : (
              results.map((result, index) => (
                <div key={index} className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getStatusIcon(result.status)}</span>
                      <h3 className="font-medium text-lg">{result.name}</h3>
                    </div>
                    <span className={`text-sm font-medium ${getStatusColor(result.status)}`}>
                      {result.status.toUpperCase()}
                    </span>
                  </div>
                  
                  {result.message && (
                    <p className="text-gray-600 ml-9 mb-2">{result.message}</p>
                  )}
                  
                  {result.details && (
                    <details className="ml-9">
                      <summary className="text-sm text-gray-500 cursor-pointer">
                        View Details
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Test Summary */}
        {results.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {results.filter(r => r.status === 'success').length}
                </div>
                <div className="text-sm text-gray-600">Passed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {results.filter(r => r.status === 'error').length}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {results.filter(r => r.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}