'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestAttendancePage() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function testAttendance() {
      try {
        const supabase = createClient()
        
        // 로그인
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: 'manager@inopnc.com',
          password: 'password123'
        })
        
        if (authError) {
          setError(authError)
          setLoading(false)
          return
        }
        
        console.log('✅ Logged in:', authData.user?.email)
        
        // 근무 데이터 조회
        const { data: attendance, error: attendanceError } = await supabase
          .from('work_records')
          .select(`
            *,
            sites(id, name)
          `)
          .or(`user_id.eq.${authData.user?.id},profile_id.eq.${authData.user?.id}`)
          .gte('work_date', '2025-08-01')
          .lte('work_date', '2025-08-31')
          .order('work_date', { ascending: true })
        
        if (attendanceError) {
          setError(attendanceError)
        } else {
          setData(attendance)
        }
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    
    testAttendance()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Attendance Test Page</h1>
      
      {loading && <p>Loading...</p>}
      
      {error && (
        <div className="bg-red-100 p-4 rounded">
          <h2 className="font-bold">Error:</h2>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}
      
      {data && (
        <div className="bg-green-100 p-4 rounded">
          <h2 className="font-bold">Found {data.length} records:</h2>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
      
      <div className="mt-4">
        <p>Check browser console for detailed logs</p>
      </div>
    </div>
  )
}