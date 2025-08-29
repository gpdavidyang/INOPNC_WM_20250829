import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EquipmentManagement } from '@/components/equipment/equipment-management'

export const metadata: Metadata = {
  title: '장비 & 자원 관리',
  description: '장비 현황, 반출/반납, 정비 관리'
}

export default async function EquipmentPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    redirect('/auth/login')
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <EquipmentManagement currentUser={profile} />
    </div>
  )
}