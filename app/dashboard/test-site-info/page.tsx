import { getCurrentUserSite } from "@/app/actions/site-info"

export default async function TestSiteInfoPage() {
  console.log('TestSiteInfoPage: Loading...')
  
  // Test server actions directly
  const [currentSiteResult, historyResult] = await Promise.all([
    getCurrentUserSite(),
    getUserSiteHistory()
  ])

  console.log('TestSiteInfoPage: Current site result:', currentSiteResult)
  console.log('TestSiteInfoPage: History result:', historyResult)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Site Info Test Page</h1>
      
      <TestSiteInfoClient 
        initialCurrentSite={currentSiteResult}
        initialHistory={historyResult}
      />
      
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-2">Current Site Result</h2>
          <pre className="text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto">
            {JSON.stringify(currentSiteResult, null, 2)}
          </pre>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-2">History Result</h2>
          <pre className="text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto">
            {JSON.stringify(historyResult, null, 2)}
          </pre>
        </div>
        
        {currentSiteResult.success && currentSiteResult.data && (
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <h2 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
              Current Site: {currentSiteResult.data.site_name}
            </h2>
            <p className="text-green-700 dark:text-green-300">
              Address: {currentSiteResult.data.site_address}
            </p>
            <p className="text-green-700 dark:text-green-300">
              Work Process: {currentSiteResult.data.work_process}
            </p>
            <p className="text-green-700 dark:text-green-300">
              Work Section: {currentSiteResult.data.work_section}
            </p>
          </div>
        )}
        
        {(!currentSiteResult.success || !currentSiteResult.data) && (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              No Site Assignment
            </h2>
            <p className="text-red-700 dark:text-red-300">
              {currentSiteResult.success ? 'User has no assigned site' : `Error: ${currentSiteResult.error}`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}