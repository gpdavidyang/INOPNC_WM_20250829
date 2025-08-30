'use client'

import { useState, useEffect } from 'react'

interface EnvironmentStatusProps {
  showInProduction?: boolean
}

interface EnvStatus {
  status: 'loading' | 'success' | 'error'
  data?: any
  error?: string
}

export function EnvironmentStatus({ showInProduction = false }: EnvironmentStatusProps) {
  const [envStatus, setEnvStatus] = useState<EnvStatus>({ status: 'loading' })
  
  // Don't show in production unless explicitly requested
  if (process.env.NODE_ENV === 'production' && !showInProduction) {
    return null
  }
  
  useEffect(() => {
    let mounted = true
    
    const checkEnvironment = async () => {
      try {
        const response = await fetch('/api/debug/env')
        const data = await response.json()
        
        if (!mounted) return
        
        if (response.ok) {
          setEnvStatus({ status: 'success', data })
        } else {
          setEnvStatus({ status: 'error', error: data.error || 'Failed to fetch environment status' })
        }
      } catch (error) {
        if (!mounted) return
        setEnvStatus({ status: 'error', error: error instanceof Error ? error.message : 'Network error' })
      }
    }
    
    checkEnvironment()
    
    return () => {
      mounted = false
    }
  }, [])
  
  if (envStatus.status === 'loading') {
    return (
      <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-300 rounded-lg p-3 text-sm shadow-lg z-50">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-yellow-800">Checking environment...</span>
        </div>
      </div>
    )
  }
  
  if (envStatus.status === 'error') {
    return (
      <div className="fixed bottom-4 right-4 bg-red-100 border border-red-300 rounded-lg p-3 text-sm shadow-lg z-50 max-w-sm">
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-medium text-red-800">Environment Error</p>
            <p className="text-red-700">{envStatus.error}</p>
          </div>
        </div>
      </div>
    )
  }
  
  const { data } = envStatus
  const hasErrors = data?.data?.envVars && Object.values(data.data.envVars).some((env: any) => !env.isValid)
  
  return (
    <div className={`fixed bottom-4 right-4 ${hasErrors ? 'bg-red-100 border-red-300' : 'bg-green-100 border-green-300'} border rounded-lg p-3 text-sm shadow-lg z-50 max-w-md`}>
      <div className="flex items-start space-x-2">
        <svg className={`w-5 h-5 ${hasErrors ? 'text-red-600' : 'text-green-600'} mt-0.5`} fill="currentColor" viewBox="0 0 20 20">
          {hasErrors ? (
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          ) : (
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          )}
        </svg>
        <div className="flex-1">
          <p className={`font-medium ${hasErrors ? 'text-red-800' : 'text-green-800'}`}>
            Environment: {data?.data?.environment || 'unknown'}
          </p>
          {data?.data?.vercelEnv && (
            <p className={`${hasErrors ? 'text-red-700' : 'text-green-700'} mb-2`}>
              Vercel: {data.data.vercelEnv}
            </p>
          )}
          
          {hasErrors && (
            <div className="mt-2">
              <p className="text-red-700 font-medium mb-1">Issues:</p>
              <ul className="text-red-600 text-xs list-disc list-inside space-y-1">
                {Object.entries(data?.data?.envVars || {}).map(([key, env]: [string, any]) => 
                  !env.isValid && (
                    <li key={key}>
                      {key}: {!env.exists ? 'Missing' : `Invalid (${env.length} chars)`}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
          
          <div className="mt-2 text-xs text-gray-600">
            {data?.data?.timestamp && new Date(data.data.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnvironmentStatus