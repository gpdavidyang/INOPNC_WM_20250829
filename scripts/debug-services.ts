import { getIntegratedSiteDetail } from '@/lib/admin/site-detail'
import { getSiteLaborSummary } from '@/lib/api/adapters/site-assignments'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function debugServices() {
  const siteId = '0655796a-4731-45f4-8515-167445ddac0a' // Gangnam A
  const targetReportDate = '2026-01-31'
  const targetUserName = '이현수'

  console.log('--- Debugging getIntegratedSiteDetail ---')
  try {
    const detail = await getIntegratedSiteDetail(siteId)
    if (detail) {
      console.log('Stats:', detail.stats)
      const targetReport = detail.reports.find(r => r.work_date === targetReportDate)
      if (targetReport) {
        console.log(`Report ${targetReportDate}:`)
        console.log(' - ID:', targetReport.id)
        console.log(' - total_labor_hours (DB):', targetReport.total_labor_hours)
        console.log(' - total_manhours (Calc):', targetReport.total_manhours)
        console.log(' - work_content path in object:', 'work_content' in targetReport)
        console.log(
          ' - work_content value:',
          JSON.stringify(targetReport.work_content).slice(0, 100)
        )
      } else {
        console.log(`Report ${targetReportDate} NOT FOUND in recent list`)
      }
    } else {
      console.log('Detail is null')
    }
  } catch (e) {
    console.error('Error in detail:', e)
  }

  console.log('\n--- Debugging getSiteLaborSummary ---')
  try {
    // Need user ID for Lee
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: user } = await supabase
      .from('profiles')
      .select('id')
      .eq('full_name', targetUserName)
      .single()

    if (user) {
      console.log(`User ${targetUserName} ID: ${user.id}`)
      const summary = await getSiteLaborSummary(siteId, [user.id])
      console.log('Labor Summary:', summary)
    } else {
      console.log(`User ${targetUserName} not found`)
    }
  } catch (e) {
    console.error('Error in summary:', e)
  }
}

debugServices()
