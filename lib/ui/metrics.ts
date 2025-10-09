export type UnitKey = 'count' | 'ea' | 'site' | 'person' | 'won' | 'percent'

export function unitLabel(unit?: UnitKey | string): string {
  if (!unit) return ''
  const map: Record<UnitKey, string> = {
    count: '건',
    ea: 'EA',
    site: '개',
    person: '명',
    won: '₩',
    percent: '%',
  }
  return (map as any)[unit] || String(unit)
}

export function formatNumberKR(
  value: number,
  opts?: { decimals?: number; style?: 'decimal' | 'currency'; currency?: 'KRW' }
): string {
  const { decimals = 0, style = 'decimal', currency = 'KRW' } = opts || {}
  return new Intl.NumberFormat('ko-KR', {
    style,
    currency: style === 'currency' ? currency : undefined,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatMetric(
  value: number,
  unit?: UnitKey | string,
  opts?: { decimals?: number; currency?: boolean }
): { valueText: string; unitText: string } {
  const valueText = formatNumberKR(value, {
    decimals: opts?.decimals ?? 0,
    style: opts?.currency || unit === 'won' ? 'currency' : 'decimal',
  })
  const unitText = unitLabel(unit === 'won' ? undefined : (unit as any)) // 통화는 값에 포함
  return { valueText, unitText }
}
