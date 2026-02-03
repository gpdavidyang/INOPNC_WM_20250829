'use client'

import { cn } from '@/lib/utils'
import { Bell, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Announcement {
  id: string
  title: string
  content: string
  priority: string | null
}

export function PremiumNoticeSection() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/announcements?status=active')
      .then(r => r.json())
      .then(j => {
        setAnnouncements(Array.isArray(j?.announcements) ? j.announcements : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (announcements.length <= 1) return
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % announcements.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [announcements.length])

  if (loading) return null

  const current = announcements[activeIndex]

  return (
    <div
      onClick={() => router.push('/mobile/announcements')}
      className="mx-1 mt-6 p-4 rounded-3xl bg-blue-600 shadow-xl shadow-blue-500/20 flex items-center gap-4 cursor-pointer hover:bg-blue-700 transition-all active:scale-[0.98] group"
    >
      <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
        <Bell className="w-5 h-5 animate-bounce" style={{ animationDuration: '3s' }} />
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
            Flash Notice
          </span>
          {current?.priority === 'high' && (
            <span className="text-[9px] font-black bg-rose-500 text-white px-1.5 py-0 rounded">
              URGENT
            </span>
          )}
        </div>
        <div className="relative h-5">
          {announcements.map((a, idx) => (
            <p
              key={a.id}
              className={cn(
                'absolute inset-0 text-sm font-bold text-white truncate transition-all duration-500',
                idx === activeIndex ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              )}
            >
              {a.content || a.title}
            </p>
          ))}
          {!current && (
            <p className="text-sm font-bold text-white/50">새로운 공지사항이 없습니다.</p>
          )}
        </div>
      </div>

      <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
    </div>
  )
}
