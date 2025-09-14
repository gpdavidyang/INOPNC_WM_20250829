
import { createClient } from "@/lib/supabase/server"
import SignupRequestsClient from './signup-requests-client'

export const dynamic = "force-dynamic"

export default async function SignupRequestsPage() {
  const supabase = createClient()
  
  // Check authentication and admin permissions
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/auth/login')
  }

  // Get user profile and check admin permissions
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || !['admin', 'system_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  // Fetch signup requests from database
  const { data: signupRequests, error: requestsError } = await supabase
    .from('signup_requests')
    .select(`
      *,
      approved_by_profile:approved_by(full_name),
      rejected_by_profile:rejected_by(full_name)
    `)
    .order('requested_at', { ascending: false })

  if (requestsError) {
    console.error('Error fetching signup requests:', requestsError)
  }

  return (
    <div className="space-y-6">
    <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          가입 요청 관리
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          새로운 회원가입 요청을 검토하고 승인/거절할 수 있습니다.
        </p>
    </div>

      <SignupRequestsClient 
        requests={signupRequests || []} 
        currentUser={profile}
      />
    </div>
  )
}
