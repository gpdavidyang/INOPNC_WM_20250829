export function getLoginLogoSrc(): string {
  const src = process.env.NEXT_PUBLIC_LOGIN_LOGO_URL
  if (src && typeof src === 'string' && src.trim().length > 0) return src.trim()
  // 기본값: 수평형 로고(아이콘+워드마크)
  return '/images/Inopnc_logo_horizon.png'
}
