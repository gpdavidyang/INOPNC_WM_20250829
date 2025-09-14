
// Lazy load heavy chart components to reduce initial bundle
export const LazyChart = lazy(() => 
  import('react-chartjs-2').then(module => ({
    default: module.Line // or whichever chart type you use most
  }))
)

export const LazyBarChart = lazy(() => 
  import('react-chartjs-2').then(module => ({
    default: module.Bar
  }))
)

export const LazyDoughnutChart = lazy(() => 
  import('react-chartjs-2').then(module => ({
    default: module.Doughnut  
  }))
)

// Lazy load PDF generation utilities
export const LazyPDFGenerator = lazy(() => 
  import('./pdf-generator').then(module => ({
    default: module.PDFGenerator
  }))
)

// Lazy load Excel utilities
export const LazyExcelUtils = lazy(() => 
  import('./excel-utils').then(module => ({
    default: module.ExcelUtils
  }))
)

// Lazy load Canvas-based markup editor
export const LazyMarkupEditor = lazy(() => 
  import('@/components/markup/markup-editor').then(module => ({
    default: module.MarkupEditor
  }))
)

// Lazy load heavy dashboard components
export const LazyAnalyticsDashboard = lazy(() => 
  import('@/components/dashboard/business-analytics-dashboard').then(module => ({
    default: module.BusinessAnalyticsDashboard
  }))
)

export const LazyEquipmentCalendar = lazy(() => 
  import('@/components/equipment/equipment-calendar').then(module => ({
    default: module.EquipmentCalendar
  }))
)

// Chart.js registration - load only when needed
export const loadChartJS = async () => {
  const [
    { Chart },
    { default: CategoryScale },
    { default: LinearScale },
    { default: BarElement },
    { default: LineElement },
    { default: PointElement },
    { default: ArcElement },
    { default: Title },
    { default: Tooltip },
    { default: Legend },
  ] = await Promise.all([
    import('chart.js/auto'),
    import('chart.js/dist/scales/scale.category'),
    import('chart.js/dist/scales/scale.linear'),
    import('chart.js/dist/elements/element.bar'),
    import('chart.js/dist/elements/element.line'),
    import('chart.js/dist/elements/element.point'),
    import('chart.js/dist/elements/element.arc'),
    import('chart.js/dist/plugins/plugin.title'),
    import('chart.js/dist/plugins/plugin.tooltip'),
    import('chart.js/dist/plugins/plugin.legend'),
  ])

  Chart.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
  )

  return Chart
}

// Canvas utilities - load only when needed
export const loadCanvasUtils = async () => {
  return import('canvas').then(module => module.default)
}

// Web push utilities - load only when needed  
export const loadWebPushUtils = async () => {
  return import('web-push').then(module => module.default)
}