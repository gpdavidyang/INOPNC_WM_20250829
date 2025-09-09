'use client'

import React, { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FileText, Calendar, MapPin, FolderOpen, 
  Megaphone, ChevronDown, ChevronUp, Settings,
  X, Check, GripVertical, ArrowUp, ArrowDown, Plus
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import PartnerLaborHoursSummary from '../cards/PartnerLaborHoursSummary'
import PartnerSiteLaborCard from '../cards/PartnerSiteLaborCard'

interface PartnerHomeTabProps {
  profile: Profile
  sites: any[]
  organization: any
  onTabChange?: (tab: string) => void
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

interface Announcement {
  id: string
  title: string
  content: string
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  isRead: boolean
}

export default function PartnerHomeTab({ profile, sites, organization, onTabChange }: PartnerHomeTabProps) {
  const router = useRouter()
  const [announcementExpanded, setAnnouncementExpanded] = useState(false)
  const [quickMenuSettingsOpen, setQuickMenuSettingsOpen] = useState(false)
  const [selectedQuickMenuItems, setSelectedQuickMenuItems] = useState<string[]>([
    'print-status', 'work-logs', 'site-info', 'documents'
  ])
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)
  
  // Labor data states
  const [laborStats, setLaborStats] = useState<any>({})
  const [laborSites, setLaborSites] = useState<any[]>([])
  const [laborPeriod, setLaborPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
  const [laborLoading, setLaborLoading] = useState(true)

  // 빠른메뉴 사용 가능한 모든 항목들
  const availableQuickMenuItems: QuickMenuItem[] = [
    {
      id: 'print-status',
      name: '출력현황',
      icon: <Calendar className="h-5 w-5" />,
      path: '#print-status',
      color: 'text-blue-600 dark:text-blue-400',
      backgroundColor: 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800',
      description: '출력 현황 확인'
    },
    {
      id: 'work-logs',
      name: '작업일지',
      icon: <FileText className="h-5 w-5" />,
      path: '#work-logs',
      color: 'text-green-600 dark:text-green-400',
      backgroundColor: 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border-green-200 dark:border-green-800',
      description: '작업일지 조회'
    },
    {
      id: 'site-info',
      name: '현장정보',
      icon: <MapPin className="h-5 w-5" />,
      path: '#site-info',
      color: 'text-purple-600 dark:text-purple-400',
      backgroundColor: 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-800',
      description: '현장 세부 정보'
    },
    {
      id: 'documents',
      name: '문서함',
      icon: <FolderOpen className="h-5 w-5" />,
      path: '#documents',
      color: 'text-amber-600 dark:text-amber-400',
      backgroundColor: 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 border-amber-200 dark:border-amber-800',
      description: '문서 관리'
    }
  ]

  // Mock announcements
  const announcements: Announcement[] = [
    {
      id: '1',
      title: '3월 정산 마감 안내',
      content: '3월 정산 서류를 3월 25일까지 제출해 주시기 바랍니다.',
      priority: 'high',
      createdAt: '2024-03-18',
      isRead: false
    },
    {
      id: '2',
      title: '안전 관리 교육 일정',
      content: '4월 첫째 주 안전 관리 교육이 예정되어 있습니다.',
      priority: 'medium',
      createdAt: '2024-03-17',
      isRead: false
    }
  ]

  const handleQuickMenuClick = (item: QuickMenuItem) => {
    if (item.path.startsWith('#')) {
      // Handle tab change for internal navigation
      const tabId = item.path.substring(1)
      onTabChange?.(tabId)
    } else {
      // Handle external navigation
      router.push(item.path)
    }
  }

  const toggleQuickMenuItem = (itemId: string) => {
    setSelectedQuickMenuItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId)
      } else if (prev.length < 5) {
        return [...prev, itemId]
      }
      return prev
    })
  }

  const moveItem = (itemId: string, direction: 'up' | 'down') => {
    const index = selectedQuickMenuItems.indexOf(itemId)
    if (index === -1) return

    const newItems = [...selectedQuickMenuItems]
    if (direction === 'up' && index > 0) {
      [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]]
    } else if (direction === 'down' && index < newItems.length - 1) {
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]]
    }
    setSelectedQuickMenuItems(newItems)
  }

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML)
    setDraggedItem(itemId)
  }

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    if (e.preventDefault) {
      e.preventDefault()
    }
    e.dataTransfer.dropEffect = 'move'
    
    if (draggedItem && draggedItem !== itemId) {
      setDragOverItem(itemId)
    }
    return false
  }

  const handleDragLeave = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement
    const relatedTarget = e.relatedTarget as HTMLElement
    
    // Only clear if we're actually leaving the element
    if (!target.contains(relatedTarget)) {
      setDragOverItem(null)
    }
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    if (e.stopPropagation) {
      e.stopPropagation()
    }
    e.preventDefault()
    
    if (!draggedItem || draggedItem === targetId) {
      setDraggedItem(null)
      setDragOverItem(null)
      return false
    }

    const newItems = [...selectedQuickMenuItems]
    const draggedIndex = newItems.indexOf(draggedItem)
    const targetIndex = newItems.indexOf(targetId)

    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Remove dragged item and insert at target position
      const [removed] = newItems.splice(draggedIndex, 1)
      newItems.splice(targetIndex, 0, removed)
      setSelectedQuickMenuItems(newItems)
    }

    setDraggedItem(null)
    setDragOverItem(null)
    return false
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverItem(null)
  }

  // Fetch labor data
  useEffect(() => {
    fetchLaborData()
  }, [laborPeriod])

  const fetchLaborData = async () => {
    try {
      setLaborLoading(true)

      const [summaryRes, sitesRes] = await Promise.all([
        fetch(`/api/partner/labor/summary?period=${laborPeriod}`, { cache: 'no-store' }),
        fetch(`/api/partner/labor/by-site?period=${laborPeriod}`, { cache: 'no-store' })
      ])

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json()
        setLaborStats(summaryData)
      }

      if (sitesRes.ok) {
        const sitesData = await sitesRes.json()
        setLaborSites(sitesData.sites || [])
      }
    } catch (error) {
      console.error('Failed to fetch labor data:', error)
    } finally {
      setLaborLoading(false)
    }
  }

  const handlePeriodChange = (period: 'daily' | 'weekly' | 'monthly') => {
    setLaborPeriod(period)
  }

  const handleSiteClick = (siteId: string) => {
    router.push(`/partner/sites/${siteId}`)
  }

  return (
    <div className="space-y-4">
      {/* Labor Hours Summary */}
      <div className="mb-6">
        {laborLoading ? (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-gray-500 dark:text-gray-400">공수 데이터 로딩 중...</p>
          </div>
        ) : (
          <PartnerLaborHoursSummary 
            stats={laborStats}
            period={laborPeriod}
            onPeriodChange={handlePeriodChange}
          />
        )}
      </div>

      {/* Site Labor Cards */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          🏗️ 현장별 공수 현황
        </h3>
        
        {laborLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">현장 공수 정보를 불러오는 중...</p>
          </div>
        ) : laborSites.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {laborSites.map((site) => (
              <PartnerSiteLaborCard 
                key={site.id} 
                site={site} 
                onClick={() => handleSiteClick(site.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <p className="text-gray-500 dark:text-gray-400 mb-2">공수 데이터가 없습니다</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">현장에서 작업이 시작되면 데이터가 표시됩니다</p>
          </div>
        )}
      </div>

      {/* 작업일지 조회 버튼 섹션 */}
      <Card 
        className="bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 border-0 shadow-lg hover:shadow-xl transition-all duration-200 mb-6"
        aria-labelledby="work-log-section"
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 id="work-log-section" className="text-white font-semibold text-sm whitespace-nowrap">
                📋 작업일지 포털
              </h2>
              <p className="text-white/90 text-xs mt-0.5 whitespace-nowrap">
                작업일지를 조회해 보세요
              </p>
            </div>
            <button
              onClick={() => onTabChange?.('work-logs')}
              className="flex items-center gap-1 px-3 py-1.5 bg-white/95 hover:bg-white text-green-600 text-xs font-medium rounded-lg transition-colors touch-manipulation focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-green-600 shadow-sm ml-2"
              aria-label="작업일지 조회하기"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="whitespace-nowrap">작업일지 조회</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 빠른메뉴 섹션 - High Contrast Design */}
      <Card 
        variant="elevated"
        elevation="md"
        className="transition-all duration-200"
        aria-labelledby="quick-menu-section"
      >
        <CardHeader className="pb-3 pt-4 px-4 border-b border-gray-200 dark:border-slate-600">
          <div className="flex items-center justify-between">
            <CardTitle id="quick-menu-section" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              빠른메뉴
            </CardTitle>
            <button
              onClick={() => setQuickMenuSettingsOpen(!quickMenuSettingsOpen)}
              className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              aria-label="빠른메뉴 설정"
            >
              <Settings className="h-3 w-3" aria-hidden="true" />
              <span>설정</span>
            </button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-3 pb-4 px-4">
          {!quickMenuSettingsOpen ? (
            <nav aria-label="빠른메뉴 항목">
              <ul className="grid grid-cols-2 gap-3" role="list">
                {selectedQuickMenuItems.map(itemId => {
                  const item = availableQuickMenuItems.find(i => i.id === itemId)
                  if (!item) return null
                  
                  return (
                    <li key={item.id} role="none">
                      <button
                        onClick={() => handleQuickMenuClick(item)}
                        className={`w-full flex flex-col items-center py-4 px-3 ${item.backgroundColor} rounded-xl transition-all duration-200 active:scale-[0.98] touch-manipulation focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 min-h-[72px] shadow-sm hover:shadow-md group`}
                        aria-label={`${item.name} - ${item.description}`}
                        role="menuitem"
                      >
                        <div className={`mb-2 p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm group-hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-slate-600 ${item.color}`} aria-hidden="true">
                          {React.cloneElement(item.icon as React.ReactElement, {
                            className: "h-5 w-5",
                            strokeWidth: 2
                          })}
                        </div>
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{item.name}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>
          ) : null}
        </CardContent>
      </Card>

      {/* Quick Menu Settings Modal - Same as Manager */}
      {quickMenuSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card elevation="lg" className="w-full max-w-md max-h-[80vh] overflow-hidden theme-transition">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">빠른메뉴 설정</CardTitle>
                <button
                  onClick={() => setQuickMenuSettingsOpen(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors theme-transition"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                원하는 빠른메뉴 항목을 선택하고 드래그하여 순서를 변경하세요. (최대 5개)
              </p>
              
              {/* Selected Items with Drag & Drop */}
              {selectedQuickMenuItems.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">선택된 메뉴</h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">드래그 또는 화살표로 순서 변경</span>
                  </div>
                  <div className="space-y-2">
                    {selectedQuickMenuItems.map((itemId, index) => {
                      const item = availableQuickMenuItems.find(i => i.id === itemId)
                      if (!item) return null
                      
                      return (
                        <div
                          key={item.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, item.id)}
                          onDragOver={(e) => handleDragOver(e, item.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, item.id)}
                          onDragEnd={handleDragEnd}
                          className={`flex items-center p-3 rounded-lg border-2 transition-all cursor-move select-none ${
                            dragOverItem === item.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105'
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                          } ${draggedItem === item.id ? 'opacity-50' : ''}`}
                        >
                          <GripVertical className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                          <div className={`mr-3 ${item.color} flex-shrink-0`}>
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {index + 1}. {item.name}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => moveItem(item.id, 'up')}
                              disabled={index === 0}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="위로 이동"
                            >
                              <ArrowUp className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                            </button>
                            <button
                              onClick={() => moveItem(item.id, 'down')}
                              disabled={index === selectedQuickMenuItems.length - 1}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="아래로 이동"
                            >
                              <ArrowDown className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                            </button>
                            <button
                              onClick={() => toggleQuickMenuItem(item.id)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                              aria-label="제거"
                            >
                              <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              
              {/* Available Items */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">사용 가능한 메뉴</h4>
                <div className="space-y-2">
                  {availableQuickMenuItems
                    .filter(item => !selectedQuickMenuItems.includes(item.id))
                    .map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center p-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer"
                      onClick={() => {
                        if (selectedQuickMenuItems.length < 5) {
                          toggleQuickMenuItem(item.id)
                        }
                      }}
                    >
                      <div className={`mr-2 ${item.color} flex-shrink-0`}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {item.description}
                        </p>
                      </div>
                      <Plus className="h-4 w-4 text-gray-400 dark:text-gray-500 ml-3" />
                    </div>
                  ))}
                </div>
              </div>

              {selectedQuickMenuItems.length >= 5 && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                  최대 5개까지 선택할 수 있습니다.
                </p>
              )}
            </CardContent>
            
            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedQuickMenuItems.length}/5 선택됨
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setQuickMenuSettingsOpen(false)}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors theme-transition"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    // Save to localStorage
                    localStorage.setItem('partnerQuickMenuItems', JSON.stringify(selectedQuickMenuItems))
                    setQuickMenuSettingsOpen(false)
                  }}
                  className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors theme-transition"
                >
                  저장
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 공지사항 섹션 - High Contrast Design */}
      <Card variant="elevated" elevation="md" className="overflow-hidden transition-all duration-200">
        <button
          onClick={() => setAnnouncementExpanded(!announcementExpanded)}
          className="w-full px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">공지사항</h3>
              {announcements.filter(a => !a.isRead).length > 0 && (
                <span className="px-2 py-0.5 bg-red-500/90 text-white text-sm font-medium rounded-full shadow-sm">
                  {announcements.filter(a => !a.isRead).length}
                </span>
              )}
            </div>
            {announcementExpanded ? (
              <ChevronUp className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            )}
          </div>
        </button>
        
        {announcementExpanded && (
          <div className="divide-y divide-gray-200 dark:divide-slate-600 animate-in slide-in-from-top-1 duration-200">
            {announcements.map(announcement => (
              <div key={announcement.id} className="p-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors theme-transition">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {announcement.title}
                    </h4>
                    <span className={`px-1.5 py-0.5 text-sm rounded-full ${
                      announcement.priority === 'high' 
                        ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                        : announcement.priority === 'medium'
                        ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                        : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    }`}>
                      {announcement.priority === 'high' ? '긴급' : 
                       announcement.priority === 'medium' ? '중요' : '일반'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {announcement.createdAt}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{announcement.content}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}