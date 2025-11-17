/**
 * 급여명세서 PDF 생성 서비스
 */

import type { MonthlySalary } from './salary-calculation.service'

export interface PayslipData {
  employee: {
    id: string
    name: string
    email: string
    role: string
    department?: string
    employeeNumber?: string
  }
  company: {
    name: string
    address?: string
    phone?: string
    registrationNumber?: string
  }
  site: {
    id: string
    name: string
    address?: string
  }
  salary: MonthlySalary
  paymentDate: Date
  paymentMethod?: string
}

export class PayslipGenerator {
  /**
   * PDF 급여명세서 생성 - 한국 표준 형태
   */
  async generatePDF(data: PayslipData): Promise<Blob> {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      // 폰트 설정 (한글 지원)
      doc.setFont('helvetica')

      // 문서 제목 및 헤더
      this.addStandardHeader(doc, data.company, data.salary)

      // 직원 기본 정보
      this.addEmployeeBasicInfo(doc, data.employee, data.site, 45)

      // 근무 정보
      this.addWorkingDetails(doc, data.salary, 70)

      // 지급 내역 (기본급, 수당 등)
      this.addEarningsSection(doc, data.salary, 100)

      // 공제 내역 (세금, 보험료 등)
      this.addDeductionsSection(doc, data.salary, 150)

      // 실지급액 강조 박스
      this.addNetPayHighlight(doc, data.salary, 195)

      // 지급 확인란 (서명 제외)
      this.addPaymentConfirmation(doc, data.paymentDate, 220)

      // 하단 회사 정보 및 발행일
      this.addStandardFooter(doc, data.company)

      // Blob으로 변환
      const pdfBlob = doc.output('blob')
      return pdfBlob
    } catch (error) {
      console.error('PDF 생성 오류:', error)
      throw new Error('급여명세서 생성 중 오류가 발생했습니다')
    }
  }

  /**
   * 표준 헤더 추가 (제목 중심)
   */
  private addStandardHeader(doc: jsPDF, company: unknown, salary: MonthlySalary) {
    // 문서 제목
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('급여명세서', 105, 25, { align: 'center' })

    // 급여 지급 월 - 날짜 검증 추가
    let periodText = ''
    try {
      if (salary.period_start) {
        const periodDate = new Date(salary.period_start)
        // 날짜 유효성 검증
        if (!isNaN(periodDate.getTime())) {
          periodText = format(periodDate, 'yyyy년 MM월', { locale: ko })
        } else {
          // 날짜가 유효하지 않으면 현재 월 사용
          periodText = format(new Date(), 'yyyy년 MM월', { locale: ko })
        }
      } else {
        // period_start가 없으면 현재 월 사용
        periodText = format(new Date(), 'yyyy년 MM월', { locale: ko })
      }
    } catch (error) {
      console.error('날짜 포맷 오류:', error)
      // 오류 발생 시 현재 월 사용
      periodText = format(new Date(), 'yyyy년 MM월', { locale: ko })
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.text(periodText, 105, 35, { align: 'center' })

    // 회사명 (우상단)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(company.name || 'INOPNC', 190, 15, { align: 'right' })
  }

  /**
   * 직원 기본 정보
   */
  private addEmployeeBasicInfo(doc: jsPDF, employee: unknown, site: unknown, yPos: number) {
    // 박스 그리기
    doc.setDrawColor(0, 0, 0)
    doc.rect(15, yPos, 180, 20)

    // 제목
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('직원 정보', 20, yPos + 6)

    // 정보 배치 (2열)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    // 좌측 열
    doc.text(`성명: ${employee.name || ''}`, 20, yPos + 12)
    doc.text(`사번: ${employee.employeeNumber || employee.id.slice(0, 8)}`, 20, yPos + 17)

    // 우측 열
    doc.text(`현장: ${site.name || ''}`, 110, yPos + 12)
    doc.text(`직급: ${this.getRoleDisplay(employee.role)}`, 110, yPos + 17)
  }

  /**
   * 근무 정보 섹션
   */
  private addWorkingDetails(doc: jsPDF, salary: MonthlySalary, yPos: number) {
    // 박스 그리기
    doc.rect(15, yPos, 180, 25)

    // 제목
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('근무 정보', 20, yPos + 6)

    // 근무 상세 정보
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    doc.text(`근무일수: ${salary.work_days}일`, 20, yPos + 12)
    doc.text(`총근무시간: ${salary.total_work_hours}시간`, 20, yPos + 17)
    doc.text(`연장근무: ${salary.total_overtime_hours.toFixed(2)}시간`, 20, yPos + 22)

    doc.text(`노동시간: ${salary.total_labor_hours}시간`, 110, yPos + 12)
    doc.text(`공수: ${(salary.total_labor_hours / 8).toFixed(2)}공수`, 110, yPos + 17)
    const avgDailyPay =
      salary.work_days > 0 ? salary.total_gross_pay / salary.work_days : salary.total_gross_pay
    doc.text(`평균일급: ${this.formatCurrency(avgDailyPay)}`, 110, yPos + 22)
  }

  /**
   * 지급 내역 섹션 (한국 표준 형태)
   */
  private addEarningsSection(doc: jsPDF, salary: MonthlySalary, yPos: number) {
    // 섹션 제목
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('지급 내역', 20, yPos)

    // 테이블 헤더
    doc.setFillColor(240, 240, 240)
    doc.rect(15, yPos + 5, 180, 8, 'F')
    doc.rect(15, yPos + 5, 180, 8, 'S')

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('지급 항목', 20, yPos + 10)
    doc.text('산출 기준', 85, yPos + 10)
    doc.text('금액', 175, yPos + 10, { align: 'right' })

    // 지급 내역 데이터
    const earningsData: Array<[string, string, number]> = [
      ['기본급', `${salary.work_days}일 × 일급`, salary.base_pay],
    ]

    doc.setFont('helvetica', 'normal')
    let currentY = yPos + 17

    earningsData.forEach(([item, basis, amount]) => {
      doc.rect(15, currentY - 4, 180, 6, 'S')
      doc.text(item, 20, currentY)
      doc.text(basis, 85, currentY)
      doc.text(this.formatCurrency(amount as number), 175, currentY, { align: 'right' })
      currentY += 6
    })

    // 지급 합계
    doc.setFillColor(230, 230, 230)
    doc.rect(15, currentY - 4, 180, 8, 'F')
    doc.rect(15, currentY - 4, 180, 8, 'S')

    doc.setFont('helvetica', 'bold')
    doc.text('지급 합계', 20, currentY + 1)
    doc.text(this.formatCurrency(salary.total_gross_pay), 175, currentY + 1, { align: 'right' })
  }

  /**
   * 공제 내역 섹션 (한국 표준 형태)
   */
  private addDeductionsSection(doc: jsPDF, salary: MonthlySalary, yPos: number) {
    // 섹션 제목
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('공제 내역', 20, yPos)

    // 테이블 헤더
    doc.setFillColor(240, 240, 240)
    doc.rect(15, yPos + 5, 180, 8, 'F')
    doc.rect(15, yPos + 5, 180, 8, 'S')

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('공제 항목', 20, yPos + 10)
    doc.text('요율/기준', 85, yPos + 10)
    doc.text('금액', 175, yPos + 10, { align: 'right' })

    // 공제 내역 데이터
    const deductionsData = [
      ['소득세', '간이세액표', salary.tax_deduction],
      ['국민연금', '4.5%', salary.national_pension],
      ['건강보험', '3.495%', salary.health_insurance],
      ['고용보험', '0.9%', salary.employment_insurance],
    ]

    doc.setFont('helvetica', 'normal')
    let currentY = yPos + 17

    deductionsData.forEach(([item, rate, amount]) => {
      doc.rect(15, currentY - 4, 180, 6, 'S')
      doc.text(item, 20, currentY)
      doc.text(rate, 85, currentY)
      doc.text(this.formatCurrency(amount as number), 175, currentY, { align: 'right' })
      currentY += 6
    })

    // 공제 합계
    doc.setFillColor(230, 230, 230)
    doc.rect(15, currentY - 4, 180, 8, 'F')
    doc.rect(15, currentY - 4, 180, 8, 'S')

    doc.setFont('helvetica', 'bold')
    doc.text('공제 합계', 20, currentY + 1)
    doc.text(this.formatCurrency(salary.total_deductions), 175, currentY + 1, { align: 'right' })
  }

  /**
   * 실지급액 강조 박스
   */
  private addNetPayHighlight(doc: jsPDF, salary: MonthlySalary, yPos: number) {
    // 실지급액 박스 (강조)
    doc.setFillColor(240, 248, 255)
    doc.rect(15, yPos, 180, 20, 'F')
    doc.setLineWidth(2)
    doc.rect(15, yPos, 180, 20, 'S')
    doc.setLineWidth(0.2)

    // 실지급액 텍스트
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('실지급액', 25, yPos + 10)

    // 금액 (우측 정렬, 큰 폰트)
    doc.setFontSize(16)
    doc.text(this.formatCurrency(salary.net_pay), 185, yPos + 10, { align: 'right' })

    // 한글 금액 (중앙 하단)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const koreanAmount = this.numberToKoreanSimple(salary.net_pay)
    doc.text(`(${koreanAmount})`, 105, yPos + 17, { align: 'center' })
  }

  /**
   * 지급 확인란 (서명란 제외)
   */
  private addPaymentConfirmation(doc: jsPDF, paymentDate: Date, yPos: number) {
    // 지급 정보
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    const dateText = format(paymentDate, 'yyyy년 MM월 dd일', { locale: ko })
    doc.text(`지급일자: ${dateText}`, 20, yPos + 5)
    doc.text('지급방법: 계좌이체', 20, yPos + 12)

    // 확인 박스 (서명란 없이)
    doc.rect(15, yPos + 15, 180, 15)
    doc.setFont('helvetica', 'bold')
    doc.text('급여 지급 확인', 20, yPos + 22)
    doc.setFont('helvetica', 'normal')
    doc.text('위 금액을 정확히 지급받았음을 확인합니다.', 20, yPos + 27)
  }

  /**
   * 표준 하단 정보
   */
  private addStandardFooter(doc: jsPDF, company: unknown) {
    const footerY = 270

    // 회사 정보
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)

    const companyInfo = [
      `발행: ${company.name || 'INOPNC'}`,
      company.address ? `주소: ${company.address}` : '',
      company.phone ? `연락처: ${company.phone}` : '',
      company.registrationNumber ? `사업자등록번호: ${company.registrationNumber}` : '',
    ].filter(info => info.length > 0)

    companyInfo.forEach((info, index) => {
      doc.text(info, 105, footerY + index * 4, { align: 'center' })
    })

    // 발행일
    doc.setFontSize(8)
    const issueDate = format(new Date(), 'yyyy년 MM월 dd일 발행', { locale: ko })
    doc.text(issueDate, 195, 285, { align: 'right' })
  }

  /**
   * 통화 포맷팅
   */
  private formatCurrency(amount: number): string {
    return amount.toLocaleString('ko-KR') + '원'
  }

  /**
   * 역할 표시명 변환
   */
  private getRoleDisplay(role: string): string {
    const roleMap: Record<string, string> = {
      admin: '관리자',
      site_manager: '현장관리자',
      worker: '작업자',
      customer_manager: '고객사 담당자',
    }
    return roleMap[role] || role
  }

  /**
   * 숫자를 한글로 변환 (간소화)
   */
  private numberToKoreanSimple(num: number): string {
    if (num === 0) return '영원'

    const units = ['', '만', '억', '조']
    let result = ''
    let unitIndex = 0

    while (num > 0) {
      const part = num % 10000
      if (part > 0) {
        result = part.toLocaleString() + units[unitIndex] + ' ' + result
      }
      num = Math.floor(num / 10000)
      unitIndex++
    }

    return result.trim() + '원정'
  }

  /**
   * 이메일로 급여명세서 발송
   */
  async sendEmail(payslip: Blob, recipient: string): Promise<void> {
    // TODO: 이메일 발송 로직 구현
    // 실제 구현 시 서버 API를 통해 발송
    console.log(`급여명세서를 ${recipient}로 발송합니다.`)
    throw new Error('이메일 발송 기능은 아직 구현되지 않았습니다')
  }
}

// 싱글톤 인스턴스
export const payslipGenerator = new PayslipGenerator()
