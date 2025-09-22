// 파일 업로드 검증 유틸리티 함수들 - Enhanced Security Version

export interface FileValidationOptions {
  maxFileSize?: number // bytes
  allowedTypes?: string[]
  maxFilesPerType?: number
  enableSecurityChecks?: boolean // 보안 검사 활성화
  enableSignatureValidation?: boolean // 파일 시그니처 검증
  enableMalwareScanning?: boolean // 기본 악성코드 패턴 검사
}

export interface FileValidationError {
  code: string
  message: string
  filename?: string
  severity: 'error' | 'warning' | 'info'
}

export interface FileValidationResult {
  isValid: boolean
  errors: FileValidationError[]
  warnings: FileValidationError[]
  securityFlags: {
    hasValidSignature: boolean
    isSuspicious: boolean
    passedSecurityScan: boolean
  }
}

// 위험한 파일 확장자 목록 (실행 파일 등)
export const DANGEROUS_EXTENSIONS = [
  'exe', 'bat', 'cmd', 'com', 'scr', 'pif', 'vbs', 'js', 'jar', 'ps1',
  'sh', 'bash', 'zsh', 'fish', 'csh', 'tcsh', 'app', 'deb', 'pkg', 'dmg',
  'msi', 'run', 'ipa', 'apk', 'gadget', 'workflow', 'action', 'bin', 'elf'
]

// 의심스러운 파일명 패턴
export const SUSPICIOUS_PATTERNS = [
  /\.(exe|bat|cmd|scr|pif)$/i,
  /^\..*$/,  // 숨김 파일
  /\.(tar\.gz|tgz)$/i,  // 압축 파일 (악성 코드 은닉 가능)
  /\.(iso|img|dmg)$/i,  // 디스크 이미지
  /[<>:"|?*]/,  // 특수문자 포함
  /^\s*$|^\.+$/  // 빈 문자열 또는 점만 있는 파일명
]

// 파일 시그니처 (매직 넘버) 검증을 위한 맵
export const FILE_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
  'application/zip': [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06], [0x50, 0x4B, 0x07, 0x08]],
  'application/vnd.ms-excel': [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [[0x50, 0x4B, 0x03, 0x04]],
  'application/msword': [[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [[0x50, 0x4B, 0x03, 0x04]]
}

// 기본 설정
export const DEFAULT_FILE_VALIDATION_OPTIONS: FileValidationOptions = {
  maxFileSize: 50 * 1024 * 1024, // 50MB (공유문서함용)
  allowedTypes: [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip', 'application/x-rar-compressed'
  ],
  maxFilesPerType: 30,
  enableSecurityChecks: true,
  enableSignatureValidation: true,
  enableMalwareScanning: true
}

/**
 * 파일 시그니처(매직 넘버) 검증
 */
async function validateFileSignature(file: File): Promise<boolean> {
  const signatures = FILE_SIGNATURES[file.type]
  if (!signatures) {
    return true // 알려진 시그니처가 없는 파일 타입은 일단 통과
  }

  try {
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer.slice(0, 16)) // 첫 16바이트만 확인

    return signatures.some(signature => 
      signature.every((byte, index) => bytes[index] === byte)
    )
  } catch (error) {
    console.error('File signature validation error:', error)
    return false
  }
}

/**
 * 악성 콘텐츠 패턴 검증 (기본적인 휴리스틱)
 */
async function scanMaliciousPatterns(file: File): Promise<{ isSuspicious: boolean; warnings: string[] }> {
  const warnings: string[] = []
  let isSuspicious = false

  try {
    // 텍스트 파일에 대해서만 내용 검사
    if (file.type.startsWith('text/') || file.type === 'application/javascript') {
      const text = await file.text()
      
      // 악성 스크립트 패턴
      const maliciousPatterns = [
        /<script.*?>.*?<\/script>/i,
        /javascript:/i,
        /vbscript:/i,
        /onload\s*=/i,
        /onerror\s*=/i,
        /eval\s*\(/i,
        /document\.cookie/i,
        /window\.location/i
      ]

      for (const pattern of maliciousPatterns) {
        if (pattern.test(text)) {
          isSuspicious = true
          warnings.push('악성 스크립트 패턴이 감지되었습니다')
          break
        }
      }
    }
  } catch (error) {
    // 파일을 텍스트로 읽을 수 없는 경우는 정상적인 바이너리 파일일 수 있음
    console.debug('Could not read file as text (likely binary):', error)
  }

  return { isSuspicious, warnings }
}

/**
 * 단일 파일 검증 - Enhanced with Security Checks
 */
export async function validateFile(
  file: File,
  options: FileValidationOptions = DEFAULT_FILE_VALIDATION_OPTIONS
): Promise<FileValidationResult> {
  const errors: FileValidationError[] = []
  const warnings: FileValidationError[] = []
  const mergedOptions = { ...DEFAULT_FILE_VALIDATION_OPTIONS, ...options }
  const { maxFileSize, allowedTypes, enableSecurityChecks, enableSignatureValidation, enableMalwareScanning } = mergedOptions

  let hasValidSignature = true
  let isSuspicious = false
  let passedSecurityScan = true

  // 기본 검증
  if (maxFileSize && file.size > maxFileSize) {
    const maxSizeMB = Math.round(maxFileSize / 1024 / 1024)
    const currentSizeMB = Math.round(file.size / 1024 / 1024)
    errors.push({
      code: 'FILE_TOO_LARGE',
      message: `파일 크기가 ${maxSizeMB}MB를 초과합니다. (현재: ${currentSizeMB}MB)`,
      filename: file.name,
      severity: 'error'
    })
  }

  if (allowedTypes && !allowedTypes.includes(file.type)) {
    errors.push({
      code: 'INVALID_FILE_TYPE',
      message: `지원되지 않는 파일 형식입니다. 허용된 형식: ${allowedTypes.join(', ')}`,
      filename: file.name,
      severity: 'error'
    })
  }

  if (file.size === 0) {
    errors.push({
      code: 'EMPTY_FILE',
      message: '빈 파일은 업로드할 수 없습니다.',
      filename: file.name,
      severity: 'error'
    })
  }

  if (file.name.length > 255) {
    errors.push({
      code: 'FILENAME_TOO_LONG',
      message: '파일명이 너무 깁니다. (최대 255자)',
      filename: file.name,
      severity: 'error'
    })
  }

  // 보안 검증 (활성화된 경우만)
  if (enableSecurityChecks) {
    // 위험한 확장자 검증
    const extension = getFileExtension(file.name)
    if (DANGEROUS_EXTENSIONS.includes(extension)) {
      errors.push({
        code: 'DANGEROUS_EXTENSION',
        message: `위험한 파일 확장자입니다: .${extension}`,
        filename: file.name,
        severity: 'error'
      })
    }

    // 의심스러운 파일명 패턴 검증
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(file.name)) {
        isSuspicious = true
        warnings.push({
          code: 'SUSPICIOUS_FILENAME',
          message: '의심스러운 파일명 패턴이 감지되었습니다',
          filename: file.name,
          severity: 'warning'
        })
        break
      }
    }

    // 특수문자 검증
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/
    if (invalidChars.test(file.name)) {
      warnings.push({
        code: 'INVALID_FILENAME',
        message: '파일명에 특수문자가 포함되어 있습니다.',
        filename: file.name,
        severity: 'warning'
      })
    }

    // 연속된 점 검증
    if (file.name.includes('..')) {
      errors.push({
        code: 'PATH_TRAVERSAL_ATTEMPT',
        message: '파일명에 연속된 점(..)을 포함할 수 없습니다',
        filename: file.name,
        severity: 'error'
      })
    }
  }

  // 파일 시그니처 검증
  if (enableSignatureValidation) {
    hasValidSignature = await validateFileSignature(file)
    if (!hasValidSignature) {
      warnings.push({
        code: 'INVALID_SIGNATURE',
        message: '파일 시그니처가 예상과 다릅니다',
        filename: file.name,
        severity: 'warning'
      })
    }
  }

  // 악성코드 패턴 검증
  if (enableMalwareScanning) {
    const scanResult = await scanMaliciousPatterns(file)
    if (scanResult.isSuspicious) {
      isSuspicious = true
      passedSecurityScan = false
      errors.push({
        code: 'MALICIOUS_PATTERN_DETECTED',
        message: '악성 패턴이 감지되었습니다',
        filename: file.name,
        severity: 'error'
      })
    }
    
    scanResult.warnings.forEach(warning => {
      warnings.push({
        code: 'SECURITY_WARNING',
        message: warning,
        filename: file.name,
        severity: 'warning'
      })
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    securityFlags: {
      hasValidSignature,
      isSuspicious,
      passedSecurityScan
    }
  }
}

/**
 * 여러 파일 일괄 검증 - Enhanced with Security Checks
 */
export async function validateFiles(
  files: File[],
  options: FileValidationOptions = DEFAULT_FILE_VALIDATION_OPTIONS
): Promise<FileValidationResult> {
  const allErrors: FileValidationError[] = []
  const allWarnings: FileValidationError[] = []
  const { maxFilesPerType } = { ...DEFAULT_FILE_VALIDATION_OPTIONS, ...options }

  let allSecurityFlags = {
    hasValidSignature: true,
    isSuspicious: false,
    passedSecurityScan: true
  }

  // 파일 개수 검증
  if (maxFilesPerType && files.length > maxFilesPerType) {
    allErrors.push({
      code: 'TOO_MANY_FILES',
      message: `최대 ${maxFilesPerType}개의 파일만 업로드할 수 있습니다. (현재: ${files.length}개)`,
      severity: 'error'
    })
  }

  // 각 파일 개별 검증 (병렬 처리)
  const validationPromises = files.map(file => validateFile(file, options))
  const validationResults = await Promise.all(validationPromises)

  validationResults.forEach(result => {
    allErrors.push(...result.errors)
    allWarnings.push(...result.warnings)
    
    // 전체 보안 플래그 업데이트
    if (!result.securityFlags.hasValidSignature) {
      allSecurityFlags.hasValidSignature = false
    }
    if (result.securityFlags.isSuspicious) {
      allSecurityFlags.isSuspicious = true
    }
    if (!result.securityFlags.passedSecurityScan) {
      allSecurityFlags.passedSecurityScan = false
    }
  })

  // 중복 파일명 검증
  const filenames = files.map(f => f.name)
  const duplicates = filenames.filter((name, index) => filenames.indexOf(name) !== index)
  const uniqueDuplicates = [...new Set(duplicates)]
  
  uniqueDuplicates.forEach(filename => {
    allErrors.push({
      code: 'DUPLICATE_FILENAME',
      message: '중복된 파일명이 있습니다.',
      filename,
      severity: 'error'
    })
  })

  // 총 파일 크기 검증
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  const maxTotalSize = 500 * 1024 * 1024 // 500MB
  if (totalSize > maxTotalSize) {
    allErrors.push({
      code: 'TOTAL_SIZE_TOO_LARGE',
      message: `전체 파일 크기가 너무 큽니다 (${formatFileSize(totalSize)} > ${formatFileSize(maxTotalSize)})`,
      severity: 'error'
    })
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    securityFlags: allSecurityFlags
  }
}

/**
 * 추가 사진 특화 검증
 */
export function validateAdditionalPhotos(
  beforeFiles: File[],
  afterFiles: File[],
  existingBeforeCount: number = 0,
  existingAfterCount: number = 0
): FileValidationResult {
  const errors: FileValidationError[] = []

  // 작업전 사진 개수 검증
  if (beforeFiles.length + existingBeforeCount > 30) {
    errors.push({
      code: 'TOO_MANY_BEFORE_PHOTOS',
      message: `작업전 사진은 최대 30장까지 업로드할 수 있습니다. (현재: ${existingBeforeCount}장, 추가: ${beforeFiles.length}장)`
    })
  }

  // 작업후 사진 개수 검증
  if (afterFiles.length + existingAfterCount > 30) {
    errors.push({
      code: 'TOO_MANY_AFTER_PHOTOS',
      message: `작업후 사진은 최대 30장까지 업로드할 수 있습니다. (현재: ${existingAfterCount}장, 추가: ${afterFiles.length}장)`
    })
  }

  // 개별 파일 검증
  const beforeResult = validateFiles(beforeFiles)
  const afterResult = validateFiles(afterFiles)

  return {
    isValid: errors.length === 0 && beforeResult.isValid && afterResult.isValid,
    errors: [...errors, ...beforeResult.errors, ...afterResult.errors]
  }
}

/**
 * 파일 확장자 추출
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

/**
 * 파일 크기를 사람이 읽기 쉬운 형태로 변환
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * MIME 타입에서 파일 확장자 추정
 */
export function getMimeTypeExtension(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg', 
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'application/pdf': 'pdf'
  }
  
  return mimeMap[mimeType] || 'unknown'
}

/**
 * 안전한 파일명 생성 (특수문자 제거) - Enhanced Security
 */
export function sanitizeFilename(filename: string): string {
  // 특수문자를 언더스코어로 대체
  let sanitized = filename.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
  
  // 연속된 점 제거 (경로 탐색 방지)
  sanitized = sanitized.replace(/\.{2,}/g, '.')
  
  // 연속된 언더스코어를 하나로 통일
  sanitized = sanitized.replace(/_+/g, '_')
  
  // 앞뒤 공백, 점, 언더스코어 제거
  sanitized = sanitized.replace(/^[\s\._]+|[\s\._]+$/g, '')
  
  // 위험한 확장자 치환
  const dangerousExtPattern = new RegExp(`\\.(${DANGEROUS_EXTENSIONS.join('|')})$`, 'i')
  if (dangerousExtPattern.test(sanitized)) {
    sanitized = sanitized.replace(dangerousExtPattern, '.txt')
  }
  
  // 빈 문자열이면 기본값 반환
  return sanitized || 'unnamed_file'
}

/**
 * 업로드 제한 검증 (사용자별, 일일 제한 등)
 */
export interface UploadLimits {
  maxFilesPerDay: number
  maxTotalSizePerDay: number // bytes
  maxFilesPerUpload: number
}

export const DEFAULT_UPLOAD_LIMITS: UploadLimits = {
  maxFilesPerDay: 100,
  maxTotalSizePerDay: 1024 * 1024 * 1024, // 1GB
  maxFilesPerUpload: 10
}

export function validateUploadLimits(
  files: File[],
  currentDayStats: { fileCount: number; totalSize: number },
  limits: UploadLimits = DEFAULT_UPLOAD_LIMITS
): { isValid: boolean; error?: string } {
  // 단일 업로드 파일 수 제한
  if (files.length > limits.maxFilesPerUpload) {
    return {
      isValid: false,
      error: `한 번에 최대 ${limits.maxFilesPerUpload}개의 파일만 업로드할 수 있습니다`
    }
  }

  // 일일 파일 수 제한
  if (currentDayStats.fileCount + files.length > limits.maxFilesPerDay) {
    return {
      isValid: false,
      error: `일일 업로드 파일 수 제한을 초과했습니다 (${limits.maxFilesPerDay}개/일)`
    }
  }

  // 일일 총 용량 제한
  const uploadSize = files.reduce((sum, file) => sum + file.size, 0)
  if (currentDayStats.totalSize + uploadSize > limits.maxTotalSizePerDay) {
    const limitMB = Math.round(limits.maxTotalSizePerDay / (1024 * 1024))
    return {
      isValid: false,
      error: `일일 업로드 용량 제한을 초과했습니다 (${limitMB}MB/일)`
    }
  }

  return { isValid: true }
}

/**
 * 보안 메타데이터 생성
 */
export function generateSecurityMetadata(file: File, validationResult: FileValidationResult) {
  return {
    originalFileName: file.name,
    sanitizedFileName: sanitizeFilename(file.name),
    fileSize: file.size,
    mimeType: file.type,
    uploadTimestamp: new Date().toISOString(),
    validationErrors: validationResult.errors,
    validationWarnings: validationResult.warnings,
    securityFlags: validationResult.securityFlags,
    checksum: null, // TODO: 파일 체크섬 계산 (선택사항)
    scanTimestamp: new Date().toISOString()
  }
}

/**
 * 클라이언트 사이드 이미지 압축 (옵션)
 */
export function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // 원본 비율 유지하면서 최대 크기 계산
      let { width, height } = img
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      canvas.width = width
      canvas.height = height

      // 이미지 그리기
      ctx?.drawImage(img, 0, 0, width, height)

      // Blob으로 변환
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            reject(new Error('이미지 압축에 실패했습니다.'))
          }
        },
        file.type,
        quality
      )
    }

    img.onerror = () => reject(new Error('이미지 로드에 실패했습니다.'))
    img.src = URL.createObjectURL(file)
  })
}