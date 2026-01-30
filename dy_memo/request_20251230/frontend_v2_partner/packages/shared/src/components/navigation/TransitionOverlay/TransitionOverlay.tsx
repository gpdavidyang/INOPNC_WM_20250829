import React, { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface TransitionOverlayProps {
  isTransitioning: boolean
  fromApp: string
  toApp: string
}

export const TransitionOverlay: React.FC<TransitionOverlayProps> = ({
  isTransitioning,
  fromApp,
  toApp,
}) => {
  const [progress, setProgress] = useState(0)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    if (isTransitioning) {
      setProgress(0)
      setFadeOut(false)

      // Simulate loading progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval)
            setFadeOut(true)
            return 90
          }
          return prev + 10
        })
      }, 50)

      return () => clearInterval(interval)
    }
  }, [isTransitioning])

  if (!isTransitioning) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-[#0f172a] transition-opacity duration-300 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#3b82f6] mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-[#1a254f] dark:text-white mb-2">
          {fromApp} → {toApp}
        </h2>
        <p className="text-sm text-[#64748b] dark:text-[#94a3b8] mb-4">앱을 전환하는 중입니다...</p>
        <div className="w-48 h-2 bg-[#e2e8f0] dark:bg-[#334155] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#3b82f6] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
