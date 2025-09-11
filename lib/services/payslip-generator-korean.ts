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
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
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
    
    html {
      height: 100%;
      overflow: auto;
      -webkit-overflow-scrolling: touch;
      scroll-behavior: smooth;
    }
    
    body {
      font-family: 'Malgun Gothic', '맑은 고딕', sans-serif;
      line-height: 1.4;
      color: #333;
      background: #f8fafc;
      font-size: 14px;
      min-height: 100vh;
      height: auto;
      overflow: auto;
      -webkit-overflow-scrolling: touch;
      position: relative;
      /* iOS Safari 스크롤 버그 해결 */
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
    }
    
    .container {
      max-width: 100%;
      margin: 0 auto;
      padding: 15px;
      background: white;
      min-height: 100vh;
      height: auto;
      overflow: visible;
      position: relative;
      padding-bottom: 50px;
      /* iOS 스크롤 개선 */
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
    }
    
    /* 네비게이션 버튼 */
    .nav-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
      position: sticky;
      top: 0;
      background: white;
      z-index: 100;
    }
    
    .back-button {
      display: inline-flex;
      align-items: center;
      padding: 8px 16px;
      background: #3b82f6;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
      border: none;
      cursor: pointer;
    }
    
    .back-button:hover {
      background: #2563eb;
      transform: translateY(-1px);
    }
    
    .back-arrow {
      margin-right: 8px;
      font-size: 16px;
    }
    
    .print-button {
      display: inline-flex;
      align-items: center;
      padding: 8px 16px;
      background: #10b981;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
      border: none;
      cursor: pointer;
    }
    
    .print-button:hover {
      background: #059669;
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
      grid-template-columns: 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }
    
    .compact-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
      margin-bottom: 10px;
    }
    
    @media (min-width: 480px) {
      .compact-grid {
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
    }
    
    @media (min-width: 768px) {
      .two-columns {
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-bottom: 10px;
      }
      
      .container {
        max-width: 210mm;
        padding: 10px;
      }
      
      body {
        font-size: 11px;
        background: white;
      }
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
      grid-template-columns: 1fr;
      gap: 8px;
    }
    
    .info-grid-3 {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
    }
    
    .compact-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin: 5px 0;
    }
    
    @media (min-width: 480px) {
      .info-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }
      
      .compact-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }
    }
    
    @media (min-width: 768px) {
      .info-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 5px;
      }
      
      .info-grid-3 {
        grid-template-columns: repeat(3, 1fr);
        gap: 5px;
      }
      
      .compact-grid {
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
      }
      
      .info-item {
        font-size: 10px;
      }
      
      .info-label {
        min-width: 50px;
      }
    }
    
    .info-item {
      display: flex;
      align-items: center;
      font-size: 14px;
      padding: 8px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    
    .info-item:last-child {
      border-bottom: none;
    }
    
    .info-label {
      font-weight: 600;
      color: #6b7280;
      margin-right: 8px;
      min-width: 80px;
      flex-shrink: 0;
    }
    
    .info-value {
      color: #111827;
      font-weight: 500;
      word-break: break-word;
      flex: 1;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      border: 1px solid #e5e7eb;
    }
    
    @media (max-width: 767px) {
      table {
        font-size: 10px;
      }
      
      th {
        padding: 6px 4px;
        font-size: 10px;
        line-height: 1.2;
      }
      
      td {
        padding: 6px 4px;
        line-height: 1.3;
      }
    }
    
    @media (min-width: 768px) {
      table {
        font-size: 10px;
      }
      
      th {
        padding: 5px;
        font-size: 10px;
      }
      
      td {
        padding: 4px 5px;
      }
    }
    
    th {
      background: #f9fafb;
      padding: 8px 6px;
      text-align: left;
      font-weight: 600;
      color: #4b5563;
      border-bottom: 1px solid #e5e7eb;
      font-size: 11px;
      border-right: 1px solid #e5e7eb;
    }
    
    th:last-child {
      border-right: none;
    }
    
    td {
      padding: 8px 6px;
      border-bottom: 1px solid #f3f4f6;
      border-right: 1px solid #f3f4f6;
      vertical-align: top;
    }
    
    td:last-child {
      border-right: none;
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
      padding: 8px;
      border-radius: 4px;
      margin-top: 8px;
      font-size: 11px;
      color: #92400e;
      line-height: 1.4;
      border-left: 3px solid #f59e0b;
    }
    
    .calculation-summary {
      background: #f0f9ff;
      border: 1px solid #0ea5e9;
      border-radius: 6px;
      padding: 10px;
      margin: 10px 0;
      font-size: 12px;
      color: #0369a1;
    }
    
    .calculation-summary strong {
      color: #075985;
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
        background: white !important;
        font-size: 11px;
      }
      
      .container {
        padding: 0;
        background: white;
      }
      
      .nav-header {
        display: none !important;
      }
      
      .two-columns {
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-bottom: 10px;
      }
      
      .info-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 5px;
      }
      
      .info-item {
        font-size: 10px;
        padding: 2px 0;
        border-bottom: none;
      }
      
      .info-label {
        min-width: 50px;
      }
      
      table {
        font-size: 10px;
      }
      
      th {
        padding: 5px;
        font-size: 10px;
      }
      
      td {
        padding: 4px 5px;
      }
      
      .section {
        break-inside: avoid;
      }
    }
    /* 모바일 특화 스크롤 개선 */
    @media (max-width: 767px) {
      html, body {
        height: 100%;
        overflow: auto !important;
        -webkit-overflow-scrolling: touch !important;
      }
      
      .container {
        min-height: auto;
        height: auto;
        overflow: visible !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Navigation Header -->
    <div class="nav-header">
      <button onclick="history.back()" class="back-button">
        <span class="back-arrow">←</span>
        메인화면으로
      </button>
      <button onclick="window.print()" class="print-button">
        🖨️ 인쇄하기
      </button>
    </div>
    
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
              <span class="info-value">${data.salary.total_labor_hours.toFixed(2)}시간</span>
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
    
    <!-- Detailed Calculation Section -->
    <div class="section">
      <div class="section-title">상세 계산 내역</div>
      <div class="section-content">
        <div class="compact-grid">
          <div class="info-item">
            <span class="info-label">기본시급:</span>
            <span class="info-value">${((data.salary.base_pay / data.salary.work_days) / 8).toLocaleString()}원/시간</span>
          </div>
          <div class="info-item">
            <span class="info-label">연장시급:</span>
            <span class="info-value">${(((data.salary.base_pay / data.salary.work_days) / 8) * 1.5).toLocaleString()}원/시간</span>
          </div>
          <div class="info-item">
            <span class="info-label">정규시간:</span>
            <span class="info-value">${(data.salary.work_days * 8).toFixed(0)}시간</span>
          </div>
          <div class="info-item">
            <span class="info-label">연장시간:</span>
            <span class="info-value">${data.salary.total_overtime_hours.toFixed(2)}시간</span>
          </div>
        </div>
        <div class="tax-info">
          <strong>💡 계산공식:</strong> 기본급 = 일당(${(data.salary.base_pay / data.salary.work_days).toLocaleString()}원) × 근무일수(${data.salary.work_days}일)
          ${data.salary.overtime_pay > 0 ? `<br>연장수당 = 기본시급 × 1.5배 × 연장시간(${data.salary.total_overtime_hours.toFixed(2)}시간)` : ''}
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
                <th class="text-center">계산식</th>
                <th class="text-right">금액</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>기본급</td>
                <td class="text-center">${(data.salary.base_pay / data.salary.work_days).toLocaleString()}원 × ${data.salary.work_days}일</td>
                <td class="text-right amount">${data.salary.base_pay.toLocaleString()}</td>
              </tr>
              ${data.salary.overtime_pay > 0 ? `
              <tr>
                <td>연장수당</td>
                <td class="text-center">${((((data.salary.base_pay / data.salary.work_days) / 8) * 1.5)).toLocaleString()}원 × ${data.salary.total_overtime_hours.toFixed(1)}h</td>
                <td class="text-right amount">${data.salary.overtime_pay.toLocaleString()}</td>
              </tr>
              ` : ''}
              <tr style="border-top: 2px solid #e5e7eb;">
                <td><strong>총 지급액</strong></td>
                <td class="text-center">${data.salary.base_pay.toLocaleString()} + ${data.salary.overtime_pay.toLocaleString()}</td>
                <td class="text-right amount"><strong>${data.salary.total_gross_pay.toLocaleString()}</strong></td>
              </tr>
            </tbody>
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
                <th class="text-center">계산식 (기준: ${data.salary.total_gross_pay.toLocaleString()}원)</th>
                <th class="text-right">금액</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>소득세</td>
                <td class="text-center">${data.salary.total_gross_pay.toLocaleString()} × ${employmentType === '프리랜서' ? '3.3%' : employmentType === '일용직' ? '2.97%' : '8%'}</td>
                <td class="text-right deduction">${data.salary.tax_deduction.toLocaleString()}</td>
              </tr>
              ${data.salary.national_pension > 0 ? `
              <tr>
                <td>국민연금</td>
                <td class="text-center">${data.salary.total_gross_pay.toLocaleString()} × 4.5%</td>
                <td class="text-right deduction">${data.salary.national_pension.toLocaleString()}</td>
              </tr>
              ` : ''}
              ${data.salary.health_insurance > 0 ? `
              <tr>
                <td>건강보험</td>
                <td class="text-center">${data.salary.total_gross_pay.toLocaleString()} × 3.43%</td>
                <td class="text-right deduction">${data.salary.health_insurance.toLocaleString()}</td>
              </tr>
              ` : ''}
              ${data.salary.employment_insurance > 0 ? `
              <tr>
                <td>고용보험</td>
                <td class="text-center">${data.salary.total_gross_pay.toLocaleString()} × 0.9%</td>
                <td class="text-right deduction">${data.salary.employment_insurance.toLocaleString()}</td>
              </tr>
              ` : ''}
              <tr style="border-top: 2px solid #e5e7eb;">
                <td><strong>총 공제액</strong></td>
                <td class="text-center">${data.salary.tax_deduction.toLocaleString()} + ${data.salary.national_pension.toLocaleString()} + ${data.salary.health_insurance.toLocaleString()} + ${data.salary.employment_insurance.toLocaleString()}</td>
                <td class="text-right deduction"><strong>${data.salary.total_deductions.toLocaleString()}</strong></td>
              </tr>
            </tbody>
          </table>
          <div class="tax-info">
            <strong>📋 공제 기준:</strong> ${employmentType === '프리랜서' ? '프리랜서 간이세율 적용 (국민연금, 건강보험, 고용보험 제외)' : employmentType === '일용직' ? '일용근로자 기준 (국민연금, 건강보험, 고용보험 제외)' : '정규직 4대보험 전체 적용'}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Final Calculation Summary -->
    <div class="calculation-summary">
      <strong>💰 최종 계산 요약</strong><br>
      <div class="compact-grid" style="margin-top: 8px;">
        <div>• 총 지급액: <strong>${data.salary.total_gross_pay.toLocaleString()}원</strong></div>
        <div>• 총 공제액: <strong>${data.salary.total_deductions.toLocaleString()}원</strong></div>
        <div>• 실 지급액: <strong style="color: #dc2626;">${data.salary.net_pay.toLocaleString()}원</strong></div>
        <div>• 공제율: <strong>${((data.salary.total_deductions / data.salary.total_gross_pay) * 100).toFixed(1)}%</strong></div>
      </div>
    </div>
    
    <div class="net-pay-section">
      <div class="net-pay-label">
        <div>실지급액</div>
        <div style="font-size: 11px; opacity: 0.9; margin-top: 2px;">
          총지급액 - 총공제액<br>
          ${data.salary.total_gross_pay.toLocaleString()} - ${data.salary.total_deductions.toLocaleString()}
        </div>
      </div>
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