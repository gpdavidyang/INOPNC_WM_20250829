'use client'


interface NavItem {
  id: string
  label: string
  href: string
  icon: string
  activeIcon?: string
}

const navItems: NavItem[] = [
  {
    id: 'home',
    label: '홈',
    href: '/dashboard',
    icon: '/nav-icons/Flash.png',
  },
  {
    id: 'schedule',
    label: '일정',
    href: '/dashboard/schedule',
    icon: '/nav-icons/date.png',
  },
  {
    id: 'documents',
    label: '문서함',
    href: '/dashboard/documents',
    icon: '/nav-icons/doc.png',
  },
  {
    id: 'salary',
    label: '급여',
    href: '/dashboard/salary',
    icon: '/nav-icons/pay.png',
  },
  {
    id: 'profile',
    label: '내정보',
    href: '/dashboard/profile',
    icon: '/nav-icons/my.png',
  },
]

export function BottomNav() {
  const pathname = usePathname()
  
  // Check if current path matches nav item
  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/'
    }
    return pathname?.startsWith(href)
  }
  
  return (
    <div className="bottom-nav-wrap">
      <nav className="bottom-nav">
        <ul className="nav-list">
          {navItems.map((item) => {
            const active = isActive(item.href)
            
            return (
              <li key={item.id} className="nav-item">
                <Link
                  href={item.href}
                  className={cn(
                    "nav-link",
                    active && "active"
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <div className="nav-ico">
                    <Image
                      src={item.icon}
                      alt={item.label}
                      width={22}
                      height={22}
                      className={cn(
                        "nav-svg",
                        "transition-all duration-200",
                        active ? "opacity-100" : "opacity-60"
                      )}
                      style={{
                        filter: active 
                          ? 'brightness(1) contrast(1.2)' 
                          : 'brightness(0.8) contrast(0.9)'
                      }}
                    />
                  </div>
                  <span className={cn(
                    "nav-label",
                    active ? "text-[var(--brand)]" : "text-[var(--muted)]"
                  )}>
                    {item.label}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

// CSS for bottom navigation (add to globals.css or component)
const bottomNavStyles = `
  .bottom-nav-wrap {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 50;
  }
  
  .bottom-nav {
    background: var(--card);
    border-top: 1px solid var(--line);
    box-shadow: 0 -6px 16px rgba(17, 24, 39, 0.06);
    height: var(--nav-h);
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  .nav-list {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    max-width: 720px;
    height: 100%;
    margin: 0 auto;
    padding: 0;
    list-style: none;
  }
  
  .nav-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .nav-link {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    color: var(--muted);
    text-decoration: none;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: center;
    padding: 8px;
    border-radius: 12px;
  }
  
  .nav-link:hover,
  .nav-link:active {
    transform: translateY(-2px) scale(1.05);
  }
  
  .nav-link.active {
    color: var(--brand);
  }
  
  .nav-ico {
    width: 26px;
    height: 26px;
    display: grid;
    place-items: center;
  }
  
  .nav-label {
    font-family: var(--font-sans);
    font-size: var(--fs-cap);
    font-weight: 500;
    line-height: var(--lh);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  /* Touch feedback */
  @media (hover: none) {
    .nav-link:active {
      transform: translateY(-2px) scale(1.05);
    }
  }
  
  /* Large text mode */
  body.large-text .nav-label {
    font-size: 14px;
  }
  
  body.large-text .nav-svg {
    width: 24px;
    height: 24px;
  }
`

// Export styles to be added to global CSS
export { bottomNavStyles }