import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import fs from 'node:fs'
import path from 'node:path'

// 기본 폰트 설정 (Fallback)
let baseFontFamily = 'Helvetica'

// 한글 폰트 등록
// 에러 발생 시 기본 폰트 사용을 위해 try-catch 래핑
try {
  const fontPath = path.join(process.cwd(), 'public/fonts/Pretendard-Regular.woff')

  if (fs.existsSync(fontPath)) {
    console.log('Font found at:', fontPath)
    Font.register({
      family: 'Pretendard',
      src: fontPath,
    })
    // 폰트 등록 성공 시에만 폰트 패밀리 변경
    baseFontFamily = 'Pretendard'
  } else {
    console.warn('Font file not found at:', fontPath, '- Falling back to Helvetica')
  }
} catch (error) {
  console.error('Failed to register font, falling back to Helvetica:', error)
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: baseFontFamily,
    fontSize: 10,
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    width: 60,
    fontWeight: 'bold',
  },
  infoValue: {
    flex: 1,
  },
  section: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    backgroundColor: '#f0f0f0',
    padding: 2,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginVertical: 5,
  },
  tableRow: {
    flexDirection: 'row',
    margin: 'auto',
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCell: {
    margin: 5,
    fontSize: 9,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 5,
  },
  imageContainer: {
    width: '48%', // 2 columns
    height: 200,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
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
    manHours: number
    workers: { name: string; hours: number }[]
    materials: { name: string; quantity: number | string; unit: string }[]
    drawings: string[]
    photos: string[]
  }
}

export const WorkReportPDF = ({ data }: WorkReportPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>작 업 보 고 서</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>현 장 명 :</Text>
          <Text style={styles.infoValue}>{data.siteName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>작 업 일 :</Text>
          <Text style={styles.infoValue}>{data.workDate}</Text>
          <Text style={styles.infoLabel}>작 성 자 :</Text>
          <Text style={styles.infoValue}>{data.author}</Text>
        </View>
      </View>

      {/* 1. 작업 개요 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. 작업 개요</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>위치</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{data.location}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>공종</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>
                {data.workProcess} {'>'} {data.workType}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 2. 인력 투입 현황 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. 인력 투입 현황 (총 {data.manHours} 공수)</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            {data.workers.map((worker, i) => (
              <View key={i} style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {worker.name} ({worker.hours})
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* 3. 자재 투입 내역 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. 자재 투입 내역</Text>
        <View style={styles.table}>
          {data.materials.map((mat, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={{ ...styles.tableCol, width: '70%' }}>
                <Text style={styles.tableCell}>{mat.name}</Text>
              </View>
              <View style={{ ...styles.tableCol, width: '30%' }}>
                <Text style={styles.tableCell}>
                  {mat.quantity} {mat.unit}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 4. 도면 현황 */}
      <View style={styles.section} break={data.drawings.length > 0}>
        <Text style={styles.sectionTitle}>4. 도면 현황 & 이미지</Text>
        <Text style={{ fontSize: 9, marginBottom: 5 }}>완료 도면 수: {data.drawings.length}</Text>
        <View style={styles.imageGrid}>
          {data.drawings.map((src, i) => (
            <View key={i} style={styles.imageContainer}>
              <Image src={src} style={styles.image} alt="" />
            </View>
          ))}
        </View>
      </View>

      {/* 5. 현장 사진 */}
      <View style={styles.section} break={data.photos.length > 0}>
        <Text style={styles.sectionTitle}>5. 현장 사진</Text>
        <View style={styles.imageGrid}>
          {data.photos.map((src, i) => (
            <View key={i} style={styles.imageContainer}>
              <Image src={src} style={styles.image} alt="" />
            </View>
          ))}
        </View>
      </View>

      {/* Footer */}
      <Text style={styles.footer} fixed>
        (주) 이 노 피 앤 씨
      </Text>
    </Page>
  </Document>
)
