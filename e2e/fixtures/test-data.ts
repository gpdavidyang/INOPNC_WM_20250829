/**
 * Test data for E2E tests
 */

export const testUsers = {
  admin: {
    email: 'admin@inopnc.com',
    password: 'Test123!@#',
    fullName: 'Admin User',
    role: 'admin',
  },
  siteManager: {
    email: 'manager@inopnc.com',
    password: 'Test123!@#',
    fullName: 'Site Manager',
    role: 'site_manager',
  },
  worker: {
    email: 'worker@inopnc.com',
    password: 'Test123!@#',
    fullName: 'Worker User',
    role: 'worker',
  },
  customer: {
    email: 'customer@customer.com',
    password: 'Test123!@#',
    fullName: 'Customer Manager',
    role: 'customer_manager',
  },
  newUser: {
    email: `test.user.${Date.now()}@example.com`,
    password: 'NewUser123!@#',
    fullName: 'New Test User',
    phone: '010-1234-5678',
    role: 'worker',
  },
}

export const testSites = {
  mainSite: {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'INOPNC Main Site',
    code: 'SITE001',
    address: '서울시 강남구 테헤란로 123',
  },
  secondarySite: {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'INOPNC Secondary Site',
    code: 'SITE002',
    address: '서울시 서초구 서초대로 456',
  },
}

export const testDailyReport = {
  workDate: new Date().toISOString().split('T')[0],
  memberName: 'Test Worker',
  processType: 'construction',
  totalWorkers: 10,
  npc1000Incoming: 100,
  npc1000Used: 50,
  npc1000Remaining: 50,
  workContent: 'Today we completed foundation work on section A. All concrete pouring was finished successfully.',
  issues: 'No major issues encountered during work.',
  tomorrowPlan: 'Continue with foundation work on section B.',
  photos: [] as string[],
}

export const testMaterial = {
  code: 'MAT-TEST-001',
  name: 'Test Concrete Mix',
  unit: 'm³',
  category: 'Building Materials',
  specification: 'C30/37 Concrete Mix',
  manufacturer: 'Test Manufacturer Co.',
  minStockLevel: 50,
  maxStockLevel: 500,
  unitPrice: 150000,
}

export const testAttendance = {
  checkInTime: '08:00',
  checkOutTime: '17:00',
  workHours: 8,
  overtimeHours: 0,
  location: 'Main Site',
  notes: 'Regular work day',
}

export const testDocument = {
  name: 'test-document.pdf',
  category: 'drawing',
  description: 'Test architectural drawing',
  size: 1024 * 1024, // 1MB
}

export const testNotification = {
  title: 'Test Notification',
  message: 'This is a test notification message',
  type: 'info',
}

// Helper function to generate unique email
export function generateUniqueEmail(prefix: string = 'test'): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `${prefix}.${timestamp}.${random}@test.com`
}

// Helper function to generate Korean phone number
export function generateKoreanPhone(): string {
  const middle = Math.floor(Math.random() * 9000) + 1000
  const last = Math.floor(Math.random() * 9000) + 1000
  return `010-${middle}-${last}`
}

// Helper function to get today's date in YYYY-MM-DD format
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

// Helper function to get future date
export function getFutureDate(daysAhead: number = 7): string {
  const date = new Date()
  date.setDate(date.getDate() + daysAhead)
  return date.toISOString().split('T')[0]
}

// Helper function to get past date
export function getPastDate(daysBefore: number = 7): string {
  const date = new Date()
  date.setDate(date.getDate() - daysBefore)
  return date.toISOString().split('T')[0]
}