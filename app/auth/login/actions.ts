'use server'

import { generateMfaSecretForAccessToken, verifyMfaCodeForAccessToken } from '@/lib/auth/mfa-server'

export async function generateMfaSecret(accessToken: string) {
  return generateMfaSecretForAccessToken(accessToken)
}

export async function verifyMfaCode({
  accessToken,
  code,
  intent,
}: {
  accessToken: string
  code: string
  intent: 'login' | 'setup'
}) {
  return verifyMfaCodeForAccessToken({ accessToken, code, intent })
}
