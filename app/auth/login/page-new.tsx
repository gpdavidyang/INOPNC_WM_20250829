'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ButtonNew } from '@/components/ui/button-new'
import { InputNew } from '@/components/ui/input-new'

export default function LoginPageNew() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }
    
    setError(null)
    setIsLoading(true)
    
    try {
      // Dynamic import to avoid build-time issues
      const { signIn } = await import('@/app/auth/actions')
      const result = await signIn(email, password)
      
      if (result?.error) {
        setError(result.error)
        setIsLoading(false)
      }
      // If success, server action will handle redirect
    } catch (error) {
      console.error('Login error:', error)
      setError('로그인 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해주세요.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-md">
        {/* Card container */}
        <div className="bg-[var(--card)] rounded-[var(--r-lg)] shadow-[var(--shadow-card)] p-8">
          {/* Logo and Brand Title */}
          <div className="flex flex-col items-center justify-center mb-8">
            <Image
              src="/INOPNC_logo.png"
              alt="INOPNC Logo"
              width={180}
              height={60}
              className="mb-4"
              priority
            />
            <h1 className="t-brand">INOPNC</h1>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Input */}
            <InputNew
              type="email"
              label="이메일"
              placeholder="example@inopnc.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error && !email ? '이메일을 입력해주세요' : undefined}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-10 5L2 7" />
                </svg>
              }
            />

            {/* Password Input */}
            <InputNew
              type="password"
              label="비밀번호"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error && !password ? '비밀번호를 입력해주세요' : undefined}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              }
            />

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Login Button */}
            <ButtonNew
              type="submit"
              variant="primary"
              size="full"
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </ButtonNew>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--line)]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[var(--card)] text-[var(--muted)]">또는</span>
              </div>
            </div>

            {/* Secondary Actions */}
            <div className="space-y-3">
              <Link href="/auth/register">
                <ButtonNew
                  type="button"
                  variant="outline"
                  size="full"
                >
                  회원가입
                </ButtonNew>
              </Link>
              
              <Link href="/auth/forgot-password">
                <ButtonNew
                  type="button"
                  variant="ghost"
                  size="full"
                >
                  비밀번호 찾기
                </ButtonNew>
              </Link>
            </div>
          </form>

          {/* Footer Info */}
          <div className="mt-8 text-center">
            <p className="t-cap">
              © 2024 INOPNC. All rights reserved.
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="t-cap">
            문제가 있으신가요?{' '}
            <a href="mailto:support@inopnc.com" className="text-[var(--accent)] hover:underline">
              고객지원
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}