import { Metadata } from 'next'
import ResetPasswordForm from './reset-password-form'

export const metadata: Metadata = {
  title: '비밀번호 재설정 - INOPNC',
  description: '가입하신 이메일로 비밀번호 재설정 링크를 보내드립니다.',
}

export default function ResetPasswordPage() {
  const inlineSvg =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg width="114" height="38" viewBox="0 0 114 38" xmlns="http://www.w3.org/2000/svg">' +
        '<rect width="114" height="38" fill="#1A254F"/>' +
        '<text x="57" y="24" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#FFFFFF">INOPNC</text>' +
        '</svg>'
    )

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
          padding: 0 20px;
          background: #ffffff;
          font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
        }
        .reset-content { width: 100%; max-width: 400px; padding: 0 20px; box-sizing: border-box; }
        .reset-header { display: flex; align-items: center; justify-content: center; gap: 16px; margin: 0 auto 20px; width: 100%; }
        .reset-logo { height: 38px; width: auto; object-fit: contain; display: flex; align-items: center; }
        .reset-title { font-size: 24px; font-weight: 600; color: #1A254F; margin: 0; line-height: 1.2; height: 35px; display: flex; align-items: center; }
        .card { background: #fff; border-radius: 8px; box-shadow: 0 12px 40px rgba(0,0,0,0.08); padding: 18px; border: 1px solid #EEF2F7; }
        @media (max-width: 480px) {
          .reset-content { padding: 0 20px; }
          .reset-title { font-size: 24px; height: 35px; }
        }
      `}</style>

      <div className="reset-container">
        <div className="reset-content">
          <div className="reset-header">
            <img
              src="/images/inopnc-logo-n.png"
              alt="INOPNC 로고"
              width={114}
              height={38}
              className="reset-logo"
            />
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
