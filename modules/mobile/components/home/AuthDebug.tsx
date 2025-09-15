'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/modules/mobile/providers/AuthProvider'

interface AuthDebugInfo {
  clientSession: any
  clientUser: any
  apiAuthCheck: any
  cookies: string[]
  errors: string[]
}

export const AuthDebug: React.FC = () => {
  const { user: contextUser, session: contextSession, profile: contextProfile } = useAuth()
  const [authInfo, setAuthInfo] = useState<AuthDebugInfo>({
    clientSession: null,
    clientUser: null,
    apiAuthCheck: null,
    cookies: [],
    errors: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const errors: string[] = []
      let clientSession = null
      let clientUser = null
      let apiAuthCheck = null

      try {
        // Check client-side auth
        const supabase = createClient()
        if (supabase) {
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession()
          if (sessionError) {
            errors.push(`Client session error: ${sessionError.message}`)
          }
          clientSession = session

          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser()
          if (userError) {
            errors.push(`Client user error: ${userError.message}`)
          }
          clientUser = user
        } else {
          errors.push('Supabase client is null')
        }

        // Check cookies
        const cookies = document.cookie
          .split(';')
          .map(c => c.trim())
          .filter(c => c.includes('sb-') || c.includes('supabase'))
          .map(c => c.split('=')[0])

        // Check server-side auth via API
        const response = await fetch('/api/auth/check')
        if (response.ok) {
          apiAuthCheck = await response.json()
        } else {
          errors.push(`API auth check failed: ${response.status}`)
        }

        setAuthInfo({
          clientSession,
          clientUser,
          apiAuthCheck,
          cookies,
          errors,
        })
      } catch (error) {
        errors.push(`General error: ${error instanceof Error ? error.message : 'Unknown'}`)
        setAuthInfo(prev => ({ ...prev, errors }))
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Re-check every 5 seconds
    const interval = setInterval(checkAuth, 5000)
    return () => clearInterval(interval)
  }, [])

  if (process.env.NODE_ENV !== 'development') {
    return null // Only show in development
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 10,
        right: 10,
        background: 'rgba(0,0,0,0.9)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '11px',
        maxWidth: '400px',
        zIndex: 9999,
        fontFamily: 'monospace',
      }}
    >
      <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>
        🔍 Auth Debug Info {loading && '(Loading...)'}
      </div>

      <div style={{ marginBottom: '3px' }}>
        <strong>Context Session:</strong> {contextSession ? '✅' : '❌'}
        {contextSession && ` (${contextSession.user?.email})`}
      </div>

      <div style={{ marginBottom: '3px' }}>
        <strong>Client Session:</strong> {authInfo.clientSession ? '✅' : '❌'}
        {authInfo.clientSession && ` (${authInfo.clientSession.user?.email})`}
      </div>

      <div style={{ marginBottom: '3px' }}>
        <strong>Client User:</strong> {authInfo.clientUser ? '✅' : '❌'}
        {authInfo.clientUser && ` (${authInfo.clientUser.email})`}
      </div>

      <div style={{ marginBottom: '3px' }}>
        <strong>Server Auth:</strong> {authInfo.apiAuthCheck?.hasSession ? '✅' : '❌'}
        {authInfo.apiAuthCheck?.userEmail && ` (${authInfo.apiAuthCheck.userEmail})`}
      </div>

      <div style={{ marginBottom: '3px' }}>
        <strong>Auth Cookies:</strong>{' '}
        {authInfo.cookies.length > 0 ? `✅ (${authInfo.cookies.length})` : '❌'}
        {authInfo.cookies.length > 0 && (
          <div style={{ fontSize: '10px', marginLeft: '10px' }}>{authInfo.cookies.join(', ')}</div>
        )}
      </div>

      {authInfo.apiAuthCheck?.profile && (
        <div style={{ marginBottom: '3px' }}>
          <strong>Profile:</strong> {authInfo.apiAuthCheck.profile.full_name} (
          {authInfo.apiAuthCheck.profile.role})
        </div>
      )}

      {authInfo.errors.length > 0 && (
        <div style={{ marginTop: '5px', color: '#ff6b6b' }}>
          <strong>Errors:</strong>
          {authInfo.errors.map((err, i) => (
            <div key={i} style={{ fontSize: '10px', marginLeft: '10px' }}>
              • {err}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AuthDebug
