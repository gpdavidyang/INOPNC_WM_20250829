/**
 * Enhanced PDF Generator for Employment-Type-Specific Salary Statements
 * 고용형태별 급여명세서 PDF 생성기
 */

// 한글 폰트 설정 (실제 환경에서는 폰트 파일이 필요)
declare module 'jspdf' {
  interface jsPDF {
    addFileToVFS(filename: string, content: string): jsPDF
    addFont(postScriptName: string, id: string, fontStyle: string): string
  }
}

export interface EnhancedSalaryPDFData {
  worker: {
    id: string
    name: string
    employee_number?: string
    department?: string
    position?: string
  }
  company: {
    name: string
    address: string
    representative?: string
    business_number?: string
  }
  salary_period: {
    year: number
    month: number
    work_period: string // "2024.01.01 ~ 2024.01.31"
  }
  salary_calculation: EnhancedSalaryCalculationResult
  bank_account?: {
    bank_name: string
    account_number: string
    account_holder: string
  }
  additional_info?: {
    notes?: string
    issued_date: string
    issued_by?: string
  }
}

/**
 * 고용형태별 PDF 템플릿 클래스
 */
abstract class EmploymentTypePDFTemplate {
  protected doc: jsPDF
  protected data: EnhancedSalaryPDFData

  constructor(data: EnhancedSalaryPDFData) {
    this.doc = new jsPDF('p', 'mm', 'a4')
    this.data = data
    this.setupFont()
  }

  protected setupFont() {
    // 기본 폰트 설정 (한글 지원을 위해 실제 환경에서는 한글 폰트 필요)
    this.doc.setFont('helvetica', 'normal')
  }

  protected drawHeader() {
    const { company, salary_period } = this.data

    // 제목
    this.doc.setFontSize(18)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('급여명세서', 105, 20, { align: 'center' })

    // 부제목 (고용형태별)
    this.doc.setFontSize(12)
    const employment_label = EMPLOYMENT_TYPE_LABELS[this.data.salary_calculation.employment_type]
    this.doc.text(`(${employment_label})`, 105, 28, { align: 'center' })

    // 회사 정보
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(company.name, 20, 40)
    this.doc.text(company.address, 20, 46)

    // 급여 지급 기간
    this.doc.text(`지급기간: ${salary_period.work_period}`, 140, 40)
    this.doc.text(
      `발급일: ${this.data.additional_info?.issued_date || new Date().toLocaleDateString('ko-KR')}`,
      140,
      46
    )

    // 구분선
    this.doc.setDrawColor(0, 0, 0)
    this.doc.line(20, 52, 190, 52)
  }

  protected drawWorkerInfo() {
    const { worker } = this.data
    const startY = 60

    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('직원 정보', 20, startY)

    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`성명: ${worker.name}`, 20, startY + 8)
    if (worker.employee_number) {
      this.doc.text(`사번: ${worker.employee_number}`, 20, startY + 16)
    }
    if (worker.department) {
      this.doc.text(`부서: ${worker.department}`, 100, startY + 8)
    }
    if (worker.position) {
      this.doc.text(`직급: ${worker.position}`, 100, startY + 16)
    }
  }

  protected drawSalaryDetails() {
    const { salary_calculation } = this.data
    let currentY = 90

    // 급여 상세 제목
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('급여 상세', 20, currentY)

    currentY += 10

    // 테이블 헤더
    this.drawTableRow(['항목', '내용', '금액'], currentY, true)
    currentY += 8

    // 기본 정보
    this.drawTableRow(['일급', '', `${salary_calculation.daily_rate.toLocaleString()}원`], currentY)
    currentY += 6

    const labor_hours = salary_calculation.tax_details?.labor_hours || 0
    this.drawTableRow(['총 공수', '', `${labor_hours.toFixed(2)}공수`], currentY)
    currentY += 6

    // 지급 내역
    this.drawTableRow(['기본급', '', `${salary_calculation.base_pay.toLocaleString()}원`], currentY)
    currentY += 6

    // 총 지급액
    this.doc.setFont('helvetica', 'bold')
    this.drawTableRow(
      ['총 지급액', '', `${salary_calculation.gross_pay.toLocaleString()}원`],
      currentY
    )
    currentY += 8

    return currentY
  }

  protected abstract drawDeductionDetails(startY: number): number

  protected drawSummary(startY: number) {
    const { salary_calculation } = this.data

    // 요약 테이블
    this.doc.setFillColor(240, 240, 240)
    this.doc.rect(20, startY, 170, 20, 'F')

    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('총 지급액', 25, startY + 7)
    this.doc.text(`${salary_calculation.gross_pay.toLocaleString()}원`, 70, startY + 7)

    this.doc.text('총 공제액', 25, startY + 14)
    this.doc.text(`${salary_calculation.total_tax.toLocaleString()}원`, 70, startY + 14)

    this.doc.text('실 수령액', 120, startY + 10)
    this.doc.setFontSize(14)
    this.doc.text(`${salary_calculation.net_pay.toLocaleString()}원`, 160, startY + 10)
  }

  protected drawBankInfo() {
    if (!this.data.bank_account) return

    const { bank_account } = this.data
    const startY = 240

    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('입금계좌 정보', 20, startY)
    this.doc.text(`은행: ${bank_account.bank_name}`, 20, startY + 8)
    this.doc.text(`계좌번호: ${bank_account.account_number}`, 20, startY + 16)
    this.doc.text(`예금주: ${bank_account.account_holder}`, 20, startY + 24)
  }

  protected drawFooter() {
    const startY = 270

    this.doc.setFontSize(8)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('본 급여명세서는 전자문서로 발급되었습니다.', 105, startY, { align: 'center' })

    if (this.data.additional_info?.issued_by) {
      this.doc.text(`발급자: ${this.data.additional_info.issued_by}`, 105, startY + 6, {
        align: 'center',
      })
    }
  }

  protected drawTableRow(items: string[], y: number, isHeader = false) {
    const colWidths = [60, 60, 50]
    let x = 20

    this.doc.setFontSize(9)
    if (isHeader) {
      this.doc.setFont('helvetica', 'bold')
      this.doc.setFillColor(250, 250, 250)
      this.doc.rect(x, y - 4, 170, 6, 'F')
    } else {
      this.doc.setFont('helvetica', 'normal')
    }

    for (let i = 0; i < items.length; i++) {
      if (i === 2) {
        // 금액 컬럼은 우측 정렬
        this.doc.text(items[i], x + colWidths[i] - 5, y, { align: 'right' })
      } else {
        this.doc.text(items[i], x + 5, y)
      }
      x += colWidths[i]
    }
  }

  public abstract generate(): Uint8Array
}

/**
 * 4대보험 직원 급여명세서 템플릿
 */
class RegularEmployeePDFTemplate extends EmploymentTypePDFTemplate {
  protected drawDeductionDetails(startY: number): number {
    const { salary_calculation } = this.data
    const { deductions } = salary_calculation
    let currentY = startY

    // 공제 내역 제목
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('공제 내역', 20, currentY)
    currentY += 10

    // 공제 테이블 헤더
    this.drawTableRow(['공제 항목', '세율', '공제액'], currentY, true)
    currentY += 8

    // 4대보험 공제 내역
    const deductionItems = [
      { name: '소득세', rate: '3.3%', amount: deductions.income_tax },
      { name: '주민세', rate: '0.33%', amount: deductions.resident_tax },
      { name: '국민연금', rate: '4.5%', amount: deductions.national_pension },
      { name: '건강보험', rate: '3.545%', amount: deductions.health_insurance },
      { name: '고용보험', rate: '0.9%', amount: deductions.employment_insurance },
    ]

    deductionItems.forEach(item => {
      if (item.amount > 0) {
        this.drawTableRow([item.name, item.rate, `${item.amount.toLocaleString()}원`], currentY)
        currentY += 6
      }
    })

    if (deductions.other_deductions > 0) {
      this.drawTableRow(
        ['기타 공제', '', `${deductions.other_deductions.toLocaleString()}원`],
        currentY
      )
      currentY += 6
    }

    // 총 공제액
    this.doc.setFont('helvetica', 'bold')
    this.drawTableRow(
      ['총 공제액', '', `${salary_calculation.total_tax.toLocaleString()}원`],
      currentY
    )
    currentY += 10

    return currentY
  }

  public generate(): Uint8Array {
    this.drawHeader()
    this.drawWorkerInfo()

    const afterSalaryY = this.drawSalaryDetails()
    const afterDeductionY = this.drawDeductionDetails(afterSalaryY + 5)

    this.drawSummary(afterDeductionY + 5)
    this.drawBankInfo()
    this.drawFooter()

    return this.doc.output('arraybuffer') as Uint8Array
  }
}

/**
 * 프리랜서 급여명세서 템플릿
 */
class FreelancerPDFTemplate extends EmploymentTypePDFTemplate {
  protected drawDeductionDetails(startY: number): number {
    const { salary_calculation } = this.data
    const { deductions } = salary_calculation
    let currentY = startY

    // 세금 공제 제목
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('세금 공제', 20, currentY)
    currentY += 10

    // 공제 테이블 헤더
    this.drawTableRow(['세금 항목', '세율', '공제액'], currentY, true)
    currentY += 8

    // 프리랜서 세금 공제 내역
    const deductionItems = [
      { name: '사업소득세', rate: '3.3%', amount: deductions.income_tax },
      { name: '지방소득세', rate: '0.33%', amount: deductions.resident_tax },
    ]

    deductionItems.forEach(item => {
      if (item.amount > 0) {
        this.drawTableRow([item.name, item.rate, `${item.amount.toLocaleString()}원`], currentY)
        currentY += 6
      }
    })

    if (deductions.other_deductions > 0) {
      this.drawTableRow(
        ['기타 공제', '', `${deductions.other_deductions.toLocaleString()}원`],
        currentY
      )
      currentY += 6
    }

    // 총 공제액
    this.doc.setFont('helvetica', 'bold')
    this.drawTableRow(
      ['총 세액', '', `${salary_calculation.total_tax.toLocaleString()}원`],
      currentY
    )
    currentY += 10

    return currentY
  }

  public generate(): Uint8Array {
    this.drawHeader()
    this.drawWorkerInfo()

    const afterSalaryY = this.drawSalaryDetails()
    const afterDeductionY = this.drawDeductionDetails(afterSalaryY + 5)

    this.drawSummary(afterDeductionY + 5)
    this.drawBankInfo()
    this.drawFooter()

    return this.doc.output('arraybuffer') as Uint8Array
  }
}

/**
 * 일용직 급여명세서 템플릿
 */
class DailyWorkerPDFTemplate extends EmploymentTypePDFTemplate {
  protected drawDeductionDetails(startY: number): number {
    const { salary_calculation } = this.data
    const { deductions } = salary_calculation
    let currentY = startY

    // 세금 공제 제목
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('세금 공제', 20, currentY)
    currentY += 10

    // 공제 테이블 헤더
    this.drawTableRow(['세금 항목', '세율', '공제액'], currentY, true)
    currentY += 8

    // 일용직 세금 공제 내역
    const deductionItems = [
      { name: '일용근로소득세', rate: '6.0%', amount: deductions.income_tax },
      { name: '지방소득세', rate: '0.6%', amount: deductions.resident_tax },
    ]

    deductionItems.forEach(item => {
      if (item.amount > 0) {
        this.drawTableRow([item.name, item.rate, `${item.amount.toLocaleString()}원`], currentY)
        currentY += 6
      }
    })

    if (deductions.other_deductions > 0) {
      this.drawTableRow(
        ['기타 공제', '', `${deductions.other_deductions.toLocaleString()}원`],
        currentY
      )
      currentY += 6
    }

    // 총 공제액
    this.doc.setFont('helvetica', 'bold')
    this.drawTableRow(
      ['총 세액', '', `${salary_calculation.total_tax.toLocaleString()}원`],
      currentY
    )
    currentY += 10

    return currentY
  }

  public generate(): Uint8Array {
    this.drawHeader()
    this.drawWorkerInfo()

    const afterSalaryY = this.drawSalaryDetails()
    const afterDeductionY = this.drawDeductionDetails(afterSalaryY + 5)

    this.drawSummary(afterDeductionY + 5)
    this.drawBankInfo()
    this.drawFooter()

    return this.doc.output('arraybuffer') as Uint8Array
  }
}

/**
 * 고용형태별 PDF 생성 팩토리 함수
 */
export function generateEnhancedSalaryPDF(data: EnhancedSalaryPDFData): Uint8Array {
  const employment_type = data.salary_calculation.employment_type

  let template: EmploymentTypePDFTemplate

  switch (employment_type) {
    case 'regular_employee':
      template = new RegularEmployeePDFTemplate(data)
      break
    case 'freelancer':
      template = new FreelancerPDFTemplate(data)
      break
    case 'daily_worker':
      template = new DailyWorkerPDFTemplate(data)
      break
    default:
      throw new Error(`Unsupported employment type: ${employment_type}`)
  }

  return template.generate()
}

/**
 * PDF 다운로드 함수
 */
export function downloadEnhancedSalaryPDF(data: EnhancedSalaryPDFData, filename?: string) {
  const pdfBuffer = generateEnhancedSalaryPDF(data)
  const blob = new Blob([pdfBuffer], { type: 'application/pdf' })

  const defaultFilename = `급여명세서_${data.worker.name}_${data.salary_period.year}년${data.salary_period.month}월.pdf`

  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename || defaultFilename
  link.click()

  URL.revokeObjectURL(link.href)
}

/**
 * PDF Blob 생성 (미리보기용)
 */
export function getEnhancedSalaryPDFBlob(data: EnhancedSalaryPDFData): Blob {
  const pdfBuffer = generateEnhancedSalaryPDF(data)
  return new Blob([pdfBuffer], { type: 'application/pdf' })
}

/**
 * 샘플 데이터 생성 함수 (테스트용)
 */
export function createSamplePDFData(
  employment_type: EmploymentType = 'regular_employee'
): EnhancedSalaryPDFData {
  const sampleCalculation: EnhancedSalaryCalculationResult = {
    worker_id: 'sample-worker-id',
    employment_type,
    daily_rate: 150000,
    gross_pay: 180000,
    base_pay: 150000,
    deductions: {
      income_tax: employment_type === 'daily_worker' ? 10800 : 5940,
      resident_tax: employment_type === 'daily_worker' ? 1080 : 594,
      national_pension: employment_type === 'regular_employee' ? 8100 : 0,
      health_insurance: employment_type === 'regular_employee' ? 6381 : 0,
      employment_insurance: employment_type === 'regular_employee' ? 1620 : 0,
      other_deductions: 0,
    },
    total_tax:
      employment_type === 'regular_employee'
        ? 22635
        : employment_type === 'daily_worker'
          ? 11880
          : 6534,
    net_pay:
      employment_type === 'regular_employee'
        ? 157365
        : employment_type === 'daily_worker'
          ? 168120
          : 173466,
    tax_details: {
      labor_hours: 1.2,
      additional_deductions: 0,
    },
  }

  return {
    worker: {
      id: 'sample-worker-id',
      name: '김건설',
      employee_number: 'EMP001',
      department: '현장팀',
      position: '작업자',
    },
    company: {
      name: '(주)건설회사',
      address: '서울시 강남구 테헤란로 123',
      representative: '대표이사 홍길동',
      business_number: '123-45-67890',
    },
    salary_period: {
      year: 2024,
      month: 12,
      work_period: '2024.12.01 ~ 2024.12.31',
    },
    salary_calculation: sampleCalculation,
    bank_account: {
      bank_name: '국민은행',
      account_number: '123456-12-123456',
      account_holder: '김건설',
    },
    additional_info: {
      issued_date: new Date().toLocaleDateString('ko-KR'),
      issued_by: '인사팀',
      notes: '급여명세서 샘플입니다.',
    },
  }
}
