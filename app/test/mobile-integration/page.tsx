'use client'

import MobileDashboardLayout from '@/components/dashboard/mobile-dashboard-layout'

export default function TestMobileIntegrationPage() {
  // Mock user and profile data
  const mockUser = {
    id: 'test-user-id',
    email: 'worker@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    app_metadata: {},
    user_metadata: {}
  } as unknown

  const mockProfile = {
    id: 'test-user-id',
    email: 'worker@example.com',
    full_name: '김작업',
    role: 'worker' as const,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
  }

  const [currentRole, setCurrentRole] = useState<'worker' | 'site_manager' | 'customer_manager'>('worker')

  return (
    <div>
      {/* Role Switcher for Testing */}
      <div style={{
        position: 'fixed',
        top: '70px',
        right: '10px',
        zIndex: 200,
        background: 'white',
        padding: '8px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <select 
          value={currentRole} 
          onChange={(e) => setCurrentRole(e.target.value as unknown)}
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}
        >
          <option value="worker">작업자</option>
          <option value="site_manager">현장관리자</option>
          <option value="customer_manager">파트너사</option>
        </select>
      </div>

      {/* Mobile Dashboard */}
      <MobileDashboardLayout 
        user={mockUser} 
        profile={{ ...mockProfile, role: currentRole }}
      />
    </div>
  )
}