'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Mail } from 'lucide-react'

export default function ResetPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      if (error) throw error

      setSuccess(true)
    } catch (error: any) {
      setError(error.message || '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">이메일을 확인해주세요</h3>
          <p className="text-gray-600">
            <span className="font-medium text-blue-600">{email}</span>로<br />
            비밀번호 재설정 링크를 보내드렸습니다.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-medium text-blue-800">이메일 확인 방법</p>
            </div>
            <ul className="text-xs text-blue-700 space-y-1 text-left">
              <li>• 받은편지함을 확인해주세요</li>
              <li>• 스팸함도 확인해보세요</li>
              <li>• 링크는 24시간 후 만료됩니다</li>
            </ul>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/auth/login"
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-2xl transition-colors duration-200"
          >
            로그인 화면으로 돌아가기
          </Link>
          
          <button
            onClick={() => {
              setSuccess(false)
              setEmail('')
              setError(null)
            }}
            className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            다른 이메일로 다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Link
          href="/auth/login"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          로그인으로 돌아가기
        </Link>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">비밀번호 찾기</h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          가입하신 이메일 주소를 입력하시면<br />
          비밀번호 재설정 링크를 보내드립니다.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            이메일 주소
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 text-base border border-gray-200 rounded-2xl bg-gray-50/80 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
              placeholder="email@example.com"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-2xl text-sm flex items-center space-x-2">
            <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center py-3.5 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              전송 중...
            </>
          ) : (
            '재설정 링크 보내기'
          )}
        </button>
      </form>

      <div className="pt-6 border-t border-gray-100">
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            계정이 없으신가요?
          </p>
          <Link
            href="/auth/signup-request"
            className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
          >
            회원가입 승인요청
          </Link>
        </div>
      </div>
    </div>
  )
}