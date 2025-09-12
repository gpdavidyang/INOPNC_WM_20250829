'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Home, Calendar, FileText, FolderOpen, User as UserIcon, MapPin, Building } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useNavigation } from './navigation-context'

interface NavigationTab {
  id: string
  label: string
  icon: React.ReactNode
  path: string
  roles?: string[]
}

const navigationTabs: NavigationTab[] = [
  {
    id: 'home',
    label: '홈',
    icon: <Home className="h-5 w-5" />,
    path: '/dashboard'
  },
  {
    id: 'daily-reports',
    label: '출력보고',
    icon: <FileText className="h-5 w-5" />,
    path: '/dashboard/daily-reports'
  },
  {
    id: 'attendance',
    label: '출퇴근',
    icon: <Calendar className="h-5 w-5" />,
    path: '/dashboard/attendance'
  },
  {
    id: 'documents',
    label: '문서함',
    icon: <FolderOpen className="h-5 w-5" />,
    path: '/dashboard/documents'
  },
  {
    id: 'site-info',
    label: '현장정보',
    icon: <MapPin className="h-5 w-5" />,
    path: '/dashboard/site-info',
    roles: ['worker', 'site_manager']
  },
  {
    id: 'site-info-card',
    label: '현장카드',
    icon: <Building className="h-5 w-5" />,
    path: '/dashboard/site-info-card',
    roles: ['worker', 'site_manager', 'admin', 'system_admin']
  },
  {
    id: 'profile',
    label: '프로필',
    icon: <UserIcon className="h-5 w-5" />,
    path: '/dashboard/profile'
  }
]

interface NavigationTabsProps {
  className?: string
  userRole?: string
  orientation?: 'horizontal' | 'vertical'
}

export function NavigationTabs({ 
  className, 
  userRole,
  orientation = 'horizontal' 
}: NavigationTabsProps) {
  const router = useRouter()
  const { activeTab } = useNavigation()

  const handleTabClick = (tab: NavigationTab) => {
    router.push(tab.path)
  }

  const filteredTabs = navigationTabs.filter(tab => {
    if (!tab.roles) return true
    return tab.roles.includes(userRole || '')
  })

  return (
    <div className={cn(
      'flex gap-2',
      orientation === 'vertical' ? 'flex-col' : 'flex-row',
      className
    )}>
      {filteredTabs.map((tab) => (
        <Button
          key={tab.id}
          variant={activeTab === tab.id ? 'default' : 'ghost'}
          onClick={() => handleTabClick(tab)}
          className={cn(
            'flex items-center gap-2',
            orientation === 'vertical' && 'justify-start w-full'
          )}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </Button>
      ))}
    </div>
  )
}