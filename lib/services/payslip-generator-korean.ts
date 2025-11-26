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
      workDays: num((data as any)?.salary?.work_days),
      totalLaborHours: num((data as any)?.salary?.total_labor_hours),
    }

    const computedNet = Math.max(S.gross - S.deductions, 0)
    if (S.net === 0 && (S.gross > 0 || S.deductions > 0)) {
      S.net = computedNet
    }

    const deductionRate = S.gross > 0 ? ((S.deductions / S.gross) * 100).toFixed(1) : '0.0'
    // 일당 = 기본급 / 총공수 (엔진에서 기본급=일당×총공수로 산출)
    const perDayRaw = S.totalLaborHours > 0 ? S.base / S.totalLaborHours : 0
    const perDay = Math.round(perDayRaw)
    // 급여방식별 텍스트
    const employmentType = data.employee.department || '일용직'
    const taxRateText = this.getTaxRateText(employmentType, data.salary)

    const isSnapshot = data.meta?.source === 'snapshot'
    const statusLabel = (() => {
      if (!isSnapshot) return '예상치(계산)'
      switch (data.meta?.status) {
        case 'paid':
          return '지급완료'
        case 'approved':
          return '승인됨'
        case 'issued':
        default:
          return '발행상태'
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

    // Rate badge (custom / default)
    const rateSource = (data.meta as any)?.rateSource as
      | 'custom'
      | 'employment_type_default'
      | undefined
    const rateLabel = rateSource === 'custom' ? '세율: 개인설정' : '세율: 기본'
    const rates = (data.meta as any)?.rates || {}
    const rateTitle =
      [
        rates.income_tax !== undefined ? `소득세 ${rates.income_tax}%` : null,
        rates.local_tax !== undefined ? `지방세 ${rates.local_tax}%` : null,
        rates.national_pension !== undefined ? `국민 ${rates.national_pension}%` : null,
        rates.health_insurance !== undefined ? `건강 ${rates.health_insurance}%` : null,
        rates.employment_insurance !== undefined ? `고용 ${rates.employment_insurance}%` : null,
      ]
        .filter(Boolean)
        .join(' · ') || '세율 정보 없음'

    const earningItems: Array<{ label: string; amount: number; highlight?: boolean }> = []
    const addEarning = (label: string, amount?: number | null) => {
      const numeric = num(amount)
      if (numeric <= 0) return
      earningItems.push({ label, amount: numeric })
    }

    addEarning('기본급', S.base)
    addEarning('연장수당', (data.salary as any)?.overtime_pay)
    addEarning('기타수당', (data.salary as any)?.allowance_pay)
    earningItems.push({ label: '지급액 계', amount: S.gross, highlight: true })
    earningItems.push({ label: '실지급액', amount: S.net, highlight: true })

    const deductionItems: Array<{ label: string; amount: number }> = []
    const addDeduction = (label: string, amount?: number | null) => {
      const numeric = num(amount)
      if (numeric <= 0) return
      deductionItems.push({ label, amount: numeric })
    }
    addDeduction('소득세', S.tax)
    addDeduction('국민연금', S.pension)
    addDeduction('건강보험', S.health)
    addDeduction('고용보험', S.emp)
    deductionItems.push({ label: '공제액 계', amount: S.total_deductions })

    const rowCount = Math.max(earningItems.length, deductionItems.length)

    const calcRows: Array<{ label: string; formula: string; amount: number }> = []
    if (S.base > 0) {
      const dailyRate =
        data.salary.work_days > 0 ? Math.round(S.base / data.salary.work_days) : S.base
      calcRows.push({
        label: '기본급',
        formula: `${Math.round(data.salary.work_days || 0)}일 × ${dailyRate.toLocaleString()}원`,
        amount: S.base,
      })
    }
    if (num((data.salary as any)?.overtime_pay) > 0) {
      calcRows.push({
        label: '연장수당',
        formula: `${Math.round(data.salary.total_overtime_hours || 0)}시간`,
        amount: num((data.salary as any)?.overtime_pay),
      })
    }

    return this.renderCompactTemplate({
      periodText,
      paymentDateText,
      todayText,
      earningItems,
      deductionItems,
      rowCount,
      calcRows,
      data,
      S,
      badgeTitle,
      rateLabel,
      rateTitle,
    })
  }

  private renderCompactTemplate(args: {
    periodText: string
    paymentDateText: string
    todayText: string
    earningItems: Array<{ label: string; amount: number; highlight?: boolean }>
    deductionItems: Array<{ label: string; amount: number }>
    rowCount: number
    calcRows: Array<{ label: string; formula: string; amount: number }>
    data: PayslipData
    S: typeof S
    badgeTitle: string
    rateLabel: string
    rateTitle: string
  }): string {
    const {
      periodText,
      paymentDateText,
      todayText,
      earningItems,
      deductionItems,
      rowCount,
      calcRows,
      data,
      S,
      badgeTitle,
      rateLabel,
      rateTitle,
    } = args

    const formatAmount = (value: number) => Math.round(value || 0).toLocaleString('ko-KR')

    const tableRows = Array.from({ length: rowCount })
      .map((_, idx) => {
        const earn = earningItems[idx]
        const ded = deductionItems[idx]
        const earnCells = earn
          ? `<td class="${earn.highlight ? 'emphasis' : ''}">${earn.label}</td><td class="${
              earn.highlight ? 'emphasis' : ''
            } text-right">${formatAmount(earn.amount)}</td>`
          : '<td></td><td></td>'
        const dedCells = ded
          ? `<td>${ded.label}</td><td class="text-right">${formatAmount(ded.amount)}</td>`
          : '<td></td><td></td>'
        const rowClass = earn?.highlight
          ? 'class="accent"'
          : ded?.label === '공제액 계'
            ? 'class="accent"'
            : ''
        return `<tr ${rowClass}>${earnCells}${dedCells}</tr>`
      })
      .join('')

    const calcRowsHtml = calcRows.length
      ? calcRows
          .map(
            row => `<tr>
        <td>${row.label}</td>
        <td>${row.formula}</td>
        <td class="text-right">${formatAmount(row.amount)}</td>
      </tr>`
          )
          .join('')
      : `<tr><td colspan="3" class="text-center">추가 계산 항목이 없습니다.</td></tr>`

    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>급여명세서 - ${data.employee.name}</title>
  <style>
    *{box-sizing:border-box}body{font-family:'Noto Sans KR',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:24px;background:#f5f7fb;color:#0b1324}
    .sheet{max-width:820px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:32px 36px;box-shadow:0 18px 40px rgba(15,23,42,.12)}
    .title-wrap{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:18px}
    .title-sheet{font:900 30px/1 'Noto Sans KR';margin:0;color:#111b35}
    .title-meta{font:700 14px/1 'Noto Sans KR';color:#2b5d95}
    table{width:100%;border-collapse:collapse;margin-bottom:20px;font-size:14px}
    th,td{border:1px solid #cfd8ea;padding:10px 12px;text-align:left}
    th{background:#f2f6ff;font-weight:800;color:#102347}
    .two colgroup col:nth-child(odd){background:#f9fbff}
    .two thead th{text-align:center;font-size:13px;background:#0d2f66;color:#fff}
    .two td{text-align:left}
    .two td:nth-child(2),.two td:nth-child(4){text-align:right;font-variant-numeric:tabular-nums}
    .accent td{background:#eef4ff}
    .text-right{text-align:right}
    .text-center{text-align:center}
    .emphasis{font-weight:800;color:#0d2f66}
    .calc-head{font:700 16px/1 'Noto Sans KR';color:#0d2f66;margin:26px 0 12px;text-align:center}
    .note{font-size:13px;color:#5f6c85;margin-top:16px}
    @media (max-width:600px){body{padding:12px}.sheet{padding:24px}table{font-size:13px}th,td{padding:8px 10px}}
  </style>
</head>
<body>
  <div class="sheet">
    <div class="title-wrap">
      <div>
        <h1 class="title-sheet">급여 명세서</h1>
        <div class="title-meta">${periodText}</div>
      </div>
      <div class="title-meta">${todayText}</div>
    </div>

    <table class="tbl-info">
      <tbody>
        <tr><th>성명</th><td>${data.employee.name}</td></tr>
        <tr><th>소속</th><td>${data.employee.department || data.site.name || '-'}</td></tr>
        <tr><th>지급일</th><td>${paymentDateText}</td></tr>
      </tbody>
    </table>

    <table class="two">
      <colgroup>
        <col style="width:45%"><col style="width:15%">
        <col style="width:30%"><col style="width:15%">
      </colgroup>
      <thead>
        <tr><th colspan="2">임금지급내역</th><th colspan="2">공제내역</th></tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <div class="calc-head">계산 방법</div>
    <table class="calc-table">
      <thead>
        <tr><th>구분</th><th>산출식</th><th>금액(원)</th></tr>
      </thead>
      <tbody>
        ${calcRowsHtml}
      </tbody>
    </table>

    <p class="note">
      ${badgeTitle} · ${rateLabel} (${rateTitle})<br/>
      본 급여명세서는 전자 문서로 발급되었습니다. 무단 복제 및 배포를 금합니다.<br/>
      문의: ${data.company.phone || '02-1234-5678'} / ${data.company.name}
    </p>
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
