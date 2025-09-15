'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Announcement {
  id: string
  title: string
  content: string
  priority: string
  is_active: boolean
  created_at: string
}

export const NoticeSection: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Fetch announcements from backend
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        // Try to fetch from the API endpoint
        const response = await fetch('/api/announcements?status=active', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        if (response.ok) {
          const result = await response.json()
          if (result.announcements && result.announcements.length > 0) {
            setAnnouncements(result.announcements)
            setLoading(false)
            return
          }
        }

        // Fallback to direct Supabase query
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(10)

        if (error) {
          console.error('Failed to fetch announcements:', error)
          // Fallback to default notices if fetch fails
          setAnnouncements([
            {
              id: '1',
              title: '공지사항',
              content: '시스템 점검 안내: 1월 15일 오전 2시~4시',
              priority: 'high',
              is_active: true,
              created_at: new Date().toISOString(),
            },
            {
              id: '2',
              title: '업데이트',
              content: '새로운 기능이 추가되었습니다. 확인해보세요!',
              priority: 'normal',
              is_active: true,
              created_at: new Date().toISOString(),
            },
            {
              id: '3',
              title: '이벤트',
              content: '신규 작업자 대상 특별 교육 프로그램 진행 중',
              priority: 'normal',
              is_active: true,
              created_at: new Date().toISOString(),
            },
          ])
        } else if (data && data.length > 0) {
          setAnnouncements(data)
        } else {
          // If no announcements in database, use defaults
          setAnnouncements([
            {
              id: '1',
              title: '공지사항',
              content: '시스템 점검 안내: 1월 15일 오전 2시~4시',
              priority: 'high',
              is_active: true,
              created_at: new Date().toISOString(),
            },
            {
              id: '2',
              title: '업데이트',
              content: '새로운 기능이 추가되었습니다. 확인해보세요!',
              priority: 'normal',
              is_active: true,
              created_at: new Date().toISOString(),
            },
            {
              id: '3',
              title: '이벤트',
              content: '신규 작업자 대상 특별 교육 프로그램 진행 중',
              priority: 'normal',
              is_active: true,
              created_at: new Date().toISOString(),
            },
          ])
        }
      } catch (error) {
        console.error('Error loading announcements:', error)
        // Use fallback notices
        setAnnouncements([
          {
            id: '1',
            title: '공지사항',
            content: '시스템 점검 안내: 1월 15일 오전 2시~4시',
            priority: 'high',
            is_active: true,
            created_at: new Date().toISOString(),
          },
          {
            id: '2',
            title: '업데이트',
            content: '새로운 기능이 추가되었습니다. 확인해보세요!',
            priority: 'normal',
            is_active: true,
            created_at: new Date().toISOString(),
          },
          {
            id: '3',
            title: '이벤트',
            content: '신규 작업자 대상 특별 교육 프로그램 진행 중',
            priority: 'normal',
            is_active: true,
            created_at: new Date().toISOString(),
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [])

  // Auto-slide every 3 seconds
  useEffect(() => {
    if (announcements.length === 0) return

    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % announcements.length)
    }, 3000) // 3 seconds

    return () => clearInterval(interval)
  }, [announcements.length])

  // Get notice type label based on priority or title
  const getNoticeType = (announcement: Announcement) => {
    // Priority-based type
    if (announcement.priority === 'high') return '중요'
    if (announcement.priority === 'urgent') return '긴급'

    // Title-based type detection
    if (announcement.title.includes('공지')) return '공지사항'
    if (announcement.title.includes('업데이트') || announcement.title.includes('기능'))
      return '업데이트'
    if (announcement.title.includes('이벤트') || announcement.title.includes('행사'))
      return '이벤트'
    if (announcement.title.includes('점검')) return '시스템'

    return '알림'
  }

  if (loading) {
    return (
      <section id="notice-section" className="section mb-2">
        <div className="card notice-card">
          <div className="notice-content">
            <div className="notice-item active">
              <span className="notice-text">
                <strong className="tag-label">[로딩중]</strong>
                공지사항을 불러오는 중입니다...
              </span>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (announcements.length === 0) {
    return (
      <section id="notice-section" className="section mb-2">
        <div className="card notice-card">
          <div className="notice-content">
            <div className="notice-item active">
              <span className="notice-text">
                <strong className="tag-label">[알림]</strong>
                현재 등록된 공지사항이 없습니다.
              </span>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="notice-section" className="section mb-2">
      <div className="card notice-card">
        <div className="notice-content">
          {announcements.map((announcement, index) => (
            <div
              key={announcement.id}
              className={`notice-item ${index === activeIndex ? 'active' : ''}`}
            >
              <span className="notice-text">
                <strong className="tag-label">[{getNoticeType(announcement)}]</strong>
                {announcement.content}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
