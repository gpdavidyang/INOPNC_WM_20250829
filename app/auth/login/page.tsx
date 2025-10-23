'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import LogoImage from '@/components/LogoImage'
import { getLoginLogoSrc } from '@/lib/ui/brand'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [email, setEmail] = useState('')
  const [devHelp, setDevHelp] = useState<string | null>(null)
  // Logo handled by client component

  // Find ID modal state (UI only)
  const [isFindIdOpen, setIsFindIdOpen] = useState(false)
  const [isFindIdResultOpen, setIsFindIdResultOpen] = useState(false)
  const [findIdResultMessage, setFindIdResultMessage] = useState<string>('')
  const [findIdName, setFindIdName] = useState('')
  const [findIdPhone, setFindIdPhone] = useState('')
  const [findIdEmail, setFindIdEmail] = useState('')

  // Load saved email on mount when rememberMe was set
  useEffect(() => {
    const savedRemember = localStorage.getItem('rememberMe')
    const savedEmail = localStorage.getItem('savedEmail')
    if (savedRemember === 'true' && savedEmail) {
      setRememberMe(true)
      setEmail(savedEmail)
    }
    // Query params: email & reason
    try {
      const params = new URLSearchParams(window.location.search)
      const qEmail = params.get('email')
      if (qEmail) setEmail(qEmail)
      const reason = params.get('reason')
      if (reason === 'reset_success')
        setInfo('비밀번호가 재설정되었습니다. 새 비밀번호로 로그인해주세요.')
      if (reason === 'approved') setInfo('관리자 승인 완료. 로그인 후 프로필을 확인해주세요.')
    } catch (e) {
      // Ignore parse errors in non-browser contexts or malformed URL
      void e
    }
  }, [])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const email = (formData.get('email') as string) || ''
    const password = (formData.get('password') as string) || ''

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      // 자동로그인(이메일 저장) 처리
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
        localStorage.setItem('savedEmail', email)
      } else {
        localStorage.removeItem('rememberMe')
        localStorage.removeItem('savedEmail')
      }

      // 1) Supabase 로그인 (세션 획득)
      const supabase = createClient(undefined, true)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        console.error('Login error:', error)
        const msg = error.message || ''
        if (msg.toLowerCase().includes('invalid login credentials')) {
          // 추가: 가입요청 상태 확인 후 메시지 보완
          try {
            const statusRes = await fetch(
              `/api/auth/signup-request/status?email=${encodeURIComponent(email)}`,
              {
                cache: 'no-store',
              }
            )
            const statusJson = await statusRes.json().catch(() => ({}))
            if (statusRes.ok && statusJson?.success && statusJson?.status === 'pending') {
              setError('가입 승인 대기 중입니다. 승인 완료 후 이메일로 안내됩니다.')
            } else {
              setError('계정이 존재하지 않거나 비밀번호가 일치하지 않습니다.')
            }
          } catch {
            setError('계정이 존재하지 않거나 비밀번호가 일치하지 않습니다.')
          }
          if (
            process.env.NODE_ENV !== 'production' &&
            email.toLowerCase() === 'partner@inopnc.com'
          ) {
            setDevHelp('개발 환경에서 파트너 테스트 계정을 생성할 수 있습니다.')
          }
        } else {
          setError(msg || '로그인에 실패했습니다.')
        }
        setIsLoading(false)
        return
      }

      // 2) 서버 세션 동기화 (쿠키 세팅)
      const access_token = data.session?.access_token
      const refresh_token = data.session?.refresh_token
      if (!access_token || !refresh_token) {
        setError('세션 토큰이 없습니다. 다시 시도해주세요.')
        setIsLoading(false)
        return
      }

      const syncRes = await fetch('/api/auth/sync-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token, refresh_token }),
        cache: 'no-store',
      })

      if (!syncRes.ok) {
        const payload = await syncRes.json().catch(() => ({}))
        console.error('Session sync failed:', payload)
        setError('서버와의 세션 동기화에 실패했습니다. 다시 시도해주세요.')
        setIsLoading(false)
        return
      }

      // 3) 역할 기반 UI 트랙으로 이동
      const meRes = await fetch('/api/auth/me', { cache: 'no-store' })
      let redirectPath = '/mobile'
      if (meRes.ok) {
        const me = await meRes.json().catch(() => null)
        if (me?.uiTrack) redirectPath = me.uiTrack
      }

      window.location.replace(redirectPath)
    } catch (err) {
      console.error('Login exception:', err)
      setError('로그인에 실패했습니다.')
      setIsLoading(false)
    }
  }

  // Simple Find ID handlers (UI only)
  const openFindId = () => {
    setFindIdName('')
    setFindIdPhone('')
    setFindIdEmail('')
    setIsFindIdResultOpen(false)
    setFindIdResultMessage('')
    setIsFindIdOpen(true)
  }
  const closeFindId = () => setIsFindIdOpen(false)
  const closeFindIdResult = () => setIsFindIdResultOpen(false)
  const submitFindId = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/auth/find-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: findIdName,
          phone: findIdPhone,
          email: findIdEmail || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      setIsFindIdOpen(false)
      if (res.ok && data?.success && data?.email) {
        setFindIdResultMessage(`아이디를 찾았습니다: ${data.email}`)
      } else {
        setFindIdResultMessage(data?.message || data?.error || '일치하는 계정을 찾을 수 없습니다.')
      }
      setIsFindIdResultOpen(true)
    } catch (err) {
      setIsFindIdOpen(false)
      setFindIdResultMessage('조회 중 오류가 발생했습니다.')
      setIsFindIdResultOpen(true)
    }
  }

  // Phone formatting helper (numeric + hyphen)
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length >= 7) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
    if (digits.length >= 3) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    return digits
  }

  return (
    <>
      <style jsx>{`
        /* 로그인 페이지 - 레거시 디자인 반영 */
        .login-container {
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          /* Compact but consistent outer horizontal padding */
          padding: 0 16px;
          background: #ffffff;
          /* Force light UI for form controls regardless of system theme */
          color-scheme: light;
          font-family:
            'Noto Sans KR',
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            'Roboto',
            'Helvetica Neue',
            Arial,
            sans-serif;
        }

        .login-content {
          width: 100%;
          max-width: 400px;
          /* Remove inner horizontal padding to keep compact width */
          padding: 0;
          box-sizing: border-box;
        }

        .login-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin: 0 auto 20px auto;
          width: 100%;
          text-align: center;
        }

        .login-logo {
          height: 38px;
          width: auto;
          object-fit: contain;
          display: flex;
          align-items: center;
        }

        .login-title {
          font-size: 24px;
          font-weight: 600;
          color: #1a254f;
          margin: 0;
          line-height: 1.2;
          height: 35px;
          display: flex;
          align-items: center;
          white-space: nowrap; /* 줄바꿈 방지 */
        }
        /* 헤더(로고+텍스트) 한 줄 유지 */
        .login-header {
          flex-wrap: nowrap;
        }

        .form-group {
          margin: 16px 0;
        }

        .form-input {
          width: 100%;
          height: 45px;
          padding: 0 20px;
          padding-right: 45px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #ffffff !important; /* prevent gray background on focus/typing */
          color: #6b7280;
          font-size: 16px;
          font-weight: 500;
          transition: all 0.2s ease;
          box-sizing: border-box;
          -webkit-appearance: none;
          appearance: none;
          -webkit-text-fill-color: #6b7280; /* keep text visible in iOS dark */
          background-clip: padding-box; /* avoid UA theming bleed */
        }

        .form-input:focus {
          outline: none;
          border-color: #31a3fa;
          box-shadow: 0 0 0 3px rgba(49, 163, 250, 0.1);
          background: #ffffff !important;
        }

        .form-input::placeholder {
          color: #6b7280;
        }

        /* Ensure autofill doesn't turn field gray/yellow */
        .form-input:-webkit-autofill,
        .form-input:-webkit-autofill:hover,
        .form-input:-webkit-autofill:focus,
        .form-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #ffffff inset !important;
          box-shadow: 0 0 0 30px #ffffff inset !important;
          -webkit-text-fill-color: #6b7280 !important;
          caret-color: #1f2937 !important; /* gray-800 */
          background: #ffffff !important;
        }

        .input-wrapper {
          position: relative;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          transition: color 0.2s ease;
        }

        .password-toggle:hover {
          color: #374151;
        }

        .password-toggle svg {
          width: 20px;
          height: 20px;
        }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 20px 0;
        }

        .checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        .checkbox-input {
          /* Match input field style */
          width: 18px;
          height: 18px;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background: #ffffff;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          position: relative;
          display: inline-block;
          vertical-align: middle;
          transition: all 0.2s ease;
        }
        .checkbox-input:hover {
          border-color: #31a3fa;
        }
        .checkbox-input:focus {
          outline: none;
          border-color: #31a3fa;
          box-shadow: 0 0 0 3px rgba(49, 163, 250, 0.1);
        }
        .checkbox-input:checked {
          background-color: #31a3fa;
          border-color: #31a3fa;
        }
        .checkbox-input:checked::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 6px;
          width: 4px;
          height: 8px;
          border: solid #ffffff;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
        .checkbox-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .checkbox label {
          font-size: 16px;
          color: #6b7280;
          cursor: pointer;
        }

        .forgot-links {
          display: flex;
          align-items: center;
          gap: 4px;
          justify-content: flex-end;
        }
        .forgot-password {
          font-size: 16px;
          color: #6b7280;
          text-decoration: none;
          transition: color 0.2s ease;
          font-weight: 500;
          /* Remove horizontal padding to minimize wrapping */
          padding: 0;
        }
        .forgot-password:hover {
          color: #31a3fa;
        }
        .separator {
          color: #d1d5db;
          font-size: 16px;
        }
        /* Unify inline label/link typography */
        .checkbox span {
          font-size: 16px;
          color: #6b7280;
          font-weight: 500;
          /* Make the clickable label text compact horizontally */
          padding: 0;
        }

        /* Ensure the overall label itself stays compact horizontally */
        .checkbox {
          padding: 0;
        }

        .login-button {
          width: 100%;
          height: 45px;
          padding: 8px 16px;
          background: #1a254f;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .login-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(26, 37, 79, 0.3);
        }
        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .signup-link {
          text-align: center;
          font-size: 14px;
          color: #6b7280;
        }
        .signup-link a {
          text-decoration: none;
        }
        .signup-cta {
          color: #0f1a3a !important;
          font-weight: 900 !important;
          text-decoration: none !important;
        }
        .signup-cta:visited {
          color: #0f1a3a !important;
        }
        .signup-cta:hover {
          color: #1a254f !important;
          text-decoration: underline !important;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 16px;
        }

        /* Modal */
        .modal {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(4px);
          z-index: 1001;
        }
        .modal.show {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-content {
          width: min(480px, 92vw);
          max-height: 80vh;
          overflow: auto;
          background: #fff;
          border-radius: 8px;
          padding: 18px;
          margin: 0 18px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 0 16px 0;
          border-bottom: 1px solid #d1d5db;
          margin-bottom: 16px;
        }
        .modal-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1a254f;
          text-align: left;
        }
        .close-btn {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          color: #374151;
          font-size: 16px;
          font-weight: 600;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .close-btn:hover {
          background: #31a3fa;
          border-color: #31a3fa;
          color: #fff;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(49, 163, 250, 0.3);
        }
        .modal-body .form-group {
          margin-bottom: 16px;
        }
        .modal-body .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 16px;
          font-weight: 400;
          color: #1a1a1a;
        }
        .modal-body .form-group input {
          width: 100%;
          height: 45px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          background: #fff !important;
          color: #6b7280;
          padding: 0 14px;
          font-size: 16px;
          font-weight: 600;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .modal-body .form-group input:focus {
          background: #ffffff !important;
          border-color: #31a3fa;
          box-shadow: 0 0 0 3px rgba(49, 163, 250, 0.1);
        }
        .modal-button {
          width: 100%;
          height: 45px;
          border-radius: 8px;
          border: none;
          background: #1a254f;
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-button:hover {
          background: #2a366a;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(49, 163, 250, 0.3);
        }

        /* Responsive */
        @media (max-width: 480px) {
          .login-content {
            padding: 0;
          }
          .login-container {
            padding: 0 16px;
          }
          .login-header {
            margin: 16px auto;
          }
          .login-title {
            font-size: 24px;
            line-height: 35px;
            height: 35px;
          }
          .form-group {
            margin: 16px 0;
          }
          .form-input {
            height: 45px;
            padding: 0 20px;
            padding-right: 35px;
            font-size: 16px;
          }
          .form-options {
            margin: 20px 0;
          }
          .login-button {
            height: 45px;
            font-size: 16px;
            margin-bottom: 20px;
          }
        }

        /* A11y */
        @media (prefers-reduced-motion: reduce) {
          .login-button,
          .form-input,
          .login-content {
            transition: none;
          }
          .login-button:hover {
            transform: none;
          }
        }

        .form-input:focus-visible,
        .login-button:focus-visible,
        .checkbox:focus-visible {
          outline: 2px solid #31a3fa;
          outline-offset: 2px;
        }
      `}</style>

      <div className="login-container">
        <div className="login-content">
          <div className="login-header">
            <LogoImage srcPrimary={getLoginLogoSrc()} className="login-logo" />
            <h1 className="login-title">로그인</h1>
          </div>

          {info && (
            <div
              className="error-message"
              style={{ backgroundColor: '#F3F7FA', color: '#15347C', borderColor: '#8DA0CD' }}
            >
              {info}
            </div>
          )}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <div className="input-wrapper">
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-input"
                  placeholder="이메일을 입력하세요"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className="form-input"
                  placeholder="비밀번호를 입력하세요"
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="비밀번호 표시/숨기기"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox" htmlFor="rememberMe">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  className="checkbox-input"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <span>자동로그인</span>
              </label>

              <div className="forgot-links">
                <button type="button" className="forgot-password" onClick={openFindId}>
                  아이디찾기
                </button>
                <span className="separator">|</span>
                <Link href="/auth/reset-password" className="forgot-password">
                  비밀번호찾기
                </Link>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            {devHelp && process.env.NODE_ENV !== 'production' && (
              <div
                className="error-message"
                style={{ backgroundColor: '#f8fafc', color: '#111827', borderColor: '#cbd5e1' }}
              >
                <div style={{ marginBottom: 8 }}>{devHelp}</div>
                <button
                  type="button"
                  className="login-button"
                  onClick={async () => {
                    try {
                      setIsLoading(true)
                      const res = await fetch('/api/admin/create-partner-user', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          email: 'partner@inopnc.com',
                          password: 'password123',
                        }),
                      })
                      const payload = await res.json().catch(() => ({}))
                      if (!res.ok || payload?.error) {
                        setError(payload?.error || '테스트 계정 생성에 실패했습니다.')
                      } else {
                        setError(null)
                        setDevHelp('테스트 계정이 준비되었습니다. 다시 시도해주세요.')
                        setEmail('partner@inopnc.com')
                      }
                    } catch (e) {
                      setError('테스트 계정 생성 중 오류가 발생했습니다.')
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                >
                  파트너 테스트 계정 생성
                </button>
              </div>
            )}

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="signup-link">
            계정이 없으신가요?{' '}
            <Link href="/auth/signup-request">
              <span className="signup-cta">회원가입</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 아이디찾기 모달 */}
      <div
        className={`modal ${isFindIdOpen ? 'show' : ''}`}
        onClick={e => {
          if (e.target === e.currentTarget) closeFindId()
        }}
      >
        <div
          className="modal-content"
          role="dialog"
          aria-modal="true"
          aria-labelledby="findIdTitle"
        >
          <div className="modal-header">
            <h2 id="findIdTitle">아이디 찾기</h2>
            <button className="close-btn" onClick={closeFindId}>
              닫기
            </button>
          </div>
          <div className="modal-body">
            <form onSubmit={submitFindId}>
              <div className="form-group">
                <label htmlFor="findIdName">이름</label>
                <input
                  id="findIdName"
                  className="form-input"
                  value={findIdName}
                  onChange={e => setFindIdName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="findIdPhone">휴대폰 번호</label>
                <input
                  id="findIdPhone"
                  className="form-input"
                  placeholder="010-1234-5678"
                  value={findIdPhone}
                  onChange={e => setFindIdPhone(formatPhone(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="findIdEmail">이메일</label>
                <input
                  id="findIdEmail"
                  type="email"
                  className="form-input"
                  placeholder="example@email.com"
                  value={findIdEmail}
                  onChange={e => setFindIdEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="modal-button">
                아이디 찾기
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 아이디찾기 결과 모달 */}
      <div
        className={`modal ${isFindIdResultOpen ? 'show' : ''}`}
        onClick={e => {
          if (e.target === e.currentTarget) closeFindIdResult()
        }}
      >
        <div
          className="modal-content"
          role="dialog"
          aria-modal="true"
          aria-labelledby="findIdResultTitle"
        >
          <div className="modal-header">
            <h2 id="findIdResultTitle">아이디 찾기 결과</h2>
            <button className="close-btn" onClick={closeFindIdResult}>
              닫기
            </button>
          </div>
          <div className="modal-body">
            <div style={{ textAlign: 'center', padding: '20px 0' }}>{findIdResultMessage}</div>
            <button type="button" className="modal-button" onClick={closeFindIdResult}>
              로그인하러 가기
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
