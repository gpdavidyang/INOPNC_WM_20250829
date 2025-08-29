'use server'

interface ValidationResult {
  isValid: boolean
  error?: string
  [key: string]: any
}

// Korean holidays for 2024 (would normally be fetched from a service)
const KOREAN_HOLIDAYS_2024 = {
  '2024-01-01': '신정',
  '2024-02-09': '설날 연휴',
  '2024-02-10': '설날',
  '2024-02-11': '설날 연휴',
  '2024-03-01': '삼일절',
  '2024-05-05': '어린이날',
  '2024-05-15': '부처님오신날',
  '2024-06-06': '현충일',
  '2024-08-15': '광복절',
  '2024-09-16': '추석 연휴',
  '2024-09-17': '추석',
  '2024-09-18': '추석 연휴',
  '2024-10-03': '개천절',
  '2024-10-09': '한글날',
  '2024-12-25': '크리스마스'
}

export function validateKoreanPhoneNumber(phoneNumber: string): ValidationResult {
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '')
  
  // Check if it matches Korean mobile number pattern
  const mobilePattern = /^01[016789]\d{7,8}$/
  
  if (!mobilePattern.test(cleaned)) {
    return {
      isValid: false,
      error: 'Invalid Korean mobile phone number format'
    }
  }
  
  // Additional validation checks
  if (cleaned.length !== 10 && cleaned.length !== 11) {
    return {
      isValid: false,
      error: 'Invalid phone number length'
    }
  }
  
  // Check for invalid patterns
  if (cleaned.includes('0000') || cleaned === '01000000000') {
    return {
      isValid: false,
      error: 'Invalid phone number pattern'
    }
  }
  
  // Format the number
  const formatted = cleaned.length === 10
    ? cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
    : cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
  
  return {
    isValid: true,
    formatted,
    carrier: getCarrier(cleaned.substring(0, 3))
  }
}

function getCarrier(prefix: string): string {
  const carriers: Record<string, string> = {
    '010': 'SKT/KT/LGU+',
    '011': 'SKT',
    '016': 'KT',
    '017': 'SKT',
    '018': 'KT',
    '019': 'LGU+'
  }
  return carriers[prefix] || 'Unknown'
}

export function validateBusinessRegistrationNumber(
  number: string,
  checkChecksum: boolean = false
): ValidationResult {
  // Remove hyphens
  const cleaned = number.replace(/-/g, '')
  
  // Check basic format
  if (!/^\d{10}$/.test(cleaned)) {
    return {
      isValid: false,
      error: 'Business registration number must be 10 digits'
    }
  }
  
  const formatted = cleaned.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3')
  
  if (!checkChecksum) {
    return {
      isValid: true,
      formatted
    }
  }
  
  // Validate checksum using the official algorithm
  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5]
  let sum = 0
  
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * weights[i]
  }
  
  sum += Math.floor(parseInt(cleaned[8]) * 5 / 10)
  const checkDigit = (10 - (sum % 10)) % 10
  
  const isValid = checkDigit === parseInt(cleaned[9])
  
  return {
    isValid,
    formatted,
    checksumValid: isValid,
    error: isValid ? undefined : 'Invalid checksum'
  }
}

export function validateDateTimeWithKST(dateTimeString: string): ValidationResult {
  try {
    const date = new Date(dateTimeString)
    
    if (isNaN(date.getTime())) {
      return {
        isValid: false,
        error: 'Invalid date format'
      }
    }
    
    // Check if already has timezone info
    let kstTime: Date
    if (dateTimeString.includes('+09:00') || dateTimeString.includes('T') && dateTimeString.endsWith('Z')) {
      // If it's already in KST or UTC, use it directly
      kstTime = new Date(date)
      if (dateTimeString.endsWith('Z')) {
        // Convert UTC to KST
        kstTime = new Date(date.getTime() + (9 * 60 * 60 * 1000))
      }
    } else {
      // Convert to KST (UTC+9)
      const kstOffset = 9 * 60 // 9 hours in minutes
      const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000)
      kstTime = new Date(utcTime + (kstOffset * 60000))
    }
    
    // Format as ISO string with KST timezone
    const year = kstTime.getFullYear()
    const month = String(kstTime.getMonth() + 1).padStart(2, '0')
    const day = String(kstTime.getDate()).padStart(2, '0')
    const hours = String(kstTime.getHours()).padStart(2, '0')
    const minutes = String(kstTime.getMinutes()).padStart(2, '0')
    const seconds = String(kstTime.getSeconds()).padStart(2, '0')
    const ms = String(kstTime.getMilliseconds()).padStart(3, '0')
    
    const kstISOString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}+09:00`
    
    // Check if it's a working hour (8 AM - 6 PM KST)
    const kstHour = kstTime.getHours()
    const isWorkingHour = kstHour >= 8 && kstHour < 18
    
    // Check if it's a Korean holiday
    const dateKey = kstTime.toISOString().split('T')[0]
    const isHoliday = dateKey in KOREAN_HOLIDAYS_2024
    const holidayName = KOREAN_HOLIDAYS_2024[dateKey as keyof typeof KOREAN_HOLIDAYS_2024]
    
    // Check if it's a weekend
    const dayOfWeek = kstTime.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    return {
      isValid: true,
      kstDateTime: kstISOString,
      utcDateTime: date.toISOString(),
      isWorkingHour,
      isHoliday,
      holidayName,
      isWeekend,
      isWorkday: !isWeekend && !isHoliday
    }
  } catch (error) {
    return {
      isValid: false,
      error: 'Date parsing error'
    }
  }
}

export function validateLaborHours(laborHours: number): ValidationResult {
  // Labor hours must be positive
  if (laborHours <= 0) {
    return {
      isValid: false,
      error: 'Labor hours must be positive'
    }
  }
  
  // Must be a multiple of 0.25 (2 hours)
  if (laborHours % 0.25 !== 0) {
    return {
      isValid: false,
      error: 'Labor hours must be in increments of 0.25 (2 hours)'
    }
  }
  
  // Maximum 2.0 공수 (16 hours) per day
  if (laborHours > 2.0) {
    return {
      isValid: false,
      error: 'Labor hours cannot exceed 2.0 (16 hours) per day'
    }
  }
  
  const hours = laborHours * 8
  const hasOvertime = laborHours > 1.0
  const overtimeHours = hasOvertime ? (laborHours - 1.0) * 8 : 0
  
  const descriptions: Record<number, string> = {
    0.25: '2시간 근무',
    0.5: '반일 근무 (4시간)',
    0.75: '6시간 근무',
    1.0: '정규 근무 (8시간)',
    1.25: '정규 + 연장 2시간 (10시간)',
    1.5: '연장 근무 포함 (12시간)',
    1.75: '정규 + 연장 6시간 (14시간)',
    2.0: '16시간 근무'
  }
  
  return {
    isValid: true,
    hours,
    laborHours,
    hasOvertime,
    overtimeHours,
    description: descriptions[laborHours] || `${hours}시간 근무`
  }
}

export function validateWorkerSchedule(
  schedule: {
    workerId: string
    siteId: string
    date: string
    startTime: string
    endTime: string
  },
  existingSchedules: Array<{
    workerId: string
    siteId: string
    date: string
    startTime: string
    endTime: string
  }>
): ValidationResult {
  // Check for conflicts with existing schedules
  const conflicts = existingSchedules.filter(existing => {
    if (existing.workerId !== schedule.workerId) return false
    if (existing.date !== schedule.date) return false
    if (existing.siteId === schedule.siteId) return false // Same site is OK
    
    // Check time overlap
    const newStart = parseInt(schedule.startTime.replace(':', ''))
    const newEnd = parseInt(schedule.endTime.replace(':', ''))
    const existingStart = parseInt(existing.startTime.replace(':', ''))
    const existingEnd = parseInt(existing.endTime.replace(':', ''))
    
    return (newStart < existingEnd && newEnd > existingStart)
  })
  
  if (conflicts.length > 0) {
    return {
      isValid: false,
      error: 'Worker cannot be at multiple sites simultaneously',
      conflict: conflicts[0]
    }
  }
  
  return {
    isValid: true
  }
}

export function validateSiteLocation(location: {
  address: string
  latitude?: number
  longitude?: number
}): ValidationResult {
  // Validate Korean address format
  const koreanRegions = [
    '서울특별시', '부산광역시', '대구광역시', '인천광역시',
    '광주광역시', '대전광역시', '울산광역시', '세종특별자치시',
    '경기도', '강원도', '충청북도', '충청남도',
    '전라북도', '전라남도', '경상북도', '경상남도',
    '제주특별자치도'
  ]
  
  const hasValidRegion = koreanRegions.some(region => 
    location.address.includes(region)
  )
  
  if (!hasValidRegion) {
    return {
      isValid: false,
      error: 'Address must include a valid Korean region'
    }
  }
  
  let isInKorea = true
  
  // Validate coordinates if provided
  if (location.latitude !== undefined && location.longitude !== undefined) {
    // Korea's approximate boundaries
    const koreaLat = { min: 33.0, max: 38.6 }
    const koreaLng = { min: 124.5, max: 131.9 }
    
    isInKorea = location.latitude >= koreaLat.min &&
                location.latitude <= koreaLat.max &&
                location.longitude >= koreaLng.min &&
                location.longitude <= koreaLng.max
  }
  
  // Extract region from address
  const region = koreanRegions.find(r => location.address.includes(r))
  
  return {
    isValid: hasValidRegion && (location.latitude === undefined || isInKorea),
    isInKorea,
    region,
    coordinates: {
      latitude: location.latitude,
      longitude: location.longitude
    }
  }
}

export function validateDocumentMetadata(metadata: {
  title: string
  description?: string
  fileType: string
  fileSize: number
}): ValidationResult {
  // Check for Korean text
  const koreanPattern = /[\u3131-\uD79D]/
  const hasKoreanText = koreanPattern.test(metadata.title) || 
                       (metadata.description ? koreanPattern.test(metadata.description) : false)
  
  // Validate file size (max 100MB)
  const maxSize = 100 * 1024 * 1024
  if (metadata.fileSize > maxSize) {
    return {
      isValid: false,
      error: 'File size exceeds 100MB limit',
      maxSizeMB: 100
    }
  }
  
  // Validate allowed file types
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/zip'
  ]
  
  const fileTypeAllowed = allowedTypes.includes(metadata.fileType)
  
  if (!fileTypeAllowed) {
    return {
      isValid: false,
      error: 'File type not allowed',
      fileTypeAllowed: false,
      allowedTypes
    }
  }
  
  return {
    isValid: true,
    hasKoreanText,
    fileTypeAllowed,
    fileSizeMB: metadata.fileSize / (1024 * 1024)
  }
}

export function validateUserPermissions(
  user: {
    role: string
    assigned_sites?: string[]
  },
  resource: string,
  action: string,
  context?: {
    siteId?: string
  }
): ValidationResult {
  // Define permission matrix
  const permissions: Record<string, Record<string, string[]>> = {
    worker: {
      daily_report: ['create', 'read', 'update'],
      attendance: ['create', 'read'],
      document: ['read', 'upload']
    },
    site_manager: {
      daily_report: ['create', 'read', 'update', 'approve'],
      attendance: ['create', 'read', 'update', 'approve'],
      document: ['create', 'read', 'update', 'delete'],
      worker: ['read', 'assign'],
      site: ['read', 'update']
    },
    customer_manager: {
      daily_report: ['read'],
      document: ['read'],
      site: ['read']
    },
    admin: {
      daily_report: ['create', 'read', 'update', 'delete', 'approve'],
      attendance: ['create', 'read', 'update', 'delete', 'approve'],
      document: ['create', 'read', 'update', 'delete'],
      worker: ['create', 'read', 'update', 'delete'],
      site: ['create', 'read', 'update', 'delete'],
      user: ['create', 'read', 'update', 'delete']
    },
    system_admin: {
      '*': ['*'] // Full access
    }
  }
  
  // Check system admin first
  if (user.role === 'system_admin') {
    return {
      isValid: true,
      hasPermission: true
    }
  }
  
  // Check role permissions
  const rolePermissions = permissions[user.role]
  if (!rolePermissions) {
    return {
      isValid: false,
      hasPermission: false,
      reason: 'Invalid role'
    }
  }
  
  const resourcePermissions = rolePermissions[resource] || []
  const hasPermission = resourcePermissions.includes(action)
  
  if (!hasPermission) {
    return {
      isValid: true,
      hasPermission: false,
      reason: 'Action not allowed for role'
    }
  }
  
  // Check site-based permissions for site managers
  if (user.role === 'site_manager' && context?.siteId) {
    if (!user.assigned_sites || !user.assigned_sites.includes(context.siteId)) {
      return {
        isValid: true,
        hasPermission: false,
        reason: 'No site access'
      }
    }
  }
  
  return {
    isValid: true,
    hasPermission: true
  }
}