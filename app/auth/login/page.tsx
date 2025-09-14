'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { signIn } from '@/app/auth/actions'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@example.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="비밀번호를 입력하세요"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
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