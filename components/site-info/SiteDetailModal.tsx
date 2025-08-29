'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  MapPin, 
  Calendar, 
  Phone, 
  Home, 
  User, 
  Shield, 
  Clock,
  Building2,
  FileText,
  Download,
  Copy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { UserSiteHistory } from '@/types'
import { TMap } from '@/lib/external-apps'

interface SiteDetailModalProps {
  isOpen: boolean
  onClose: () => void
  siteData: UserSiteHistory | null
  onSelectCurrentSite?: () => void
}

export default function SiteDetailModal({ 
  isOpen, 
  onClose, 
  siteData, 
  onSelectCurrentSite 
}: SiteDetailModalProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Mobile swipe-to-close functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setStartY(e.touches[0].clientY)
    setCurrentY(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    setCurrentY(e.touches[0].clientY)
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    
    const deltaY = currentY - startY
    const threshold = 100 // Minimum swipe distance to close
    
    if (deltaY > threshold) {
      onClose()
    }
    
    setIsDragging(false)
    setStartY(0)
    setCurrentY(0)
  }

  // Copy to clipboard function
  const copyToClipboard = async (text: string, field: string) => {
    try {
      // Modern clipboard API (HTTPS/localhost only)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        setCopiedField(field)
        setTimeout(() => setCopiedField(null), 2000)
      } else {
        // Fallback method for older browsers or non-secure contexts
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        try {
          document.execCommand('copy')
          setCopiedField(field)
          setTimeout(() => setCopiedField(null), 2000)
        } catch (fallbackErr) {
          console.error('Fallback copy failed:', fallbackErr)
          // Show user feedback even if copy failed
          setCopiedField(field + '_failed')
          setTimeout(() => setCopiedField(null), 2000)
        } finally {
          document.body.removeChild(textArea)
        }
      }
    } catch (err) {
      console.error('Failed to copy:', err)
      // Still show some feedback to user
      setCopiedField(field + '_failed')
      setTimeout(() => setCopiedField(null), 2000)
    }
  }

  // Open T-Map navigation
  const openTMap = async (address: string, name: string) => {
    const result = await TMap.navigate({ 
      name, 
      address
    })
    
    if (!result.success && result.fallbackUrl) {
      console.log('Fallback to web version:', result.fallbackUrl)
    }
  }

  if (!isOpen || !siteData) return null

  const getButtonSize = () => {
    if (touchMode === 'glove') return 'field' // 60px height
    if (touchMode === 'precision') return 'compact' // 44px height
    return isLargeFont ? 'standard' : 'compact' // 48px standard
  }

  const getIconSize = () => {
    if (touchMode === 'glove') return 'h-6 w-6'
    if (isLargeFont) return 'h-5 w-5'
    return 'h-4 w-4'
  }

  // Calculate work duration
  const getWorkDuration = () => {
    const startDate = new Date(siteData.assigned_date)
    const endDate = siteData.unassigned_date 
      ? new Date(siteData.unassigned_date) 
      : new Date()
    
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '진행중'
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
      case 'completed': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
      case 'inactive': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-600'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-600'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'site_manager': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
      case 'supervisor': return 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-600'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal - Mobile-first bottom sheet design with NavBar consideration */}
      <Card 
        className="relative w-full sm:max-w-lg sm:mx-4 max-h-[calc(100vh-80px)] sm:max-h-[85vh] mb-16 sm:mb-0 overflow-hidden bg-white dark:bg-gray-800 border-0 sm:border border-gray-200 dark:border-gray-700 shadow-2xl sm:rounded-2xl rounded-t-3xl rounded-b-none sm:rounded-b-2xl"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: isDragging && currentY > startY ? `translateY(${Math.max(0, currentY - startY)}px)` : 'translateY(0)',
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {/* Mobile handle bar */}
        <div className="sm:hidden flex justify-center py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>

        {/* Header - Compact */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`
                ${touchMode === 'glove' ? 'p-3' : touchMode === 'precision' ? 'p-2' : 'p-2.5'} 
                bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex-shrink-0
              `}>
                <Building2 className={`${getIconSize()} text-blue-600 dark:text-blue-400`} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className={`${getFullTypographyClass('heading', isLargeFont ? 'lg' : 'base', isLargeFont)} font-bold text-gray-900 dark:text-gray-100 truncate`}>
                  {siteData.site_name}
                </h2>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(siteData.site_status)}`}>
                    {siteData.site_status === 'active' ? '진행중' :
                     siteData.site_status === 'completed' ? '완료' : '중지'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(siteData.user_role)}`}>
                    {siteData.user_role === 'site_manager' ? '현장관리자' : 
                     siteData.user_role === 'supervisor' ? '감독관' : '작업자'}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className={`
                ${touchMode === 'glove' ? 'h-12 w-12' : touchMode === 'precision' ? 'h-10 w-10' : 'h-11 w-11'}
                text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 
                hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl flex-shrink-0
              `}
            >
              <X className={getIconSize()} />
            </Button>
          </div>
        </div>

        {/* Content - Optimized for space */}
        <div className="overflow-y-auto max-h-[calc(100vh-280px)] sm:max-h-[calc(85vh-140px)] px-3 sm:px-6 pb-2 space-y-2">
          {/* Ultra-Compact Information Grid */}
          <div className="space-y-2">
            {/* Combined Basic Info */}
            <div className="grid grid-cols-2 gap-2">
              {/* Site Address */}
              <Card className={`
                ${touchMode === 'glove' ? 'p-3' : touchMode === 'precision' ? 'p-2' : 'p-2.5'} 
                bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-700/50 
                border border-gray-200 dark:border-gray-700 rounded-lg col-span-2
              `}>
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} font-semibold text-gray-700 dark:text-gray-300`}>
                      현장 주소
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Copy button */}
                    <button
                      onClick={() => copyToClipboard(siteData.site_address, 'address')}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      title="주소 복사"
                    >
                      {copiedField === 'address' ? (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">복사됨</span>
                      ) : copiedField === 'address_failed' ? (
                        <span className="text-xs text-red-600 dark:text-red-400 font-medium">실패</span>
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-gray-400" />
                      )}
                    </button>
                    {/* T-Map button */}
                    <button
                      onClick={() => openTMap(siteData.site_address, siteData.site_name)}
                      className="px-2 py-1 text-xs font-medium bg-gray-50 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500 rounded transition-colors"
                      title="T맵에서 길찾기"
                    >
                      T맵
                    </button>
                  </div>
                </div>
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-900 dark:text-gray-100 leading-tight`}>
                  {siteData.site_address}
                </p>
              </Card>

              {/* Work Duration - Ultra Compact */}
              <Card className={`
                ${touchMode === 'glove' ? 'p-3' : touchMode === 'precision' ? 'p-2' : 'p-2.5'} 
                bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 
                border border-blue-200 dark:border-blue-800 rounded-lg col-span-2
              `}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} font-semibold text-blue-700 dark:text-blue-300`}>
                    근무 기간
                  </span>
                </div>
                <div className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-blue-900 dark:text-blue-100 space-y-1`}>
                  <div className="flex justify-between">
                    <span className="text-blue-600 dark:text-blue-400">시작</span>
                    <span className="font-medium">{formatDate(siteData.assigned_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600 dark:text-blue-400">종료</span>
                    <span className="font-medium">{formatDate(siteData.unassigned_date)}</span>
                  </div>
                  <div className="pt-1 mt-1 border-t border-blue-200 dark:border-blue-700">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-600 dark:text-blue-400">총 근무일</span>
                      <span className="text-blue-700 dark:text-blue-300 font-bold">
                        {getWorkDuration()}일
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Work Details - Ultra Compact Grid */}
          {(siteData.work_process || siteData.work_section) && (
            <div className="grid grid-cols-2 gap-2">
              {siteData.work_process && (
                <Card className={`
                  ${touchMode === 'glove' ? 'p-2.5' : touchMode === 'precision' ? 'p-2' : 'p-2'} 
                  bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/20 
                  border border-orange-200 dark:border-orange-800 rounded-lg
                `}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-orange-600 dark:text-orange-400 text-xs font-bold">공정</span>
                  </div>
                  <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-semibold text-orange-900 dark:text-orange-100 leading-tight`}>
                    {siteData.work_process}
                  </p>
                </Card>
              )}

              {siteData.work_section && (
                <Card className={`
                  ${touchMode === 'glove' ? 'p-2.5' : touchMode === 'precision' ? 'p-2' : 'p-2'} 
                  bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/20 
                  border border-orange-200 dark:border-orange-800 rounded-lg
                `}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-orange-600 dark:text-orange-400 text-xs font-bold">구간</span>
                  </div>
                  <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-semibold text-orange-900 dark:text-orange-100 leading-tight`}>
                    {siteData.work_section}
                  </p>
                </Card>
              )}
            </div>
          )}

          {/* Status Information - Ultra Compact */}
          <Card className={`
            ${touchMode === 'glove' ? 'p-2.5' : touchMode === 'precision' ? 'p-2' : 'p-2'} 
            bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 
            border border-green-200 dark:border-green-800 rounded-lg
          `}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                <div className="flex items-center gap-2">
                  <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} font-semibold text-green-700 dark:text-green-300`}>
                    참여 역할
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(siteData.user_role)}`}>
                    {siteData.user_role === 'site_manager' ? '현장관리자' : 
                     siteData.user_role === 'supervisor' ? '감독관' : '작업자'}
                  </span>
                </div>
              </div>
              {siteData.is_active && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                  현재 활성
                </span>
              )}
            </div>
          </Card>
        </div>

        {/* Footer - Optimized for mobile with NavBar */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-3 sm:px-6 py-2">
          <div className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              size="compact"
              className={`
                flex-1 sm:flex-none
                ${touchMode === 'glove' ? 'min-h-[48px] px-4' : touchMode === 'precision' ? 'min-h-[36px] px-3' : 'min-h-[40px] px-3'}
                rounded-lg font-medium text-sm
              `}
            >
              닫기
            </Button>
            {siteData.is_active && onSelectCurrentSite && (
              <Button
                onClick={() => {
                  onSelectCurrentSite()
                  onClose()
                }}
                size="compact"
                className={`
                  flex-2 sm:flex-none gap-1.5
                  ${touchMode === 'glove' ? 'min-h-[48px] px-4' : touchMode === 'precision' ? 'min-h-[36px] px-3' : 'min-h-[40px] px-3'}
                  rounded-lg font-medium text-sm bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700
                `}
              >
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">현재 현장으로 선택</span>
                <span className="sm:hidden">현장 선택</span>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}