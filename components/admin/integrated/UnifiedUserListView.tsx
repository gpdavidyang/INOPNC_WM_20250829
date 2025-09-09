'use client'

import { useState, useEffect } from 'react'
import UserManagement from '@/components/admin/UserManagement'
import { getProfile } from '@/app/actions/profile'
import type { Profile } from '@/types'

export default function UnifiedUserListView() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isCancelled = false
    
    const loadProfile = async () => {
      try {
        const result = await getProfile()
        if (!isCancelled && result.success && result.data) {
          setProfile(result.data)
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to load profile:', error)
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }
    
    loadProfile()
    
    return () => {
      isCancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">프로필을 불러올 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">사용자 통합뷰</h1>
        <p className="text-gray-600 mt-1">모든 사용자 계정을 통합 관리합니다.</p>
      </div>
      
      <UserManagement profile={profile} />
    </div>
  )
}