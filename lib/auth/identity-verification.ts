import crypto from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { sendSystemEmail } from '@/lib/notifications/system-email'
import { logAuthEvent } from '@/lib/auth/audit'
import type { Json } from '@/types/database'

export const IDENTITY_VERIFICATION_TTL_MINUTES = Number(
  process.env.AUTH_IDENTITY_OTP_TTL_MINUTES || 10
)
const MAX_ATTEMPTS = Number(process.env.AUTH_IDENTITY_OTP_MAX_ATTEMPTS || 5)
const SALT = process.env.AUTH_IDENTITY_OTP_SALT || 'identity-otp'

const DEFAULT_TEST_DOMAIN = '@inopnc.com'
const TEST_EMAIL_DOMAIN = (process.env.AUTH_TEST_EMAIL_DOMAIN || DEFAULT_TEST_DOMAIN).toLowerCase()
const TEST_EMAILS = new Set(
  (
    process.env.AUTH_TEST_EMAILS ||
    [
      'admin@inopnc.com',
      'partner@inopnc.com',
      'production@inopnc.com',
      'manager@inopnc.com',
      'worker@inopnc.com',
    ].join(',')
  )
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
)
const TEST_BYPASS_CODE = (process.env.AUTH_TEST_EMAIL_CODE || '000000').trim()

type Flow = 'find_id' | 'signup_status'

const hashCode = (code: string) =>
  crypto.createHash('sha256').update(`${code}:${SALT}`, 'utf8').digest('hex')

const generateCode = () => crypto.randomInt(100000, 999999).toString()

const toIso = (minutesFromNow: number) =>
  new Date(Date.now() + minutesFromNow * 60 * 1000).toISOString()

const isTestEmail = (email?: string | null) => {
  if (!email) return false
  const normalized = email.toLowerCase()
  if (normalized.endsWith(TEST_EMAIL_DOMAIN)) return true
  return TEST_EMAILS.has(normalized)
}

export async function createVerification({
  flow,
  profileId,
  email,
  metadata,
  recipientName,
  emailSubject,
  emailBodyBuilder,
}: {
  flow: Flow
  profileId?: string | null
  email?: string | null
  metadata?: Json
  recipientName?: string | null
  emailSubject?: string
  emailBodyBuilder?: (code: string) => string
}) {
  const supabase = createServiceRoleClient()
  const isTest = isTestEmail(email)
  const code = isTest ? TEST_BYPASS_CODE : generateCode()

  const { data, error } = await supabase
    .from('auth_identity_verifications')
    .insert({
      flow,
      profile_id: profileId ?? null,
      email: email ?? null,
      code_hash: hashCode(code),
      expires_at: toIso(IDENTITY_VERIFICATION_TTL_MINUTES),
      metadata: {
        ...(metadata || {}),
        ...(isTest ? { test_bypass: true } : null),
      },
    })
    .select('id, email, flow')
    .single()

  if (error) {
    console.error('[IDENTITY-VERIFICATION] Failed to create verification:', error)
    throw new Error('인증 요청을 처리하지 못했습니다.')
  }

  await logAuthEvent('OTP_REQUEST', {
    userEmail: email || undefined,
    details: {
      flow,
      test_bypass: isTest,
    },
  })

  if (!isTest && email && emailSubject && emailBodyBuilder) {
    try {
      await sendSystemEmail({
        email,
        name: recipientName,
        subject: emailSubject,
        content: emailBodyBuilder(code),
        priority: 'high',
        metadata: { flow },
      })
    } catch (emailError) {
      console.error('[IDENTITY-VERIFICATION] Failed to send email:', emailError)
    }
  } else if (isTest) {
    console.warn(
      `[IDENTITY-VERIFICATION] Test bypass enabled for ${email ?? 'unknown email'} (flow=${flow})`
    )
  }

  return { id: data.id, expiresAtMinutes: IDENTITY_VERIFICATION_TTL_MINUTES }
}

export async function createInvalidVerification(flow: Flow) {
  const supabase = createServiceRoleClient()
  const id = crypto.randomUUID()
  await supabase.from('auth_identity_verifications').insert({
    id,
    flow,
    profile_id: null,
    email: null,
    code_hash: hashCode(generateCode()),
    expires_at: toIso(IDENTITY_VERIFICATION_TTL_MINUTES),
    status: 'invalid',
  })
  return id
}

export async function verifyIdentityCode({
  verificationId,
  code,
}: {
  verificationId: string
  code: string
}) {
  const supabase = createServiceRoleClient()
  const { data: verification, error } = await supabase
    .from('auth_identity_verifications')
    .select('*')
    .eq('id', verificationId)
    .single()

  if (error || !verification) {
    await logAuthEvent('OTP_VERIFY_FAIL', {
      success: false,
      details: { reason: 'verification_not_found', verificationId },
    })
    return { success: false, error: '인증 요청을 찾을 수 없습니다.' }
  }

  if (verification.status === 'invalid') {
    await logAuthEvent('OTP_VERIFY_FAIL', {
      success: false,
      userEmail: verification.email || undefined,
      details: { reason: 'invalid_token', flow: verification.flow },
    })
    return { success: false, error: '인증 정보가 올바르지 않습니다.' }
  }

  if (verification.status === 'locked') {
    await logAuthEvent('OTP_VERIFY_FAIL', {
      success: false,
      userEmail: verification.email || undefined,
      details: { reason: 'locked', flow: verification.flow },
    })
    return { success: false, error: '인증 시도가 제한되었습니다. 다시 요청해주세요.' }
  }

  if (verification.status === 'expired') {
    await logAuthEvent('OTP_VERIFY_FAIL', {
      success: false,
      userEmail: verification.email || undefined,
      details: { reason: 'expired', flow: verification.flow },
    })
    return { success: false, error: '인증 코드가 만료되었습니다. 다시 요청해주세요.' }
  }

  if (verification.status === 'verified') {
    await logAuthEvent('OTP_VERIFY_SUCCESS', {
      userEmail: verification.email || undefined,
      details: { flow: verification.flow, repeated: true },
    })
    return {
      success: true,
      flow: verification.flow as Flow,
      profileId: verification.profile_id,
      email: verification.email,
      metadata: verification.metadata as Json,
      alreadyVerified: true,
    }
  }

  if (new Date(verification.expires_at).getTime() < Date.now()) {
    await supabase
      .from('auth_identity_verifications')
      .update({ status: 'expired' })
      .eq('id', verification.id)
    return { success: false, error: '인증 코드가 만료되었습니다. 다시 요청해주세요.' }
  }

  const suppliedHash = hashCode(code)
  if (suppliedHash !== verification.code_hash) {
    const attempts = (verification.attempts ?? 0) + 1
    const status = attempts >= MAX_ATTEMPTS ? 'locked' : 'pending'
    await supabase
      .from('auth_identity_verifications')
      .update({ attempts, status })
      .eq('id', verification.id)
    await logAuthEvent('OTP_VERIFY_FAIL', {
      success: false,
      userEmail: verification.email || undefined,
      details: { reason: status === 'locked' ? 'locked' : 'invalid_code', flow: verification.flow },
    })
    return {
      success: false,
      error:
        status === 'locked'
          ? '인증 시도가 여러 차례 실패했습니다. 다시 요청해주세요.'
          : '인증 코드가 올바르지 않습니다.',
    }
  }

  await supabase
    .from('auth_identity_verifications')
    .update({ status: 'verified', verified_at: new Date().toISOString() })
    .eq('id', verification.id)

  await logAuthEvent('OTP_VERIFY_SUCCESS', {
    userEmail: verification.email || undefined,
    details: { flow: verification.flow },
  })

  return {
    success: true,
    flow: verification.flow as Flow,
    profileId: verification.profile_id,
    email: verification.email,
    metadata: verification.metadata as Json,
  }
}
