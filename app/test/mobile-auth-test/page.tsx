'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export default function MobileAuthTestPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    
    async function testAuth() {
      try {
        console.log('🔍 Testing authentication...')
        
        // Test 1: Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        console.log('User result:', { user: !!user, error: userError?.message })
        
        if (userError) {
          setError(`Auth Error: ${userError.message}`)
          setLoading(false)
          return
        }
        
        if (!user) {
          setError('No authenticated user found')
          setLoading(false)
          return
        }
        
        setUser(user)
        
        // Test 2: Get profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        console.log('Profile result:', { profile: !!profile, error: profileError?.message })
        
        if (profileError) {
          setError(`Profile Error: ${profileError.message}`)
        } else {
          setProfile(profile)
        }
        
      } catch (err) {
        console.error('Test error:', err)
        setError(`Test Error: ${err}`)
      } finally {
        setLoading(false)
      }
    }
    
    testAuth()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Testing authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Mobile Auth Test</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
          </div>
        )}
        
        {user && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">✅ User Authenticated</p>
            <p className="text-sm">ID: {user.id}</p>
            <p className="text-sm">Email: {user.email}</p>
          </div>
        )}
        
        {profile && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">✅ Profile Found</p>
            <p className="text-sm">Name: {profile.full_name}</p>
            <p className="text-sm">Role: {profile.role}</p>
            <p className="text-sm">Status: {profile.status}</p>
          </div>
        )}
        
        {user && profile && profile.role && ['worker', 'site_manager', 'customer_manager'].includes(profile.role) && (
          <div className="bg-purple-100 border border-purple-400 text-purple-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">🎯 Mobile Role Detected</p>
            <p className="text-sm">This user should see the new mobile UI</p>
            <a 
              href="/dashboard" 
              className="inline-block mt-2 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Go to Dashboard
            </a>
          </div>
        )}
        
        <div className="mt-6 space-y-2">
          <a 
            href="/auth/login" 
            className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Login Page
          </a>
          <a 
            href="/test/home-new" 
            className="block w-full text-center bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Test Home Component
          </a>
        </div>
      </div>
    </div>
  )
}