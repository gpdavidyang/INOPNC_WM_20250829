'use client'

import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose }) => {
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    // Get user profile
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile) {
          setUserProfile(profile)
        }
      }
    }

    fetchProfile()
  }, [])

  useEffect(() => {
    // Lock body scroll when drawer is open
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const getRoleDisplay = (role: string) => {
    const roleMap: { [key: string]: string } = {
      worker: '작업자',
      site_manager: '현장관리자',
      customer_manager: '고객관리자',
      admin: '관리자',
      system_admin: '시스템관리자',
    }
    return roleMap[role] || role
  }

  const menuItems = [
    { label: '홈', href: '/mobile' },
    { label: '출력현황', href: '/mobile/worklog' },
    { label: '작업일지', href: '/mobile/tasks' },
    { label: '현장정보', href: '/mobile/sites' },
    { label: '문서함', href: '/mobile/documents' },
  ]

  return (
    <>
      {/* Scrim (Background Overlay) */}
      <div
        id="drawerScrim"
        className={`drawer-scrim ${isOpen ? 'show' : ''}`}
        aria-hidden={!isOpen}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        id="drawer"
        className={`drawer ${isOpen ? 'show' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
      >
        <div className="drawer-body">
          <div className="drawer-scale">
            {/* Profile Section */}
            <div className="profile-sec">
              <div className="profile-header">
                <div className="profile-name" id="profileUserName">
                  {userProfile?.full_name || '사용자'}
                  <span
                    className="important-tag"
                    style={{ position: 'relative', top: 0, right: 0, marginLeft: '8px' }}
                  >
                    {getRoleDisplay(userProfile?.role || '')}
                  </span>
                </div>
                <button className="close-btn" id="drawerCloseBtn" onClick={onClose}>
                  닫기
                </button>
              </div>
              <div className="profile-email" id="profileUserEmail">
                {userProfile?.email || ''}
              </div>
            </div>

            {/* Menu List */}
            <ul className="menu-list">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <a
                    className="menu-item"
                    href={item.href}
                    onClick={e => {
                      e.preventDefault()
                      router.push(item.href)
                      onClose()
                    }}
                  >
                    <span className="menu-label">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="drawer-foot">
          <button className="logout-btn" type="button" id="drawerLogout" onClick={handleLogout}>
            로그아웃
          </button>
        </div>

        <style jsx>{`
          .drawer-body {
            padding: 0;
            flex: 1;
            overflow: visible;
          }

          .drawer-scale {
            transform-origin: top center;
            will-change: transform;
            padding: 20px 16px;
          }

          .profile-sec {
            display: flex;
            flex-direction: column;
            margin: 10px 0 16px;
            gap: 8px;
          }

          .profile-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
          }

          .profile-name {
            font:
              600 18px/1.2 'Noto Sans KR',
              system-ui,
              -apple-system,
              'Segoe UI',
              Roboto,
              sans-serif;
            color: #1a254f;
          }

          [data-theme='dark'] .profile-name {
            color: #e9eef5;
          }

          .important-tag {
            display: inline-block;
            padding: 2px 8px;
            background: #1a254f;
            color: #fff;
            font-size: 12px;
            font-weight: 600;
            border-radius: 4px;
          }

          .close-btn {
            padding: 6px 12px;
            background: transparent;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            color: #6b7280;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .close-btn:hover {
            background: #f3f4f6;
            border-color: #d1d5db;
          }

          .profile-email {
            font:
              400 13px 'Noto Sans KR',
              system-ui,
              -apple-system,
              'Segoe UI',
              Roboto,
              sans-serif;
            color: #64748b;
            text-align: left;
          }

          [data-theme='dark'] .profile-email {
            color: #94a3b8;
          }

          .menu-list {
            list-style: none;
            padding: 0;
            margin: 20px 0;
          }

          .menu-item {
            display: flex;
            align-items: center;
            padding: 14px 16px;
            color: #111827;
            text-decoration: none;
            font:
              500 15px/1.2 'Noto Sans KR',
              system-ui,
              -apple-system,
              'Segoe UI',
              Roboto,
              sans-serif;
            border-radius: 8px;
            transition: all 0.2s ease;
          }

          .menu-item:hover {
            background: #f3f4f6;
          }

          [data-theme='dark'] .menu-item {
            color: #e5e7eb;
          }

          [data-theme='dark'] .menu-item:hover {
            background: rgba(255, 255, 255, 0.05);
          }

          .drawer-foot {
            margin-top: auto;
            padding: 16px;
            border-top: 1px solid var(--nav-border);
            padding-bottom: max(16px, env(safe-area-inset-bottom, 0px));
          }

          .logout-btn {
            width: 100%;
            height: 48px;
            border-radius: 12px;
            border: 1px solid #1a254f;
            background: #1a254f;
            font-family:
              'Noto Sans KR',
              system-ui,
              -apple-system,
              'Segoe UI',
              Roboto,
              sans-serif;
            font-size: 14px;
            font-weight: 700;
            line-height: 1.2;
            color: #ffffff;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .logout-btn:hover {
            background: #162043;
            border-color: #162043;
          }

          [data-theme='dark'] .logout-btn {
            background: #1a254f;
            border-color: #1a254f;
            color: #ffffff;
          }

          [data-theme='dark'] .logout-btn:hover {
            background: #162043;
            border-color: #162043;
          }
        `}</style>
      </aside>
    </>
  )
}
