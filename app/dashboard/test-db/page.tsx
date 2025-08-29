import { createClient } from '@/lib/supabase/server'

export default async function TestDatabasePage() {
  const supabase = createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  // Test sites table
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('*')
    .limit(5)
    
  // Test site_assignments table
  const { data: assignments, error: assignmentsError } = await supabase
    .from('site_assignments')
    .select('*')
    .limit(10)
    
  // Test database function
  let functionResult = null
  let functionError = null
  
  if (user) {
    const { data, error } = await supabase
      .rpc('get_current_user_site' as any, { user_uuid: user.id })
    functionResult = data
    functionError = error
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Database Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-2">Current User</h2>
          <pre className="text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto">
            {JSON.stringify({ user: user?.id, email: user?.email, authError }, null, 2)}
          </pre>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-2">Sites Table</h2>
          <pre className="text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto">
            {JSON.stringify({ data: sites, error: sitesError }, null, 2)}
          </pre>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-2">Site Assignments</h2>
          <pre className="text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto">
            {JSON.stringify({ data: assignments, error: assignmentsError }, null, 2)}
          </pre>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-2">Database Function Result</h2>
          <pre className="text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto">
            {JSON.stringify({ data: functionResult, error: functionError }, null, 2)}
          </pre>
        </div>
      </div>
      
      {user && assignments && assignments.length === 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
          <h2 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-2">
            No Site Assignments Found
          </h2>
          <p className="text-orange-700 dark:text-orange-300">
            User {user.email} has no site assignments. This explains why both site info pages show &quot;no assigned site&quot;.
          </p>
          <p className="text-orange-700 dark:text-orange-300 mt-2">
            The auto-assignment logic in the server action should create an assignment automatically.
          </p>
        </div>
      )}
    </div>
  )
}