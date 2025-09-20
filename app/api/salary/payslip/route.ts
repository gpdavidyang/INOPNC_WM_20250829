import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'


export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    const body = await request.json()
    const { year, month, siteId } = body

    // 사용자 프로필 조회
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authResult.userId)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // 현장 정보 조회
    let siteName = '전체'
    if (siteId) {
      const { data: site } = await supabase
        .from('sites')
        .select('name')
        .eq('id', siteId)
        .single()
      
      if (site) {
        siteName = site.name
      }
    }

    // 급여 계산
    const salary = await salaryCalculationService.calculateMonthlySalary(
      authResult.userId,
      year,
      month,
      siteId
    )

    // PDF 생성
    const payslipData = {
      employee: {
        id: authResult.userId,
        name: profile.full_name || '',
        email: profile.email || '',
        role: profile.role || 'worker',
        employeeNumber: profile.employee_number
      },
      company: {
        name: 'INOPNC',
        address: '서울특별시 강남구',
        phone: '02-1234-5678',
        registrationNumber: '123-45-67890'
      },
      site: {
        id: siteId || '',
        name: siteName
      },
      salary,
      paymentDate: new Date(),
      paymentMethod: '계좌이체'
    }

    const pdfBlob = await payslipGenerator.generatePDF(payslipData)
    
    // Blob을 Base64로 변환
    const buffer = await pdfBlob.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    return NextResponse.json({
      success: true,
      data: {
        pdf: base64,
        filename: `급여명세서_${year}-${month.toString().padStart(2, '0')}.pdf`
      }
    })
  } catch (error: unknown) {
    console.error('Payslip generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
