'use client'


interface ProductionDebugInfo {
  environment: string
  hasSupabaseUrl: boolean
  hasSupabaseKey: boolean
  supabaseUrlStart: string
  supabaseKeyStart: string
  userAgent: string
  timestamp: string
  errors: string[]
  warnings: string[]
}

export function ProductionLoginDebug() {
  const [debugInfo, setDebugInfo] = useState<ProductionDebugInfo | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [apiTest, setApiTest] = useState<{ status: string; message: string } | null>(null)

  useEffect(() => {
    // Only show in production or when explicitly enabled
    const shouldShow = process.env.NODE_ENV === 'production' || 
                      localStorage.getItem('debug-production-login') === 'true' ||
                      new URLSearchParams(window.location.search).has('debug')

    if (shouldShow) {
      setShowDebug(true)
      collectDebugInfo()
    }
  }, [])

  const collectDebugInfo = () => {
    const errors: string[] = []
    const warnings: string[] = []

    // Clean environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()?.replace(/\\n/g, '')?.replace(/\n/g, '')
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()?.replace(/\\n/g, '')?.replace(/\n/g, '')

    // Validate environment
    if (!supabaseUrl) {
      errors.push('Missing NEXT_PUBLIC_SUPABASE_URL')
    } else if (supabaseUrl.includes('\\n') || supabaseUrl.includes('\n')) {
      errors.push('Supabase URL contains newlines')
    }

    if (!supabaseKey) {
      errors.push('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
    } else if (supabaseKey.includes('\\n') || supabaseKey.includes('\n')) {
      errors.push('Supabase key contains newlines')
    }

    // Check for common production issues
    if (typeof window !== 'undefined') {
      if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
        warnings.push('Using HTTP in production environment')
      }
    }

    setDebugInfo({
      environment: process.env.NODE_ENV || 'unknown',
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      supabaseUrlStart: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'N/A',
      supabaseKeyStart: supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'N/A',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
      timestamp: new Date().toISOString(),
      errors,
      warnings
    })
  }

  const testProductionAPI = async () => {
    setApiTest({ status: 'testing', message: 'Testing production API...' })
    
    try {
      const response = await fetch('/api/production-login-test')
      const data = await response.json()
      
      if (response.ok && data.success) {
        setApiTest({ status: 'success', message: 'Production API is working correctly' })
      } else {
        setApiTest({ status: 'error', message: data.error || 'API test failed' })
      }
    } catch (error) {
      setApiTest({ status: 'error', message: `Network error: ${error instanceof Error ? error.message : String(error)}` })
    }
  }

  if (!showDebug || !debugInfo) {
    return null
  }

  const hasErrors = debugInfo.errors.length > 0
  const hasWarnings = debugInfo.warnings.length > 0

  return (
    <div className="fixed top-0 left-0 right-0 bg-black bg-opacity-90 text-white p-4 z-50 max-h-screen overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-red-400">🚨 Production Login Debug</h2>
          <button
            onClick={() => setShowDebug(false)}
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Environment Info */}
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="font-bold mb-2">Environment</h3>
            <div className="text-sm space-y-1">
              <div>Node ENV: <span className="text-yellow-400">{String(debugInfo.environment)}</span></div>
              <div>Timestamp: <span className="text-gray-400">{String(debugInfo.timestamp)}</span></div>
              <div>Supabase URL: <span className={debugInfo.hasSupabaseUrl ? 'text-green-400' : 'text-red-400'}>
                {debugInfo.hasSupabaseUrl ? debugInfo.supabaseUrlStart : 'MISSING'}
              </span></div>
              <div>Supabase Key: <span className={debugInfo.hasSupabaseKey ? 'text-green-400' : 'text-red-400'}>
                {debugInfo.hasSupabaseKey ? debugInfo.supabaseKeyStart : 'MISSING'}
              </span></div>
            </div>
          </div>

          {/* Issues */}
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="font-bold mb-2">Issues</h3>
            <div className="text-sm space-y-1">
              {hasErrors && (
                <div>
                  <div className="text-red-400 font-semibold">❌ Errors:</div>
                  {debugInfo.errors.map((error, i) => (
                    <div key={i} className="ml-4 text-red-300">• {error}</div>
                  ))}
                </div>
              )}
              {hasWarnings && (
                <div>
                  <div className="text-yellow-400 font-semibold">⚠️ Warnings:</div>
                  {debugInfo.warnings.map((warning, i) => (
                    <div key={i} className="ml-4 text-yellow-300">• {warning}</div>
                  ))}
                </div>
              )}
              {!hasErrors && !hasWarnings && (
                <div className="text-green-400">✅ No issues detected</div>
              )}
            </div>
          </div>
        </div>

        {/* API Test */}
        <div className="mt-4 bg-gray-800 p-4 rounded">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">API Test</h3>
            <button
              onClick={testProductionAPI}
              disabled={apiTest?.status === 'testing'}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-3 py-1 rounded text-sm"
            >
              {apiTest?.status === 'testing' ? 'Testing...' : 'Test API'}
            </button>
          </div>
          {apiTest && (
            <div className={`text-sm p-2 rounded ${
              apiTest.status === 'success' ? 'bg-green-900 text-green-300' :
              apiTest.status === 'error' ? 'bg-red-900 text-red-300' :
              'bg-yellow-900 text-yellow-300'
            }`}>
              {String(apiTest.message)}
            </div>
          )}
        </div>

        {/* Browser Info */}
        <div className="mt-4 bg-gray-800 p-4 rounded">
          <h3 className="font-bold mb-2">Browser Info</h3>
          <div className="text-xs text-gray-400 break-all">
            {String(debugInfo.userAgent)}
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          To enable debug mode: Add <code>?debug</code> to URL or set localStorage item 'debug-production-login' to 'true'
        </div>
      </div>
    </div>
  )
}