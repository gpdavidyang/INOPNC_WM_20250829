import jsPDF from 'jspdf'

export interface PDFGeneratorOptions {
  title: string
  siteName: string
  reportDate: string
  reporterName: string
  photoGroups: unknown[]
}

// Base64로 인코딩된 한글 지원 폰트 (NotoSansKR 일부)
// 실제 프로덕션에서는 폰트 파일을 별도로 로드하는 것이 좋습니다
const addKoreanFont = (pdf: jsPDF) => {
  // 한글 폰트 추가 - 실제로는 폰트 파일을 로드해야 함
  // 여기서는 기본 폰트로 대체
  pdf.setFont('helvetica')
}

//