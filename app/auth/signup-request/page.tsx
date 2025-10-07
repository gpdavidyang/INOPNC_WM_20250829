'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import LogoImage from '@/components/LogoImage'
import { getLoginLogoSrc } from '@/lib/ui/brand'
import {
  CustomSelect,
  CustomSelectTrigger,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectValue,
} from '@/components/ui/custom-select'

type PartnerCompany = { id: string; company_name: string; status?: string }

export default function SignupRequestPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    company: '',
    jobTitle: '',
    phone: '',
    email: '',
  })
  const [partnerCompanies, setPartnerCompanies] = useState<PartnerCompany[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  // Email split states
  const [emailUser, setEmailUser] = useState('')
  const [emailDomainSelect, setEmailDomainSelect] = useState('') // '', 'custom', 'gmail.com', ...
  const [emailDomainCustom, setEmailDomainCustom] = useState('')
  const [companyFilter, setCompanyFilter] = useState<'active' | 'all'>('active')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Logo fallbacks
  const inlineSvg =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg width="114" height="38" viewBox="0 0 114 38" xmlns="http://www.w3.org/2000/svg">' +
        '<rect width="114" height="38" fill="#1A254F"/>' +
        '<text x="57" y="24" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#FFFFFF">INOPNC</text>' +
        '</svg>'
    )

  useEffect(() => {
    const loadPartners = async () => {
      setLoadingCompanies(true)
      try {
        const res = await fetch('/api/partner-companies', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || !json?.success) throw new Error(json?.error || '파트너사 목록 로드 실패')
        setPartnerCompanies(json.data || [])
      } catch (e) {
        console.error('파트너사 조회 실패:', e)
        setError('파트너사 목록을 불러오지 못했습니다.')
      } finally {
        setLoadingCompanies(false)
      }
    }
    loadPartners()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!termsAccepted) {
      setError('이용약관 및 개인정보처리방침에 동의해주세요.')
      return
    }
    const selectedCompany = partnerCompanies.find(p => p.id === selectedCompanyId)
    const companyName = selectedCompany?.company_name || ''
    // Compose email from split fields
    const userPart = (emailUser || '').trim()
    const domainPart = (
      emailDomainSelect === 'custom' ? emailDomainCustom : emailDomainSelect || ''
    ).trim()
    const emailComposed = userPart && domainPart ? `${userPart}@${domainPart}` : ''

    // Validate email composition
    const userOk = /^[A-Za-z0-9._%+-]+$/.test(userPart)
    const domainOk = /^[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(domainPart)
    if (!userOk || !domainOk) {
      setError('이메일 형식을 확인해주세요.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/signup-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          jobTitle: formData.jobTitle,
          phone: formData.phone,
          email: emailComposed,
          partnerCompanyId: selectedCompanyId,
        }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok || payload?.error) {
        setError(payload?.error || '승인 요청 중 오류가 발생했습니다.')
      } else {
        setSubmitted(true)
      }
    } catch (err) {
      console.error('Signup request error:', err)
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
      <>
        <style jsx>{`
          .container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #ffffff;
            padding: 0 20px;
          }
          .content {
            width: 100%;
            max-width: 400px;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            margin: 0 auto 20px;
          }
          .logo {
            height: 38px;
            width: auto;
          }
          .title {
            font-size: 24px;
            font-weight: 700;
            color: #1a254f;
            margin: 0;
          }
          .card {
            background: #fff;
            border: 1px solid #eef2f7;
            border-radius: 8px;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
            padding: 18px;
            text-align: center;
          }
          .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 10px 16px;
            background: #1a254f;
            color: #fff;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
          }
        `}</style>
        <div className="container">
          <div className="content">
            <div className="header">
              <LogoImage srcPrimary={getLoginLogoSrc()} className="logo" />
              <h1 className="title">회원가입</h1>
            </div>
            <div className="card">
              <h2 style={{ fontSize: 20, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
                승인요청 완료
              </h2>
              <p style={{ color: '#6B7280', marginBottom: 16 }}>
                회원가입 승인요청이 성공적으로 제출되었습니다.
                <br />
                관리자 승인 후 이메일로 안내드리겠습니다.
              </p>
              <Link href="/auth/login" className="btn">
                로그인 화면으로
              </Link>
              <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                <button
                  className="btn"
                  style={{ background: '#15347C' }}
                  onClick={async () => {
                    try {
                      const res = await fetch(
                        `/api/auth/signup-request/status?email=${encodeURIComponent(formData.email)}`,
                        { cache: 'no-store' }
                      )
                      const j = await res.json().catch(() => ({}))
                      alert(
                        j?.status === 'pending'
                          ? '현재 승인 대기 중입니다.'
                          : j?.status === 'approved'
                            ? '승인 완료되었습니다. 로그인 해주세요.'
                            : j?.status === 'rejected'
                              ? '요청이 반려되었습니다. 관리자에게 문의하세요.'
                              : '요청 내역을 확인했습니다.'
                      )
                    } catch {
                      alert('상태 확인 중 오류가 발생했습니다.')
                    }
                  }}
                >
                  승인 상태 확인
                </button>
                <button
                  className="btn"
                  style={{ background: '#5F7AB9' }}
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/auth/signup-request/resend', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: formData.email }),
                      })
                      if (res.ok) alert('승인 안내를 재전송했습니다.')
                      else alert('재전송에 실패했습니다.')
                    } catch {
                      alert('재전송 중 오류가 발생했습니다.')
                    }
                  }}
                >
                  승인 안내 다시 받기
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style jsx>{`
        .container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          padding: 0 20px;
        }
        .content {
          width: 100%;
          max-width: 400px;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin: 0 auto 20px;
        }
        .logo {
          height: 38px;
          width: auto;
        }
        .title {
          font-size: 24px;
          font-weight: 700;
          color: #1a254f;
          margin: 0;
        }
        .card {
          background: #fff;
          border: 1px solid #eef2f7;
          border-radius: 8px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
          padding: 18px;
        }
        .form-group {
          margin-bottom: 18px;
        }
        .label {
          display: block;
          font-size: 14px;
          color: #374151;
          margin-bottom: 8px;
        }
        .input {
          width: 100%;
          height: 45px;
          padding: 0 14px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #fff;
          color: #6b7280;
          font-size: 16px;
          font-weight: 500;
        }
        .input:focus {
          outline: none;
          border-color: #31a3fa;
          box-shadow: 0 0 0 3px rgba(49, 163, 250, 0.1);
        }
        .error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 8px;
        }
        .submit {
          width: 100%;
          height: 45px;
          border: none;
          border-radius: 8px;
          background: #1a254f;
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 12px;
        }
        .submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .terms {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .terms-checkbox {
          width: 18px;
          height: 18px;
          cursor: pointer;
          appearance: auto;
          -webkit-appearance: checkbox;
          -moz-appearance: checkbox;
          background: #ffffff;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          accent-color: #31a3fa;
        }
        .terms-checkbox:hover {
          border-color: #31a3fa;
        }
        .terms-checkbox:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(49, 163, 250, 0.1);
          border-color: #31a3fa;
        }
        .footer {
          text-align: center;
          margin-top: 12px;
          color: #6b7280;
          font-size: 14px;
        }
        .footer a {
          color: #1a254f;
          text-decoration: none;
        }
        .footer-login {
          color: #0f1a3a !important;
          font-weight: 1000 !important; /* heavier than 900 if supported */
          font-variation-settings: 'wght' 1000;
        }
        .footer-login:visited {
          color: #0f1a3a !important;
        }
        .footer-login:hover {
          color: #0f1a3a !important;
          text-decoration: underline !important;
        }
        .email-wrapper {
          display: flex;
          flex-wrap: nowrap;
          align-items: center;
          gap: 8px;
          width: 100%;
          overflow: hidden;
        }
        .email-user {
          flex: 1 1 0;
          min-width: 0;
        }
        .email-at {
          flex: 0 0 auto;
          color: #6b7280;
          font-size: 16px;
          font-weight: 500;
        }
        .domain-container {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1 1 0;
          min-width: 0;
        }
        .domain-input {
          flex: 1 1 0;
          min-width: 0;
          width: 100%;
        }
        .domain-trigger {
          flex: 1 1 0;
          min-width: 0;
          width: 100%;
          overflow: hidden;
        }
        /* Filter toggle removed */
        .terms-label {
          font-size: 14px;
          color: #374151;
          display: inline-flex;
          align-items: center;
          height: 18px;
        }
        .status-badge {
          margin-left: 8px;
          padding: 2px 6px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 600;
          display: inline-block;
        }
        .status-active {
          background: #dcfce7;
          color: #166534;
        }
        .status-pending {
          background: #fef9c3;
          color: #854d0e;
        }
        .status-disabled {
          background: #e5e7eb;
          color: #374151;
        }
      `}</style>

      <div className="container">
        <div className="content">
          <div className="header">
            <LogoImage srcPrimary={getLoginLogoSrc()} className="logo" />
            <h1 className="title">회원가입</h1>
          </div>

          <div className="card">
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleSubmit}>
              {/* 이름 */}
              <div className="form-group">
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => handleInputChange('fullName', e.target.value)}
                  className="input"
                  placeholder="이름을 입력하세요"
                />
              </div>

              {/* 소속(파트너사) */}
              <div className="form-group">
                <CustomSelect
                  value={selectedCompanyId}
                  onValueChange={val => setSelectedCompanyId(val)}
                  disabled={loadingCompanies}
                >
                  <CustomSelectTrigger className="h-[45px] rounded-[8px] bg-white border border-[#D1D5DB] px-4 text-[16px] font-medium text-[#6B7280]">
                    <CustomSelectValue
                      placeholder={
                        loadingCompanies ? '불러오는 중...' : '소속(회사명)을 선택하세요'
                      }
                    />
                  </CustomSelectTrigger>
                  <CustomSelectContent sideOffset={6}>
                    {partnerCompanies.length === 0 ? (
                      <CustomSelectItem value="__no_options__" disabled>
                        등록된 파트너사가 없습니다
                      </CustomSelectItem>
                    ) : (
                      partnerCompanies.map(p => (
                        <CustomSelectItem key={p.id} value={p.id}>
                          <span>{p.company_name}</span>
                          <span
                            className={`status-badge ${
                              (p.status || 'active') === 'active'
                                ? 'status-active'
                                : (p.status || '').toLowerCase() === 'pending'
                                  ? 'status-pending'
                                  : 'status-disabled'
                            }`}
                          >
                            {(p.status || 'active') === 'active'
                              ? 'active'
                              : (p.status || '').toLowerCase() === 'pending'
                                ? 'pending'
                                : p.status || 'disabled'}
                          </span>
                        </CustomSelectItem>
                      ))
                    )}
                  </CustomSelectContent>
                </CustomSelect>
              </div>

              {/* 직함 */}
              <div className="form-group">
                <input
                  type="text"
                  required
                  value={formData.jobTitle}
                  onChange={e => handleInputChange('jobTitle', e.target.value)}
                  className="input"
                  placeholder="직함을 입력하세요"
                />
              </div>

              {/* 핸드폰 번호 */}
              <div className="form-group">
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  className="input"
                  placeholder="핸드폰 번호 000-0000-0000"
                />
              </div>

              {/* 이메일 */}
              <div className="form-group">
                <div className="email-wrapper">
                  <input
                    type="text"
                    required
                    value={emailUser}
                    onChange={e => setEmailUser(e.target.value)}
                    className="input email-user"
                    placeholder="이메일 아이디"
                    pattern="[A-Za-z0-9._%+-]+"
                    title="영문, 숫자, . _ % + - 만 입력"
                  />
                  <span className="email-at">@</span>
                  <div className="domain-container">
                    {emailDomainSelect === 'custom' ? (
                      <input
                        type="text"
                        required
                        value={emailDomainCustom}
                        onChange={e => setEmailDomainCustom(e.target.value)}
                        className="input domain-input"
                        placeholder="도메인 직접입력 (예: example.com)"
                        pattern="[A-Za-z0-9.-]+\.[A-Za-z]{2,}"
                        title="예: gmail.com, company.co.kr"
                      />
                    ) : (
                      <CustomSelect value={emailDomainSelect} onValueChange={setEmailDomainSelect}>
                        <CustomSelectTrigger className="h-[45px] rounded-[8px] bg-white border border-[#D1D5DB] px-4 text-[16px] font-medium text-[#6B7280] w-full domain-trigger">
                          <CustomSelectValue placeholder="도메인 선택" />
                        </CustomSelectTrigger>
                        <CustomSelectContent sideOffset={6}>
                          <CustomSelectItem value="custom">직접입력</CustomSelectItem>
                          <CustomSelectItem value="gmail.com">gmail.com</CustomSelectItem>
                          <CustomSelectItem value="naver.com">naver.com</CustomSelectItem>
                          <CustomSelectItem value="daum.net">daum.net</CustomSelectItem>
                          <CustomSelectItem value="hanmail.net">hanmail.net</CustomSelectItem>
                          <CustomSelectItem value="yahoo.com">yahoo.com</CustomSelectItem>
                        </CustomSelectContent>
                      </CustomSelect>
                    )}
                  </div>
                </div>
              </div>

              {/* 이용약관 동의 */}
              <div className="terms form-group">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={e => setTermsAccepted(e.target.checked)}
                  className="terms-checkbox"
                />
                <label htmlFor="terms" className="terms-label">
                  이용약관 및 개인정보처리방침에 동의합니다
                </label>
              </div>

              <button type="submit" className="submit" disabled={loading || !termsAccepted}>
                {loading ? '승인요청 중...' : '승인요청'}
              </button>
            </form>

            <div className="footer">
              <span>이미 계정이 있으신가요? </span>
              <Link href="/auth/login" className="footer-login">
                로그인
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
