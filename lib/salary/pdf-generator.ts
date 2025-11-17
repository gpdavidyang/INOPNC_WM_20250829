import jsPDF from 'jspdf'

export interface SalaryPDFData {
  // Worker information
  workerName: string
  workerNumber?: string
  position?: string
  department?: string

  // Site information
  siteName: string
  siteAddress?: string

  // Company information
  companyName: string
  companyRegistrationNumber?: string
  companyAddress?: string

  // Salary period
  salaryYear: number
  salaryMonth: number
  workPeriod: {
    startDate: string
    endDate: string
  }

  // Calculation result
  calculation: SalaryCalculationResult

  // Additional information
  bankInfo?: {
    bankName: string
    accountNumber: string
    accountHolder: string
  }

  // Metadata
  issuedDate: string
  issuedBy: string
}

export class SalaryPDFGenerator {
  private pdf: jsPDF

  constructor() {
    this.pdf = new jsPDF('p', 'mm', 'a4')
    this.setupKoreanSupport()
  }

  private setupKoreanSupport() {
    // 한글 지원을 위한 폰트 설정
    this.pdf.setFont('helvetica')
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  private drawHeader(data: SalaryPDFData) {
    const pageWidth = this.pdf.internal.pageSize.getWidth()

    // Title
    this.pdf.setFontSize(20)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('급여명세서', pageWidth / 2, 25, { align: 'center' })

    // Salary Statement
    this.pdf.setFontSize(16)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.text('SALARY STATEMENT', pageWidth / 2, 32, { align: 'center' })

    // Issue date and number
    this.pdf.setFontSize(10)
    this.pdf.text(`발행일: ${this.formatDate(data.issuedDate)}`, 15, 45)
    this.pdf.text(`${data.salaryYear}년 ${data.salaryMonth}월분`, pageWidth - 15, 45, {
      align: 'right',
    })
  }

  private drawCompanyInfo(data: SalaryPDFData, startY: number) {
    this.pdf.setFontSize(12)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('회사 정보', 15, startY)

    this.pdf.setFont('helvetica', 'normal')
    this.pdf.setFontSize(10)

    let currentY = startY + 8

    this.pdf.text(`회사명: ${data.companyName}`, 15, currentY)
    currentY += 6

    if (data.companyRegistrationNumber) {
      this.pdf.text(`사업자번호: ${data.companyRegistrationNumber}`, 15, currentY)
      currentY += 6
    }

    if (data.companyAddress) {
      this.pdf.text(`주소: ${data.companyAddress}`, 15, currentY)
      currentY += 6
    }

    return currentY + 5
  }

  private drawWorkerInfo(data: SalaryPDFData, startY: number) {
    this.pdf.setFontSize(12)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('직원 정보', 15, startY)

    this.pdf.setFont('helvetica', 'normal')
    this.pdf.setFontSize(10)

    let currentY = startY + 8

    this.pdf.text(`성명: ${data.workerName}`, 15, currentY)

    if (data.workerNumber) {
      this.pdf.text(`사번: ${data.workerNumber}`, 100, currentY)
    }
    currentY += 6

    this.pdf.text(`현장: ${data.siteName}`, 15, currentY)

    if (data.position) {
      this.pdf.text(`직책: ${data.position}`, 100, currentY)
    }
    currentY += 6

    if (data.siteAddress) {
      this.pdf.text(`현장주소: ${data.siteAddress}`, 15, currentY)
      currentY += 6
    }

    return currentY + 5
  }

  private drawSalaryPeriod(data: SalaryPDFData, startY: number) {
    this.pdf.setFontSize(12)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('급여 지급 기간', 15, startY)

    this.pdf.setFont('helvetica', 'normal')
    this.pdf.setFontSize(10)

    const currentY = startY + 8
    this.pdf.text(
      `${this.formatDate(data.workPeriod.startDate)} ~ ${this.formatDate(data.workPeriod.endDate)}`,
      15,
      currentY
    )

    return currentY + 10
  }

  private drawSalaryDetails(data: SalaryPDFData, startY: number) {
    const pageWidth = this.pdf.internal.pageSize.getWidth()
    const { calculation } = data

    this.pdf.setFontSize(12)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('급여 상세', 15, startY)

    // Table headers
    const tableStartY = startY + 15
    const colWidth = (pageWidth - 30) / 3

    this.pdf.setFontSize(10)
    this.pdf.setFont('helvetica', 'bold')

    // Draw table header
    this.pdf.rect(15, tableStartY - 5, pageWidth - 30, 8)
    this.pdf.text('항목', 20, tableStartY)
    this.pdf.text('내용', 20 + colWidth, tableStartY)
    this.pdf.text('금액', 20 + colWidth * 2, tableStartY)

    this.pdf.setFont('helvetica', 'normal')

    const rows = [
      [
        '기본급',
        `${calculation.details.workHours}시간 × ${this.formatCurrency(calculation.details.hourlyRate || 0)}`,
        this.formatCurrency(calculation.basePay),
      ],
    ]

    if (calculation.deductions > 0) {
      rows.push(['공제액', '', `-${this.formatCurrency(calculation.deductions)}`])
    }

    // 소계
    rows.push(['', '', ''])
    rows.push(['소계 (세전)', '', this.formatCurrency(calculation.grossPay)])

    if (calculation.taxAmount > 0) {
      rows.push([
        `세금 (${calculation.details.taxRate}%)`,
        calculation.calculationType === 'tax_prepaid' ? '3.3% 선취' : '',
        `-${this.formatCurrency(calculation.taxAmount)}`,
      ])
    }

    let currentY = tableStartY + 8

    rows.forEach((row, index) => {
      const isSubtotal = index === rows.length - 2
      const isTotal = index === rows.length - 1

      if (isSubtotal || isTotal) {
        this.pdf.setFont('helvetica', 'bold')
      } else {
        this.pdf.setFont('helvetica', 'normal')
      }

      // Draw row background for subtotal and total
      if (isSubtotal || isTotal) {
        this.pdf.setFillColor(245, 245, 245)
        this.pdf.rect(15, currentY - 3, pageWidth - 30, 6, 'F')
      }

      this.pdf.text(row[0], 20, currentY)
      this.pdf.text(row[1], 20 + colWidth, currentY)
      this.pdf.text(row[2], 20 + colWidth * 2, currentY, { align: 'right' })

      currentY += 6
    })

    // Final total
    currentY += 3
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setFontSize(12)
    this.pdf.setFillColor(220, 220, 220)
    this.pdf.rect(15, currentY - 3, pageWidth - 30, 8, 'F')
    this.pdf.text('실수령액', 20, currentY + 2)
    this.pdf.text(this.formatCurrency(calculation.netPay), pageWidth - 20, currentY + 2, {
      align: 'right',
    })

    return currentY + 15
  }

  private drawBankInfo(data: SalaryPDFData, startY: number) {
    if (!data.bankInfo) return startY

    this.pdf.setFontSize(12)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('계좌 정보', 15, startY)

    this.pdf.setFont('helvetica', 'normal')
    this.pdf.setFontSize(10)

    let currentY = startY + 8

    this.pdf.text(`은행: ${data.bankInfo.bankName}`, 15, currentY)
    currentY += 6
    this.pdf.text(`계좌번호: ${data.bankInfo.accountNumber}`, 15, currentY)
    currentY += 6
    this.pdf.text(`예금주: ${data.bankInfo.accountHolder}`, 15, currentY)

    return currentY + 10
  }

  private drawFooter(data: SalaryPDFData) {
    const pageHeight = this.pdf.internal.pageSize.getHeight()
    const pageWidth = this.pdf.internal.pageSize.getWidth()

    this.pdf.setFontSize(10)
    this.pdf.setFont('helvetica', 'normal')

    // Issue information
    this.pdf.text(`발행자: ${data.issuedBy}`, 15, pageHeight - 20)
    this.pdf.text(`발행일시: ${this.formatDate(data.issuedDate)}`, 15, pageHeight - 12)

    // Signature area
    this.pdf.text('직원 서명: _________________', pageWidth - 80, pageHeight - 30, {
      align: 'right',
    })

    // Footer line
    this.pdf.setDrawColor(200, 200, 200)
    this.pdf.line(15, pageHeight - 35, pageWidth - 15, pageHeight - 35)

    // Confidential notice
    this.pdf.setFontSize(8)
    this.pdf.setTextColor(100, 100, 100)
    this.pdf.text(
      '본 급여명세서는 기밀문서입니다. 무단 복제 및 배포를 금합니다.',
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    )
  }

  public generatePDF(data: SalaryPDFData): jsPDF {
    // Reset colors
    this.pdf.setTextColor(0, 0, 0)
    this.pdf.setDrawColor(0, 0, 0)

    // Draw all sections
    this.drawHeader(data)

    let currentY = 55
    currentY = this.drawCompanyInfo(data, currentY)
    currentY = this.drawWorkerInfo(data, currentY)
    currentY = this.drawSalaryPeriod(data, currentY)
    currentY = this.drawSalaryDetails(data, currentY)
    currentY = this.drawBankInfo(data, currentY)

    this.drawFooter(data)

    return this.pdf
  }

  public downloadPDF(data: SalaryPDFData, filename?: string): void {
    const pdf = this.generatePDF(data)
    const defaultFilename = `급여명세서_${data.workerName}_${data.salaryYear}년${data.salaryMonth}월.pdf`
    pdf.save(filename || defaultFilename)
  }

  public getPDFBlob(data: SalaryPDFData): Blob {
    const pdf = this.generatePDF(data)
    return pdf.output('blob')
  }

  public getPDFBase64(data: SalaryPDFData): string {
    const pdf = this.generatePDF(data)
    return pdf.output('datauristring')
  }
}

// Utility functions for easy use
export function generateSalaryPDF(data: SalaryPDFData): jsPDF {
  const generator = new SalaryPDFGenerator()
  return generator.generatePDF(data)
}

export function downloadSalaryPDF(data: SalaryPDFData, filename?: string): void {
  const generator = new SalaryPDFGenerator()
  generator.downloadPDF(data, filename)
}

export function getSalaryPDFBlob(data: SalaryPDFData): Blob {
  const generator = new SalaryPDFGenerator()
  return generator.getPDFBlob(data)
}
