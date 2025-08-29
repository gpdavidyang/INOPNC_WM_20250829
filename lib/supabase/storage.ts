'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'

// Storage bucket configuration
export const STORAGE_BUCKETS = {
  SITE_DOCUMENTS: 'site-documents'
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
    'image/webp'
  ],
  ALLOWED_EXTENSIONS: ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp']
} as const

// Validation errors
export class FileValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FileValidationError'
  }
}

// Import the comprehensive validation system
import { validateFileStrict, FileValidationError as ValidationError } from '@/lib/validators/file'

// Re-export for backward compatibility
export { FileValidationError } from '@/lib/validators/file'

/**
 * Validate file before upload (using comprehensive validation)
 */
export function validateFile(file: File, documentType?: DocumentType): void {
  try {
    validateFileStrict(file, documentType)
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new FileValidationError(error.message)
    }
    throw error
  }
}

/**
 * Generate a unique file path for storage
 */
export function generateFilePath(
  siteId: string,
  documentType: DocumentType,
  originalFileName: string
): string {
  const timestamp = Date.now()
  const fileExtension = originalFileName.split('.').pop()
  const sanitizedFileName = originalFileName
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
    .substring(0, 100) // Limit length
  
  return `${siteId}/${documentType}/${timestamp}_${sanitizedFileName}`
}

/**
 * Upload a site document to Supabase Storage (Server-side)
 */
export async function uploadSiteDocument(
  file: File,
  siteId: string,
  documentType: DocumentType
): Promise<{
  fileName: string
  publicUrl: string
  path: string
}> {
  // Validate file
  validateFile(file)
  
  const supabase = createClient()
  
  // Generate unique file path
  const filePath = generateFilePath(siteId, documentType, file.name)
  
  try {
    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.SITE_DOCUMENTS)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false // Don't overwrite existing files
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      throw new Error(`파일 업로드 실패: ${uploadError.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKETS.SITE_DOCUMENTS)
      .getPublicUrl(filePath)

    return {
      fileName: file.name,
      publicUrl,
      path: filePath
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
  documentType: DocumentType
): Promise<{
  fileName: string
  publicUrl: string
  path: string
}> {
  // Validate file
  validateFile(file)
  
  const supabase = createBrowserClient()
  
  // Generate unique file path
  const filePath = generateFilePath(siteId, documentType, file.name)
  
  try {
    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.SITE_DOCUMENTS)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      throw new Error(`파일 업로드 실패: ${uploadError.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKETS.SITE_DOCUMENTS)
      .getPublicUrl(filePath)

    return {
      fileName: file.name,
      publicUrl,
      path: filePath
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
    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS.SITE_DOCUMENTS)
      .remove([filePath])
      
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
        search: filePath.split('/').pop()
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
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.SITE_DOCUMENTS)
      .list(path, {
        sortBy: { column: 'created_at', order: 'desc' }
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
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.storage
      .createBucket(STORAGE_BUCKETS.SITE_DOCUMENTS, {
        public: true,
        fileSizeLimit: FILE_VALIDATION.MAX_SIZE,
        allowedMimeTypes: FILE_VALIDATION.ALLOWED_MIME_TYPES
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
  
  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKETS.SITE_DOCUMENTS)
    .getPublicUrl(filePath)
    
  return publicUrl
}