'use client'


export default function TestPhotoGridPage() {
  const [results, setResults] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const showResult = (message: string) => {
    setResults(message)
  }

  const testGET = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/photo-grids?t=' + Date.now(), {
        cache: 'no-cache'
      })
      const text = await response.text()
      showResult(`GET Response (${response.status}):\n${text}`)
    } catch (error) {
      showResult('GET Error: ' + (error as Error).message)
    }
    setLoading(false)
  }

  const testPOST = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/photo-grids?t=' + Date.now(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ test: 'data' }),
        cache: 'no-cache'
      })
      const text = await response.text()
      showResult(`POST Response (${response.status}):\n${text}`)
    } catch (error) {
      showResult('POST Error: ' + (error as Error).message)
    }
    setLoading(false)
  }

  const testPOSTFormData = async () => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('site_id', 'test')
      formData.append('component_name', 'test')
      formData.append('work_process', 'test')
      formData.append('work_section', 'test')
      formData.append('work_date', '2024-01-01')
      
      const response = await fetch('/api/photo-grids?t=' + Date.now(), {
        method: 'POST',
        body: formData,
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const text = await response.text()
      showResult(`POST FormData Response (${response.status}):\n${text}`)
    } catch (error) {
      showResult('POST FormData Error: ' + (error as Error).message)
    }
    setLoading(false)
  }

  const clearCache = () => {
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name)
        })
        showResult('Cache cleared! Reloading page...')
        setTimeout(() => {
          location.reload()
        }, 1000)
      })
    } else {
      location.reload()
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Photo Grid API Test - Cache Bypass</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>Testing POST endpoint with cache bypass</p>
            
            <div className="flex gap-2 flex-wrap">
              <Button onClick={testGET} disabled={loading}>
                Test GET /api/photo-grids
              </Button>
              <Button onClick={testPOST} disabled={loading}>
                Test POST (JSON)
              </Button>
              <Button onClick={testPOSTFormData} disabled={loading}>
                Test POST (FormData)
              </Button>
              <Button onClick={clearCache} variant="destructive" disabled={loading}>
                Clear Cache & Reload
              </Button>
            </div>

            {results && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {results}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}