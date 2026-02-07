import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

// Storage bucket configuration
export const STORAGE_BUCKETS = {
  SITE_DOCUMENTS: 'site-documents',
} as const

// Document types
export type DocumentType = 'ptw' | 'blueprint' | 'other'

// File validation constraints
export const FILE_VALIDATION = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
  ALLOWED_EXTENSIONS: ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'],
} as const

// Validation errors
export class FileValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FileValidationError'
  }
}

// Import the comprehensive validation system

// Re-export for backward compatibility
// Removed duplicate export of FileValidationError

/**
 * Validate file before upload (using comprehensive validation)
 */
/**
 * Validate file before upload
 */
export function validateFile(file: File, documentType?: DocumentType): void {
  // Check size
  if (file.size > FILE_VALIDATION.MAX_SIZE) {
    throw new FileValidationError(
      `파일 크기는 ${(FILE_VALIDATION.MAX_SIZE / (1024 * 1024)).toFixed(0)}MB 이하여야 합니다.`
    )
  }

  // Check type
  // Allow if mime type matches OR if extension matches (fallback)
  const isMimeValid = FILE_VALIDATION.ALLOWED_MIME_TYPES.includes(file.type as any)
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  const isExtValid = FILE_VALIDATION.ALLOWED_EXTENSIONS.includes(ext)

  if (!isMimeValid && !isExtValid) {
    throw new FileValidationError(
      `지원되지 않는 파일 형식입니다. (${FILE_VALIDATION.ALLOWED_EXTENSIONS.join(', ')})`
    )
  }
}

/**
 * Generate a unique file path for storage
 * Physical storage paths (keys) should be ASCII-safe to avoid "Invalid key" errors.
 */
export function generateFilePath(
  siteId: string,
  documentType: DocumentType,
  originalFileName: string
): string {
  const timestamp = Date.now()
  // 1. Extreme normalization (NFC)
  const normalized = originalFileName.normalize('NFC')

  // 2. Extract extension safely
  const parts = normalized.split('.')
  const ext = parts.length > 1 ? parts.pop()?.toLowerCase() || 'bin' : 'bin'
  const base = parts.join('.') || 'file'

  // 3. Strict ASCII-only for the PHYSICAL KEY
  let safeBase = base
    .replace(/[^\x00-\x7F]/g, '_') // Replace all non-ASCII characters
    .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace all non-safe characters
    .replace(/_{2,}/g, '_') // Collapse multiple underscores
    .replace(/^_+|_+$/g, '') // Trim underscores

  if (!safeBase) safeBase = 'upload'

  const finalKey = `${timestamp}_${safeBase}.${ext}`
  const fullPath = `${siteId}/${documentType}/${finalKey}`

  console.log('[SUPABASE_STORAGE] Original:', originalFileName)
  console.log('[SUPABASE_STORAGE] Clean Key:', fullPath)

  return fullPath
}

/**
 * Upload a site document to Supabase Storage (Server-side)
 */
export async function uploadSiteDocument(
  file: File,
  siteId: string,
  documentType: DocumentType,
  customFileName?: string
): Promise<{
  fileName: string
  publicUrl: string
  path: string
}> {
  // Validate file
  validateFile(file)

  // Use service role client to bypass RLS policies for server-side upload
  const supabase = createServiceRoleClient()

  // ORIGINAL name (NFC) for display in the UI and Database
  // Use customFileName if provided, as it's less likely to be mangled than file.name
  const rawName = customFileName || file.name
  const displayNames = rawName.normalize('NFC')

  // Generate unique file path (Safe ASCII key for storage)
  const filePath = generateFilePath(siteId, documentType, displayNames)

  try {
    // Upload file to storage
    let { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.SITE_DOCUMENTS)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // Don't overwrite existing files
      })

    // If bucket not found, try to create it and retry upload
    if (
      uploadError &&
      (uploadError.message.includes('Bucket not found') ||
        uploadError.message.includes('not found') ||
        uploadError.message.includes('does not exist'))
    ) {
      try {
        console.log('Bucket not found, attempting to create...', STORAGE_BUCKETS.SITE_DOCUMENTS)
        await createStorageBucket()

        // Retry upload using service role
        const adminSupabase = createServiceRoleClient()
        const retryResult = await adminSupabase.storage
          .from(STORAGE_BUCKETS.SITE_DOCUMENTS)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          })

        uploadData = retryResult.data
        uploadError = retryResult.error
      } catch (createError) {
        console.error('Failed to auto-create bucket or upload:', createError)
      }
    }

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      throw new Error(`파일 업로드 실패: ${uploadError.message}`)
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKETS.SITE_DOCUMENTS).getPublicUrl(filePath)

    return {
      fileName: displayNames, // UI/DB should use the Korean name
      publicUrl,
      path: filePath,
    }
  } catch (error) {
    console.error('Upload site document error:', error)
    throw error
  }
}

/**
 * Upload a site document from browser (Client-side)
 */
export async function uploadSiteDocumentClient(
  file: File,
  siteId: string,
  documentType: DocumentType,
  customFileName?: string
): Promise<{
  fileName: string
  publicUrl: string
  path: string
}> {
  // Validate file
  validateFile(file)

  const supabase = createBrowserClient()

  // Normalize file name
  const rawName = customFileName || file.name
  const displayNames = rawName.normalize('NFC')

  // Generate unique file path
  const filePath = generateFilePath(siteId, documentType, displayNames)

  try {
    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.SITE_DOCUMENTS)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      throw new Error(`파일 업로드 실패: ${uploadError.message}`)
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKETS.SITE_DOCUMENTS).getPublicUrl(filePath)

    return {
      fileName: displayNames,
      publicUrl,
      path: filePath,
    }
  } catch (error) {
    console.error('Upload site document client error:', error)
    throw error
  }
}

/**
 * Delete a file from storage
 */
export async function deleteSiteDocumentFile(filePath: string): Promise<void> {
  const supabase = createClient()

  try {
    const { error } = await supabase.storage.from(STORAGE_BUCKETS.SITE_DOCUMENTS).remove([filePath])

    if (error) {
      console.error('Storage delete error:', error)
      throw new Error(`파일 삭제 실패: ${error.message}`)
    }
  } catch (error) {
    console.error('Delete site document file error:', error)
    throw error
  }
}

/**
 * Get file info from storage
 */
export async function getSiteDocumentInfo(filePath: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.SITE_DOCUMENTS)
      .list(filePath.split('/').slice(0, -1).join('/'), {
        search: filePath.split('/').pop(),
      })

    if (error) {
      throw new Error(`파일 정보 조회 실패: ${error.message}`)
    }

    return data?.[0] || null
  } catch (error) {
    console.error('Get site document info error:', error)
    throw error
  }
}

/**
 * List all files for a site and document type
 */
export async function listSiteDocuments(
  siteId: string,
  documentType?: DocumentType
): Promise<any[]> {
  const supabase = createClient()

  const path = documentType ? `${siteId}/${documentType}` : siteId

  try {
    const { data, error } = await supabase.storage.from(STORAGE_BUCKETS.SITE_DOCUMENTS).list(path, {
      sortBy: { column: 'created_at', order: 'desc' },
    })

    if (error) {
      throw new Error(`파일 목록 조회 실패: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('List site documents error:', error)
    throw error
  }
}

/**
 * Create storage bucket (for initial setup)
 * This should be run once during deployment
 */
export async function createStorageBucket(): Promise<void> {
  const supabase = createServiceRoleClient()

  try {
    const { data, error } = await supabase.storage.createBucket(STORAGE_BUCKETS.SITE_DOCUMENTS, {
      public: true,
      fileSizeLimit: FILE_VALIDATION.MAX_SIZE,
      allowedMimeTypes: FILE_VALIDATION.ALLOWED_MIME_TYPES,
    })

    if (error && !error.message.includes('already exists')) {
      throw new Error(`스토리지 버킷 생성 실패: ${error.message}`)
    }

    console.log('Storage bucket created successfully:', STORAGE_BUCKETS.SITE_DOCUMENTS)
  } catch (error) {
    console.error('Create storage bucket error:', error)
    throw error
  }
}

/**
 * Helper to get file URL from file path
 */
export function getFilePublicUrl(filePath: string): string {
  const supabase = createClient()

  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKETS.SITE_DOCUMENTS).getPublicUrl(filePath)

  return publicUrl
}
