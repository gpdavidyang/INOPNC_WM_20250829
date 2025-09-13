'use client'

import { Bell, Search, User } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface MobileHeaderProps {
  userName?: string
  notificationCount?: number
}

export default function MobileHeader({ userName = '사용자', notificationCount = 0 }: MobileHeaderProps) {
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log('Searching for:', searchQuery)
    }
  }

  return (
    <>
      <header className="appbar" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--header-h, 56px)',
        background: 'var(--card)',
        borderBottom: '1px solid var(--line)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 100
      }}>
        {/* Logo */}
        <div className="brand-logo" style={{
          fontFamily: 'Poppins, system-ui, sans-serif',
          fontWeight: 700,
          fontSize: '20px',
          color: 'var(--brand)',
          letterSpacing: '-0.5px'
        }}>
          INOPNC
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Search */}
          <button 
            className="btn btn--ghost"
            onClick={() => setShowSearch(true)}
            style={{ 
              padding: '8px',
              minHeight: 'unset',
              height: 'auto'
            }}
          >
            <Search size={20} />
          </button>

          {/* Notifications */}
          <button 
            className="btn btn--ghost"
            onClick={() => router.push('/notifications')}
            style={{ 
              padding: '8px',
              minHeight: 'unset',
              height: 'auto',
              position: 'relative'
            }}
          >
            <Bell size={20} />
            {notificationCount > 0 && (
              <span className="notification-badge">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          {/* Profile */}
          <button 
            className="btn btn--ghost"
            onClick={() => router.push('/dashboard/profile')}
            style={{ 
              padding: '8px',
              minHeight: 'unset',
              height: 'auto'
            }}
          >
            <User size={20} />
          </button>
        </div>
      </header>

      {/* Search Overlay */}
      {showSearch && (
        <div className="search-page" style={{ display: 'block' }}>
          <div className="sp-head">
            <button 
              className="sp-back"
              onClick={() => setShowSearch(false)}
            >
              ←
            </button>
            <form onSubmit={handleSearch} style={{ flex: 1 }}>
              <div className="sp-input-wrap">
                <input 
                  type="text"
                  className="sp-input"
                  placeholder="검색어를 입력하세요"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <Search className="sp-icon" size={20} />
              </div>
            </form>
          </div>
          <div className="sp-body">
            <div className="sp-section-title">최근 검색어</div>
            <div className="sp-list">
              {/* Recent searches would go here */}
            </div>
          </div>
        </div>
      )}
    </>
  )
}