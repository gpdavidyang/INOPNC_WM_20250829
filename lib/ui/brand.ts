export function getLoginLogoSrc(): string {
  const src = process.env.NEXT_PUBLIC_LOGIN_LOGO_URL
  if (src && typeof src === 'string' && src.trim().length > 0) return src.trim()
  // 기본값: 루트 기본 로고 (배포 포함 보장)
  return '/INOPNC_logo.png'
}
