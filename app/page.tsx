'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  
  useEffect(() => {
    // Check authentication status before redirecting
    const checkAuthAndRedirect = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        // Only redirect to dashboard if authenticated
        // Otherwise, let middleware handle the redirect to login
        if (session?.user) {
          router.push('/dashboard')
        } else {
          // Redirect to login page
          router.push('/auth/login')
        }
      } catch (error) {
        // On error, redirect to login
        router.push('/auth/login')
      } finally {
        setIsChecking(false)
      }
    }
    
    checkAuthAndRedirect()
  }, [router])
  
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }
  
  return null
}