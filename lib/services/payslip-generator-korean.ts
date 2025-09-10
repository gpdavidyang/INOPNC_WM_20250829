/**
 * 한글 지원 급여명세서 PDF 생성 서비스
 * jsPDF 대신 HTML/CSS 기반으로 생성하여 한글 깨짐 문제 해결
 */

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

export class PayslipGeneratorKorean {
  /**
   * HTML 기반 급여명세서 생성
   */
  generateHTML(data: PayslipData): string {
    // 날짜 포맷
    let periodText = ''
    try {
      if (data.salary.period_start) {
        const periodDate = new Date(data.salary.period_start)
        if (!isNaN(periodDate.getTime())) {
          periodText = format(periodDate, 'yyyy년 MM월', { locale: ko })
        } else {
          periodText = format(new Date(), 'yyyy년 MM월', { locale: ko })
        }
      }
    } catch {
      periodText = format(new Date(), 'yyyy년 MM월', { locale: ko })
    }

    const paymentDateText = format(data.paymentDate, 'yyyy년 MM월 dd일', { locale: ko })
    const todayText = format(new Date(), 'yyyy년 MM월 dd일', { locale: ko })

    // 급여방식별 텍스트
    const employmentType = data.employee.department || '일용직'
    const taxRateText = this.getTaxRateText(employmentType, data.salary)

    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>급여명세서 - ${data.employee.name}</title>
  <style>
    @page {
      size: A4;
      margin: 10mm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Malgun Gothic', '맑은 고딕', sans-serif;
      line-height: 1.3;
      color: #333;
      background: white;
      font-size: 11px;
    }
    
    .container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 10px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 15px;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 10px;
      position: relative;
    }
    
    .header h1 {
      font-size: 20px;
      margin-bottom: 5px;
      color: #1e40af;
    }
    
    .header .period {
      font-size: 14px;
      color: #64748b;
    }
    
    .header .company {
      position: absolute;
      top: 0;
      right: 0;
      font-size: 12px;
      font-weight: bold;
      color: #64748b;
    }
    
    .two-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }
    
    .section {
      margin-bottom: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 5px;
      overflow: hidden;
    }
    
    .section-title {
      background: #f3f4f6;
      padding: 5px 10px;
      font-weight: bold;
      font-size: 12px;
      color: #1f2937;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .section-content {
      padding: 8px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 5px;
    }
    
    .info-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 5px;
    }
    
    .info-item {
      display: flex;
      align-items: center;
      font-size: 10px;
    }
    
    .info-label {
      font-weight: 600;
      color: #6b7280;
      margin-right: 5px;
      min-width: 50px;
    }
    
    .info-value {
      color: #111827;
      font-weight: 500;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    
    th {
      background: #f9fafb;
      padding: 5px;
      text-align: left;
      font-weight: 600;
      color: #4b5563;
      border-bottom: 1px solid #e5e7eb;
      font-size: 10px;
    }
    
    td {
      padding: 4px 5px;
      border-bottom: 1px solid #f3f4f6;
    }
    
    .text-right {
      text-align: right;
    }
    
    .text-center {
      text-align: center;
    }
    
    .amount {
      font-weight: 600;
      color: #111827;
    }
    
    .deduction {
      color: #dc2626;
    }
    
    .net-pay-section {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      padding: 10px;
      border-radius: 5px;
      text-align: center;
      margin: 10px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .net-pay-label {
      font-size: 14px;
      font-weight: bold;
    }
    
    .net-pay-amount {
      font-size: 20px;
      font-weight: bold;
    }
    
    .net-pay-korean {
      font-size: 10px;
      opacity: 0.9;
    }
    
    .footer {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      font-size: 9px;
      color: #6b7280;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .footer-info {
      flex: 1;
    }
    
    .stamp {
      text-align: center;
      padding: 8px;
      border: 1px solid #cbd5e1;
      border-radius: 5px;
      background: #f8fafc;
      font-size: 10px;
      width: 200px;
    }
    
    .tax-info {
      background: #fef3c7;
      padding: 5px;
      border-radius: 3px;
      margin-top: 5px;
      font-size: 10px;
      color: #92400e;
    }
    
    .compact-table {
      display: flex;
      gap: 10px;
    }
    
    .compact-table > div {
      flex: 1;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .container {
        padding: 0;
      }
      
      .section {
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="company">${data.company.name}</div>
      <h1>급여명세서</h1>
      <div class="period">${periodText}</div>
    </div>
    
    <div class="two-columns">
      <div class="section">
        <div class="section-title">직원 정보</div>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">성명:</span>
              <span class="info-value">${data.employee.name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">사번:</span>
              <span class="info-value">${data.employee.employeeNumber || data.employee.id.slice(0, 8)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">현장:</span>
              <span class="info-value">${data.site.name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">급여방식:</span>
              <span class="info-value">${employmentType}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">근무 정보</div>
        <div class="section-content">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">근무일수:</span>
              <span class="info-value">${data.salary.work_days}일</span>
            </div>
            <div class="info-item">
              <span class="info-label">노동시간:</span>
              <span class="info-value">${data.salary.total_labor_hours.toFixed(1)}시간</span>
            </div>
            <div class="info-item">
              <span class="info-label">공수:</span>
              <span class="info-value">${(data.salary.total_labor_hours / 8).toFixed(2)}공수</span>
            </div>
            <div class="info-item">
              <span class="info-label">일당:</span>
              <span class="info-value">${(data.salary.base_pay / data.salary.work_days).toLocaleString()}원</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="two-columns">
      <div class="section">
        <div class="section-title">지급 내역</div>
        <div class="section-content">
          <table>
            <thead>
              <tr>
                <th>항목</th>
                <th class="text-center">기준</th>
                <th class="text-right">금액</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>기본급</td>
                <td class="text-center">${data.salary.work_days}일</td>
                <td class="text-right amount">${data.salary.base_pay.toLocaleString()}</td>
              </tr>
              ${data.salary.overtime_pay > 0 ? `
              <tr>
                <td>연장수당</td>
                <td class="text-center">${data.salary.total_overtime_hours.toFixed(1)}h</td>
                <td class="text-right amount">${data.salary.overtime_pay.toLocaleString()}</td>
              </tr>
              ` : ''}
            </tbody>
            <tfoot>
              <tr style="background:#f3f4f6;">
                <th colspan="2">합계</th>
                <th class="text-right amount">${data.salary.total_gross_pay.toLocaleString()}</th>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">공제 내역</div>
        <div class="section-content">
          <table>
            <thead>
              <tr>
                <th>항목</th>
                <th class="text-center">세율</th>
                <th class="text-right">금액</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>소득세</td>
                <td class="text-center">${employmentType === '프리랜서' ? '3.3%' : employmentType === '일용직' ? '2.97%' : '8%'}</td>
                <td class="text-right deduction">${data.salary.tax_deduction.toLocaleString()}</td>
              </tr>
              ${data.salary.national_pension > 0 ? `
              <tr>
                <td>국민연금</td>
                <td class="text-center">4.5%</td>
                <td class="text-right deduction">${data.salary.national_pension.toLocaleString()}</td>
              </tr>
              ` : ''}
              ${data.salary.health_insurance > 0 ? `
              <tr>
                <td>건강보험</td>
                <td class="text-center">3.5%</td>
                <td class="text-right deduction">${data.salary.health_insurance.toLocaleString()}</td>
              </tr>
              ` : ''}
              ${data.salary.employment_insurance > 0 ? `
              <tr>
                <td>고용보험</td>
                <td class="text-center">0.9%</td>
                <td class="text-right deduction">${data.salary.employment_insurance.toLocaleString()}</td>
              </tr>
              ` : ''}
            </tbody>
            <tfoot>
              <tr style="background:#fee;">
                <th colspan="2">합계</th>
                <th class="text-right deduction">${data.salary.total_deductions.toLocaleString()}</th>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
    
    <div class="net-pay-section">
      <div class="net-pay-label">실지급액</div>
      <div>
        <div class="net-pay-amount">${data.salary.net_pay.toLocaleString()}원</div>
        <div class="net-pay-korean">(${this.numberToKorean(data.salary.net_pay)})</div>
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-info">
        <strong>지급일:</strong> ${paymentDateText} | 
        <strong>지급방법:</strong> ${data.paymentMethod || '계좌이체'}<br>
        <strong>${data.company.name}</strong> | ${data.company.address || '서울특별시 강남구'} | ${data.company.phone || '02-1234-5678'} | 사업자: ${data.company.registrationNumber || '123-45-67890'}
      </div>
      <div class="stamp">
        <strong>급여 지급 확인</strong><br>
        위 금액을 정확히 지급하였음을 확인합니다.<br>
        <small>${todayText} 발행</small>
      </div>
    </div>
  </div>
</body>
</html>
    `
  }

  /**
   * 세율 텍스트 생성
   */
  private getTaxRateText(employmentType: string, salary: MonthlySalary): string {
    switch(employmentType) {
      case '프리랜서':
        return '3.3% (간이세율)'
      case '일용직':
        return '2.97% (일용근로)'
      case '4대보험직원':
        return '근로소득세율'
      default:
        return '기본세율'
    }
  }

  /**
   * 숫자를 한글로 변환
   */
  private numberToKorean(num: number): string {
    const units = ['', '만', '억', '조']
    const nums = ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구']
    
    if (num === 0) return '영원'
    
    let result = ''
    let unitIndex = 0
    
    while (num > 0) {
      const part = num % 10000
      if (part > 0) {
        let partStr = ''
        let temp = part
        let digit = 0
        
        while (temp > 0) {
          const n = temp % 10
          if (n > 0) {
            const digitUnit = ['', '십', '백', '천'][digit]
            partStr = nums[n] + digitUnit + partStr
          }
          temp = Math.floor(temp / 10)
          digit++
        }
        
        result = partStr + units[unitIndex] + ' ' + result
      }
      num = Math.floor(num / 10000)
      unitIndex++
    }
    
    return result.trim() + '원'
  }

  /**
   * HTML을 PDF Blob으로 변환 (브라우저 환경)
   */
  async generatePDFFromHTML(html: string): Promise<Blob> {
    // 브라우저 환경에서만 동작
    // 서버사이드에서는 puppeteer 등을 사용해야 함
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    return blob
  }

  /**
   * PDF 생성 (기존 인터페이스 호환)
   */
  async generatePDF(data: PayslipData): Promise<Blob> {
    const html = this.generateHTML(data)
    // HTML을 반환 (실제 PDF 변환은 브라우저나 별도 서비스에서 처리)
    return new Blob([html], { type: 'text/html;charset=utf-8' })
  }
}

// 싱글톤 인스턴스
export const payslipGeneratorKorean = new PayslipGeneratorKorean()