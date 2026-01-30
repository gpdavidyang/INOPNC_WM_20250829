import React from 'react'
import { Search, Moon, Sun, FileCheck, Bell, Menu } from 'lucide-react'

interface HeaderProps {
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
  // Common button style
  const btnClass =
    'bg-transparent border-none p-1 flex flex-col items-center gap-[3px] cursor-pointer text-[#1a254f] dark:text-white active:opacity-60 hover:opacity-80 transition-all'

  return (
    <header className="fixed top-0 left-0 right-0 h-[60px] bg-white dark:bg-[#1e293b] border-b border-[#e2e8f0] dark:border-[#334155] z-40 flex items-center justify-center transition-colors duration-300">
      <div className="w-full max-w-[600px] px-5 flex justify-between items-center h-full">
        <div
          className="text-[24px] font-[800] text-[#1a254f] dark:text-white tracking-tighter cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          {title}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onSearchClick} className={btnClass}>
            <Search size={20} />
            <span className="text-[13px] font-bold tracking-tight">통합검색</span>
          </button>

          <button onClick={toggleTheme} className={btnClass}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span className="text-[13px] font-bold tracking-tight">
              {isDarkMode ? '라이트' : '다크'}
            </span>
          </button>

          <button className={btnClass} onClick={onCertClick}>
            <FileCheck size={20} />
            <span className="text-[13px] font-bold tracking-tight">확인서</span>
          </button>

          <button className={`${btnClass} relative`} onClick={onNotificationClick}>
            <div className="relative">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#ef4444] text-white text-[10px] font-black w-[16px] h-[16px] flex items-center justify-center rounded-full border border-white dark:border-[#1e293b] animate-bounce-in">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[13px] font-bold tracking-tight">알림</span>
          </button>

          <button className={btnClass} onClick={onMenuClick}>
            <Menu size={20} />
            <span className="text-[13px] font-bold tracking-tight">메뉴</span>
          </button>
        </div>
      </div>
    </header>
  )
}
