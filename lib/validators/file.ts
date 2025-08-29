/**
 * File validation utilities for document uploads
 * Provides comprehensive file validation including size, type, content, and security checks
 */

import { SiteDocumentType } from '@/types'

// File validation constants
export const FILE_VALIDATION_CONFIG = {
  // Maximum file size (10MB)
  MAX_SIZE: 10 * 1024 * 1024,
  
  // Minimum file size (1KB to prevent empty files)
  MIN_SIZE: 1024,
  
  // Allowed MIME types
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ] as const,
  
  // Allowed file extensions
  ALLOWED_EXTENSIONS: [
    'pdf',
    'jpg', 
    'jpeg',
    'png',
    'gif',
    'webp'
  ] as const,
  
  // Maximum filename length
  MAX_FILENAME_LENGTH: 255,
  
  // Dangerous patterns to block
  DANGEROUS_PATTERNS: [
    '.exe', '.bat', '.sh', '.ps1', '.cmd', '.scr', '.vbs',
    '.js', '.jar', '.app', '.deb', '.dmg', '.pkg', '.msi',
    '..', './', '../', '\\', '<script', 'javascript:', 'data:'
  ] as const,
  
  // Document type specific validations
  DOCUMENT_TYPE_RULES: {
    ptw: {
      preferredTypes: ['application/pdf'] as const,
      maxSize: 5 * 1024 * 1024, // 5MB for PTW documents
      description: 'PTW 작업허가서'
    },
    blueprint: {
      preferredTypes: ['image/jpeg', 'image/png', 'application/pdf'] as const,
      maxSize: 10 * 1024 * 1024, // 10MB for blueprints
      description: '공사도면'
    },
    other: {
      preferredTypes: ['application/pdf', 'image/jpeg', 'image/png'] as const,
      maxSize: 10 * 1024 * 1024, // 10MB for other documents
      description: '기타 문서'
    }
  } as const
} as const

// Custom validation error class
export class FileValidationError extends Error {
  public readonly code: string
  public readonly field: string

  constructor(message: string, code: string = 'VALIDATION_ERROR', field: string = 'file') {
    super(message)
    this.name = 'FileValidationError'
    this.code = code
    this.field = field
  }
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean
  errors: FileValidationError[]
  warnings: string[]
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, documentType?: SiteDocumentType): void {
  // Check minimum size
  if (file.size < FILE_VALIDATION_CONFIG.MIN_SIZE) {
    throw new FileValidationError(
      '파일이 너무 작습니다. (최소 1KB)',
      'FILE_TOO_SMALL',
      'size'
    )
  }

  // Check maximum size based on document type
  const maxSize = documentType 
    ? FILE_VALIDATION_CONFIG.DOCUMENT_TYPE_RULES[documentType].maxSize
    : FILE_VALIDATION_CONFIG.MAX_SIZE

  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024))
    throw new FileValidationError(
      `파일 크기는 ${maxSizeMB}MB를 초과할 수 없습니다. (현재: ${formatFileSize(file.size)})`,
      'FILE_TOO_LARGE',
      'size'
    )
  }
}

/**
 * Validate file type and extension
 */
export function validateFileType(file: File, documentType?: SiteDocumentType): void {
  // Check MIME type
  if (!FILE_VALIDATION_CONFIG.ALLOWED_MIME_TYPES.includes(file.type as any)) {
    throw new FileValidationError(
      `지원하지 않는 파일 형식입니다. (${file.type})\n허용된 형식: PDF, JPG, PNG, GIF, WebP`,
      'INVALID_MIME_TYPE',
      'type'
    )
  }

  // Check file extension
  const extension = getFileExtension(file.name)
  if (!extension || !FILE_VALIDATION_CONFIG.ALLOWED_EXTENSIONS.includes(extension as any)) {
    throw new FileValidationError(
      `허용되지 않는 파일 확장자입니다. (.${extension})\n허용된 확장자: ${FILE_VALIDATION_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`,
      'INVALID_EXTENSION',
      'extension'
    )
  }

  // Cross-check MIME type and extension
  const expectedMimeTypes = getExpectedMimeTypes(extension)
  if (!expectedMimeTypes.includes(file.type)) {
    throw new FileValidationError(
      `파일 확장자(.${extension})와 파일 형식(${file.type})이 일치하지 않습니다.`,
      'MIME_EXTENSION_MISMATCH',
      'type'
    )
  }

  // Document type specific validation
  if (documentType) {
    const rules = FILE_VALIDATION_CONFIG.DOCUMENT_TYPE_RULES[documentType]
    if (!rules.preferredTypes.includes(file.type as any)) {
      throw new FileValidationError(
        `${rules.description}은(는) ${rules.preferredTypes.join(', ')} 형식만 허용됩니다.`,
        'DOCUMENT_TYPE_MISMATCH',
        'type'
      )
    }
  }
}

/**
 * Validate filename for security
 */
export function validateFileName(fileName: string): void {
  // Check filename length
  if (fileName.length > FILE_VALIDATION_CONFIG.MAX_FILENAME_LENGTH) {
    throw new FileValidationError(
      `파일명이 너무 깁니다. (최대 ${FILE_VALIDATION_CONFIG.MAX_FILENAME_LENGTH}자)`,
      'FILENAME_TOO_LONG',
      'filename'
    )
  }

  // Check for empty filename
  if (!fileName.trim()) {
    throw new FileValidationError(
      '파일명이 비어있습니다.',
      'EMPTY_FILENAME',
      'filename'
    )
  }

  // Check for dangerous patterns
  const lowerFileName = fileName.toLowerCase()
  for (const pattern of FILE_VALIDATION_CONFIG.DANGEROUS_PATTERNS) {
    if (lowerFileName.includes(pattern.toLowerCase())) {
      throw new FileValidationError(
        '보안상 허용되지 않는 파일명입니다.',
        'DANGEROUS_FILENAME',
        'filename'
      )
    }
  }

  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/
  if (invalidChars.test(fileName)) {
    throw new FileValidationError(
      '파일명에 허용되지 않는 문자가 포함되어 있습니다.',
      'INVALID_FILENAME_CHARS',
      'filename'
    )
  }

  // Check for reserved names (Windows)
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i
  if (reservedNames.test(fileName)) {
    throw new FileValidationError(
      '시스템 예약어는 파일명으로 사용할 수 없습니다.',
      'RESERVED_FILENAME',
      'filename'
    )
  }
}

/**
 * Comprehensive file validation function
 */
export function validateFile(file: File, documentType?: SiteDocumentType): ValidationResult {
  const errors: FileValidationError[] = []
  const warnings: string[] = []

  try {
    // Validate filename
    validateFileName(file.name)
  } catch (error) {
    if (error instanceof FileValidationError) {
      errors.push(error)
    }
  }

  try {
    // Validate file size
    validateFileSize(file, documentType)
  } catch (error) {
    if (error instanceof FileValidationError) {
      errors.push(error)
    }
  }

  try {
    // Validate file type
    validateFileType(file, documentType)
  } catch (error) {
    if (error instanceof FileValidationError) {
      errors.push(error)
    }
  }

  // Add warnings for large files
  const maxRecommendedSize = documentType === 'ptw' ? 2 * 1024 * 1024 : 5 * 1024 * 1024
  if (file.size > maxRecommendedSize) {
    warnings.push(`파일 크기가 큽니다. (${formatFileSize(file.size)}) 업로드 시간이 오래 걸릴 수 있습니다.`)
  }

  // Add warnings for non-optimal formats
  if (documentType === 'ptw' && file.type !== 'application/pdf') {
    warnings.push('PTW 문서는 PDF 형식을 권장합니다.')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Simplified validation function that throws on first error
 */
export function validateFileStrict(file: File, documentType?: SiteDocumentType): void {
  const result = validateFile(file, documentType)
  
  if (!result.isValid) {
    throw result.errors[0]
  }
}

/**
 * Utility functions
 */

export function getFileExtension(fileName: string): string | null {
  const parts = fileName.toLowerCase().split('.')
  return parts.length > 1 ? parts[parts.length - 1] : null
}

export function getExpectedMimeTypes(extension: string): string[] {
  const mimeTypeMap: Record<string, string[]> = {
    'pdf': ['application/pdf'],
    'jpg': ['image/jpeg'],
    'jpeg': ['image/jpeg'],
    'png': ['image/png'],
    'gif': ['image/gif'],
    'webp': ['image/webp']
  }
  
  return mimeTypeMap[extension.toLowerCase()] || []
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf'
}

/**
 * Get human-readable validation summary
 */
export function getValidationSummary(result: ValidationResult): string {
  if (result.isValid) {
    const summary = ['✅ 파일 검증 완료']
    if (result.warnings.length > 0) {
      summary.push(...result.warnings.map(w => `⚠️ ${w}`))
    }
    return summary.join('\n')
  }
  
  return result.errors.map(error => `❌ ${error.message}`).join('\n')
}

/**
 * Batch validate multiple files
 */
export function validateFiles(
  files: File[], 
  documentType?: SiteDocumentType
): { validFiles: File[], invalidFiles: Array<{ file: File, errors: FileValidationError[] }> } {
  const validFiles: File[] = []
  const invalidFiles: Array<{ file: File, errors: FileValidationError[] }> = []
  
  for (const file of files) {
    const result = validateFile(file, documentType)
    if (result.isValid) {
      validFiles.push(file)
    } else {
      invalidFiles.push({ file, errors: result.errors })
    }
  }
  
  return { validFiles, invalidFiles }
}