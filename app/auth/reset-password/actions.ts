'use server'

import { requestPasswordReset } from '@/app/auth/actions'

export type ResetPasswordState = {
  success: boolean
  message: string
}

export async function sendResetLinkAction(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const email = (formData.get('email') || '').toString().trim()

  if (!email) {
    return { success: false, message: '이메일 주소를 입력해주세요.' }
  }

  const result = await requestPasswordReset(email)

  if (result?.success) {
    return {
      success: true,
      message: '재설정 안내 메일을 발송했습니다. 받은 편지함과 스팸함을 확인해주세요.',
    }
  }

  return {
    success: false,
    message: result?.error || '재설정 메일 발송 중 오류가 발생했습니다.',
  }
}

export const initialResetPasswordState: ResetPasswordState = {
  success: false,
  message: '',
}
