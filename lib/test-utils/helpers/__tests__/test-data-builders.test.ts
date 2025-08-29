import {
  OrganizationBuilder,
  SiteBuilder,
  ProfileBuilder,
  TestScenarioBuilder,
  WorkLogScenarioBuilder,
  DocumentScenarioBuilder,
  quickBuilders
} from '../test-data-builders'

describe('Test Data Builders', () => {
  describe('OrganizationBuilder', () => {
    it('should build organization with defaults', () => {
      const org = new OrganizationBuilder().build()
      
      expect(org.id).toBeDefined()
      expect(org.name).toBeDefined()
      expect(org.business_number).toBeDefined()
      expect(org.is_active).toBe(true)
    })

    it('should allow fluent API customization', () => {
      const org = new OrganizationBuilder()
        .withName('Test Company')
        .withBusinessNumber('123-45-67890')
        .withAddress('Test Address')
        .inactive()
        .build()
      
      expect(org.name).toBe('Test Company')
      expect(org.business_number).toBe('123-45-67890')
      expect(org.address).toBe('Test Address')
      expect(org.is_active).toBe(false)
    })

    it('should build list of organizations', () => {
      const orgs = new OrganizationBuilder().buildList(3)
      
      expect(orgs).toHaveLength(3)
      expect(orgs[0].id).not.toBe(orgs[1].id)
    })
  })

  describe('SiteBuilder', () => {
    it('should build site with defaults', () => {
      const site = new SiteBuilder().build()
      
      expect(site.id).toBeDefined()
      expect(site.name).toContain('현장')
      expect(site.status).toBe('active')
      expect(site.start_date).toBeDefined()
    })

    it('should allow customization', () => {
      const orgId = 'test-org-id'
      const managerId = 'test-manager-id'
      
      const site = new SiteBuilder()
        .withName('Test Site')
        .withOrganization(orgId)
        .withManager(managerId)
        .withStatus('planning')
        .build()
      
      expect(site.name).toBe('Test Site')
      expect(site.organization_id).toBe(orgId)
      expect(site.manager_id).toBe(managerId)
      expect(site.status).toBe('planning')
    })

    it('should handle completed sites', () => {
      const site = new SiteBuilder()
        .completed()
        .build()
      
      expect(site.status).toBe('completed')
      expect(site.actual_end_date).toBeDefined()
    })

    it('should set date ranges', () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-12-31')
      
      const site = new SiteBuilder()
        .withDateRange(startDate, endDate)
        .build()
      
      expect(site.start_date).toBe(startDate.toISOString())
      expect(site.expected_end_date).toBe(endDate.toISOString())
    })
  })

  describe('ProfileBuilder', () => {
    it('should build profile with worker role by default', () => {
      const profile = new ProfileBuilder().build()
      
      expect(profile.id).toBeDefined()
      expect(profile.role).toBe('worker')
      expect(profile.name).toBeDefined()
      expect(profile.email).toContain('@')
    })

    it('should allow role-specific customization', () => {
      const profile = new ProfileBuilder()
        .withRole('admin')
        .withName('Test Admin')
        .withEmail('admin@test.com')
        .build()
      
      expect(profile.role).toBe('admin')
      expect(profile.name).toBe('Test Admin')
      expect(profile.email).toBe('admin@test.com')
    })

    it('should handle organization and site assignment', () => {
      const orgId = 'test-org'
      const siteId = 'test-site'
      
      const profile = new ProfileBuilder()
        .withOrganization(orgId)
        .withSite(siteId)
        .withPosition('Test Position')
        .build()
      
      expect(profile.organization_id).toBe(orgId)
      expect(profile.site_id).toBe(siteId)
      expect(profile.position).toBe('Test Position')
    })

    it('should handle inactive profiles', () => {
      const profile = new ProfileBuilder()
        .inactive()
        .build()
      
      expect(profile.is_active).toBe(false)
    })
  })

  describe('TestScenarioBuilder', () => {
    it('should build complete scenario', () => {
      const scenario = new TestScenarioBuilder()
        .withOrganization(org => org.withName('Test Company'))
        .addSite(site => site.withName('Test Site'))
        .addProfile(profile => profile.withRole('admin'))
        .build()
      
      expect(scenario.organization.name).toBe('Test Company')
      expect(scenario.sites).toHaveLength(1)
      expect(scenario.sites[0].name).toBe('Test Site')
      expect(scenario.profiles).toHaveLength(1)
      expect(scenario.profiles[0].role).toBe('admin')
    })

    it('should provide helper methods', () => {
      const scenario = new TestScenarioBuilder()
        .addProfile(profile => profile.withRole('admin'))
        .addProfile(profile => profile.withRole('worker'))
        .addProfile(profile => profile.withRole('site_manager'))
        .build()
      
      expect(scenario.getAdmin()).toBeDefined()
      expect(scenario.getWorkers()).toHaveLength(1)
      expect(scenario.getManagers()).toHaveLength(1)
      expect(scenario.getCustomers()).toHaveLength(0)
    })

    it('should provide predefined construction company scenario', () => {
      const scenario = TestScenarioBuilder.constructionCompany().build()
      
      expect(scenario.organization.name).toBe('대한건설(주)')
      expect(scenario.sites.length).toBeGreaterThan(0)
      expect(scenario.profiles.length).toBeGreaterThan(0)
      expect(scenario.getAdmin()).toBeDefined()
    })

    it('should provide multi-site operation scenario', () => {
      const scenario = TestScenarioBuilder.multiSiteOperation().build()
      
      expect(scenario.sites).toHaveLength(5)
      expect(scenario.profiles.length).toBeGreaterThan(0)
    })

    it('should provide auth context for profiles', () => {
      const scenario = new TestScenarioBuilder()
        .addProfile(profile => profile.withRole('worker'))
        .build()
      
      const workerId = scenario.getWorkers()[0].id
      const authContext = scenario.getAuthContextFor(workerId)
      
      expect(authContext).toBeDefined()
      expect(authContext?.profile?.id).toBe(workerId)
    })
  })

  describe('WorkLogScenarioBuilder', () => {
    it('should generate monthly attendance', () => {
      const profileId = 'test-profile'
      const attendance = WorkLogScenarioBuilder.monthlyAttendance(2024, 1, profileId)
      
      expect(attendance.length).toBeGreaterThan(0)
      expect(attendance[0].profile_id).toBe(profileId)
      expect(attendance[0].labor_hours).toBeGreaterThan(0)
    })

    it('should generate overtime week', () => {
      const profileId = 'test-profile'
      const weekStart = new Date('2024-01-01')
      const attendance = WorkLogScenarioBuilder.overtimeWeek(profileId, weekStart)
      
      expect(attendance).toHaveLength(7)
      attendance.forEach(record => {
        expect(record.labor_hours).toBeGreaterThan(1.0) // All overtime
        expect(record.profile_id).toBe(profileId)
      })
    })
  })

  describe('DocumentScenarioBuilder', () => {
    it('should generate markup document library', () => {
      const profileId = 'test-profile'
      const documents = DocumentScenarioBuilder.markupDocumentLibrary(profileId, 5)
      
      expect(documents).toHaveLength(5)
      documents.forEach(doc => {
        expect(doc.created_by).toBe(profileId)
        expect(doc.title).toContain('도면')
      })
    })

    it('should generate mixed document cards', () => {
      const documents = DocumentScenarioBuilder.mixedDocumentCards(10)
      
      expect(documents).toHaveLength(10)
      documents.forEach(doc => {
        expect(doc.fileType).toBeDefined()
        expect(doc.title).toBeDefined()
        expect(doc.category).toBeDefined()
      })
    })
  })

  describe('quickBuilders', () => {
    it('should provide quick user builders', () => {
      expect(quickBuilders.worker().role).toBe('worker')
      expect(quickBuilders.manager().role).toBe('site_manager')
      expect(quickBuilders.admin().role).toBe('admin')
      expect(quickBuilders.customer().role).toBe('customer_manager')
    })

    it('should provide quick organization builders', () => {
      const company = quickBuilders.constructionCompany()
      expect(company.name).toContain('건설')
    })

    it('should provide quick site builders', () => {
      const activeSite = quickBuilders.activeSite()
      expect(activeSite.status).toBe('active')
      expect(activeSite.name).toContain('현장')
      
      const completedSite = quickBuilders.completedSite()
      expect(completedSite.status).toBe('completed')
      expect(completedSite.actual_end_date).toBeDefined()
    })

    it('should provide quick scenario builders', () => {
      const smallCompany = quickBuilders.smallCompany()
      expect(smallCompany.organization).toBeDefined()
      expect(smallCompany.sites.length).toBeGreaterThan(0)
      
      const multiSiteCompany = quickBuilders.multiSiteCompany()
      expect(multiSiteCompany.sites).toHaveLength(5)
    })

    it('should provide quick work data builders', () => {
      const profileId = 'test-profile'
      
      const monthlyWork = quickBuilders.monthlyWork(profileId)
      expect(monthlyWork.length).toBeGreaterThan(0)
      
      const overtimeWork = quickBuilders.overtimeWork(profileId)
      expect(overtimeWork).toHaveLength(7)
    })

    it('should provide quick document builders', () => {
      const profileId = 'test-profile'
      
      const personalDocs = quickBuilders.personalDocuments(profileId)
      expect(personalDocs).toHaveLength(5)
      
      const sharedDocs = quickBuilders.sharedDocuments()
      expect(sharedDocs).toHaveLength(10)
    })
  })
})