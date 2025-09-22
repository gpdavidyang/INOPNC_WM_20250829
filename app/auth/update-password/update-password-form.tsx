'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Lock, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    // Check if we have the required tokens from the email link
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    
    if (accessToken && refreshToken) {
      // Set the session with the tokens from the email link
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
    }
  }, [searchParams, supabase.auth])

  const validatePassword = (pwd: string): string[] => {
    const errors = []
    if (pwd.length < 8) {
      errors.push('8자 이상이어야 합니다')
    }
    if (!/(?=.*[a-z])/.test(pwd)) {
      errors.push('소문자를 포함해야 합니다')
    }
    if (!/(?=.*[A-Z])/.test(pwd)) {
      errors.push('대문자를 포함해야 합니다')
    }
    if (!/(?=.*\d)/.test(pwd)) {
      errors.push('숫자를 포함해야 합니다')
    }
    return errors
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    setValidationErrors(validatePassword(value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate password
    const passwordErrors = validatePassword(password)
    if (passwordErrors.length > 0) {
      setError('비밀번호 조건을 만족하지 않습니다.')
      setLoading(false)
      return
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setSuccess(true)
      
      // Redirect to login after success
      setTimeout(() => {
        router.push('/auth/login?message=password-updated')
      }, 2000)
      
    } catch (error: unknown) {
      console.error('Password update error:', error)
      setError(error.message || '비밀번호 업데이트 중 오류가 발생했습니다.')
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
          <h3 className="text-xl font-semibold text-gray-900">비밀번호가 변경되었습니다!</h3>
          <p className="text-gray-600">
            새로운 비밀번호로 로그인해주세요.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/auth/login"
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-2xl transition-colors duration-200"
          >
            로그인하기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">새 비밀번호 설정</h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          안전한 새 비밀번호를 설정해주세요.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            새 비밀번호
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              className="w-full pl-10 pr-12 py-3.5 text-base border border-gray-200 rounded-2xl bg-gray-50/80 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
              placeholder="새 비밀번호를 입력하세요"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          
          {/* Password requirements */}
          <div className="mt-3 space-y-1">
            <p className="text-xs text-gray-600 mb-2">비밀번호 조건:</p>
            {['8자 이상이어야 합니다', '소문자를 포함해야 합니다', '대문자를 포함해야 합니다', '숫자를 포함해야 합니다'].map((requirement) => (
              <div key={requirement} className="flex items-center text-xs">
                <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                  password && !validationErrors.includes(requirement) 
                    ? 'bg-green-500' 
                    : 'bg-gray-300'
                }`} />
                <span className={
                  password && !validationErrors.includes(requirement)
                    ? 'text-green-600'
                    : 'text-gray-500'
                }>
                  {requirement}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            비밀번호 확인
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-3.5 text-base border border-gray-200 rounded-2xl bg-gray-50/80 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
              placeholder="비밀번호를 다시 입력하세요"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          
          {/* Password match indicator */}
          {confirmPassword && (
            <div className="mt-2 flex items-center text-xs">
              <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                password === confirmPassword ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className={
                password === confirmPassword ? 'text-green-600' : 'text-red-600'
              }>
                {password === confirmPassword ? '비밀번호가 일치합니다' : '비밀번호가 일치하지 않습니다'}
              </span>
            </div>
          )}
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
          disabled={loading || validationErrors.length > 0 || password !== confirmPassword}
          className="w-full flex justify-center items-center py-3.5 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              업데이트 중...
            </>
          ) : (
            '비밀번호 변경'
          )}
        </button>
      </form>

      <div className="pt-6 border-t border-gray-100 text-center">
        <Link
          href="/auth/login"
          className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          로그인으로 돌아가기
        </Link>
      </div>
    </div>
  )
}