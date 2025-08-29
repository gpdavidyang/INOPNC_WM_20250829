import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserSite, getUserSiteHistory } from '@/app/actions/site-info'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG] Testing site info flow for site manager...')
    
    // Test the exact same functions used by the dashboard
    const [currentSiteResult, historyResult] = await Promise.allSettled([
      getCurrentUserSite(),
      getUserSiteHistory()
    ])
    
    let currentSite = null
    let siteHistory = []
    
    // Process current site result
    if (currentSiteResult.status === 'fulfilled' && currentSiteResult.value.success && currentSiteResult.value.data) {
      currentSite = currentSiteResult.value.data
      console.log('✅ [DEBUG] Current site found:', currentSite.site_name)
    } else if (currentSiteResult.status === 'rejected') {
      console.log('❌ [DEBUG] Current site fetch failed:', currentSiteResult.reason)
    } else {
      console.log('⚠️ [DEBUG] No current site:', currentSiteResult.value?.error)
    }
    
    // Process site history result  
    if (historyResult.status === 'fulfilled' && historyResult.value.success && historyResult.value.data) {
      siteHistory = historyResult.value.data
      console.log('✅ [DEBUG] Site history found:', siteHistory.length, 'records')
    } else if (historyResult.status === 'rejected') {
      console.log('❌ [DEBUG] Site history fetch failed:', historyResult.reason)
    } else {
      console.log('⚠️ [DEBUG] No site history:', historyResult.value?.error)
    }
    
    // Test the convertToSiteInfo function logic
    const convertToSiteInfo = (site: any) => {
      if (!site) return null
      return {
        id: site.site_id,
        name: site.site_name,
        address: {
          id: site.site_id,
          site_id: site.site_id,
          full_address: site.site_address || '주소 정보 없음',
          latitude: undefined,
          longitude: undefined,
          postal_code: undefined
        },
        accommodation: site.accommodation_address ? {
          id: site.site_id,
          site_id: site.site_id,
          accommodation_name: site.accommodation_name || '숙소',
          full_address: site.accommodation_address,
          latitude: undefined,
          longitude: undefined
        } : undefined,
        process: {
          member_name: site.component_name || '미정',
          work_process: site.work_process || '미정',
          work_section: site.work_section || '미정',
          drawing_id: undefined
        },
        managers: [
          ...(site.construction_manager_phone ? [{
            role: 'construction_manager' as const,
            name: site.manager_name || '현장 소장',
            phone: site.construction_manager_phone
          }] : []),
          ...(site.safety_manager_phone ? [{
            role: 'safety_manager' as const,
            name: site.safety_manager_name || '안전 관리자',
            phone: site.safety_manager_phone
          }] : [])
        ]
      }
    }
    
    const convertedSiteInfo = convertToSiteInfo(currentSite)
    
    console.log('🔍 [DEBUG] Converted site info:', convertedSiteInfo ? 'Successfully converted' : 'Conversion failed')
    
    return NextResponse.json({
      success: true,
      message: 'Site info status check completed',
      debug: {
        serverDataFound: !!currentSite,
        siteHistoryCount: siteHistory.length,
        convertedSiteInfo: !!convertedSiteInfo,
        rawCurrentSite: currentSite,
        convertedData: convertedSiteInfo
      },
      summary: {
        currentSite: currentSite ? {
          site_name: currentSite.site_name,
          site_address: currentSite.site_address,
          manager_name: currentSite.manager_name,
          work_process: currentSite.work_process,
          work_section: currentSite.work_section,
          component_name: currentSite.component_name
        } : null,
        convertedSiteInfo: convertedSiteInfo ? {
          id: convertedSiteInfo.id,
          name: convertedSiteInfo.name,
          address: convertedSiteInfo.address.full_address,
          managers: convertedSiteInfo.managers.length,
          hasAccommodation: !!convertedSiteInfo.accommodation
        } : null
      }
    })
    
  } catch (error) {
    console.error('❌ [DEBUG] Site info status check error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}