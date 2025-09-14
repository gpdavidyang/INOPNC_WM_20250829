
export const dynamic = 'force-dynamic'

export default async function DebugUserPage() {
  const supabase = createClient()
  
  // Get current user info
  const { data: { user }, error } = await supabase.auth.getUser()
  
  // Get current site assignment
  const currentSiteResult = await getCurrentUserSite()

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Debug User ID Issue</h1>
      
      <div className="grid gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-2">Current Web App User</h2>
          <div className="space-y-2">
            <p><strong>User ID:</strong> {user?.id || 'Not logged in'}</p>
            <p><strong>Email:</strong> {user?.email || 'Not logged in'}</p>
            <p><strong>Last Sign In:</strong> {user?.last_sign_in_at || 'Never'}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-2">Current Site Assignment</h2>
          <pre className="text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto">
            {JSON.stringify(currentSiteResult, null, 2)}
          </pre>
        </div>

        <DebugUserClient />
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
          Instructions to Fix
        </h2>
        <div className="text-yellow-700 dark:text-yellow-300 space-y-2">
          <p>1. Copy the User ID above: <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">{user?.id}</code></p>
          <p>2. Go to Supabase SQL Editor</p>
          <p>3. Run the debug queries in debug_user_ids.sql</p>
          <p>4. Use fix_user_assignment.sql to assign this user to the site</p>
          <p>5. Or click the &quot;Force Assign&quot; button below (if available)</p>
        </div>
      </div>
    </div>
  )
}