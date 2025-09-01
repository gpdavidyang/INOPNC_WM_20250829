import { SalaryCalculationResult } from './calculator'

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

export class SalaryPDFGeneratorHTML {
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  private formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  public generateHTML(data: SalaryPDFData): string {
    const { calculation } = data;
    
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>급여명세서 - ${data.workerName} ${data.salaryYear}년 ${data.salaryMonth}월</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
      background: white;
    }
    
    .container {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 20mm;
      background: white;
    }
    
    @media print {
      body {
        margin: 0;
      }
      .container {
        width: 100%;
        margin: 0;
        padding: 15mm;
        page-break-after: always;
      }
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #333;
    }
    
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 5px;
      color: #1a1a1a;
    }
    
    .header .subtitle {
      font-size: 14px;
      color: #666;
      font-weight: 300;
    }
    
    .header-info {
      display: flex;
      justify-content: space-between;
      margin-top: 15px;
      font-size: 11px;
      color: #666;
    }
    
    .section {
      margin-bottom: 25px;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px 30px;
      margin-bottom: 15px;
    }
    
    .info-item {
      display: flex;
      font-size: 11px;
    }
    
    .info-label {
      font-weight: 500;
      color: #666;
      min-width: 80px;
      margin-right: 10px;
    }
    
    .info-value {
      color: #333;
      font-weight: 400;
    }
    
    .salary-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 11px;
    }
    
    .salary-table th,
    .salary-table td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .salary-table th {
      background-color: #f8f9fa;
      font-weight: 600;
      color: #333;
      font-size: 12px;
    }
    
    .salary-table td {
      color: #555;
    }
    
    .salary-table .amount {
      text-align: right;
      font-weight: 500;
      font-family: 'Courier New', monospace;
    }
    
    .salary-table .subtotal-row {
      background-color: #fafafa;
      font-weight: 500;
    }
    
    .salary-table .total-row {
      background-color: #f0f0f0;
      font-weight: 700;
      font-size: 13px;
    }
    
    .salary-table .total-row td {
      padding: 12px;
      border-top: 2px solid #333;
      border-bottom: 2px solid #333;
      color: #000;
    }
    
    .deduction {
      color: #dc3545;
    }
    
    .bank-info {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      margin-top: 20px;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }
    
    .footer-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 20px;
    }
    
    .signature-area {
      text-align: right;
      margin-top: 30px;
    }
    
    .signature-line {
      display: inline-block;
      width: 150px;
      border-bottom: 1px solid #333;
      margin-left: 20px;
    }
    
    .notice {
      text-align: center;
      font-size: 10px;
      color: #999;
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e0e0e0;
    }
    
    .stamp-area {
      width: 60px;
      height: 60px;
      border: 2px solid #666;
      border-radius: 50%;
      display: inline-block;
      text-align: center;
      line-height: 56px;
      font-weight: bold;
      color: #666;
      margin-left: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>급여명세서</h1>
      <div class="subtitle">SALARY STATEMENT</div>
      <div class="header-info">
        <span>발행일: ${this.formatDate(data.issuedDate)}</span>
        <span>${data.salaryYear}년 ${data.salaryMonth}월분</span>
      </div>
    </div>
    
    <!-- Company Information -->
    <div class="section">
      <h2 class="section-title">회사 정보</h2>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">회사명:</span>
          <span class="info-value">${data.companyName}</span>
        </div>
        ${data.companyRegistrationNumber ? `
        <div class="info-item">
          <span class="info-label">사업자번호:</span>
          <span class="info-value">${data.companyRegistrationNumber}</span>
        </div>
        ` : ''}
        ${data.companyAddress ? `
        <div class="info-item" style="grid-column: span 2;">
          <span class="info-label">주소:</span>
          <span class="info-value">${data.companyAddress}</span>
        </div>
        ` : ''}
      </div>
    </div>
    
    <!-- Worker Information -->
    <div class="section">
      <h2 class="section-title">직원 정보</h2>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">성명:</span>
          <span class="info-value">${data.workerName}</span>
        </div>
        ${data.workerNumber ? `
        <div class="info-item">
          <span class="info-label">사번:</span>
          <span class="info-value">${data.workerNumber}</span>
        </div>
        ` : ''}
        <div class="info-item">
          <span class="info-label">현장:</span>
          <span class="info-value">${data.siteName}</span>
        </div>
        ${data.position ? `
        <div class="info-item">
          <span class="info-label">직책:</span>
          <span class="info-value">${data.position}</span>
        </div>
        ` : ''}
        ${data.siteAddress ? `
        <div class="info-item" style="grid-column: span 2;">
          <span class="info-label">현장주소:</span>
          <span class="info-value">${data.siteAddress}</span>
        </div>
        ` : ''}
      </div>
    </div>
    
    <!-- Salary Period -->
    <div class="section">
      <h2 class="section-title">급여 지급 기간</h2>
      <div class="info-item">
        <span class="info-label">기간:</span>
        <span class="info-value">${this.formatDate(data.workPeriod.startDate)} ~ ${this.formatDate(data.workPeriod.endDate)}</span>
      </div>
    </div>
    
    <!-- Salary Details -->
    <div class="section">
      <h2 class="section-title">급여 상세</h2>
      <table class="salary-table">
        <thead>
          <tr>
            <th style="width: 30%;">항목</th>
            <th style="width: 40%;">내용</th>
            <th style="width: 30%;" class="amount">금액</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>기본급</td>
            <td>${calculation.details.workHours}시간 × ${this.formatCurrency(calculation.details.hourlyRate || 0)}</td>
            <td class="amount">${this.formatCurrency(calculation.basePay)}</td>
          </tr>
          ${calculation.overtimePay > 0 ? `
          <tr>
            <td>연장수당</td>
            <td>${calculation.details.overtimeHours}시간 × ${this.formatCurrency(calculation.details.overtimeRate || 0)}</td>
            <td class="amount">${this.formatCurrency(calculation.overtimePay)}</td>
          </tr>
          ` : ''}
          ${calculation.bonuses > 0 ? `
          <tr>
            <td>보너스</td>
            <td>-</td>
            <td class="amount">${this.formatCurrency(calculation.bonuses)}</td>
          </tr>
          ` : ''}
          ${calculation.deductions > 0 ? `
          <tr>
            <td>공제액</td>
            <td>-</td>
            <td class="amount deduction">-${this.formatCurrency(calculation.deductions)}</td>
          </tr>
          ` : ''}
          <tr class="subtotal-row">
            <td colspan="2">소계 (세전)</td>
            <td class="amount">${this.formatCurrency(calculation.grossPay)}</td>
          </tr>
          ${calculation.taxAmount > 0 ? `
          <tr>
            <td>세금 (${calculation.details.taxRate}%)</td>
            <td>${calculation.calculationType === 'tax_prepaid' ? '3.3% 선취' : ''}</td>
            <td class="amount deduction">-${this.formatCurrency(calculation.taxAmount)}</td>
          </tr>
          ` : ''}
          <tr class="total-row">
            <td colspan="2">실수령액</td>
            <td class="amount" style="font-size: 14px;">${this.formatCurrency(calculation.netPay)}</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Bank Information -->
    ${data.bankInfo ? `
    <div class="section">
      <h2 class="section-title">계좌 정보</h2>
      <div class="bank-info">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">은행:</span>
            <span class="info-value">${data.bankInfo.bankName}</span>
          </div>
          <div class="info-item">
            <span class="info-label">계좌번호:</span>
            <span class="info-value">${data.bankInfo.accountNumber}</span>
          </div>
          <div class="info-item">
            <span class="info-label">예금주:</span>
            <span class="info-value">${data.bankInfo.accountHolder}</span>
          </div>
        </div>
      </div>
    </div>
    ` : ''}
    
    <!-- Footer -->
    <div class="footer">
      <div class="footer-grid">
        <div>
          <div class="info-item">
            <span class="info-label">발행자:</span>
            <span class="info-value">${data.issuedBy}</span>
          </div>
          <div class="info-item">
            <span class="info-label">발행일시:</span>
            <span class="info-value">${this.formatDate(data.issuedDate)}</span>
          </div>
        </div>
        <div class="signature-area">
          <span>직원 서명:</span>
          <span class="signature-line"></span>
        </div>
      </div>
      
      <div class="notice">
        본 급여명세서는 기밀문서입니다. 무단 복제 및 배포를 금합니다.<br>
        This salary statement is confidential. Unauthorized reproduction and distribution are prohibited.
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  public async downloadPDF(data: SalaryPDFData, filename?: string): Promise<void> {
    const html = this.generateHTML(data);
    const defaultFilename = `급여명세서_${data.workerName}_${data.salaryYear}년${data.salaryMonth}월.pdf`;
    
    // Create a blob from the HTML
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Open in new window for printing
    const printWindow = window.open(url, '_blank');
    
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        setTimeout(() => {
          printWindow.print();
          URL.revokeObjectURL(url);
        }, 250);
      });
    }
  }
  
  public async generatePDFBlob(data: SalaryPDFData): Promise<Blob> {
    const html = this.generateHTML(data);
    return new Blob([html], { type: 'text/html' });
  }
}

// Utility functions for easy use
export async function downloadSalaryPDF(data: SalaryPDFData, filename?: string): Promise<void> {
  const generator = new SalaryPDFGeneratorHTML();
  await generator.downloadPDF(data, filename);
}

export async function getSalaryPDFBlob(data: SalaryPDFData): Promise<Blob> {
  const generator = new SalaryPDFGeneratorHTML();
  return generator.generatePDFBlob(data);
}