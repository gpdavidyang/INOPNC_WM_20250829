'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { NotificationBell } from './notification-bell'
import { NotificationList } from './notification-list'
import { markAllNotificationsAsRead } from '@/app/actions/notifications'
import { toast } from 'sonner'
import { CheckCheck, Settings, X } from 'lucide-react'
import { createPortal } from 'react-dom'

export function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const [markingAllRead, setMarkingAllRead] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleMarkAllRead = async () => {
    setMarkingAllRead(true)
    try {
      const result = await markAllNotificationsAsRead()
      if (result.success) {
        toast.success(`${result.count}개의 알림을 읽음 처리했습니다.`)
        // Refresh notification list by closing and reopening
        setOpen(false)
        setTimeout(() => setOpen(true), 100)
      } else {
        toast.error(result.error || '알림 읽음 처리에 실패했습니다.')
      }
    } catch (error) {
      toast.error('알림 읽음 처리에 실패했습니다.')
    } finally {
      setMarkingAllRead(false)
    }
  }

  const handleNotificationClick = () => {
    // Close dropdown when a notification is clicked
    setOpen(false)
  }

  // Handle click outside to close dropdown and responsive positioning
  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    // Prevent body scroll when dropdown is open (mobile)
    const body = document.body
    const originalOverflow = body.style.overflow
    if (window.innerWidth < 640) { // sm breakpoint
      body.style.overflow = 'hidden'
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      // Restore body scroll
      body.style.overflow = originalOverflow
    }
  }, [open])

  // Focus management
  useEffect(() => {
    if (open && dropdownRef.current) {
      // Focus the first focusable element in the dropdown
      const firstFocusable = dropdownRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement
      if (firstFocusable) {
        firstFocusable.focus()
      }
    }
  }, [open])

  const dropdownContent = open ? createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40"
        onClick={() => setOpen(false)}
      />
      
      {/* Centered Dropdown */}
      <div
        ref={dropdownRef}
        className="fixed z-50 left-1/2 top-12 sm:top-16 transform -translate-x-1/2 w-[95vw] sm:w-[90vw] max-w-[320px] min-w-[280px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-title"
      >
        {/* Header */}
        <div className="px-2.5 py-1.5 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <h3 
              id="notification-title"
              className="text-sm font-semibold text-gray-900 dark:text-gray-100"
            >
              알림
            </h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="compact"
                onClick={handleMarkAllRead}
                disabled={markingAllRead}
                className="h-7 sm:h-6 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 px-2"
                aria-label="모든 알림을 읽음으로 표시"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                모두 읽음
              </Button>
              <Button
                variant="ghost"
                size="compact"
                className="h-7 w-7 sm:h-6 sm:w-6 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 p-0"
                onClick={() => {
                  setOpen(false)
                  window.location.href = '/dashboard/settings/notifications'
                }}
                aria-label="알림 설정"
              >
                <Settings className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="compact"
                className="h-7 w-7 sm:h-6 sm:w-6 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 p-0"
                onClick={() => setOpen(false)}
                aria-label="알림 창 닫기"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Notification List */}
        <div className="h-[300px] overflow-y-auto">
          <NotificationList 
            onNotificationClick={handleNotificationClick}
          />
        </div>
        
        {/* Separator */}
        <div className="border-t border-gray-200 dark:border-gray-600" />
        
        {/* Footer */}
        <div className="p-1.5">
          <Button 
            variant="outline" 
            className="w-full text-sm h-8 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 min-h-[36px] sm:min-h-[32px] touch-target-glove"
            onClick={() => {
              setOpen(false)
              window.location.href = '/dashboard/notifications'
            }}
          >
            모든 알림 보기
          </Button>
        </div>
      </div>
    </>,
    document.body
  ) : null

  return (
    <>
      <div ref={triggerRef}>
        <div onClick={() => setOpen(!open)}>
          <NotificationBell />
        </div>
      </div>
      {dropdownContent}
    </>
  )
}