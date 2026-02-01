export function colorToHex(c: string) {
  const map: Record<string, string> = {
    red: '#ef4444',
    blue: '#3b82f6',
    gray: '#6b7280',
  }
  if (c.startsWith('#')) return c
  return map[c] || c
}
