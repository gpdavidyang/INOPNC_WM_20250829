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
  month 
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
      // TODO: PDF 생성 로직 구현
      // 실제 구현 시 react-pdf 또는 jsPDF 라이브러리 사용
      console.log('Generating PDF for payslip:', data)
      
      // 임시 다운로드 시뮬레이션
      setTimeout(() => {
        const blob = new Blob(['Sample Payslip PDF'], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `급여명세서_${data.employeeName}_${month}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        setIsGenerating(false)
      }, 1500)
    } catch (error) {
      console.error('PDF generation failed:', error)
      setIsGenerating(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { 
      style: 'currency', 
      currency: 'KRW' 
    }).format(amount)
  }

  return (
    <div className="payslip-modal-overlay" onClick={onClose}>
      <div 
        className="payslip-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="payslip-modal-header">
          <div className="header-left">
            <FileText className="header-icon" />
            <h2 className="header-title">급여명세서</h2>
            <span className="header-month">{month}</span>
          </div>
          <button 
            className="close-btn"
            onClick={onClose}
            aria-label="닫기"
          >
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
                <span className="info-value">{data.actualWorkDays}일 / {data.totalWorkDays}일</span>
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
          <button 
            className="btn-secondary"
            onClick={onClose}
          >
            닫기
          </button>
          <button 
            className="btn-primary"
            onClick={handleDownloadPDF}
            disabled={isGenerating}
          >
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