// Define the allowed types for filtering
export type SearchType = 'ALL' | 'SITE' | 'LOG' | 'DOC' | 'PHOTO' | 'DRAWING' | 'EXPENSE'

// Flags to determine icon activation
export interface ContentFlags {
  hasPhoto: boolean
  hasDraw: boolean
  hasDoc: boolean
}

// The flattened Record format for the Indexer
export interface SearchRecord {
  id: string
  type: SearchType
  title: string
  subtitle: string
  meta: string // Additional info like date, status
  flags: ContentFlags
  searchText: string // Normalized string for fast matching
  score?: number // Calculated during search
  timestamp: number // For "Recency" weighting
}

// For UI Component Props
export interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (id: string, type: SearchType) => void
}

// Notification Types
export type NotificationType = 'alert' | 'info' | 'success'

export interface NotificationItem {
  id: number
  type: NotificationType
  title: string
  desc: string
  time: string
  unread: boolean
}
