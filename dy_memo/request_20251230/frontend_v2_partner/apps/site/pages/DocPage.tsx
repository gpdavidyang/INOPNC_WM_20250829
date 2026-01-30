import React, { useEffect } from 'react'

export const DocPage: React.FC = () => {
  useEffect(() => {
    // 문서함 앱으로 리디렉션
    window.location.href = import.meta.env.VITE_APP_DOC_URL || 'http://localhost:3005'
  }, [])

  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-500">문서함 앱으로 이동 중...</p>
    </div>
  )
}
