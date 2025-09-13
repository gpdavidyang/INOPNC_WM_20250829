'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Calendar, FileText, MapPin, MoreHorizontal } from 'lucide-react'

export default function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { 
      icon: Home, 
      label: '홈', 
      path: '/dashboard',
      active: pathname === '/dashboard' || pathname === '/dashboard/'
    },
    { 
      icon: Calendar, 
      label: '작업일지', 
      path: '/dashboard/daily-reports',
      active: pathname.includes('/daily-reports')
    },
    { 
      icon: FileText, 
      label: '문서함', 
      path: '/dashboard/documents',
      active: pathname.includes('/documents')
    },
    { 
      icon: MapPin, 
      label: '현장정보', 
      path: '/dashboard/site-info',
      active: pathname.includes('/site-info')
    },
    { 
      icon: MoreHorizontal, 
      label: '더보기', 
      path: '/dashboard/more',
      active: pathname.includes('/more')
    },
  ]

  return (
    <nav className="bottom-nav-wrap" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 'var(--nav-h, 64px)',
      background: 'var(--nav-bg)',
      borderTop: '1px solid var(--nav-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 100
    }}>
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className="nav-item"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '8px',
              background: 'transparent',
              border: 'none',
              color: item.active ? 'var(--nav-text-active)' : 'var(--nav-text)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              flex: 1
            }}
          >
            <Icon size={24} />
            <span style={{
              fontSize: '11px',
              fontWeight: item.active ? 600 : 400
            }}>
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}