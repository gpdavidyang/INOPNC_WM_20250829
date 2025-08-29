/**
 * Test Data Builders
 * 
 * Consolidated imports and builder patterns for creating test data
 * across the INOPNC Work Management System.
 */

// Re-export all factory functions for convenience
export * from '@/lib/test-utils/factories/attendance.factory'
export * from '@/lib/test-utils/factories/documents.factory'

// Re-export mock utilities
export * from '@/lib/test-utils/mocks/supabase.mock'
export * from '@/lib/test-utils/mocks/pwa.mock'
export * from '@/lib/test-utils/mocks/analytics.mock'

// Re-export helpers
export * from './auth-helpers'
export * from './async-helpers'

import { faker } from '@faker-js/faker'
import type { Profile, Organization, Site } from '@/types'
import { 
  createMockAttendanceWithLaborHours, 
  createMockPayslip,
  STANDARD_LABOR_HOUR,
  HOURS_PER_LABOR
} from '@/lib/test-utils/factories/attendance.factory'
import {
  createMockDocumentCard,
  createMockMarkupDocument,
  FILE_TYPE_COLORS
} from '@/lib/test-utils/factories/documents.factory'
import { mockAuthState, createMockProfile } from './auth-helpers'

// Builder interface for fluent API
export interface TestDataBuilder<T> {
  build(): T
  buildList(count: number): T[]
}

// Organization builder
export class OrganizationBuilder implements TestDataBuilder<Organization> {
  private organization: Partial<Organization> = {}

  constructor() {
    this.organization = {
      id: faker.string.uuid(),
      name: faker.company.name(),
      business_number: faker.string.numeric(10),
      address: faker.location.streetAddress(),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      representative: faker.person.fullName(),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  withName(name: string): this {
    this.organization.name = name
    return this
  }

  withBusinessNumber(businessNumber: string): this {
    this.organization.business_number = businessNumber
    return this
  }

  withAddress(address: string): this {
    this.organization.address = address
    return this
  }

  inactive(): this {
    this.organization.is_active = false
    return this
  }

  build(): Organization {
    return this.organization as Organization
  }

  buildList(count: number): Organization[] {
    return Array.from({ length: count }, () => new OrganizationBuilder().build())
  }
}

// Site builder
export class SiteBuilder implements TestDataBuilder<Site> {
  private site: Partial<Site> = {}

  constructor() {
    this.site = {
      id: faker.string.uuid(),
      name: faker.company.name() + ' 현장',
      address: faker.location.streetAddress(),
      organization_id: faker.string.uuid(),
      manager_id: faker.string.uuid(),
      start_date: faker.date.past().toISOString(),
      expected_end_date: faker.date.future().toISOString(),
      status: 'active',
      description: faker.lorem.sentence(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  withName(name: string): this {
    this.site.name = name
    return this
  }

  withOrganization(organizationId: string): this {
    this.site.organization_id = organizationId
    return this
  }

  withManager(managerId: string): this {
    this.site.manager_id = managerId
    return this
  }

  withStatus(status: 'planning' | 'active' | 'suspended' | 'completed'): this {
    this.site.status = status
    return this
  }

  withDateRange(startDate: Date, endDate: Date): this {
    this.site.start_date = startDate.toISOString()
    this.site.expected_end_date = endDate.toISOString()
    return this
  }

  completed(): this {
    this.site.status = 'completed'
    this.site.actual_end_date = new Date().toISOString()
    return this
  }

  build(): Site {
    return this.site as Site
  }

  buildList(count: number): Site[] {
    return Array.from({ length: count }, () => new SiteBuilder().build())
  }
}

// Profile builder (extends existing factory)
export class ProfileBuilder implements TestDataBuilder<Profile> {
  private profile: Partial<Profile> = {}

  constructor() {
    this.profile = createMockProfile('worker')
  }

  withRole(role: Profile['role']): this {
    this.profile = { ...this.profile, ...createMockProfile(role) }
    return this
  }

  withName(name: string): this {
    this.profile.name = name
    return this
  }

  withEmail(email: string): this {
    this.profile.email = email
    return this
  }

  withOrganization(organizationId: string): this {
    this.profile.organization_id = organizationId
    return this
  }

  withSite(siteId: string): this {
    this.profile.site_id = siteId
    return this
  }

  withPosition(position: string): this {
    this.profile.position = position
    return this
  }

  inactive(): this {
    this.profile.is_active = false
    return this
  }

  build(): Profile {
    return this.profile as Profile
  }

  buildList(count: number): Profile[] {
    return Array.from({ length: count }, () => new ProfileBuilder().build())
  }
}

// Complete test scenario builder
export class TestScenarioBuilder {
  private organization: Organization
  private sites: Site[] = []
  private profiles: Profile[] = []

  constructor() {
    this.organization = new OrganizationBuilder().build()
  }

  withOrganization(builder: (org: OrganizationBuilder) => OrganizationBuilder): this {
    this.organization = builder(new OrganizationBuilder()).build()
    return this
  }

  addSite(builder: (site: SiteBuilder) => SiteBuilder): this {
    const site = builder(new SiteBuilder().withOrganization(this.organization.id!)).build()
    this.sites.push(site)
    return this
  }

  addProfile(builder: (profile: ProfileBuilder) => ProfileBuilder): this {
    const profile = builder(
      new ProfileBuilder()
        .withOrganization(this.organization.id!)
        .withSite(this.sites[0]?.id || null)
    ).build()
    this.profiles.push(profile)
    return this
  }

  // Predefined scenarios
  static constructionCompany() {
    return new TestScenarioBuilder()
      .withOrganization(org => 
        org.withName('대한건설(주)')
          .withBusinessNumber('123-45-67890')
          .withAddress('서울시 강남구 테헤란로 123')
      )
      .addSite(site => 
        site.withName('서울역 재개발 현장')
          .withStatus('active')
      )
      .addSite(site => 
        site.withName('부산항 확장 공사')
          .withStatus('planning')
      )
      .addProfile(profile => 
        profile.withRole('admin')
          .withName('김관리자')
          .withPosition('현장총괄')
      )
      .addProfile(profile => 
        profile.withRole('site_manager')
          .withName('박현장장')
          .withPosition('현장소장')
      )
      .addProfile(profile => 
        profile.withRole('worker')
          .withName('이작업자')
          .withPosition('철근공')
      )
  }

  static multiSiteOperation() {
    const scenario = new TestScenarioBuilder()
      .withOrganization(org => 
        org.withName('글로벌건설그룹')
      )

    // Add 5 active sites
    for (let i = 1; i <= 5; i++) {
      scenario.addSite(site => 
        site.withName(`현장${i}`)
          .withStatus('active')
      )
    }

    // Add various roles
    const roles: Profile['role'][] = ['admin', 'site_manager', 'worker', 'customer_manager']
    roles.forEach((role, index) => {
      scenario.addProfile(profile => 
        profile.withRole(role)
          .withName(`${role}_user_${index}`)
      )
    })

    return scenario
  }

  build() {
    return {
      organization: this.organization,
      sites: this.sites,
      profiles: this.profiles,
      
      // Helper methods for accessing specific roles
      getAdmin: () => this.profiles.find(p => p.role === 'admin'),
      getManagers: () => this.profiles.filter(p => p.role === 'site_manager'),
      getWorkers: () => this.profiles.filter(p => p.role === 'worker'),
      getCustomers: () => this.profiles.filter(p => p.role === 'customer_manager'),
      
      // Helper for getting site-specific profiles
      getProfilesForSite: (siteId: string) => 
        this.profiles.filter(p => p.site_id === siteId),
      
      // Helper for auth context
      getAuthContextFor: (profileId: string) => {
        const profile = this.profiles.find(p => p.id === profileId)
        return profile ? mockAuthState('authenticated', { profile }) : null
      }
    }
  }
}

// Work log scenario builders
export class WorkLogScenarioBuilder {
  static monthlyAttendance(year: number, month: number, profileId: string) {
    const attendanceList = []
    const daysInMonth = new Date(year, month, 0).getDate()
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      
      if (!isWeekend && faker.datatype.boolean({ probability: 0.9 })) {
        // 90% chance of attendance on weekdays
        const laborHours = faker.helpers.arrayElement([
          STANDARD_LABOR_HOUR, // Full day
          STANDARD_LABOR_HOUR * 1.5, // Overtime
          STANDARD_LABOR_HOUR * 0.5 // Half day
        ])
        
        attendanceList.push(
          createMockAttendanceWithLaborHours({
            profile_id: profileId,
            date: date.toISOString().split('T')[0],
            labor_hours: laborHours,
            work_hours: laborHours * HOURS_PER_LABOR
          })
        )
      }
    }
    
    return attendanceList
  }

  static overtimeWeek(profileId: string, weekStartDate: Date) {
    const attendanceList = []
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStartDate)
      date.setDate(date.getDate() + i)
      
      // Heavy overtime week
      const laborHours = faker.helpers.arrayElement([
        STANDARD_LABOR_HOUR * 1.5, // 1.5x overtime
        STANDARD_LABOR_HOUR * 2.0,  // Double overtime
        STANDARD_LABOR_HOUR * 1.25  // Light overtime
      ])
      
      attendanceList.push(
        createMockAttendanceWithLaborHours({
          profile_id: profileId,
          date: date.toISOString().split('T')[0],
          labor_hours: laborHours,
          work_hours: laborHours * HOURS_PER_LABOR
        })
      )
    }
    
    return attendanceList
  }
}

// Document scenario builders
export class DocumentScenarioBuilder {
  static markupDocumentLibrary(profileId: string, count = 10) {
    const documents = []
    
    for (let i = 0; i < count; i++) {
      documents.push(
        createMockMarkupDocument({
          title: `도면 ${i + 1}`,
          created_by: profileId,
          location: faker.helpers.arrayElement(['personal', 'shared']),
          markup_count: faker.number.int({ min: 0, max: 20 })
        })
      )
    }
    
    return documents
  }

  static mixedDocumentCards(count = 15) {
    const documents = []
    const types = ['daily_report', 'approval', 'material', 'markup', 'file']
    
    for (let i = 0; i < count; i++) {
      const type = faker.helpers.arrayElement(types)
      documents.push(
        createMockDocumentCard({ type })
      )
    }
    
    return documents
  }
}

// Quick builders for common scenarios
export const quickBuilders = {
  // Users
  worker: () => new ProfileBuilder().withRole('worker').build(),
  manager: () => new ProfileBuilder().withRole('site_manager').build(),
  admin: () => new ProfileBuilder().withRole('admin').build(),
  customer: () => new ProfileBuilder().withRole('customer_manager').build(),

  // Organizations
  constructionCompany: () => new OrganizationBuilder()
    .withName(`${faker.company.name()} 건설`)
    .build(),

  // Sites  
  activeSite: () => new SiteBuilder()
    .withStatus('active')
    .withName(`${faker.location.city()} 현장`)
    .build(),

  completedSite: () => new SiteBuilder()
    .withStatus('completed')
    .completed()
    .build(),

  // Complete scenarios
  smallCompany: () => TestScenarioBuilder.constructionCompany().build(),
  multiSiteCompany: () => TestScenarioBuilder.multiSiteOperation().build(),

  // Work data
  monthlyWork: (profileId: string) => WorkLogScenarioBuilder.monthlyAttendance(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    profileId
  ),

  overtimeWork: (profileId: string) => WorkLogScenarioBuilder.overtimeWeek(
    profileId,
    new Date()
  ),

  // Documents
  personalDocuments: (profileId: string) => DocumentScenarioBuilder.markupDocumentLibrary(profileId, 5),
  sharedDocuments: () => DocumentScenarioBuilder.mixedDocumentCards(10)
}

// Export builders
export {
  OrganizationBuilder,
  SiteBuilder, 
  ProfileBuilder,
  TestScenarioBuilder,
  WorkLogScenarioBuilder,
  DocumentScenarioBuilder
}