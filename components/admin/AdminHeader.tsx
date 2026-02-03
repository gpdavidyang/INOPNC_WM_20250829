'use client'

import { signOut } from '@/app/auth/actions'
import { getLoginLogoSrc } from '@/lib/ui/brand'
import { t } from '@/lib/ui/strings'
import { cn } from '@/lib/utils'
import { Bell, ChevronDown, Command, LogOut, Menu, Search, Settings, User } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import GlobalSearchModal from './GlobalSearchModal'

interface Profile {
  id: string
  email: string
  name?: string | null
  role?: string
}

interface AdminHeaderProps {
  profile?: Profile | null
  onDesktopMenuClick?: () => void
  isSidebarCollapsed?: boolean
}

export default function AdminHeader({
  profile,
  onDesktopMenuClick,
  isSidebarCollapsed,
}: AdminHeaderProps) {
  const [mounted, setMounted] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
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
    const result = await signOut()
    if (result.success) window.location.href = '/auth/login'
  }

  if (!mounted) return null

  return (
    <>
      <header className="admin-header fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 h-16 transition-all duration-300">
        <div className="flex items-center justify-between h-full px-6 max-w-[2560px] mx-auto">
          {/* Left: Brand & Sidebar Toggle */}
          <div className="flex items-center gap-6">
            <button
              onClick={onDesktopMenuClick}
              className="p-2.5 rounded-xl bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all active:scale-95 border border-transparent hover:border-gray-200"
            >
              <Menu
                className={cn(
                  'h-5 w-5 transition-transform duration-500',
                  !isSidebarCollapsed ? 'rotate-180' : 'rotate-0'
                )}
              />
            </button>

            <Link href="/dashboard/admin" className="flex items-center gap-3 group">
              <div className="brand-logos relative h-8 w-32 overflow-hidden transition-transform group-hover:scale-105 duration-300">
                <Image
                  src={getLoginLogoSrc()}
                  alt="Logo"
                  fill
                  className="object-contain"
                  unoptimized
                  priority
                />
              </div>
              <div className="h-6 w-px bg-gray-200 mx-1" />
              <h1 className="text-sm font-black text-gray-900 uppercase tracking-widest italic">
                {t('admin.dashboard')}
              </h1>
            </Link>
          </div>

          {/* Center: Quick Search */}
          <div className="flex-1 max-w-xl mx-12">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center justify-between gap-4 px-5 py-2.5 bg-gray-50/50 rounded-2xl border-2 border-transparent hover:border-gray-100 hover:bg-white transition-all group ring-offset-2 ring-transparent hover:ring-gray-100/50 ring-2"
            >
              <div className="flex items-center gap-3">
                <Search className="h-4 w-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                <span className="text-sm font-bold text-gray-400 group-hover:text-gray-600 transition-colors">
                  검색어를 입력하세요...
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white border border-gray-200 text-[10px] font-black text-gray-400 shadow-sm uppercase tracking-tighter">
                <Command className="w-2.5 h-2.5" /> K
              </div>
            </button>
          </div>

          {/* Right: Actions & Profile */}
          <div className="flex items-center gap-4">
            <button className="relative p-2.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all group">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-600 rounded-full ring-2 ring-white animate-pulse" />
            </button>

            <div className="h-8 w-px bg-gray-100 mx-2" />

            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 p-1.5 pr-4 rounded-2xl hover:bg-gray-50 transition-all active:scale-[0.98] group"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-gray-800 to-gray-900 flex items-center justify-center text-white shadow-lg shadow-gray-200 group-hover:rotate-12 transition-transform duration-500">
                  <User className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col items-start leading-none gap-0.5">
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    관리자
                  </span>
                  <span className="text-sm font-black text-gray-900 tracking-tight">
                    {profile?.name || '관리자'}
                  </span>
                </div>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-gray-300 transition-transform duration-300',
                    isProfileOpen ? 'rotate-180' : ''
                  )}
                />
              </button>

              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                  <div className="absolute right-0 mt-3 w-72 bg-white/90 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-gray-100 p-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-5 py-4 bg-gray-900 rounded-[24px] text-white mb-2">
                      <p className="text-xs font-black uppercase text-gray-400 tracking-widest mb-1">
                        세션 정보
                      </p>
                      <p className="text-sm font-bold truncate italic">
                        {profile?.email || '인증됨'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <Link
                        href="/dashboard/admin/account"
                        className="flex items-center gap-3 px-5 py-3.5 text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-2xl transition-all"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Settings className="h-4 w-4" /> 계정 설정
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-5 py-3.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-2xl transition-all w-full text-left"
                      >
                        <LogOut className="h-4 w-4" /> 로그아웃
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}
