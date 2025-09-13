'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import DocumentsTabNew from '@/components/dashboard/tabs/documents-tab-new'

export default function DocumentsPage() {
  const searchParams = useSearchParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Get tab from query params
  const tab = searchParams.get('tab') as 'personal' | 'shared' | 'markup' | 'required' | null
  const search = searchParams.get('search')
  
  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profileData) {
          setProfile(profileData)
        }
      }
      setLoading(false)
    }
    
    loadProfile()
  }, [])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">문서함을 불러오는 중...</p>
        </div>
      </div>
    )
  }
  
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">프로필을 찾을 수 없습니다.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="w-full">
      <DocumentsTabNew />
    </div>
  )
}