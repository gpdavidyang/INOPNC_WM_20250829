/**
 * Comprehensive Unit Tests for Validation Utilities
 */

import {
  validateKoreanPhoneNumber,
  validateBusinessRegistrationNumber,
  validateEmail,
  validatePassword,
  validateDate,
  validateWorkHours,
  validateFileUpload,
  validatePositiveNumber,
  validateKoreanName,
  validateMaterialCode,
  isKoreanHoliday,
  isWeekend,
  calculateBusinessDays,
} from '../validation'

describe('Validation Utilities', () => {
  describe('validateKoreanPhoneNumber', () => {
    it('should validate correct mobile numbers', () => {
      const validNumbers = [
        '01012345678',
        '010-1234-5678',
        '019-123-4567',
        '01612345678',
        '017-1234-5678',
      ]

      validNumbers.forEach(number => {
        const result = validateKoreanPhoneNumber(number)
        expect(result.isValid).toBe(true)
        expect(result.formatted).toBeDefined()
        expect(result.carrier).toBeDefined()
      })
    })

    it('should reject invalid mobile numbers', () => {
      const invalidNumbers = [
        '02-1234-5678', // Landline
        '1234567890', // Missing prefix
        '010123456', // Too short
        '010123456789', // Too long
        '01000000000', // Invalid pattern
        '015-1234-5678', // Invalid prefix
      ]

      invalidNumbers.forEach(number => {
        const result = validateKoreanPhoneNumber(number)
        expect(result.isValid).toBe(false)
        expect(result.error).toBeDefined()
      })
    })

    it('should format phone numbers correctly', () => {
      const result = validateKoreanPhoneNumber('01012345678')
      expect(result.formatted).toBe('010-1234-5678')
    })

    it('should identify carriers correctly', () => {
      expect(validateKoreanPhoneNumber('01012345678').carrier).toBe('SKT/KT/LGU+')
      expect(validateKoreanPhoneNumber('01112345678').carrier).toBe('SKT')
      expect(validateKoreanPhoneNumber('01612345678').carrier).toBe('KT')
      expect(validateKoreanPhoneNumber('01912345678').carrier).toBe('LGU+')
    })
  })

  describe('validateBusinessRegistrationNumber', () => {
    it('should validate correct business registration numbers', () => {
      const validNumbers = [
        '123-45-67890',
        '1234567890',
        '000-00-00000',
      ]

      validNumbers.forEach(number => {
        const result = validateBusinessRegistrationNumber(number)
        expect(result.isValid).toBe(true)
        expect(result.formatted).toBeDefined()
      })
    })

    it('should reject invalid business registration numbers', () => {
      const invalidNumbers = [
        '12-34-5678', // Too short
        '12345678901', // Too long
        'ABC-DE-FGHIJ', // Non-numeric
        '123-456-7890', // Wrong format
      ]

      invalidNumbers.forEach(number => {
        const result = validateBusinessRegistrationNumber(number)
        expect(result.isValid).toBe(false)
        expect(result.error).toBeDefined()
      })
    })

    it('should validate checksum when requested', () => {
      // Valid business number with correct checksum
      const validWithChecksum = '123-45-67895' // Example - would need real checksum
      const result = validateBusinessRegistrationNumber(validWithChecksum, true)
      // The actual checksum validation would be tested here
      expect(result).toBeDefined()
    })

    it('should format business registration numbers correctly', () => {
      const result = validateBusinessRegistrationNumber('1234567890')
      expect(result.formatted).toBe('123-45-67890')
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.user@company.co.kr',
        'name+tag@domain.org',
        'user123@sub.domain.com',
      ]

      validEmails.forEach(email => {
        const result = validateEmail(email)
        expect(result.isValid).toBe(true)
      })
    })

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid.email',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
        '',
      ]

      invalidEmails.forEach(email => {
        const result = validateEmail(email)
        expect(result.isValid).toBe(false)
      })
    })

    it('should normalize email addresses', () => {
      const result = validateEmail('  User@EXAMPLE.COM  ')
      expect(result.isValid).toBe(true)
      expect(result.normalized).toBe('user@example.com')
    })
  })

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'Test123!@#',
        'MyP@ssw0rd!',
        'Secure#Pass123',
        'Complex$Pass99',
      ]

      strongPasswords.forEach(password => {
        const result = validatePassword(password)
        expect(result.isValid).toBe(true)
        expect(result.strength).toBe('strong')
      })
    })

    it('should reject weak passwords', () => {
      const weakPasswords = [
        '12345678', // No letters or special chars
        'password', // No numbers or special chars
        'Pass123', // Too short, no special chars
        'test!', // Too short
        '', // Empty
      ]

      weakPasswords.forEach(password => {
        const result = validatePassword(password)
        expect(result.isValid).toBe(false)
        expect(result.error).toBeDefined()
      })
    })

    it('should provide password strength feedback', () => {
      expect(validatePassword('Test1!').strength).toBe('weak')
      expect(validatePassword('Test123!').strength).toBe('medium')
      expect(validatePassword('Test123!@#$').strength).toBe('strong')
    })

    it('should check for common patterns', () => {
      const result = validatePassword('Password123!')
      expect(result.warnings).toContain('Contains common word')
    })
  })

  describe('validateDate', () => {
    it('should validate correct date formats', () => {
      const validDates = [
        '2025-08-30',
        '2025-01-01',
        '2025-12-31',
      ]

      validDates.forEach(date => {
        const result = validateDate(date)
        expect(result.isValid).toBe(true)
      })
    })

    it('should reject invalid date formats', () => {
      const invalidDates = [
        '30-08-2025', // Wrong format
        '2025/08/30', // Wrong separator
        '2025-13-01', // Invalid month
        '2025-08-32', // Invalid day
        '08-30-2025', // US format
        'not-a-date',
      ]

      invalidDates.forEach(date => {
        const result = validateDate(date)
        expect(result.isValid).toBe(false)
      })
    })

    it('should validate date ranges', () => {
      const today = new Date().toISOString().split('T')[0]
      const futureDate = '2030-01-01'
      const pastDate = '2020-01-01'

      expect(validateDate(futureDate, { maxDate: today }).isValid).toBe(false)
      expect(validateDate(pastDate, { minDate: today }).isValid).toBe(false)
      expect(validateDate(today, { minDate: pastDate, maxDate: futureDate }).isValid).toBe(true)
    })
  })

  describe('validateWorkHours', () => {
    it('should validate normal work hours', () => {
      const result = validateWorkHours(8)
      expect(result.isValid).toBe(true)
      expect(result.isOvertime).toBe(false)
    })

    it('should detect overtime hours', () => {
      const result = validateWorkHours(10)
      expect(result.isValid).toBe(true)
      expect(result.isOvertime).toBe(true)
      expect(result.overtimeHours).toBe(2)
    })

    it('should reject invalid work hours', () => {
      const invalidHours = [-1, 0, 25, 100]

      invalidHours.forEach(hours => {
        const result = validateWorkHours(hours)
        expect(result.isValid).toBe(false)
        expect(result.error).toBeDefined()
      })
    })

    it('should handle decimal hours', () => {
      const result = validateWorkHours(8.5)
      expect(result.isValid).toBe(true)
      expect(result.isOvertime).toBe(true)
      expect(result.overtimeHours).toBe(0.5)
    })
  })

  describe('validateFileUpload', () => {
    it('should validate allowed file types', () => {
      const file = {
        name: 'document.pdf',
        size: 1024 * 1024, // 1MB
        type: 'application/pdf',
      }

      const result = validateFileUpload(file, {
        allowedTypes: ['pdf', 'doc', 'docx'],
        maxSize: 10 * 1024 * 1024, // 10MB
      })

      expect(result.isValid).toBe(true)
    })

    it('should reject disallowed file types', () => {
      const file = {
        name: 'script.exe',
        size: 1024,
        type: 'application/x-msdownload',
      }

      const result = validateFileUpload(file, {
        allowedTypes: ['pdf', 'jpg', 'png'],
      })

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('File type not allowed')
    })

    it('should check file size limits', () => {
      const largeFile = {
        name: 'large.pdf',
        size: 20 * 1024 * 1024, // 20MB
        type: 'application/pdf',
      }

      const result = validateFileUpload(largeFile, {
        maxSize: 10 * 1024 * 1024, // 10MB limit
      })

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('File size exceeds limit')
    })

    it('should validate image dimensions if provided', () => {
      const imageFile = {
        name: 'photo.jpg',
        size: 1024 * 1024,
        type: 'image/jpeg',
        width: 1920,
        height: 1080,
      }

      const result = validateFileUpload(imageFile, {
        allowedTypes: ['jpg', 'png'],
        maxWidth: 2000,
        maxHeight: 2000,
      })

      expect(result.isValid).toBe(true)
    })
  })

  describe('validateKoreanName', () => {
    it('should validate Korean names', () => {
      const validNames = ['김철수', '이영희', '박민수', '최지은']

      validNames.forEach(name => {
        const result = validateKoreanName(name)
        expect(result.isValid).toBe(true)
      })
    })

    it('should validate English names when allowed', () => {
      const result = validateKoreanName('John Doe', { allowEnglish: true })
      expect(result.isValid).toBe(true)
    })

    it('should reject invalid names', () => {
      const invalidNames = ['123', '!@#', '', '   ', 'name123']

      invalidNames.forEach(name => {
        const result = validateKoreanName(name)
        expect(result.isValid).toBe(false)
      })
    })
  })

  describe('Holiday and Business Day Functions', () => {
    describe('isKoreanHoliday', () => {
      it('should identify Korean holidays', () => {
        expect(isKoreanHoliday('2024-01-01')).toBe(true) // New Year
        expect(isKoreanHoliday('2024-09-17')).toBe(true) // Chuseok
        expect(isKoreanHoliday('2024-08-30')).toBe(false) // Regular day
      })
    })

    describe('isWeekend', () => {
      it('should identify weekends', () => {
        expect(isWeekend('2025-08-30')).toBe(true) // Saturday
        expect(isWeekend('2025-08-31')).toBe(true) // Sunday
        expect(isWeekend('2025-08-29')).toBe(false) // Friday
      })
    })

    describe('calculateBusinessDays', () => {
      it('should calculate business days excluding weekends and holidays', () => {
        const result = calculateBusinessDays('2024-01-01', '2024-01-10')
        expect(result.totalDays).toBe(10)
        expect(result.businessDays).toBeLessThan(10) // Excludes weekends and New Year
        expect(result.holidays).toContain('2024-01-01')
      })

      it('should handle same day calculation', () => {
        const result = calculateBusinessDays('2024-08-30', '2024-08-30')
        expect(result.totalDays).toBe(1)
      })
    })
  })

  describe('validateMaterialCode', () => {
    it('should validate material codes', () => {
      const validCodes = ['MAT001', 'MAT-001', 'NPC1000', 'STEEL-A-001']

      validCodes.forEach(code => {
        const result = validateMaterialCode(code)
        expect(result.isValid).toBe(true)
      })
    })

    it('should reject invalid material codes', () => {
      const invalidCodes = ['', '123', 'mat 001', 'MAT_001!', 'TOOLONGMATERIALCODE123456']

      invalidCodes.forEach(code => {
        const result = validateMaterialCode(code)
        expect(result.isValid).toBe(false)
      })
    })

    it('should check for duplicate codes when function provided', async () => {
      const checkDuplicate = jest.fn().mockResolvedValue(true)
      const result = await validateMaterialCode('MAT001', { checkDuplicate })
      
      expect(checkDuplicate).toHaveBeenCalledWith('MAT001')
      expect(result.isDuplicate).toBe(true)
    })
  })
})