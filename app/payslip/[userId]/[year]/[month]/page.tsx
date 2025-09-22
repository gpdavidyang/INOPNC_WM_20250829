'use client'
import { createClient } from '@/lib/supabase/client'


interface Profile {
  id: string
  full_name: string
  email: string
  role: string
  salary_type: string
  daily_wage: number
}

export default function PayslipPage() {
  const params = useParams()
  const { userId, year, month } = params
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    async function generatePayslip() {
      try {
        const supabase = createClient()
        
        // 1. 사용자 정보 조회
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (profileError || !profile) {
          setError('사용자 정보를 찾을 수 없습니다.')
          return
        }

        // 2. 급여 계산
        const salaryResult = await calculateMonthlySalary({
          user_id: userId as string,
          year: parseInt(year as string),
          month: parseInt(month as string)
        })

        if (!salaryResult.success || !salaryResult.data) {
          setError('급여 정보를 계산할 수 없습니다.')
          return
        }

        // 3. 사이트 정보 조회 (최근 근무 사이트)
        const { data: attendanceData } = await supabase
          .from('work_records')
          .select(`
            site_id,
            sites (name)
          `)
          .or(`user_id.eq.${userId},profile_id.eq.${userId}`)
          .gte('work_date', `${year}-${String(month).padStart(2, '0')}-01`)
          .lte('work_date', `${year}-${String(month).padStart(2, '0')}-31`)
          .limit(1)
          .single()

        const siteName = attendanceData?.sites?.name || '미지정'

        // 4. HTML 급여명세서 생성
        const payslipData = {
          employee: {
            id: profile.id,
            name: profile.full_name || '',
            email: profile.email || '',
            role: profile.role,
            department: profile.salary_type || '일용직',
            employeeNumber: `W-${profile.id.slice(0, 6)}`
          },
          company: {
            name: 'INOPNC',
            address: '서울특별시 강남구 테헤란로 123',
            phone: '02-1234-5678',
            registrationNumber: '123-45-67890'
          },
          site: {
            id: attendanceData?.site_id || '',
            name: siteName
          },
          salary: salaryResult.data,
          paymentDate: new Date(`${year}-${String(month).padStart(2, '0')}-25`),
          paymentMethod: '계좌이체'
        }

        const html = payslipGeneratorKorean.generateHTML(payslipData)
        setHtmlContent(html)
      } catch (err) {
        console.error('Payslip generation error:', err)
        setError('급여명세서 생성 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    generatePayslip()
  }, [userId, year, month])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">급여명세서를 생성하고 있습니다...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">오류 발생</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.close()} 
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            닫기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* HTML Content */}
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </div>
  )
}