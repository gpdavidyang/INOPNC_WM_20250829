import { Metadata } from 'next'
import ResetPasswordForm from './reset-password-form'
import LogoImage from '@/components/LogoImage'
import { getLoginLogoSrc } from '@/lib/ui/brand'

export const metadata: Metadata = {
  title: '비밀번호 재설정 - INOPNC',
  description: '가입하신 이메일로 비밀번호 재설정 링크를 보내드립니다.',
}

export default function ResetPasswordPage() {
  // Logo rendered by client component to ensure fallback works in production

  return (
    <>
      <style>{`
        .reset-container {
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          /* Compact but consistent outer horizontal padding */
          padding: 0 16px;
          background: #ffffff;
          font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
        }
        .reset-content { width: 100%; max-width: 400px; padding: 0; box-sizing: border-box; }
        .reset-header { display: flex; align-items: center; justify-content: center; gap: 16px; margin: 0 auto 20px; width: 100%; flex-wrap: nowrap; }
        .reset-logo { height: 38px; width: auto; object-fit: contain; display: flex; align-items: center; flex-shrink: 0; }
        .reset-title { font-size: clamp(16px, 5vw, 24px); font-weight: 600; color: #1A254F; margin: 0; line-height: 1.2; height: 35px; display: flex; align-items: center; white-space: nowrap; }
        .card { background: #fff; border-radius: 8px; box-shadow: 0 12px 40px rgba(0,0,0,0.08); padding: 18px; border: 1px solid #EEF2F7; }
        @media (max-width: 480px) {
          .reset-content { padding: 0; }
          .reset-header { gap: 8px; }
          .reset-logo { height: 32px; }
          .reset-title { font-size: clamp(15px, 5.2vw, 22px); height: 35px; }
        }
      `}</style>

      <div className="reset-container">
        <div className="reset-content">
          <div className="reset-header">
            <LogoImage srcPrimary={getLoginLogoSrc()} className="reset-logo" />
            <h1 className="reset-title">비밀번호 재설정</h1>
          </div>

          <div className="card">
            <ResetPasswordForm />
          </div>
        </div>
      </div>
    </>
  )
}
