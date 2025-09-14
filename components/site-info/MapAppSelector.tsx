'use client'


interface MapAppSelectorProps {
  isOpen: boolean
  onClose: () => void
  location: {
    name: string
    address: string
    latitude?: number
    longitude?: number
  }
}

export default function MapAppSelector({ isOpen, onClose, location }: MapAppSelectorProps) {
  const [selectedApp, setSelectedApp] = useState<MapAppOption['id'] | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const mapApps = getAvailableMapApps()

  const handleNavigate = async (appId: MapAppOption['id']) => {
    setSelectedApp(appId)
    setIsNavigating(true)
    
    try {
      const result = await navigateWithMapApp(appId, location)
      
      // Close modal after successful navigation
      if (result.success) {
        setTimeout(() => {
          onClose()
        }, 500)
      }
    } catch (error) {
      console.error('Navigation error:', error)
    } finally {
      setIsNavigating(false)
      setSelectedApp(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-3">
            <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            지도 앱 선택
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {location.name}
          </p>
        </div>

        {/* Map app options */}
        <div className="space-y-2">
          {mapApps.filter(app => app.available).map((app: unknown) => (
            <button
              key={app.id}
              onClick={() => handleNavigate(app.id)}
              disabled={isNavigating}
              className={`w-full p-4 rounded-lg border transition-all ${
                selectedApp === app.id && isNavigating
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                  : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              } ${isNavigating ? 'cursor-wait' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    app.id === 'tmap' ? 'bg-blue-100 dark:bg-blue-900/30' :
                    app.id === 'naver' ? 'bg-green-100 dark:bg-green-900/30' :
                    'bg-yellow-100 dark:bg-yellow-900/30'
                  }`}>
                    <span className={`text-lg font-bold ${
                      app.id === 'tmap' ? 'text-blue-600 dark:text-blue-400' :
                      app.id === 'naver' ? 'text-green-600 dark:text-green-400' :
                      'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {app.id === 'tmap' ? 'T' : app.id === 'naver' ? 'N' : 'K'}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {app.name}
                  </span>
                </div>
                {selectedApp === app.id && isNavigating && (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-500" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Info text */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
          선택한 앱이 설치되어 있지 않으면 웹 버전으로 연결됩니다.
        </p>
      </div>
    </div>
  )
}