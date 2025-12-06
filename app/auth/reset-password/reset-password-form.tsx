'use client'

import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import { initialResetPasswordState, sendResetLinkAction } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="apply-button" disabled={pending}>
      {pending ? '메일 전송 중...' : '재설정 링크 보내기'}
    </button>
  )
}

export default function ResetPasswordForm() {
  const [state, formAction] = useFormState(sendResetLinkAction, initialResetPasswordState)

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
          color: #9ca3af;
        }
        .form-input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
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
        .apply-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .apply-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(26, 37, 79, 0.3);
        }
        .alert {
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 16px;
        }
        .alert-success {
          background: #ecfdf5;
          border: 1px solid #6ee7b7;
          color: #065f46;
        }
        .alert-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
        }
        .helper {
          color: #6b7280;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 12px;
        }
      `}</style>

      <div className="helper">
        가입 시 사용한 이메일을 입력하면 재설정 링크를 보내드립니다. Google Authenticator 등 OTP
        앱을 사용하는 계정의 경우에도 동일 메일로 안내됩니다.
      </div>

      {state.message && (
        <div className={`alert ${state.success ? 'alert-success' : 'alert-error'}`}>
          {state.message}
        </div>
      )}

      <form action={formAction}>
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
            className="form-input"
            placeholder="email@example.com"
          />
        </div>

        <SubmitButton />
      </form>

      {state.success && (
        <Link href="/auth/login" className="apply-button" style={{ marginTop: 0 }}>
          로그인 화면으로 돌아가기
        </Link>
      )}
    </>
  )
}
