'use client'

import React, { useState, useEffect } from 'react'
import { X, Download, FileText, Calendar, DollarSign, User, Building } from 'lucide-react'

interface PayslipData {
  // 기본 정보
  employeeName: string
  employeeId: string
  department: string
  position: string
  workMonth: string

  // 근무 정보
  totalWorkDays: number
  actualWorkDays: number
  totalWorkHours: number
  overtimeHours: number

  // 급여 정보
  baseSalary: number
  overtimePay: number
  allowances: number
  totalEarnings: number

  // 공제 정보
  incomeTax: number
  nationalPension: number
  healthInsurance: number
  employmentInsurance: number
  totalDeductions: number

  // 실지급액
  netPay: number
}

interface PayslipPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  data: PayslipData | null
  month: string
}

export default function PayslipPreviewModal({
  isOpen,
  onClose,
  data,
  month,
}: PayslipPreviewModalProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  // ESC 키 처리
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen || !data) return null

  const handleDownloadPDF = async () => {
    setIsGenerating(true)
    try {
      // jsPDF를 동적으로 import (클라이언트 사이드에서만 실행)
      const jsPDF = (await import('jspdf')).default
      const autoTable = (await import('jspdf-autotable')).default

      // PDF 생성
      const doc = new jsPDF('p', 'mm', 'a4')

      // 한글 폰트 처리를 위한 설정 (기본 폰트 사용)
      doc.setFont('helvetica', 'normal')

      // 제목
      doc.setFontSize(20)
      doc.setTextColor(26, 37, 79) // --brand color
      doc.text('급여명세서', 105, 25, { align: 'center' })

      // 부제목 (월)
      doc.setFontSize(12)
      doc.setTextColor(107, 114, 128) // --muted color
      doc.text(month, 105, 35, { align: 'center' })

      // 선 그리기
      doc.setDrawColor(230, 236, 244) // --line color
      doc.line(20, 40, 190, 40)

      let yPosition = 50

      // 직원 정보 섹션
      doc.setFontSize(14)
      doc.setTextColor(26, 26, 26) // --text color
      doc.text('Employee Information', 20, yPosition)
      yPosition += 10

      const employeeData = [
        ['Name', data.employeeName],
        ['Employee ID', data.employeeId],
        ['Department', data.department],
        ['Position', data.position],
      ]

      autoTable(doc, {
        startY: yPosition,
        head: [],
        body: employeeData,
        theme: 'plain',
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40 },
          1: { cellWidth: 'auto' },
        },
        margin: { left: 20 },
        styles: { fontSize: 10 },
      })

      yPosition = (doc as any).lastAutoTable.finalY + 15

      // 근무 정보 섹션
      doc.setFontSize(14)
      doc.text('Work Information', 20, yPosition)
      yPosition += 10

      const workData = [
        ['Work Days', `${data.actualWorkDays}/${data.totalWorkDays} days`],
        ['Total Hours', `${data.totalWorkHours} hours`],
        ['Overtime Hours', `${data.overtimeHours} hours`],
      ]

      autoTable(doc, {
        startY: yPosition,
        head: [],
        body: workData,
        theme: 'plain',
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40 },
          1: { cellWidth: 'auto' },
        },
        margin: { left: 20 },
        styles: { fontSize: 10 },
      })

      yPosition = (doc as any).lastAutoTable.finalY + 15

      // 급여 내역 섹션
      doc.setFontSize(14)
      doc.text('Salary Details', 20, yPosition)
      yPosition += 10

      // 지급 내역
      doc.setFontSize(12)
      doc.text('Earnings', 20, yPosition)
      yPosition += 5

      const earningsData = [
        ['Base Salary', formatCurrency(data.baseSalary)],
        ['Overtime Pay', formatCurrency(data.overtimePay)],
        ['Allowances', formatCurrency(data.allowances)],
        ['Total Earnings', formatCurrency(data.totalEarnings)],
      ]

      autoTable(doc, {
        startY: yPosition,
        head: [],
        body: earningsData,
        theme: 'striped',
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 60 },
          1: { cellWidth: 'auto', halign: 'right' },
        },
        margin: { left: 20 },
        styles: { fontSize: 10 },
        headStyles: { fillColor: [240, 249, 255] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      })

      yPosition = (doc as any).lastAutoTable.finalY + 10

      // 공제 내역
      doc.setFontSize(12)
      doc.text('Deductions', 20, yPosition)
      yPosition += 5

      const deductionsData = [
        ['Income Tax', formatCurrency(data.incomeTax)],
        ['National Pension', formatCurrency(data.nationalPension)],
        ['Health Insurance', formatCurrency(data.healthInsurance)],
        ['Employment Insurance', formatCurrency(data.employmentInsurance)],
        ['Total Deductions', formatCurrency(data.totalDeductions)],
      ]

      autoTable(doc, {
        startY: yPosition,
        head: [],
        body: deductionsData,
        theme: 'striped',
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 60 },
          1: { cellWidth: 'auto', halign: 'right' },
        },
        margin: { left: 20 },
        styles: { fontSize: 10 },
        headStyles: { fillColor: [254, 243, 199] },
        alternateRowStyles: { fillColor: [255, 251, 235] },
      })

      yPosition = (doc as any).lastAutoTable.finalY + 15

      // 실지급액 (강조)
      doc.setDrawColor(0, 104, 254) // --accent color
      doc.setFillColor(240, 249, 255) // light blue background
      doc.rect(20, yPosition, 170, 20, 'FD')

      doc.setFontSize(16)
      doc.setTextColor(0, 104, 254) // --accent color
      doc.text('Net Pay:', 25, yPosition + 12)
      doc.text(formatCurrency(data.netPay), 185, yPosition + 12, { align: 'right' })

      // 하단 정보
      yPosition += 35
      doc.setFontSize(8)
      doc.setTextColor(107, 114, 128) // --muted color
      doc.text('Generated on: ' + new Date().toLocaleDateString('ko-KR'), 20, yPosition)
      doc.text('INOPNC Work Management System', 190, yPosition, { align: 'right' })

      // PDF 파일명 생성
      const fileName = `급여명세서_${data.employeeName}_${month.replace(/\s/g, '_')}.pdf`

      // PDF 다운로드
      doc.save(fileName)

      console.log('PDF generated successfully:', fileName)
      setIsGenerating(false)
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert('PDF 생성 중 오류가 발생했습니다.')
      setIsGenerating(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount)
  }

  return (
    <div className="payslip-modal-overlay" onClick={onClose}>
      <div className="payslip-modal-content" onClick={e => e.stopPropagation()}>
        {/* 모달 헤더 */}
        <div className="payslip-modal-header">
          <div className="header-left">
            <FileText className="header-icon" />
            <h2 className="header-title">급여명세서</h2>
            <span className="header-month">{month}</span>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="닫기">
            <X size={24} />
          </button>
        </div>

        {/* 모달 본문 */}
        <div className="payslip-modal-body">
          {/* 직원 정보 섹션 */}
          <section className="payslip-section employee-info">
            <h3 className="section-title">
              <User className="section-icon" />
              직원 정보
            </h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">성명</span>
                <span className="info-value">{data.employeeName}</span>
              </div>
              <div className="info-item">
                <span className="info-label">사번</span>
                <span className="info-value">{data.employeeId}</span>
              </div>
              <div className="info-item">
                <span className="info-label">부서</span>
                <span className="info-value">{data.department}</span>
              </div>
              <div className="info-item">
                <span className="info-label">직급</span>
                <span className="info-value">{data.position}</span>
              </div>
            </div>
          </section>

          {/* 근무 정보 섹션 */}
          <section className="payslip-section work-info">
            <h3 className="section-title">
              <Calendar className="section-icon" />
              근무 정보
            </h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">근무일수</span>
                <span className="info-value">
                  {data.actualWorkDays}일 / {data.totalWorkDays}일
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">총 근무시간</span>
                <span className="info-value">{data.totalWorkHours}시간</span>
              </div>
              <div className="info-item">
                <span className="info-label">초과근무</span>
                <span className="info-value">{data.overtimeHours}시간</span>
              </div>
            </div>
          </section>

          {/* 급여 내역 섹션 */}
          <section className="payslip-section salary-info">
            <h3 className="section-title">
              <DollarSign className="section-icon" />
              급여 내역
            </h3>

            {/* 지급 내역 */}
            <div className="salary-subsection earnings">
              <h4 className="subsection-title">지급 내역</h4>
              <div className="salary-list">
                <div className="salary-item">
                  <span className="item-label">기본급</span>
                  <span className="item-value">{formatCurrency(data.baseSalary)}</span>
                </div>
                <div className="salary-item">
                  <span className="item-label">초과근무수당</span>
                  <span className="item-value">{formatCurrency(data.overtimePay)}</span>
                </div>
                <div className="salary-item">
                  <span className="item-label">기타수당</span>
                  <span className="item-value">{formatCurrency(data.allowances)}</span>
                </div>
                <div className="salary-item total">
                  <span className="item-label">총 지급액</span>
                  <span className="item-value accent">{formatCurrency(data.totalEarnings)}</span>
                </div>
              </div>
            </div>

            {/* 공제 내역 */}
            <div className="salary-subsection deductions">
              <h4 className="subsection-title">공제 내역</h4>
              <div className="salary-list">
                <div className="salary-item">
                  <span className="item-label">소득세</span>
                  <span className="item-value">{formatCurrency(data.incomeTax)}</span>
                </div>
                <div className="salary-item">
                  <span className="item-label">국민연금</span>
                  <span className="item-value">{formatCurrency(data.nationalPension)}</span>
                </div>
                <div className="salary-item">
                  <span className="item-label">건강보험</span>
                  <span className="item-value">{formatCurrency(data.healthInsurance)}</span>
                </div>
                <div className="salary-item">
                  <span className="item-label">고용보험</span>
                  <span className="item-value">{formatCurrency(data.employmentInsurance)}</span>
                </div>
                <div className="salary-item total">
                  <span className="item-label">총 공제액</span>
                  <span className="item-value warn">{formatCurrency(data.totalDeductions)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* 실지급액 섹션 */}
          <section className="payslip-section net-pay">
            <div className="net-pay-content">
              <span className="net-pay-label">실지급액</span>
              <span className="net-pay-value">{formatCurrency(data.netPay)}</span>
            </div>
          </section>
        </div>

        {/* 모달 푸터 */}
        <div className="payslip-modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            닫기
          </button>
          <button className="btn-primary" onClick={handleDownloadPDF} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <div className="spinner" />
                생성 중...
              </>
            ) : (
              <>
                <Download size={18} />
                PDF 다운로드
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
