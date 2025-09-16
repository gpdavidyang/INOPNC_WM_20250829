'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff } from 'lucide-react'
import { signIn } from '@/app/auth/actions'
import styles from './login.module.css'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
      const result = await signIn(email, password)
      if (result?.error) {
        setError(result.error)
        setIsLoading(false)
      }
      // 성공시 Server Action에서 자동 리다이렉트됨
    } catch (error) {
      console.error('Login error:', error)
      setError('로그인에 실패했습니다.')
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.loginContainer}>
      <div className="w-full max-w-md">
        <div className={styles.loginCard}>
          <div className="flex flex-col items-center justify-center mb-6">
            <Image
              src="/INOPNC_logo.png"
              alt="INOPNC Logo"
              width={180}
              height={60}
              priority
              className="mb-2"
            />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-6 text-center">로그인</h2>

          <form action={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className={styles.inputLabel}>
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className={styles.inputField}
                placeholder="email@example.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className={styles.inputLabel}>
                비밀번호
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className={`${styles.inputField} pr-10`}
                  placeholder="비밀번호를 입력하세요"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <button type="submit" disabled={isLoading} className={styles.submitButton}>
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <Link
              href="/auth/signup-request"
              className="block text-sm text-blue-600 hover:text-blue-700"
            >
              회원가입 요청
            </Link>
            <Link
              href="/auth/reset-password"
              className="block text-sm text-gray-600 hover:text-gray-700"
            >
              비밀번호 찾기
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <Link href="/test-deployment" className="text-xs text-gray-500 hover:text-gray-600">
              배포 테스트 페이지
            </Link>
            {' | '}
            <Link href="/auth/login-static" className="text-xs text-gray-500 hover:text-gray-600">
              정적 로그인 페이지
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
