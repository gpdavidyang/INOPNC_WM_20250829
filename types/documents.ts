// Document-specific type definitions


export interface DocumentFile {
  id: string
  title: string
  description?: string | null
  file_url: string
  file_name: string
  file_size?: number | null
  mime_type?: string | null
  document_type?: DocumentType | null
  folder_path?: string | null
  owner_id?: string | null
  is_public?: boolean | null
  site_id?: string | null
  created_at: string
  updated_at: string
  owner?: {
    full_name: string
  }
  site?: {
    name: string
  }
}

export interface DocumentFolder {
  name: string
  path: string
  count: number
  size: number
  lastModified?: string
}

export interface DocumentFilter {
  search: string
  type: DocumentType | 'all'
  folder: string
  sortBy: 'name' | 'date' | 'size'
  sortOrder: 'asc' | 'desc'
}

export interface DocumentUploadData {
  title: string
  description?: string
  file: File
  document_type: DocumentType
  folder_path?: string
  is_public?: boolean
  site_id?: string
}

export interface DocumentCategoryInfo {
  id: string
  parent_id?: string | null
  category_name: string
  category_code?: string | null
  icon?: string | null
  sort_order?: number | null
  is_system?: boolean | null
  created_at: string
}

export interface DocumentAccessPermission {
  user_id: string
  document_id: string
  can_view: boolean
  can_download: boolean
  can_edit: boolean
  can_delete: boolean
}