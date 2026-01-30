import { useState, useEffect, useRef } from 'react'

export interface FilterState {
  search: string
  sort: 'latest' | 'name'
  monthFilter: string
  showSearchOptions: boolean
  filterSite: string
  localSearch: string
}

export const useMoneyFilters = () => {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'latest' | 'name'>('latest')
  const [monthFilter, setMonthFilter] = useState('2025-12')
  const [showSearchOptions, setShowSearchOptions] = useState(false)
  const [filterSite, setFilterSite] = useState('')
  const [localSearch, setLocalSearch] = useState('')
  const searchWrapperRef = useRef<HTMLDivElement>(null)

  // Search handlers
  const handleSearchChange = (value: string) => {
    setSearch(value)
    setFilterSite(value)
  }

  const handleSearchSelect = (siteName: string) => {
    setSearch(siteName)
    setFilterSite(siteName)
    setShowSearchOptions(false)
  }

  const handleSearchInteraction = () => {
    if (search.trim().length > 0) setShowSearchOptions(true)
  }

  // Close search options when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setShowSearchOptions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Filter handlers
  const handleSortChange = (newSort: 'latest' | 'name') => {
    setSort(newSort)
  }

  const handleMonthFilterChange = (newMonthFilter: string) => {
    setMonthFilter(newMonthFilter)
  }

  const handleFilterSiteChange = (newFilterSite: string) => {
    setFilterSite(newFilterSite)
  }

  const handleLocalSearchChange = (newLocalSearch: string) => {
    setLocalSearch(newLocalSearch)
  }

  // Reset all filters
  const resetFilters = () => {
    setSearch('')
    setFilterSite('')
    setLocalSearch('')
    setSort('latest')
    setMonthFilter('2025-12')
    setShowSearchOptions(false)
  }

  return {
    // State
    search,
    sort,
    monthFilter,
    showSearchOptions,
    filterSite,
    localSearch,
    searchWrapperRef,

    // Handlers
    setSearch,
    setSort,
    setMonthFilter,
    setShowSearchOptions,
    setFilterSite,
    setLocalSearch,

    // Complex handlers
    handleSearchChange,
    handleSearchSelect,
    handleSearchInteraction,
    handleSortChange,
    handleMonthFilterChange,
    handleFilterSiteChange,
    handleLocalSearchChange,
    resetFilters,
  }
}
