export function getLoginLogoSrc(): string {
  const src = process.env.NEXT_PUBLIC_LOGIN_LOGO_URL
  if (src && typeof src === 'string' && src.trim().length > 0) return src.trim()
  // 기본값: 수평형 로고 (소문자 경로)
  return '/images/inopnc_logo_horizon.png'
}
