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
      {/* Backdrop - Softer overlay */}
      <div 
        className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      
      {/* Improved Modal Design */}
      <div
        ref={dropdownRef}
        className="fixed z-50 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] sm:w-[420px] max-w-[420px] bg-white dark:bg-gray-800 rounded-xl shadow-xl animate-in fade-in-0 zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-title"
      >
        {/* Header - Cleaner design */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 
              id="notification-title"
              className="text-base font-semibold text-gray-900 dark:text-gray-100"
            >
              알림
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllRead}
                disabled={markingAllRead}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                aria-label="모든 알림을 읽음으로 표시"
              >
                모두 읽음
              </button>
              <button
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                onClick={() => setOpen(false)}
                aria-label="닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Notification List - Better scrolling area */}
        <div className="max-h-[400px] min-h-[200px] overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
          <NotificationList 
            onNotificationClick={handleNotificationClick}
          />
        </div>
        
        {/* Footer - Simplified */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
          <button 
            className="w-full py-2 text-sm font-medium text-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            onClick={() => {
              setOpen(false)
              window.location.href = '/dashboard/notifications'
            }}
          >
            모든 알림 보기
          </button>
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