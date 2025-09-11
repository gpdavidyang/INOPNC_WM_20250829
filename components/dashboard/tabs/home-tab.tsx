'use client'

import React, { useState, useEffect, useCallback, memo, useMemo } from 'react'
import { Profile, UserSiteHistory } from '@/types'
import { NotificationExtended } from '@/types/notifications'
import { createClient } from '@/lib/supabase/client'
import SimpleSiteInfo from '@/components/site-info/SimpleSiteInfo'
import { useFontSize, getTypographyClass, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { useNotifications } from '@/hooks/use-notifications'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useNewDesign, FeatureFlag } from '@/lib/feature-flags'
import { 
  Calendar, FileText, MapPin, FolderOpen, 
  Edit3, ChevronDown, ChevronUp, Phone, Copy, Navigation,
  Building2, Megaphone, Settings, X, Check, Users, BarChart3,
  ClipboardList, Bell, MessageSquare, DollarSign, HardHat, Plus, GripVertical,
  ArrowUp, ArrowDown
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface HomeTabProps {
  profile: Profile
  onTabChange?: (tabId: string) => void
  onDocumentsSearch?: (searchTerm: string) => void
  initialCurrentSite?: any
  initialSiteHistory?: any[]
}

interface Announcement {
  id: string
  title: string
  content: string
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  isRead: boolean
}

interface QuickMenuItem {
  id: string
  name: string
  icon: React.ReactNode
  path: string
  color: string
  backgroundColor: string
  description: string
}

function HomeTab({ profile, onTabChange, onDocumentsSearch, initialCurrentSite, initialSiteHistory }: HomeTabProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const newDesign = useNewDesign()
  const [siteInfoExpanded, setSiteInfoExpanded] = useState(false)
  const [announcementExpanded, setAnnouncementExpanded] = useState(false)
  const [siteHistoryExpanded, setSiteHistoryExpanded] = useState(false)
  const [recentActivitiesExpanded, setRecentActivitiesExpanded] = useState(false)
  const [quickMenuSettingsOpen, setQuickMenuSettingsOpen] = useState(false)
  // 빠른메뉴 기본 설정: 출력현황, 작업일지, 현장정보, 문서함
  const [selectedQuickMenuItems, setSelectedQuickMenuItems] = useState<string[]>([
    'attendance', 'daily-reports', 'site-info', 'documents'
  ])
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)
  
  // Simplified states
  const [siteHistory, setSiteHistory] = useState<UserSiteHistory[]>(initialSiteHistory || [])
  
  // 알림 관리 훅 사용
  const { 
    notifications, 
    loading: notificationsLoading, 
    markAsRead, 
    getUnreadCount 
  } = useNotifications({
    limit: 5,
    showReadNotifications: true,
    userId: profile.id
  })
  
  // 빠른메뉴 사용 가능한 모든 항목들
  const availableQuickMenuItems: QuickMenuItem[] = [
    {
      id: 'attendance',
      name: '출력현황',
      icon: newDesign ? 
        <Image src="/images/brand/출력현황.png" alt="출력현황" width={40} height={40} className="h-10 w-10" /> :
        <Calendar className="h-5 w-5" />,
      path: '/dashboard/attendance',
      color: 'text-blue-600 dark:text-blue-400',
      backgroundColor: 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800',
      description: '출력 및 근무 현황 확인'
    },
    {
      id: 'daily-reports',
      name: '작업일지',
      icon: newDesign ? 
        <Image src="/images/brand/작업일지.png" alt="작업일지" width={40} height={40} className="h-10 w-10" /> :
        <FileText className="h-5 w-5" />,
      path: '/dashboard/daily-reports',
      color: 'text-green-600 dark:text-green-400',
      backgroundColor: 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border-green-200 dark:border-green-800',
      description: '일일 작업 보고서'
    },
    {
      id: 'site-info',
      name: '현장정보',
      icon: newDesign ? 
        <Image src="/images/brand/현장정보.png" alt="현장정보" width={40} height={40} className="h-10 w-10" /> :
        <MapPin className="h-5 w-5" />,
      path: '/dashboard/site-info',
      color: 'text-purple-600 dark:text-purple-400',
      backgroundColor: 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-800',
      description: '현장 상세 정보'
    },
    {
      id: 'documents',
      name: '문서함',
      icon: newDesign ? 
        <Image src="/images/brand/문서함.png" alt="문서함" width={40} height={40} className="h-10 w-10" /> :
        <FolderOpen className="h-5 w-5" />,
      path: '/dashboard/documents',
      color: 'text-orange-600 dark:text-orange-400',
      backgroundColor: 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 border-orange-200 dark:border-orange-800',
      description: '현장 관련 문서'
    },
    {
      id: 'materials',
      name: '자재관리',
      icon: newDesign ? 
        <Image src="/images/brand/재고관리.png" alt="재고관리" width={40} height={40} className="h-10 w-10" /> :
        <ClipboardList className="h-5 w-5" />,
      path: '/dashboard/materials',
      color: 'text-indigo-600 dark:text-indigo-400',
      backgroundColor: 'bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800',
      description: '자재 재고 및 요청'
    },
    {
      id: 'notifications',
      name: '알림',
      icon: newDesign ? 
        <Image src="/images/brand/bell.png" alt="알림" width={40} height={40} className="h-10 w-10" /> :
        <Bell className="h-5 w-5" />,
      path: '/dashboard/notifications',
      color: 'text-red-600 dark:text-red-400',
      backgroundColor: 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border-red-200 dark:border-red-800',
      description: '중요 알림 및 공지'
    }
  ]

  const router = useRouter()

  // 공지사항 클릭 핸들러
  const handleAnnouncementClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }
  }

  useEffect(() => {
    // Load saved quick menu settings
    const savedItems = localStorage.getItem('quickMenuItems')
    if (savedItems) {
      try {
        setSelectedQuickMenuItems(JSON.parse(savedItems))
      } catch (e) {
        console.error('Error loading quick menu settings:', e)
      }
    }
  }, [])

  // Quick menu management functions
  const toggleQuickMenuItem = (itemId: string) => {
    setSelectedQuickMenuItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId)
      } else {
        return [...prev, itemId]
      }
    })
  }

  const getSelectedQuickMenuItems = () => {
    return selectedQuickMenuItems
      .map(id => availableQuickMenuItems.find(item => item.id === id))
      .filter((item): item is QuickMenuItem => item !== undefined)
  }

  const saveQuickMenuSettings = () => {
    localStorage.setItem('quickMenuItems', JSON.stringify(selectedQuickMenuItems))
    setQuickMenuSettingsOpen(false)
  }

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML)
    setDraggedItem(itemId)
  }

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    if (draggedItem && draggedItem !== itemId) {
      setDragOverItem(itemId)
    }
  }

  const handleDragLeave = () => {
    setDragOverItem(null)
  }

  const handleDrop = (e: React.DragEvent, dropItemId: string) => {
    e.preventDefault()
    
    if (!draggedItem || draggedItem === dropItemId) {
      setDraggedItem(null)
      setDragOverItem(null)
      return
    }

    const draggedIndex = selectedQuickMenuItems.indexOf(draggedItem)
    const dropIndex = selectedQuickMenuItems.indexOf(dropItemId)
    
    if (draggedIndex !== -1 && dropIndex !== -1) {
      const newItems = [...selectedQuickMenuItems]
      newItems.splice(draggedIndex, 1)
      newItems.splice(dropIndex, 0, draggedItem)
      setSelectedQuickMenuItems(newItems)
    }
    
    setDraggedItem(null)
    setDragOverItem(null)
  }

  const moveQuickMenuItem = (itemId: string, direction: 'up' | 'down') => {
    const currentIndex = selectedQuickMenuItems.indexOf(itemId)
    if (currentIndex === -1) return
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= selectedQuickMenuItems.length) return
    
    const newItems = [...selectedQuickMenuItems]
    const temp = newItems[currentIndex]
    newItems[currentIndex] = newItems[newIndex]
    newItems[newIndex] = temp
    setSelectedQuickMenuItems(newItems)
  }

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
      case 'low': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  return (
    <div className="space-y-4">
      {/* Work Log Creation Button - Primary CTA */}
      {(profile.role === 'worker' || profile.role === 'site_manager') && (
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 border-0 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-semibold text-sm whitespace-nowrap">
                  작업일지 작성
                </h2>
                <p className="text-white/90 text-xs mt-0.5 whitespace-nowrap">오늘의 작업 내용을 기록하세요</p>
              </div>
              <button
                onClick={() => router.push('/dashboard/daily-reports/new')}
                className="flex items-center gap-1 px-3 py-1.5 bg-white/95 hover:bg-white text-blue-600 text-xs font-medium rounded-lg transition-colors touch-manipulation focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600 shadow-sm ml-2"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="whitespace-nowrap">새 작업일지</span>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Menu Section */}
      <Card variant={newDesign ? "work-card" : "elevated"} elevation="md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">빠른메뉴</CardTitle>
            <button
              onClick={() => setQuickMenuSettingsOpen(!quickMenuSettingsOpen)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {quickMenuSettingsOpen ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                표시할 메뉴를 선택하고 드래그하여 순서를 변경하세요
              </p>
              <div className="space-y-2">
                {availableQuickMenuItems.map((item) => {
                  const isSelected = selectedQuickMenuItems.includes(item.id)
                  const selectedIndex = selectedQuickMenuItems.indexOf(item.id)
                  
                  return (
                    <div
                      key={item.id}
                      draggable={isSelected}
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      onDragOver={(e) => handleDragOver(e, item.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, item.id)}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border transition-all
                        ${isSelected 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' 
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}
                        ${dragOverItem === item.id ? 'border-blue-500 dark:border-blue-400' : ''}
                        ${isSelected ? 'cursor-move' : 'cursor-pointer'}
                      `}
                      onClick={() => !isSelected && toggleQuickMenuItem(item.id)}
                    >
                      {isSelected && (
                        <GripVertical className="h-4 w-4 text-gray-400" />
                      )}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleQuickMenuItem(item.id)}
                        className="rounded border-gray-300 dark:border-gray-600"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className={item.color}>{item.icon}</div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {item.description}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              moveQuickMenuItem(item.id, 'up')
                            }}
                            disabled={selectedIndex === 0}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              moveQuickMenuItem(item.id, 'down')
                            }}
                            disabled={selectedIndex === selectedQuickMenuItems.length - 1}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={saveQuickMenuSettings}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  저장
                </button>
                <button
                  onClick={() => setQuickMenuSettingsOpen(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium text-sm transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {getSelectedQuickMenuItems().map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    // FIXED: Use direct navigation for all items to prevent circular state updates
                    router.push(item.path)
                    
                    // Only handle documents search if it's the documents item
                    if (item.id === 'documents' && onDocumentsSearch) {
                      onDocumentsSearch('')  // 검색 초기화
                    }
                  }}
                  className={`
                    flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200
                    ${newDesign ? 'border-[var(--work-card-border)] hover:border-[var(--accent)] hover:bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-700' : item.backgroundColor}
                    hover:scale-105 hover:shadow-md
                    ${touchMode === 'glove' ? 'min-h-[100px]' : touchMode === 'precision' ? 'min-h-[70px]' : 'min-h-[80px]'}
                  `}
                >
                  <div className={`${item.color} ${newDesign ? 'w-10 h-10' : ''}`}>{item.icon}</div>
                  <span className={`${getTypographyClass('sm', isLargeFont)} font-medium mt-2 ${item.color}`}>
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SimpleSiteInfo Component */}
      <SimpleSiteInfo 
        userId={profile.id}
        userRole={profile.role}
      />

      {/* Announcements Section */}
      {notifications.length > 0 && (
        <Card>
          <button
            onClick={() => setAnnouncementExpanded(!announcementExpanded)}
            className="w-full px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Megaphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className={`${getTypographyClass('base', isLargeFont)} font-semibold`}>
                  공지사항
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {getUnreadCount()}개 미읽음
                </span>
              </div>
              {announcementExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </button>
          {announcementExpanded && (
            <CardContent className="pt-0 space-y-2">
              {notificationsLoading ? (
                <div className="text-center py-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">로딩 중...</span>
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleAnnouncementClick(notification)}
                    className={`w-full p-3 rounded-lg border text-left transition-all hover:scale-[1.01] ${
                      notification.is_read 
                        ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60' 
                        : 'bg-white dark:bg-gray-900 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/10'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`${getTypographyClass('sm', isLargeFont)} font-medium ${!notification.is_read ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                            {notification.title}
                          </h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(notification.priority)}`}>
                            {notification.priority === 'high' ? '긴급' : 
                             notification.priority === 'medium' ? '중요' : '일반'}
                          </span>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className={`${getTypographyClass('xs', isLargeFont)} text-gray-600 dark:text-gray-400 mt-1`}>
                          {notification.message}
                        </p>
                        <p className={`${getTypographyClass('xs', isLargeFont)} text-gray-500 dark:text-gray-500 mt-1`}>
                          {notification.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Site History Section */}
      {siteHistory.length > 0 && (
        <Card>
          <button
            onClick={() => setSiteHistoryExpanded(!siteHistoryExpanded)}
            className="w-full px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold">현장 참여 이력</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {siteHistory.length}개 현장
                </span>
              </div>
              {siteHistoryExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </button>
          {siteHistoryExpanded && (
            <CardContent className="pt-0">
              <div className="space-y-2">
                {siteHistory.map((history, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`${getTypographyClass('sm', isLargeFont)} font-medium`}>
                          {history.site_name}
                        </p>
                        <p className={`${getTypographyClass('xs', isLargeFont)} text-gray-500 dark:text-gray-400`}>
                          {history.site_address}
                        </p>
                        <p className={`${getTypographyClass('xs', isLargeFont)} text-gray-500 dark:text-gray-400 mt-1`}>
                          {history.assigned_date} ~ {history.unassigned_date || '현재'}
                        </p>
                      </div>
                      {history.is_active && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                          현재 근무중
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}

export default memo(HomeTab)