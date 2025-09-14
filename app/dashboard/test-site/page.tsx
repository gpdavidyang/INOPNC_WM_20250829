
export default async function TestSitePage() {
  const supabase = createClient()
  
  let userInfo = null
  let sitesData = null
  let assignmentsData = null
  let error = null

  try {
    // Test user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) throw new Error('Auth error: ' + authError.message)
    
    userInfo = {
      id: user?.id,
      email: user?.email,
      authenticated: !!user
    }

    // Test sites table access
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name, address, status')
      .limit(5)
    
    if (sitesError) throw new Error('Sites error: ' + sitesError.message)
    sitesData = sites

    // Test site_assignments table access
    const { data: assignments, error: assignmentsError } = await supabase
      .from('site_assignments')
      .select('id, site_id, user_id, assigned_date, is_active')
      .limit(5)
    
    if (assignmentsError) throw new Error('Assignments error: ' + assignmentsError.message)
    assignmentsData = assignments

  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error'
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Site Data Test</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-2">User Info</h2>
        <pre className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
          {JSON.stringify(userInfo, null, 2)}
        </pre>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-2">Sites Data</h2>
        <pre className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
          {JSON.stringify(sitesData, null, 2)}
        </pre>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-2">Assignments Data</h2>
        <pre className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
          {JSON.stringify(assignmentsData, null, 2)}
        </pre>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2 text-red-700 dark:text-red-300">Error</h2>
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}