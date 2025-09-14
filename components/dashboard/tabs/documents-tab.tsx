'use client'


export default function DocumentsTabNew() {
  const [activeTab, setActiveTab] = useState<'mine' | 'shared'>('mine')
  const [searchQuery, setSearchQuery] = useState('')

  // 문서 데이터 (예시)
  const myDocuments = [
    { id: 1, title: '근로계약서', date: '2025-01-15', size: '2.5MB', type: 'pdf' },
    { id: 2, title: '안전교육 이수증', date: '2025-01-12', size: '1.2MB', type: 'pdf' },
    { id: 3, title: '신분증 사본', date: '2025-01-10', size: '3.1MB', type: 'jpg' },
    { id: 4, title: '자격증', date: '2025-01-08', size: '1.8MB', type: 'pdf' },
  ]

  const sharedDocuments = [
    { id: 5, title: '현장 안전 수칙', date: '2025-01-14', size: '4.2MB', type: 'pdf' },
    { id: 6, title: 'PTW 작업허가서', date: '2025-01-13', size: '2.1MB', type: 'pdf' },
    { id: 7, title: '도면 자료', date: '2025-01-11', size: '8.5MB', type: 'pdf' },
    { id: 8, title: '작업 매뉴얼', date: '2025-01-09', size: '5.3MB', type: 'pdf' },
  ]

  const documents = activeTab === 'mine' ? myDocuments : sharedDocuments

  // 검색 필터링
  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container" style={{ padding: '20px', paddingTop: '20px' }}>
      {/* 탭 선택 */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
        <div className="tabs" style={{
          display: 'inline-flex',
          gap: '4px',
          padding: '4px',
          background: '#F3F4F6',
          borderRadius: '12px'
        }}>
          <button
            className={`tab ${activeTab === 'mine' ? 'active' : ''}`}
            onClick={() => setActiveTab('mine')}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'mine' ? 'white' : 'transparent',
              color: activeTab === 'mine' ? 'var(--brand)' : 'var(--muted)',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            내 문서함
          </button>
          <button
            className={`tab ${activeTab === 'shared' ? 'active' : ''}`}
            onClick={() => setActiveTab('shared')}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'shared' ? 'white' : 'transparent',
              color: activeTab === 'shared' ? 'var(--brand)' : 'var(--muted)',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            공유 문서함
          </button>
        </div>
      </div>

      {/* 검색 */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ position: 'relative' }}>
          <Search 
            size={20} 
            style={{ 
              position: 'absolute', 
              left: '14px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: 'var(--muted)'
            }} 
          />
          <input
            type="text"
            placeholder="문서 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input"
            style={{ 
              width: '100%',
              paddingLeft: '44px'
            }}
          />
        </div>
      </div>

      {/* 문서 카테고리 (칩) */}
      <div className="chips" style={{ marginBottom: '16px' }}>
        <button className="chip chip--t1">전체</button>
        <button className="chip">계약서</button>
        <button className="chip">자격증</button>
        <button className="chip">도면</button>
        <button className="chip">PTW</button>
        <button className="chip">안전교육</button>
      </div>

      {/* 문서 목록 */}
      <div className="stack" style={{ gap: '12px' }}>
        {filteredDocuments.map(doc => (
          <div key={doc.id} className="card">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FileText size={20} color="#3B82F6" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: 600, 
                    fontSize: '15px',
                    marginBottom: '4px'
                  }}>
                    {doc.title}
                  </div>
                  <div className="t-cap">
                    {doc.date} · {doc.size}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn btn--ghost"
                  style={{ 
                    padding: '8px',
                    minHeight: 'unset',
                    height: 'auto'
                  }}
                  title="미리보기"
                >
                  <Eye size={18} />
                </button>
                <button 
                  className="btn btn--ghost"
                  style={{ 
                    padding: '8px',
                    minHeight: 'unset',
                    height: 'auto'
                  }}
                  title="다운로드"
                >
                  <Download size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* 추가 버튼 */}
        <div 
          className="card"
          style={{
            border: '2px dashed var(--line)',
            background: 'transparent',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onClick={() => console.log('Add document')}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            color: 'var(--muted)'
          }}>
            <div style={{ 
              fontSize: '32px', 
              lineHeight: 1,
              marginBottom: '8px'
            }}>
              +
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>
              문서 추가하기
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}