'use client'


export default function DebugUserClient() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<unknown>(null)

  const handleForceAssign = async () => {
    setIsLoading(true)
    try {
      const result = await forceAssignCurrentUserToTestSite()
      setResult(result)
      
      if (result.success) {
        // Refresh the page to see updated data
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } catch (error) {
      setResult({ success: false, error: 'Failed to force assign' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
      <h2 className="text-lg font-semibold mb-4">Force Assignment Tool</h2>
      
      <div className="space-y-4">
        <Button 
          onClick={handleForceAssign}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Assigning...' : 'Force Assign Current User to 강남 A현장'}
        </Button>

        {result && (
          <div className={`p-3 rounded border ${
            result.success 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <h3 className="font-semibold mb-2">
              {result.success ? 'Success!' : 'Error'}
            </h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
            {result.success && (
              <p className="mt-2 text-sm">Page will refresh in 2 seconds...</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}