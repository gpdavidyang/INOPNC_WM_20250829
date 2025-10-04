// Lightweight JS design tokens (mirrors CSS tokens in styles/design-tokens.css)
// Use in TS where numeric constants or enums help avoid magic numbers.

export const radii = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 24,
  full: 9999,
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const

export const sizes = {
  button: 44,
  chip: 48,
  input: 44,
  header: 64, // admin header default
  nav: 64,
} as const

export const zIndex = {
  header: 40,
  sidebar: 40,
  overlay: 50,
  modal: 50,
  toast: 60,
} as const

export const breakpoints = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
} as const

export type Tokens = {
  radii: typeof radii
  spacing: typeof spacing
  sizes: typeof sizes
  zIndex: typeof zIndex
  breakpoints: typeof breakpoints
}

export const tokens: Tokens = { radii, spacing, sizes, zIndex, breakpoints }
