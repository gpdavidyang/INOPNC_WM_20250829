'use client'

import { useState, useRef, useEffect } from 'react'
import { Profile } from '@/types'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ProfileDropdownProps {
  profile: Profile
}

export function ProfileDropdown({ profile }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    try {
      // Close dropdown immediately
      setIsOpen(false)
      
      // Add loading indicator or disable buttons to prevent multiple clicks
      
      // Sign out from Supabase with scope to clear all sessions
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
      }
      
      // Clear any local storage or session storage
      if (typeof window !== 'undefined') {
        try {
          // Clear our specific localStorage items first
          localStorage.removeItem('inopnc-login-success')
          localStorage.removeItem('inopnc-current-site')
          console.log('🗑️ [LOGOUT] Cleared INOPNC localStorage data')
          
          // Then clear everything else
          localStorage.clear()
          sessionStorage.clear()
          
          // Clear all cookies completely - more comprehensive approach
          const cookies = document.cookie.split(";")
          for (let cookie of cookies) {
            const eqPos = cookie.indexOf("=")
            const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie
            const cleanName = name.trim()
            
            // Clear with all possible domain and path combinations
            const domains = ['', 'localhost', '.localhost', window.location.hostname, `.${window.location.hostname}`]
            const paths = ['/', '/auth', '/dashboard']
            
            domains.forEach(domain => {
              paths.forEach(path => {
                if (domain) {
                  document.cookie = `${cleanName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};domain=${domain}`
                } else {
                  document.cookie = `${cleanName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`
                }
              })
            })
          }
        } catch (storageError) {
          console.warn('Error clearing storage:', storageError)
        }
      }
      
      // Add small delay to ensure logout completes
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Force page reload and redirect
      window.location.replace('/auth/login')
      
    } catch (error) {
      console.error('Logout failed:', error)
      // Force hard redirect regardless of error
      window.location.replace('/auth/login')
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="h-7 w-7 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
            {profile.full_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
          </span>
        </div>
        <ChevronDown className={`h-3 w-3 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-gray-200 dark:ring-gray-700 z-50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {profile.full_name || '사용자'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {profile.email}
            </p>
          </div>
          
          <div className="py-1">
            <button
              onClick={() => {
                router.push('/dashboard/profile')
                setIsOpen(false)
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Settings className="h-4 w-4" />
              프로필 및 설정
            </button>
            
            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
            
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  )
}