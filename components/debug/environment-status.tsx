'use client'


interface EnvVarStatus {
  exists: boolean
  length: number
  type: string
  preview: string
  isValid: boolean
  errors: string[]
}

interface EnvironmentStatus {
  success: boolean
  timestamp: string
  environment: {
    NODE_ENV: string
    VERCEL_ENV?: string
    VERCEL_URL?: string
  }
  variables: Record<string, EnvVarStatus>
  overall: {
    healthy: boolean
    missingCritical: string[]
    invalidCritical: string[]
    totalVariables: number
    validVariables: number
  }
}

export function EnvironmentStatus() {
  const [status, setStatus] = useState<EnvironmentStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/debug/env')
      const data = await response.json()
      
      if (data.success) {
        setStatus(data)
        
        // Show automatically if there are issues
        if (!data.overall.healthy) {
          setVisible(true)
        }
      } else {
        setError(data.error || 'Failed to fetch environment status')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Only show in development or if there's an auth error
    if (process.env.NODE_ENV === 'development' || 
        window.location.search.includes('debug=env') ||
        document.cookie.includes('debug-env=true')) {
      fetchStatus()
    } else {
      setLoading(false)
    }
  }, [])

  if (loading) {
    return null
  }

  if (error) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-4 max-w-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-700">Environment Check Failed</span>
          <button
            onClick={() => setVisible(false)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-red-600 mt-1">{error}</p>
      </div>
    )
  }

  if (!status || !visible) {
    // Show a small indicator if there are issues
    if (status && !status.overall.healthy) {
      return (
        <button
          onClick={() => setVisible(true)}
          className="fixed bottom-4 right-4 z-50 bg-amber-50 border border-amber-200 rounded-full p-3 hover:bg-amber-100 transition-colors"
          title="Environment configuration issues detected"
        >
          <AlertTriangle className="h-5 w-5 text-amber-600" />
        </button>
      )
    }
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-md max-h-96 overflow-hidden">
      {/* Header */}
      <div className={`px-4 py-3 border-b ${
        status.overall.healthy 
          ? 'bg-green-50 border-green-200' 
          : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status.overall.healthy ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )}
            <span className="font-medium text-sm">
              Environment Status
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-600 mt-1">
          {status.overall.validVariables}/{status.overall.totalVariables} variables valid
        </div>
      </div>

      {/* Body */}
      <div className="overflow-y-auto max-h-64">
        {/* Critical Issues */}
        {(!status.overall.healthy) && (
          <div className="p-4 bg-red-50 border-b border-red-100">
            <h4 className="text-sm font-medium text-red-800 mb-2">Critical Issues</h4>
            {status.overall.missingCritical.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-red-700 font-medium">Missing:</p>
                <ul className="text-xs text-red-600 list-disc list-inside">
                  {status.overall.missingCritical.map(key => (
                    <li key={key}>{key}</li>
                  ))}
                </ul>
              </div>
            )}
            {status.overall.invalidCritical.length > 0 && (
              <div>
                <p className="text-xs text-red-700 font-medium">Invalid:</p>
                <ul className="text-xs text-red-600 list-disc list-inside">
                  {status.overall.invalidCritical.map(key => (
                    <li key={key}>{key}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Environment Info */}
        <div className="p-4 border-b border-gray-100">
          <h4 className="text-sm font-medium text-gray-800 mb-2">Environment</h4>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">NODE_ENV:</span>
              <span className="font-mono">{status.environment.NODE_ENV}</span>
            </div>
            {status.environment.VERCEL_ENV && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">VERCEL_ENV:</span>
                <span className="font-mono">{status.environment.VERCEL_ENV}</span>
              </div>
            )}
          </div>
        </div>

        {/* Variables */}
        <div className="p-4">
          <h4 className="text-sm font-medium text-gray-800 mb-2">Variables</h4>
          <div className="space-y-2">
            {Object.entries(status.variables).map(([key, varStatus]) => (
              <div key={key} className="border border-gray-100 rounded p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">{key}</span>
                  {varStatus.isValid ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                  )}
                </div>
                
                {varStatus.exists ? (
                  <div>
                    <div className="text-xs text-gray-600 mb-1">
                      Length: {varStatus.length} | Type: {varStatus.type}
                    </div>
                    {varStatus.preview && (
                      <div className="text-xs font-mono text-gray-500 bg-gray-50 rounded p-1 mb-1">
                        {varStatus.preview}
                      </div>
                    )}
                    {varStatus.errors.length > 0 && (
                      <div className="text-xs text-red-600">
                        {varStatus.errors.join(', ')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-red-600">
                    Not set
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Last check: {new Date(status.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}