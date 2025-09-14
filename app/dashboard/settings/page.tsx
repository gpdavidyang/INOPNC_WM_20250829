import { createClient } from "@/lib/supabase/server"
import { SettingsPageWrapper } from './settings-page-wrapper'

export default async function SettingsPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/dashboard')
  }

  return <SettingsPageWrapper user={user} profile={profile as any} />
}