export function getLoginLogoSrc(): string {
  const src = process.env.NEXT_PUBLIC_LOGIN_LOGO_URL
  if (src && typeof src === 'string' && src.trim().length > 0) return src.trim()
  // default bundled asset
  return '/INOPNC_logo.png'
}
