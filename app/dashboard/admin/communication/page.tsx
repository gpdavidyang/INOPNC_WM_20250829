import { getProfile } from "@/lib/auth/profile"
import CommunicationManagement from '@/components/admin/communication/CommunicationManagement'

export default async function CommunicationManagementPage() {
  const { data: profile } = await getProfile()
  
  if (!profile) {
    redirect('/auth/login')
  }
  
  // Only admin role can access admin communications
  if (profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return <CommunicationManagement profile={profile} />
}