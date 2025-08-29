import { faker } from '@faker-js/faker'

/**
 * Create a mock daily report for testing
 */
export function createMockDailyReport(overrides = {}) {
  return {
    id: faker.string.uuid(),
    site_id: faker.string.uuid(),
    user_id: faker.string.uuid(),
    date: faker.date.recent().toISOString(),
    weather: faker.helpers.arrayElement(['sunny', 'cloudy', 'rainy', 'snowy']),
    temperature: faker.number.int({ min: -10, max: 40 }),
    work_content: faker.lorem.paragraph(),
    safety_notes: faker.lorem.sentence(),
    worker_count: faker.number.int({ min: 1, max: 50 }),
    equipment_used: faker.lorem.words(3),
    materials_used: faker.lorem.words(3),
    progress_percentage: faker.number.int({ min: 0, max: 100 }),
    issues: faker.lorem.sentence(),
    tomorrow_plan: faker.lorem.sentence(),
    status: 'draft',
    created_at: faker.date.recent().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  }
}

/**
 * Create a mock site for testing
 */
export function createMockSite(overrides = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.company.name(),
    code: faker.string.alphanumeric(6).toUpperCase(),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    zip: faker.location.zipCode(),
    country: faker.location.country(),
    latitude: faker.location.latitude(),
    longitude: faker.location.longitude(),
    start_date: faker.date.past().toISOString(),
    end_date: faker.date.future().toISOString(),
    status: 'active',
    project_manager: faker.person.fullName(),
    contact_phone: faker.phone.number(),
    contact_email: faker.internet.email(),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  }
}

/**
 * Create a mock user for testing
 */
export function createMockUser(overrides = {}) {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    full_name: faker.person.fullName(),
    role: faker.helpers.arrayElement(['admin', 'site_manager', 'worker', 'customer_manager']),
    phone: faker.phone.number(),
    department: faker.commerce.department(),
    employee_id: faker.string.alphanumeric(8).toUpperCase(),
    avatar_url: faker.image.avatar(),
    is_active: true,
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  }
}

/**
 * Create a mock material for testing
 */
export function createMockMaterial(overrides = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    code: faker.string.alphanumeric(8).toUpperCase(),
    category: faker.commerce.department(),
    unit: faker.helpers.arrayElement(['kg', 'ton', 'm³', 'piece', 'box']),
    quantity: faker.number.int({ min: 0, max: 1000 }),
    min_stock: faker.number.int({ min: 10, max: 100 }),
    price_per_unit: faker.number.float({ min: 1, max: 1000, fractionDigits: 2 }),
    supplier: faker.company.name(),
    location: faker.location.city(),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  }
}

/**
 * Create a mock attendance record for testing
 */
export function createMockAttendance(overrides = {}) {
  const checkIn = faker.date.recent()
  const checkOut = new Date(checkIn.getTime() + 8 * 60 * 60 * 1000) // 8 hours later

  return {
    id: faker.string.uuid(),
    user_id: faker.string.uuid(),
    site_id: faker.string.uuid(),
    date: checkIn.toISOString().split('T')[0],
    check_in_time: checkIn.toISOString(),
    check_out_time: checkOut.toISOString(),
    work_hours: 8,
    overtime_hours: faker.number.int({ min: 0, max: 4 }),
    status: faker.helpers.arrayElement(['present', 'absent', 'late', 'leave']),
    notes: faker.lorem.sentence(),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  }
}

/**
 * Create a mock document for testing
 */
export function createMockDocument(overrides = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.system.fileName(),
    type: faker.helpers.arrayElement(['pdf', 'doc', 'xlsx', 'png', 'jpg']),
    size: faker.number.int({ min: 1000, max: 10000000 }),
    url: faker.internet.url(),
    uploaded_by: faker.string.uuid(),
    site_id: faker.string.uuid(),
    category: faker.helpers.arrayElement(['drawing', 'report', 'invoice', 'permit', 'other']),
    description: faker.lorem.sentence(),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  }
}

/**
 * Create mock photo for testing
 */
export function createMockPhoto(overrides = {}) {
  return {
    id: faker.string.uuid(),
    url: faker.image.url(),
    thumbnail_url: faker.image.url(),
    caption: faker.lorem.sentence(),
    daily_report_id: faker.string.uuid(),
    uploaded_by: faker.string.uuid(),
    file_size: faker.number.int({ min: 100000, max: 5000000 }),
    width: faker.number.int({ min: 800, max: 4000 }),
    height: faker.number.int({ min: 600, max: 3000 }),
    created_at: faker.date.past().toISOString(),
    ...overrides,
  }
}

/**
 * Create mock notification for testing
 */
export function createMockNotification(overrides = {}) {
  return {
    id: faker.string.uuid(),
    user_id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    message: faker.lorem.paragraph(),
    type: faker.helpers.arrayElement(['info', 'success', 'warning', 'error']),
    read: false,
    action_url: faker.internet.url(),
    created_at: faker.date.recent().toISOString(),
    ...overrides,
  }
}