'use client'

import GlobalSearchModal from './GlobalSearchModal'

interface AdminHeaderProps {
  profile?: Profile | null
  onMenuClick?: () => void
  onDesktopMenuClick?: () => void
  isSidebarOpen?: boolean
  isSidebarCollapsed?: boolean
}

export default function AdminHeader({ profile, onMenuClick, onDesktopMenuClick, isSidebarOpen, isSidebarCollapsed }: AdminHeaderProps) {
  const { isLargeFont, toggleFontSize } = useFontSize()
  const { touchMode } = useTouchMode()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleLogout = async () => {
    try {
      const result = await signOut()
      if (result.success) {
        window.location.href = '/auth/login'
      }
    } catch (error) {
      console.error('Logout error:', error)
      window.location.href = '/auth/login'
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          {/* Left Section */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Sidebar Toggle - Enhanced for mobile */}
            <button
              onClick={onDesktopMenuClick}
              className="p-2 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-600"
              aria-label={isSidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
            >
              <Menu className="h-6 w-6 sm:h-5 sm:w-5 text-gray-700 dark:text-gray-300" />
            </button>

            {/* Logo/Title */}
            <div className="flex items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    관리자 대시보드
                  </h1>
                </div>
              </div>
            </div>
          </div>

          {/* Center Section - Search Bar */}
          <div className="flex flex-1 max-w-2xl mx-8">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full max-w-md mx-auto flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
            >
              <Search className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
              <span className="flex-1 text-left text-sm text-gray-500 dark:text-gray-400">
                검색하기...
              </span>
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs text-gray-500 dark:text-gray-400">
                <span className="text-lg leading-none">⌘</span>K
              </kbd>
            </button>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Mobile Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="검색"
            >
              <Search className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Notifications */}
            <button
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="알림"
            >
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Theme Toggle - Hidden for admin */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="테마 변경"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            )}

            {/* Font Size Toggle - Hidden for admin */}
            <button
              onClick={toggleFontSize}
              className="hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="글자 크기"
            >
              <span className={`font-medium ${isLargeFont ? 'text-lg' : 'text-sm'} text-gray-600 dark:text-gray-400`}>
                가
              </span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="hidden lg:block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {profile?.name || profile?.email || '관리자'}
                </span>
                <ChevronDown className="hidden lg:block h-4 w-4 text-gray-400" />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-40">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {profile?.name || '관리자'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {profile?.email}
                      </p>
                    </div>
                    <Link
                      href="/dashboard/admin/account"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      계정 설정
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      로그아웃
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <GlobalSearchModal 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  )
}