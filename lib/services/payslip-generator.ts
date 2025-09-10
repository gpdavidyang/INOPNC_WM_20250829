/**
 * 급여명세서 PDF 생성 서비스
 */

import { jsPDF } from 'jspdf'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
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
   * PDF 급여명세서 생성
   */
  async generatePDF(data: PayslipData): Promise<Blob> {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // 폰트 설정 (한글 지원을 위해 추후 한글 폰트 추가 필요)
      doc.setFont('helvetica')

      // 회사 정보
      this.addCompanyHeader(doc, data.company)

      // 제목
      doc.setFontSize(18)
      doc.text('급여명세서', 105, 35, { align: 'center' })

      // 급여 기간
      const periodText = `${format(new Date(data.salary.period_start), 'yyyy년 MM월', { locale: ko })}`
      doc.setFontSize(12)
      doc.text(periodText, 105, 45, { align: 'center' })

      // 직원 정보
      this.addEmployeeInfo(doc, data.employee, data.site, 55)

      // 급여 내역
      this.addSalaryDetails(doc, data.salary, 85)

      // 공제 내역
      this.addDeductionDetails(doc, data.salary, 140)

      // 실지급액
      this.addNetPaySection(doc, data.salary, 180)

      // 서명란
      this.addSignatureSection(doc, data.paymentDate, 210)

      // 하단 정보
      this.addFooter(doc, data.company)

      // Blob으로 변환
      const pdfBlob = doc.output('blob')
      return pdfBlob
    } catch (error) {
      console.error('PDF 생성 오류:', error)
      throw new Error('급여명세서 생성 중 오류가 발생했습니다')
    }
  }

  /**
   * 회사 헤더 추가
   */
  private addCompanyHeader(doc: jsPDF, company: any) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(company.name || 'INOPNC', 20, 20)
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    if (company.address) {
      doc.text(company.address, 20, 26)
    }
    if (company.phone) {
      doc.text(`Tel: ${company.phone}`, 20, 31)
    }
  }

  /**
   * 직원 정보 섹션
   */
  private addEmployeeInfo(doc: jsPDF, employee: any, site: any, yPos: number) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('직원 정보', 20, yPos)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    
    const infoLines = [
      ['성명', employee.name || ''],
      ['사번', employee.employeeNumber || employee.id.slice(0, 8)],
      ['부서/현장', site.name || ''],
      ['직급', this.getRoleDisplay(employee.role)],
      ['이메일', employee.email || '']
    ]

    let currentY = yPos + 7
    infoLines.forEach(([label, value]) => {
      doc.text(`${label}:`, 25, currentY)
      doc.text(value, 60, currentY)
      currentY += 6
    })
  }

  /**
   * 급여 내역 섹션
   */
  private addSalaryDetails(doc: jsPDF, salary: MonthlySalary, yPos: number) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('지급 내역', 20, yPos)
    
    // 테이블 헤더
    doc.setFontSize(9)
    doc.setFillColor(240, 240, 240)
    doc.rect(20, yPos + 3, 170, 8, 'F')
    
    doc.text('구분', 25, yPos + 8)
    doc.text('산출 기준', 70, yPos + 8)
    doc.text('금액', 160, yPos + 8, { align: 'right' })
    
    // 테이블 내용
    doc.setFont('helvetica', 'normal')
    const details = [
      ['기본급', `${salary.work_days}일 × 일급`, salary.base_pay],
      ['연장수당', `${salary.total_overtime_hours.toFixed(1)}시간 × 시급×1.5`, salary.overtime_pay],
      ['제수당', '기타 수당', salary.bonus_pay]
    ]
    
    let currentY = yPos + 15
    details.forEach(([label, basis, amount]) => {
      doc.text(label, 25, currentY)
      doc.text(basis, 70, currentY)
      doc.text(this.formatCurrency(amount as number), 160, currentY, { align: 'right' })
      currentY += 6
    })
    
    // 총 지급액
    doc.setFont('helvetica', 'bold')
    doc.line(20, currentY - 2, 190, currentY - 2)
    doc.text('총 지급액', 25, currentY + 4)
    doc.text(this.formatCurrency(salary.total_gross_pay), 160, currentY + 4, { align: 'right' })
  }

  /**
   * 공제 내역 섹션
   */
  private addDeductionDetails(doc: jsPDF, salary: MonthlySalary, yPos: number) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('공제 내역', 20, yPos)
    
    // 테이블 헤더
    doc.setFontSize(9)
    doc.setFillColor(240, 240, 240)
    doc.rect(20, yPos + 3, 170, 8, 'F')
    
    doc.text('구분', 25, yPos + 8)
    doc.text('요율', 70, yPos + 8)
    doc.text('금액', 160, yPos + 8, { align: 'right' })
    
    // 테이블 내용
    doc.setFont('helvetica', 'normal')
    const deductions = [
      ['소득세', '간이세액표', salary.tax_deduction],
      ['국민연금', '4.5%', salary.national_pension],
      ['건강보험', '3.43%', salary.health_insurance],
      ['고용보험', '0.9%', salary.employment_insurance]
    ]
    
    let currentY = yPos + 15
    deductions.forEach(([label, rate, amount]) => {
      doc.text(label, 25, currentY)
      doc.text(rate, 70, currentY)
      doc.text(this.formatCurrency(amount as number), 160, currentY, { align: 'right' })
      currentY += 6
    })
    
    // 총 공제액
    doc.setFont('helvetica', 'bold')
    doc.line(20, currentY - 2, 190, currentY - 2)
    doc.text('총 공제액', 25, currentY + 4)
    doc.text(this.formatCurrency(salary.total_deductions), 160, currentY + 4, { align: 'right' })
  }

  /**
   * 실지급액 섹션
   */
  private addNetPaySection(doc: jsPDF, salary: MonthlySalary, yPos: number) {
    doc.setFillColor(230, 230, 250)
    doc.rect(20, yPos, 170, 15, 'F')
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('실지급액', 25, yPos + 9)
    
    doc.setFontSize(14)
    doc.text(this.formatCurrency(salary.net_pay), 160, yPos + 9, { align: 'right' })
    
    // 한글 금액 표시
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const koreanAmount = this.numberToKorean(salary.net_pay)
    doc.text(`(${koreanAmount})`, 105, yPos + 20, { align: 'center' })
  }

  /**
   * 서명란 섹션
   */
  private addSignatureSection(doc: jsPDF, paymentDate: Date, yPos: number) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    
    const dateText = format(paymentDate, 'yyyy년 MM월 dd일', { locale: ko })
    doc.text(`지급일: ${dateText}`, 20, yPos)
    
    // 서명란
    doc.text('수령인:', 20, yPos + 15)
    doc.line(50, yPos + 15, 100, yPos + 15)
    doc.text('(서명)', 102, yPos + 15)
    
    doc.text('지급자:', 120, yPos + 15)
    doc.line(150, yPos + 15, 190, yPos + 15)
  }

  /**
   * 하단 정보
   */
  private addFooter(doc: jsPDF, company: any) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(128, 128, 128)
    
    const footerText = `이 급여명세서는 ${company.name || 'INOPNC'}에서 발행되었습니다.`
    doc.text(footerText, 105, 280, { align: 'center' })
    
    if (company.registrationNumber) {
      doc.text(`사업자등록번호: ${company.registrationNumber}`, 105, 285, { align: 'center' })
    }
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
      'admin': '관리자',
      'site_manager': '현장관리자',
      'worker': '작업자',
      'customer_manager': '고객사 담당자'
    }
    return roleMap[role] || role
  }

  /**
   * 숫자를 한글로 변환
   */
  private numberToKorean(num: number): string {
    const units = ['', '만', '억', '조']
    const smallUnits = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구']
    
    if (num === 0) return '영원'
    
    let result = ''
    let unitIndex = 0
    
    while (num > 0) {
      const part = num % 10000
      if (part > 0) {
        // 간단한 변환 (실제로는 더 복잡한 로직 필요)
        result = part.toLocaleString() + units[unitIndex] + ' ' + result
      }
      num = Math.floor(num / 10000)
      unitIndex++
    }
    
    return result.trim() + '원'
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