'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import LogoImage from '@/components/LogoImage'
import { getLoginLogoSrc } from '@/lib/ui/brand'
import { getDemoAccountPassword, isDemoAccountEmail } from '@/lib/auth/demo-accounts'
import { generateMfaSecret, verifyMfaCode } from './actions'

const TEST_EMAIL_DOMAIN =
  (typeof process !== 'undefined' &&
    (process.env.NEXT_PUBLIC_AUTH_TEST_EMAIL_DOMAIN || process.env.AUTH_TEST_EMAIL_DOMAIN)) ||
  '@inopnc.com'
const TEST_EMAILS_CONFIG =
  (typeof process !== 'undefined' &&
    (process.env.NEXT_PUBLIC_AUTH_TEST_EMAILS || process.env.AUTH_TEST_EMAILS)) ||
  [
    'admin@inopnc.com',
    'partner@inopnc.com',
    'production@inopnc.com',
    'manager@inopnc.com',
    'worker@inopnc.com',
  ].join(',')
const TEST_EMAIL_SET = new Set(
  TEST_EMAILS_CONFIG.split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
)

const PARTNER_TEST_EMAILS_CONFIG =
  (typeof process !== 'undefined' &&
    (process.env.NEXT_PUBLIC_PARTNER_TEST_EMAILS || process.env.AUTH_PARTNER_TEST_EMAILS)) ||
  'partner@inopnc.com'
const PARTNER_TEST_EMAIL_SET = new Set(
  PARTNER_TEST_EMAILS_CONFIG.split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
)

const isTestBypassEmail = (value?: string | null) => {
  if (!value) return false
  const lower = value.toLowerCase()
  if (lower.endsWith(TEST_EMAIL_DOMAIN.toLowerCase())) return true
  return TEST_EMAIL_SET.has(lower)
}

const isPartnerTestAccountEmail = (value?: string | null) => {
  if (!value) return false
  return PARTNER_TEST_EMAIL_SET.has(value.trim().toLowerCase())
}

type LoginPhase = 'credentials' | 'mfa-setup' | 'mfa-verify'
type PendingSession = {
  access_token: string
  refresh_token: string
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [email, setEmail] = useState('')
  const [devHelp, setDevHelp] = useState<string | null>(null)
  const [phase, setPhase] = useState<LoginPhase>('credentials')
  const [pendingSession, setPendingSession] = useState<PendingSession | null>(null)
  const [mfaSecret, setMfaSecret] = useState<string | null>(null)
  const [mfaUri, setMfaUri] = useState<string | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaError, setMfaError] = useState<string | null>(null)
  const [mfaIntent, setMfaIntent] = useState<'setup' | 'login'>('login')
  const [isMfaSubmitting, setIsMfaSubmitting] = useState(false)
  const passwordInputRef = useRef<HTMLInputElement | null>(null)
  // Logo handled by client component

  // Find ID modal state
  const [isFindIdOpen, setIsFindIdOpen] = useState(false)
  const [findIdStep, setFindIdStep] = useState<'form' | 'code' | 'done'>('form')
  const [findIdName, setFindIdName] = useState('')
  const [findIdPhone, setFindIdPhone] = useState('')
  const [findIdVerificationId, setFindIdVerificationId] = useState<string | null>(null)
  const [findIdCode, setFindIdCode] = useState('')
  const [findIdResult, setFindIdResult] = useState<string | null>(null)
  const [findIdError, setFindIdError] = useState<string | null>(null)
  const [isFindIdSubmitting, setIsFindIdSubmitting] = useState(false)
  const [findIdHelper, setFindIdHelper] = useState<string | null>(null)

  // Signup status modal state
  const [isSignupStatusOpen, setIsSignupStatusOpen] = useState(false)
  const [signupStatusStep, setSignupStatusStep] = useState<'form' | 'code' | 'done'>('form')
  const [signupStatusEmail, setSignupStatusEmail] = useState('')
  const [signupStatusVerificationId, setSignupStatusVerificationId] = useState<string | null>(null)
  const [signupStatusCode, setSignupStatusCode] = useState('')
  const [signupStatusResult, setSignupStatusResult] = useState<string | null>(null)
  const [signupStatusError, setSignupStatusError] = useState<string | null>(null)
  const [isSignupStatusSubmitting, setIsSignupStatusSubmitting] = useState(false)

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

  // Persist rememberMe immediately when toggled and keep savedEmail in sync
  useEffect(() => {
    try {
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
        if (email) localStorage.setItem('savedEmail', email)
      } else {
        localStorage.setItem('rememberMe', 'false')
      }
    } catch (e) {
      console.debug('rememberMe persist failed', e)
    }
  }, [rememberMe])

  // Keep savedEmail updated while typing when rememberMe is enabled
  useEffect(() => {
    try {
      if (rememberMe) {
        localStorage.setItem('savedEmail', email || '')
      }
    } catch (e) {
      console.debug('savedEmail sync failed', e)
    }
  }, [email, rememberMe])

  // Auto-login (redirect) when a valid session exists and rememberMe is true
  useEffect(() => {
    let cancelled = false
    const autoRedirect = async () => {
      try {
        const savedRemember = localStorage.getItem('rememberMe') === 'true'
        if (!savedRemember) return
        const meRes = await fetch('/api/auth/me', { cache: 'no-store' })
        if (!meRes.ok) return
        const me = await meRes.json().catch(() => null)
        if (!cancelled && me?.uiTrack) {
          window.location.replace(me.uiTrack)
        }
      } catch (e) {
        console.debug('autoRedirect check failed', e)
      }
    }
    autoRedirect()
    return () => {
      cancelled = true
    }
  }, [])

  const syncSession = async (
    tokens: PendingSession,
    options?: { mfaToken?: string }
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/sync-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          mfa_session_token: options?.mfaToken,
        }),
        cache: 'no-store',
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok || !payload?.success) {
        setError(payload?.error || '세션 동기화에 실패했습니다.')
        return false
      }
      return true
    } catch (err) {
      console.error('Session sync error:', err)
      setError('세션 동기화 중 오류가 발생했습니다.')
      return false
    }
  }

  const redirectAfterLogin = async () => {
    try {
      const meRes = await fetch('/api/auth/me', { cache: 'no-store' })
      let redirectPath = '/mobile'
      if (meRes.ok) {
        const me = await meRes.json().catch(() => null)
        if (me?.uiTrack) redirectPath = me.uiTrack
      }
      window.location.replace(redirectPath)
    } catch (err) {
      console.error('Redirect fetch error:', err)
      window.location.replace('/mobile')
    }
  }

  const requestDemoAccountRepair = async (
    targetEmail: string
  ): Promise<{ defaultPassword?: string } | null> => {
    try {
      const res = await fetch('/api/auth/demo-account/repair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok || !payload?.success) {
        return null
      }
      const defaultPassword =
        typeof payload.defaultPassword === 'string' && payload.defaultPassword.length > 0
          ? payload.defaultPassword
          : getDemoAccountPassword(targetEmail)
      return { defaultPassword: defaultPassword || undefined }
    } catch (repairError) {
      console.error('Demo account repair request failed:', repairError)
      return null
    }
  }

  const requestPartnerAccountRepair = async (
    targetEmail: string
  ): Promise<{ defaultPassword?: string } | null> => {
    try {
      const res = await fetch('/api/auth/partner-account/repair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok || !payload?.success) {
        return null
      }
      const defaultPassword =
        typeof payload.defaultPassword === 'string' && payload.defaultPassword.length > 0
          ? payload.defaultPassword
          : undefined
      return { defaultPassword }
    } catch (error) {
      console.error('Partner account repair request failed:', error)
      return null
    }
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const submittedEmail = ((formData.get('email') as string) || '').trim()
    const submittedPassword = (formData.get('password') as string) || ''

    if (!submittedEmail || !submittedPassword) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      // 자동로그인(이메일 저장) 처리
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
        localStorage.setItem('savedEmail', submittedEmail)
      } else {
        localStorage.removeItem('rememberMe')
        localStorage.removeItem('savedEmail')
      }

      const normalizedEmail = submittedEmail.toLowerCase()

      // 1) Supabase 로그인 (세션 획득)
      const supabase = createClient(undefined, true)

      const attemptSignIn = async (
        currentPassword: string,
        allowRepair: boolean
      ): Promise<
        NonNullable<Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>['data']>
      > => {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: submittedEmail,
          password: currentPassword,
        })

        if (!signInError && signInData) {
          return signInData
        }

        const message = (signInError?.message || '').toLowerCase()

        if (allowRepair && message.includes('invalid login credentials')) {
          if (isDemoAccountEmail(normalizedEmail)) {
            const repair = await requestDemoAccountRepair(normalizedEmail)
            if (repair?.defaultPassword) {
              const infoMessage = `데모 계정 비밀번호를 기본값(${repair.defaultPassword})으로 초기화했습니다. 다시 시도합니다.`
              setInfo(infoMessage)
              setError(null)
              if (passwordInputRef.current) {
                passwordInputRef.current.value = repair.defaultPassword
              }
              return attemptSignIn(repair.defaultPassword, false)
            }
          } else if (isPartnerTestAccountEmail(normalizedEmail)) {
            const repair = await requestPartnerAccountRepair(normalizedEmail)
            if (repair?.defaultPassword) {
              const infoMessage = `파트너 테스트 계정 비밀번호를 기본값(${repair.defaultPassword})으로 초기화했습니다. 다시 시도합니다.`
              setInfo(infoMessage)
              setError(null)
              if (passwordInputRef.current) {
                passwordInputRef.current.value = repair.defaultPassword
              }
              return attemptSignIn(repair.defaultPassword, false)
            }
          }
        }

        throw signInError || new Error('로그인에 실패했습니다.')
      }

      type SignInSuccessData = NonNullable<
        Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>['data']
      >
      let signInData: SignInSuccessData
      try {
        signInData = await attemptSignIn(submittedPassword, true)
      } catch (signInError: any) {
        const rawMessage = typeof signInError?.message === 'string' ? signInError.message : ''
        const msgLower = rawMessage.toLowerCase()
        console.error('Login error:', signInError)
        if (msgLower.includes('invalid login credentials')) {
          setError(
            '계정이 존재하지 않거나 비밀번호가 일치하지 않습니다. 가입 승인 여부는 "가입상태확인"에서 확인해주세요.'
          )
          if (process.env.NODE_ENV !== 'production' && normalizedEmail === 'partner@inopnc.com') {
            setDevHelp('개발 환경에서 파트너 테스트 계정을 생성할 수 있습니다.')
          }
        } else {
          setError(rawMessage || '로그인에 실패했습니다.')
        }
        setIsLoading(false)
        return
      }

      const access_token = signInData.session?.access_token
      const refresh_token = signInData.session?.refresh_token
      if (!access_token || !refresh_token) {
        setError('세션 토큰이 없습니다. 다시 시도해주세요.')
        setIsLoading(false)
        return
      }

      const { data: profileRow } = await supabase
        .from('profiles')
        .select('mfa_enabled')
        .eq('id', signInData.user.id)
        .maybeSingle()

      const tokens = { access_token, refresh_token }

      const bypassMfa = isTestBypassEmail(signInData.user.email)
      if (bypassMfa) {
        const synced = await syncSession(tokens)
        setIsLoading(false)
        if (synced) {
          await redirectAfterLogin()
        }
        return
      }

      if (!profileRow?.mfa_enabled) {
        setPendingSession(tokens)
        setPhase('mfa-setup')
        setMfaIntent('setup')
        setMfaCode('')
        setMfaError(null)
        setInfo('OTP 앱에 아래 키를 등록한 후 6자리 코드를 입력해주세요.')

        const secretResult = await generateMfaSecret(access_token)
        if (!secretResult?.success || !secretResult.secret) {
          setError(secretResult?.error || 'MFA 설정 정보를 불러오지 못했습니다.')
          setPhase('credentials')
          setPendingSession(null)
          await supabase.auth.signOut()
        } else {
          setMfaSecret(secretResult.secret)
          setMfaUri(secretResult.otpauthUrl || null)
        }

        setIsLoading(false)
        return
      }

      setPendingSession(tokens)
      setPhase('mfa-verify')
      setMfaIntent('login')
      setMfaCode('')
      setMfaError(null)
      setInfo('Google Authenticator 앱에서 생성된 6자리 코드를 입력해주세요.')
      setIsLoading(false)
      return
    } catch (err) {
      console.error('Login exception:', err)
      setError('로그인에 실패했습니다.')
      setIsLoading(false)
    }
  }

  const handleMfaSubmit = async () => {
    if (!pendingSession) return
    setIsMfaSubmitting(true)
    setMfaError(null)
    try {
      const verifyResult = await verifyMfaCode({
        accessToken: pendingSession.access_token,
        code: mfaCode,
        intent: mfaIntent,
      })

      if (!verifyResult?.success || !verifyResult?.token) {
        setMfaError(verifyResult?.error || '인증에 실패했습니다.')
        setIsMfaSubmitting(false)
        return
      }

      const synced = await syncSession(pendingSession, { mfaToken: verifyResult.token })
      if (!synced) {
        setIsMfaSubmitting(false)
        return
      }

      setPhase('credentials')
      setPendingSession(null)
      setMfaSecret(null)
      setMfaUri(null)
      setMfaCode('')
      setInfo(null)
      await redirectAfterLogin()
    } catch (error) {
      console.error('MFA submit error:', error)
      setMfaError('인증 과정에서 오류가 발생했습니다.')
    } finally {
      setIsMfaSubmitting(false)
    }
  }

  const openFindId = () => {
    setIsFindIdOpen(true)
    setFindIdStep('form')
    setFindIdName('')
    setFindIdPhone('')
    setFindIdVerificationId(null)
    setFindIdCode('')
    setFindIdResult(null)
    setFindIdError(null)
    setFindIdHelper(null)
  }
  const closeFindId = () => setIsFindIdOpen(false)

  const submitFindIdRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsFindIdSubmitting(true)
    setFindIdError(null)
    try {
      const res = await fetch('/api/auth/find-id/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: findIdName,
          phone: findIdPhone,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success || !data?.verificationId) {
        setFindIdError(data?.error || '인증 코드를 전송하지 못했습니다.')
        return
      }
      setFindIdVerificationId(data.verificationId)
      setFindIdStep('code')
      setFindIdHelper(
        '입력하신 이름·전화번호와 연결된 이메일 주소로 인증 코드를 전송했습니다. 받은 편지함과 스팸함을 확인해주세요.'
      )
    } catch (error) {
      console.error('Find ID request error', error)
      setFindIdError('요청 중 오류가 발생했습니다.')
    } finally {
      setIsFindIdSubmitting(false)
    }
  }

  const submitFindIdVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!findIdVerificationId) {
      setFindIdError('인증 정보를 다시 요청해주세요.')
      return
    }
    setIsFindIdSubmitting(true)
    setFindIdError(null)
    try {
      const res = await fetch('/api/auth/find-id/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationId: findIdVerificationId,
          code: findIdCode,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success || !data?.email) {
        setFindIdError(data?.error || '인증에 실패했습니다.')
        return
      }
      setFindIdResult(data.email)
      setFindIdStep('done')
    } catch (error) {
      console.error('Find ID verify error', error)
      setFindIdError('인증 처리 중 오류가 발생했습니다.')
    } finally {
      setIsFindIdSubmitting(false)
    }
  }

  const openSignupStatus = () => {
    setIsSignupStatusOpen(true)
    setSignupStatusStep('form')
    setSignupStatusEmail('')
    setSignupStatusVerificationId(null)
    setSignupStatusCode('')
    setSignupStatusResult(null)
    setSignupStatusError(null)
  }
  const closeSignupStatus = () => setIsSignupStatusOpen(false)

  const submitSignupStatusRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSignupStatusSubmitting(true)
    setSignupStatusError(null)
    try {
      const res = await fetch('/api/auth/signup-status/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signupStatusEmail }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success || !data?.verificationId) {
        setSignupStatusError(data?.error || '인증 코드를 전송하지 못했습니다.')
        return
      }
      setSignupStatusVerificationId(data.verificationId)
      setSignupStatusStep('code')
    } catch (error) {
      console.error('Signup status request error', error)
      setSignupStatusError('요청 중 오류가 발생했습니다.')
    } finally {
      setIsSignupStatusSubmitting(false)
    }
  }

  const submitSignupStatusVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signupStatusVerificationId) {
      setSignupStatusError('인증 정보를 다시 요청해주세요.')
      return
    }
    setIsSignupStatusSubmitting(true)
    setSignupStatusError(null)
    try {
      const res = await fetch('/api/auth/signup-status/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationId: signupStatusVerificationId,
          code: signupStatusCode,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success) {
        setSignupStatusError(data?.error || '인증에 실패했습니다.')
        return
      }
      const statusLabel =
        data?.status === 'approved'
          ? '승인 완료'
          : data?.status === 'rejected'
            ? '반려됨'
            : data?.status === 'pending'
              ? '승인 대기중'
              : '요청 없음'
      const detail =
        typeof data?.message === 'string' && data.message.length > 0 ? `\n${data.message}` : ''
      setSignupStatusResult(`${statusLabel}${detail}`)
      setSignupStatusStep('done')
    } catch (error) {
      console.error('Signup status verify error', error)
      setSignupStatusError('인증 처리 중 오류가 발생했습니다.')
    } finally {
      setIsSignupStatusSubmitting(false)
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
      <style jsx global>{`
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
          overflow-x: hidden;
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
          white-space: nowrap; /* 모바일에서는 해제 */
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
          border-color: #d1d5db;
          box-shadow: none;
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

        .mfa-card {
          background: #fff;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          padding: 24px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.05);
          margin-top: 24px;
        }

        .mfa-card h2 {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #111827;
        }

        .mfa-secret {
          font-family:
            'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
          background: #f3f4f6;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
          letter-spacing: 2px;
          color: #1f2937;
          margin: 16px 0;
        }

        .mfa-link {
          color: #2563eb;
          text-decoration: underline;
        }

        .mfa-helper {
          color: #6b7280;
          font-size: 14px;
          margin-top: 12px;
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
          /* Use native checkbox rendering to avoid double ticks */
          width: 18px;
          height: 18px;
          cursor: pointer;
          appearance: auto;
          -webkit-appearance: checkbox;
          -moz-appearance: checkbox;
          background: #ffffff;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          vertical-align: middle;
          transition: all 0.2s ease;
          accent-color: #31a3fa;
        }
        .checkbox-input:hover {
          border-color: #31a3fa;
        }
        .checkbox-input:focus {
          outline: none;
          border-color: #31a3fa;
          box-shadow: 0 0 0 3px rgba(49, 163, 250, 0.1);
        }
        /* Remove custom tick rendering to prevent double checkmarks */
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
          /* Ensure button and anchor look identical */
          background: transparent;
          border: none;
          appearance: none;
          -webkit-appearance: none;
          display: inline;
          line-height: inherit;
          font-family: inherit;
          cursor: pointer;
          /* Remove horizontal padding to minimize wrapping */
          padding: 0;
          margin: 0;
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
          border-color: #d1d5db;
          box-shadow: none;
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
        .modal-helper {
          margin-bottom: 16px;
          font-size: 14px;
          color: #4b5563;
          line-height: 1.5;
        }

        /* Responsive */
        @media (max-width: 480px) {
          .login-content {
            padding: 0 8px;
          }
          .login-container {
            padding: 0 16px;
          }
          .login-header {
            margin: 16px auto;
            flex-wrap: wrap;
            gap: 8px;
          }
          .login-title {
            font-size: 22px;
            line-height: 32px;
            height: auto;
            white-space: normal;
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

          {phase === 'credentials' ? (
            <>
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
                      ref={passwordInputRef}
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
                    <span className="separator">|</span>
                    <button type="button" className="forgot-password" onClick={openSignupStatus}>
                      가입상태확인
                    </button>
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
            </>
          ) : (
            <div className="mfa-card">
              <h2>{mfaIntent === 'setup' ? '보안 인증 설정' : '보안 인증 코드'}</h2>
              {phase === 'mfa-setup' ? (
                <>
                  <p>
                    OTP 앱(Google Authenticator 등)에 아래 키를 등록하거나,{' '}
                    {mfaUri ? (
                      <a href={mfaUri} className="mfa-link">
                        앱에서 열기
                      </a>
                    ) : (
                      '앱에서 직접 입력'
                    )}
                    후 생성된 6자리 코드를 입력해주세요.
                  </p>
                  <div className="mfa-secret">{mfaSecret || '비밀키 생성 중...'}</div>
                </>
              ) : (
                <p>등록된 OTP 앱에서 생성된 6자리 코드를 입력해주세요.</p>
              )}
              <form
                onSubmit={e => {
                  e.preventDefault()
                  handleMfaSubmit()
                }}
              >
                <div className="form-group">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    className="form-input"
                    placeholder="6자리 코드"
                    value={mfaCode}
                    onChange={e => setMfaCode(e.target.value)}
                    disabled={isMfaSubmitting}
                  />
                </div>
                {mfaError && <div className="error-message">{mfaError}</div>}
                <button type="submit" className="login-button" disabled={isMfaSubmitting}>
                  {isMfaSubmitting ? '인증 중...' : '확인'}
                </button>
              </form>
              {phase === 'mfa-setup' && (
                <p className="mfa-helper">등록 후에는 매 로그인 시 6자리 코드를 입력해야 합니다.</p>
              )}
            </div>
          )}
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
            {findIdStep === 'form' && (
              <form onSubmit={submitFindIdRequest}>
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
                {findIdError && <div className="error-message">{findIdError}</div>}
                <button type="submit" className="modal-button" disabled={isFindIdSubmitting}>
                  {isFindIdSubmitting ? '확인 중...' : '인증 코드 받기'}
                </button>
              </form>
            )}

            {findIdStep === 'code' && (
              <form onSubmit={submitFindIdVerify}>
                <p className="modal-helper">
                  {findIdHelper ||
                    '입력하신 정보와 연결된 이메일 주소로 인증 코드를 전송했습니다. 받은 편지함과 스팸함을 확인한 뒤 아래에 입력해주세요.'}
                </p>
                <div className="form-group">
                  <label htmlFor="findIdCode">인증코드</label>
                  <input
                    id="findIdCode"
                    className="form-input"
                    maxLength={6}
                    inputMode="numeric"
                    value={findIdCode}
                    onChange={e => setFindIdCode(e.target.value)}
                    required
                  />
                </div>
                {findIdError && <div className="error-message">{findIdError}</div>}
                <button type="submit" className="modal-button" disabled={isFindIdSubmitting}>
                  {isFindIdSubmitting ? '확인 중...' : '아이디 확인'}
                </button>
              </form>
            )}

            {findIdStep === 'done' && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p>등록된 아이디는 다음과 같습니다.</p>
                <p style={{ fontWeight: 600, fontSize: 18, marginTop: 12 }}>{findIdResult}</p>
                <button
                  type="button"
                  className="modal-button"
                  style={{ marginTop: 20 }}
                  onClick={closeFindId}
                >
                  로그인하러 가기
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 가입 상태 확인 모달 */}
      <div
        className={`modal ${isSignupStatusOpen ? 'show' : ''}`}
        onClick={e => {
          if (e.target === e.currentTarget) closeSignupStatus()
        }}
      >
        <div
          className="modal-content"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signupStatusTitle"
        >
          <div className="modal-header">
            <h2 id="signupStatusTitle">가입 상태 확인</h2>
            <button className="close-btn" onClick={closeSignupStatus}>
              닫기
            </button>
          </div>
          <div className="modal-body">
            {signupStatusStep === 'form' && (
              <form onSubmit={submitSignupStatusRequest}>
                <div className="form-group">
                  <label htmlFor="signupStatusEmail">이메일</label>
                  <input
                    id="signupStatusEmail"
                    type="email"
                    className="form-input"
                    placeholder="signup@email.com"
                    value={signupStatusEmail}
                    onChange={e => setSignupStatusEmail(e.target.value)}
                    required
                  />
                </div>
                {signupStatusError && <div className="error-message">{signupStatusError}</div>}
                <button type="submit" className="modal-button" disabled={isSignupStatusSubmitting}>
                  {isSignupStatusSubmitting ? '전송 중...' : '인증 코드 받기'}
                </button>
              </form>
            )}

            {signupStatusStep === 'code' && (
              <form onSubmit={submitSignupStatusVerify}>
                <p className="modal-helper">
                  입력하신 이메일로 인증 코드를 전송했습니다. 확인 후 아래에 입력해주세요.
                </p>
                <div className="form-group">
                  <label htmlFor="signupStatusCode">인증코드</label>
                  <input
                    id="signupStatusCode"
                    className="form-input"
                    maxLength={6}
                    inputMode="numeric"
                    value={signupStatusCode}
                    onChange={e => setSignupStatusCode(e.target.value)}
                    required
                  />
                </div>
                {signupStatusError && <div className="error-message">{signupStatusError}</div>}
                <button type="submit" className="modal-button" disabled={isSignupStatusSubmitting}>
                  {isSignupStatusSubmitting ? '확인 중...' : '상태 확인'}
                </button>
              </form>
            )}

            {signupStatusStep === 'done' && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ whiteSpace: 'pre-line' }}>{signupStatusResult}</p>
                <button
                  type="button"
                  className="modal-button"
                  style={{ marginTop: 20 }}
                  onClick={closeSignupStatus}
                >
                  닫기
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
