let idCounter = 0

const nextId = (prefix: string) => `${prefix}-${++idCounter}`
const pastDate = () => new Date('2024-01-01T00:00:00Z').toISOString()
const recentDate = () => new Date('2024-02-01T00:00:00Z').toISOString()
const futureDate = () => new Date('2025-01-01T00:00:00Z').toISOString()
const sample = <T,>(values: readonly T[]): T => values[0]
const words = (count: number) => Array.from({ length: count }, (_, idx) => `word${idx + 1}`).join(' ')
const sentence = () => 'Sample sentence for test data.'
const paragraph = () => 'Sample paragraph describing mock data for tests.'
const email = () => `${nextId('user')}@example.com`
const phone = () => '010-0000-0000'

/**
 * Create a mock daily report for testing
 */
export function createMockDailyReport(overrides = {}) {
  return {
    id: nextId('daily-report'),
    site_id: nextId('site'),
    user_id: nextId('user'),
    date: recentDate(),
    weather: sample(['sunny', 'cloudy', 'rainy', 'snowy']),
    temperature: 20,
    work_content: paragraph(),
    safety_notes: sentence(),
    worker_count: 10,
    equipment_used: words(3),
    materials_used: words(3),
    progress_percentage: 60,
    issues: sentence(),
    tomorrow_plan: sentence(),
    status: 'draft',
    created_at: pastDate(),
    updated_at: recentDate(),
    ...overrides,
  }
}

/**
 * Create a mock site for testing
 */
export function createMockSite(overrides = {}) {
  return {
    id: nextId('site'),
    name: 'Sample Construction Site',
    code: nextId('SITE').toUpperCase(),
    address: '123 Sample Street',
    city: 'Seoul',
    state: 'Seoul',
    zip: '04540',
    country: 'South Korea',
    latitude: 37.5665,
    longitude: 126.978,
    start_date: pastDate(),
    end_date: futureDate(),
    status: 'active',
    project_manager: 'Sample Manager',
    contact_phone: phone(),
    contact_email: email(),
    created_at: pastDate(),
    updated_at: recentDate(),
    ...overrides,
  }
}

/**
 * Create a mock user for testing
 */
export function createMockUser(overrides = {}) {
  return {
    id: nextId('user'),
    email: email(),
    full_name: 'Sample User',
    role: sample(['admin', 'site_manager', 'worker', 'customer_manager']),
    phone: phone(),
    department: 'Engineering',
    employee_id: nextId('EMP').toUpperCase(),
    avatar_url: 'https://example.com/avatar.png',
    is_active: true,
    organization_id: nextId('org'),
    created_at: pastDate(),
    updated_at: recentDate(),
    ...overrides,
  }
}

/**
 * Create a mock material for testing
 */
export function createMockMaterial(overrides = {}) {
  return {
    id: nextId('material'),
    name: 'Sample Material',
    code: nextId('MAT').toUpperCase(),
    category: 'Concrete',
    unit: sample(['kg', 'ton', 'm³', 'piece', 'box']),
    quantity: 100,
    min_stock: 20,
    price_per_unit: 49.99,
    supplier: 'Sample Supplier',
    location: 'Seoul',
    created_at: pastDate(),
    updated_at: recentDate(),
    ...overrides,
  }
}

/**
 * Create a mock attendance record for testing
 */
export function createMockAttendance(overrides = {}) {
  return {
    id: nextId('attendance'),
    user_id: nextId('user'),
    site_id: nextId('site'),
    date: recentDate().split('T')[0],
    check_in_time: recentDate(),
    check_out_time: futureDate(),
    work_hours: 8,
    overtime_hours: 2,
    status: sample(['present', 'absent', 'late', 'leave']),
    notes: sentence(),
    created_at: pastDate(),
    updated_at: recentDate(),
    ...overrides,
  }
}

/**
 * Create a mock document for testing
 */
export function createMockDocument(overrides = {}) {
  return {
    id: nextId('document'),
    name: 'document.pdf',
    type: sample(['pdf', 'doc', 'xlsx', 'png', 'jpg']),
    size: 1024,
    url: 'https://example.com/document.pdf',
    uploaded_by: nextId('user'),
    site_id: nextId('site'),
    category: sample(['drawing', 'report', 'invoice', 'permit', 'other']),
    description: sentence(),
    created_at: pastDate(),
    updated_at: recentDate(),
    ...overrides,
  }
}

/**
 * Create mock photo for testing
 */
export function createMockPhoto(overrides = {}) {
  return {
    id: nextId('photo'),
    url: 'https://example.com/photo.png',
    thumbnail_url: 'https://example.com/photo-thumb.png',
    caption: sentence(),
    daily_report_id: nextId('daily-report'),
    uploaded_by: nextId('user'),
    file_size: 500000,
    width: 1920,
    height: 1080,
    created_at: recentDate(),
    ...overrides,
  }
}

/**
 * Create mock notification for testing
 */
export function createMockNotification(overrides = {}) {
  return {
    id: nextId('notification'),
    user_id: nextId('user'),
    title: 'Sample Notification',
    message: paragraph(),
    type: sample(['info', 'success', 'warning', 'error']),
    read: false,
    action_url: 'https://example.com/action',
    created_at: recentDate(),
    ...overrides,
  }
}

// Basic sanity check ensures the module is treated as a valid Jest suite.
describe('test-utils helpers', () => {
  it('creates mock user with required fields', () => {
    const user = createMockUser()
    expect(user.id).toBeTruthy()
    expect(user.email).toContain('@')
  })
})
