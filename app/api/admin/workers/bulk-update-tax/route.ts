import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'


export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (authResult.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get the tax settings from request body
    const body = await request.json()
    const { taxSettings } = body

    if (!taxSettings) {
      return NextResponse.json(
        { error: 'Tax settings are required' },
        { status: 400 }
      )
    }

    // Use service role client to bypass RLS
    const serviceClient = createServiceRoleClient()
    
    // Update all workers based on their salary type
    const updatePromises = []
    
    for (const salaryType of Object.keys(taxSettings)) {
      const settings = taxSettings[salaryType]
      
      const updatePromise = serviceClient
        .from('profiles')
        .update({
          tax_rate: settings.tax_rate,
          national_pension_rate: settings.national_pension_rate,
          health_insurance_rate: settings.health_insurance_rate,
          employment_insurance_rate: settings.employment_insurance_rate,
          long_term_care_rate: settings.long_term_care_rate,
          updated_at: new Date().toISOString()
        })
        .eq('salary_type', salaryType)
        .select()
      
      updatePromises.push(updatePromise)
    }

    const results = await Promise.all(updatePromises)
    
    // Check for errors
    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
      console.error('Errors updating tax settings:', errors)
      return NextResponse.json(
        { error: 'Failed to update some tax settings' },
        { status: 500 }
      )
    }

    // Count total updated records
    const totalUpdated = results.reduce((sum, r) => sum + (r.data?.length || 0), 0)

    return NextResponse.json({ 
      success: true, 
      updatedCount: totalUpdated,
      message: `Successfully updated tax settings for ${totalUpdated} workers`
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
