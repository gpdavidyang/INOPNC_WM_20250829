import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PhotoGridToolManagement from '@/components/admin/tools/PhotoGridToolManagement'

export default async function PhotoGridToolPage() {
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
  
  return <PhotoGridToolManagement profile={profile} />
}