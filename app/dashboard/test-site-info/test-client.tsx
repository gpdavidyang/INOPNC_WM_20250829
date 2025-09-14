import { getCurrentUserSite } from "@/app/actions/site-info"
'use client'


interface TestSiteInfoClientProps {
  initialCurrentSite: unknown
  initialHistory: unknown
}

export default function TestSiteInfoClient({ initialCurrentSite, initialHistory }: TestSiteInfoClientProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')

  const handleForceAssign = async () => {
    setLoading(true)
    setResult('Assigning user to test site...')
    
    try {
      const assignResult = await forceAssignCurrentUserToTestSite()
      console.log('Force assign result:', assignResult)
      
      if (assignResult.success) {
        setResult('✅ Successfully assigned to test site! Refreshing data...')
        
        // Test getting current site again
        const currentSiteResult = await getCurrentUserSite()
        console.log('Updated current site result:', currentSiteResult)
        
        if (currentSiteResult.success && currentSiteResult.data) {
          setResult(`✅ Assignment successful! Current site: ${currentSiteResult.data.site_name}`)
        } else {
          setResult(`⚠️ Assignment created but still no data returned: ${currentSiteResult.error || 'Unknown error'}`)
        }
      } else {
        setResult(`❌ Assignment failed: ${assignResult.error}`)
      }
    } catch (error) {
      console.error('Error in force assign:', error)
      setResult(`❌ Assignment error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshData = async () => {
    setLoading(true)
    setResult('Refreshing current site data...')
    
    try {
      const currentSiteResult = await getCurrentUserSite()
      console.log('Refresh result:', currentSiteResult)
      
      if (currentSiteResult.success && currentSiteResult.data) {
        setResult(`✅ Data refreshed! Current site: ${currentSiteResult.data.site_name}`)
      } else {
        setResult(`❌ Still no data: ${currentSiteResult.error || 'No assigned site'}`)
      }
    } catch (error) {
      console.error('Error refreshing data:', error)
      setResult(`❌ Refresh error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4">Test Actions</h2>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={handleForceAssign}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
          >
            {loading ? 'Processing...' : 'Force Assign to Test Site'}
          </button>
          
          <button
            onClick={handleRefreshData}
            disabled={loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
          >
            {loading ? 'Processing...' : 'Refresh Site Data'}
          </button>
        </div>
        
        {result && (
          <div className="bg-white dark:bg-gray-800 p-3 rounded border">
            <p className="text-sm font-mono">{result}</p>
          </div>
        )}
        
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p><strong>Initial Status:</strong></p>
          <p>Current Site: {initialCurrentSite.success && initialCurrentSite.data ? initialCurrentSite.data.site_name : 'No site assigned'}</p>
          <p>History Count: {initialHistory.success ? initialHistory.data?.length || 0 : 'Error loading'}</p>
        </div>
      </div>
    </div>
  )
}