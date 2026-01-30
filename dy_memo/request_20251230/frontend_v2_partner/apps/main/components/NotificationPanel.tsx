import React, { useEffect, useState } from 'react'
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { NotificationItem } from '@inopnc/shared/types'

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
  notifications: NotificationItem[]
  onMarkAllRead: () => void
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      requestAnimationFrame(() => setIsVisible(true))
      document.body.style.overflow = 'hidden'
    } else {
      setIsVisible(false)
      document.body.style.overflow = ''
      const timer = setTimeout(() => setShouldRender(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!shouldRender) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[2000] bg-black/40 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 bottom-0 right-0 w-[85%] max-w-[320px] bg-[var(--bg-surface)] z-[2500] flex flex-col transition-transform duration-300 shadow-2xl ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="h-[60px] flex items-center justify-between px-4 border-b border-[var(--border)] bg-[var(--bg-surface)] shrink-0">
          <span className="text-[20px] font-bold text-[var(--header-navy)] tracking-tight">
            알림 센터
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllRead}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-transparent text-[13px] text-[var(--text-sub)] font-bold hover:bg-[var(--bg-body)] active:scale-95 transition-all"
            >
              모두 읽음
            </button>
            <button onClick={onClose} className="p-1 text-[var(--text-main)] active:opacity-60">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* List */}
        <ul className="flex-1 overflow-y-auto p-0 m-0 list-none">
          {notifications.length === 0 ? (
            <li className="p-5 text-center text-[var(--text-placeholder)]">알림이 없습니다.</li>
          ) : (
            notifications.map(noti => (
              <li
                key={noti.id}
                className={`p-5 border-b border-[var(--border)] flex gap-[14px] items-start transition-colors ${noti.unread ? 'bg-[var(--primary-bg)]' : ''}`}
              >
                {/* Icon Box */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 
                  ${
                    noti.type === 'alert'
                      ? 'bg-[var(--del-btn-bg)] text-[var(--danger)]'
                      : noti.type === 'info'
                        ? 'bg-[var(--primary-bg)] text-[var(--primary)]'
                        : 'bg-[var(--badge-gray-bg)] text-[var(--text-sub)]'
                  }`}
                >
                  {noti.type === 'alert' && <AlertTriangle size={20} />}
                  {noti.type === 'info' && <Info size={20} />}
                  {noti.type === 'success' && <CheckCircle size={20} />}
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 gap-1">
                  <span className="text-[17px] font-bold text-[var(--text-main)]">
                    {noti.title}
                  </span>
                  <span className="text-[15px] text-[var(--text-sub)] leading-[1.5]">
                    {noti.desc}
                  </span>
                  <span className="text-[13px] text-[var(--text-placeholder)] mt-1">
                    {noti.time}
                  </span>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </>
  )
}
