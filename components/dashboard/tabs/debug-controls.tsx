'use client'

import React from 'react'
import { createClient } from '@/lib/supabase/client'

export function DebugControls() {
  const supabase = createClient()
  
  const clearAutoLoginState = () => {
    localStorage.removeItem('inopnc-login-success')
    localStorage.removeItem('inopnc-current-site')
    localStorage.removeItem('inopnc-temp-session')
    localStorage.removeItem('inopnc-last-auto-login')
    // console.log('✅ Cleared auto-login state from localStorage')
  }
  
  const disableAutoLogin = () => {
    localStorage.setItem('inopnc-auto-login-disabled', 'true')
    // console.log('🚫 Auto-login disabled')
  }
  
  const enableAutoLogin = () => {
    localStorage.removeItem('inopnc-auto-login-disabled')
    // console.log('✅ Auto-login enabled')
  }
  
  const checkSessionState = async () => {
    // console.log('🔍 Checking session state...')
    
    // Check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    // console.log('Session:', {
    //   exists: !!session,
    //   user: session?.user?.email,
    //   accessToken: session?.access_token ? 'Present' : 'Missing',
    //   error: sessionError?.message
    // })
    
    // Check user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    // console.log('User:', {
    //   exists: !!user,
    //   email: user?.email,
    //   id: user?.id,
    //   error: userError?.message
    // })
    
    // Check localStorage
    // console.log('LocalStorage:', {
    //   loginSuccess: localStorage.getItem('inopnc-login-success'),
    //   currentSite: localStorage.getItem('inopnc-current-site') ? 'Present' : 'Missing',
    //   autoLoginDisabled: localStorage.getItem('inopnc-auto-login-disabled'),
    //   lastAutoLogin: localStorage.getItem('inopnc-last-auto-login')
    // })
  }
  
  const forceSignOut = async () => {
    // console.log('🔄 Force signing out...')
    await supabase.auth.signOut()
    clearAutoLoginState()
    window.location.reload()
  }
  
  const refreshSession = async () => {
    // console.log('🔄 Refreshing session...')
    const { data, error } = await supabase.auth.refreshSession()
    if (error) {
      console.error('❌ Session refresh failed:', error)
    } else {
      // console.log('✅ Session refreshed:', data?.session?.user?.email)
    }
  }
  
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  
  return (
    <div className="fixed bottom-20 right-4 z-50 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-xs">
      <h3 className="text-sm font-bold mb-2">🔧 Debug Controls</h3>
      <div className="space-y-2">
        <button
          onClick={checkSessionState}
          className="w-full px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
        >
          Check Session State
        </button>
        <button
          onClick={refreshSession}
          className="w-full px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
        >
          Refresh Session
        </button>
        <button
          onClick={clearAutoLoginState}
          className="w-full px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs"
        >
          Clear Auto-Login State
        </button>
        <button
          onClick={disableAutoLogin}
          className="w-full px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
        >
          Disable Auto-Login
        </button>
        <button
          onClick={enableAutoLogin}
          className="w-full px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
        >
          Enable Auto-Login
        </button>
        <button
          onClick={forceSignOut}
          className="w-full px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
        >
          Force Sign Out
        </button>
      </div>
    </div>
  )
}