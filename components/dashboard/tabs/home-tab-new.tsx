'use client'

import React, { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface HomeTabProps {
  profile: Profile
  onTabChange?: (tabId: string) => void
  onDocumentsSearch?: (searchTerm: string) => void
  initialCurrentSite?: any
  initialSiteHistory?: any[]
}

interface QuickMenuItem {
  id: string
  name: string
  iconUrl: string
  path: string
}

interface Notice {
  id: string
  title: string
  content: string
  createdAt: string
  type: 'announcement' | 'notice' | 'event'
  tag?: string
}

export default function HomeTabNew({ profile, onTabChange }: HomeTabProps) {
  const router = useRouter()
  const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0)
  const [notices, setNotices] = useState<Notice[]>([])
  const [isNoticeHovered, setIsNoticeHovered] = useState(false)

  // Quick menu items - 6 items with actual icon URLs from base.html
  const quickMenuItems: QuickMenuItem[] = [
    {
      id: 'attendance',
      name: '출력현황',
      iconUrl: 'https://postfiles.pstatic.net/MjAyNTA5MDlfMzMg/MDAxNzU3MzczOTIzOTg2.eKgzH2aeZVhrEtYCSg-Vjyuok2eudz505Ck18_zeqpsg.r-W69aHdwVPEBS58wMg5LyR7-mDy3WaW_Yyt9I-Ax8kg.PNG/%EC%B6%9C%EB%A0%A5%ED%98%84%ED%99%A9.png?type=w966',
      path: '/dashboard/attendance'
    },
    {
      id: 'daily-reports',
      name: '작업일지',
      iconUrl: 'https://postfiles.pstatic.net/MjAyNTA5MDlfNDIg/MDAxNzU3MzczOTIzOTE5.uKHob9PU2yFuDqyYrTvUYHunByHEBj0A7pUASU7CEREg.3-0zMZk_TTNxnCDNBVAvSSxeGYcWdeot0GzIWhgD72Ug.PNG/%EC%9E%91%EC%97%85%EC%9D%BC%EC%A7%80.png?type=w966',
      path: '/dashboard/daily-reports'
    },
    {
      id: 'site-info',
      name: '현장정보',
      iconUrl: 'https://postfiles.pstatic.net/MjAyNTA5MDlfMTg4/MDAxNzU3MzczOTIzNjQ4.t3FLSpag_6badT7CAFsHXFj2wTbUWJh_3iHKxWR1DEwg.80vrXfmE4WGWg206E9n0XibJFSkfk1RkUr-lDpzyXh4g.PNG/%ED%98%84%EC%9E%A5%EC%A0%95%EB%B3%B4.png?type=w966',
      path: '/dashboard/site-info'
    },
    {
      id: 'documents',
      name: '문서함',
      iconUrl: 'https://postfiles.pstatic.net/MjAyNTA5MDlfMjc2/MDAxNzU3MzczOTIzNjUx.O1t90awoAKjRWjXhHYAnUEen68ptahXE1NWbYNvjy8Yg.440PWbQoaCp1dpPCgCvnlKU8EASGSAXMHb0zGEKnLHkg.PNG/%EB%AC%B8%EC%84%9C%ED%95%A8.png?type=w966',
      path: '/dashboard/documents'
    },
    {
      id: 'requests',
      name: '본사요청',
      iconUrl: 'https://postfiles.pstatic.net/MjAyNTA5MDlfNjEg/MDAxNzU3MzczOTIzODI4.vHsIasE2fPt-A9r28ui5Sw7oGf9JXhxetAh96TdAHgcg.iV39dkzonq61Z_hvu1O1-FLwCNFqM-OCqrNDwN3EuI8g.PNG/%EB%B3%B8%EC%82%AC%EC%9A%94%EC%B2%AD.png?type=w966',
      path: '/dashboard/requests'
    },
    {
      id: 'materials',
      name: '재고관리',
      iconUrl: 'https://postfiles.pstatic.net/MjAyNTA5MDlfMTAg/MDAxNzU3MzczOTIzODc2.V3ORy11Kszltv6qJ6M3zt4qFtdNopNi1sYcrZALvFD0g.5ZpgJNYRXfyedL0hVpIfo1sxqgBPUAO9SmMjmKf7qZgg.PNG/%EC%9E%AC%EA%B3%A0%EA%B4%80%EB%A6%AC.png?type=w966',
      path: '/dashboard/materials'
    }
  ]

  // Load notices
  useEffect(() => {
    loadNotices()
  }, [])

  // Auto-rotate notices
  useEffect(() => {
    if (notices.length > 1 && !isNoticeHovered) {
      const interval = setInterval(() => {
        setCurrentNoticeIndex((prev) => (prev + 1) % notices.length)
      }, 3000) // Rotate every 3 seconds

      return () => clearInterval(interval)
    }
  }, [notices, isNoticeHovered])

  const loadNotices = async () => {
    try {
      const supabase = createClient()
      
      // Load system notifications
      const { data: notifications } = await supabase
        .from('system_notifications')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5)

      if (notifications && notifications.length > 0) {
        const formattedNotices: Notice[] = notifications.map(n => ({
          id: n.id,
          title: n.title,
          content: n.message,
          createdAt: n.created_at,
          type: n.type || 'announcement',
          tag: n.type === 'announcement' ? '[공지사항]' : n.type === 'event' ? '[이벤트]' : '[업데이트]'
        }))
        setNotices(formattedNotices)
      } else {
        // Default notices
        setNotices([
          { 
            id: '1', 
            title: '[이벤트] 신규 회원 대상 특별 혜택 이벤트 진행 중', 
            content: '',
            createdAt: new Date().toISOString(),
            type: 'event',
            tag: '[이벤트]'
          },
          { 
            id: '2', 
            title: '[공지] 시스템 정기 점검 안내 (12/15 02:00-04:00)', 
            content: '',
            createdAt: new Date().toISOString(),
            type: 'announcement',
            tag: '[공지]'
          }
        ])
      }
    } catch (error) {
      console.error('Failed to load notices:', error)
      // Default notices on error
      setNotices([
        { 
          id: '1', 
          title: '[이벤트] 신규 회원 대상 특별 혜택 이벤트 진행 중', 
          content: '',
          createdAt: new Date().toISOString(),
          type: 'event',
          tag: '[이벤트]'
        }
      ])
    }
  }

  const handleQuickMenuClick = (path: string) => {
    router.push(path)
  }

  const handleNoticeClick = () => {
    router.push('/dashboard/notifications')
  }

  return (
    <div className="space-y-3">
      {/* Quick Menu Section - 빠른메뉴 */}
      <section 
        className="rounded-xl overflow-hidden"
        style={{ 
          backgroundColor: 'var(--card)',
          padding: '16px',
          marginBottom: '12px'
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-yellow-500 text-base">⚡</span>
          <h3 style={{ 
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--text)',
            fontFamily: 'var(--font-sans)'
          }}>
            빠른메뉴
          </h3>
        </div>
        
        {/* Quick menu grid - Exactly like base.html */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
            gap: '1px',
            margin: 0,
            padding: 0
          }}
        >
          {quickMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleQuickMenuClick(item.path)}
              className="quick-item"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1px',
                width: '100%',
                padding: '4px',
                borderRadius: '12px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
              }}
            >
              <img 
                src={item.iconUrl}
                alt={item.name}
                style={{
                  width: '100%',
                  height: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                  maxWidth: 'clamp(46px, 9.7vw, 78px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onError={(e) => {
                  // Fallback to local image if URL fails
                  const target = e.target as HTMLImageElement
                  target.src = '/images/brand/' + item.name + '.png'
                }}
              />
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#1A254F',
                whiteSpace: 'nowrap',
                textAlign: 'center',
                lineHeight: '1.2',
                marginTop: '2px',
                fontFamily: 'var(--font-sans)'
              }}>
                {item.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Notice Section - 공지사항 (Exactly like base.html) */}
      <section 
        className="rounded-xl overflow-hidden cursor-pointer"
        style={{
          backgroundColor: 'var(--card)',
          marginBottom: '12px'
        }}
        onClick={handleNoticeClick}
        onMouseEnter={() => setIsNoticeHovered(true)}
        onMouseLeave={() => setIsNoticeHovered(false)}
      >
        <div style={{
          paddingInline: '20px',
          paddingBlock: '16px',
          position: 'relative',
          minHeight: '56px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            height: '24px',
            overflow: 'hidden'
          }}>
            {notices.map((notice, index) => (
              <div
                key={notice.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  opacity: index === currentNoticeIndex ? 1 : 0,
                  transform: index === currentNoticeIndex 
                    ? 'translateY(0)' 
                    : index < currentNoticeIndex 
                      ? 'translateY(-100%)'
                      : 'translateY(100%)',
                  transition: 'opacity 0.4s ease, transform 0.4s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#6B7280',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontFamily: 'var(--font-sans)',
                  lineHeight: '1.4'
                }}>
                  {notice.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}