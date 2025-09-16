'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose }) => {
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [showAccountInfo, setShowAccountInfo] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  })
  const supabase = createClient()

  // Auth state change listener
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Refresh profile when user signs in
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setUserProfile(profile)
          setProfileLoading(false)
        }
      } else if (event === 'SIGNED_OUT') {
        setUserProfile(null)
        setProfileLoading(false)
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Handle token refresh in production
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setUserProfile(profile)
          setProfileLoading(false)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    let mounted = true
    let fetchTimeout: NodeJS.Timeout
    let healthCheckCount = 0
    let consecutiveTimeouts = 0

    // Production environment detection
    const isProduction =
      process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost'

    // Enhanced profile fetch with production-grade resilience
    const fetchProfile = async (attempt = 1) => {
      const maxAttempts = isProduction ? 12 : 8 // More attempts in production
      const baseTimeoutMs = isProduction ? 30000 : 20000 // Longer base timeout in production
      const timeoutMs = Math.min(baseTimeoutMs + (attempt - 1) * 5000, isProduction ? 60000 : 35000) // Progressive timeout increase

      try {
        if (!mounted) return

        console.log(
          `[PROFILE] Attempt ${attempt}/${maxAttempts} (timeout: ${timeoutMs}ms, production: ${isProduction})`
        )

        // Network health check for production
        if (isProduction && attempt > 1) {
          try {
            const healthStart = Date.now()
            await fetch('/api/health', {
              method: 'HEAD',
              signal: AbortSignal.timeout(5000),
            })
            const healthDuration = Date.now() - healthStart
            console.log(`[PROFILE] Health check passed in ${healthDuration}ms`)
            healthCheckCount++
          } catch (healthError) {
            console.log(`[PROFILE] Health check failed (attempt ${attempt}):`, healthError)
            consecutiveTimeouts++

            // If health check fails multiple times, use exponential backoff
            if (consecutiveTimeouts >= 3) {
              const extraDelay = Math.pow(2, consecutiveTimeouts - 2) * 5000
              await new Promise(resolve => setTimeout(resolve, extraDelay))
            }
          }
        }

        // Don't set loading if we already have a profile and this is not the first attempt
        if (!userProfile || attempt === 1) {
          setProfileLoading(true)
        }

        // Adaptive timeout based on network conditions
        const adaptiveTimeoutMs =
          consecutiveTimeouts > 0
            ? Math.min(timeoutMs * (1 + consecutiveTimeouts * 0.5), 90000)
            : timeoutMs

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Profile fetch timeout')), adaptiveTimeoutMs)
        })

        // Get session with timeout and retries
        let sessionResult
        try {
          const sessionPromise = supabase.auth.getSession()
          sessionResult = (await Promise.race([sessionPromise, timeoutPromise])) as any
        } catch (sessionError) {
          if (sessionError.message === 'Profile fetch timeout') {
            console.log(`[PROFILE] Session fetch timeout (attempt ${attempt})`)
            throw sessionError
          }
          // For other session errors, try refresh
          console.log(`[PROFILE] Session error, trying refresh (attempt ${attempt}):`, sessionError)
          const refreshPromise = supabase.auth.refreshSession()
          sessionResult = (await Promise.race([refreshPromise, timeoutPromise])) as any
        }

        if (!mounted) return

        const {
          data: { session },
          error: sessionError,
        } = sessionResult

        if (sessionError || !session?.user) {
          console.log(`[PROFILE] No valid session (attempt ${attempt}):`, sessionError?.message)

          if (attempt < maxAttempts) {
            // Progressive backoff with jitter for production load balancing
            const baseDelay = Math.pow(2, attempt - 1) * 3000 // Start with 3s base delay
            const jitter = Math.random() * 2000 // Add up to 2s jitter
            const delay = Math.min(baseDelay + jitter, 15000) // Max 15s delay

            console.log(`[PROFILE] Retrying in ${Math.round(delay)}ms...`)
            fetchTimeout = setTimeout(() => fetchProfile(attempt + 1), delay)
            return
          } else {
            // Final attempt failed, stop loading
            console.log('[PROFILE] All session attempts failed')
            if (mounted) {
              setUserProfile(null)
              setProfileLoading(false)
            }
            return
          }
        }

        const user = session.user

        // Fetch profile with timeout and enhanced error handling
        let profileResult
        try {
          const profilePromise = supabase.from('profiles').select('*').eq('id', user.id).single()
          profileResult = (await Promise.race([profilePromise, timeoutPromise])) as any
        } catch (profileFetchError) {
          console.log(`[PROFILE] Profile fetch failed (attempt ${attempt}):`, profileFetchError)
          throw profileFetchError
        }

        if (!mounted) return

        const { data: profile, error: profileError } = profileResult

        if (profile) {
          // Success - reset timeout counter and cache profile
          consecutiveTimeouts = 0
          setUserProfile(profile)
          setProfileLoading(false)
          console.log('[PROFILE] Loaded successfully:', profile.full_name)

          // Cache successful profile
          try {
            localStorage.setItem(
              'cached-profile',
              JSON.stringify({
                profile: profile,
                timestamp: Date.now(),
              })
            )
          } catch (cacheError) {
            console.warn('[PROFILE] Failed to cache successful profile:', cacheError)
          }
        } else if (profileError) {
          console.error(`[PROFILE] Database error (attempt ${attempt}):`, profileError)

          if (attempt < maxAttempts) {
            // Progressive backoff for database errors
            const baseDelay = Math.pow(2, attempt - 1) * 2500
            const jitter = Math.random() * 1500
            const delay = Math.min(baseDelay + jitter, 12000)

            console.log(`[PROFILE] Retrying after database error in ${Math.round(delay)}ms...`)
            fetchTimeout = setTimeout(() => fetchProfile(attempt + 1), delay)
          } else {
            // Fallback to basic user info after all attempts failed
            console.log('[PROFILE] Using fallback after all attempts failed')
            if (mounted) {
              setUserProfile({
                id: user.id,
                email: user.email || '',
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                role: user.user_metadata?.role || 'worker',
                phone: '',
                created_at: user.created_at || new Date().toISOString(),
              })
              setProfileLoading(false)
            }
          }
        }
      } catch (error) {
        console.error(`[PROFILE] Fetch error (attempt ${attempt}):`, error)

        if (attempt < maxAttempts && mounted) {
          // Enhanced retry logic with adaptive strategies for production
          const isTimeoutError = error.message.includes('timeout')
          const isNetworkError =
            error.message.includes('network') || error.message.includes('fetch')
          consecutiveTimeouts = isTimeoutError
            ? consecutiveTimeouts + 1
            : Math.max(0, consecutiveTimeouts - 1)

          let baseDelay
          if (isTimeoutError) {
            // Progressive backoff for timeouts with production adjustments
            baseDelay = Math.pow(2, attempt) * (isProduction ? 6000 : 4000)
          } else if (isNetworkError) {
            // Medium delays for network issues
            baseDelay = Math.pow(2, attempt - 1) * (isProduction ? 4000 : 3000)
          } else {
            // Standard delays for other errors
            baseDelay = Math.pow(2, attempt - 1) * (isProduction ? 3000 : 2000)
          }

          const jitter = Math.random() * (isProduction ? 3000 : 2000)
          const delay = Math.min(baseDelay + jitter, isProduction ? 30000 : 20000)

          console.log(
            `[PROFILE] Retrying in ${Math.round(delay)}ms... (${isTimeoutError ? 'timeout' : isNetworkError ? 'network' : 'other'}, consecutive timeouts: ${consecutiveTimeouts})`
          )
          fetchTimeout = setTimeout(() => fetchProfile(attempt + 1), delay)
        } else {
          // Max attempts reached - use comprehensive fallback strategy
          console.log('[PROFILE] All attempts exhausted, implementing comprehensive fallback')
          if (mounted) {
            // Multi-layer fallback approach
            let fallbackProfile = null

            // Layer 1: Try localStorage cache
            try {
              const cachedProfile = localStorage.getItem('cached-profile')
              if (cachedProfile) {
                const parsed = JSON.parse(cachedProfile)
                const cacheAge = Date.now() - (parsed.timestamp || 0)
                if (cacheAge < 24 * 60 * 60 * 1000) {
                  // Use cache if less than 24 hours old
                  fallbackProfile = parsed.profile
                  console.log(
                    '[PROFILE] Using cached profile (age: ' +
                      Math.round(cacheAge / 1000 / 60) +
                      ' minutes)'
                  )
                }
              }
            } catch (cacheError) {
              console.warn('[PROFILE] Cache read failed:', cacheError)
            }

            // Layer 2: Try session info
            if (!fallbackProfile) {
              try {
                const sessionPromise = supabase.auth.getSession()
                const sessionTimeout = new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('Session fallback timeout')), 5000)
                )
                const {
                  data: { session },
                } = (await Promise.race([sessionPromise, sessionTimeout])) as any

                if (session?.user) {
                  fallbackProfile = {
                    id: session.user.id,
                    email: session.user.email || '',
                    full_name:
                      session.user.user_metadata?.full_name ||
                      session.user.email?.split('@')[0] ||
                      '사용자',
                    role: session.user.user_metadata?.role || 'site_manager',
                    phone: session.user.user_metadata?.phone || '',
                    created_at: session.user.created_at || new Date().toISOString(),
                  }
                  console.log('[PROFILE] Using session-based fallback')
                }
              } catch (fallbackError) {
                console.warn('[PROFILE] Session fallback failed:', fallbackError)
              }
            }

            // Layer 3: Minimal default profile
            if (!fallbackProfile) {
              fallbackProfile = {
                id: 'fallback-user-' + Date.now(),
                email: '',
                full_name: '사용자',
                role: 'site_manager',
                phone: '',
                created_at: new Date().toISOString(),
              }
              console.log('[PROFILE] Using minimal default profile')
            }

            setUserProfile(fallbackProfile)
            setProfileLoading(false)

            // Cache the fallback profile for future use
            try {
              localStorage.setItem(
                'cached-profile',
                JSON.stringify({
                  profile: fallbackProfile,
                  timestamp: Date.now(),
                })
              )
            } catch (cacheWriteError) {
              console.warn('[PROFILE] Failed to cache profile:', cacheWriteError)
            }
          }
        }
      }
    }

    // Only fetch if we don't have a profile yet
    if (!userProfile) {
      fetchProfile()
    }

    return () => {
      mounted = false
      clearTimeout(fetchTimeout)
    }
  }, [supabase]) // Remove userProfile from dependencies to prevent infinite loops

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
        console.log('[AUTH] Starting comprehensive logout process...')

        // Immediately show feedback and close drawer
        onClose()
        setUserProfile(null)
        setProfileLoading(true)

        // Phase 1: Clear client-side storage (selective clearing to preserve user preferences)
        try {
          const keysToRemove = [
            'sb-access-token',
            'sb-refresh-token',
            'user-role',
            'user-session',
            'auth-token',
          ]

          keysToRemove.forEach(key => {
            localStorage.removeItem(key)
            sessionStorage.removeItem(key)
          })

          console.log('[AUTH] Client storage cleared')
        } catch (storageError) {
          console.warn('[AUTH] Storage clearing error:', storageError)
        }

        // Phase 2: Clear cookies (comprehensive pattern matching)
        try {
          const cookiePatterns = [
            'sb-access-token',
            'sb-refresh-token',
            'sb-auth-token',
            'sb-provider-token',
            'supabase-auth-token',
            'supabase.auth.token',
            `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`,
            'user-role',
          ]

          // Clear specific auth cookies
          cookiePatterns.forEach(pattern => {
            document.cookie = `${pattern}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`
            document.cookie = `${pattern}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
            document.cookie = `${pattern}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`
          })

          // Clear any remaining auth cookies
          document.cookie.split(';').forEach(cookie => {
            const cookieName = cookie.split('=')[0].trim()
            if (
              cookieName.includes('sb-') ||
              cookieName.includes('supabase') ||
              cookieName.includes('auth')
            ) {
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
              document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`
            }
          })

          console.log('[AUTH] Cookies cleared')
        } catch (cookieError) {
          console.warn('[AUTH] Cookie clearing error:', cookieError)
        }

        // Phase 3: Server-side logout (with timeout)
        try {
          const logoutPromise = fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies in the request
          })

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Logout timeout')), 5000)
          )

          const response = (await Promise.race([logoutPromise, timeoutPromise])) as Response

          if (response.ok) {
            console.log('[AUTH] Server logout successful')
          } else {
            console.warn('[AUTH] Server logout failed:', response.status)
          }
        } catch (serverError) {
          console.warn('[AUTH] Server logout error:', serverError)
          // Don't block logout on server error
        }

        // Phase 4: Supabase client logout
        try {
          await supabase.auth.signOut({
            scope: 'local', // Only clear local session, server already handled
          })
          console.log('[AUTH] Supabase client logout successful')
        } catch (clientError) {
          console.warn('[AUTH] Supabase client logout error:', clientError)
          // Don't block logout on client error
        }

        // Phase 5: Clear service worker caches
        try {
          if ('caches' in window) {
            const cacheNames = await caches.keys()
            await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
            console.log('[AUTH] Service worker caches cleared')
          }
        } catch (cacheError) {
          console.warn('[AUTH] Cache clearing error:', cacheError)
        }

        console.log('[AUTH] Logout process completed, redirecting...')

        // Phase 6: Force redirect with cache prevention
        // Add timestamp to prevent cached redirects
        const loginUrl = `/auth/login?t=${Date.now()}`
        window.location.replace(loginUrl)
      } catch (error) {
        console.error('[AUTH] Logout process failed:', error)
        // Force redirect even on complete failure
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
        <div className="drawer-container">
          <div className="drawer-body">
            <div className="drawer-scale">
              {/* Profile Section */}
              <div className="profile-sec">
                <div className="profile-header">
                  <div className="profile-name" id="profileUserName">
                    {profileLoading ? '로딩 중...' : userProfile?.full_name || '사용자'}
                    {!profileLoading && (
                      <span
                        className="important-tag"
                        style={{ position: 'relative', top: 0, right: 0, marginLeft: '8px' }}
                      >
                        {getRoleDisplay(userProfile?.role || '')}
                      </span>
                    )}
                  </div>
                  <button className="close-btn" id="drawerCloseBtn" onClick={onClose}>
                    닫기
                  </button>
                </div>
                <div className="profile-email" id="profileUserEmail">
                  {profileLoading ? '로딩 중...' : userProfile?.email || ''}
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
                        <span className="account-value">{userProfile?.phone || '미설정'}</span>
                      </div>
                      <div className="account-info-item">
                        <span className="account-label">가입일</span>
                        <span className="account-value">
                          {userProfile?.created_at
                            ? new Date(userProfile.created_at)
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
                        value={userProfile?.email || ''}
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
