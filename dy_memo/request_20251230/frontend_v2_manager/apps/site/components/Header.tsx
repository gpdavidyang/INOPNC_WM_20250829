import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Moon, Sun, FileCheck, Bell, Menu } from 'lucide-react'

interface HeaderProps {
  isDarkMode: boolean
  toggleTheme: () => void
  onSearchClick?: () => void
  onCertClick: () => void
  unreadCount?: number
  onNotificationClick: () => void
  onMenuClick: () => void
  title?: string
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  toggleTheme,
  onSearchClick,
  onCertClick,
  unreadCount = 0,
  onNotificationClick,
  onMenuClick,
  title = 'INOPNC',
}) => {
  const navigate = useNavigate()
  const btnClass =
    'bg-transparent border-none p-1 flex flex-col items-center gap-[3px] cursor-pointer text-[var(--header-navy)] active:opacity-60 hover:opacity-80 transition-all'

  return (
    <header className="fixed top-0 left-0 right-0 h-[60px] bg-[var(--bg-surface)] border-b border-[var(--border)] z-40 flex items-center justify-center transition-colors duration-300">
      <div className="w-full max-w-[600px] px-5 flex justify-between items-center h-full">
        <div
          className="text-[24px] font-[800] text-[var(--header-navy)] tracking-tighter cursor-pointer"
          onClick={() => navigate('/main')}
        >
          {title}
        </div>

        <div className="flex items-center gap-3">
          {onSearchClick && (
            <button onClick={onSearchClick} className={btnClass}>
              <Search size={20} />
              <span className="text-[13px] font-bold tracking-tight">통합검색</span>
            </button>
          )}

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
                <span className="absolute -top-0.5 -right-1 bg-[var(--danger)] text-white text-[10px] font-black w-[16px] h-[16px] flex items-center justify-center rounded-full border border-[var(--bg-surface)]">
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
