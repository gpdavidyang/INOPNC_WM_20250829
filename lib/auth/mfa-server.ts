'use server'

import crypto from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { buildTotpUri, generateTotpSecret, verifyTotpToken } from '@/lib/auth/totp'

const MAX_FAILURES = Number(process.env.AUTH_MFA_MAX_FAILURES || 5)
const SHORT_LOCK_THRESHOLD = Number(process.env.AUTH_MFA_SHORT_LOCK_THRESHOLD || 3)
const SHORT_LOCK_SECONDS = Number(process.env.AUTH_MFA_SHORT_LOCK_SECONDS || 30)
const LONG_LOCK_SECONDS = Number(process.env.AUTH_MFA_LONG_LOCK_SECONDS || 300)
const SESSION_TOKEN_TTL_MS = Number(process.env.AUTH_MFA_SESSION_TTL_MS || 2 * 60 * 1000)

export type MfaVerifyIntent = 'login' | 'setup'

const nowIso = () => new Date().toISOString()
const addSeconds = (seconds: number) => new Date(Date.now() + seconds * 1000).toISOString()

const getLockSeconds = (attempts: number) => {
  if (attempts >= MAX_FAILURES) return LONG_LOCK_SECONDS
  if (attempts >= SHORT_LOCK_THRESHOLD) return SHORT_LOCK_SECONDS
  return 0
}

const formatLockMessage = (seconds: number) => {
  if (seconds >= 60) {
    const minutes = Math.ceil(seconds / 60)
    return `보안을 위해 ${minutes}분 후 다시 시도해주세요.`
  }
  return `보안을 위해 ${seconds}초 후 다시 시도해주세요.`
}

const remainingSeconds = (iso: string | null) => {
  if (!iso) return 0
  const expires = new Date(iso).getTime()
  const diff = expires - Date.now()
  return diff > 0 ? Math.ceil(diff / 1000) : 0
}

export async function generateMfaSecretForAccessToken(accessToken: string) {
  if (!accessToken) {
    return { success: false, error: '세션 정보를 찾을 수 없습니다.' }
  }

  const admin = createServiceRoleClient()
  const { data: authData, error: authError } = await admin.auth.getUser(accessToken)

  if (authError || !authData.user) {
    return { success: false, error: '세션이 만료되었습니다. 다시 로그인해주세요.' }
  }

  const user = authData.user
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('mfa_secret, mfa_enabled, mfa_failed_attempts, mfa_last_failed_at, mfa_lock_until')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { success: false, error: '프로필 정보를 불러올 수 없습니다.' }
  }

  const lockedFor = remainingSeconds(profile.mfa_lock_until as string | null)
  if (lockedFor > 0) {
    return { success: false, error: formatLockMessage(lockedFor) }
  }

  if (profile.mfa_enabled) {
    return { success: false, error: '이미 MFA가 활성화되어 있습니다.' }
  }

  let secret = profile.mfa_secret

  if (!secret) {
    secret = generateTotpSecret()
    await admin
      .from('profiles')
      .update({ mfa_secret: secret, mfa_failed_attempts: 0, mfa_last_failed_at: null })
      .eq('id', user.id)
  }

  const otpauthUrl = buildTotpUri(user.email || user.id, secret)

  return { success: true, secret, otpauthUrl }
}

export async function verifyMfaCodeForAccessToken({
  accessToken,
  code,
  intent,
}: {
  accessToken: string
  code: string
  intent: MfaVerifyIntent
}) {
  const sanitized = (code || '').replace(/[^0-9]/g, '')
  if (!accessToken || sanitized.length === 0) {
    return { success: false, error: '인증 코드가 필요합니다.' }
  }

  const admin = createServiceRoleClient()
  const { data: authData, error: authError } = await admin.auth.getUser(accessToken)

  if (authError || !authData.user) {
    return { success: false, error: '세션이 만료되었습니다. 다시 로그인해주세요.' }
  }

  const user = authData.user

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('mfa_secret, mfa_enabled, mfa_failed_attempts, mfa_last_failed_at, mfa_lock_until')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || !profile.mfa_secret) {
    return { success: false, error: 'MFA 정보가 존재하지 않습니다.' }
  }

  if (intent === 'login' && !profile.mfa_enabled) {
    return { success: false, error: '먼저 MFA를 설정해주세요.' }
  }

  const lockedFor = remainingSeconds(profile.mfa_lock_until as string | null)
  if (lockedFor > 0) {
    return { success: false, error: formatLockMessage(lockedFor) }
  }

  const isValid = verifyTotpToken(profile.mfa_secret, sanitized)

  if (!isValid) {
    const previousAttempts = Number(profile.mfa_failed_attempts || 0)
    const nextAttempts = previousAttempts + 1
    const lockSeconds = getLockSeconds(nextAttempts)
    const updates: Record<string, unknown> = {
      mfa_failed_attempts: nextAttempts,
      mfa_last_failed_at: nowIso(),
    }
    if (lockSeconds > 0) {
      updates.mfa_lock_until = addSeconds(lockSeconds)
    }

    await admin.from('profiles').update(updates).eq('id', user.id)

    if (lockSeconds > 0) {
      const prefix =
        lockSeconds >= LONG_LOCK_SECONDS
          ? '인증 실패가 반복되어 MFA가 일시적으로 잠겼습니다. '
          : '인증 실패가 여러 차례 발생했습니다. '
      return {
        success: false,
        error: `${prefix}${formatLockMessage(lockSeconds)}`,
      }
    }

    return { success: false, error: '인증 코드가 올바르지 않습니다.' }
  }

  const pendingToken = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_TOKEN_TTL_MS).toISOString()

  const updates: Record<string, unknown> = {
    mfa_session_token: pendingToken,
    mfa_session_expires_at: expiresAt,
    mfa_failed_attempts: 0,
    mfa_last_failed_at: null,
    mfa_lock_until: null,
  }

  if (!profile.mfa_enabled && intent === 'setup') {
    updates.mfa_enabled = true
    updates.mfa_enabled_at = nowIso()
  }

  await admin.from('profiles').update(updates).eq('id', user.id)

  return {
    success: true,
    token: pendingToken,
  }
}
