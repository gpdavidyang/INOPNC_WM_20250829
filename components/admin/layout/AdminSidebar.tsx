'use client'

import { signOut } from '@/app/auth/actions'
import { getFullTypographyClass, useFontSize } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { cn } from '@/lib/utils'
import { ChevronRight, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { menuCategories, systemCategory } from './menu-config'

interface Profile {
  id: string
  name?: string | null
  email?: string
  role?: string
}

interface AdminSidebarProps {
  profile?: Profile | null
  pathname: string
  onItemClick?: () => void
  isCollapsed?: boolean
}

export function AdminSidebar({ profile, pathname, onItemClick, isCollapsed }: AdminSidebarProps) {
  const router = useRouter()
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [mounted, setMounted] = useState(false)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [pendingSignupCount, setPendingSignupCount] = useState<number>(0)

  useEffect(() => {
    setMounted(true)
    fetchPendingCount()
  }, [])

  const fetchPendingCount = async () => {
    try {
      const res = await fetch('/api/admin/signup-requests/pending-count', { cache: 'no-store' })
      const j = await res.json()
      if (res.ok && j?.success) setPendingSignupCount(Number(j.count || 0))
    } catch (e) {
      console.error('[AdminSidebar] fetchPendingCount failed:', e)
    }
  }

  const handleLogout = async () => {
    const result = await signOut()
    if (result.success) window.location.href = '/auth/login'
  }

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) newSet.delete(categoryId)
      else newSet.add(categoryId)
      return newSet
    })
  }

  const getTypographyClass = (type: string, size: string = 'base') =>
    getFullTypographyClass(type, size, isLargeFont)

  const allCategories =
    profile?.role === 'admin' || profile?.role === 'system_admin'
      ? [...menuCategories, systemCategory]
      : menuCategories

  if (isCollapsed) {
    return (
      <div className="flex flex-col h-full bg-white border-r border-gray-200 w-16">
        <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
          <nav className="space-y-2 px-2">
            {allCategories.map(cat => (
              <div key={cat.id} className="space-y-1">
                {cat.items
                  .filter(i => !i.hidden)
                  .map(item => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={onItemClick}
                        className={cn(
                          'flex items-center justify-center w-12 h-12 rounded-xl transition-all group relative',
                          isActive
                            ? 'bg-red-50 text-red-600 shadow-sm'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <div className="absolute left-full ml-3 px-2 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-1 group-hover:translate-x-0 whitespace-nowrap z-50 shadow-xl">
                          {item.label}
                        </div>
                      </Link>
                    )
                  })}
              </div>
            ))}
          </nav>
        </div>
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-10 h-10 mx-auto flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-red-200 font-black italic">
            A
          </div>
          <div>
            <h2
              className={cn(
                getTypographyClass('header', 'sm'),
                'font-black text-gray-900 tracking-tight'
              )}
            >
              시스템 관리자
            </h2>
            <p
              className={cn(
                getTypographyClass('caption', 'xs'),
                'text-gray-400 font-bold uppercase tracking-widest'
              )}
            >
              대시보드
            </p>
          </div>
        </div>

        {profile && (
          <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
            <p className={cn(getTypographyClass('body', 'sm'), 'font-black text-gray-900 italic')}>
              {profile.name || profile.email}
            </p>
            <p
              className={cn(
                getTypographyClass('caption', 'xs'),
                'text-red-500 font-bold uppercase tracking-wider mt-0.5'
              )}
            >
              {profile.role === 'admin' ? '본사 관리자' : '시스템 관리자'}
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
        <nav className="space-y-8">
          {allCategories.map(category => {
            const isColl = collapsedCategories.has(category.id)
            const hasActive = category.items.some(i => pathname === i.href)

            return (
              <div key={category.id} className="space-y-3">
                {category.label && (
                  <button
                    onClick={() => category.collapsible && toggleCategory(category.id)}
                    className="w-full flex items-center justify-between px-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                      {category.label}
                    </span>
                    {category.collapsible && (
                      <ChevronRight
                        className={cn('w-3 h-3 transition-transform', !isColl ? 'rotate-90' : '')}
                      />
                    )}
                  </button>
                )}

                {(!category.collapsible || !isColl || hasActive) && (
                  <div className="space-y-1">
                    {category.items
                      .filter(i => !i.hidden)
                      .map(item => {
                        const Icon = item.icon
                        const isActive = pathname === item.href

                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-all group',
                              isActive
                                ? 'bg-red-50 text-red-600 shadow-sm'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            )}
                          >
                            <Icon
                              className={cn(
                                'w-5 h-5',
                                isActive
                                  ? 'text-red-600'
                                  : 'text-gray-400 group-hover:text-gray-600'
                              )}
                            />
                            <span className="text-sm tracking-tight">{item.label}</span>
                            {item.id === 'signup-requests' && pendingSignupCount > 0 && (
                              <span className="ml-auto w-5 h-5 rounded-full bg-red-600 text-[10px] font-black text-white flex items-center justify-center animate-pulse">
                                {pendingSignupCount > 99 ? '99+' : pendingSignupCount}
                              </span>
                            )}
                          </Link>
                        )
                      })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl border-2 border-gray-100 text-gray-500 font-black text-xs uppercase tracking-widest hover:bg-gray-50 hover:text-gray-900 transition-all active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          로그아웃
        </button>
      </div>
    </div>
  )
}
