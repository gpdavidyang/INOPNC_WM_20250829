'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { submitSignupRequest } from '@/app/auth/actions'

export default function SignupRequestPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: '',
    company: '',
    jobTitle: '',
    phone: '',
    email: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!termsAccepted) {
      setError('이용약관 및 개인정보처리방침에 동의해주세요.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await requestSignupApproval(formData)
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        setSubmitted(true)
      }
    } catch (error: unknown) {
      console.error('Signup request error:', error)
      setError('승인 요청 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full max-w-md">
          {/* 로고 및 타이틀 */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-white text-2xl font-bold">IN</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">INOPNC</h1>
            <p className="text-gray-600 mt-2">회원가입</p>
          </div>

          {/* 승인 완료 메시지 */}
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">승인요청 완료</h2>
            <p className="text-gray-600 mb-6">
              회원가입 승인요청이 성공적으로 제출되었습니다.<br/>
              관리자 승인 후 이메일로 안내드리겠습니다.
            </p>
            <Link 
              href="/auth/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              로그인 화면으로
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="w-full max-w-md">
        {/* 로고 및 타이틀 */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">IN</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">INOPNC</h1>
          <p className="text-gray-600 mt-2">회원가입</p>
        </div>

        {/* 회원가입 승인요청 폼 */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="이름을 입력하세요"
              />
            </div>

            {/* 소속(회사명) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                소속(회사명)
              </label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="회사명을 입력하세요"
              />
            </div>

            {/* 직함 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                직함
              </label>
              <input
                type="text"
                required
                value={formData.jobTitle}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="직함을 입력하세요"
              />
            </div>

            {/* 핸드폰 번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                핸드폰 번호
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="010-0000-0000"
              />
            </div>

            {/* 이메일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="example@company.com"
              />
            </div>

            {/* 이용약관 동의 */}
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="text-sm text-gray-700">
                이용약관 및 개인정보처리방침에 동의합니다
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* 승인요청 버튼 */}
            <button
              type="submit"
              disabled={loading || !termsAccepted}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '승인요청 중...' : '승인요청'}
            </button>
          </form>

          {/* 로그인 링크 */}
          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600">이미 계정이 있으신가요? </span>
            <Link href="/auth/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}