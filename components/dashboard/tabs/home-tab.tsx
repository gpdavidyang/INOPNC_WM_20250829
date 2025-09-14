'use client'


export default function HomeTabNew() {
  const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0)
  const noticeIntervalRef = useRef<NodeJS.Timeout>()
  
  // API 데이터 가져오기
  const { 
    announcements, 
    todaySummary, 
    quickMenuStats, 
    loading, 
    error 
  } = useMobileHomeData()

  // 공지사항 자동 슬라이드
  useEffect(() => {
    if (announcements && announcements.length > 0) {
      noticeIntervalRef.current = setInterval(() => {
        setCurrentNoticeIndex((prev) => (prev + 1) % announcements.length)
      }, 3000)

      return () => {
        if (noticeIntervalRef.current) {
          clearInterval(noticeIntervalRef.current)
        }
      }
    }
  }, [announcements])

  return (
    <div className="container" style={{ padding: '20px', paddingTop: '20px' }}>
      {/* 빠른메뉴 섹션 */}
      <section id="qm-section" style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <img 
            src="/images/brand/Flash.png" 
            alt="" 
            style={{ width: '16px', height: '16px' }}
          />
          <h3 className="section-title">빠른메뉴</h3>
        </div>
        <ul className="quick-grid">
          <li>
            <Link href="/daily-reports" className="quick-item relative">
              <img src="/images/brand/출력현황.png" alt="출력현황" />
              <span>출력현황</span>
              {quickMenuStats?.dailyReports.today && quickMenuStats.dailyReports.today > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {quickMenuStats.dailyReports.today}
                </span>
              )}
            </Link>
          </li>
          <li>
            <Link href="/daily-reports" className="quick-item relative">
              <img src="/images/brand/작업일지.png" alt="작업일지" />
              <span>작업일지</span>
              {quickMenuStats?.dailyReports.pending && quickMenuStats.dailyReports.pending > 0 && (
                <span className="absolute top-0 right-0 bg-yellow-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {quickMenuStats.dailyReports.pending}
                </span>
              )}
            </Link>
          </li>
          <li>
            <Link href="/site-info" className="quick-item">
              <img src="/images/brand/현장정보.png" alt="현장정보" />
              <span>현장정보</span>
            </Link>
          </li>
          <li>
            <Link href="/documents" className="quick-item relative">
              <img src="/images/brand/문서함.png" alt="문서함" />
              <span>문서함</span>
              {quickMenuStats?.documents.unread && quickMenuStats.documents.unread > 0 && (
                <span className="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {quickMenuStats.documents.unread}
                </span>
              )}
            </Link>
          </li>
          <li>
            <Link href="/requests" className="quick-item relative">
              <img src="/images/brand/본사요청.png" alt="본사요청" />
              <span>본사요청</span>
              {quickMenuStats?.requests.urgent && quickMenuStats.requests.urgent > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {quickMenuStats.requests.urgent}
                </span>
              )}
            </Link>
          </li>
          <li>
            <Link href="/inventory" className="quick-item relative">
              <img src="/images/brand/재고관리.png" alt="재고관리" />
              <span>재고관리</span>
              {quickMenuStats?.inventory.lowStock && quickMenuStats.inventory.lowStock > 0 && (
                <span className="absolute top-0 right-0 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {quickMenuStats.inventory.lowStock}
                </span>
              )}
            </Link>
          </li>
        </ul>
      </section>

      {/* 공지사항 섹션 */}
      <section id="notice-section" style={{ marginBottom: '14px' }}>
        <div className="card notice-card">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="animate-spin h-5 w-5" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 p-4">
              공지사항을 불러올 수 없습니다
            </div>
          ) : (
            <div className="notice-content">
              {announcements && announcements.map((notice, index) => (
                <div
                  key={notice.id}
                  className={`notice-item ${index === currentNoticeIndex ? 'active' : ''}`}
                >
                  <span className="notice-text">
                    <strong className="tag-label">{notice.label}</strong>
                    {notice.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 작업내용 기록 섹션 */}
      <section>
        <div className="card">
          <h3 className="q">작업내용 기록</h3>
          <div className="stack" style={{ gap: '16px' }}>
            <div>
              <label className="t-cap" style={{ display: 'block', marginBottom: '8px' }}>
                현장명
              </label>
              <select className="input" style={{ width: '100%' }}>
                <option>현장을 선택하세요</option>
                <option>강남 현장</option>
                <option>판교 현장</option>
                <option>송도 현장</option>
              </select>
            </div>
            <div>
              <label className="t-cap" style={{ display: 'block', marginBottom: '8px' }}>
                근무시간
              </label>
              <input 
                type="text" 
                className="input" 
                placeholder="8시간"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label className="t-cap" style={{ display: 'block', marginBottom: '8px' }}>
                작업내용
              </label>
              <textarea 
                className="input"
                placeholder="오늘의 작업내용을 입력하세요"
                style={{ 
                  width: '100%',
                  minHeight: '80px',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  resize: 'vertical'
                }}
              />
            </div>
            <button className="btn btn--primary" style={{ width: '100%' }}>
              작업내용 저장
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}