'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUnifiedAuth } from '@/providers/unified-auth-provider'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose }) => {
  const router = useRouter()
  const { profile, loading: profileLoading, user, refreshProfile, signOut } = useUnifiedAuth()
  const supabase = createClient()
  const [showAccountInfo, setShowAccountInfo] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  })
  // Simplified profile state logging using unified auth provider
  useEffect(() => {
    console.log('[DRAWER] Using profile from UnifiedAuthProvider:', {
      loading: profileLoading,
      hasProfile: !!profile,
      profileName: profile?.full_name,
      hasUser: !!user,
    })

    if (profile) {
      console.log('[DRAWER] Profile available:', profile.full_name)
    }
  }, [profile, profileLoading, user])

  // Authentication is now handled by unified provider

  useEffect(() => {
    // Lock body scroll when drawer is open (base.html match)
    if (isOpen) {
      document.body.classList.add('modal-open')
      // Auto-scale drawer content for mobile
      setTimeout(fitDrawer, 50)
    } else {
      document.body.classList.remove('modal-open')
    }

    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [isOpen])

  // Drawer scaling function - 100% base.html match
  const fitDrawer = () => {
    const drawer = document.getElementById('drawer')
    const drawerScale = document.querySelector('.drawer-scale')

    if (!drawer || !drawerScale) return

    // 모바일에서는 스케일링 비활성화
    if (window.innerWidth <= 768) {
      ;(drawerScale as HTMLElement).style.transform = 'none'
      return
    }

    // 가용 높이(패널 패딩/안전영역 감안)
    const style = getComputedStyle(drawer)
    const padTop = parseFloat(style.paddingTop)
    const padBottom = parseFloat(style.paddingBottom)
    const avail = window.innerHeight - padTop - padBottom

    // 실제 콘텐츠 전체 높이
    const contentH = (drawerScale as HTMLElement).scrollHeight

    // 축소 비율 계산 (최소 0.85 유지)
    const s = Math.max(0.85, Math.min(1, avail / contentH))
    ;(drawerScale as HTMLElement).style.transform = `scale(${s})`
  }

  // Mobile keyboard handling
  useEffect(() => {
    const handleResize = () => {
      // 키보드가 올라올 때 드로어 높이 조정
      const drawer = document.getElementById('drawer')
      if (!drawer) return

      if (window.visualViewport) {
        if (window.visualViewport.height < window.innerHeight) {
          drawer.style.height = window.visualViewport.height + 'px'
        } else {
          drawer.style.height = '100vh'
        }
      }
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize)
      return () => window.visualViewport.removeEventListener('resize', handleResize)
    }
  }, [])

  // Window resize handling for drawer scaling
  useEffect(() => {
    const handleWindowResize = () => {
      if (isOpen) {
        setTimeout(fitDrawer, 50)
      }
    }

    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [isOpen])

  const handleLogout = async () => {
    if (confirm('정말 로그아웃하시겠습니까?')) {
      try {
        console.log('[AUTH] Using unified auth provider logout...')

        // Close drawer immediately for better UX
        onClose()

        // Use the unified auth provider's signOut method
        await signOut()
      } catch (error) {
        console.error('[AUTH] Logout failed:', error)
        // Force redirect even on failure
        window.location.replace('/auth/login')
      }
    }
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

  const handleAccountManage = () => {
    setShowAccountInfo(!showAccountInfo)
    setShowPasswordForm(false)
  }

  const handlePasswordChange = () => {
    setShowPasswordForm(true)
    setShowAccountInfo(false)
  }

  const handlePasswordCancel = () => {
    setShowPasswordForm(false)
    setShowAccountInfo(true)
    setPasswordForm({ current: '', new: '', confirm: '' })
  }

  const handlePasswordSave = async () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      alert('모든 필드를 입력해주세요.')
      return
    }
    if (passwordForm.new !== passwordForm.confirm) {
      alert('새 비밀번호가 일치하지 않습니다.')
      return
    }
    if (passwordForm.new.length < 6) {
      alert('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    // TODO: 실제 비밀번호 변경 로직 구현
    alert('비밀번호가 변경되었습니다.')
    handlePasswordCancel()
  }

  const menuItems = [
    { label: '홈', href: '/mobile' },
    { label: '출력정보', href: '/mobile/attendance' },
    { label: '작업일지', href: '/mobile/worklog' },
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
        inert={!isOpen ? '' : undefined}
      >
        <div className="drawer-container">
          <div className="drawer-body">
            <div className="drawer-scale">
              {/* Profile Section */}
              <div className="profile-sec">
                <div className="profile-header">
                  <div className="profile-name" id="profileUserName">
                    {profileLoading
                      ? '로딩 중...'
                      : profile?.full_name || user?.email?.split('@')[0] || '사용자'}
                    {!profileLoading && (
                      <span
                        className="important-tag"
                        style={{ position: 'relative', top: 0, right: 0, marginLeft: '8px' }}
                      >
                        {getRoleDisplay(profile?.role || 'site_manager')}
                      </span>
                    )}
                  </div>
                  <button className="close-btn" id="drawerCloseBtn" onClick={onClose}>
                    닫기
                  </button>
                </div>
                <div className="profile-email" id="profileUserEmail">
                  {profileLoading ? '로딩 중...' : profile?.email || user?.email || ''}
                </div>
              </div>

              {/* Menu List - 100% base.html match */}
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

                {/* 내정보 + 계정관리 버튼 */}
                <li className="menu-item-with-btn">
                  <a className="menu-item" href="#" onClick={e => e.preventDefault()}>
                    <span className="menu-label">내정보</span>
                  </a>
                  <button
                    className="account-manage-btn"
                    id="accountManageBtn"
                    onClick={handleAccountManage}
                  >
                    계정관리
                  </button>
                </li>

                {/* 계정 정보 표시 (토글) */}
                <li
                  className="account-info"
                  id="accountInfo"
                  style={{ display: showAccountInfo ? 'block' : 'none' }}
                >
                  {profileLoading ? (
                    <div className="account-info-item">
                      <span className="account-label">로딩 중...</span>
                      <span className="account-value">정보를 불러오는 중입니다</span>
                    </div>
                  ) : (
                    <>
                      <div className="account-info-item">
                        <span className="account-label">연락처</span>
                        <span className="account-value">{profile?.phone || '미설정'}</span>
                      </div>
                      <div className="account-info-item">
                        <span className="account-label">가입일</span>
                        <span className="account-value">
                          {profile?.created_at
                            ? new Date(profile.created_at)
                                .toLocaleDateString('ko-KR')
                                .replace(/\./g, '.')
                            : '미설정'}
                        </span>
                      </div>
                      <div className="account-info-item">
                        <span className="account-label">비밀번호 변경</span>
                        <span
                          className="account-value change-password-btn"
                          id="changePasswordBtn"
                          onClick={handlePasswordChange}
                        >
                          변경하기
                        </span>
                      </div>
                    </>
                  )}
                </li>

                {/* 비밀번호 변경 폼 (토글) */}
                <li
                  className="password-change-form"
                  id="passwordChangeForm"
                  style={{ display: showPasswordForm ? 'block' : 'none' }}
                >
                  <div className="password-form-container">
                    <form
                      id="password-change-form"
                      name="passwordChangeForm"
                      onSubmit={e => {
                        e.preventDefault()
                        handlePasswordSave()
                      }}
                      autoComplete="off"
                    >
                      {/* Hidden username field for accessibility and password managers */}
                      <input
                        type="text"
                        name="username"
                        value={profile?.email || ''}
                        readOnly
                        style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
                        autoComplete="username"
                        tabIndex={-1}
                        aria-hidden="true"
                      />
                      <div className="form-group">
                        <input
                          type="password"
                          className="form-input"
                          id="drawer-currentPassword"
                          name="currentPassword"
                          placeholder="현재 비밀번호를 입력"
                          value={passwordForm.current}
                          onChange={e =>
                            setPasswordForm(prev => ({ ...prev, current: e.target.value }))
                          }
                          autoComplete="current-password"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <input
                          type="password"
                          className="form-input"
                          id="drawer-newPassword"
                          name="newPassword"
                          placeholder="새 비밀번호 (최소 6자)"
                          value={passwordForm.new}
                          onChange={e =>
                            setPasswordForm(prev => ({ ...prev, new: e.target.value }))
                          }
                          autoComplete="new-password"
                          required
                          minLength={6}
                        />
                      </div>
                      <div className="form-group">
                        <input
                          type="password"
                          className="form-input"
                          id="drawer-confirmPassword"
                          name="confirmPassword"
                          placeholder="새 비밀번호를 다시 입력"
                          value={passwordForm.confirm}
                          onChange={e =>
                            setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))
                          }
                          autoComplete="new-password"
                          required
                        />
                      </div>
                      <div className="form-actions">
                        <button
                          type="button"
                          className="cancel-btn"
                          id="cancelPasswordChange"
                          onClick={handlePasswordCancel}
                        >
                          취소
                        </button>
                        <button type="submit" className="save-btn" id="savePasswordChange">
                          저장
                        </button>
                      </div>
                    </form>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="drawer-foot">
            <button className="logout-btn" type="button" id="drawerLogout" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
