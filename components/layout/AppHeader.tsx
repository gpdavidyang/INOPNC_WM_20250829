'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Search, Moon, Sun, Type, Bell, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AppHeader() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isLargeText, setIsLargeText] = useState(false)
  const [notificationCount, setNotificationCount] = useState(1) // 예시로 1개
  const [showSearch, setShowSearch] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    // Check if large text is enabled from localStorage
    const savedTextSize = localStorage.getItem('textSize')
    setIsLargeText(savedTextSize === 'large')
  }, [])
  
  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }
  
  const toggleTextSize = () => {
    const newSize = !isLargeText
    setIsLargeText(newSize)
    localStorage.setItem('textSize', newSize ? 'large' : 'normal')
    document.body.classList.toggle('large-text', newSize)
  }
  
  const handleSearch = () => {
    setShowSearch(true)
    // TODO: Implement search modal/page
  }
  
  const handleNotifications = () => {
    // TODO: Show notifications popup
    router.push('/dashboard/notifications')
  }
  
  const handleMenu = () => {
    setShowMenu(!showMenu)
    // TODO: Implement drawer menu
  }
  
  const handleLogoClick = () => {
    router.push('/dashboard')
  }
  
  if (!mounted) return null
  
  return (
    <>
      <header className="app-header">
        <div className="header-content">
          {/* Left: Logo */}
          <div className="header-left">
            <img 
              src="/INOPNC_logo.png"
              alt="INOPNC"
              className="brand-logo"
              onClick={handleLogoClick}
              style={{ 
                cursor: 'pointer',
                height: '32px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
          </div>
          
          {/* Right: Action buttons */}
          <div className="header-right">
            {/* Search */}
            <button 
              className="header-icon-btn"
              onClick={handleSearch}
              aria-label="검색"
            >
              <Search className="w-5 h-5" />
              <span className="icon-text">검색</span>
            </button>
            
            {/* Dark Mode */}
            <button 
              className="header-icon-btn"
              onClick={toggleDarkMode}
              aria-label="다크모드"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
              <span className="icon-text">다크모드</span>
            </button>
            
            {/* Text Size */}
            <button 
              className="header-icon-btn"
              onClick={toggleTextSize}
              aria-label="글씨 크기"
            >
              <Type className="w-5 h-5" />
              <span className="icon-text">
                {isLargeText ? '큰글씨' : '작은글씨'}
              </span>
            </button>
            
            {/* Notifications */}
            <button 
              className="header-icon-btn"
              onClick={handleNotifications}
              aria-label="알림"
            >
              <Bell className={cn(
                "w-5 h-5",
                notificationCount > 0 && "bell-shake"
              )} />
              <span className="icon-text">알림</span>
              {notificationCount > 0 && (
                <span className="notification-badge" id="notificationBadge">
                  {notificationCount}
                </span>
              )}
            </button>
            
            {/* Menu */}
            <button 
              className="header-icon-btn"
              onClick={handleMenu}
              aria-label="메뉴"
            >
              <Menu className="w-5 h-5" />
              <span className="icon-text">메뉴</span>
            </button>
          </div>
        </div>
      </header>
      
      {/* Add CSS styles */}
      <style jsx global>{`
        .app-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background-color: var(--card);
          padding: 0;
          transition: background-color 0.3s ease;
          border-bottom: 1px solid var(--line);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 56px;
          padding: 0 20px;
          width: 100%;
          box-sizing: border-box;
        }
        
        .header-left {
          display: flex;
          align-items: center;
          flex: 0 0 auto;
          min-width: 120px;
        }
        
        .header-right {
          display: flex;
          align-items: center;
          gap: 1px;
          flex: 0 0 auto;
        }
        
        .brand-logo {
          display: block;
          height: 32px;
          width: auto;
          object-fit: contain;
          transition: transform 0.2s ease;
        }
        
        .brand-logo:hover {
          transform: scale(1.05);
        }
        
        .header-icon-btn {
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.2s ease;
          position: relative;
          min-width: 36px;
          min-height: 36px;
          color: var(--brand);
        }
        
        .header-icon-btn:hover {
          background-color: rgba(0, 104, 254, 0.05);
        }
        
        .header-icon-btn:active {
          transform: scale(0.95);
        }
        
        .header-icon-btn .icon-text {
          font-family: var(--font-sans);
          font-size: 10px;
          font-weight: 500;
          color: var(--brand);
          margin-top: 1px;
          line-height: 1.2;
        }
        
        .notification-badge {
          position: absolute;
          top: 1px;
          right: 1px;
          background-color: #ff4444;
          color: white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          font-size: 9px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--card);
          min-width: 16px;
          min-height: 16px;
          transition: all 0.3s ease;
          transform-origin: center;
        }
        
        .bell-shake {
          animation: bellShake 0.6s ease-in-out;
        }
        
        @keyframes bellShake {
          0%, 100% {
            transform: rotate(0deg);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: rotate(-10deg);
          }
          20%, 40%, 60%, 80% {
            transform: rotate(10deg);
          }
        }
        
        /* Dark mode adjustments */
        [data-theme="dark"] .header-icon-btn {
          color: #FFFFFF;
        }
        
        [data-theme="dark"] .header-icon-btn .icon-text {
          color: #FFFFFF;
        }
        
        /* Large text mode */
        body.large-text .brand-logo {
          height: 36px;
        }
        
        body.large-text .header-icon-btn .icon-text {
          font-size: 12px;
        }
        
        /* Mobile responsive */
        @media (max-width: 768px) {
          .header-content {
            padding: 0 12px;
          }
          
          .header-icon-btn {
            min-width: 36px;
            padding: 2px;
          }
          
          .header-icon-btn .icon-text {
            font-size: 9px;
          }
        }
      `}</style>
    </>
  )
}