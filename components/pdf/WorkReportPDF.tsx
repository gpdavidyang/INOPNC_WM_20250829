import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import fs from 'node:fs'
import path from 'node:path'

// 기본 폰트 설정 (Fallback)
let baseFontFamily = 'Helvetica'

// 한글 폰트 등록
try {
  const fontPath = path.join(process.cwd(), 'public/fonts/Pretendard-Regular.woff')

  if (fs.existsSync(fontPath)) {
    console.log('Font found at:', fontPath)
    Font.register({
      family: 'Pretendard',
      src: fontPath,
      fontWeight: 'normal',
    })
    // Register Bold if available, otherwise reuse regular with weight (works for some fonts)
    // Ideally we should checking for a Bold font file, but for now we assume the single font file
    // or relying on renderer synthetic bold.
    // Let's check if we have a Bold variant in the project?
    // The user's env only showed Regular in previous steps usually.
    // We will stick to 'Pretendard' family.
    baseFontFamily = 'Pretendard'
  } else {
    console.warn('Font file not found at:', fontPath, '- Falling back to Helvetica')
  }
} catch (error) {
  console.error('Failed to register font, falling back to Helvetica:', error)
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: baseFontFamily,
    fontSize: 10,
    color: '#111827', // Gray 900
    lineHeight: 1.4,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#111827',
    paddingBottom: 10,
    alignItems: 'flex-start', // Changed to flex-start for top alignment
  },
  title: {
    fontSize: 26, // Increased size
    fontWeight: 'heavy', // Extra Bold equivalent in some libs, or use numeric 800/900 if font supports
    // Since we only regiestered one font file, 'bold' might just be synthetic.
    // Let's use 'bold' and larger size to emphasize.
    fontFamily: baseFontFamily,
  },
  metaTable: {
    width: 200,
    borderWidth: 1,
    borderColor: '#d1d5db',
    // borderBottomWidth: 1, // Default is 1 if not specified? No, View has 0 by default.
    // We set borderWidth: 1 above, so it has bottom border.
  },
  metaRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    height: 20,
    alignItems: 'center',
  },
  metaRowLast: {
    flexDirection: 'row',
    height: 20,
    alignItems: 'center',
    borderBottomWidth: 0, // Last row needs no bottom border if table has one?
    // Actually, if table has border, we don't need row border on last element.
  },
  metaLabel: {
    width: 60,
    backgroundColor: '#f3f4f6',
    textAlign: 'center',
    fontSize: 9,
    fontWeight: 'bold',
    height: '100%',
    paddingTop: 4,
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
  },
  metaValue: {
    flex: 1,
    paddingLeft: 8,
    fontSize: 9,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
    paddingLeft: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionSub: {
    fontSize: 10,
    color: '#6b7280',
  },
  // Standard Table Styles
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d1d5db',
    // borderBottomWidth: 1, // Explicitly ensure bottom border
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    minHeight: 24,
    alignItems: 'center',
  },
  tableRowLast: {
    flexDirection: 'row',
    minHeight: 24,
    alignItems: 'center',
    borderBottomWidth: 0,
  },
  // Overview Specific Columns
  overviewLabel: {
    width: '20%', // Adjusted for longer text "위치(블록/동/층)"
    backgroundColor: '#f3f4f6',
    textAlign: 'center',
    fontWeight: 'bold',
    height: '100%',
    padding: 5,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
    justifyContent: 'center',
  },
  overviewValue: {
    width: '30%',
    padding: 5,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
  },
  overviewValueLast: {
    width: '30%',
    padding: 5,
    fontSize: 9,
    borderRightWidth: 0,
  },
  // Manpower & Material Columns
  colHeader: {
    backgroundColor: '#f3f4f6',
    textAlign: 'center',
    fontWeight: 'bold',
    padding: 5,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
  },
  colCell: {
    padding: 5,
    fontSize: 9,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#d1d5db',
  },
  // Image Grid
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageContainer: {
    width: '48%',
    aspectRatio: 1.33,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    padding: 5,
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 10,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
})

interface WorkReportPDFProps {
  data: {
    siteName: string
    workDate: string
    author: string
    location: string
    workProcess: string
    workType: string
    componentNames: string
    manHours: number
    workers: { name: string; hours: number }[]
    materials: { name: string; quantity: number | string; unit: string }[]
    drawings: string[]
    photos: string[]
  }
}

export const WorkReportPDF = ({ data }: WorkReportPDFProps) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={{ ...styles.title, fontWeight: 'bold' }}>작 업 보 고 서</Text>
          <View style={styles.metaTable}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>일 자</Text>
              <Text style={styles.metaValue}>{data.workDate}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>현 장</Text>
              <Text style={styles.metaValue}>{data.siteName}</Text>
            </View>
            <View style={styles.metaRowLast}>
              <Text style={styles.metaLabel}>작 성</Text>
              <Text style={styles.metaValue}>{data.author}</Text>
            </View>
          </View>
        </View>

        {/* 1. 작업 개요 (Work Overview) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>1. 작업 개요</Text>
          </View>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.overviewLabel}>부 재 명</Text>
              <Text style={styles.overviewValue}>{data.componentNames || '-'}</Text>
              <Text style={styles.overviewLabel}>작 업 공 정</Text>
              <Text style={styles.overviewValueLast}>{data.workProcess || '-'}</Text>
            </View>
            <View style={styles.tableRowLast}>
              <Text style={styles.overviewLabel}>작 업 유 형</Text>
              <Text style={styles.overviewValue}>{data.workType || '-'}</Text>
              <Text style={styles.overviewLabel}>위치(블록/동/층)</Text>
              <Text style={styles.overviewValueLast}>{data.location || '-'}</Text>
            </View>
          </View>
        </View>

        {/* 2. 인력 투입 현황 (Manpower) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>2. 인력 투입 현황</Text>
            <Text style={styles.sectionSub}>
              총 {data.manHours} 공수 / {data.workers.length} 명
            </Text>
          </View>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={{ ...styles.colHeader, width: '40%' }}>성 명</Text>
              <Text style={{ ...styles.colHeader, width: '30%' }}>공 수</Text>
              <Text style={{ ...styles.colHeader, width: '30%', borderRightWidth: 0 }}>비 고</Text>
            </View>
            {data.workers.length > 0 ? (
              data.workers.map((worker, i) => (
                <View
                  key={i}
                  style={i === data.workers.length - 1 ? styles.tableRowLast : styles.tableRow}
                >
                  <Text style={{ ...styles.colCell, width: '40%' }}>{worker.name}</Text>
                  <Text style={{ ...styles.colCell, width: '30%' }}>{worker.hours}</Text>
                  <Text style={{ ...styles.colCell, width: '30%', borderRightWidth: 0 }}>-</Text>
                </View>
              ))
            ) : (
              <View style={styles.tableRowLast}>
                <Text
                  style={{
                    ...styles.colCell,
                    width: '100%',
                    borderRightWidth: 0,
                    color: '#9ca3af',
                  }}
                >
                  투입 인력이 없습니다.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 3. 자재 투입 내역 (Materials) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>3. 자재 투입 내역</Text>
          </View>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={{ ...styles.colHeader, width: '50%' }}>품 명</Text>
              <Text style={{ ...styles.colHeader, width: '25%' }}>수 량</Text>
              <Text style={{ ...styles.colHeader, width: '25%', borderRightWidth: 0 }}>단 위</Text>
            </View>
            {data.materials.length > 0 ? (
              data.materials.map((mat, i) => (
                <View
                  key={i}
                  style={i === data.materials.length - 1 ? styles.tableRowLast : styles.tableRow}
                >
                  <Text
                    style={{ ...styles.colCell, width: '50%', textAlign: 'left', paddingLeft: 10 }}
                  >
                    {mat.name}
                  </Text>
                  <Text style={{ ...styles.colCell, width: '25%' }}>{mat.quantity}</Text>
                  <Text style={{ ...styles.colCell, width: '25%', borderRightWidth: 0 }}>
                    {mat.unit}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.tableRowLast}>
                <Text
                  style={{
                    ...styles.colCell,
                    width: '100%',
                    borderRightWidth: 0,
                    color: '#9ca3af',
                  }}
                >
                  투입 자재가 없습니다.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 4. 도면 (Drawings) */}
        <View style={styles.section} break={data.drawings.length > 0}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>4. 도면 (진행도면, 완료도면)</Text>
            <Text style={styles.sectionSub}>총 {data.drawings.length} 장</Text>
          </View>
          <View style={styles.imageGrid}>
            {data.drawings.length > 0 ? (
              data.drawings.map((src, i) => (
                <View key={i} style={styles.imageContainer}>
                  <Image src={src} style={styles.image} />
                </View>
              ))
            ) : (
              <Text style={{ fontSize: 10, color: '#9ca3af', padding: 10 }}>
                첨부된 도면이 없습니다.
              </Text>
            )}
          </View>
        </View>

        {/* 5. 현장 사진 (Photos) */}
        <View
          style={styles.section}
          break={data.photos.length > 0 || (data.drawings.length === 0 && data.photos.length > 0)}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>5. 현장 사진</Text>
            <Text style={styles.sectionSub}>총 {data.photos.length} 장</Text>
          </View>
          <View style={styles.imageGrid}>
            {data.photos.length > 0 ? (
              data.photos.map((src, i) => (
                <View key={i} style={styles.imageContainer}>
                  <Image src={src} style={styles.image} />
                </View>
              ))
            ) : (
              <Text style={{ fontSize: 10, color: '#9ca3af', padding: 10 }}>
                첨부된 사진이 없습니다.
              </Text>
            )}
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer} fixed>
          (주) 이 노 피 앤 씨 - INOPNC Construction Management System
        </Text>
      </Page>
    </Document>
  )
}
