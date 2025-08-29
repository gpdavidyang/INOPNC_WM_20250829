// Jest is globally available, no need to import
import {
  validateKoreanPhoneNumber,
  validateBusinessRegistrationNumber,
  validateDateTimeWithKST,
  validateWorkerSchedule,
  validateLaborHours,
  validateSiteLocation,
  validateDocumentMetadata,
  validateUserPermissions
} from '../validation'

describe('Korean-Specific Data Validation', () => {
  describe('Korean Phone Number Validation', () => {
    it('should validate correct Korean mobile phone numbers', () => {
      const validNumbers = [
        '010-1234-5678',
        '010-9999-8888',
        '011-123-4567',
        '016-789-1234',
        '017-456-7890',
        '018-111-2222',
        '019-555-6666',
        '01012345678', // Without hyphens
        '010 1234 5678', // With spaces
      ]
      
      validNumbers.forEach(number => {
        const result = validateKoreanPhoneNumber(number)
        expect(result.isValid).toBe(true)
        expect(result.formatted).toBe(number.replace(/[\s-]/g, '').replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3'))
        expect(result.carrier).toBeDefined()
      })
    })

    it('should reject invalid Korean phone numbers', () => {
      const invalidNumbers = [
        '02-1234-5678', // Landline
        '070-1234-5678', // VoIP
        '010-123-456', // Too short
        '010-12345-6789', // Wrong format
        '020-1234-5678', // Invalid prefix
        '010-0000-0000', // Invalid pattern
        '+82-10-1234-5678', // International format not accepted
        '010.1234.5678', // Wrong separator
      ]
      
      invalidNumbers.forEach(number => {
        expect(validateKoreanPhoneNumber(number).isValid).toBe(false)
      })
    })

    it('should handle special mobile prefixes correctly', () => {
      const specialPrefixes = ['010', '011', '016', '017', '018', '019']
      
      specialPrefixes.forEach(prefix => {
        const number = `${prefix}-1234-5678`
        const result = validateKoreanPhoneNumber(number)
        expect(result.isValid).toBe(true)
        expect(result.formatted).toBe(number)
      })
    })
  })

  describe('Business Registration Number Validation', () => {
    it('should validate correct business registration numbers', () => {
      const validNumbers = [
        '123-45-67890', // Standard format
        '1234567890', // Without hyphens
        '987-65-43210',
        '111-22-33344',
      ]
      
      // Note: These are format checks only, not checksum validation
      validNumbers.forEach(number => {
        const result = validateBusinessRegistrationNumber(number)
        expect(result.isValid).toBe(true)
        expect(result.formatted).toMatch(/^\d{3}-\d{2}-\d{5}$/)
      })
    })

    it('should validate business registration number checksum', () => {
      // Real Korean business registration numbers with valid checksums
      const validNumbersWithChecksum = [
        '220-81-62517', // Samsung Electronics
        '104-81-53114', // LG Electronics
        '106-81-51510', // SK Telecom
      ]
      
      validNumbersWithChecksum.forEach(number => {
        const result = validateBusinessRegistrationNumber(number, true)
        expect(result.isValid).toBe(true)
        expect(result.checksumValid).toBe(true)
      })
    })

    it('should reject invalid business registration numbers', () => {
      const invalidNumbers = [
        '12-345-67890', // Wrong format
        '1234-56-7890', // Wrong format
        '123-456-7890', // Wrong format
        '123-45-6789', // Too short
        '123-45-678901', // Too long
        'ABC-DE-FGHIJ', // Non-numeric
      ]
      
      invalidNumbers.forEach(number => {
        expect(validateBusinessRegistrationNumber(number).isValid).toBe(false)
      })
    })

    it('should detect invalid checksums', () => {
      const invalidChecksumNumbers = [
        '123-45-67890', // Invalid checksum
        '999-99-99999', // Invalid checksum
      ]
      
      invalidChecksumNumbers.forEach(number => {
        const result = validateBusinessRegistrationNumber(number, true)
        expect(result.isValid).toBe(false)
        expect(result.checksumValid).toBe(false)
      })
    })
  })

  describe('Date/Time with KST Timezone Handling', () => {
    it('should validate and convert dates to KST', () => {
      const testCases = [
        {
          input: '2024-01-01T00:00:00Z',
          expectedKST: '2024-01-01T09:00:00+09:00',
          isValid: true
        },
        {
          input: '2024-06-15T15:30:00Z',
          expectedKST: '2024-06-16T00:30:00+09:00',
          isValid: true
        },
        {
          input: '2024-12-31T15:00:00Z',
          expectedKST: '2025-01-01T00:00:00+09:00',
          isValid: true
        }
      ]
      
      testCases.forEach(({ input, expectedKST, isValid }) => {
        const result = validateDateTimeWithKST(input)
        expect(result.isValid).toBe(isValid)
        // Compare without milliseconds for simplicity
        const resultWithoutMs = result.kstDateTime.replace(/\.\d{3}/, '')
        const expectedWithoutMs = expectedKST.replace(/\.\d{3}/, '')
        expect(resultWithoutMs).toBe(expectedWithoutMs)
      })
    })

    it('should handle daylight saving time transitions correctly', () => {
      // Korea doesn't observe DST, so KST is always UTC+9
      const dstDates = [
        '2024-03-10T02:00:00Z', // US DST starts
        '2024-11-03T02:00:00Z', // US DST ends
      ]
      
      dstDates.forEach(date => {
        const result = validateDateTimeWithKST(date)
        expect(result.isValid).toBe(true)
        // Should always be +9 hours from UTC
        const utcHour = parseInt(date.substring(11, 13))
        const expectedKSTHour = (utcHour + 9) % 24
        const hourStr = expectedKSTHour.toString().padStart(2, '0')
        expect(result.kstDateTime.substring(11, 13)).toBe(hourStr)
      })
    })

    it('should validate working hours in KST', () => {
      const workingHourTests = [
        {
          kstTime: '2024-01-01T08:00:00+09:00',
          isWorkingHour: true
        },
        {
          kstTime: '2024-01-01T18:00:00+09:00',
          isWorkingHour: true
        },
        {
          kstTime: '2024-01-01T22:00:00+09:00',
          isWorkingHour: false
        },
        {
          kstTime: '2024-01-01T06:00:00+09:00',
          isWorkingHour: false
        }
      ]
      
      workingHourTests.forEach(({ kstTime, isWorkingHour }) => {
        const result = validateDateTimeWithKST(kstTime)
        expect(result.isWorkingHour).toBe(isWorkingHour)
      })
    })

    it('should identify Korean public holidays', () => {
      const holidays = [
        { date: '2024-01-01', name: '신정', isHoliday: true },
        { date: '2024-02-09', name: '설날 연휴', isHoliday: true },
        { date: '2024-02-10', name: '설날', isHoliday: true },
        { date: '2024-02-11', name: '설날 연휴', isHoliday: true },
        { date: '2024-03-01', name: '삼일절', isHoliday: true },
        { date: '2024-05-05', name: '어린이날', isHoliday: true },
        { date: '2024-06-06', name: '현충일', isHoliday: true },
        { date: '2024-08-15', name: '광복절', isHoliday: true },
        { date: '2024-09-16', name: '추석 연휴', isHoliday: true },
        { date: '2024-09-17', name: '추석', isHoliday: true },
        { date: '2024-09-18', name: '추석 연휴', isHoliday: true },
        { date: '2024-10-03', name: '개천절', isHoliday: true },
        { date: '2024-10-09', name: '한글날', isHoliday: true },
        { date: '2024-12-25', name: '크리스마스', isHoliday: true }
      ]
      
      holidays.forEach(({ date, name, isHoliday }) => {
        const result = validateDateTimeWithKST(`${date}T09:00:00+09:00`)
        expect(result.isHoliday).toBe(isHoliday)
        if (isHoliday) {
          expect(result.holidayName).toBe(name)
        }
      })
    })
  })

  describe('Labor Hours (공수) Validation', () => {
    it('should validate standard labor hours values', () => {
      const validLaborHours = [
        { value: 1.0, description: '정규 근무 (8시간)' },
        { value: 0.5, description: '반일 근무 (4시간)' },
        { value: 0.25, description: '2시간 근무' },
        { value: 1.5, description: '연장 근무 포함 (12시간)' },
        { value: 2.0, description: '16시간 근무' },
      ]
      
      validLaborHours.forEach(({ value, description }) => {
        const result = validateLaborHours(value)
        expect(result.isValid).toBe(true)
        expect(result.hours).toBe(value * 8)
        expect(result.description).toContain(description)
      })
    })

    it('should reject invalid labor hours values', () => {
      const invalidLaborHours = [
        -1.0, // Negative
        0, // Zero
        0.1, // Not a multiple of 0.25
        0.3, // Not a multiple of 0.25
        2.5, // Exceeds maximum
        3.0, // Way over maximum
      ]
      
      invalidLaborHours.forEach(value => {
        const result = validateLaborHours(value)
        expect(result.isValid).toBe(false)
      })
    })

    it('should calculate overtime correctly', () => {
      const overtimeTests = [
        { laborHours: 1.0, hasOvertime: false, overtimeHours: 0 },
        { laborHours: 1.25, hasOvertime: true, overtimeHours: 2 },
        { laborHours: 1.5, hasOvertime: true, overtimeHours: 4 },
        { laborHours: 2.0, hasOvertime: true, overtimeHours: 8 },
      ]
      
      overtimeTests.forEach(({ laborHours, hasOvertime, overtimeHours }) => {
        const result = validateLaborHours(laborHours)
        expect(result.hasOvertime).toBe(hasOvertime)
        expect(result.overtimeHours).toBe(overtimeHours)
      })
    })
  })

  describe('Worker Schedule Validation', () => {
    it('should prevent worker from being at multiple sites simultaneously', () => {
      const schedules = [
        {
          workerId: 'worker-1',
          siteId: 'site-1',
          date: '2024-01-01',
          startTime: '08:00',
          endTime: '17:00'
        },
        {
          workerId: 'worker-1',
          siteId: 'site-2',
          date: '2024-01-01',
          startTime: '14:00',
          endTime: '18:00'
        }
      ]
      
      const result = validateWorkerSchedule(schedules[1], [schedules[0]])
      expect(result.isValid).toBe(false)
      expect(result.conflict).toBeDefined()
      expect(result.conflict?.siteId).toBe('site-1')
    })

    it('should allow worker at different sites on different days', () => {
      const schedules = [
        {
          workerId: 'worker-1',
          siteId: 'site-1',
          date: '2024-01-01',
          startTime: '08:00',
          endTime: '17:00'
        },
        {
          workerId: 'worker-1',
          siteId: 'site-2',
          date: '2024-01-02',
          startTime: '08:00',
          endTime: '17:00'
        }
      ]
      
      const result = validateWorkerSchedule(schedules[1], [schedules[0]])
      expect(result.isValid).toBe(true)
      expect(result.conflict).toBeUndefined()
    })

    it('should allow worker at different sites with non-overlapping times', () => {
      const schedules = [
        {
          workerId: 'worker-1',
          siteId: 'site-1',
          date: '2024-01-01',
          startTime: '08:00',
          endTime: '12:00'
        },
        {
          workerId: 'worker-1',
          siteId: 'site-2',
          date: '2024-01-01',
          startTime: '13:00',
          endTime: '17:00'
        }
      ]
      
      const result = validateWorkerSchedule(schedules[1], [schedules[0]])
      expect(result.isValid).toBe(true)
      expect(result.conflict).toBeUndefined()
    })
  })

  describe('Site Location Validation', () => {
    it('should validate Korean addresses', () => {
      const validAddresses = [
        '서울특별시 강남구 테헤란로 123',
        '경기도 성남시 분당구 판교역로 235',
        '부산광역시 해운대구 센텀중앙로 97',
        '제주특별자치도 제주시 첨단로 242',
        '세종특별자치시 한누리대로 2130'
      ]
      
      validAddresses.forEach(address => {
        const result = validateSiteLocation({ address, latitude: 37.5665, longitude: 126.9780 })
        expect(result.isValid).toBe(true)
        expect(result.region).toBeDefined()
      })
    })

    it('should validate GPS coordinates for Korea', () => {
      const koreanCoordinates = [
        { lat: 37.5665, lng: 126.9780, city: '서울' }, // Seoul
        { lat: 35.1796, lng: 129.0756, city: '부산' }, // Busan
        { lat: 35.8714, lng: 128.6014, city: '대구' }, // Daegu
        { lat: 37.4563, lng: 126.7052, city: '인천' }, // Incheon
        { lat: 33.4996, lng: 126.5312, city: '제주' }, // Jeju
      ]
      
      koreanCoordinates.forEach(({ lat, lng, city }) => {
        const result = validateSiteLocation({ 
          address: `${city}시 테스트구 테스트로 123`,
          latitude: lat,
          longitude: lng 
        })
        expect(result.isValid).toBe(true)
        expect(result.isInKorea).toBe(true)
      })
    })

    it('should reject coordinates outside Korea', () => {
      const foreignCoordinates = [
        { lat: 35.6762, lng: 139.6503 }, // Tokyo
        { lat: 39.9042, lng: 116.4074 }, // Beijing
        { lat: 40.7128, lng: -74.0060 }, // New York
      ]
      
      foreignCoordinates.forEach(({ lat, lng }) => {
        const result = validateSiteLocation({ 
          address: 'Foreign Address',
          latitude: lat,
          longitude: lng 
        })
        expect(result.isInKorea).toBe(false)
      })
    })
  })

  describe('Document Metadata Validation', () => {
    it('should validate document metadata with Korean text', () => {
      const documents = [
        {
          title: '건설현장 안전관리 지침서',
          description: '2024년도 건설현장 안전관리 종합 지침',
          fileType: 'application/pdf',
          fileSize: 1024 * 1024 * 5, // 5MB
        },
        {
          title: '작업일지_2024년1월',
          description: 'Test Site January Work Log Collection',
          fileType: 'application/vnd.ms-excel',
          fileSize: 1024 * 1024 * 2, // 2MB
        }
      ]
      
      documents.forEach(doc => {
        const result = validateDocumentMetadata(doc)
        expect(result.isValid).toBe(true)
        expect(result.hasKoreanText).toBe(true)
      })
    })

    it('should enforce file size limits', () => {
      const oversizedDoc = {
        title: '대용량 파일',
        description: '파일 크기 초과',
        fileType: 'application/pdf',
        fileSize: 1024 * 1024 * 101, // 101MB (over 100MB limit)
      }
      
      const result = validateDocumentMetadata(oversizedDoc)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('size')
    })

    it('should validate allowed file types', () => {
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
      
      allowedTypes.forEach(fileType => {
        const result = validateDocumentMetadata({
          title: 'Test Document',
          fileType,
          fileSize: 1024 * 1024
        })
        expect(result.isValid).toBe(true)
        expect(result.fileTypeAllowed).toBe(true)
      })
    })

    it('should reject disallowed file types', () => {
      const disallowedTypes = [
        'application/x-executable',
        'application/x-sh',
        'text/html',
        'application/javascript'
      ]
      
      disallowedTypes.forEach(fileType => {
        const result = validateDocumentMetadata({
          title: 'Test Document',
          fileType,
          fileSize: 1024 * 1024
        })
        expect(result.isValid).toBe(false)
        expect(result.fileTypeAllowed).toBe(false)
      })
    })
  })

  describe('User Permission Validation', () => {
    it('should validate role-based permissions correctly', () => {
      const permissionTests = [
        {
          user: { role: 'worker' },
          resource: 'daily_report',
          action: 'create',
          expected: true
        },
        {
          user: { role: 'worker' },
          resource: 'daily_report',
          action: 'approve',
          expected: false
        },
        {
          user: { role: 'site_manager' },
          resource: 'daily_report',
          action: 'approve',
          expected: true
        },
        {
          user: { role: 'admin' },
          resource: 'site',
          action: 'delete',
          expected: true
        },
        {
          user: { role: 'customer_manager' },
          resource: 'worker',
          action: 'create',
          expected: false
        }
      ]
      
      permissionTests.forEach(({ user, resource, action, expected }) => {
        const result = validateUserPermissions(user, resource, action)
        expect(result.hasPermission).toBe(expected)
      })
    })

    it('should validate site-based permissions', () => {
      const user = {
        role: 'site_manager',
        assigned_sites: ['site-1', 'site-2']
      }
      
      // Should have access to assigned sites
      const result1 = validateUserPermissions(user, 'daily_report', 'approve', { siteId: 'site-1' })
      expect(result1.hasPermission).toBe(true)
      
      // Should not have access to unassigned sites
      const result2 = validateUserPermissions(user, 'daily_report', 'approve', { siteId: 'site-3' })
      expect(result2.hasPermission).toBe(false)
      expect(result2.reason).toContain('site access')
    })
  })
})