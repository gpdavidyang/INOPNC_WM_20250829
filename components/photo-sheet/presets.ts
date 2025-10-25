export type Orientation = 'portrait' | 'landscape'

export type GridPreset = {
  id: string
  label: string
  rows: number
  cols: number
}

export const PHOTO_SHEET_PRESETS: GridPreset[] = [
  { id: '1x1', label: '1×1', rows: 1, cols: 1 },
  { id: '2x1', label: '2×1', rows: 2, cols: 1 },
  { id: '3x1', label: '3×1', rows: 3, cols: 1 },
  { id: '2x2', label: '2×2', rows: 2, cols: 2 },
  { id: '3x2', label: '3×2', rows: 3, cols: 2 },
  { id: '4x2', label: '4×2', rows: 4, cols: 2 },
  { id: '3x3', label: '3×3', rows: 3, cols: 3 },
  { id: '4x3', label: '4×3', rows: 4, cols: 3 },
  { id: '5x3', label: '5×3', rows: 5, cols: 3 },
  { id: '4x4', label: '4×4', rows: 4, cols: 4 },
  { id: '5x4', label: '5×4', rows: 5, cols: 4 },
  { id: '5x5', label: '5×5', rows: 5, cols: 5 },
]
