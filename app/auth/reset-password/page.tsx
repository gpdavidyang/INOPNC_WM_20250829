import { Metadata } from 'next'
import ResetPasswordForm from './reset-password-form'
import Image from 'next/image'

export const metadata: Metadata = {
  title: '비밀번호 찾기 - INOPNC',
  description: '비밀번호를 잊으셨나요? 이메일을 통해 비밀번호를 재설정하세요.',
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 px-4 sm:px-6 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_70%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_49%,rgba(59,130,246,0.02)_50%,transparent_51%)] bg-[length:20px_20px]" />
      
      <div className="w-full max-w-md relative z-10">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 mb-6 flex items-center justify-center bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
            <Image
              src="/INOPNC_logo.png"
              alt="INOPNC 로고"
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
        </div>

        {/* 폼 카드 */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 p-8 relative">
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  )
}