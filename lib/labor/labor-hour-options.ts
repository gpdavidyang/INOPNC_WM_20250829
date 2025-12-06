export const FALLBACK_LABOR_HOUR_OPTIONS: ReadonlyArray<number> = Object.freeze([
  0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5,
])

export const FALLBACK_LABOR_HOUR_DEFAULT = 0.5

export const normalizeLaborHourOptions = (values: readonly number[]): number[] => {
  const sanitized = values
    .map(value => Number(value))
    .filter(value => Number.isFinite(value) && value >= 0)

  const uniqueSorted = Array.from(new Set(sanitized)).sort((a, b) => a - b)
  return uniqueSorted.length > 0 ? uniqueSorted : Array.from(FALLBACK_LABOR_HOUR_OPTIONS)
}
