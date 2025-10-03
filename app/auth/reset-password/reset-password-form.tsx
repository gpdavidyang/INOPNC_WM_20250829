'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ResetPasswordForm() {
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const numericMin6 = /^[0-9]{6,}$/
    if (!numericMin6.test(newPassword)) {
      setError('비밀번호는 숫자 6자리 이상이어야 합니다.')
      setLoading(false)
      return
    }
    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/admin/password/direct-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.error) throw new Error(data?.error || '변경에 실패했습니다.')
      setSuccess(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '오류가 발생했습니다.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <>
        <style jsx>{`
          .success {
            text-align: center;
          }
          .success-title {
            font-size: 18px;
            font-weight: 600;
            color: #1a254f;
            margin-bottom: 8px;
          }
          .success-desc {
            color: #6b7280;
            font-size: 14px;
          }
          .apply-button {
            width: 100%;
            height: 45px;
            border: none;
            border-radius: 8px;
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
          .apply-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(26, 37, 79, 0.3);
          }
        `}</style>
        <div className="success">
          <div className="success-title">비밀번호가 변경되었습니다</div>
          <div className="success-desc">새 비밀번호로 로그인해주세요.</div>
          <Link href="/auth/login" className="apply-button">
            로그인 화면으로 돌아가기
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <style jsx>{`
        .form-group {
          margin-bottom: 16px;
        }
        .label {
          display: block;
          font-size: 14px;
          color: #374151;
          margin-bottom: 8px;
        }
        .form-input {
          width: 100%;
          height: 45px;
          padding: 0 14px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #ffffff;
          color: #6b7280;
          font-size: 16px;
          font-weight: 500;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .form-input::placeholder {
          color: #6b7280;
        }
        .form-input:focus {
          outline: none;
          border-color: #31a3fa;
          box-shadow: 0 0 0 3px rgba(49, 163, 250, 0.1);
        }
        .apply-button {
          width: 100%;
          height: 45px;
          border: none;
          border-radius: 8px;
          background: #1a254f;
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin: 20px 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .apply-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(26, 37, 79, 0.3);
        }
        .error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
        }
        .helper {
          color: #6b7280;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 8px;
        }
      `}</style>

      <div className="helper">
        이메일을 입력하고 새 비밀번호를 설정하세요. 이메일 확인 과정 없이 즉시 적용됩니다.
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email" className="label">
            이메일 주소
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="form-input"
            placeholder="email@example.com"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="newPassword" className="label">
            새 비밀번호 (숫자 6자리 이상)
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="form-input"
            placeholder="숫자 6자리 이상"
            inputMode="numeric"
            pattern="[0-9]{6,}"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword" className="label">
            비밀번호 확인
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="form-input"
            placeholder="다시 입력"
            inputMode="numeric"
            pattern="[0-9]{6,}"
            disabled={loading}
          />
        </div>

        {error && <div className="error">{error}</div>}

        <button type="submit" className="apply-button" disabled={loading}>
          {loading ? '변경 중...' : '비밀번호 변경'}
        </button>
      </form>
    </>
  )
}
