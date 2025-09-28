/**
 * 한글 지원 급여명세서 PDF 생성 서비스
 * jsPDF 대신 HTML/CSS 기반으로 생성하여 한글 깨짐 문제 해결
 */

import type { MonthlySalary } from './salary-calculation.service'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

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
    logoUrl?: string
  }
  site: {
    id: string
    name: string
    address?: string
  }
  salary: MonthlySalary
  paymentDate: Date
  paymentMethod?: string
  meta?: {
    source?: 'snapshot' | 'calculated'
    status?: 'issued' | 'approved' | 'paid'
    issuedAt?: string | null
    approvedAt?: string | null
    paidAt?: string | null
  }
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

    const num = (v: any): number => {
      const n = typeof v === 'string' ? Number(v) : v
      return typeof n === 'number' && isFinite(n) ? n : 0
    }

    const S = {
      gross: num((data as any)?.salary?.total_gross_pay),
      deductions: num((data as any)?.salary?.total_deductions),
      net: num((data as any)?.salary?.net_pay),
      tax: num((data as any)?.salary?.tax_deduction),
      pension: num((data as any)?.salary?.national_pension),
      health: num((data as any)?.salary?.health_insurance),
      emp: num((data as any)?.salary?.employment_insurance),
      base: num((data as any)?.salary?.base_pay),
      overtime: num((data as any)?.salary?.overtime_pay),
      workDays: num((data as any)?.salary?.work_days),
      totalOvertimeHours: num((data as any)?.salary?.total_overtime_hours),
      totalLaborHours: num((data as any)?.salary?.total_labor_hours),
    }

    if (S.net === 0 && (S.gross > 0 || S.deductions > 0)) {
      S.net = Math.max(S.gross - S.deductions, 0)
    }

    const deductionRate = S.gross > 0 ? ((S.deductions / S.gross) * 100).toFixed(1) : '0.0'
    const perDay = S.workDays > 0 ? S.base / S.workDays : 0
    const baseHourly = perDay > 0 ? perDay / 8 : 0
    const overtimeHourly = baseHourly > 0 ? baseHourly * 1.5 : 0
    const totalBaseHours = S.workDays * 8

    // 급여방식별 텍스트
    const employmentType = data.employee.department || '일용직'
    const taxRateText = this.getTaxRateText(employmentType, data.salary)

    const isSnapshot = data.meta?.source === 'snapshot'
    const statusLabel = (() => {
      if (!isSnapshot) return '예상치(계산)'
      switch (data.meta?.status) {
        case 'paid':
          return '스냅샷(지급완료)'
        case 'approved':
          return '스냅샷(승인됨)'
        case 'issued':
        default:
          return '스냅샷(발행본)'
      }
    })()

    const issuedAtText = data.meta?.issuedAt
      ? format(new Date(data.meta.issuedAt), 'yyyy-MM-dd HH:mm')
      : null
    const approvedAtText = data.meta?.approvedAt
      ? format(new Date(data.meta.approvedAt), 'yyyy-MM-dd HH:mm')
      : null
    const paidAtText = data.meta?.paidAt
      ? format(new Date(data.meta.paidAt), 'yyyy-MM-dd HH:mm')
      : null
    const badgeTitle = isSnapshot
      ? [
          issuedAtText && `발행: ${issuedAtText}`,
          approvedAtText && `승인: ${approvedAtText}`,
          paidAtText && `지급: ${paidAtText}`,
        ]
          .filter(Boolean)
          .join(' · ') || '스냅샷'
      : '예상치(계산)'

    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <title>급여명세서 - ${data.employee.name}</title>
  <style>
    /* Set data-theme from localStorage or prefers-color-scheme (fallback) */
    :root { }
  </style>
  <script>
    try {
      (function(){
        var t = localStorage.getItem('theme');
        if(!t){ t = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
        document.documentElement.setAttribute('data-theme', t);
      })();
    } catch(e) {}
  </script>
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
      line-height: 1.3;
      color: #333;
      background: #f8fafc;
      font-size: 12px;
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
      padding: 10px;
      background: white;
      min-height: 100vh;
      height: auto;
      overflow: visible;
      position: relative;
      padding-bottom: 30px;
      /* iOS 스크롤 개선 */
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
    }
    
    /* 네비게이션 버튼 */
    .nav-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 15px;
      padding: 8px 0;
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
      margin-bottom: 10px;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 8px;
      position: relative;
    }
    .brand-logos { text-align: center; margin: 6px 0 10px; }
    .brand-logo { display: inline-block; height: 30px; margin: 0 10px; object-fit: contain; }
    .logo-dark { display: none; }
    .logo-print { display: none; }
    [data-theme='dark'] .logo-light { display: none; }
    [data-theme='dark'] .logo-dark { display: inline-block; }
    @media (prefers-color-scheme: dark) {
      :root:not([data-theme]) .logo-light { display: none; }
      :root:not([data-theme]) .logo-dark { display: inline-block; }
    }
    @media print {
      .logo-light, .logo-dark { display: none !important; }
      .logo-print { display: inline-block !important; }
      .brand-logo { height: 24px; margin-bottom: 8px; }
    }
    .snapshot-badge {
      position: static;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      background: ${isSnapshot ? '#ecfeff' : '#fff7ed'};
      color: ${isSnapshot ? '#0369a1' : '#9a3412'};
      border: 1px solid ${isSnapshot ? '#67e8f9' : '#fdba74'};
      margin: 6px auto 4px;
    }
    
    
    .header h1 {
      font-size: 18px;
      margin-bottom: 3px;
      color: #1e40af;
    }
    
    .header .period {
      font-size: 12px;
      color: #64748b;
    }
    
    .header .company {
      position: absolute;
      top: 0;
      right: 0;
      font-size: 11px;
      font-weight: bold;
      color: #64748b;
    }
    
    .two-columns {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
      margin-bottom: 8px;
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
      margin-bottom: 8px;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .section-title {
      background: #f3f4f6;
      padding: 4px 8px;
      font-weight: bold;
      font-size: 11px;
      color: #1f2937;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .section-content {
      padding: 6px;
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
      gap: 6px;
      margin: 4px 0;
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
      font-size: 11px;
      padding: 4px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    
    .info-item:last-child {
      border-bottom: none;
    }
    
    .info-label {
      font-weight: 600;
      color: #6b7280;
      margin-right: 6px;
      min-width: 60px;
      flex-shrink: 0;
      font-size: 10px;
    }
    
    .info-value {
      color: #111827;
      font-weight: 500;
      word-break: break-word;
      flex: 1;
      font-size: 11px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      border: 1px solid #e5e7eb;
    }
    
    @media (max-width: 767px) {
      body {
        font-size: 11px;
      }
      
      table {
        font-size: 9px;
      }
      
      th {
        padding: 4px 3px;
        font-size: 9px;
        line-height: 1.2;
      }
      
      td {
        padding: 4px 3px;
        line-height: 1.2;
        font-size: 9px;
      }
      
      .info-label {
        font-size: 9px;
        min-width: 50px;
      }
      
      .info-value {
        font-size: 10px;
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
      padding: 5px 4px;
      text-align: left;
      font-weight: 600;
      color: #4b5563;
      border-bottom: 1px solid #e5e7eb;
      font-size: 10px;
      border-right: 1px solid #e5e7eb;
    }
    
    th:last-child {
      border-right: none;
    }
    
    td {
      padding: 5px 4px;
      border-bottom: 1px solid #f3f4f6;
      border-right: 1px solid #f3f4f6;
      vertical-align: top;
      font-size: 10px;
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
      padding: 8px;
      border-radius: 4px;
      text-align: center;
      margin: 8px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .net-pay-label {
      font-size: 12px;
      font-weight: bold;
    }
    
    .net-pay-amount {
      font-size: 18px;
      font-weight: bold;
    }
    
    .net-pay-korean {
      font-size: 9px;
      opacity: 0.9;
    }
    
    .footer {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #e5e7eb;
      font-size: 8px;
      color: #6b7280;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .footer-info {
      flex: 1;
      font-size: 8px;
    }
    
    .stamp {
      text-align: center;
      padding: 6px;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      background: #f8fafc;
      font-size: 9px;
      width: 180px;
    }
    
    .tax-info {
      background: #fef3c7;
      padding: 6px;
      border-radius: 3px;
      margin-top: 6px;
      font-size: 10px;
      color: #92400e;
      line-height: 1.3;
      border-left: 3px solid #f59e0b;
    }
    
    .calculation-summary {
      background: #f0f9ff;
      border: 1px solid #0ea5e9;
      border-radius: 4px;
      padding: 8px;
      margin: 8px 0;
      font-size: 11px;
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
    /* 모바일 안내 박스 스타일 */
    .mobile-guide {
      background: #f0f9ff;
      border: 1px solid #0ea5e9;
      border-radius: 6px;
      padding: 8px;
      margin-bottom: 10px;
      font-size: 11px;
      color: #0369a1;
      display: none;
    }
    
    .mobile-guide-item {
      margin-bottom: 4px;
    }
    
    .mobile-guide-item:last-child {
      margin-bottom: 0;
    }
    
    .button-label {
      background: #10b981;
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      display: inline-block;
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
      
      .mobile-guide {
        display: block;
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
    
    <!-- Mobile User Guide -->
    <div class="mobile-guide">
      <div class="mobile-guide-item">
        <strong>📱 인쇄 안내:</strong> 상단의 <span class="button-label">인쇄하기</span> 버튼을 눌러 PDF로 저장하거나 인쇄할 수 있습니다.
      </div>
      <div class="mobile-guide-item">
        <strong>👆 화면 조작:</strong> 두 손가락으로 화면을 확대/축소하여 편하게 보실 수 있습니다.
      </div>
    </div>
    
    <div class="header">
      
      ${(() => {
        const light = (data.company as any).logoLight || (data.company as any).logoUrl
        const dark = (data.company as any).logoDark
        const pr = (data.company as any).logoPrint
        if (!light && !dark && !pr) return ''
        const parts: string[] = []
        if (light)
          parts.push(
            `<img class=\"brand-logo logo-light\" src=\"${light}\" alt=\"${data.company.name} 로고\" />`
          )
        if (dark)
          parts.push(
            `<img class=\"brand-logo logo-dark\" src=\"${dark}\" alt=\"${data.company.name} 로고\" />`
          )
        if (pr)
          parts.push(
            `<img class=\"brand-logo logo-print\" src=\"${pr}\" alt=\"${data.company.name} 로고\" />`
          )
        return `<div class=\"brand-logos\">${parts.join('')}</div>`
      })()}
      <h1>급여명세서</h1>
      <div class="snapshot-badge" aria-label="문서 출처" title="${badgeTitle}">${statusLabel}</div>
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
              <span class="info-value">${S.workDays}일</span>
            </div>
            <div class="info-item">
              <span class="info-label">노동시간:</span>
              <span class="info-value">${S.totalLaborHours.toFixed(2)}시간</span>
            </div>
            <div class="info-item">
              <span class="info-label">공수:</span>
              <span class="info-value">${(S.totalLaborHours / 8).toFixed(2)}공수</span>
            </div>
            <div class="info-item">
              <span class="info-label">일당:</span>
              <span class="info-value">${perDay.toLocaleString()}원</span>
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
            <span class="info-value">${baseHourly.toLocaleString()}원/시간</span>
          </div>
          <div class="info-item">
            <span class="info-label">연장시급:</span>
            <span class="info-value">${overtimeHourly.toLocaleString()}원/시간</span>
          </div>
          <div class="info-item">
            <span class="info-label">정규시간:</span>
            <span class="info-value">${totalBaseHours.toFixed(0)}시간</span>
          </div>
          <div class="info-item">
            <span class="info-label">연장시간:</span>
            <span class="info-value">${S.totalOvertimeHours.toFixed(2)}시간</span>
          </div>
        </div>
        <div class="tax-info">
          <strong>💡 계산공식:</strong> 기본급 = 일당(${perDay.toLocaleString()}원) × 근무일수(${S.workDays}일)
          ${S.overtime > 0 ? `<br>연장수당 = 기본시급 × 1.5배 × 연장시간(${S.totalOvertimeHours.toFixed(2)}시간)` : ''}
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
              ${
                data.salary.overtime_pay > 0
                  ? `
              <tr>
                <td>연장수당</td>
                <td class="text-center">${((data.salary.base_pay / data.salary.work_days / 8) * 1.5).toLocaleString()}원 × ${data.salary.total_overtime_hours.toFixed(1)}h</td>
                <td class="text-right amount">${data.salary.overtime_pay.toLocaleString()}</td>
              </tr>
              `
                  : ''
              }
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
                <td class="text-center">${S.gross.toLocaleString()} × ${employmentType === '프리랜서' ? '3.3%' : employmentType === '일용직' ? '2.97%' : '8%'}</td>
                <td class="text-right deduction">${S.tax.toLocaleString()}</td>
              </tr>
              ${
                data.salary.national_pension > 0
                  ? `
              <tr>
                <td>국민연금</td>
                <td class="text-center">${S.gross.toLocaleString()} × 4.5%</td>
                <td class="text-right deduction">${S.pension.toLocaleString()}</td>
              </tr>
              `
                  : ''
              }
              ${
                data.salary.health_insurance > 0
                  ? `
              <tr>
                <td>건강보험</td>
                <td class="text-center">${S.gross.toLocaleString()} × 3.43%</td>
                <td class="text-right deduction">${S.health.toLocaleString()}</td>
              </tr>
              `
                  : ''
              }
              ${
                data.salary.employment_insurance > 0
                  ? `
              <tr>
                <td>고용보험</td>
                <td class="text-center">${S.gross.toLocaleString()} × 0.9%</td>
                <td class="text-right deduction">${S.emp.toLocaleString()}</td>
              </tr>
              `
                  : ''
              }
              <tr style="border-top: 2px solid #e5e7eb;">
                <td><strong>총 공제액</strong></td>
                <td class="text-center">${S.tax.toLocaleString()} + ${S.pension.toLocaleString()} + ${S.health.toLocaleString()} + ${S.emp.toLocaleString()}</td>
                <td class="text-right deduction"><strong>${S.deductions.toLocaleString()}</strong></td>
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
          <div class="compact-grid" style="margin-top: 6px;">
        <div>• 총 지급액: <strong>${S.gross.toLocaleString()}원</strong></div>
        <div>• 총 공제액: <strong>${S.deductions.toLocaleString()}원</strong></div>
        <div>• 실 지급액: <strong style="color: #dc2626;">${S.net.toLocaleString()}원</strong></div>
        <div>• 공제율: <strong>${deductionRate}%</strong></div>
      </div>
    </div>
    
    <div class="net-pay-section">
      <div class="net-pay-label">
        <div>실지급액</div>
        <div style="font-size: 10px; opacity: 0.9; margin-top: 2px;">
          총지급액 - 총공제액<br>
          ${S.gross.toLocaleString()} - ${S.deductions.toLocaleString()}
        </div>
      </div>
      <div>
        <div class="net-pay-amount">${S.net.toLocaleString()}원</div>
        <div class="net-pay-korean">(${this.numberToKorean(S.net)})</div>
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
    switch (employmentType) {
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
