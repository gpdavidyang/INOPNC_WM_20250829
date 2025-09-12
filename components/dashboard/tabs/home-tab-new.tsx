'use client'

import React, { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Calendar, FileText, MapPin, FolderOpen, Users, HelpCircle,
  ChevronRight, Bell, Megaphone
} from 'lucide-react'

interface HomeTabProps {
  profile: Profile
  onTabChange?: (tabId: string) => void
  onDocumentsSearch?: (searchTerm: string) => void
  initialCurrentSite?: any
  initialSiteHistory?: any[]
}

interface QuickMenuItem {
  id: string
  name: string
  icon: React.ReactNode
  path: string
  bgColor: string
  iconColor: string
}

interface Notice {
  id: string
  title: string
  content: string
  createdAt: string
  type: 'announcement' | 'notice' | 'event'
}

export default function HomeTabNew({ profile, onTabChange }: HomeTabProps) {
  const router = useRouter()
  const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0)
  const [notices, setNotices] = useState<Notice[]>([])
  const [isNoticeHovered, setIsNoticeHovered] = useState(false)

  // Quick menu items - 6 items in one row
  const quickMenuItems: QuickMenuItem[] = [
    {
      id: 'attendance',
      name: '출력현황',
      icon: <Users className="w-6 h-6" />,
      path: '/dashboard/attendance',
      bgColor: 'bg-gradient-to-br from-blue-400 to-blue-500',
      iconColor: 'text-white'
    },
    {
      id: 'daily-reports',
      name: '작업일지',
      icon: <FileText className="w-6 h-6" />,
      path: '/dashboard/daily-reports',
      bgColor: 'bg-gradient-to-br from-green-400 to-green-500',
      iconColor: 'text-white'
    },
    {
      id: 'site-info',
      name: '현장정보',
      icon: <MapPin className="w-6 h-6" />,
      path: '/dashboard/site-info',
      bgColor: 'bg-gradient-to-br from-purple-400 to-purple-500',
      iconColor: 'text-white'
    },
    {
      id: 'documents',
      name: '문서함',
      icon: <FolderOpen className="w-6 h-6" />,
      path: '/dashboard/documents',
      bgColor: 'bg-gradient-to-br from-sky-400 to-sky-500',
      iconColor: 'text-white'
    },
    {
      id: 'salary',
      name: '본사요청',
      icon: <HelpCircle className="w-6 h-6" />,
      path: '/dashboard/requests',
      bgColor: 'bg-gradient-to-br from-violet-400 to-violet-500',
      iconColor: 'text-white'
    },
    {
      id: 'materials',
      name: '재고관리',
      icon: <Calendar className="w-6 h-6" />,
      path: '/dashboard/materials',
      bgColor: 'bg-gradient-to-br from-emerald-400 to-emerald-500',
      iconColor: 'text-white'
    }
  ]

  // Load notices
  useEffect(() => {
    loadNotices()
  }, [])

  // Auto-rotate notices
  useEffect(() => {
    if (notices.length > 0 && !isNoticeHovered) {
      const interval = setInterval(() => {
        setCurrentNoticeIndex((prev) => (prev + 1) % notices.length)
      }, 3000) // Rotate every 3 seconds

      return () => clearInterval(interval)
    }
  }, [notices, isNoticeHovered])

  const loadNotices = async () => {
    try {
      const supabase = createClient()
      
      // Load system notifications
      const { data: notifications } = await supabase
        .from('system_notifications')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5)

      if (notifications) {
        const formattedNotices: Notice[] = notifications.map(n => ({
          id: n.id,
          title: n.title,
          content: n.message,
          createdAt: n.created_at,
          type: n.type || 'announcement'
        }))
        setNotices(formattedNotices)
      }

      // If no notifications, use sample data
      if (!notifications || notifications.length === 0) {
        setNotices([
          { 
            id: '1', 
            title: '[이벤트] 신규 회원 대상 특별 혜택 이벤트 진행 중', 
            content: '신규 회원을 위한 특별 혜택을 확인하세요.',
            createdAt: new Date().toISOString(),
            type: 'event'
          },
          { 
            id: '2', 
            title: '[공지] 시스템 정기 점검 안내 (12/15 02:00-04:00)', 
            content: '시스템 점검 중에는 서비스 이용이 제한됩니다.',
            createdAt: new Date().toISOString(),
            type: 'announcement'
          },
          { 
            id: '3', 
            title: '[안내] 12월 급여명세서가 발행되었습니다', 
            content: '문서함에서 확인하실 수 있습니다.',
            createdAt: new Date().toISOString(),
            type: 'notice'
          }
        ])
      }
    } catch (error) {
      console.error('Failed to load notices:', error)
      // Use default notices on error
      setNotices([
        { 
          id: '1', 
          title: '[이벤트] 신규 회원 대상 특별 혜택 이벤트 진행 중', 
          content: '',
          createdAt: new Date().toISOString(),
          type: 'event'
        }
      ])
    }
  }

  const handleQuickMenuClick = (path: string) => {
    router.push(path)
  }

  const handleNoticeClick = () => {
    router.push('/dashboard/notifications')
  }

  return (
    <div className="space-y-4">
      {/* Quick Menu Section - 빠른메뉴 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-yellow-500 text-xl">⚡</span>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">빠른메뉴</h2>
        </div>
        
        {/* Quick menu grid - 6 items in one row */}
        <div className="grid grid-cols-6 gap-2">
          {quickMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleQuickMenuClick(item.path)}
              className="flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2 ${item.bgColor} shadow-lg`}>
                <div className={item.iconColor}>
                  {item.icon}
                </div>
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                {item.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Notice Section - 공지사항 (Rolling) */}
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm cursor-pointer"
        onClick={handleNoticeClick}
        onMouseEnter={() => setIsNoticeHovered(true)}
        onMouseLeave={() => setIsNoticeHovered(false)}
      >
        <div className="px-4 py-3 flex items-center justify-between group">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Megaphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            
            {/* Rolling notice text */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="relative h-5">
                {notices.map((notice, index) => (
                  <div
                    key={notice.id}
                    className={`absolute inset-0 transition-all duration-500 ${
                      index === currentNoticeIndex 
                        ? 'opacity-100 transform translate-y-0' 
                        : index < currentNoticeIndex 
                          ? 'opacity-0 transform -translate-y-full'
                          : 'opacity-0 transform translate-y-full'
                    }`}
                  >
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {notice.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors flex-shrink-0" />
        </div>
        
        {/* Notice indicators */}
        {notices.length > 1 && (
          <div className="px-4 pb-2 flex justify-center gap-1">
            {notices.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index === currentNoticeIndex 
                    ? 'w-4 bg-blue-500' 
                    : 'w-1 bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Additional sections can be added here */}
      {/* 현장 정보, 최근 활동 등 */}
    </div>
  )
}