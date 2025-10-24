'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Announcement {
  id: string
  title: string
  content: string
  priority: string | null
  is_active: boolean | null
  created_at: string
}

// Default announcements as fallback
const defaultAnnouncements: Announcement[] = [
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
]

export const NoticeSection: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>(defaultAnnouncements)
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Fetch announcements from backend
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        console.log('Fetching announcements from API...')

        // Fetch from API endpoint
        const response = await fetch('/api/announcements?status=active', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const result = await response.json()
          console.log('API Response:', result)

          if (
            result.announcements &&
            Array.isArray(result.announcements) &&
            result.announcements.length > 0
          ) {
            console.log(`Loaded ${result.announcements.length} announcements from API`)
            setAnnouncements(result.announcements)
          } else if (result.success === false || result.error) {
            console.error('API returned error:', result.error)
            // Keep default announcements
          } else {
            console.log('No announcements from API, using defaults')
            // Keep default announcements
          }
        } else {
          console.error('API response not ok:', response.status, response.statusText)
          // Keep default announcements
        }
      } catch (error) {
        console.error('Failed to fetch announcements:', error)
        // Keep default announcements
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
    if (announcement.title?.includes('공지')) return '공지사항'
    if (announcement.title?.includes('업데이트') || announcement.title?.includes('기능'))
      return '업데이트'
    if (announcement.title?.includes('이벤트') || announcement.title?.includes('행사'))
      return '이벤트'
    if (announcement.title?.includes('점검')) return '시스템'
    if (announcement.title?.includes('안전')) return '안전'
    if (announcement.title?.includes('급여')) return '급여'
    if (announcement.title?.includes('현장')) return '현장'

    return '알림'
  }

  if (loading) {
    return (
      <section id="home-notice" className="section">
        <div className="card notice-card">
          <div className="notice-content">
            <div className="notice-item active">
              <span className="notice-text" style={{ color: '#101828', opacity: 1 }}>
                <strong className="tag-label" style={{ color: '#101828', opacity: 1 }}>
                  [로딩중]
                </strong>
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
      <section id="home-notice" className="section">
        <div className="card notice-card">
          <div className="notice-content">
            <div className="notice-item active">
              <span className="notice-text" style={{ color: '#101828', opacity: 1 }}>
                <strong className="tag-label" style={{ color: '#101828', opacity: 1 }}>
                  [알림]
                </strong>
                현재 등록된 공지사항이 없습니다.
              </span>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="home-notice" className="section">
      <div className="card notice-card">
        <div
          className="notice-content cursor-pointer"
          role="button"
          aria-label="공지사항 목록 보기"
          tabIndex={0}
          onClick={() => {
            router.push('/mobile/announcements')
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              router.push('/mobile/announcements')
            }
          }}
        >
          {announcements.map((announcement, index) => (
            <div
              key={announcement.id}
              className={`notice-item ${index === activeIndex ? 'active' : ''}`}
            >
              <span className="notice-text" style={{ color: '#101828', opacity: 1 }}>
                <strong className="tag-label" style={{ color: '#101828', opacity: 1 }}>
                  [{getNoticeType(announcement)}]
                </strong>
                {announcement.content}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
