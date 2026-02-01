import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

/**
 * POST /api/sites/switch
 * Switch current site for user
 * Body: { siteId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = await createClient()
    const adminSupabase = createServiceClient()

    // Parse request body
    const body = await request.json()
    const { siteId } = body

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 })
    }

    // Verify the site exists and is active
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, name')
      .eq('id', siteId)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    const now = new Date()
    const nowIso = now.toISOString()
    const today = nowIso.split('T')[0]

    // Start a transaction by deactivating all current assignments
    const { error: deactivateError } = await adminSupabase
      .from('site_assignments')
      .update({
        is_active: false,
        updated_at: nowIso,
      })
      .eq('user_id', authResult.userId)
      .eq('is_active', true)

    if (deactivateError) {
      const message = deactivateError.message?.toLowerCase() ?? ''
      if (message.includes('updated_at')) {
        const retry = await adminSupabase
          .from('site_assignments')
          .update({
            is_active: false,
          })
          .eq('user_id', authResult.userId)
          .eq('is_active', true)
        if (retry.error) {
          throw retry.error
        }
      } else {
        throw deactivateError
      }
    }

    // Check if user already has an assignment to this site
    const { data: existingAssignment, error: existingAssignmentError } = await adminSupabase
      .from('site_assignments')
      .select('id')
      .eq('user_id', authResult.userId)
      .eq('site_id', siteId)
      .eq('assigned_date', today)
      .maybeSingle()

    if (existingAssignmentError && existingAssignmentError.code !== 'PGRST116') {
      throw existingAssignmentError
    }

    const reactivateAssignment = async (assignmentId: string) => {
      const { error: reactivateError } = await adminSupabase
        .from('site_assignments')
        .update({
          is_active: true,
          updated_at: nowIso,
        })
        .eq('id', assignmentId)

      if (reactivateError) {
        if (reactivateError.message?.toLowerCase().includes('updated_at')) {
          const retry = await adminSupabase
            .from('site_assignments')
            .update({ is_active: true })
            .eq('id', assignmentId)
          if (retry.error) {
            throw retry.error
          }
        } else {
          throw reactivateError
        }
      }
    }

    if (existingAssignment) {
      await reactivateAssignment(existingAssignment.id)
    } else {
      // Create new assignment
      const { error: insertError } = await adminSupabase.from('site_assignments').insert({
        user_id: authResult.userId,
        site_id: siteId,
        assigned_date: today,
        is_active: true,
        updated_at: nowIso,
      })

      const handleUniqueViolation = async () => {
        const { data: todaysAssignment } = await adminSupabase
          .from('site_assignments')
          .select('id')
          .eq('user_id', authResult.userId)
          .eq('site_id', siteId)
          .eq('assigned_date', today)
          .maybeSingle()
        if (todaysAssignment?.id) {
          await reactivateAssignment(todaysAssignment.id)
          return true
        }
        return false
      }

      if (insertError) {
        if (insertError.code === '23505') {
          const recovered = await handleUniqueViolation()
          if (!recovered) {
            throw insertError
          }
        } else if (insertError.message?.toLowerCase().includes('updated_at')) {
          const retry = await adminSupabase.from('site_assignments').insert({
            user_id: authResult.userId,
            site_id: siteId,
            assigned_date: today,
            is_active: true,
          })
          if (retry.error) {
            if (retry.error.code === '23505') {
              const recovered = await handleUniqueViolation()
              if (!recovered) {
                throw retry.error
              }
            } else {
              throw retry.error
            }
          }
        } else {
          throw insertError
        }
      }
    }

    // Update user's site preferences for recent sites
    try {
      // Get current preferences
      const { data: preferences } = await supabase
        .from('site_preferences')
        .select('recent_site_ids')
        .eq('user_id', authResult.userId)
        .single()

      let recentSites = (preferences as unknown)?.recent_site_ids || []

      // Add current site to the beginning, remove duplicates, keep max 5
      recentSites = [siteId, ...recentSites.filter((id: string) => id !== siteId)].slice(0, 5)

      // Update or insert preferences
      if (preferences) {
        await supabase
          .from('site_preferences')
          .update({
            recent_site_ids: recentSites,
            last_site_id: siteId,
            updated_at: new Date().toISOString(),
          } as unknown)
          .eq('user_id', authResult.userId)
      } else {
        await supabase.from('site_preferences').insert({
          user_id: authResult.userId,
          recent_site_ids: recentSites,
          last_site_id: siteId,
        } as unknown)
      }
    } catch (prefError) {
      // Don't fail the request if preferences update fails
      console.error('Error updating site preferences:', prefError)
    }

    return NextResponse.json({
      success: true,
      data: {
        siteId: site.id,
        siteName: site.name,
      },
    })
  } catch (error) {
    console.error('Error switching site:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
