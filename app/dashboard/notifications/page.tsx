import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { NotificationsPageWrapper } from '@/components/notifications/notifications-page-wrapper'

export const metadata: Metadata = {
  title: '알림 | INOPNC 작업일지 관리',
  description: '시스템 알림 및 메시지 확인',
}

export default async function NotificationsRoute() {
  const supabase = createClient()
  
  // Get authenticated user
  const user = await getAuthenticatedUser()
  
  if (!user) {
    console.error('No user in notifications page - middleware should have caught this')
    redirect('/auth/login')
  }

  // Get user profile with role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Profile fetch error:', profileError)
  }

  // If profile doesn't exist, create a basic one
  if (!profile) {
    console.log('Creating profile for user:', user.id)
    
    // Determine role based on email
    let role = 'worker'
    if (user.email?.endsWith('@inopnc.com')) {
      if (user.email === 'admin@inopnc.com') role = 'admin'
      else if (user.email === 'manager@inopnc.com') role = 'site_manager'
    } else if (user.email === 'customer@inopnc.com') {
      role = 'customer_manager'
    } else if (user.email === 'davidswyang@gmail.com') {
      role = 'system_admin'
    }

    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        role: role,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create profile:', insertError)
      redirect('/auth/login')
    }

    return <NotificationsPageWrapper user={user} profile={newProfile} />
  }

  return <NotificationsPageWrapper user={user} profile={profile} />
}