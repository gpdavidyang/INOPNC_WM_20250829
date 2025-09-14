'use client'


const categoryIcons: Record<DocumentCategory, React.ElementType> = {
  shared: FileText,
  markup: PenTool,
  required: CheckSquare,
  invoice: Receipt,
  photo_grid: Image
}

export default function DocumentNavigation() {
  const { profile } = useUser()
  const pathname = usePathname()
  
  if (!profile) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  const accessibleCategories = getAccessibleDocumentCategories(profile.role as unknown)
  
  if (accessibleCategories.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">접근 권한 없음</h3>
          <p className="text-gray-500">문서함에 접근할 권한이 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-sm border rounded-lg">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">문서함 목록</h2>
        <p className="text-sm text-gray-500 mt-1">
          {profile.role === 'admin' || profile.role === 'system_admin' 
            ? '모든 문서함에 접근할 수 있습니다' 
            : profile.role === 'customer_manager'
            ? '자사 데이터만 접근할 수 있습니다'
            : '개인/공유 데이터에 접근할 수 있습니다'
          }
        </p>
      </div>
      
      <div className="p-4">
        <nav className="space-y-2">
          {accessibleCategories.map((category) => {
            const Icon = categoryIcons[category]
            const path = getDocumentCategoryPath(category)
            const label = getDocumentCategoryLabel(category)
            const isActive = pathname.includes(path)
            
            return (
              <Link
                key={category}
                href={path}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className="font-medium">{label}</span>
                {isActive && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </Link>
            )
          })}
        </nav>
        
        {/* 권한 설명 */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-1">접근 권한</h4>
          <div className="text-xs text-gray-600 space-y-1">
            {profile.role === 'customer_manager' && (
              <>
                <div>• 공유문서함: 자사 현장 문서만</div>
                <div>• 도면마킹: 자사 현장 도면만</div>
                <div>• 기성청구: 자사 청구서만</div>
                <div>• 사진대지: 자사 사진만</div>
              </>
            )}
            {(profile.role === 'worker' || profile.role === 'site_manager') && (
              <>
                <div>• 공유문서함: 모든 문서</div>
                <div>• 도면마킹: 모든 도면</div>
                <div>• 필수서류: 본인 서류만</div>
                <div>• 사진대지: 모든 사진</div>
              </>
            )}
            {(profile.role === 'admin' || profile.role === 'system_admin') && (
              <div>• 모든 문서함의 전체 데이터</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}