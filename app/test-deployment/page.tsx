export default function TestDeploymentPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Deployment Test Page</h1>
      <p>If you can see this, the deployment is working.</p>
      <p>Current time: {new Date().toISOString()}</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h2>Environment Check:</h2>
        <p>NODE_ENV: {process.env.NODE_ENV}</p>
        <p>Has NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'YES' : 'NO'}</p>
        <p>Has NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'YES' : 'NO'}</p>
      </div>
      <div style={{ marginTop: '20px' }}>
        <a href="/auth/login" style={{ color: 'blue', textDecoration: 'underline' }}>
          Go to Login Page
        </a>
      </div>
    </div>
  )
}