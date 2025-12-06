import crypto from 'crypto'

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const STEP_SECONDS = Number(process.env.AUTH_TOTP_STEP || 30)
const DIGITS = Number(process.env.AUTH_TOTP_DIGITS || 6)
const WINDOW = Number(process.env.AUTH_TOTP_WINDOW || 1)
const ISSUER = process.env.NEXT_PUBLIC_TOTP_ISSUER || 'INOPNC WMS'

function base32Encode(buffer: Buffer) {
  let bits = 0
  let value = 0
  let output = ''

  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      const idx = (value >>> (bits - 5)) & 31
      output += BASE32_ALPHABET[idx]
      bits -= 5
    }
  }

  if (bits > 0) {
    const idx = (value << (5 - bits)) & 31
    output += BASE32_ALPHABET[idx]
  }

  return output
}

function base32Decode(input: string) {
  const clean = input.replace(/[^A-Z2-7]/gi, '').toUpperCase()
  let bits = 0
  let value = 0
  const bytes: number[] = []

  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char)
    if (idx === -1) {
      throw new Error('Invalid base32 character')
    }
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }

  return Buffer.from(bytes)
}

function hotp(secret: Buffer, counter: number) {
  const buffer = Buffer.alloc(8)
  for (let i = 7; i >= 0; i -= 1) {
    buffer[i] = counter & 0xff
    counter = Math.floor(counter / 256)
  }

  const hmac = crypto.createHmac('sha1', secret).update(buffer).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  const otp = (code % 10 ** DIGITS).toString().padStart(DIGITS, '0')
  return otp
}

export function generateTotpSecret(length = 20) {
  const random = crypto.randomBytes(length)
  return base32Encode(random)
}

export function buildTotpUri(email: string, secret: string) {
  const label = encodeURIComponent(`${ISSUER}:${email}`)
  const issuer = encodeURIComponent(ISSUER)
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}`
}

export function verifyTotpToken(secretBase32: string, token: string) {
  const sanitized = (token || '').replace(/[^0-9]/g, '')
  if (sanitized.length !== DIGITS) return false

  const secret = base32Decode(secretBase32)
  const currentCounter = Math.floor(Date.now() / 1000 / STEP_SECONDS)

  for (let errorWindow = -WINDOW; errorWindow <= WINDOW; errorWindow += 1) {
    const counter = currentCounter + errorWindow
    if (counter < 0) continue
    const expected = hotp(secret, counter)
    if (expected === sanitized) {
      return true
    }
  }

  return false
}
