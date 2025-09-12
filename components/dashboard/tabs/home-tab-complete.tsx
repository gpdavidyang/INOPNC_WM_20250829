'use client'

import React, { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown, Camera, FileText } from 'lucide-react'
import Image from 'next/image'

// Static image imports
import payIcon from '@/public/images/pay.png'
import reportIcon from '@/public/images/report.png'
import mapIcon from '@/public/images/map.png'
import documentsIcon from '@/public/images/documents.svg'
import requestsIcon from '@/public/images/requests.svg'
import inventoryIcon from '@/public/images/inventory.svg'

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
  iconUrl: string | any // Allow StaticImageData type
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

export default function HomeTabComplete({ profile, onTabChange }: HomeTabProps) {
  const router = useRouter()
  const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0)
  const [notices, setNotices] = useState<Notice[]>([])
  const [isNoticeHovered, setIsNoticeHovered] = useState(false)
  
  // Form states
  const [selectedSite, setSelectedSite] = useState('현장1')
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0])
  const [workPart, setWorkPart] = useState('')
  const [workProcess, setWorkProcess] = useState('')
  const [workArea, setWorkArea] = useState('')
  const [beforePhotos, setBeforePhotos] = useState<File[]>([])
  const [afterPhotos, setAfterPhotos] = useState<File[]>([])
  const [receipts, setReceipts] = useState<File[]>([])
  const [drawings, setDrawings] = useState<File[]>([])
  const [activeUploadType, setActiveUploadType] = useState<string | null>(null)

  // Quick menu items - 6 items with static imports
  const quickMenuItems: QuickMenuItem[] = [
    {
      id: 'attendance',
      name: '출력현황',
      iconUrl: payIcon,
      path: '/dashboard/attendance'
    },
    {
      id: 'daily-reports',
      name: '작업일지',
      iconUrl: reportIcon,
      path: '/dashboard/daily-reports'
    },
    {
      id: 'site-info',
      name: '현장정보',
      iconUrl: mapIcon,
      path: '/dashboard/site-info'
    },
    {
      id: 'documents',
      name: '문서함',
      iconUrl: documentsIcon,
      path: '/dashboard/documents'
    },
    {
      id: 'requests',
      name: '본사요청',
      iconUrl: requestsIcon,
      path: '/dashboard/requests'
    },
    {
      id: 'inventory',
      name: '재고관리',
      iconUrl: inventoryIcon,
      path: '/dashboard/inventory'
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
    <div>
      {/* Quick Menu Section - 빠른메뉴 */}
      <section 
        style={{ 
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
              <div style={{ position: 'relative', width: '64px', height: '64px' }}>
                <Image 
                  src={item.iconUrl}
                  alt={item.name}
                  width={64}
                  height={64}
                  style={{
                    objectFit: 'contain',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
              </div>
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
          backgroundColor: '#F8F9FB',
          border: '1px solid #E6ECF4',
          marginTop: '0',
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
                  color: '#374151',
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

      {/* Site Selection Section - 현장선택 */}
      <section style={{ marginBottom: '12px' }}>
        <h3 style={{
          fontSize: '17px',
          fontWeight: 700,
          color: '#1A254F',
          marginBottom: '8px',
          fontFamily: 'var(--font-sans)'
        }}>
          현장선택
        </h3>
        <button
          style={{
            width: '100%',
            height: '48px',
            padding: '0 16px',
            backgroundColor: '#fff',
            border: '1px solid #E6ECF4',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 600,
            color: '#1A254F',
            fontFamily: 'var(--font-sans)',
            transition: 'all 0.2s ease'
          }}
          onClick={() => console.log('Site selection')}
        >
          <span>{selectedSite}</span>
          <ChevronDown className="w-5 h-5" style={{ color: '#6B7280' }} />
        </button>
      </section>

      {/* Work Info Section - 작업정보 */}
      <section style={{ marginBottom: '12px' }}>
        <h3 style={{
          fontSize: '17px',
          fontWeight: 700,
          color: '#1A254F',
          marginBottom: '8px',
          fontFamily: 'var(--font-sans)'
        }}>
          작업정보
        </h3>
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #E6ECF4',
          borderRadius: '14px',
          padding: '14px'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#6B7280',
              marginBottom: '4px',
              display: 'block',
              fontFamily: 'var(--font-sans)'
            }}>
              작업일
            </label>
            <input
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              style={{
                width: '100%',
                height: '44px',
                padding: '0 12px',
                border: '1px solid #E6ECF4',
                borderRadius: '8px',
                fontSize: '15px',
                color: '#1A254F',
                fontFamily: 'var(--font-sans)'
              }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#6B7280',
              marginBottom: '4px',
              display: 'block',
              fontFamily: 'var(--font-sans)'
            }}>
              선택한 현장
            </label>
            <div style={{
              padding: '12px',
              backgroundColor: '#F8F9FB',
              borderRadius: '8px',
              fontSize: '15px',
              color: '#1A254F',
              fontWeight: 600,
              fontFamily: 'var(--font-sans)'
            }}>
              {selectedSite}
            </div>
          </div>
        </div>
      </section>

      {/* Work Content Section - 작업내용기록 */}
      <section style={{ marginBottom: '12px' }}>
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #E6ECF4',
          borderRadius: '14px',
          padding: '14px'
        }}>
          <h3 style={{
            fontSize: '17px',
            fontWeight: 700,
            color: '#1A254F',
            marginBottom: '12px',
            fontFamily: 'var(--font-sans)'
          }}>
            작업내용기록
          </h3>
          
          {/* 부재명 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>부재명</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
              {['슬라브', '거더', '기둥'].map((item) => (
                <button
                  key={item}
                  onClick={(e) => {
                    const btn = e.currentTarget;
                    const isActive = btn.getAttribute('data-active') === 'true';
                    btn.setAttribute('data-active', !isActive ? 'true' : 'false');
                    btn.style.backgroundColor = !isActive ? '#2563eb' : '#ffffff';
                    btn.style.color = !isActive ? '#ffffff' : '#000000';
                    btn.style.borderColor = !isActive ? '#2563eb' : '#E6ECF4';
                  }}
                  data-active="false"
                  style={{
                    flex: 1,
                    height: '48px',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    border: '1px solid #E6ECF4',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    minWidth: 0
                  }}
                >
                  {item}
                </button>
              ))}
              <input
                type="text"
                placeholder="기타 직접입력"
                style={{
                  flex: 1,
                  height: '48px',
                  padding: '0 12px',
                  border: '1px solid #E6ECF4',
                  borderRadius: '12px',
                  fontSize: '14px',
                  minWidth: 0
                }}
              />
            </div>
          </div>
          
          {/* 작업공정 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>작업공정</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
              {['균열', '면', '마감'].map((item) => (
                <button
                  key={item}
                  onClick={(e) => {
                    const btn = e.currentTarget;
                    const isActive = btn.getAttribute('data-active') === 'true';
                    btn.setAttribute('data-active', !isActive ? 'true' : 'false');
                    btn.style.backgroundColor = !isActive ? '#2563eb' : '#ffffff';
                    btn.style.color = !isActive ? '#ffffff' : '#000000';
                    btn.style.borderColor = !isActive ? '#2563eb' : '#E6ECF4';
                  }}
                  data-active="false"
                  style={{
                    flex: 1,
                    height: '48px',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    border: '1px solid #E6ECF4',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    minWidth: 0
                  }}
                >
                  {item}
                </button>
              ))}
              <input
                type="text"
                placeholder="기타 직접입력"
                style={{
                  flex: 1,
                  height: '48px',
                  padding: '0 12px',
                  border: '1px solid #E6ECF4',
                  borderRadius: '12px',
                  fontSize: '14px',
                  minWidth: 0
                }}
              />
            </div>
          </div>
          
          {/* 구분선 */}
          <div style={{ borderTop: '1px solid #E6ECF4', margin: '24px auto', width: '98%' }}></div>
          
          {/* 작업구간 */}
          <h3 style={{
            fontSize: '17px',
            fontWeight: 700,
            color: '#1A254F',
            marginBottom: '12px',
            fontFamily: 'var(--font-sans)'
          }}>
            작업구간
          </h3>
          
          {/* 작업유형 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>작업유형</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
              {['지하', '지붕'].map((item) => (
                <button
                  key={item}
                  onClick={(e) => {
                    const btn = e.currentTarget;
                    const isActive = btn.getAttribute('data-active') === 'true';
                    btn.setAttribute('data-active', !isActive ? 'true' : 'false');
                    btn.style.backgroundColor = !isActive ? '#2563eb' : '#ffffff';
                    btn.style.color = !isActive ? '#ffffff' : '#000000';
                    btn.style.borderColor = !isActive ? '#2563eb' : '#E6ECF4';
                  }}
                  data-active="false"
                  data-code={item === '지하' ? 'UG' : 'RF'}
                  style={{
                    flex: 1,
                    height: '48px',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    border: '1px solid #E6ECF4',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    minWidth: 0
                  }}
                >
                  {item}
                </button>
              ))}
              <input
                type="text"
                placeholder="기타 직접입력"
                style={{
                  flex: 1,
                  height: '48px',
                  padding: '0 12px',
                  border: '1px solid #E6ECF4',
                  borderRadius: '12px',
                  fontSize: '14px',
                  minWidth: 0
                }}
              />
            </div>
          </div>
          
          {/* 블럭 / 동 / 호수 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>블럭 / 동 / 호수</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
              <input
                type="text"
                placeholder="블럭"
                onInput={(e) => {
                  const input = e.target as HTMLInputElement;
                  input.value = input.value.toUpperCase();
                }}
                style={{
                  flex: 1,
                  height: '48px',
                  padding: '0 12px',
                  border: '1px solid #E6ECF4',
                  borderRadius: '12px',
                  fontSize: '14px',
                  minWidth: 0
                }}
              />
              <input
                type="number"
                placeholder="동"
                min="0"
                onInput={(e) => {
                  const input = e.target as HTMLInputElement;
                  input.value = input.value.replace(/[^0-9]/g, '');
                }}
                style={{
                  flex: 1,
                  height: '48px',
                  padding: '0 12px',
                  border: '1px solid #E6ECF4',
                  borderRadius: '12px',
                  fontSize: '14px',
                  minWidth: 0
                }}
              />
              <input
                type="number"
                placeholder="호수"
                min="0"
                onInput={(e) => {
                  const input = e.target as HTMLInputElement;
                  input.value = input.value.replace(/[^0-9]/g, '');
                }}
                style={{
                  flex: 1,
                  height: '48px',
                  padding: '0 12px',
                  border: '1px solid #E6ECF4',
                  borderRadius: '12px',
                  fontSize: '14px',
                  minWidth: 0
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Photo Upload Section - 사진업로드 */}
      <section style={{ marginBottom: '12px' }}>
        <h3 style={{
          fontSize: '17px',
          fontWeight: 700,
          color: '#1A254F',
          marginBottom: '8px',
          fontFamily: 'var(--font-sans)'
        }}>
          사진업로드
        </h3>
        
        {/* Upload Type Selection Chips */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <button
            onClick={() => setActiveUploadType(activeUploadType === 'before' ? null : 'before')}
            style={{
              flex: 1,
              height: '48px',
              padding: '0 12px',
              border: '1px solid #E6ECF4',
              borderRadius: '12px',
              backgroundColor: activeUploadType === 'before' ? '#EFF6FF' : '#fff',
              color: activeUploadType === 'before' ? '#1A56DB' : '#1A254F',
              borderColor: activeUploadType === 'before' ? '#BBD7FF' : '#E6ECF4',
              fontSize: '15px',
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            보수전
          </button>
          <button
            onClick={() => setActiveUploadType(activeUploadType === 'after' ? null : 'after')}
            style={{
              flex: 1,
              height: '48px',
              padding: '0 12px',
              border: '1px solid #E6ECF4',
              borderRadius: '12px',
              backgroundColor: activeUploadType === 'after' ? '#EFF6FF' : '#fff',
              color: activeUploadType === 'after' ? '#1A56DB' : '#1A254F',
              borderColor: activeUploadType === 'after' ? '#BBD7FF' : '#E6ECF4',
              fontSize: '15px',
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            보수후
          </button>
        </div>

        {/* Upload Areas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Before Photos */}
          <div
            onClick={() => console.log('Upload before photos')}
            style={{
              minHeight: '48px',
              padding: '12px',
              backgroundColor: '#F4F8FF',
              border: '1px dashed #BBD7FF',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {beforePhotos.length === 0 ? (
              <>
                <Camera className="w-5 h-5" style={{ color: '#6B7280' }} />
                <span style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  fontFamily: 'var(--font-sans)'
                }}>
                  보수전 사진 추가
                </span>
              </>
            ) : (
              <span style={{
                fontSize: '14px',
                color: '#1A254F',
                fontFamily: 'var(--font-sans)'
              }}>
                {beforePhotos.length}개 사진
              </span>
            )}
          </div>

          {/* After Photos */}
          <div
            onClick={() => console.log('Upload after photos')}
            style={{
              minHeight: '48px',
              padding: '12px',
              backgroundColor: '#f0fdfd',
              border: '1px dashed #80deea',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {afterPhotos.length === 0 ? (
              <>
                <Camera className="w-5 h-5" style={{ color: '#6B7280' }} />
                <span style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  fontFamily: 'var(--font-sans)'
                }}>
                  보수후 사진 추가
                </span>
              </>
            ) : (
              <span style={{
                fontSize: '14px',
                color: '#1A254F',
                fontFamily: 'var(--font-sans)'
              }}>
                {afterPhotos.length}개 사진
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Document Upload Section - 서류업로드 */}
      <section style={{ marginBottom: '12px' }}>
        <h3 style={{
          fontSize: '17px',
          fontWeight: 700,
          color: '#1A254F',
          marginBottom: '8px',
          fontFamily: 'var(--font-sans)'
        }}>
          서류업로드
        </h3>
        
        {/* Upload Type Selection Chips */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <button
            onClick={() => setActiveUploadType(activeUploadType === 'receipt' ? null : 'receipt')}
            style={{
              flex: 1,
              height: '48px',
              padding: '0 12px',
              border: '1px solid #E6ECF4',
              borderRadius: '12px',
              backgroundColor: activeUploadType === 'receipt' ? '#EFF6FF' : '#fff',
              color: activeUploadType === 'receipt' ? '#1A56DB' : '#1A254F',
              borderColor: activeUploadType === 'receipt' ? '#BBD7FF' : '#E6ECF4',
              fontSize: '15px',
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            영수증
          </button>
          <button
            onClick={() => setActiveUploadType(activeUploadType === 'drawing' ? null : 'drawing')}
            style={{
              flex: 1,
              height: '48px',
              padding: '0 12px',
              border: '1px solid #E6ECF4',
              borderRadius: '12px',
              backgroundColor: activeUploadType === 'drawing' ? '#EFF6FF' : '#fff',
              color: activeUploadType === 'drawing' ? '#1A56DB' : '#1A254F',
              borderColor: activeUploadType === 'drawing' ? '#BBD7FF' : '#E6ECF4',
              fontSize: '15px',
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            도면
          </button>
        </div>

        {/* Document Upload Area */}
        <div
          onClick={() => console.log('Upload documents')}
          style={{
            minHeight: '48px',
            padding: '12px',
            backgroundColor: '#FAFAFF',
            border: '1px dashed #C7C7FF',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {(receipts.length === 0 && drawings.length === 0) ? (
            <>
              <FileText className="w-5 h-5" style={{ color: '#6B7280' }} />
              <span style={{
                fontSize: '14px',
                color: '#6B7280',
                fontFamily: 'var(--font-sans)'
              }}>
                서류 추가
              </span>
            </>
          ) : (
            <span style={{
              fontSize: '14px',
              color: '#1A254F',
              fontFamily: 'var(--font-sans)'
            }}>
              영수증 {receipts.length}개, 도면 {drawings.length}개
            </span>
          )}
        </div>
      </section>

      {/* Summary Section - 요약 */}
      <section style={{ marginBottom: '20px' }}>
        <h3 style={{
          fontSize: '17px',
          fontWeight: 700,
          color: '#1A254F',
          marginBottom: '8px',
          fontFamily: 'var(--font-sans)'
        }}>
          요약
        </h3>
        <div style={{
          backgroundColor: '#F8F9FB',
          border: '1px solid #E6ECF4',
          borderRadius: '14px',
          padding: '14px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{
                fontSize: '14px',
                color: '#6B7280',
                fontFamily: 'var(--font-sans)'
              }}>
                현장
              </span>
              <span style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#1A254F',
                fontFamily: 'var(--font-sans)'
              }}>
                {selectedSite}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{
                fontSize: '14px',
                color: '#6B7280',
                fontFamily: 'var(--font-sans)'
              }}>
                작업일
              </span>
              <span style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#1A254F',
                fontFamily: 'var(--font-sans)'
              }}>
                {workDate}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{
                fontSize: '14px',
                color: '#6B7280',
                fontFamily: 'var(--font-sans)'
              }}>
                작업내용
              </span>
              <span style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#1A254F',
                fontFamily: 'var(--font-sans)'
              }}>
                {workPart || '-'} / {workProcess || '-'} / {workArea || '-'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{
                fontSize: '14px',
                color: '#6B7280',
                fontFamily: 'var(--font-sans)'
              }}>
                사진
              </span>
              <span style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#1A254F',
                fontFamily: 'var(--font-sans)'
              }}>
                보수전 {beforePhotos.length}개, 보수후 {afterPhotos.length}개
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{
                fontSize: '14px',
                color: '#6B7280',
                fontFamily: 'var(--font-sans)'
              }}>
                서류
              </span>
              <span style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#1A254F',
                fontFamily: 'var(--font-sans)'
              }}>
                영수증 {receipts.length}개, 도면 {drawings.length}개
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Save Button - 저장하기 */}
      <button
        onClick={() => console.log('Save work log')}
        style={{
          width: '100%',
          height: '48px',
          backgroundColor: '#1A254F',
          color: '#fff',
          border: 'none',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: 700,
          fontFamily: 'var(--font-sans)',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          marginBottom: '20px'
        }}
      >
        저장하기
      </button>
    </div>
  )
}