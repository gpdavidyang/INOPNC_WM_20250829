import PhotoGridReportsManagement from '@/components/admin/PhotoGridReportsManagement'

export default async function AdminPhotoGridReportsPage() {
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
  
  return (
    <PhotoGridReportsManagement profile={profile} />
  )
}