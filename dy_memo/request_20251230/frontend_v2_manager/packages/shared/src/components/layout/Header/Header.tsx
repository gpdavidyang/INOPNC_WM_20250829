import React from 'react'
import { Search, Moon, Sun, FileCheck, Bell, Menu } from 'lucide-react'

export interface HeaderProps {
  onSearchClick: () => void
  title?: string
  isDarkMode: boolean
  toggleTheme: () => void
  onCertClick: () => void
  unreadCount?: number
  onNotificationClick: () => void
  onMenuClick: () => void
}

export const Header: React.FC<HeaderProps> = ({
  onSearchClick,
  title = 'INOPNC',
  isDarkMode,
  toggleTheme,
  onCertClick,
  unreadCount = 0,
  onNotificationClick,
  onMenuClick,
}) => {
  // Common button style - 폰트 가독성 개선
  const btnClass =
    'bg-transparent border-none p-1 flex flex-col items-center gap-[3px] cursor-pointer active:opacity-60 hover:opacity-80 transition-all font-bold'

  return (
    <header
      className="fixed top-0 left-0 right-0 h-[60px] z-40 flex items-center justify-center transition-colors duration-300"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-default)',
      }}
    >
      <div className="w-full max-w-[600px] px-5 flex justify-between items-center h-full">
        <div
          className="text-[24px] font-[800] tracking-tighter cursor-pointer"
          style={{ color: 'var(--text-primary)' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          {title}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onSearchClick}
            className={btnClass}
            style={{ color: 'var(--text-primary)' }}
          >
            <Search size={20} />
            <span className="text-[13px] tracking-tight">통합검색</span>
          </button>

          <button
            onClick={toggleTheme}
            className={btnClass}
            style={{ color: 'var(--text-primary)' }}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span className="text-[13px] tracking-tight">{isDarkMode ? '라이트' : '다크'}</span>
          </button>

          <button
            className={btnClass}
            onClick={onCertClick}
            style={{ color: 'var(--text-primary)' }}
          >
            <FileCheck size={20} />
            <span className="text-[13px] tracking-tight">확인서</span>
          </button>

          <button
            className={`${btnClass} relative`}
            onClick={onNotificationClick}
            style={{ color: 'var(--text-primary)' }}
          >
            <div className="relative">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 text-[10px] font-black w-[16px] h-[16px] flex items-center justify-center rounded-full animate-bounce-in"
                  style={{
                    backgroundColor: 'var(--accent-danger)',
                    color: 'var(--text-inverse)',
                    border: '1px solid var(--bg-surface)',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[13px] tracking-tight">알림</span>
          </button>

          <button
            className={btnClass}
            onClick={onMenuClick}
            style={{ color: 'var(--text-primary)' }}
          >
            <Menu size={20} />
            <span className="text-[13px] tracking-tight">메뉴</span>
          </button>
        </div>
      </div>
    </header>
  )
}
