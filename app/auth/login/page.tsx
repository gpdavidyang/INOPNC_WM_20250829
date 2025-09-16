'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff } from 'lucide-react'
import { signIn } from '@/app/auth/actions'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [email, setEmail] = useState('')

  // Load saved credentials on component mount
  useEffect(() => {
    const savedRemember = localStorage.getItem('rememberMe')
    const savedEmail = localStorage.getItem('savedEmail')

    if (savedRemember === 'true' && savedEmail) {
      setRememberMe(true)
      setEmail(savedEmail)
    }
  }, [])

  const handleLogin = async (formData: FormData) => {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      // 자동로그인 설정 처리
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
        localStorage.setItem('savedEmail', email)
      } else {
        localStorage.removeItem('rememberMe')
        localStorage.removeItem('savedEmail')
      }

      await signIn(email, password)
      // 성공시 Server Action에서 자동 리다이렉트됨
    } catch (error) {
      console.error('Login error:', error)
      setError('로그인에 실패했습니다.')
      setIsLoading(false)
    }
  }

  return (
    <>
      <style jsx>{`
        /* 로그인 페이지 전용 스타일 */
        .login-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 16px;
          background: #ffffff;
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
          padding: 32px 24px;
          box-sizing: border-box;
        }

        .login-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 24px;
        }

        .login-logo {
          height: 30px;
          width: auto;
          object-fit: contain;
        }

        .login-title {
          font-size: 20px;
          font-weight: 600;
          color: #1a254f;
          margin: 0;
          line-height: 1.2;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-input {
          width: 100%;
          height: 45px;
          padding: 0 16px;
          border: 1px solid #e6ecf4;
          border-radius: 10px;
          background: #ffffff;
          color: #1a1a1a;
          font-size: 14px;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          border-color: #0068fe;
          box-shadow: 0 0 0 3px rgba(0, 104, 254, 0.1);
        }

        .form-input::placeholder {
          color: #6b7280;
        }

        .form-input.password-input {
          padding-right: 45px;
        }

        .input-wrapper {
          position: relative;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 18px;
          height: 18px;
          color: #6b7280;
          cursor: pointer;
          transition: color 0.2s ease;
          background: none;
          border: none;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .password-toggle:hover {
          color: #0068fe;
        }

        .password-toggle:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 20px 0;
        }

        .checkbox-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .checkbox-input {
          width: 18px;
          height: 18px;
          accent-color: #0068fe;
          cursor: pointer;
        }

        .checkbox-label {
          font-size: 14px;
          color: #1a1a1a;
          cursor: pointer;
          user-select: none;
        }

        .forgot-password {
          font-size: 14px;
          color: #6b7280;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .forgot-password:hover {
          color: #0068fe;
        }

        .login-button {
          width: 100%;
          height: 45px;
          padding: 0 16px;
          background: #1a254f;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-button:hover:not(:disabled) {
          background: #0f1a3a;
          transform: translateY(-1px);
        }

        .login-button:disabled {
          cursor: not-allowed;
          opacity: 0.7;
          transform: none;
        }

        .signup-link {
          text-align: center;
          font-size: 14px;
          color: #6b7280;
        }

        .signup-link a {
          color: #1a254f;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .signup-link a:hover {
          color: #0068fe;
          text-decoration: underline;
        }

        .error-message {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 16px;
        }

        /* 반응형 디자인 */
        @media (max-width: 480px) {
          .login-container {
            padding: 12px;
          }

          .login-content {
            padding: 20px 16px;
            max-width: 100%;
            width: calc(100% - 24px);
          }

          .login-header {
            gap: 6px;
            margin-bottom: 20px;
          }

          .login-title {
            font-size: 18px;
          }

          .login-logo {
            height: 28px;
            width: auto;
          }

          .form-group {
            margin-bottom: 14px;
          }

          .form-input {
            height: 45px;
            padding: 0 12px;
            font-size: 14px;
            box-sizing: border-box;
          }

          .form-input.password-input {
            padding-right: 40px;
          }

          .password-toggle {
            right: 10px;
            width: 16px;
            height: 16px;
          }

          .form-options {
            margin: 16px 0;
          }

          .login-button {
            height: 45px;
            font-size: 14px;
            margin-bottom: 16px;
          }
        }

        /* 접근성 */
        @media (prefers-reduced-motion: reduce) {
          .login-button,
          .form-input {
            transition: none;
          }

          .login-button:hover {
            transform: none;
          }
        }

        /* 포커스 표시 */
        .form-input:focus-visible,
        .login-button:focus-visible,
        .checkbox-wrapper:focus-visible {
          outline: 2px solid #0068fe;
          outline-offset: 2px;
        }
      `}</style>

      <div className="login-container">
        <div className="login-content">
          <div className="login-header">
            <Image
              src="/INOPNC_logo.png"
              alt="INOPNC 로고"
              width={30}
              height={30}
              priority
              className="login-logo"
            />
            <h1 className="login-title">로그인</h1>
          </div>

          <form action={handleLogin}>
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
                  className="form-input password-input"
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
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <div className="checkbox-wrapper">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  className="checkbox-input"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <label htmlFor="rememberMe" className="checkbox-label">
                  자동로그인
                </label>
              </div>
              <Link href="/auth/reset-password" className="forgot-password">
                비밀번호를 잊어버렸나요?
              </Link>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="signup-link">
            계정이 없으신가요? <Link href="/auth/signup-request">회원가입</Link>
          </div>
        </div>
      </div>
    </>
  )
}
