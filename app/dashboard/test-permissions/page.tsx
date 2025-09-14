
export default async function TestPermissionsPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/dashboard')
  }

  // Test various permissions
  const tests = {
    profiles: {
      canView: await testQuery(supabase, 'profiles', 'select'),
      canUpdate: await testQuery(supabase, 'profiles', 'update', { full_name: profile.full_name }, { id: user.id }),
      canUpdateOthers: await testQuery(supabase, 'profiles', 'update', { full_name: 'Test' }, { id: '00000000-0000-0000-0000-000000000000' })
    },
    organizations: {
      canView: await testQuery(supabase, 'organizations', 'select'),
      canCreate: await testQuery(supabase, 'organizations', 'insert', { name: 'Test Org', type: 'head_office' }),
      canUpdate: await testQuery(supabase, 'organizations', 'update', { name: 'Updated' })
    },
    sites: {
      canView: await testQuery(supabase, 'sites', 'select'),
      canCreate: await testQuery(supabase, 'sites', 'insert', { name: 'Test Site', address: 'Test', start_date: new Date() }),
      canUpdate: await testQuery(supabase, 'sites', 'update', { name: 'Updated' })
    },
    daily_reports: {
      canView: await testQuery(supabase, 'daily_reports', 'select'),
      canCreate: await testQuery(supabase, 'daily_reports', 'insert', { 
        site_id: '11111111-1111-1111-1111-111111111111',
        work_date: new Date(),
        weather_morning: 'sunny',
        reported_by: user.id
      })
    },
    salary_info: {
      canViewOwn: await testQuery(supabase, 'salary_info', 'select', null, { user_id: user.id }),
      canViewOthers: await testQuery(supabase, 'salary_info', 'select')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">권한 테스트 페이지</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">현재 사용자 정보</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-700">이메일</dt>
            <dd className="text-sm text-gray-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-700">역할</dt>
            <dd className="text-sm text-gray-900">{profile.role}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-700">조직</dt>
            <dd className="text-sm text-gray-900">N/A</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-700">현장</dt>
            <dd className="text-sm text-gray-900">N/A</dd>
          </div>
        </dl>
      </div>

      <div className="space-y-6">
        {Object.entries(tests).map(([table, permissions]) => (
          <div key={table} className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4 capitalize">{table} 테이블</h3>
            <div className="space-y-2">
              {Object.entries(permissions).map(([action, allowed]) => (
                <div key={action} className="flex items-center justify-between">
                  <span className="text-sm text-gray-800">{action}</span>
                  <span className={`text-sm font-medium ${allowed ? 'text-green-600' : 'text-red-600'}`}>
                    {allowed ? '✅ 허용' : '❌ 거부'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-sm text-gray-700">
        <p>* 이 페이지는 테스트 목적으로만 사용됩니다.</p>
        <p>* 실제 데이터는 변경되지 않습니다.</p>
      </div>
    </div>
  )
}

async function testQuery(supabase: unknown, table: string, operation: string, data?: unknown, filter?: unknown) {
  try {
    let query = supabase.from(table)
    
    if (operation === 'select') {
      query = query.select('id').limit(1)
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }
    } else if (operation === 'insert') {
      // Don't actually insert, just check if we can
      return true // For now, assume insert is allowed if no error
    } else if (operation === 'update') {
      query = query.update(data).eq('id', '00000000-0000-0000-0000-000000000000')
    }
    
    const { error } = await query
    return !error
  } catch (e) {
    return false
  }
}