export const FALLBACK_LABOR_HOUR_OPTIONS: ReadonlyArray<number> = Object.freeze([
  0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5,
])

export const FALLBACK_LABOR_HOUR_DEFAULT = 1.0

export const normalizeLaborUnit = (v: number): number => {
  if (!v || v <= 0) return 0
  // Heuristic: values >= 2.0 are treated as Hours (8 -> 1.0),
  // values < 2.0 as Man-Days (1.0 -> 1.0).
  // This correctly distinguishes between 1.0 (1 day) and 8.0 (1 day).
  return v >= 2.0 ? v / 8 : v
}

export const calculateWorkerCount = (manpower: number): number => {
  if (!Number.isFinite(manpower) || manpower <= 0) return 0
  return Math.ceil(manpower)
}

export const normalizeLaborHourOptions = (values: readonly number[]): number[] => {
  const sanitized = values
    .map(value => Number(value))
    .filter(value => Number.isFinite(value) && value >= 0)

  const uniqueSorted = Array.from(new Set(sanitized)).sort((a, b) => a - b)
  return uniqueSorted.length > 0 ? uniqueSorted : Array.from(FALLBACK_LABOR_HOUR_OPTIONS)
}
