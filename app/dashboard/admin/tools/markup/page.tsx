import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MarkupToolManagement from '@/components/admin/tools/MarkupToolManagement'

export default async function MarkupToolPage() {
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/auth/login')
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }
  
  return <MarkupToolManagement profile={profile} />
}