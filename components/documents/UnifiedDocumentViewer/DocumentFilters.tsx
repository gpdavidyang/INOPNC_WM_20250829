'use client'

interface DocumentFiltersProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  filters: any
  onFiltersChange: (filters: any) => void
  viewMode: 'list' | 'grid'
  onViewModeChange: (mode: 'list' | 'grid') => void
  isAdmin: boolean
}

export default function DocumentFilters({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  isAdmin
}: DocumentFiltersProps) {
  return (
    <div className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="문서 검색..."
        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      />
      <div className="flex gap-2">
        <button
          onClick={() => onViewModeChange('list')}
          className={`px-3 py-2 rounded ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}
        >
          목록
        </button>
        <button
          onClick={() => onViewModeChange('grid')}
          className={`px-3 py-2 rounded ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}
        >
          카드
        </button>
      </div>
    </div>
  )
}