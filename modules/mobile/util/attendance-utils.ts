export const extractWorkProcesses = (log: any): string[] => {
  if (Array.isArray(log?.workProcesses)) return log.workProcesses
  const workContent = log?.work_content
  if (workContent) {
    if (Array.isArray(workContent.workProcesses)) return workContent.workProcesses
    if (Array.isArray(workContent.memberTypes)) return workContent.memberTypes
  }
  return []
}

export const extractMaterials = (log: any): any[] => {
  if (Array.isArray(log?.materials)) return log.materials
  if (Array.isArray(log?.material_usage)) return log.material_usage
  return []
}

export const formatManDays = (value?: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '0'
  const hasFraction = Math.abs(value % 1) > 0
  return hasFraction
    ? value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    : value.toLocaleString()
}
