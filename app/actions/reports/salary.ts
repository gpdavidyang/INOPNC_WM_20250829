'use server'

export async function generateSalaryReport(params: {
  siteId: string
  year: number
  month: number
  format: 'pdf' | 'excel'
}) {
  // TODO: 실제 구현 필요
  return {
    success: true,
    data: {
      url: `/api/reports/salary/download?site=${params.siteId}&year=${params.year}&month=${params.month}&format=${params.format}`,
      filename: `salary_report_${params.year}_${params.month}.${params.format}`
    }
  }
}