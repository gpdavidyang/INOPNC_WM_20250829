/**
 * 차트 컴포넌트 Props 타입 정의
 */


// Chart Data Types
export interface ChartDataPoint {
  x: string | number | Date
  y: number
  label?: string
  color?: string
  meta?: Record<string, unknown>
}

export interface ChartSeries {
  name: string
  data: ChartDataPoint[] | number[]
  color?: string
  type?: 'line' | 'bar' | 'area' | 'scatter'
  visible?: boolean
}

// Base Chart Props
export interface BaseChartProps extends BaseComponentProps {
  title?: string
  subtitle?: string
  width?: number | string
  height?: number | string
  loading?: boolean
  noData?: string
  theme?: 'light' | 'dark'
  colors?: string[]
  legend?: {
    show?: boolean
    position?: 'top' | 'bottom' | 'left' | 'right'
  }
  tooltip?: {
    show?: boolean
    formatter?: (value: unknown) => string
  }
  responsive?: boolean
}

// Line Chart Props
export interface LineChartProps extends BaseChartProps {
  data: ChartSeries[]
  xAxis?: {
    type?: 'category' | 'datetime' | 'numeric'
    title?: string
    labels?: string[]
  }
  yAxis?: {
    title?: string
    min?: number
    max?: number
  }
  smooth?: boolean
  area?: boolean
  stacked?: boolean
  markers?: boolean
}

// Bar Chart Props
export interface BarChartProps extends BaseChartProps {
  data: ChartSeries[]
  xAxis?: {
    type?: 'category' | 'datetime' | 'numeric'
    title?: string
    labels?: string[]
  }
  yAxis?: {
    title?: string
    min?: number
    max?: number
  }
  horizontal?: boolean
  stacked?: boolean
  grouped?: boolean
  barWidth?: number | string
}

// Pie Chart Props
export interface PieChartProps extends BaseChartProps {
  data: Array<{
    name: string
    value: number
    color?: string
  }>
  innerRadius?: number
  outerRadius?: number
  startAngle?: number
  endAngle?: number
  padAngle?: number
  donut?: boolean
  labels?: {
    show?: boolean
    formatter?: (value: number, percentage: number) => string
  }
}

// Area Chart Props
export interface AreaChartProps extends BaseChartProps {
  data: ChartSeries[]
  xAxis?: {
    type?: 'category' | 'datetime' | 'numeric'
    title?: string
    labels?: string[]
  }
  yAxis?: {
    title?: string
    min?: number
    max?: number
  }
  stacked?: boolean
  gradient?: boolean
  opacity?: number
}

// Scatter Chart Props
export interface ScatterChartProps extends BaseChartProps {
  data: Array<{
    name: string
    data: Array<{
      x: number
      y: number
      z?: number
    }>
    color?: string
  }>
  xAxis?: {
    title?: string
    min?: number
    max?: number
  }
  yAxis?: {
    title?: string
    min?: number
    max?: number
  }
  bubble?: boolean
  size?: (value: number) => number
}

// Radar Chart Props
export interface RadarChartProps extends BaseChartProps {
  data: Array<{
    name: string
    values: number[]
    color?: string
  }>
  categories: string[]
  max?: number
  filled?: boolean
  showGrid?: boolean
}

// Heatmap Props
export interface HeatmapProps extends BaseChartProps {
  data: Array<{
    x: string | number
    y: string | number
    value: number
  }>
  xLabels: string[]
  yLabels: string[]
  colorScale?: {
    min?: number
    max?: number
    colors?: string[]
  }
  showValues?: boolean
}

// Gauge Chart Props
export interface GaugeChartProps extends BaseChartProps {
  value: number
  min?: number
  max?: number
  target?: number
  segments?: Array<{
    from: number
    to: number
    color: string
    label?: string
  }>
  showValue?: boolean
  showTarget?: boolean
  format?: (value: number) => string
}