'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestAuthFix() {
  const [status, setStatus] = useState<string>('Checking...')
  const [sessionInfo, setSessionInfo] = useState<unknown>(null)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()

      try {
        // Check if we can get session without errors
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          setErrors(prev => [...prev, `Session error: ${error.message}`])
          setStatus('Error getting session')
        } else if (session) {
          setStatus('Authenticated')
          setSessionInfo({
            user: session.user?.email,
            expires: new Date(session.expires_at! * 1000).toLocaleString(),
          })
        } else {
          setStatus('Not authenticated')
        }
      } catch (err) {
        setErrors(prev => [...prev, `Unexpected error: ${err}`])
        setStatus('Error')
      }
    }

    checkAuth()
  }, [])

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Authentication Fix Test</h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-lg">Status</h2>
            <p
              className={`text-lg ${status === 'Authenticated' ? 'text-green-600' : status === 'Not authenticated' ? 'text-yellow-600' : 'text-red-600'}`}
            >
              {status}
            </p>
          </div>

          {sessionInfo && (
            <div>
              <h2 className="font-semibold text-lg">Session Info</h2>
              <pre className="bg-gray-100 p-3 rounded text-sm">
                {JSON.stringify(sessionInfo, null, 2)}
              </pre>
            </div>
          )}

          {errors.length > 0 && (
            <div>
              <h2 className="font-semibold text-lg text-red-600">Errors</h2>
              <ul className="list-disc list-inside space-y-1">
                {Array.isArray(errors) &&
                  errors.map((error, idx) => (
                    <li key={idx} className="text-red-600 text-sm">
                      {error}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-2">Test Results:</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className={errors.length === 0 ? 'text-green-500' : 'text-red-500'}>
                  {errors.length === 0 ? '✓' : '✗'}
                </span>
                <span>No React Query context errors</span>
              </li>
              <li className="flex items-center gap-2">
                <span
                  className={
                    !errors.some(e => e.includes('401')) ? 'text-green-500' : 'text-red-500'
                  }
                >
                  {!errors.some(e => e.includes('401')) ? '✓' : '✗'}
                </span>
                <span>No 401 errors on bridge-session</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 flex gap-4">
            <a href="/auth/login" className="text-blue-600 hover:underline">
              Go to Login
            </a>
            <a href="/dashboard" className="text-blue-600 hover:underline">
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
