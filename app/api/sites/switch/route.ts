import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/sites/switch
 * Switch current site for user
 * Body: { siteId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { siteId } = body

    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        { status: 400 }
      )
    }

    // Verify the site exists and is active
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, name')
      .eq('id', siteId)
      .eq('is_active', true)
      .single()

    if (siteError || !site) {
      return NextResponse.json(
        { error: 'Site not found or inactive' },
        { status: 404 }
      )
    }

    // Start a transaction by deactivating all current assignments
    const { error: deactivateError } = await supabase
      .from('site_assignments')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (deactivateError) {
      throw deactivateError
    }

    // Check if user already has an assignment to this site
    const { data: existingAssignment } = await supabase
      .from('site_assignments')
      .select('id')
      .eq('user_id', user.id)
      .eq('site_id', siteId)
      .single()

    if (existingAssignment) {
      // Reactivate existing assignment
      const { error: reactivateError } = await supabase
        .from('site_assignments')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAssignment.id)

      if (reactivateError) {
        throw reactivateError
      }
    } else {
      // Create new assignment
      const { error: insertError } = await supabase
        .from('site_assignments')
        .insert({
          user_id: user.id,
          site_id: siteId,
          assigned_date: new Date().toISOString().split('T')[0],
          is_active: true
        })

      if (insertError) {
        throw insertError
      }
    }

    // Update user's site preferences for recent sites
    try {
      // Get current preferences
      const { data: preferences } = await supabase
        .from('site_preferences')
        .select('recent_site_ids')
        .eq('user_id', user.id)
        .single()

      let recentSites = (preferences as any)?.recent_site_ids || []
      
      // Add current site to the beginning, remove duplicates, keep max 5
      recentSites = [siteId, ...recentSites.filter((id: string) => id !== siteId)].slice(0, 5)

      // Update or insert preferences
      if (preferences) {
        await supabase
          .from('site_preferences')
          .update({
            recent_site_ids: recentSites,
            last_site_id: siteId,
            updated_at: new Date().toISOString()
          } as any)
          .eq('user_id', user.id)
      } else {
        await supabase
          .from('site_preferences')
          .insert({
            user_id: user.id,
            recent_site_ids: recentSites,
            last_site_id: siteId
          } as any)
      }
    } catch (prefError) {
      // Don't fail the request if preferences update fails
      console.error('Error updating site preferences:', prefError)
    }

    return NextResponse.json({ 
      success: true,
      data: {
        siteId: site.id,
        siteName: site.name
      }
    })
  } catch (error) {
    console.error('Error switching site:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}