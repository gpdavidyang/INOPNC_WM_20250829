'use client'

export default function StaticLoginPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
        padding: '0 16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: 0,
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '32px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '24px',
            }}
          >
            로그인 (정적 페이지)
          </h1>

          <form>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                이메일
              </label>
              <input
                type="email"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '16px',
                }}
                placeholder="email@example.com"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                비밀번호
              </label>
              <input
                type="password"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '16px',
                }}
                placeholder="비밀번호를 입력하세요"
              />
            </div>

            <button
              type="button"
              onClick={() => alert('This is a static test page. Login functionality is disabled.')}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '4px',
                border: 'none',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              로그인 (테스트)
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
            <p style={{ color: '#ef4444', marginBottom: '10px' }}>
              이것은 정적 테스트 페이지입니다.
            </p>
            <a href="/test-deployment" style={{ color: '#3b82f6' }}>
              배포 테스트 페이지로 이동
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
